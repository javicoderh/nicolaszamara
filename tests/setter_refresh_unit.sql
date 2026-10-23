-- Execute inside BEGIN / ROLLBACK: no provider calls or retained visitors.
set local role service_role;
do $$
declare
  v uuid:=gen_random_uuid(); closed_visitor uuid:=gen_random_uuid();
  conversation uuid; previous uuid; request uuid; result jsonb; budget_before bigint;
  today date:=(now() at time zone 'America/Santiago')::date;
  limits jsonb:='{"max_completed_rounds":10,"max_provider_attempts_per_conversation":12,"max_completed_rounds_per_visitor_day":30,"max_provider_attempts_per_visitor_day":36,"max_new_conversations_per_visitor_day":3,"cooldown_minutes_after_close":30,"daily_budget_micro_usd":900000000000,"reservation_micro_usd":1}';
  answer jsonb:='{"reply":"Refresh fixture","topic":"online","action":"show_hotmart","contact_declined":true,"stop":false}';
begin
  result:=public.setter_transition(v,'session',limits);
  conversation:=(result#>>'{state,conversation_id}')::uuid;
  result:=public.setter_transition(v,'refresh',limits,conversation);
  result:=public.setter_transition(v,'refresh',limits,conversation);
  assert result->>'status'='ready', 'an empty conversation remains ready';
  assert (select conversations from private.setter_daily where visitor=v and day=today)=1, 'empty refresh does not spend daily conversations';

  request:=gen_random_uuid();
  result:=public.setter_transition(v,'reserve',limits,conversation,request,'hash');
  assert result->>'status'='reserved', 'fixture reserved';
  result:=public.setter_transition(v,'complete',limits,conversation,request,null,answer,'{}');
  result:=public.setter_transition(v,'start_capture',limits,conversation);
  select reserved_micro_usd into budget_before from private.setter_budget where day=today;
  previous:=conversation;
  result:=public.setter_transition(v,'refresh',limits,conversation);
  conversation:=(result#>>'{state,conversation_id}')::uuid;
  assert result->>'status'='ready' and conversation<>previous, 'used conversation replaced';
  assert result#>>'{state,completed_rounds}'='0' and result#>>'{state,provider_attempts}'='0', 'per-conversation rounds reset';
  assert result#>>'{state,topic}'='unknown' and result#>>'{state,action}'='none', 'topic and action reset';
  assert result#>>'{state,capturing}'='false' and result#>>'{state,contact_declined}'='false', 'capture and declined contact reset';
  assert result#>'{state,last_result}'='null'::jsonb, 'previous result cleared';
  assert (select completed_rounds=1 and provider_attempts=1 and conversations=2 from private.setter_daily where visitor=v and day=today), 'daily usage preserved';
  assert (select reserved_micro_usd from private.setter_budget where day=today)=budget_before, 'global budget not reset';
  result:=public.setter_transition(v,'lookup',limits,previous,request,'hash');
  assert result->>'status'='conversation_changed', 'old tab cannot reuse its old conversation';

  request:=gen_random_uuid();
  result:=public.setter_transition(v,'reserve',limits,conversation,request,'hash');
  result:=public.setter_transition(v,'refresh',limits,conversation);
  assert result->>'status'='pending' and (result#>>'{state,conversation_id}')::uuid=conversation, 'pending work cannot be orphaned';
  result:=public.setter_transition(v,'fail',limits,conversation,request);
  result:=public.setter_transition(v,'refresh',limits,conversation);
  conversation:=(result#>>'{state,conversation_id}')::uuid;
  assert result->>'status'='ready', 'refresh works after the attempt settles';
  request:=gen_random_uuid();
  result:=public.setter_transition(v,'reserve',limits,conversation,request,'hash');
  result:=public.setter_transition(v,'complete',limits,conversation,request,null,answer,'{}');
  result:=public.setter_transition(v,'refresh',limits,conversation);
  assert result->>'status'='daily_conversation_limit', 'daily conversation ceiling preserved';
  update private.setter_daily set conversations=1,completed_rounds=30 where visitor=v and day=today;
  result:=public.setter_transition(v,'refresh',limits,conversation);
  assert result->>'status'='daily_limit', 'daily response ceiling preserved';

  result:=public.setter_transition(closed_visitor,'session',limits);
  conversation:=(result#>>'{state,conversation_id}')::uuid;
  update private.setter_conversations set closed_at=now(),completed_rounds=10 where visitor=closed_visitor;
  result:=public.setter_transition(closed_visitor,'refresh',limits,conversation);
  assert result->>'status'='cooldown', 'closed conversations keep their cooldown';
end $$;
reset role;
