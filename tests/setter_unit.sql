-- Unit tests of database functions, run in a transaction ending in ROLLBACK.
-- No provider/network calls and no retained contacts. Run after loading setter.sql.
set local role service_role;
do $$
declare
  v_visitor uuid := gen_random_uuid();
  other_visitor uuid := gen_random_uuid();
  conversation uuid;
  v_request_id uuid;
  lead_id uuid := gen_random_uuid();
  limits jsonb := '{"max_completed_rounds":10,"max_provider_attempts_per_conversation":12,"max_completed_rounds_per_visitor_day":30,"max_provider_attempts_per_visitor_day":36,"max_new_conversations_per_visitor_day":3,"cooldown_minutes_after_close":30,"daily_budget_micro_usd":900000000000,"reservation_micro_usd":1}';
  answer jsonb := '{"reply":"Approved unit response","topic":"course","action":"show_hotmart","contact_declined":false,"stop":false}';
  contact jsonb := '{"interest":"consultation","full_name":"Unit fixture","email":"setter-phone@example.invalid","phone":"+56900000000","contact_preference":"phone","contact_channel":"phone","contact_consent":true,"privacy_consent":true,"privacy_version":"2026-10-23-contact-v3","updates_consent":false}';
  result jsonb;
  v_day date := (now() at time zone 'America/Santiago')::date;
