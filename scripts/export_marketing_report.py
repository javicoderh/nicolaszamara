"""Export anonymous marketing aggregates. Offline input never loads credentials."""
import argparse
import json
from pathlib import Path
from backend.local_environment import load_local_environment
from backend.chat_store import StoreUnavailable
from backend.marketing_ledger import InvalidMarketingData
from backend.marketing_metrics import build_report
from backend.marketing_report_export import export_report
from backend.marketing_report_store import MarketingReportStore
from backend.marketing_report_contract import apply_coverage

MAX_INPUT_BYTES = 2 * 1024 * 1024


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--input', type=Path, help='Closed-schema aggregate JSON snapshot; no raw contacts/events')
    source.add_argument('--database', action='store_true', help='Read server-only aggregates, explicitly gated')
    parser.add_argument('--start', help='Inclusive Santiago date, required with --database')
    parser.add_argument('--end', help='Inclusive Santiago date, maximum 366 days')
    parser.add_argument('--output', required=True, type=Path, help='New private directory; never overwrite an existing report')
    parser.add_argument('--coverage', type=Path, help='Optional explicit reconciliation attestation for this exact period')
    args = parser.parse_args(argv)
    if args.database and (not args.start or not args.end): parser.error('--database requires --start and --end')
    if args.input and (args.start or args.end): parser.error('Offline reports use the period declared in the snapshot')
    try:
        if args.output.exists(): raise InvalidMarketingData('report_destination_exists')
        if args.input:
            with args.input.open('rb') as source_file: content = source_file.read(MAX_INPUT_BYTES + 1)
            if len(content) > MAX_INPUT_BYTES: raise InvalidMarketingData('report_input_too_large')
            snapshot = json.loads(content.decode('utf-8-sig'))
        else:
            # Validate dates before accessing any environment or network.
            from backend.marketing_report_contract import report_period
            report_period(args.start, args.end)
            load_local_environment()
            snapshot = MarketingReportStore().snapshot(args.start, args.end)
        if args.coverage:
            with args.coverage.open('rb') as coverage_file: coverage_body = coverage_file.read(MAX_INPUT_BYTES + 1)
            if len(coverage_body) > MAX_INPUT_BYTES: raise InvalidMarketingData('report_input_too_large')
            snapshot = apply_coverage(snapshot, json.loads(coverage_body.decode('utf-8-sig')))
        manifest = export_report(build_report(snapshot), args.output)
        print(json.dumps({'status': 'exported', 'schema_version': 1, 'datasets': {key: value['rows'] for key, value in manifest['datasets'].items()}}))
        return 0
    except (InvalidMarketingData, StoreUnavailable, OSError, ValueError, TypeError, KeyError, OverflowError):
        # Paths, raw source values, tokens and contact information never enter logs.
        print(json.dumps({'status': 'unavailable', 'error': 'invalid_report_or_source_unavailable'}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
