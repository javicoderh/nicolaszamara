"""One bounded, durable generation tick. Never imported by local persistence."""
import os
from concurrent.futures import ThreadPoolExecutor
from backend.chat_store import rpc
from backend.blog_contract import brief, generated_article, InvalidBlog, editorial_critique
from backend.blog_provider import OpenAIArticleProvider, ProviderUnavailable, extract_output
from backend.blog_config import api_key
from backend.blog_costs import usage_record
from backend.blog_sources import read_source


def worker_tick(call=rpc, provider=None):
    if call is rpc:
        call = lambda name, arguments: rpc(name, arguments, max_response_bytes=2 * 1024 * 1024)
    if os.environ.get('BLOG_GENERATION_ENABLED') != 'true': return {'status': 'disabled'}
    if not api_key(): return {'status': 'not_configured'}
    provider = provider or OpenAIArticleProvider()
    result = call('blog_worker_tick', {'p_operation': 'acquire', 'p_values': {}})
    if result.get('status') != 'ready': return result
    job = result['job']
    identity = {'id': job['id'], 'worker_token': job['worker_token']}
    def report(result, outcome, **details):
        # Report progress only after its checkpoint was accepted by storage.
        if result.get('status') != 'ready': return result
        return {**result, 'job_id': job['id'], 'stage': job.get('stage'), 'outcome': outcome, **details}
    try:
        if job.get('provider_response_id'):
            response = provider.poll(job['provider_response_id'])
        else:
            # Reserve before starting, marking uncertain submissions as non-retryable.
            reserved = call('blog_worker_tick', {'p_operation': 'reserve', 'p_values': {
                **identity, 'daily_limit': int(os.environ.get('BLOG_DAILY_BUDGET_MICRO_USD', '0')),
                'job_limit': int(os.environ.get('BLOG_JOB_BUDGET_MICRO_USD', '0'))}})
            if reserved.get('status') != 'ready': return reserved
            response = provider.start(job)
        if not response.get('id'): raise ProviderUnavailable('missing_response_id')
        if response.get('status') in ('queued', 'in_progress'):
            saved = call('blog_worker_tick', {'p_operation': 'pending', 'p_values': {**identity, 'response_id': response['id']}})
            return report(saved, 'waiting_for_provider', provider_status=response['status'])
        if response.get('status') != 'completed': raise ProviderUnavailable('provider_failed')
        output = extract_output(response)
        if not isinstance(output, dict): raise InvalidBlog('invalid_artifact')
        if job['stage'] == 'brief':
            if output.get('clarification'):
                from backend.blog_contract import text
                question = text(output['clarification'], 2000)
                saved = call('blog_worker_tick', {'p_operation': 'clarify', 'p_values': {
                    **identity, 'question': question, 'response_id': response['id'],
                    'usage': usage_record(response)}})
                return report(saved, 'needs_input')
            output = brief(output)
            cited = {annotation.get('url') for item in response.get('output', []) if item.get('type') == 'message'
                for part in item.get('content', []) for annotation in part.get('annotations', [])
                if annotation.get('type') == 'url_citation'}
            cited.update(source.get('url') for item in response.get('output', []) if item.get('type') == 'web_search_call'
                for source in item.get('action', {}).get('sources', []))
            if not set(output['sources']).issubset(cited):
                raise InvalidBlog('sources_missing_provider_evidence')
            with ThreadPoolExecutor(max_workers=3) as readers:
                output['sourceSnapshots'] = list(readers.map(read_source, output['sources']))
        elif job['stage'] == 'final':
            with ThreadPoolExecutor(max_workers=3) as readers:
                list(readers.map(read_source, job['brief']['sources']))
            output = generated_article(output, job['brief'])
        elif job['stage']=='critique': output=editorial_critique(output)
        elif not isinstance(output, dict) or not isinstance(output.get('text'),str) or not output['text'].strip(): raise InvalidBlog('invalid_artifact')
        saved = call('blog_worker_tick', {'p_operation': 'advance', 'p_values': {**identity, 'output': output,
            'usage': usage_record(response), 'response_id': response['id']}})
        return report(saved, 'completed' if job['stage'] == 'final' else 'stage_completed')
    except (InvalidBlog, ProviderUnavailable, ValueError, OSError, TypeError, AttributeError) as error:
        code = str(error)[:100] if isinstance(error, (InvalidBlog, ProviderUnavailable)) else (
            'invalid_provider_payload' if isinstance(error, (TypeError, AttributeError)) else 'source_or_provider_unavailable')
        failed = call('blog_worker_tick', {'p_operation': 'fail', 'p_values': {**identity, 'error': code,
          'usage': usage_record(response) if 'response' in locals() else None, 'response_id': response.get('id') if 'response' in locals() else None}})
        return report(failed, 'failed', error=code)
