"""Remote-only provider adapter. Background calls allow durable stage polling."""
import json
import os
import re
from datetime import datetime,timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode
from pathlib import Path
from backend.blog_contract import PROTOCOL
from backend.blog_config import api_key
from backend.chat_store import rpc


class ProviderUnavailable(Exception): pass


class OpenAIArticleProvider:
    def request(self, method, path='', payload=None):
        key = api_key()
        if not key: raise ProviderUnavailable('not_configured')
        req = Request('https://api.openai.com/v1/responses' + path, method=method,
            data=json.dumps(payload, ensure_ascii=False).encode() if payload else None,
            headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        try:
            with urlopen(req, timeout=20) as response:
                content = response.read(1024 * 1024 + 1)
                if len(content) > 1024 * 1024: raise ValueError()
                return json.loads(content)
        except HTTPError as error:
            # Never persist provider error messages, prompts or credentials.
            raise ProviderUnavailable('provider_http_' + str(error.code)) from None
        except OSError: raise ProviderUnavailable('provider_uncertain') from None
        except ValueError: raise ProviderUnavailable('provider_invalid_response') from None

    def start(self, job):
        instructions = (Path(__file__).resolve().parents[1] / 'config/blog/editorial.md').read_text(encoding='utf-8')
        stage = job['stage']
        contract = PROTOCOL
        if stage == 'brief':
            catalog=rpc('blog_catalog',{})
            if catalog.get('items'): contract={**PROTOCOL,'categories':{item['id']:item['name'] for item in catalog['items']}}
        data = {key: job.get(key) for key in ('idea', 'brief', 'artifacts')}
        encoded = json.dumps(data, ensure_ascii=False)
        if len(encoded.encode()) > 200000: raise ProviderUnavailable('editorial_context_limit')
        payload = {'model': os.environ.get('BLOG_MODEL', 'gpt-6.1-sol'), 'background': True, 'store': True, 'service_tier':'default',
            'instructions': instructions + '\nFecha de consulta UTC: '+datetime.now(timezone.utc).isoformat()+'\nEtapa actual: ' + stage + '\nContrato: ' + json.dumps(contract, ensure_ascii=False),
            'input': encoded, 'max_output_tokens': 8000,
            'reasoning': {'effort': 'medium'}}
        if stage == 'brief':
            payload['tools'] = [{'type': 'web_search'}]
            payload['max_tool_calls'] = 4
            payload['include'] = ['web_search_call.action.sources']
        else:
            payload['text'] = {'format': {'type': 'json_object'}}
            # JSON mode requires the instruction in input, not only instructions.
            payload['input'] = 'Devuelve un objeto JSON para la etapa solicitada.\n' + encoded
        return self.request('POST', payload=payload)

    def poll(self, response_id):
        if not re.fullmatch(r'resp_[a-zA-Z0-9_-]+', response_id): raise ProviderUnavailable('invalid_response_id')
        # Background results need the same research evidence requested at create.
        query = urlencode({'include[]': 'web_search_call.action.sources'})
        return self.request('GET', '/' + response_id + '?' + query)


def extract_output(response):
    content = ''.join(part.get('text', '') for item in response.get('output', []) if item.get('type') == 'message'
        for part in item.get('content', []) if part.get('type') == 'output_text').strip()
    try:
        if content.startswith('```'): content = re.sub(r'^```(?:json)?\s*|\s*```$', '', content)
        return json.loads(content)
    except (ValueError, TypeError): raise ProviderUnavailable('invalid_output') from None
