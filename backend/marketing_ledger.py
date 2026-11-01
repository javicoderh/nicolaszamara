"""Strict marketing ledger normalization. Never log contact or raw CSV values."""
import re
from datetime import datetime, timezone, date
from decimal import Decimal, InvalidOperation
from pathlib import Path
import json

CURRENCY_DIGITS = {'CLP': 0, 'USD': 2, 'EUR': 2}
MOVEMENT_FIELDS = ('provider', 'external_transaction_id', 'external_event_id', 'event_type', 'occurred_at',
                   'service', 'product_id', 'currency', 'amount_decimal', 'campaign_id', 'attribution_method', 'attribution_reference')
SPEND_FIELDS = ('platform', 'campaign_id', 'spend_date', 'source_timezone', 'currency', 'spend_decimal')
PROVIDERS = {'hotmart', 'consultation_payments'}
EVENT_TYPES = {'sale', 'refund', 'chargeback', 'fee', 'tax', 'adjustment'}
SERVICES = {'consultation', 'course', 'online', 'nature'}


class InvalidMarketingData(ValueError):
    """Only a fixed error code, never a rejected value."""


def identifier(value, optional=False):
    if value == '' and optional:
        return None
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,119}', value):
        raise InvalidMarketingData('invalid_identifier')
    return value


def currency_digits(currency):
    if currency not in CURRENCY_DIGITS:
        raise InvalidMarketingData('unsupported_currency')
    return CURRENCY_DIGITS[currency]


def money_minor(value, currency, allow_zero=False):
    digits = currency_digits(currency)
    if not isinstance(value, str) or len(value) > 32 or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)?', value):
        raise InvalidMarketingData('invalid_amount')
    try:
        amount = Decimal(value) * (10 ** digits)
        if amount != amount.to_integral_value() or amount < 0 or (not allow_zero and amount == 0) or amount > 9_000_000_000_000_000:
            raise InvalidMarketingData('invalid_amount')
        return int(amount)
    except InvalidOperation:
        raise InvalidMarketingData('invalid_amount') from None


def utc_timestamp(value):
    if not isinstance(value, str) or len(value) > 40:
        raise InvalidMarketingData('invalid_timestamp')
    try:
        instant = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if instant.tzinfo is None:
            raise ValueError()
        return instant.astimezone(timezone.utc).isoformat()
    except (ValueError, OverflowError):
        raise InvalidMarketingData('invalid_timestamp') from None


def campaign_ids():
    file = Path(__file__).resolve().parents[1] / 'config' / 'marketing' / 'campaigns.json'
    return {entry['utm_id'] for entry in json.loads(file.read_text(encoding='utf-8'))['campaigns']}


def validate_movement(row, campaigns=None):
    if set(row) != set(MOVEMENT_FIELDS) or any(not isinstance(value, str) for value in row.values()):
        raise InvalidMarketingData('invalid_columns')
    if row['provider'] not in PROVIDERS or row['event_type'] not in EVENT_TYPES or row['service'] not in SERVICES:
        raise InvalidMarketingData('invalid_catalog_value')
    # Adjustments need signed/revision semantics; never guess their economic sign.
    if row['event_type'] == 'adjustment':
        raise InvalidMarketingData('adjustment_requires_review')
    currency_digits(row['currency'])
    campaign = identifier(row['campaign_id'], optional=True)
    reference = identifier(row['attribution_reference'], optional=True)
    method = row['attribution_method'] or 'unknown'
    known = campaign_ids() if campaigns is None else campaigns
    if method == 'unknown':
        if campaign or reference:
            raise InvalidMarketingData('unknown_attribution_has_evidence')
    elif method not in {'provider_campaign', 'documented_manual'} or campaign not in known or not reference:
        raise InvalidMarketingData('invalid_attribution')
    return {'provider': row['provider'], 'external_transaction_id': identifier(row['external_transaction_id']),
            'external_event_id': identifier(row['external_event_id']), 'event_type': row['event_type'],
            'occurred_at': utc_timestamp(row['occurred_at']), 'service': row['service'],
            'product_id': identifier(row['product_id'], optional=True), 'currency': row['currency'],
            'amount_minor': money_minor(row['amount_decimal'], row['currency']), 'campaign_id': campaign,
            'attribution_method': method, 'attribution_reference': reference}


def validate_spend(row, campaigns=None):
    if set(row) != set(SPEND_FIELDS) or any(not isinstance(value, str) for value in row.values()):
        raise InvalidMarketingData('invalid_columns')
    campaign = identifier(row['campaign_id'])
    if campaign not in (campaign_ids() if campaigns is None else campaigns):
        raise InvalidMarketingData('unregistered_campaign')
    if row['platform'] not in {'google_ads', 'meta_ads', 'other'}:
        raise InvalidMarketingData('invalid_platform')
    try:
        day = date.fromisoformat(row['spend_date'])
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        ZoneInfo(row['source_timezone'])
    except (ValueError, TypeError, ZoneInfoNotFoundError):
        raise InvalidMarketingData('invalid_date_or_timezone') from None
    return {'platform': row['platform'], 'campaign_id': campaign, 'spend_date': day.isoformat(),
            'source_timezone': row['source_timezone'], 'currency': row['currency'],
            'spend_minor': money_minor(row['spend_decimal'], row['currency'], allow_zero=True)}
