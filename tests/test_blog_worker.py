import os
import unittest
from unittest.mock import Mock, patch
from backend.blog_worker import worker_tick


class WorkerTests(unittest.TestCase):
    def test_clarification_records_provider_identity_and_usage(self):
        job = {'id': 'job', 'worker_token': 'token', 'stage': 'brief'}
        call = Mock(side_effect=[{'status': 'ready', 'job': job}, {'status': 'ready'}, {'status': 'ready'}])
        provider = Mock()
        provider.start.return_value = {'id': 'resp_question', 'status': 'completed',
            'model': 'gpt-6.1-sol', 'usage': {'input_tokens': 100, 'output_tokens': 20},
            'output': [{'type': 'message', 'content': [{'type': 'output_text',
                'text': '{"clarification":"¿Qué audiencia prefieres?"}'}]}]}
        with patch.dict(os.environ, {'BLOG_GENERATION_ENABLED': 'true', 'BLOG_OPENAI_API_KEY': 'test'}):
            result = worker_tick(call, provider)
        self.assertEqual(result['outcome'], 'needs_input')
        values = call.call_args.args[1]['p_values']
        self.assertEqual(values['response_id'], 'resp_question')
        self.assertEqual(values['usage']['input_tokens'], 100)
        self.assertEqual(values['question'], '¿Qué audiencia prefieres?')

    def test_disabled_worker_never_calls_provider_or_storage(self):
        call, provider = Mock(), Mock()
        with patch.dict(os.environ, {}, clear=True): self.assertEqual(worker_tick(call, provider)['status'], 'disabled')
        call.assert_not_called(); provider.start.assert_not_called()

    def test_queued_response_is_persisted_without_poll_loop(self):
        job = {'id': 'job', 'worker_token': 'token', 'stage': 'brief'}
        call = Mock(side_effect=[{'status': 'ready', 'job': job}, {'status': 'ready'}, {'status': 'ready'}])
        provider = Mock(); provider.start.return_value = {'id': 'resp_1', 'status': 'queued'}
        with patch.dict(os.environ, {'BLOG_GENERATION_ENABLED': 'true', 'BLOG_OPENAI_API_KEY': 'test'}): worker_tick(call, provider)
        provider.start.assert_called_once(); provider.poll.assert_not_called()
        self.assertEqual(call.call_args.args[1]['p_operation'], 'pending')

    def test_poll_does_not_submit_or_reserve_again(self):
        job = {'id': 'job', 'worker_token': 'token', 'stage': 'draft', 'provider_response_id': 'resp_1'}
        call = Mock(side_effect=[{'status': 'ready', 'job': job}, {'status': 'ready'}])
        provider = Mock(); provider.poll.return_value = {'id': 'resp_1', 'status': 'in_progress'}
        with patch.dict(os.environ, {'BLOG_GENERATION_ENABLED': 'true', 'BLOG_OPENAI_API_KEY': 'test'}): worker_tick(call, provider)
        provider.start.assert_not_called(); provider.poll.assert_called_once_with('resp_1')

    def test_budget_denial_precedes_billable_call(self):
        call = Mock(side_effect=[{'status': 'ready', 'job': {'id': 'j', 'worker_token': 't'}}, {'status': 'budget_exhausted'}])
        provider = Mock()
        with patch.dict(os.environ, {'BLOG_GENERATION_ENABLED': 'true', 'BLOG_OPENAI_API_KEY': 'test'}): self.assertEqual(worker_tick(call, provider)['status'], 'budget_exhausted')
        provider.start.assert_not_called()

class MalformedBriefTests(unittest.TestCase):
    def test_list_decisions_fail_the_job_without_closing_worker_or_resubmitting(self):
        data = {'objective':'educar_audiencia','target':'publico_general','category':'naturaleza',
                'topic':'Un paseo por el bosque','angle':'Observar con calma','audienceDescription':'Adultos',
                'focusKeyword':'paseo bosque','keyPoints':['Observar el entorno','Caminar con calma','Escuchar los sonidos'],
                'sources':['https://example.com/a','https://example.com/b'], 'editorialDecisions':[]}
        data['sourceDetails']=[{'url':source,'title':'Referencia','contribution':'Contexto del tema',
            'accessedAt':'2026-11-04T00:00:00Z'} for source in data['sources']]
        import json
        from backend.blog_contract import brief, InvalidBlog
        for decisions in ([], None, 'texto'):
            with self.assertRaisesRegex(InvalidBlog, 'invalid_editorial_decisions'):
                brief({**data,'editorialDecisions':decisions})
        self.assertEqual(brief({**data,'editorialDecisions':{'target':'Adultos'}})['editorialDecisions']['target'],'Adultos')
        job={'id':'job','worker_token':'token','stage':'brief','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider=Mock()
        provider.poll.return_value={'id':'resp_existing','status':'completed','output':[{
            'type':'message','content':[{'type':'output_text','text':json.dumps(data)}]}]}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}):
            result=worker_tick(call,provider)
        self.assertEqual(result['error'],'invalid_editorial_decisions')
        self.assertEqual(result['outcome'],'failed')
        self.assertEqual(call.call_args.args[1]['p_operation'],'fail')
        provider.start.assert_not_called()

    def test_array_output_becomes_a_controlled_job_failure(self):
        job={'id':'job','worker_token':'token','stage':'brief','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider=Mock()
        provider.poll.return_value={'id':'resp_existing','status':'completed','output':[{
            'type':'message','content':[{'type':'output_text','text':'[]'}]}]}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}):
            self.assertEqual(worker_tick(call,provider)['error'],'invalid_artifact')
        provider.start.assert_not_called()


