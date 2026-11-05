import copy
import csv
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from backend.chat_store import StoreUnavailable, rpc
from backend.marketing_imports import parse_marketing_csv
from backend.marketing_ledger import InvalidMarketingData
from backend.marketing_metrics import build_report, ratio, engagement_metrics, amount_decimal
from backend.marketing_report_contract import ANALYTICS_COUNTS, CASH_VALUES, validate_snapshot, report_period, apply_coverage
from backend.marketing_report_data import aggregate_movements
from backend.marketing_report_export import dataset_csv, export_report, safe_cell
from backend.marketing_report_store import MarketingReportStore
from scripts.export_marketing_report import main


def snapshot():
    return {'schema_version': 1, 'period': {'start': '2026-11-01', 'end': '2026-11-01', 'timezone': 'America/Santiago'},
            'as_of': '2026-11-02T12:00:00Z', 'sources': {name: {'state': 'missing', 'updated_at': None} for name in ('ledger','spend','interests','analytics','search')},
            'cost_components_complete': False, 'cash': [], 'spend': [], 'interests': [], 'analytics': [], 'search': []}


def cash(**changes):
    return {'date': '2026-11-01', 'provider': 'hotmart', 'service': 'course', 'currency': 'CLP', 'campaign_id': None,
            'attribution_method': 'unknown', **dict.fromkeys(CASH_VALUES, 0), 'sales_count': 1, 'sales_minor': 10000, **changes}


def analytics(**changes):
    return {'scope': 'site', 'campaign_id': None, 'form_kind': None, 'funnel_window_days': None, **dict.fromkeys(ANALYTICS_COUNTS, None), **changes}


def ready(data, source):
    data['sources'][source] = {'state': 'complete', 'updated_at': '2026-11-02T00:00:00Z'}


