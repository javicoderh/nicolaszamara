"""Run the API engine during local development; checkpoints remain in Supabase."""
import argparse
import json
from threading import Event
from backend.local_environment import load_local_environment
from backend.blog_config import generation_ready
from backend.blog_worker import worker_tick
from backend.chat_store import StoreUnavailable


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--once',action='store_true')
    args=parser.parse_args(argv)
    load_local_environment()
    if not generation_ready():
        print(json.dumps({'status':'generation_not_configured'})); return 1
    stop=Event()
    previous_status=None
    try:
        while not stop.is_set():
            try: result=worker_tick()
            except StoreUnavailable as error:
                result={'status':'storage_unavailable','error':str(error) or 'rpc_unavailable'}
            status_key=(result.get('status'),result.get('error'))
            if status_key!=previous_status or result.get('status') not in ('empty','busy','storage_unavailable'):
                print(json.dumps(result),flush=True)
            previous_status=status_key
            if args.once: return 0 if result.get('status') in ('ready','empty','busy') else 1
            stop.wait(3)
    except KeyboardInterrupt: return 0


if __name__=='__main__': raise SystemExit(main())
