import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('setter_accounting', ROOT / 'chatbot testing/scripts/pipeline_common.py')
accounting = importlib.util.module_from_spec(spec)
spec.loader.exec_module(accounting)
SOURCES = json.loads((ROOT / 'chatbot testing/evidence/sources.json').read_text(encoding='utf-8'))


class TokenAccountingTests(unittest.TestCase):
    def test_utf8_transport_preserves_accents_for_the_next_round(self):
        reply = 'Aquí tienes información en la página de cursos. ¿Qué prefieres?'
        payload = (json.dumps({'status': 'completed', 'result': {'reply': reply}}, ensure_ascii=False) + 'HTTP_CODE:200').encode('utf-8')
        parsed = accounting.parse_http_output(payload)
        self.assertEqual(parsed['body']['result']['reply'], reply)
        self.assertEqual(parsed['http_status'], 200)
        next_request = json.dumps({'messages': [{'role': 'assistant', 'content': parsed['body']['result']['reply']}]}, ensure_ascii=False).encode('utf-8')
        self.assertEqual(json.loads(next_request)['messages'][0]['content'], reply)

    def test_cache_writes_use_their_own_tariff(self):
        usage = {'input_tokens': 2591, 'output_tokens': 32, 'total_tokens': 2623,
                 'input_tokens_details': {'cache_write_tokens': 2588, 'cached_tokens': 0},
                 'output_tokens_details': {'reasoning_tokens': 0}, 'service_tier': 'default'}
        self.assertEqual(accounting.calculate_cost(usage, SOURCES), {'usd': '0.0003398', 'clp': '0.335239884'})

    def test_reasoning_is_already_in_output_and_is_not_added_twice(self):
        usage = {'input_tokens': 10, 'output_tokens': 5, 'total_tokens': 15,
                 'input_tokens_details': {'cached_tokens': 10}, 'output_tokens_details': {'reasoning_tokens': 5}}
        self.assertEqual(accounting.calculate_cost(usage, SOURCES)['usd'], '0.0000026')

    def test_unmeasured_or_unpriced_service_does_not_become_zero_cost(self):
        self.assertIsNone(accounting.calculate_cost({}, SOURCES))
        usage = {'input_tokens': 10, 'output_tokens': 5, 'total_tokens': 15, 'input_tokens_details': {'cached_tokens': 0}, 'service_tier': 'unknown'}
        self.assertIsNone(accounting.calculate_cost(usage, SOURCES))


if __name__ == '__main__':
    unittest.main()
