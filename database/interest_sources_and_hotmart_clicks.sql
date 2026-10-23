alter table public.interest_registrations add column source_path text;
alter table public.interest_registrations add constraint interest_source_path check (
  source_path is null or (char_length(source_path) <= 120 and source_path ~ '^/[A-Za-z0-9/_-]*$')
);
grant insert(source_path) on public.interest_registrations to anon;
create index interest_source_path_created on public.interest_registrations(source,source_path,created_at desc);

create or replace function public.setter_save_contact(p_visitor uuid,p_conversation uuid,p_request uuid,p_hash text,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c private.setter_conversations%rowtype; existing public.interest_registrations%rowtype;
begin
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
  insert into public.interest_registrations(interest,full_name,email,phone,source,source_path,contact_channel,contact_preference,
    contact_consent,contact_accepted_at,privacy_consent,privacy_version,updates_consent,lead_request_id,lead_fingerprint)
  values(p_record->>'interest',p_record->>'full_name',p_record->>'email',p_record->>'phone','chatbot',p_record->>'source_path',
    p_record->>'contact_preference',p_record->>'contact_preference',
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
revoke all on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) to service_role;

create table private.hotmart_click_events (
  event_id uuid primary key,
  visitor uuid not null,
  source text not null check (source in ('chatbot','course','home')),
  source_path text not null check (char_length(source_path) <= 120 and source_path ~ '^/[A-Za-z0-9/_-]*$'),
  created_at timestamptz not null default now(),
  check ((source='course' and source_path='/cursos') or (source='home' and source_path='/') or source='chatbot')
);
create index hotmart_events_visitor_created on private.hotmart_click_events(visitor,created_at desc);
create table private.hotmart_click_counts (
  visitor uuid not null,
  source text not null check (source in ('chatbot','course','home')),
  click_count bigint not null default 0 check (click_count >= 0),
  first_clicked_at timestamptz not null default now(),
  last_clicked_at timestamptz not null default now(),
  primary key (visitor,source)
);
alter table private.hotmart_click_events enable row level security;
alter table private.hotmart_click_counts enable row level security;
revoke all on private.hotmart_click_events,private.hotmart_click_counts from public,anon,authenticated;
grant select,insert on private.hotmart_click_events to service_role;
grant select,insert,update on private.hotmart_click_counts to service_role;

create view private.hotmart_click_summary with (security_invoker=true) as
  select visitor,
    coalesce(sum(click_count) filter (where source='chatbot'),0)::bigint as chatbot_clicks,
    coalesce(sum(click_count) filter (where source='course'),0)::bigint as course_clicks,
    coalesce(sum(click_count) filter (where source='home'),0)::bigint as home_clicks,
    sum(click_count)::bigint as total_clicks,
    max(last_clicked_at) as last_clicked_at
  from private.hotmart_click_counts group by visitor;
revoke all on private.hotmart_click_summary from public,anon,authenticated;
grant select on private.hotmart_click_summary to service_role;

create or replace function public.record_hotmart_click(p_event uuid,p_visitor uuid,p_source text,p_source_path text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare existing private.hotmart_click_events%rowtype;
begin
  if p_source not in ('chatbot','course','home') or p_source is null or p_visitor is null or p_event is null
    or p_source_path is null or char_length(p_source_path)>120 or p_source_path !~ '^/[A-Za-z0-9/_-]*$'
    or (p_source='course' and p_source_path<>'/cursos') or (p_source='home' and p_source_path<>'/') then
    return jsonb_build_object('status','invalid');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_visitor::text,97241));
  select * into existing from private.hotmart_click_events where event_id=p_event;
  if found then
    if existing.visitor=p_visitor and existing.source=p_source and existing.source_path=p_source_path then
      return jsonb_build_object('status','recorded');
    end if;
    return jsonb_build_object('status','conflict');
  end if;
  if (select count(*) from private.hotmart_click_events where visitor=p_visitor
      and created_at>now()-interval '1 minute') >= 60 then
    return jsonb_build_object('status','rate_limited');
  end if;
  insert into private.hotmart_click_events(event_id,visitor,source,source_path)
    values(p_event,p_visitor,p_source,p_source_path) on conflict do nothing;
  if not found then return jsonb_build_object('status','conflict'); end if;
  insert into private.hotmart_click_counts(visitor,source,click_count)
    values(p_visitor,p_source,1)
    on conflict(visitor,source) do update set
      click_count=private.hotmart_click_counts.click_count+1,last_clicked_at=now();
  return jsonb_build_object('status','recorded');
end;
$$;
revoke all on function public.record_hotmart_click(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_hotmart_click(uuid,uuid,text,text) to service_role;