class MetricTests(unittest.TestCase):
    def test_missing_sources_produce_no_fabricated_zero_revenue(self):
        report = build_report(snapshot())
        self.assertEqual(report['datasets']['revenue'], [])
        self.assertEqual(report['datasets']['campaigns'], [])
        self.assertEqual(report['datasets']['cohorts'], [])
        self.assertTrue(all(row['reason'] == 'no_data' for row in report['datasets']['quality'][:5]))
        self.assertEqual(ratio(1, 0), {'value': None, 'reason': 'zero_denominator'})
        self.assertIsNone(ratio(None, 10)['value'])

    def test_one_sale_three_clicks_two_sessions_is_still_one_sale(self):
        data = snapshot()
        ready(data, 'ledger'); ready(data, 'analytics')
        data['cash'] = [cash()]
        data['analytics'] = [analytics(sessions=2, eligible_users=2, lead_users=1, lead_sessions=1, observed_leads=1)]
        report = build_report(data)
        self.assertEqual(report['datasets']['revenue'][0]['sales_minor'], 10000)
        self.assertEqual(report['datasets']['campaigns'][0]['sales_count'], 1)
        visual = engagement_metrics(exposed_views=2, clicked_exposed_views=1, clicks=3, unexposed_clicks=1, eligible_views=2, section_views=1)
        self.assertEqual(visual['click_frequency']['value'], '1.500000')
        self.assertEqual(visual['cta_ctr_percent']['value'], '50.000000')
        self.assertEqual(visual['unexposed_clicks'], 1)

    def test_campaign_roas_exact_spend_and_observed_lead_cost(self):
        data = snapshot()
        for source in ('ledger', 'spend', 'analytics'): ready(data, source)
        data['cash'] = [cash(campaign_id='fixture_1', attribution_method='documented_manual', refunds_minor=2000)]
        data['spend'] = [{'date':'2026-11-01','platform':'meta_ads','campaign_id':'fixture_1','currency':'CLP','source_timezone':'America/Santiago','spend_minor':2500}]
        data['analytics'] = [analytics(scope='campaign', campaign_id='fixture_1', observed_leads=5)]
        row = build_report(data, {'fixture_1'})['datasets']['campaigns'][0]
        self.assertEqual(row['roas_gross'], '4.000000')
        self.assertEqual(row['roas_adjusted'], '3.200000')
        self.assertEqual(row['cost_per_payment_minor'], '2500.000000')
        self.assertEqual(row['cost_per_observed_lead_minor'], '500.000000')
        self.assertEqual(row['documented_manual_sales_minor'], 10000)

    def test_missing_spend_is_unknown_and_confirmed_zero_cannot_divide(self):
        data = snapshot(); ready(data,'ledger'); ready(data,'spend')
        data['cash'] = [cash(campaign_id='fixture_1', attribution_method='provider_campaign')]
        row = build_report(data, {'fixture_1'})['datasets']['campaigns'][0]
        self.assertIsNone(row['confirmed_spend_minor']); self.assertIsNone(row['roas_gross'])
        data['spend'] = [{'date':'2026-11-01','platform':'meta_ads','campaign_id':'fixture_1','currency':'CLP','source_timezone':'America/Santiago','spend_minor':0}]
        row = build_report(data, {'fixture_1'})['datasets']['campaigns'][0]
        self.assertEqual(row['confirmed_spend_minor'], 0)
        self.assertEqual(row['roas_gross_reason'], 'zero_denominator')

    def test_missing_days_or_timezone_mismatch_suppress_roas(self):
        data = snapshot(); ready(data,'ledger'); ready(data,'spend')
        data['cash'] = [cash(campaign_id='fixture_1', attribution_method='provider_campaign')]
        data['spend'] = [{'date':'2026-11-01','platform':'meta_ads','campaign_id':'fixture_1','currency':'CLP','source_timezone':'UTC','spend_minor':100}]
        row = build_report(data, {'fixture_1'})['datasets']['campaigns'][0]
        self.assertEqual(row['spend_reason'], 'timezone_mismatch')
        data['period']['end'] = '2026-11-02'
        data['spend'][0]['source_timezone'] = 'America/Santiago'
        row = build_report(data, {'fixture_1'})['datasets']['campaigns'][0]
        self.assertIsNone(row['roas_gross'])

    def test_currencies_stay_separate_and_missing_fees_are_not_profit(self):
        data = snapshot(); ready(data,'ledger')
        data['cash'] = [cash(currency='USD',sales_minor=1025), cash(currency='EUR',sales_minor=2025)]
        report = build_report(data)
        self.assertEqual({row['currency']:row['sales_amount'] for row in report['datasets']['revenue']}, {'USD':'10.25','EUR':'20.25'})
        self.assertTrue(all(row['after_costs_minor'] is None for row in report['datasets']['revenue']))
        data['cost_components_complete'] = True
        data['cash'][0].update(fees_minor=100,taxes_minor=25)
        self.assertEqual(build_report(data)['datasets']['revenue'][0]['after_costs_minor'], 900)

    def test_refund_after_midnight_uses_fact_day_not_acquisition_day(self):
        fixture = Path('tests/fixtures/marketing/movements.csv').read_bytes()
        movement = parse_marketing_csv(fixture)['rows'][0]
        sale = {**movement, 'occurred_at':'2026-11-01T02:30:00+00:00'}
        refund = {**movement, 'event_type':'refund', 'external_event_id':'fixture_refund', 'amount_minor':1000, 'occurred_at':'2026-11-01T04:00:00+00:00'}
        rows = aggregate_movements([sale, refund], '2026-10-31', '2026-11-01')
        self.assertEqual([(row['date'], row['sales_minor'], row['refunds_minor']) for row in rows], [('2026-10-31',10000,0),('2026-11-01',0,1000)])
        data = snapshot(); ready(data,'ledger'); data['cash']=[rows[1]]
        self.assertEqual(build_report(data)['datasets']['revenue'][0]['observed_adjusted_minor'], -1000)
        self.assertEqual(amount_decimal(-1000,'USD'), '-10.00')
        self.assertEqual(build_report(data)['datasets']['cohorts'], [])

    def test_import_replays_and_second_delivery_of_sale_do_not_duplicate_revenue(self):
        movement = parse_marketing_csv(Path('tests/fixtures/marketing/movements.csv').read_bytes())['rows'][0]
        copy_delivery = {**movement,'external_event_id':'another_delivery'}
        rows = aggregate_movements([movement,movement,copy_delivery], '2026-10-01','2026-10-31')
        self.assertEqual(sum(row['sales_count'] for row in rows),1)
        self.assertEqual(sum(row['sales_minor'] for row in rows),movement['amount_minor'])
        with self.assertRaises(InvalidMarketingData): aggregate_movements([movement,{**movement,'amount_minor':20000}], '2026-10-01','2026-10-31')

    def test_partial_sources_hide_kpis_and_report_unknown_attribution(self):
        data = snapshot(); data['sources']['ledger']['state']='partial'; data['cash']=[cash()]
        data['sources']['analytics']['state']='partial'; data['analytics']=[analytics(sessions=2)]
        report = build_report(data)
        self.assertEqual(report['datasets']['revenue'][0]['observed_adjusted_minor'],10000)
        self.assertIsNone(report['datasets']['revenue'][0]['confirmed_adjusted_minor'])
        self.assertTrue(all(row['value'] is None for row in report['datasets']['funnel']))
        quality = next(row for row in report['datasets']['quality'] if row['metric']=='gross_attribution_coverage_percent')
        self.assertEqual(quality['unknown_sales_count'],1); self.assertEqual(quality['unknown_sales_minor'],10000)
        self.assertIsNone(quality['value'])

    def test_user_session_funnel_and_search_rates_keep_their_denominators(self):
        data = snapshot(); ready(data,'analytics'); ready(data,'search')
        data['analytics']=[analytics(sessions=10,eligible_users=5,lead_users=2,lead_sessions=3,form_starters=5,form_completers=2,funnel_window_days=7,send_attempts=4,failed_sends=1,retries=2)]
        data['search']=[{'date':'2026-11-01','page_path':'/consulta','source_timezone':'America/Los_Angeles','impressions':100,'clicks':8}]
        rows=build_report(data)['datasets']['funnel']
        values={row['metric']:row['value'] for row in rows}
        self.assertEqual(values['user_conversion_percent'],'40.000000')
        self.assertEqual(values['session_conversion_percent'],'30.000000')
        self.assertEqual(values['observed_abandonment_percent'],'60.000000')
        self.assertEqual(values['send_error_percent'],'25.000000')
        self.assertEqual(values['organic_ctr_percent'],'8.000000')
        self.assertEqual(rows[-1]['source_timezone'],'America/Los_Angeles')


