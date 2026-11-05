import unittest
from backend.blog_costs import usage_record


class CostsTests(unittest.TestCase):
    def test_does_not_count_reasoning_twice_and_applies_cached_input_rate(self):
        result = usage_record({'model':'gpt-6.1-sol','usage':{'input_tokens':1000,'output_tokens':500,
            'input_tokens_details':{'cached_tokens':200},'output_tokens_details':{'reasoning_tokens':300}},'output':[{'type':'web_search_call'}]})
        self.assertEqual(result['costMicroUsd'],16620)
        self.assertEqual(result['reasoningTokens'],300)

    def test_unknown_model_or_missing_usage_never_means_zero_cost(self):
        for response in ({'model':'unknown','usage':{'input_tokens':1,'output_tokens':1}}, {'model':'gpt-6.1-sol'}):
            self.assertIsNone(usage_record(response)['costMicroUsd'])
