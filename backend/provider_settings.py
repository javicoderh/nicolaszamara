"""Server-only provider settings; no browser request may override these."""
import os


def output_token_limit():
    value = int(os.environ.get('OPENAI_MAX_OUTPUT_TOKENS', '512'))
    if not 64 <= value <= 25000:
        raise ValueError('Invalid output token limit')
    return value


def request_timeout():
    value = int(os.environ.get('OPENAI_REQUEST_TIMEOUT_SECONDS', '15'))
    if not 5 <= value <= 25:
        raise ValueError('Invalid provider timeout')
    return value


def reasoning_effort():
    value = os.environ.get('OPENAI_REASONING_EFFORT', '').strip()
    if value and value not in ('none', 'low', 'medium', 'high', 'xhigh', 'max'):
        raise ValueError('Invalid reasoning effort')
    return value
