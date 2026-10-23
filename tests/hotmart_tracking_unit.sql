-- Execute inside BEGIN / ROLLBACK; no retained clicks or contacts.
set local role service_role;
do $$
declare v uuid:=gen_random_uuid(); event uuid:=gen_random_uuid(); item record; result jsonb;
begin
  result:=public.record_hotmart_click(event,v,'chatbot','/chatbot');
  assert result->>'status'='recorded', 'first click recorded';
  result:=public.record_hotmart_click(event,v,'chatbot','/chatbot');
  assert result->>'status'='recorded', 'retry is idempotent';
  result:=public.record_hotmart_click(event,gen_random_uuid(),'chatbot','/chatbot');
  assert result->>'status'='conflict', 'cannot reassign another visitor event';
  perform public.record_hotmart_click(gen_random_uuid(),v,'chatbot','/cursos');
  perform public.record_hotmart_click(gen_random_uuid(),v,'course','/cursos');
  perform public.record_hotmart_click(gen_random_uuid(),v,'home','/');
  select * into item from private.hotmart_click_summary where visitor=v;
  assert item.chatbot_clicks=2 and item.course_clicks=1 and item.home_clicks=1 and item.total_clicks=4,
    'separate atomic source counters';
  assert (select count(*) from private.hotmart_click_events where visitor=v)=4, 'no duplicated events';
  result:=public.record_hotmart_click(gen_random_uuid(),v,'course','/');
  assert result->>'status'='invalid', 'course source requires the course route';
  assert not has_function_privilege('anon','public.record_hotmart_click(uuid,uuid,text,text)','execute'), 'RPC is server-only';
  assert not has_table_privilege('anon','private.hotmart_click_counts','select'), 'no public counts';
  assert not has_table_privilege('authenticated','private.hotmart_click_summary','select'), 'no cross-user read';
end $$;
reset role;