class ProgressTests(unittest.TestCase):
    def test_brief_excludes_blocked_source_and_preserves_warning(self):
        import json
        from tests.test_blog_brief_fields import sample_brief
        from backend.blog_contract import InvalidBlog
        output = sample_brief()
        blocked = 'https://pubmed.ncbi.nlm.nih.gov/123456/'
        output['sources'].append(blocked)
        output['sourceDetails'].append({**output['sourceDetails'][0], 'url': blocked})
        job = {'id':'job','worker_token':'token','stage':'brief','provider_response_id':'resp_existing'}
        call = Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider = Mock()
        provider.poll.return_value = {'id':'resp_existing','status':'completed','output':[{
            'type':'message','content':[{'type':'output_text','text':json.dumps(output),
            'annotations':[{'type':'url_citation','url':source} for source in output['sources']]}]}]}
        def read(source):
            if source == blocked:
                raise InvalidBlog('source_unreadable')
            return {'url':source,'accessible':True,'excerpt':'Verified evidence. ' * 20}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}), patch('backend.blog_worker.read_source',side_effect=read):
            result = worker_tick(call,provider)
        self.assertEqual(result['outcome'],'stage_completed')
        saved = call.call_args.args[1]['p_values']['output']
        self.assertNotIn(blocked,saved['sources'])
        self.assertNotIn(blocked,[item['url'] for item in saved['sourceDetails']])
        self.assertEqual(saved['sourceReadWarnings'][0]['action'],'excluded')
        self.assertIn(blocked,saved['editorialWarnings'][-1])
        provider.start.assert_not_called()

    def test_saved_brief_with_invalid_reel_advances_without_starting_new_inference(self):
        import json
        from tests.test_blog_brief_fields import sample_brief
        output=sample_brief();output['reels']=['https://instagram.com/reel/invalid link']
        job={'id':'job','worker_token':'token','stage':'brief','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider=Mock();provider.poll.return_value={'id':'resp_existing','status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':json.dumps(output),'annotations':[{'type':'url_citation','url':source} for source in output['sources']]}]}]}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}),patch('backend.blog_worker.read_source',side_effect=lambda source: {'url':source,'accessible':True}):
            result=worker_tick(call,provider)
        self.assertEqual(result['outcome'],'stage_completed')
        payload=call.call_args.args[1]
        self.assertEqual(payload['p_operation'],'advance')
        self.assertEqual(payload['p_values']['output']['reels'],[])
        self.assertTrue(payload['p_values']['output']['editorialWarnings'])
        provider.start.assert_not_called()

    def test_invalid_url_is_checkpointed_with_field_without_resubmitting_generation(self):
        import json
        from tests.test_blog_brief_fields import sample_brief
        output=sample_brief();output['sources'][0]='http://example.org/paper'
        job={'id':'job','worker_token':'token','stage':'brief','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider=Mock();provider.poll.return_value={'id':'resp_existing','status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':json.dumps(output)}]}]}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}):
            result=worker_tick(call,provider)
        self.assertEqual(result['error'],'invalid_url:sources[0]:https_required')
        self.assertEqual(call.call_args.args[1]['p_values']['error'],result['error'])
        provider.start.assert_not_called()

    def test_waiting_reports_current_stage_without_new_submission(self):
        job={'id':'job','worker_token':'secret-token','stage':'draft','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'ready'}])
        provider=Mock();provider.poll.return_value={'id':'resp_existing','status':'in_progress'}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}):
            result=worker_tick(call,provider)
        self.assertEqual(result,{'status':'ready','job_id':'job','stage':'draft','outcome':'waiting_for_provider','provider_status':'in_progress'})
        provider.start.assert_not_called()

    def test_checkpoint_conflict_is_not_reported_as_progress(self):
        job={'id':'job','worker_token':'token','stage':'draft','provider_response_id':'resp_existing'}
        call=Mock(side_effect=[{'status':'ready','job':job},{'status':'conflict'}])
        provider=Mock();provider.poll.return_value={'id':'resp_existing','status':'queued'}
        with patch.dict(os.environ,{'BLOG_GENERATION_ENABLED':'true','OPENAI_API_KEY':'test'}):
            self.assertEqual(worker_tick(call,provider),{'status':'conflict'})
