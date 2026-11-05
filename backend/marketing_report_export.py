"""Atomic private CSV export. Only validated, aggregate report fields reach disk."""
import csv
import io
import json
import re
import os
from pathlib import Path
from uuid import uuid4
from backend.marketing_ledger import InvalidMarketingData

COMMON = ('period_start', 'period_end', 'report_timezone', 'as_of')
COLUMNS = {
    'revenue': COMMON + ('date', 'provider', 'service', 'currency', 'campaign_id', 'attribution_method', 'source', 'source_state',
        'sales_count', 'sales_minor', 'sales_amount', 'refunds_minor', 'refunds_amount', 'chargebacks_minor', 'chargebacks_amount',
        'fees_minor', 'fees_amount', 'taxes_minor', 'taxes_amount', 'observed_adjusted_minor', 'observed_adjusted_amount',
        'confirmed_adjusted_minor', 'confirmed_adjusted_amount', 'after_costs_minor', 'after_costs_amount', 'after_costs_reason',
        'ticket_mean_minor', 'ticket_mean_reason'),
    'campaigns': COMMON + ('campaign_id', 'currency', 'source', 'sales_count', 'observed_sales_minor', 'observed_sales_amount',
        'observed_adjusted_minor', 'observed_adjusted_amount', 'observed_spend_minor', 'confirmed_spend_minor', 'confirmed_spend_amount',
        'provider_campaign_sales_minor', 'documented_manual_sales_minor', 'unattributed_sales_count', 'spend_source_timezone', 'spend_reason',
        'roas_gross', 'roas_gross_reason', 'roas_adjusted', 'roas_adjusted_reason', 'cost_per_payment_minor', 'cost_per_payment_reason',
        'observed_leads', 'cost_per_observed_lead_minor', 'cost_per_observed_lead_reason'),
    'funnel': COMMON + ('source', 'scope', 'date', 'service', 'lead_source', 'campaign_id', 'form_kind', 'page_path', 'source_timezone',
        'funnel_window_days', 'metric', 'numerator', 'denominator', 'observed_value', 'value', 'reason'),
    'quality': COMMON + ('source', 'metric', 'state', 'currency', 'sample_size', 'unknown_sales_count', 'unknown_sales_minor',
        'updated_at', 'data_age_seconds', 'value', 'reason'),
    'cohorts': COMMON + ('cohort_date', 'currency', 'metric', 'value', 'reason'),
}


def safe_cell(value):
    if value is None: return 'N/D'
    if isinstance(value, (int, float)): return str(value)
    text = str(value)
    if re.fullmatch(r'-?[0-9]+(?:\.[0-9]+)?', text): return text
    # Includes leading whitespace, CR/TAB and full-width formula characters.
    if text.lstrip().startswith(('=', '+', '-', '@', '\t', '\r', '\n', '＝', '＋', '－', '＠')) or text.startswith(('\t', '\r', '\n')):
        return "'" + text
    return text


def dataset_csv(name, rows):
    output = io.StringIO(newline='')
    writer = csv.writer(output, lineterminator='\n')
    columns = COLUMNS[name]
    writer.writerow(columns)
    for row in rows:
        if set(row) - set(columns): raise InvalidMarketingData('unexpected_export_field')
        writer.writerow([safe_cell(row.get(field)) for field in columns])
    return output.getvalue()


def export_report(report, destination):
    destination = Path(destination)
    if destination.exists(): raise InvalidMarketingData('report_destination_exists')
    if set(report['datasets']) != set(COLUMNS): raise InvalidMarketingData('invalid_report_datasets')
    # Finish formatting before creating anything. A failed validation cannot leave
    # a half-updated report that a reader mistakes for a complete export.
    files = {name + '.csv': dataset_csv(name, rows) for name, rows in report['datasets'].items()}
    manifest = {key: report[key] for key in ('schema_version', 'period', 'as_of')}
    manifest['datasets'] = {name: {'rows': len(rows), 'file': name + '.csv'} for name, rows in report['datasets'].items()}
    manifest['limitations'] = ['hotmart_webhook_deferred', 'consented_traffic_only_total_unknown', 'acquisition_cohorts_unavailable']
    files['manifest.json'] = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Python 3.13 implements mode=0700 as an owner-only Windows ACL. A staging
    # directory with that ACL retains it on rename and can lock out the user's
    # ordinary process. On Windows inherit the destination parent's ACL instead.
    prepared = destination.parent / ('.marketing-report-' + uuid4().hex)
    prepared.mkdir(mode=0o777 if os.name == 'nt' else 0o700)
    try:
        for name, content in files.items():
            target = prepared / name
            target.write_text(content, encoding='utf-8', newline='')
            if os.name != 'nt': target.chmod(0o600)
        if destination.exists(): raise InvalidMarketingData('report_destination_exists')
        prepared.rename(destination)
    finally:
        if prepared.exists():
            # Remove only the exact files this export owns; never recursively
            # delete an unexpected file or an existing destination directory.
            for name in files:
                (prepared / name).unlink(missing_ok=True)
            prepared.rmdir()
    return manifest
