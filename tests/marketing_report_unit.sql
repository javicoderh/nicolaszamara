-- Private aggregate report reconciliation, reverted completely (no real sales).
begin;
set local role service_role;
do $$
declare
  sale jsonb := jsonb_build_object('provider','consultation_payments','external_transaction_id','unit_m13_tx',
    'external_event_id','unit_m13_sale','event_type','sale','occurred_at','2097-11-01T12:00:00Z','service','consultation',
    'product_id',null,'currency','CLP','amount_minor',10000,'campaign_id',null,'attribution_method','unknown','attribution_reference',null);
  refund jsonb;
  batch jsonb;
  result jsonb;
begin
  refund := sale || jsonb_build_object('external_event_id','unit_m13_refund','event_type','refund','amount_minor',2500,'occurred_at','2097-11-02T12:00:00Z');
  batch := jsonb_build_object('schema_version',1,'kind','movements','file_digest',repeat('7',64),'rows',jsonb_build_array(sale,refund));
  perform public.marketing_import_batch(batch);
  perform public.marketing_import_batch(batch); -- same file must not duplicate a sale
  perform public.marketing_import_batch(jsonb_build_object('schema_version',1,'kind','movements','file_digest',repeat('8',64),
    'rows',jsonb_build_array(sale || jsonb_build_object('external_event_id','unit_m13_other_delivery'))));
  result := public.marketing_report_snapshot('2097-11-01','2097-11-02');
  assert result->>'status'='ready';
  assert jsonb_array_length(result->'snapshot'->'cash')=2;
  assert (result->'snapshot'->'cash'->0->>'sales_count')::integer=1;
  assert (result->'snapshot'->'cash'->0->>'sales_minor')::bigint=10000;
  assert (result->'snapshot'->'cash'->1->>'refunds_minor')::bigint=2500;
  assert result->'snapshot'->'sources'->'ledger'->>'state'='partial';
  assert result->'snapshot'->'sources'->'analytics'->>'state'='missing';
  assert not (result::text like '%external_transaction_id%' or result::text like '%normalized_record%' or result::text like '%full_name%' or result::text like '%email%');
  result := public.marketing_report_snapshot('2097-11-02','2097-11-02');
  assert jsonb_array_length(result->'snapshot'->'cash')=1;
  assert (result->'snapshot'->'cash'->0->>'sales_count')::integer=0;
  assert not has_function_privilege('anon','public.marketing_report_snapshot(date,date)','execute');
  assert not has_function_privilege('authenticated','public.marketing_report_snapshot(date,date)','execute');
  begin
    perform public.marketing_report_snapshot('2097-11-03','2097-11-01');
    raise exception 'invalid_dates_accepted';
  exception when others then
    if sqlerrm<>'invalid_report_period' then raise; end if;
  end;
end $$;
select 'marketing_report_unit_passed' as result;
rollback;
