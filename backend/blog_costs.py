"""Versioned planning rates; estimates do not replace reservation ceilings."""
import os
from backend.blog_config import generation_ready

RATES = {'gpt-6.1-sol': {'input': 2, 'cached': .1, 'output': 10, 'search': .01}}
REVIEWED_AT = '2026-11-04'


def generation_info():
    model = os.environ.get('BLOG_MODEL', 'gpt-6.1-sol')
    return {'enabled': generation_ready(), 'model': model, 'estimatedUsd': .3075 if model == 'gpt-6.1-sol' else None,
            'dailyLimitUsd': int(os.environ.get('BLOG_DAILY_BUDGET_MICRO_USD', '0')) / 1_000_000,
            'jobLimitUsd': int(os.environ.get('BLOG_JOB_BUDGET_MICRO_USD', '0')) / 1_000_000,
            'ratesReviewedAt': REVIEWED_AT}


def usage_record(response):
    usage = response.get('usage') or {}
    model = response.get('model', '')
    rate = RATES.get(model)
    tokens_in, tokens_out = usage.get('input_tokens'), usage.get('output_tokens')
    cached = (usage.get('input_tokens_details') or {}).get('cached_tokens', 0)
    reasoning = (usage.get('output_tokens_details') or {}).get('reasoning_tokens', 0)
    searches = sum(item.get('type') == 'web_search_call' for item in response.get('output', []))
    known = bool(rate and all(type(value) is int and value >= 0 for value in (tokens_in, tokens_out, cached, reasoning)) and cached <= tokens_in)
    cost = round((tokens_in - cached) * rate['input'] + cached * rate['cached'] + tokens_out * rate['output'] + searches * rate['search'] * 1_000_000) if known else None
    return {**usage, 'model': model, 'webSearchCalls': searches, 'reasoningTokens': reasoning, 'costMicroUsd': cost, 'ratesReviewedAt': REVIEWED_AT}
