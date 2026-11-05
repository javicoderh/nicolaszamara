"""Exact, source-scoped report calculations. No contact or transaction joins."""
from collections import defaultdict
from datetime import datetime, timedelta, date
from decimal import Decimal, ROUND_HALF_UP, localcontext
from backend.marketing_report_contract import validate_snapshot, CASH_VALUES, REPORT_TIMEZONE
from backend.marketing_ledger import CURRENCY_DIGITS, InvalidMarketingData


def ratio(numerator, denominator, complete=True, percent=False):
    if not complete: return {'value': None, 'reason': 'incomplete_source'}
    if numerator is None or denominator is None: return {'value': None, 'reason': 'missing_input'}
    if denominator <= 0: return {'value': None, 'reason': 'zero_denominator'}
    with localcontext() as context:
        context.prec = max(40, len(str(numerator)) + len(str(denominator)) + 16)
        value = Decimal(numerator) / Decimal(denominator) * (100 if percent else 1)
        return {'value': format(value.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP), 'f'), 'reason': ''}


def engagement_metrics(*, exposed_views, clicked_exposed_views, clicks, unexposed_clicks, eligible_views, section_views, complete=True):
    values = (exposed_views, clicked_exposed_views, clicks, unexposed_clicks, eligible_views, section_views)
    if any(value is not None and (type(value) is not int or value < 0) for value in values):
        raise InvalidMarketingData('invalid_engagement_counts')
    if (clicked_exposed_views is not None and exposed_views is not None and clicked_exposed_views > exposed_views
            or section_views is not None and eligible_views is not None and section_views > eligible_views
            or clicks is not None and clicked_exposed_views is not None and clicked_exposed_views > clicks
            or clicks is not None and unexposed_clicks is not None and unexposed_clicks > clicks):
        raise InvalidMarketingData('inconsistent_engagement_counts')
    return {'cta_ctr_percent': ratio(clicked_exposed_views, exposed_views, complete, True),
            'click_frequency': ratio(clicks, exposed_views, complete),
            'section_reach_percent': ratio(section_views, eligible_views, complete, True),
            'unexposed_clicks': unexposed_clicks}


def funnel_metrics(row, complete=True):
    result = {
        'user_conversion_percent': ratio(row['lead_users'], row['eligible_users'], complete, True),
        'session_conversion_percent': ratio(row['lead_sessions'], row['sessions'], complete, True),
        'send_error_percent': ratio(row['failed_sends'], row['send_attempts'], complete, True),
        'chat_contact_percent': ratio(row['chat_lead_users'], row['chat_open_users'], complete, True),
    }
    completed = ratio(row['form_completers'], row['form_starters'], complete, True)
    result['observed_abandonment_percent'] = {**completed, 'value': format(Decimal(100) - Decimal(completed['value']), '.6f') if completed['value'] is not None else None}
    return result


def amount_decimal(minor, currency):
    if minor is None: return None
    digits = CURRENCY_DIGITS[currency]
    sign = '-' if minor < 0 else ''
    units, fraction = divmod(abs(minor), 10 ** digits)
    return f'{sign}{units}' + (f'.{fraction:0{digits}d}' if digits else '')


