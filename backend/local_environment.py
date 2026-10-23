"""Load only supported server settings for the local development server."""
import os
from pathlib import Path

SERVER_KEYS = {'OPENAI_API_KEY', 'OPENAI_MODEL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY',
               'CHAT_COOKIE_SECRET', 'CHAT_INPUT_USD_PER_MILLION', 'CHAT_OUTPUT_USD_PER_MILLION',
               'CHAT_DAILY_BUDGET_MICRO_USD', 'APP_ENV', 'OPENAI_REASONING_EFFORT', 'OPENAI_MAX_OUTPUT_TOKENS',
               'OPENAI_REQUEST_TIMEOUT_SECONDS', 'CHAT_TEST_METRICS'}


def load_local_environment(root=None):
    root = Path(root) if root is not None else Path(__file__).resolve().parents[1]
    for filename in ('.env.local', '.env'):
        path = root / filename
        if not path.is_file():
            continue
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            key, separator, value = line.strip().partition('=')
            if separator and key in SERVER_KEYS:
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                if value:
                    os.environ.setdefault(key, value)
