"""Configure an already-deployed worker; secret is read from server environment."""
import argparse
import json
import os
from backend.local_environment import load_local_environment
from backend.chat_store import rpc, StoreUnavailable


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('endpoint', help='https://your-domain/api/blog_worker')
    args = parser.parse_args(argv)
    load_local_environment()
    secret = os.environ.get('BLOG_WORKER_SECRET', '')
    if len(secret) < 32:
        print(json.dumps({'status': 'worker_secret_required'})); return 1
    try:
        result = rpc('blog_configure_worker', {'p_endpoint': args.endpoint, 'p_secret': secret})
        print(json.dumps(result)); return 0 if result.get('status') == 'ready' else 1
    except StoreUnavailable:
        print(json.dumps({'status': 'unavailable'})); return 1


if __name__ == '__main__': raise SystemExit(main())
