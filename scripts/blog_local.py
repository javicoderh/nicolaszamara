"""python -m scripts.blog_local create|claim|checkpoint|complete|fail FILE.json.

Reads a local JSON artifact, validates it and persists via Supabase. No inference.
"""
import argparse
import json
from pathlib import Path
from backend.blog_local import local_command
from backend.local_environment import load_local_environment
from backend.chat_store import StoreUnavailable


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['create', 'claim', 'checkpoint', 'complete', 'fail'])
    parser.add_argument('input', type=Path)
    args = parser.parse_args(argv)
    try:
        content = args.input.read_bytes()
        if len(content) > 1024 * 1024:
            raise ValueError('input_too_large')
        values = json.loads(content.decode('utf-8-sig'))
        load_local_environment()
        result = local_command(args.operation, values)
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get('status') == 'ready' else 1
    except (ValueError, TypeError, KeyError, OSError, StoreUnavailable):
        print(json.dumps({'status': 'unavailable'}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
