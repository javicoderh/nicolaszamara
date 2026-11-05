-- Read-only reporting snapshot: aggregate each source independently.
create function public.marketing_report_snapshot(p_start date, p_end date) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_cash jsonb;
  v_spend jsonb;
  v_interests jsonb;
  v_latest_ledger timestamptz;
  v_latest_spend timestamptz;
  v_snapshot jsonb;
begin
  if p_start is null or p_end is null or p_end<p_start or p_end-p_start>=366 then
    raise exception 'invalid_report_period';
  end if;
  v_start := p_start::timestamp at time zone 'America/Santiago';
  v_end := (p_end+1)::timestamp at time zone 'America/Santiago';
  select coalesce(jsonb_agg(to_jsonb(d) order by d.date,d.provider,d.service,d.currency,d.campaign_id,d.attribution_method),'[]'::jsonb)
    into v_cash from (
      select (m.occurred_at at time zone 'America/Santiago')::date as date,
        t.provider,t.service,t.currency,t.campaign_id,t.attribution_method,
        count(*) filter(where m.event_type='sale') as sales_count,
        coalesce(sum(m.amount_minor) filter(where m.event_type='sale'),0) as sales_minor,
        coalesce(sum(m.amount_minor) filter(where m.event_type='refund'),0) as refunds_minor,
        coalesce(sum(m.amount_minor) filter(where m.event_type='chargeback'),0) as chargebacks_minor,
        coalesce(sum(m.amount_minor) filter(where m.event_type='fee'),0) as fees_minor,
        coalesce(sum(m.amount_minor) filter(where m.event_type='tax'),0) as taxes_minor
      from private.marketing_movements m join private.marketing_transactions t on t.id=m.transaction_id
      where m.occurred_at>=v_start and m.occurred_at<v_end
      group by 1,t.provider,t.service,t.currency,t.campaign_id,t.attribution_method
    ) d;
  select coalesce(jsonb_agg(to_jsonb(d) order by d.date,d.platform,d.campaign_id,d.currency),'[]'::jsonb)
    into v_spend from (
      select spend_date as date,platform,campaign_id,currency,source_timezone,spend_minor
      from private.marketing_ad_spend where spend_date>=p_start and spend_date<=p_end
    ) d;
  select coalesce(jsonb_agg(to_jsonb(d) order by d.date,d.service,d.source),'[]'::jsonb)
    into v_interests from (
      select (created_at at time zone 'America/Santiago')::date as date,interest as service,source,count(*) as count
      from public.interest_registrations where created_at>=v_start and created_at<v_end
      group by 1,interest,source
    ) d;
  select max(created_at) filter(where kind='movements'),max(created_at) filter(where kind='spend')
    into v_latest_ledger,v_latest_spend from private.marketing_import_batches;
  v_snapshot := jsonb_build_object(
    'schema_version',1,
    'period',jsonb_build_object('start',p_start,'end',p_end,'timezone','America/Santiago'),
    'as_of',now(),
    -- Imported records do not prove complete source coverage or fee semantics.
    'sources',jsonb_build_object(
      'ledger',jsonb_build_object('state',case when v_latest_ledger is null then 'missing' else 'partial' end,'updated_at',v_latest_ledger),
      'spend',jsonb_build_object('state',case when v_latest_spend is null then 'missing' else 'partial' end,'updated_at',v_latest_spend),
      'interests',jsonb_build_object('state','complete','updated_at',now()),
      'analytics',jsonb_build_object('state','missing','updated_at',null),
      'search',jsonb_build_object('state','missing','updated_at',null)),
    'cost_components_complete',false,'cash',v_cash,'spend',v_spend,'interests',v_interests,'analytics','[]'::jsonb,'search','[]'::jsonb
  );
  -- A large request fails visibly; never return a silently truncated dataset.
  if octet_length(v_snapshot::text)>1900000
    or jsonb_array_length(v_cash)>10000 or jsonb_array_length(v_spend)>10000 or jsonb_array_length(v_interests)>10000 then
    raise exception 'report_too_large_reduce_period';
  end if;
  return jsonb_build_object('status','ready','snapshot',v_snapshot);
end $$;
revoke all on function public.marketing_report_snapshot(date,date) from public,anon,authenticated;
grant execute on function public.marketing_report_snapshot(date,date) to service_role;
