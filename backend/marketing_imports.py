"""Whole-file CSV validation. A malformed batch is never partially applied."""
import csv
import hashlib
import io
from backend.marketing_ledger import MOVEMENT_FIELDS, SPEND_FIELDS, InvalidMarketingData, validate_movement, validate_spend

MAX_BYTES = 10 * 1024 * 1024
MAX_ROWS = 10000


def parse_marketing_csv(content, kind='movements', campaigns=None):
    if kind not in {'movements', 'spend'} or not isinstance(content, bytes) or len(content) > MAX_BYTES:
        raise InvalidMarketingData('invalid_file')
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise InvalidMarketingData('invalid_encoding') from None
    digest = hashlib.sha256(content).hexdigest()
    columns = MOVEMENT_FIELDS if kind == 'movements' else SPEND_FIELDS
    validator = validate_movement if kind == 'movements' else validate_spend
    reader = csv.DictReader(io.StringIO(text, newline=''), strict=True)
    rows, errors, identities = [], [], {}
    try:
        if not reader.fieldnames or len(reader.fieldnames) != len(columns) or set(reader.fieldnames) != set(columns):
            raise InvalidMarketingData('invalid_columns')
        for index, row in enumerate(reader, start=2):
            if index > MAX_ROWS + 1:
                raise InvalidMarketingData('too_many_rows')
            try:
                value = validator(row, campaigns)
                key = (value['provider'], value['external_event_id']) if kind == 'movements' else (
                    value['platform'], value['campaign_id'], value['spend_date'], value['currency'])
                if key in identities:
                    if identities[key] != value:
                        raise InvalidMarketingData('conflicting_duplicate')
                    continue
                identities[key] = value
                rows.append(value)
            except InvalidMarketingData as error:
                errors.append({'line': index, 'code': str(error)})
    except csv.Error:
        raise InvalidMarketingData('invalid_csv') from None
    if not rows and not errors:
        raise InvalidMarketingData('empty_file')
    return {'schema_version': 1, 'kind': kind, 'file_digest': digest, 'rows': rows, 'errors': errors, 'valid': not errors}


def apply_marketing_batch(batch, store):
    if batch.get('valid') is not True or batch.get('errors') or not batch.get('rows'):
        raise InvalidMarketingData('invalid_batch')
    return store.apply_batch({key: batch[key] for key in ('schema_version', 'kind', 'file_digest', 'rows')})
