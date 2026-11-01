"""Run: python -m scripts.import_marketing_data FILE --kind movements --dry-run."""
import argparse
import json
from pathlib import Path
from backend.local_environment import load_local_environment
from backend.marketing_imports import parse_marketing_csv, apply_marketing_batch, MAX_BYTES
from backend.marketing_ledger import InvalidMarketingData
from backend.marketing_store import MarketingStore
from backend.chat_store import StoreUnavailable


def main(argv=None):
    parser = argparse.ArgumentParser(description='Validate marketing CSV without exposing its raw values.')
    parser.add_argument('file', type=Path)
    parser.add_argument('--kind', choices=['movements', 'spend'], default='movements')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--apply', action='store_true')
    args = parser.parse_args(argv)
    try:
        with args.file.open('rb') as source:
            batch = parse_marketing_csv(source.read(MAX_BYTES + 1), args.kind)
        summary = {'mode': 'apply' if args.apply else 'dry-run', 'valid': batch['valid'],
                   'accepted_rows': len(batch['rows']), 'errors': batch['errors'], 'file_digest': batch['file_digest']}
        if args.apply and batch['valid']:
            load_local_environment()
            summary['result'] = apply_marketing_batch(batch, MarketingStore())
        print(json.dumps(summary))
        return 0 if batch['valid'] else 1
    except (InvalidMarketingData, StoreUnavailable, OSError):
        print(json.dumps({'valid': False, 'error': 'invalid_file_or_storage_unavailable'}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
