"""Server-only editorial configuration, shared by admission and the worker."""
import os


def api_key():
    # An optional dedicated credential can override the chatbot's shared key.
    return os.environ.get('BLOG_OPENAI_API_KEY', '').strip() or os.environ.get('OPENAI_API_KEY', '').strip()


def generation_ready():
    return os.environ.get('BLOG_GENERATION_ENABLED') == 'true' and bool(api_key())
