import csv
import io
import unittest
import tempfile
import json
from pathlib import Path
from unittest.mock import Mock, patch
from backend.marketing_ledger import MOVEMENT_FIELDS, InvalidMarketingData, money_minor, validate_movement, validate_spend
from backend.marketing_imports import parse_marketing_csv, apply_marketing_batch
from backend.marketing_store import MarketingStore
from backend.chat_store import StoreUnavailable
from scripts.import_marketing_data import main


def movement(**changes):
    return {**dict(zip(MOVEMENT_FIELDS, ['consultation_payments', 'tx_1', 'event_1', 'sale', '2026-10-29T12:00:00Z',
        'consultation', '', 'CLP', '10000', '', 'unknown', ''])), **changes}


def csv_bytes(rows):
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=MOVEMENT_FIELDS)
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode('utf-8')


class MarketingTests(unittest.TestCase):
    def test_incomplete_files_and_formula_identifiers_are_rejected(self):
        for content in (b'', b'provider,amount_decimal\nconsultation_payments,10\n',
                        csv_bytes([movement(external_transaction_id='=SUM(A1)')])):
            with self.subTest(content=content):
                try:
                    report = parse_marketing_csv(content)
                except InvalidMarketingData:
                    continue
                self.assertFalse(report['valid'])
        truncated = csv_bytes([movement()]).decode().rsplit(',', 1)[0].encode()
        self.assertFalse(parse_marketing_csv(truncated)['valid'])

    def test_distinct_currencies_remain_separate_without_conversion(self):
        report = parse_marketing_csv(csv_bytes([
            movement(currency='USD', amount_decimal='10.25'),
            movement(external_transaction_id='tx_2', external_event_id='event_2', currency='EUR', amount_decimal='10.25'),
        ]))
        self.assertTrue(report['valid'])
        self.assertEqual([(row['currency'], row['amount_minor']) for row in report['rows']], [('USD', 1025), ('EUR', 1025)])

    def test_dry_run_never_loads_credentials_or_calls_storage(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'fixture.csv'
            path.write_bytes(csv_bytes([movement()]))
            with patch('scripts.import_marketing_data.load_local_environment') as load, patch('scripts.import_marketing_data.MarketingStore') as store, patch('sys.stdout', new_callable=io.StringIO) as output:
                self.assertEqual(main([str(path), '--dry-run']), 0)
                self.assertTrue(json.loads(output.getvalue())['valid'])
                load.assert_not_called()
                store.assert_not_called()

    def test_spend_requires_approved_campaign_and_preserves_confirmed_zero(self):
        row = {'platform': 'google_ads', 'campaign_id': 'fixture_1', 'spend_date': '2026-10-29', 'source_timezone': 'America/Santiago', 'currency': 'CLP', 'spend_decimal': '0'}
        self.assertEqual(validate_spend(row, {'fixture_1'})['spend_minor'], 0)
        with self.assertRaises(InvalidMarketingData): validate_spend(row, set())
        with self.assertRaises(InvalidMarketingData): validate_spend({**row, 'source_timezone': 'Invalid/Zone'}, {'fixture_1'})

    def test_enabled_store_requires_durable_applied_response(self):
        with patch.dict('os.environ', {'MARKETING_LEDGER_ENABLED': 'true'}), patch('backend.marketing_store.rpc', return_value={'status': 'conflict'}):
            with self.assertRaises(StoreUnavailable): MarketingStore().apply_batch({})

    def test_exact_money_and_currency_rules(self):
        self.assertEqual(money_minor('123.45', 'USD'), 12345)
        self.assertEqual(money_minor('123', 'CLP'), 123)
        for value, currency in [('1.1', 'CLP'), ('1.001', 'USD'), ('NaN', 'USD'), ('1e6', 'USD'), ('-1', 'USD'), ('=1+2', 'CLP'), ('1', 'GBP')]:
            with self.subTest(value=value), self.assertRaises(InvalidMarketingData): money_minor(value, currency)

    def test_rejects_sensitive_columns_and_unknown_attribution(self):
        for row in [{**movement(), 'email': 'a@b.invalid'}, movement(campaign_id='made_up'), movement(occurred_at='2026-10-29'), movement(attribution_reference='person@example.invalid')]:
            with self.assertRaises(InvalidMarketingData): validate_movement(row)

    def test_normalizes_without_guessing_missing_campaign_or_product(self):
        value = validate_movement(movement())
        self.assertEqual(value['amount_minor'], 10000)
        self.assertIsNone(value['campaign_id'])
        self.assertIsNone(value['product_id'])
        self.assertEqual(value['occurred_at'], '2026-10-29T12:00:00+00:00')

    def test_whole_batch_validation_and_idempotent_input(self):
        report = parse_marketing_csv(csv_bytes([movement(), movement()]))
        self.assertTrue(report['valid'])
        self.assertEqual(len(report['rows']), 1)
        conflict = parse_marketing_csv(csv_bytes([movement(), movement(amount_decimal='20000')]))
        self.assertFalse(conflict['valid'])
        store = Mock()
        with self.assertRaises(InvalidMarketingData): apply_marketing_batch(conflict, store)
        store.apply_batch.assert_not_called()

    def test_reports_only_line_and_fixed_error_code(self):
        report = parse_marketing_csv(csv_bytes([movement(amount_decimal='private-string')]))
        self.assertFalse(report['valid'])
        self.assertEqual(report['errors'], [{'line': 2, 'code': 'invalid_amount'}])
        self.assertNotIn('private-string', str(report))

    def test_disabled_store_does_not_call_rpc(self):
        with patch.dict('os.environ', {'MARKETING_LEDGER_ENABLED': 'false'}), patch('backend.marketing_store.rpc') as rpc:
            with self.assertRaises(StoreUnavailable): MarketingStore().apply_batch({})
            rpc.assert_not_called()

    def test_apply_passes_only_validated_normalized_batch(self):
        report = parse_marketing_csv(csv_bytes([movement()]))
        store = Mock()
        apply_marketing_batch(report, store)
        payload = store.apply_batch.call_args.args[0]
        self.assertEqual(set(payload), {'schema_version', 'kind', 'file_digest', 'rows'})
        self.assertNotIn('amount_decimal', payload['rows'][0])


if __name__ == '__main__': unittest.main()
