"""Turn normalized M11 records into anonymous daily aggregates for reconciliation."""
from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo
from backend.marketing_report_contract import report_period, CASH_VALUES, CASH_KEYS, REPORT_TIMEZONE
from backend.marketing_ledger import InvalidMarketingData


def aggregate_movements(movements, start, end):
    _, _, lower, upper = report_period(start, end)
    grouped = defaultdict(lambda: dict.fromkeys(CASH_VALUES, 0))
    seen_events, sales, transactions = {}, {}, {}
    columns = {'sale': 'sales_minor', 'refund': 'refunds_minor', 'chargeback': 'chargebacks_minor', 'fee': 'fees_minor', 'tax': 'taxes_minor'}
    for row in movements:
        event_key = (row['provider'], row['external_event_id'])
        if event_key in seen_events:
            if seen_events[event_key] != row: raise InvalidMarketingData('conflicting_report_event')
            continue
        seen_events[event_key] = row
        tx_key = (row['provider'], row['external_transaction_id'])
        tx = tuple(row[key] for key in ('service', 'currency', 'campaign_id', 'attribution_method', 'product_id', 'attribution_reference'))
        if tx_key in transactions and transactions[tx_key] != tx: raise InvalidMarketingData('conflicting_report_transaction')
        transactions[tx_key] = tx
        if row['event_type'] == 'sale':
            if tx_key in sales:
                if sales[tx_key] != row['amount_minor']: raise InvalidMarketingData('conflicting_report_sale')
                continue
            sales[tx_key] = row['amount_minor']
        instant = datetime.fromisoformat(row['occurred_at'].replace('Z', '+00:00'))
        if not lower <= instant < upper: continue
        key = (instant.astimezone(ZoneInfo(REPORT_TIMEZONE)).date().isoformat(), *(row[field] for field in CASH_KEYS[1:]))
        group = grouped[key]
        group[columns[row['event_type']]] += row['amount_minor']
        if row['event_type'] == 'sale': group['sales_count'] += 1
    return [{**dict(zip(CASH_KEYS, key)), **value} for key, value in sorted(grouped.items(), key=lambda item: str(item[0]))]
