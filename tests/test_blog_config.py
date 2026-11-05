import os
import unittest
from unittest.mock import Mock, patch
from backend.blog_config import api_key, generation_ready
from backend.blog_provider import OpenAIArticleProvider
from backend.blog_worker import worker_tick


class SharedCredentialTests(unittest.TestCase):
    def test_json_stages_include_explicit_instruction_in_input(self):
        import json
        provider = OpenAIArticleProvider()
        for stage in ('draft', 'critique', 'final'):
            with patch.object(provider, 'request', return_value={'id':'resp_saved'}) as request:
                provider.start({'stage':stage, 'idea':'Tema', 'brief':{}, 'artifacts':{}})
            payload = request.call_args.kwargs['payload']
            instruction, context = payload['input'].split('\n', 1)
            self.assertIn('json', instruction.lower())
            self.assertEqual(json.loads(context)['idea'], 'Tema')
            self.assertEqual(payload['text']['format']['type'], 'json_object')

    def test_provider_distinguishes_http_rejection_from_uncertain_submission(self):
        from urllib.error import HTTPError
        from backend.blog_provider import ProviderUnavailable
        for error, expected in ((HTTPError('https://api.openai.com',400,'private',{},None), 'provider_http_400'),
                                (TimeoutError('private'), 'provider_uncertain')):
            with patch.dict(os.environ, {'OPENAI_API_KEY':'test'}), patch('backend.blog_provider.urlopen', side_effect=error):
                with self.assertRaisesRegex(ProviderUnavailable, '^' + expected + '$'):
                    OpenAIArticleProvider().request('POST', payload={'input':'test'})

    def test_background_poll_requests_search_evidence_without_starting_generation(self):
        from urllib.parse import urlsplit, parse_qs
        provider=OpenAIArticleProvider()
        with patch.object(provider,'request',return_value={'status':'in_progress'}) as request:
            provider.poll('resp_saved')
        method,path=request.call_args.args
        self.assertEqual(method,'GET')
        self.assertEqual(urlsplit(path).path,'/resp_saved')
        self.assertEqual(parse_qs(urlsplit(path).query)['include[]'],['web_search_call.action.sources'])

    def test_uses_chatbot_key_without_enabling_generation_implicitly(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ' shared ', 'BLOG_OPENAI_API_KEY': ' '}, clear=True):
            self.assertEqual(api_key(), 'shared')
            self.assertFalse(generation_ready())

    def test_optional_dedicated_key_has_precedence(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'shared', 'BLOG_OPENAI_API_KEY': 'dedicated', 'BLOG_GENERATION_ENABLED': 'true'}, clear=True):
            self.assertEqual(api_key(), 'dedicated')
            self.assertTrue(generation_ready())

    def test_worker_accepts_shared_key_and_never_starts_when_queue_empty(self):
        call, provider = Mock(return_value={'status': 'empty'}), Mock()
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'shared', 'BLOG_GENERATION_ENABLED': 'true'}, clear=True):
            self.assertEqual(worker_tick(call, provider)['status'], 'empty')
        provider.start.assert_not_called()

    def test_provider_sends_shared_key_only_in_authorization_header(self):
        response = Mock(); response.read.return_value = b'{"status":"queued"}'
        context = Mock(); context.__enter__ = Mock(return_value=response); context.__exit__ = Mock(return_value=False)
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'shared'}, clear=True), patch('backend.blog_provider.urlopen', return_value=context) as request:
            OpenAIArticleProvider().request('POST', payload={'input': 'Idea'})
        sent = request.call_args.args[0]
        self.assertEqual(sent.get_header('Authorization'), 'Bearer shared')
        self.assertNotIn(b'shared', sent.data)
