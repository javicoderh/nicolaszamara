"""Explicitly gated, aggregate-only reporting; independent of ledger writes."""
import os
from backend.chat_store import rpc, StoreUnavailable
from backend.marketing_report_contract import report_period


class MarketingReportStore:
    def snapshot(self, start, end):
        report_period(start, end)
        if os.environ.get('MARKETING_REPORTS_ENABLED') != 'true':
            raise StoreUnavailable('marketing_reports_disabled')
        result = rpc('marketing_report_snapshot', {'p_start': start, 'p_end': end}, max_response_bytes=2 * 1024 * 1024)
        if result.get('status') != 'ready' or not isinstance(result.get('snapshot'), dict):
            raise StoreUnavailable('marketing_report_unavailable')
        return result['snapshot']
