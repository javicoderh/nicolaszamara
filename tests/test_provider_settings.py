import json
import os
import unittest
from unittest.mock import patch

from backend.chatbot import (OpenAIUnavailable, choose_response, encode_provider_payload,
                             process_chat, public_result, trusted_context)
from backend.chat_store import budget_limits
from backend.provider_settings import output_token_limit, reasoning_effort, request_timeout


class ProviderSettingsTests(unittest.TestCase):
    @patch.dict(os.environ, {}, clear=True)
    def test_defaults_allow_short_conversational_replies(self):
        self.assertEqual(output_token_limit(), 512)
        self.assertEqual(request_timeout(), 15)
        self.assertEqual(reasoning_effort(), '')
        body = json.loads(encode_provider_payload([{'role': 'user', 'content': 'Curso'}], trusted_context({})))
        self.assertNotIn('reasoning', body)
        self.assertNotIn('testing_configuration', public_result({'status': 'ready'}))

    def test_low_and_high_are_explicit_server_settings(self):
        for effort in ('low', 'high'):
            with patch.dict(os.environ, {'OPENAI_MODEL': 'gpt-6-luna', 'OPENAI_REASONING_EFFORT': effort,
                                        'OPENAI_MAX_OUTPUT_TOKENS': '25000', 'OPENAI_REQUEST_TIMEOUT_SECONDS': '25'}):
                body = json.loads(encode_provider_payload([{'role': 'user', 'content': 'Curso'}], trusted_context({})))
                self.assertEqual(body['reasoning'], {'effort': effort})
                self.assertEqual(body['model'], 'gpt-6-luna')
                self.assertEqual(body['max_output_tokens'], 25000)
                self.assertEqual(request_timeout(), 25)

    def test_invalid_limits_fail_closed(self):
        for key, value, function in (('OPENAI_MAX_OUTPUT_TOKENS', '25001', output_token_limit),
                                     ('OPENAI_REQUEST_TIMEOUT_SECONDS', '26', request_timeout),
                                     ('OPENAI_REASONING_EFFORT', 'invented', reasoning_effort)):
            with patch.dict(os.environ, {key: value}), self.assertRaises(ValueError): function()

    @patch.dict(os.environ, {'CHAT_INPUT_USD_PER_MILLION': '0.10', 'CHAT_OUTPUT_USD_PER_MILLION': '0.50',
                            'CHAT_DAILY_BUDGET_MICRO_USD': '3000000', 'OPENAI_MAX_OUTPUT_TOKENS': '25000'})
    def test_reasoning_allowance_is_included_in_the_reserved_budget(self):
        self.assertEqual(budget_limits()['reservation_micro_usd'], 19259)

    @patch.dict(os.environ, {'OPENAI_API_KEY': 'unit-key'})
    @patch('backend.chatbot.urlopen')
    def test_usage_preserves_cache_and_reasoning_even_if_the_response_is_incomplete(self, open_url):
        response = open_url.return_value.__enter__.return_value
        response.status = 200
        response.read.return_value = json.dumps({'id': 'unit-response', 'model': 'gpt-6-luna', 'status': 'incomplete',
            'incomplete_details': {'reason': 'max_output_tokens'}, 'usage': {'input_tokens': 4000, 'output_tokens': 256,
            'total_tokens': 4256, 'input_tokens_details': {'cached_tokens': 2048},
            'output_tokens_details': {'reasoning_tokens': 256}}}).encode()
        with self.assertRaises(OpenAIUnavailable) as raised:
            choose_response([{'role': 'user', 'content': 'Curso'}], trusted_context({}))
        self.assertEqual(raised.exception.usage['input_tokens_details']['cached_tokens'], 2048)
        self.assertEqual(raised.exception.usage['output_tokens_details']['reasoning_tokens'], 256)
        self.assertEqual(raised.exception.usage['incomplete_reason'], 'max_output_tokens')


if __name__ == '__main__':
    unittest.main()
