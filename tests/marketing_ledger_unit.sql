-- Manual SQL unit verification. Synthetic records are always rolled back.
begin;
set local role service_role;
do $$
declare
  sale jsonb := jsonb_build_object('provider','consultation_payments','external_transaction_id','unit_tx_20261029',
    'external_event_id','unit_sale_20261029','event_type','sale','occurred_at','2026-10-29T12:00:00+00:00',
    'service','consultation','product_id',null,'currency','CLP','amount_minor',10000,
    'campaign_id',null,'attribution_method','unknown','attribution_reference',null);
  spend jsonb := jsonb_build_object('platform','google_ads','campaign_id','unit_campaign','spend_date','2026-10-29',
    'source_timezone','America/Santiago','currency','CLP','spend_minor',1000);
  batch jsonb;
  outcome jsonb;
begin
  batch := jsonb_build_object('schema_version',1,'kind','movements','file_digest',repeat('a',64),'rows',jsonb_build_array(sale));
  outcome := public.marketing_import_batch(batch);
  if outcome->>'status'<>'applied' then raise exception 'unit_apply_failed'; end if;
  outcome := public.marketing_import_batch(batch);
  if (outcome->>'replayed')::boolean is not true then raise exception 'unit_replay_failed'; end if;
  perform public.marketing_import_batch(jsonb_set(jsonb_set(batch,'{file_digest}',to_jsonb(repeat('b',64))),
    '{rows}',jsonb_build_array(jsonb_set(sale,'{external_event_id}','"unit_other_delivery"'))));
  if (select count(*) from private.marketing_movements where external_event_id in ('unit_sale_20261029','unit_other_delivery'))<>1 then
    raise exception 'unit_sale_duplicated';
  end if;
  perform public.marketing_import_batch(jsonb_build_object('schema_version',1,'kind','movements','file_digest',repeat('c',64),
    'rows',jsonb_build_array(sale || '{"external_event_id":"unit_refund","event_type":"refund","amount_minor":1000}'::jsonb)));
  if (select sum(amount_minor) from private.marketing_movements where external_event_id='unit_refund')<>1000 then
    raise exception 'unit_refund_failed';
  end if;
  begin
    perform public.marketing_import_batch(jsonb_build_object('schema_version',1,'kind','movements','file_digest',repeat('d',64),
      'rows',jsonb_build_array(sale || '{"external_transaction_id":"unit_must_rollback","external_event_id":"unit_rollback_sale"}'::jsonb,
        sale || '{"external_event_id":"unit_excess_refund","event_type":"refund","amount_minor":20000}'::jsonb)));
    raise exception 'unit_expected_reversal_failure';
  exception when raise_exception then
    if sqlerrm<>'marketing_invalid_reversal' then raise; end if;
  end;
  if exists(select 1 from private.marketing_transactions where external_transaction_id='unit_must_rollback') then
    raise exception 'unit_partial_batch_persisted';
  end if;
  batch := jsonb_build_object('schema_version',1,'kind','spend','file_digest',repeat('e',64),'rows',jsonb_build_array(spend));
  perform public.marketing_import_batch(batch);
  perform public.marketing_import_batch(jsonb_set(jsonb_set(batch,'{file_digest}',to_jsonb(repeat('f',64))),
    '{rows}',jsonb_build_array(spend || '{"spend_minor":2000}'::jsonb)));
  if (select spend_minor from private.marketing_ad_spend where campaign_id='unit_campaign')<>2000 then
    raise exception 'unit_spend_not_replaced';
  end if;
  if (select count(*) from private.marketing_spend_revisions r join private.marketing_ad_spend s on s.id=r.spend_id where s.campaign_id='unit_campaign')<>1 then
    raise exception 'unit_revision_missing';
  end if;
  if has_function_privilege('anon','public.marketing_import_batch(jsonb)','execute')
    or has_function_privilege('authenticated','public.marketing_import_batch(jsonb)','execute') then
    raise exception 'unit_public_rpc_access';
  end if;
end;
$$;
reset role;
select 'marketing_ledger_unit_passed' as verification;
rollback;
