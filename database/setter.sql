-- Additive upgrade of the existing interests pipeline and server-only setter RPCs.
-- Apply once to the existing schema; see database/README.md.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

alter table public.interest_registrations
  drop constraint interest_registrations_interest_check,
  drop constraint interest_fields_match,
  alter column email drop not null,
  add column source text not null default 'form',
  add column contact_channel text,
  add column phone text,
  add column contact_consent boolean,
  add column contact_accepted_at timestamptz,
  add column lead_request_id uuid unique,
  add column lead_fingerprint text,
  add column management_status text not null default 'new';

alter table public.interest_registrations
  add constraint interests_catalog check (interest in ('consultation','course','online','nature')),
  add constraint interest_fields_match check ((
    (source = 'form' and email is not null and contact_channel is null and phone is null
      and contact_consent is null and contact_accepted_at is null and lead_request_id is null and lead_fingerprint is null
      and ((interest = 'online' and country is not null and char_length(btrim(country)) between 1 and 100 and city is null)
        or (interest = 'nature' and city is not null and char_length(btrim(city)) between 1 and 100 and country is null and experience is null)))
    or (source = 'chatbot' and country is null and city is null and experience is null
      and contact_consent is true and contact_accepted_at is not null and lead_request_id is not null
      and lead_fingerprint is not null and management_status = 'new'
      and ((contact_channel = 'email' and email is not null and phone is null)
        or (contact_channel in ('phone','whatsapp') and email is null and phone ~ '^\+[1-9][0-9]{6,14}$')))
  ) is true);

-- anon keeps its original column grants and can only submit the existing form variants.
alter policy "Public forms may only insert consented interests" on public.interest_registrations
  with check (source = 'form' and privacy_consent and privacy_version = '2026-10-21');
create index interest_phone_created_idx on public.interest_registrations(phone, created_at desc) where phone is not null;
create or replace function private.limit_interest_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(874291);
  if (select count(*) from public.interest_registrations where created_at > now() - interval '1 minute') >= 200
    or (select count(*) from public.interest_registrations
        where created_at > now() - interval '1 minute'
        and ((new.email is not null and email = new.email) or (new.phone is not null and phone = new.phone))) >= 5 then
    raise exception 'interest_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_interest_submissions() from public, anon, authenticated;

create table private.setter_conversations (
  visitor uuid primary key,
  conversation_id uuid not null default gen_random_uuid(),
  completed_rounds integer not null default 0 check (completed_rounds between 0 and 10),
  provider_attempts integer not null default 0 check (provider_attempts between 0 and 12),
  topic text not null default 'unknown',
  action text not null default 'none',
  contact_declined boolean not null default false,
  capturing boolean not null default false,
  last_result jsonb,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);
create table private.setter_daily (
  visitor uuid not null,
  day date not null,
  completed_rounds integer not null default 0,
  provider_attempts integer not null default 0,
  conversations integer not null default 0,
  primary key(visitor, day)
);
create table private.setter_requests (
  visitor uuid not null,
  request_id uuid not null,
  conversation_id uuid not null,
  fingerprint text not null,
  status text not null check (status in ('reserved','completed','failed','uncertain')),
  result jsonb,
  usage jsonb,
  reserved_micro_usd bigint not null check (reserved_micro_usd > 0),
  day date not null,
  created_at timestamptz not null default now(),
  primary key(visitor, request_id)
);
create index setter_pending_idx on private.setter_requests(visitor, conversation_id, created_at) where status = 'reserved';
create index setter_requests_retention_idx on private.setter_requests(created_at);
create table private.setter_budget (
  day date primary key,
  reserved_micro_usd bigint not null default 0
);
alter table private.setter_conversations enable row level security;
alter table private.setter_daily enable row level security;
alter table private.setter_requests enable row level security;
alter table private.setter_budget enable row level security;
revoke all on private.setter_conversations, private.setter_daily, private.setter_requests, private.setter_budget from public, anon, authenticated;
grant select, insert, update, delete on private.setter_conversations, private.setter_daily, private.setter_requests, private.setter_budget to service_role;
grant select, insert on public.interest_registrations to service_role;

