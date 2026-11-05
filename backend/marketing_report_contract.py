"""Closed aggregate-only input contract for offline and server reports."""
import copy
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
from backend.marketing_ledger import InvalidMarketingData, campaign_ids, utc_timestamp, SERVICES, PROVIDERS, CURRENCY_DIGITS

REPORT_TIMEZONE = 'America/Santiago'
SOURCES = ('ledger', 'spend', 'interests', 'analytics', 'search')
STATES = ('missing', 'partial', 'complete')
CASH_VALUES = ('sales_count', 'sales_minor', 'refunds_minor', 'chargebacks_minor', 'fees_minor', 'taxes_minor')
CASH_KEYS = ('date', 'provider', 'service', 'currency', 'campaign_id', 'attribution_method')
ANALYTICS_COUNTS = ('sessions', 'eligible_users', 'lead_users', 'lead_sessions', 'observed_leads',
                    'form_starters', 'form_completers', 'send_attempts', 'retries', 'failed_sends',
                    'chat_open_users', 'chat_lead_users')
PUBLIC_PATHS = ('/', '/consulta', '/terapias', '/cursos', '/naturaleza', '/sobre-mi')


def invalid(code='invalid_report_snapshot'):
    raise InvalidMarketingData(code)


def report_period(start, end):
    try:
        first, last = date.fromisoformat(start), date.fromisoformat(end)
        if first.isoformat() != start or last.isoformat() != end or not 0 <= (last - first).days < 366:
            invalid('invalid_report_period')
        zone = ZoneInfo(REPORT_TIMEZONE)
        return first, last, datetime.combine(first, time.min, zone).astimezone(timezone.utc), datetime.combine(last + timedelta(days=1), time.min, zone).astimezone(timezone.utc)
    except (ValueError, TypeError, OverflowError):
        invalid('invalid_report_period')


def fields(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected): invalid()


def count(value, optional=False):
    if optional and value is None: return
    if type(value) is not int or value < 0: invalid()


def validate_snapshot(snapshot, campaigns=None):
    fields(snapshot, ('schema_version', 'period', 'as_of', 'sources', 'cost_components_complete', 'cash', 'spend', 'interests', 'analytics', 'search'))
    if type(snapshot['schema_version']) is not int or snapshot['schema_version'] != 1 or type(snapshot['cost_components_complete']) is not bool: invalid()
    fields(snapshot['period'], ('start', 'end', 'timezone'))
    period = snapshot['period']
    report_period(period['start'], period['end'])
    if period['timezone'] != REPORT_TIMEZONE: invalid()
    as_of = datetime.fromisoformat(utc_timestamp(snapshot['as_of']))
    fields(snapshot['sources'], SOURCES)
    for source in snapshot['sources'].values():
        fields(source, ('state', 'updated_at'))
        if source['state'] not in STATES: invalid()
        if source['updated_at'] is not None and datetime.fromisoformat(utc_timestamp(source['updated_at'])) > as_of: invalid()
    known = campaign_ids() if campaigns is None else campaigns

    for name in ('cash', 'spend', 'interests', 'analytics', 'search'):
        rows = snapshot[name]
        if not isinstance(rows, list) or len(rows) > 10000: invalid()
        source_name = 'ledger' if name == 'cash' else name
        if rows and snapshot['sources'][source_name]['state'] == 'missing': invalid()
        identities = set()
        for row in rows:
            if name == 'cash':
                fields(row, CASH_KEYS + CASH_VALUES)
                if row['provider'] not in PROVIDERS or row['service'] not in SERVICES or row['currency'] not in CURRENCY_DIGITS: invalid()
                if row['attribution_method'] not in ('unknown', 'documented_manual', 'provider_campaign'): invalid()
                if (row['attribution_method'] == 'unknown') != (row['campaign_id'] is None): invalid()
                for key in CASH_VALUES: count(row[key])
                if (row['sales_count'] == 0) != (row['sales_minor'] == 0): invalid()
                identity = tuple(row[key] for key in CASH_KEYS)
            elif name == 'spend':
                fields(row, ('date', 'platform', 'campaign_id', 'currency', 'source_timezone', 'spend_minor'))
                if row['currency'] not in CURRENCY_DIGITS or row['platform'] not in ('google_ads', 'meta_ads', 'other'): invalid()
                try: ZoneInfo(row['source_timezone'])
                except (ValueError, TypeError, KeyError): invalid()
                count(row['spend_minor'])
                identity = (row['date'], row['platform'], row['campaign_id'], row['currency'])
            elif name == 'interests':
                fields(row, ('date', 'service', 'source', 'count'))
                if row['service'] not in SERVICES or row['source'] not in ('form', 'chatbot'): invalid()
                count(row['count'])
                identity = (row['date'], row['service'], row['source'])
            elif name == 'analytics':
                fields(row, ('scope', 'campaign_id', 'form_kind', 'funnel_window_days') + ANALYTICS_COUNTS)
                if row['scope'] not in ('site', 'campaign', 'form'): invalid()
                if (row['scope'] == 'campaign') != (row['campaign_id'] is not None): invalid()
                if (row['scope'] == 'form') != (row['form_kind'] is not None): invalid()
                if row['form_kind'] is not None and row['form_kind'] not in ('consultation', 'nature', 'online', 'chat_contact'): invalid()
                for key in ANALYTICS_COUNTS: count(row[key], optional=True)
                if row['funnel_window_days'] is not None and (type(row['funnel_window_days']) is not int or not 1 <= row['funnel_window_days'] <= 366): invalid()
                if (row['form_starters'] is not None or row['form_completers'] is not None) and row['funnel_window_days'] is None: invalid()
                for numerator, denominator in (('lead_users', 'eligible_users'), ('lead_sessions', 'sessions'), ('form_completers', 'form_starters'), ('failed_sends', 'send_attempts'), ('chat_lead_users', 'chat_open_users')):
                    if row[numerator] is not None and row[denominator] is not None and row[numerator] > row[denominator]: invalid()
                identity = (row['scope'], row['campaign_id'], row['form_kind'])
            else:
                fields(row, ('date', 'page_path', 'source_timezone', 'impressions', 'clicks'))
                if row['page_path'] not in PUBLIC_PATHS: invalid()
                try: ZoneInfo(row['source_timezone'])
                except (ValueError, TypeError, KeyError): invalid()
                count(row['impressions']); count(row['clicks'])
                if row['clicks'] > row['impressions']: invalid()
                identity = (row['date'], row['page_path'], row['source_timezone'])
            if 'date' in row:
                day = row['date']
                if date.fromisoformat(day).isoformat() != day or not period['start'] <= day <= period['end']: invalid()
            if row.get('campaign_id') is not None and row['campaign_id'] not in known: invalid('unregistered_report_campaign')
            if identity in identities: invalid('duplicate_report_aggregate')
            identities.add(identity)
    return snapshot


def apply_coverage(snapshot, coverage):
    """An operator's explicit, period-scoped reconciliation; never inferred."""
    fields(coverage, ('period', 'ledger_complete', 'spend_complete', 'cost_components_complete'))
    if coverage['period'] != snapshot['period'] or any(type(coverage[key]) is not bool for key in ('ledger_complete','spend_complete','cost_components_complete')):
        invalid('invalid_coverage_attestation')
    result = copy.deepcopy(snapshot)
    for source in ('ledger','spend'):
        if coverage[source + '_complete']: result['sources'][source]['state'] = 'complete'
    result['cost_components_complete'] = coverage['cost_components_complete']
    return result
