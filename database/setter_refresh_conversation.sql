-- Refresh clears conversational context while keeping visitor identity, daily counters and budget.
CREATE OR REPLACE FUNCTION public.setter_transition(p_visitor uuid, p_operation text, p_limits jsonb, p_conversation uuid DEFAULT NULL::uuid, p_request uuid DEFAULT NULL::uuid, p_hash text DEFAULT NULL::text, p_result jsonb DEFAULT NULL::jsonb, p_usage jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  if p_operation not in ('session','lookup','reserve','complete','fail','restart','refresh','start_capture','cancel_capture') then
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
  elsif outcome='ready' and p_operation in ('restart','refresh') then
    if p_operation='restart' and (busy or c.capturing or c.closed_at is null) then outcome := 'conversation_active';
    elsif busy then outcome := 'pending';
    elsif p_operation='refresh' and c.completed_rounds=0 and c.provider_attempts=0 and c.closed_at is null then
      -- An unused conversation can be cleared repeatedly without spending the daily conversation allowance.
      c.topic := 'unknown'; c.action := 'none'; c.contact_declined := false; c.last_result := null; c.capturing := false;
    elsif c.closed_at is not null and c.closed_at + make_interval(mins => (p_limits->>'cooldown_minutes_after_close')::integer) > now() then outcome := 'cooldown';
    elsif d.conversations >= (p_limits->>'max_new_conversations_per_visitor_day')::integer then outcome := 'daily_conversation_limit';
    elsif d.completed_rounds >= 30 or d.provider_attempts >= 36 then outcome := 'daily_limit';
    else
      c.conversation_id := gen_random_uuid(); c.completed_rounds := 0; c.provider_attempts := 0;
      c.closed_at := null; c.topic := 'unknown'; c.action := 'none'; c.contact_declined := false; c.last_result := null; c.capturing := false;
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
$function$;

revoke all on function public.setter_transition(uuid,text,jsonb,uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.setter_transition(uuid,text,jsonb,uuid,uuid,text,jsonb,jsonb) to service_role;