class ContractAndExportTests(unittest.TestCase):
    def test_coverage_requires_an_explicit_matching_period_and_does_not_mutate_snapshot(self):
        data=snapshot()
        declaration={'period':data['period'],'ledger_complete':True,'spend_complete':False,'cost_components_complete':False}
        result=apply_coverage(data,declaration)
        self.assertEqual(result['sources']['ledger']['state'],'complete')
        self.assertEqual(data['sources']['ledger']['state'],'missing')
        with self.assertRaises(InvalidMarketingData): apply_coverage(data,{**declaration,'period':{'start':'wrong'}})
        with self.assertRaises(InvalidMarketingData): apply_coverage(data,{**declaration,'ledger_complete':'true'})

    def test_chilean_calendar_bounds_respect_dst_and_exact_large_money(self):
        _,_,start,end=report_period('2026-09-06','2026-09-06')
        self.assertEqual((end-start).total_seconds(),23*3600)
        self.assertEqual(amount_decimal(9000000000000000,'USD'),'90000000000000.00')
        self.assertEqual(ratio(10**30,1)['value'],str(10**30)+'.000000')

    def test_rejects_sensitive_fields_duplicate_aggregates_and_bad_periods(self):
        for change in ({'email':'private@example.invalid'}, {'schema_version':2}):
            with self.assertRaises(InvalidMarketingData): validate_snapshot({**snapshot(),**change})
        data=snapshot(); ready(data,'ledger'); data['cash']=[cash(),cash()]
        with self.assertRaises(InvalidMarketingData): validate_snapshot(data)
        data['cash']=[cash(full_name='private')]
        with self.assertRaises(InvalidMarketingData): validate_snapshot(data)
        for start,end in (('bad','2026-01-01'),('2026-02-01','2026-01-01'),('2025-01-01','2026-11-01')):
            with self.assertRaises(InvalidMarketingData): report_period(start,end)

    def test_engagement_rejects_counts_that_cannot_represent_unique_views(self):
        with self.assertRaises(InvalidMarketingData):
            engagement_metrics(exposed_views=1,clicked_exposed_views=2,clicks=3,unexposed_clicks=0,eligible_views=1,section_views=1)

    def test_csv_blocks_formulas_and_retains_exact_negative_money(self):
        for value in ('=HYPERLINK("x")',' +SUM(A1)','@SUM(A1)','\t=1+1','－SUM(A1)'):
            self.assertTrue(safe_cell(value).startswith("'"))
        self.assertEqual(safe_cell('-10.25'),'-10.25')
        self.assertEqual(safe_cell(None),'N/D')
        with self.assertRaises(InvalidMarketingData): dataset_csv('quality',[{'email':'private@example.invalid'}])

    def test_exports_separate_datasets_atomically_without_ids_or_credentials(self):
        data=snapshot(); ready(data,'ledger'); data['cash']=[cash()]
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'report'
            manifest=export_report(build_report(data),target)
            self.assertEqual(set(manifest['datasets']),{'revenue','campaigns','funnel','quality','cohorts'})
            text=''.join(path.read_text(encoding='utf-8') for path in target.iterdir())
            for forbidden in ('external_transaction_id','external_event_id','visitor','email','lead_fingerprint'):
                self.assertNotIn(forbidden,text)
            rows=list(csv.DictReader(io.StringIO((target/'revenue.csv').read_text(encoding='utf-8'))))
            self.assertEqual(rows[0]['sales_minor'],'10000')
            self.assertEqual(rows[0]['after_costs_minor'],'N/D')
            with self.assertRaises(InvalidMarketingData): export_report(build_report(data),target)

    def test_invalid_export_does_not_create_partial_directory(self):
        report=build_report(snapshot()); report['datasets']['quality'].append({'secret':'private'})
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory)/'report'
            with self.assertRaises(InvalidMarketingData): export_report(report,output)
            self.assertFalse(output.exists())

    def test_windows_export_inherits_parent_permissions_instead_of_owner_only_acl(self):
        original_mkdir=Path.mkdir
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory)/'report'
            with patch('backend.marketing_report_export.os') as operating_system, patch.object(Path,'mkdir',autospec=True,side_effect=original_mkdir) as mkdir:
                operating_system.name='nt'
                export_report(build_report(snapshot()),output)
                modes=[call.kwargs.get('mode') for call in mkdir.call_args_list if '.marketing-report-' in str(call.args[0])]
            self.assertEqual(modes,[0o777])

    def test_offline_cli_does_not_load_environment_or_touch_database(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'snapshot.json'; source.write_text(json.dumps(snapshot()),encoding='utf-8')
            with patch('scripts.export_marketing_report.load_local_environment') as load, patch('scripts.export_marketing_report.MarketingReportStore') as store, patch('sys.stdout',new_callable=io.StringIO) as output:
                self.assertEqual(main(['--input',str(source),'--output',str(Path(directory)/'out')]),0)
                self.assertEqual(json.loads(output.getvalue())['status'],'exported')
                load.assert_not_called(); store.assert_not_called()

    def test_invalid_cli_never_echoes_raw_values_or_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'private-name.json'; source.write_text(json.dumps({'email':'private@example.invalid'}),encoding='utf-8')
            with patch('sys.stdout',new_callable=io.StringIO) as output:
                self.assertEqual(main(['--input',str(source),'--output',str(Path(directory)/'out')]),1)
                self.assertNotIn('private',output.getvalue())


class ReportStoreTests(unittest.TestCase):
    def test_disabled_reader_does_not_call_database_or_enable_imports(self):
        with patch.dict(os.environ,{'MARKETING_REPORTS_ENABLED':'false','MARKETING_LEDGER_ENABLED':'true'}), patch('backend.marketing_report_store.rpc') as call:
            with self.assertRaises(StoreUnavailable): MarketingReportStore().snapshot('2026-11-01','2026-11-01')
            call.assert_not_called()

    def test_reader_uses_aggregate_rpc_and_increased_bounded_response(self):
        with patch.dict(os.environ,{'MARKETING_REPORTS_ENABLED':'true','MARKETING_LEDGER_ENABLED':'false'}), patch('backend.marketing_report_store.rpc',return_value={'status':'ready','snapshot':snapshot()}) as call:
            self.assertEqual(MarketingReportStore().snapshot('2026-11-01','2026-11-01'),snapshot())
            call.assert_called_once_with('marketing_report_snapshot',{'p_start':'2026-11-01','p_end':'2026-11-01'},max_response_bytes=2*1024*1024)

    def test_unexpected_storage_response_is_never_an_empty_success(self):
        with patch.dict(os.environ,{'MARKETING_REPORTS_ENABLED':'true'}), patch('backend.marketing_report_store.rpc',return_value={'status':'error'}):
            with self.assertRaises(StoreUnavailable): MarketingReportStore().snapshot('2026-11-01','2026-11-01')

    def test_shared_rpc_rejects_a_truncated_response(self):
        with patch.dict(os.environ,{'SUPABASE_SECRET_KEY':'unit-secret'}), patch('backend.chat_store.urlopen') as open_request:
            response=open_request.return_value.__enter__.return_value
            response.status=200; response.read.return_value=b'x'*11
            with self.assertRaises(StoreUnavailable): rpc('unit',{},max_response_bytes=10)
