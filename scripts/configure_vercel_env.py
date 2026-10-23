"""Upload only the setter's managed settings; never print secret values."""
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.chat_identity import secret
from backend.chat_store import budget_limits
from backend.local_environment import load_local_environment

PROJECT = 'prj_9NLR5XePMoPl4dVGO06bZHQ0r5jq'
TEAM = 'team_wpjRCdTWmM7mt6hz8P5oOwtr'
MANAGED_KEYS = ('OPENAI_API_KEY', 'OPENAI_MODEL', 'CHAT_COOKIE_SECRET', 'CHAT_INPUT_USD_PER_MILLION',
                'CHAT_OUTPUT_USD_PER_MILLION', 'CHAT_DAILY_BUDGET_MICRO_USD')


def main():
    load_local_environment(ROOT)
    if any(not os.environ.get(key, '').strip() for key in MANAGED_KEYS):
        print('Missing settings: ' + ', '.join(key for key in MANAGED_KEYS if not os.environ.get(key, '').strip()))
        return 1
    secret()
    budget_limits()
    executable = shutil.which('vercel.cmd') or shutil.which('vercel')
    if not executable:
        print('Vercel CLI is required.')
        return 1
    for key in MANAGED_KEYS:
        value = os.environ[key].strip()
        command = [executable, 'env', 'add', key, 'preview,production', '--sensitive', '--force', '--yes',
                   '--project', PROJECT, '--scope', TEAM]
        # Values go through stdin, not command arguments, temporary files or logs.
        completed = subprocess.run(command, input=value, text=True, capture_output=True, timeout=120, cwd=ROOT)
        if completed.returncode:
            print(f'Failed to configure {key}. Details withheld to avoid printing secrets.')
            return completed.returncode
        print(f'Configured {key}: Preview, Production', flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