def build_report(snapshot, campaigns=None):
    validate_snapshot(snapshot, campaigns)
    sources, period = snapshot['sources'], snapshot['period']
    ledger_complete = sources['ledger']['state'] == 'complete'
    analytics_complete = sources['analytics']['state'] == 'complete'
    rows = {'revenue': [], 'campaigns': [], 'funnel': [], 'quality': [], 'cohorts': []}
    common = {'period_start': period['start'], 'period_end': period['end'], 'report_timezone': REPORT_TIMEZONE, 'as_of': snapshot['as_of']}
    for entry in snapshot['cash']:
        adjusted = entry['sales_minor'] - entry['refunds_minor'] - entry['chargebacks_minor']
        record = {**common, **entry, 'source': 'ledger', 'source_state': sources['ledger']['state'],
                  'observed_adjusted_minor': adjusted, 'confirmed_adjusted_minor': adjusted if ledger_complete else None,
                  'after_costs_minor': adjusted - entry['fees_minor'] - entry['taxes_minor'] if ledger_complete and snapshot['cost_components_complete'] else None,
                  'after_costs_reason': '' if ledger_complete and snapshot['cost_components_complete'] else 'cost_coverage_unconfirmed'}
        for key in ('sales_minor', 'refunds_minor', 'chargebacks_minor', 'fees_minor', 'taxes_minor', 'observed_adjusted_minor', 'confirmed_adjusted_minor', 'after_costs_minor'):
            record[key.replace('_minor', '_amount')] = amount_decimal(record[key], entry['currency'])
        ticket = ratio(entry['sales_minor'], entry['sales_count'], ledger_complete)
        record.update(ticket_mean_minor=ticket['value'], ticket_mean_reason=ticket['reason'])
        rows['revenue'].append(record)

    # Aggregate money and spend independently to campaign+currency BEFORE combining.
    money = defaultdict(lambda: {key: 0 for key in CASH_VALUES})
    methods = defaultdict(lambda: {'provider_campaign_sales_minor': 0, 'documented_manual_sales_minor': 0})
    unknown = defaultdict(lambda: {'sales_minor': 0, 'sales_count': 0, 'known_minor': 0, 'unknown_count': 0, 'unknown_minor': 0})
    for entry in snapshot['cash']:
        key = (entry['campaign_id'], entry['currency'])
        for field in CASH_VALUES: money[key][field] += entry[field]
        unknown[entry['currency']]['sales_minor'] += entry['sales_minor']
        unknown[entry['currency']]['sales_count'] += entry['sales_count']
        if entry['campaign_id'] is None:
            unknown[entry['currency']]['unknown_count'] += entry['sales_count']
            unknown[entry['currency']]['unknown_minor'] += entry['sales_minor']
        else:
            unknown[entry['currency']]['known_minor'] += entry['sales_minor']
            methods[key][entry['attribution_method'] + '_sales_minor'] += entry['sales_minor']
    spend = defaultdict(lambda: {'total': 0, 'days': set(), 'timezones': set()})
    for entry in snapshot['spend']:
        key = (entry['campaign_id'], entry['currency'])
        spend[key]['total'] += entry['spend_minor']
        spend[key]['days'].add(entry['date']); spend[key]['timezones'].add(entry['source_timezone'])
    day = date.fromisoformat(period['start'])
    required_days = set()
    while day.isoformat() <= period['end']:
        required_days.add(day.isoformat()); day += timedelta(days=1)
    campaign_analytics = {entry['campaign_id']: entry for entry in snapshot['analytics'] if entry['scope'] == 'campaign'}
    for key in sorted(set(money) | set(spend), key=lambda item: (item[0] or '', item[1])):
        campaign, currency = key
        amounts = money[key]
        ad = spend[key]
        comparable = ad['timezones'] == {REPORT_TIMEZONE}
        spend_complete = sources['spend']['state'] == 'complete' and ad['days'] == required_days and comparable
        # No spending on file is unknown, even if another campaign has records.
        paid = ad['total'] if spend_complete else None
        adjusted = amounts['sales_minor'] - amounts['refunds_minor'] - amounts['chargebacks_minor']
        record = {**common, 'campaign_id': campaign, 'currency': currency, 'source': 'ledger+spend',
                  'sales_count': amounts['sales_count'], 'observed_sales_minor': amounts['sales_minor'],
                  'observed_adjusted_minor': adjusted, 'observed_spend_minor': ad['total'] if key in spend and ad['days'] else None,
                  'confirmed_spend_minor': paid, **methods[key],
                  'spend_source_timezone': '|'.join(sorted(ad['timezones'])) or None,
                  'spend_reason': '' if spend_complete else 'timezone_mismatch' if ad['timezones'] and not comparable else 'incomplete_spend',
                  'unattributed_sales_count': amounts['sales_count'] if campaign is None else 0}
        comparable_money = ledger_complete and spend_complete and campaign is not None
        for name, value in (('roas_gross', amounts['sales_minor']), ('roas_adjusted', adjusted)):
            metric = ratio(value, paid, comparable_money)
            record[name], record[name + '_reason'] = metric['value'], metric['reason']
        cost = ratio(paid, amounts['sales_count'], comparable_money)
        record['cost_per_payment_minor'], record['cost_per_payment_reason'] = cost['value'], cost['reason']
        observed = campaign_analytics.get(campaign)
        record['observed_leads'] = observed['observed_leads'] if observed and analytics_complete else None
        cpl = ratio(paid, observed['observed_leads'] if observed else None, spend_complete and analytics_complete and observed is not None)
        record['cost_per_observed_lead_minor'], record['cost_per_observed_lead_reason'] = cpl['value'], cpl['reason']
        record['observed_sales_amount'] = amount_decimal(amounts['sales_minor'], currency)
        record['observed_adjusted_amount'] = amount_decimal(adjusted, currency)
        record['confirmed_spend_amount'] = amount_decimal(paid, currency)
        rows['campaigns'].append(record)

    for entry in snapshot['interests']:
        rows['funnel'].append({**common, 'source': 'interests', 'scope': 'persisted_records', 'date': entry['date'],
                               'service': entry['service'], 'lead_source': entry['source'], 'metric': 'persisted_records',
                               'numerator': entry['count'], 'denominator': None, 'observed_value': entry['count'],
                               'value': entry['count'] if sources['interests']['state'] == 'complete' else None,
                               'reason': '' if sources['interests']['state'] == 'complete' else 'incomplete_source'})
    for entry in snapshot['analytics']:
        # These are exact whole-period source segments. Do not sum distinct users
        # across days, forms or campaigns, and do not join them to transactions.
        context = {**common, 'source': 'analytics', 'scope': entry['scope'], 'campaign_id': entry['campaign_id'], 'form_kind': entry['form_kind'], 'funnel_window_days': entry['funnel_window_days']}
        for field in ('sessions', 'eligible_users', 'observed_leads', 'send_attempts', 'retries'):
            rows['funnel'].append({**context, 'metric': field, 'observed_value': entry[field], 'value': entry[field] if analytics_complete else None, 'reason': '' if analytics_complete and entry[field] is not None else 'incomplete_source' if not analytics_complete else 'missing_input'})
        denominators = {'user_conversion_percent': ('lead_users','eligible_users'), 'session_conversion_percent': ('lead_sessions','sessions'),
                        'send_error_percent': ('failed_sends','send_attempts'), 'chat_contact_percent': ('chat_lead_users','chat_open_users'),
                        'observed_abandonment_percent': ('form_completers','form_starters')}
        for name, metric in funnel_metrics(entry, analytics_complete).items():
            numerator, denominator = denominators[name]
            rows['funnel'].append({**context, 'metric': name, 'numerator': entry[numerator], 'denominator': entry[denominator], **metric})
    for entry in snapshot['search']:
        metric = ratio(entry['clicks'], entry['impressions'], sources['search']['state'] == 'complete', True)
        rows['funnel'].append({**common, 'source': 'search', 'scope': 'search_page_day', 'date': entry['date'], 'page_path': entry['page_path'],
                               'source_timezone': entry['source_timezone'], 'metric': 'organic_ctr_percent',
                               'numerator': entry['clicks'], 'denominator': entry['impressions'], **metric})
    as_of = datetime.fromisoformat(snapshot['as_of'].replace('Z', '+00:00'))
    for source, state in sources.items():
        observed_rows = len(snapshot['cash' if source == 'ledger' else source])
        updated = state['updated_at']
        age = int((as_of - datetime.fromisoformat(updated.replace('Z', '+00:00'))).total_seconds()) if updated else None
        rows['quality'].append({**common, 'source': source, 'metric': 'source_coverage', 'state': state['state'],
                                'sample_size': observed_rows, 'updated_at': updated, 'data_age_seconds': age,
                                'value': None, 'reason': 'no_data' if not observed_rows else '' if state['state'] == 'complete' else 'incomplete_source'})
    for currency, data in sorted(unknown.items()):
        coverage = ratio(data['known_minor'], data['sales_minor'], ledger_complete, True)
        rows['quality'].append({**common, 'source': 'ledger', 'currency': currency, 'metric': 'gross_attribution_coverage_percent',
                                'sample_size': data['sales_count'], 'unknown_sales_count': data['unknown_count'], 'unknown_sales_minor': data['unknown_minor'], **coverage})
    for name, reason in (('traffic_coverage', 'consented_traffic_only_total_unknown'), ('acquisition_cohorts', 'acquisition_date_unavailable'),
                         ('hotmart_webhook', 'deferred_by_owner'), ('roi', 'missing_costs'), ('cac', 'new_customer_identity_unavailable'), ('ltv', 'recurrence_window_unavailable')):
        rows['quality'].append({**common, 'source': 'contract', 'metric': name, 'value': None, 'reason': reason})
    return {'schema_version': 1, 'period': period, 'as_of': snapshot['as_of'], 'datasets': rows}