begin
  contact := contact || '{"source_path":"/chatbot"}'::jsonb;
  result := public.setter_transition(v_visitor,'session',limits);
  conversation := (result#>>'{state,conversation_id}')::uuid;
  assert result#>>'{state,daily_new_conversations}'='1', 'initial conversation counted';
  for i in 1..10 loop
    v_request_id := gen_random_uuid();
    result := public.setter_transition(v_visitor,'reserve',limits,conversation,v_request_id,'hash');
    assert result->>'status'='reserved', 'reserve';
    result := public.setter_transition(v_visitor,'reserve',limits,conversation,gen_random_uuid(),'hash');
    assert result->>'status'='pending', 'one active reservation per conversation';
    result := public.setter_transition(v_visitor,'complete',limits,conversation,v_request_id,null,answer,'{"input_tokens":10,"output_tokens":5}');
    assert result->>'status'='completed', 'complete';
    assert (result#>>'{state,completed_rounds}')::int=i, 'round counter';
  end loop;
  result := public.setter_transition(v_visitor,'reserve',limits,conversation,gen_random_uuid(),'hash');
  assert result->>'status'='conversation_closed', 'eleventh call blocked';
  result := public.setter_transition(v_visitor,'lookup',limits,conversation,v_request_id,'hash');
  assert result->>'status'='completed' and result->'result'=answer, 'completed replay after close';
  result := public.setter_transition(v_visitor,'lookup',limits,conversation,v_request_id,'changed');
  assert result->>'status'='request_conflict', 'request cannot change';
  result := public.setter_transition(v_visitor,'restart',limits,conversation);
  assert result->>'status'='cooldown', 'cooldown enforced';
  result := public.setter_transition(v_visitor,'start_capture',limits,conversation);
  assert result#>>'{state,capturing}'='true', 'capture available after close';
  result := public.setter_save_contact(v_visitor,conversation,lead_id,'contact-hash',contact);
  assert result->>'status'='saved', 'contact saved';
  result := public.setter_save_contact(v_visitor,conversation,lead_id,'contact-hash',contact);
  assert result->>'status'='saved', 'contact retry recovered';
  assert (select count(*) from public.interest_registrations where lead_request_id=lead_id)=1, 'no duplicate contact';
  assert exists(select 1 from public.interest_registrations where lead_request_id=lead_id
    and source='chatbot' and source_path='/chatbot'), 'chatbot origin persisted';
  result := public.setter_save_contact(v_visitor,conversation,lead_id,'changed',contact);
  assert result->>'status'='request_conflict', 'contact immutable after confirmation';
  result := public.setter_save_contact(v_visitor,conversation,gen_random_uuid(),'new',contact);
  assert result->>'status'='capture_required', 'capture must be opened again';
  update private.setter_conversations set closed_at=now()-interval '31 minutes' where setter_conversations.visitor=v_visitor;
  result := public.setter_transition(v_visitor,'restart',limits,conversation);
  assert result->>'status'='ready' and result#>>'{state,completed_rounds}'='0', 'restart after pause';
  conversation := (result#>>'{state,conversation_id}')::uuid;
  assert result#>>'{state,daily_completed_rounds}'='10', 'restart keeps daily counters';
  for i in 1..12 loop
    v_request_id := gen_random_uuid();
    result := public.setter_transition(v_visitor,'reserve',limits,conversation,v_request_id,'hash');
    assert result->>'status'='reserved', 'failed attempts can reserve';
    result := public.setter_transition(v_visitor,'fail',limits,conversation,v_request_id);
    assert result#>>'{state,completed_rounds}'='0', 'failures do not count as responses';
  end loop;
  result := public.setter_transition(v_visitor,'reserve',limits,conversation,gen_random_uuid(),'hash');
  assert result->>'status'='conversation_closed', 'attempt ceiling';
  update private.setter_conversations set closed_at=now()-interval '31 minutes' where setter_conversations.visitor=v_visitor;
  result := public.setter_transition(v_visitor,'restart',limits,conversation);
  conversation := (result#>>'{state,conversation_id}')::uuid;
  v_request_id := gen_random_uuid();
  result := public.setter_transition(v_visitor,'reserve',limits,conversation,v_request_id,'hash');
  update private.setter_requests set created_at=now()-interval '76 seconds' where setter_requests.visitor=v_visitor and setter_requests.request_id=v_request_id;
  result := public.setter_transition(v_visitor,'lookup',limits,conversation,v_request_id,'hash');
  assert result->>'status'='uncertain', 'expired reservation stays charged';
  assert result#>>'{state,busy}'='false', 'expired reservation releases conversation';
  update private.setter_daily set completed_rounds=30 where setter_daily.visitor=v_visitor and setter_daily.day=v_day;
  result := public.setter_transition(v_visitor,'reserve',limits,conversation,gen_random_uuid(),'hash');
  assert result->>'status'='daily_limit', 'daily response ceiling';
  update private.setter_daily set completed_rounds=10,provider_attempts=36 where setter_daily.visitor=v_visitor and setter_daily.day=v_day;
  result := public.setter_transition(v_visitor,'reserve',limits,conversation,gen_random_uuid(),'hash');
  assert result->>'status'='daily_limit', 'daily attempt ceiling';
  update private.setter_conversations set closed_at=now()-interval '31 minutes' where setter_conversations.visitor=v_visitor;
  result := public.setter_transition(v_visitor,'restart',limits,conversation);
  assert result->>'status'='daily_conversation_limit', 'daily conversation ceiling';
  assert not has_function_privilege('anon','public.setter_transition(uuid,text,jsonb,uuid,uuid,text,jsonb,jsonb)','EXECUTE'), 'anon cannot manage quotas';
  assert not has_function_privilege('authenticated','public.setter_save_contact(uuid,uuid,uuid,text,jsonb)','EXECUTE'), 'authenticated cannot bypass backend';
  assert not has_table_privilege('anon','private.setter_requests','SELECT'), 'requests private';
  result := public.setter_transition(other_visitor,'session',limits);
  conversation := (result#>>'{state,conversation_id}')::uuid;
  v_request_id := gen_random_uuid();
  result := public.setter_transition(other_visitor,'reserve',limits,conversation,v_request_id,'hash');
  assert result->>'status'='reserved', 'new visitor may reserve';
  update private.setter_requests set day=v_day-1 where setter_requests.visitor=other_visitor and setter_requests.request_id=v_request_id;
  result := public.setter_transition(other_visitor,'complete',limits,conversation,v_request_id,null,answer,'{}');
  assert result#>>'{state,daily_completed_rounds}'='1', 'completion belongs to current Santiago day';
  result := public.setter_transition(other_visitor,'reserve',limits || '{"daily_budget_micro_usd":1}',conversation,gen_random_uuid(),'hash');
  assert result->>'status'='global_budget_exhausted', 'global budget is shared across visitors';
end;
$$;
reset role;
-- Existing public forms still pass RLS and their original constraints.
set local role anon;
insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,city,privacy_consent,privacy_version)
values('nature','Unit fixture','setter-unit@example.invalid','+56900000001','video_call','Santiago',true,'2026-10-23-contact-v3');
insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,country,privacy_consent,privacy_version)
values('online','Unit fixture','setter-unit-online@example.invalid','+56900000002','whatsapp','Chile',true,'2026-10-23-contact-v3');
reset role;
