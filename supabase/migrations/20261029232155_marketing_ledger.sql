-- Private marketing ledger. Apply only in the authorized activation step.
create schema if not exists private;
create table private.marketing_import_batches (
  id bigint generated always as identity primary key,
  file_digest text not null check (file_digest ~ '^[a-f0-9]{64}$'),
  kind text not null check (kind in ('movements','spend')),
  payload_hash text not null,
  row_count integer not null check (row_count between 1 and 10000),
  created_at timestamptz not null default now(),
  unique(file_digest,kind)
);
create table private.marketing_transactions (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('hotmart','consultation_payments')),
  external_transaction_id text not null check (external_transaction_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'),
  service text not null check (service in ('consultation','course','online','nature')),
  product_id text,
  currency text not null check (currency in ('CLP','USD','EUR')),
  campaign_id text,
  attribution_method text not null check (attribution_method in ('unknown','provider_campaign','documented_manual')),
  attribution_reference text,
  created_at timestamptz not null default now(),
  unique(provider,external_transaction_id),
  check ((attribution_method='unknown' and campaign_id is null and attribution_reference is null)
    or (attribution_method<>'unknown' and campaign_id is not null and attribution_reference is not null))
);
create table private.marketing_movements (
  id bigint generated always as identity primary key,
  transaction_id bigint not null references private.marketing_transactions(id),
  provider text not null,
  external_event_id text not null check (external_event_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'),
  event_type text not null check (event_type in ('sale','refund','chargeback','fee','tax')),
  amount_minor bigint not null check (amount_minor between 1 and 9000000000000000),
  occurred_at timestamptz not null,
  batch_id bigint not null references private.marketing_import_batches(id),
  normalized_record jsonb not null,
  unique(provider,external_event_id)
);
create unique index marketing_one_sale_per_transaction on private.marketing_movements(transaction_id) where event_type='sale';
create index marketing_movements_transaction_idx on private.marketing_movements(transaction_id);
create index marketing_movements_date_idx on private.marketing_movements(occurred_at);
create table private.marketing_ad_spend (
  id bigint generated always as identity primary key,
  platform text not null check (platform in ('google_ads','meta_ads','other')),
  campaign_id text not null check (campaign_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'),
  spend_date date not null,
  source_timezone text not null,
  currency text not null check (currency in ('CLP','USD','EUR')),
  spend_minor bigint not null check (spend_minor between 0 and 9000000000000000),
  batch_id bigint not null references private.marketing_import_batches(id),
  unique(platform,campaign_id,spend_date,currency)
);
create table private.marketing_spend_revisions (
  id bigint generated always as identity primary key,
  spend_id bigint not null references private.marketing_ad_spend(id),
  old_minor bigint not null,
  new_minor bigint not null,
  batch_id bigint not null references private.marketing_import_batches(id),
  created_at timestamptz not null default now()
);
create table private.marketing_webhook_receipts (
  provider text not null,
  event_id text not null,
  payload_hash text not null,
  status text not null check (status in ('received','processed','rejected')),
  received_at timestamptz not null default now(),
  primary key(provider,event_id)
);

alter table private.marketing_import_batches enable row level security;
alter table private.marketing_transactions enable row level security;
alter table private.marketing_movements enable row level security;
alter table private.marketing_ad_spend enable row level security;
alter table private.marketing_spend_revisions enable row level security;
alter table private.marketing_webhook_receipts enable row level security;
revoke all on private.marketing_import_batches,private.marketing_transactions,private.marketing_movements,
  private.marketing_ad_spend,private.marketing_spend_revisions,private.marketing_webhook_receipts from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert on private.marketing_import_batches,private.marketing_transactions,private.marketing_movements,
  private.marketing_spend_revisions,private.marketing_webhook_receipts to service_role;
grant select,insert,update on private.marketing_ad_spend to service_role;
grant usage,select on sequence private.marketing_import_batches_id_seq,private.marketing_transactions_id_seq,
  private.marketing_movements_id_seq,private.marketing_ad_spend_id_seq,private.marketing_spend_revisions_id_seq to service_role;

create function public.marketing_import_batch(p_batch jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  batch private.marketing_import_batches%rowtype;
  tx private.marketing_transactions%rowtype;
  existing private.marketing_movements%rowtype;
  previous_spend private.marketing_ad_spend%rowtype;
  row_data jsonb;
  row_keys text[];
  v_batch_id bigint;
  sale_amount bigint;
  reversed_amount bigint;
  amount bigint;
begin
  if jsonb_typeof(p_batch)<>'object' or p_batch->>'schema_version'<>'1'
    or p_batch->>'kind' not in ('movements','spend') or p_batch->>'file_digest' !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_batch->'rows')<>'array'
    or jsonb_array_length(p_batch->'rows') not between 1 and 10000
    or (select count(*) from jsonb_object_keys(p_batch))<>4 then
    raise exception 'marketing_invalid_batch';
  end if;
  -- Short imports are serialized to make cross-file deduplication deterministic.
  perform pg_advisory_xact_lock(98760101);
  select * into batch from private.marketing_import_batches
    where file_digest=p_batch->>'file_digest' and kind=p_batch->>'kind';
  if found then
    if batch.payload_hash<>md5(p_batch::text) then raise exception 'marketing_batch_conflict'; end if;
    return jsonb_build_object('status','applied','replayed',true,'rows',batch.row_count);
  end if;
  insert into private.marketing_import_batches(file_digest,kind,payload_hash,row_count)
    values(p_batch->>'file_digest',p_batch->>'kind',md5(p_batch::text),jsonb_array_length(p_batch->'rows'))
    returning id into v_batch_id;

  for row_data in select value from jsonb_array_elements(p_batch->'rows')
    order by case when value->>'event_type'='sale' then 0 else 1 end
  loop
    select array_agg(key order by key) into row_keys from jsonb_object_keys(row_data) key;
    if p_batch->>'kind'='movements' then
      if row_keys<>array['amount_minor','attribution_method','attribution_reference','campaign_id','currency','event_type',
          'external_event_id','external_transaction_id','occurred_at','product_id','provider','service']
        or row_data->>'provider' not in ('hotmart','consultation_payments')
        or row_data->>'service' not in ('consultation','course','online','nature')
        or row_data->>'event_type' not in ('sale','refund','chargeback','fee','tax')
        or row_data->>'amount_minor' !~ '^[0-9]+$'
        or row_data->>'external_transaction_id' !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$' then
        raise exception 'marketing_invalid_record';
      end if;
      amount := (row_data->>'amount_minor')::bigint;
      select * into existing from private.marketing_movements
        where provider=row_data->>'provider' and external_event_id=row_data->>'external_event_id';
      if found then
        if existing.normalized_record<>row_data then raise exception 'marketing_event_conflict'; end if;
        continue;
      end if;
      insert into private.marketing_transactions(provider,external_transaction_id,service,product_id,currency,
          campaign_id,attribution_method,attribution_reference)
        values(row_data->>'provider',row_data->>'external_transaction_id',row_data->>'service',row_data->>'product_id',
          row_data->>'currency',row_data->>'campaign_id',row_data->>'attribution_method',row_data->>'attribution_reference')
        on conflict(provider,external_transaction_id) do nothing;
      select * into tx from private.marketing_transactions
        where provider=row_data->>'provider' and external_transaction_id=row_data->>'external_transaction_id';
      if tx.currency is distinct from row_data->>'currency' or tx.service is distinct from row_data->>'service'
        or tx.product_id is distinct from row_data->>'product_id' or tx.campaign_id is distinct from row_data->>'campaign_id'
        or tx.attribution_method is distinct from row_data->>'attribution_method'
        or tx.attribution_reference is distinct from row_data->>'attribution_reference' then
        raise exception 'marketing_transaction_conflict';
      end if;
      select sum(amount_minor) filter(where event_type='sale'),coalesce(sum(amount_minor) filter(where event_type in ('refund','chargeback')),0)
        into sale_amount,reversed_amount from private.marketing_movements where transaction_id=tx.id;
      if row_data->>'event_type'='sale' and sale_amount is not null then
        if sale_amount<>amount then raise exception 'marketing_sale_conflict'; end if;
        continue; -- CSV and webhook approval are the same sale, not two payments.
      end if;
      if row_data->>'event_type' in ('refund','chargeback') and (sale_amount is null or reversed_amount+amount>sale_amount) then
        raise exception 'marketing_invalid_reversal';
      end if;
      insert into private.marketing_movements(transaction_id,provider,external_event_id,event_type,amount_minor,occurred_at,batch_id,normalized_record)
        values(tx.id,row_data->>'provider',row_data->>'external_event_id',row_data->>'event_type',amount,
          (row_data->>'occurred_at')::timestamptz,v_batch_id,row_data);
    else
      if row_keys<>array['campaign_id','currency','platform','source_timezone','spend_date','spend_minor']
        or row_data->>'spend_minor' !~ '^[0-9]+$'
        or not exists(select 1 from pg_timezone_names where name=row_data->>'source_timezone') then
        raise exception 'marketing_invalid_spend';
      end if;
      select * into previous_spend from private.marketing_ad_spend where platform=row_data->>'platform'
        and campaign_id=row_data->>'campaign_id' and spend_date=(row_data->>'spend_date')::date and currency=row_data->>'currency';
      amount := (row_data->>'spend_minor')::bigint;
      if found then
        if previous_spend.source_timezone<>row_data->>'source_timezone' then raise exception 'marketing_timezone_conflict'; end if;
        if previous_spend.spend_minor<>amount then
          insert into private.marketing_spend_revisions(spend_id,old_minor,new_minor,batch_id)
            values(previous_spend.id,previous_spend.spend_minor,amount,v_batch_id);
          update private.marketing_ad_spend set spend_minor=amount,batch_id=v_batch_id where id=previous_spend.id;
        end if;
      else
        insert into private.marketing_ad_spend(platform,campaign_id,spend_date,source_timezone,currency,spend_minor,batch_id)
          values(row_data->>'platform',row_data->>'campaign_id',(row_data->>'spend_date')::date,row_data->>'source_timezone',
            row_data->>'currency',amount,v_batch_id);
      end if;
    end if;
  end loop;
  return jsonb_build_object('status','applied','replayed',false,'rows',jsonb_array_length(p_batch->'rows'));
end;
$$;
revoke all on function public.marketing_import_batch(jsonb) from public,anon,authenticated;
grant execute on function public.marketing_import_batch(jsonb) to service_role;