create function public.setter_transition(
  p_visitor uuid, p_operation text, p_limits jsonb,
  p_conversation uuid default null, p_request uuid default null, p_hash text default null,
  p_result jsonb default null, p_usage jsonb default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  c private.setter_conversations%rowtype;
  d private.setter_daily%rowtype;
  r private.setter_requests%rowtype;
  today date := (now() at time zone 'America/Santiago')::date;
  outcome text := 'ready';
  replay jsonb;
  state jsonb;
  blocked text;
  busy boolean;
  reserve_amount bigint;
  daily_budget bigint;
begin
  if p_operation not in ('session','lookup','reserve','complete','fail','restart','start_capture','cancel_capture') then
    raise exception 'invalid_operation';
  end if;
  insert into private.setter_conversations(visitor) values(p_visitor) on conflict do nothing;
  select * into c from private.setter_conversations where visitor = p_visitor for update;
  insert into private.setter_daily(visitor,day,conversations)
    values(p_visitor,today,case when c.updated_at = now() then 1 else 0 end) on conflict do nothing;
  select * into d from private.setter_daily where visitor=p_visitor and day=today for update;
  update private.setter_requests set status='uncertain'
    where visitor=p_visitor and status='reserved' and created_at < now()-interval '75 seconds';
  busy := exists(select 1 from private.setter_requests where visitor=p_visitor and conversation_id=c.conversation_id and status='reserved');
  if not busy and c.provider_attempts >= 12 and c.closed_at is null then c.closed_at := now(); end if;
  if p_operation != 'session' and p_conversation is distinct from c.conversation_id then
    outcome := 'conversation_changed';
  elsif p_operation in ('lookup','reserve') then
    select * into r from private.setter_requests where visitor=p_visitor and request_id=p_request;
    if found then
      if r.fingerprint != p_hash or r.conversation_id != p_conversation then
        outcome := 'request_conflict';
      else
        outcome := case when r.status='completed' then 'completed' when r.status='reserved' then 'pending' else r.status end;
        replay := r.result;
      end if;
    else
      outcome := 'new';
    end if;
  end if;
  blocked := case
    when c.closed_at is not null or c.completed_rounds >= (p_limits->>'max_completed_rounds')::integer then 'conversation_closed'
    when c.provider_attempts >= (p_limits->>'max_provider_attempts_per_conversation')::integer then 'attempt_budget_exhausted'
    when d.completed_rounds >= (p_limits->>'max_completed_rounds_per_visitor_day')::integer
      or d.provider_attempts >= (p_limits->>'max_provider_attempts_per_visitor_day')::integer then 'daily_limit'
    when c.capturing then 'capture_active'
    when busy then 'pending'
    else null end;
  if outcome='new' then
    if blocked is not null then
      outcome := blocked;
    elsif p_operation='reserve' then
      reserve_amount := (p_limits->>'reservation_micro_usd')::bigint;
      daily_budget := (p_limits->>'daily_budget_micro_usd')::bigint;
      if reserve_amount is null or reserve_amount <= 0 or daily_budget is null or daily_budget <= 0 then
        raise exception 'budget_not_configured';
      end if;
      insert into private.setter_budget(day) values(today) on conflict do nothing;
      -- The conditional UPDATE serializes global reservations across every visitor/instance.
      update private.setter_budget set reserved_micro_usd=reserved_micro_usd+reserve_amount
        where day=today and reserved_micro_usd+reserve_amount <= daily_budget;
      if not found then
        outcome := 'global_budget_exhausted';
      else
        insert into private.setter_requests(visitor,request_id,conversation_id,fingerprint,status,reserved_micro_usd,day)
          values(p_visitor,p_request,c.conversation_id,p_hash,'reserved',reserve_amount,today);
        c.provider_attempts := c.provider_attempts+1;
        d.provider_attempts := d.provider_attempts+1;
        outcome := 'reserved';
        busy := true;
      end if;
    end if;
  elsif outcome='ready' and p_operation in ('complete','fail') then
    select * into r from private.setter_requests where visitor=p_visitor and request_id=p_request;
    if not found or r.status != 'reserved' or r.conversation_id != c.conversation_id then
      outcome := 'uncertain';
    elsif p_operation='fail' then
      update private.setter_requests set status='failed' where visitor=p_visitor and request_id=p_request;
      outcome := 'failed';
      busy := false;
      if c.provider_attempts >= 12 then c.closed_at := now(); end if;
    else
      update private.setter_requests set status='completed', result=p_result, usage=p_usage where visitor=p_visitor and request_id=p_request;
      c.completed_rounds := c.completed_rounds+1;
      -- Attempts belong to the request day; delivered responses to the completion day.
      d.completed_rounds := d.completed_rounds+1;
      c.topic := p_result->>'topic';
      c.action := p_result->>'action';
      c.contact_declined := (p_result->>'contact_declined')::boolean;
      c.capturing := c.action='start_contact_capture';
      c.last_result := p_result;
      if c.completed_rounds >= 10 or c.provider_attempts >= 12 or (p_result->>'stop')::boolean then c.closed_at := now(); end if;
      outcome := 'completed';
      replay := p_result;
      busy := false;
    end if;
  elsif outcome='ready' and p_operation='start_capture' then
    if busy then outcome := 'pending';
    else c.capturing := true; c.contact_declined := false; end if;
  elsif outcome='ready' and p_operation='cancel_capture' then
    c.capturing := false;
    c.contact_declined := true;
    c.action := 'none';
  elsif outcome='ready' and p_operation='restart' then
    if busy or c.capturing or c.closed_at is null then outcome := 'conversation_active';
    elsif c.closed_at + make_interval(mins => (p_limits->>'cooldown_minutes_after_close')::integer) > now() then outcome := 'cooldown';
    elsif d.conversations >= (p_limits->>'max_new_conversations_per_visitor_day')::integer then outcome := 'daily_conversation_limit';
    elsif d.completed_rounds >= 30 or d.provider_attempts >= 36 then outcome := 'daily_limit';
    else
      c.conversation_id := gen_random_uuid(); c.completed_rounds := 0; c.provider_attempts := 0;
      c.closed_at := null; c.topic := 'unknown'; c.action := 'none'; c.contact_declined := false; c.last_result := null;
      d.conversations := d.conversations+1;
    end if;
  end if;
  update private.setter_conversations set conversation_id=c.conversation_id, completed_rounds=c.completed_rounds,
    provider_attempts=c.provider_attempts, topic=c.topic, action=c.action, contact_declined=c.contact_declined,
    capturing=c.capturing, last_result=c.last_result, closed_at=c.closed_at, updated_at=now() where visitor=p_visitor;
  update private.setter_daily set completed_rounds=d.completed_rounds, provider_attempts=d.provider_attempts,
    conversations=d.conversations where visitor=p_visitor and day=today;
  state := jsonb_build_object('conversation_id',c.conversation_id,'completed_rounds',c.completed_rounds,
    'provider_attempts',c.provider_attempts,'topic',c.topic,'action',c.action,'contact_declined',c.contact_declined,
    'capturing',c.capturing,'closed',c.closed_at is not null or c.completed_rounds >= 10 or c.provider_attempts >= 12,
    'daily_completed_rounds',d.completed_rounds,'daily_provider_attempts',d.provider_attempts,'daily_new_conversations',d.conversations,
    'busy',busy,'can_send',c.closed_at is null and c.completed_rounds<10 and c.provider_attempts<12
      and d.completed_rounds<30 and d.provider_attempts<36 and not c.capturing and not busy,
    'restart_at',c.closed_at+interval '30 minutes','last_result',c.last_result);
  return jsonb_build_object('status',outcome,'state',state,'result',replay);
end;
$$;
revoke all on function public.setter_transition(uuid,text,jsonb,uuid,uuid,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.setter_transition(uuid,text,jsonb,uuid,uuid,text,jsonb,jsonb) to service_role;

create function public.setter_save_contact(p_visitor uuid,p_conversation uuid,p_request uuid,p_hash text,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  c private.setter_conversations%rowtype;
  existing public.interest_registrations%rowtype;
begin
  -- Serialize contact completion with conversation operations and other tabs.
  select * into c from private.setter_conversations where visitor=p_visitor for update;
  if not found then return jsonb_build_object('status','session_required'); end if;
  select * into existing from public.interest_registrations where lead_request_id=p_request;
  if found then
    if existing.lead_fingerprint=p_hash then return jsonb_build_object('status','saved'); end if;
    return jsonb_build_object('status','request_conflict');
  end if;
  if c.conversation_id != p_conversation or not c.capturing then
    return jsonb_build_object('status','capture_required');
  end if;
  insert into public.interest_registrations(interest,full_name,email,phone,source,contact_channel,
    contact_consent,contact_accepted_at,privacy_consent,privacy_version,updates_consent,lead_request_id,lead_fingerprint)
  values(p_record->>'interest',p_record->>'full_name',p_record->>'email',p_record->>'phone','chatbot',p_record->>'contact_channel',
    (p_record->>'contact_consent')::boolean,now(),(p_record->>'privacy_consent')::boolean,p_record->>'privacy_version',
    (p_record->>'updates_consent')::boolean,p_request,p_hash);
  update private.setter_conversations set capturing=false,action='none',updated_at=now() where visitor=p_visitor;
  return jsonb_build_object('status','saved');
exception
  when unique_violation then return jsonb_build_object('status','request_conflict');
  when raise_exception then
    if sqlerrm='interest_rate_limited' then return jsonb_build_object('status','rate_limited'); end if;
    raise;
end;
$$;
revoke all on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) to service_role;
