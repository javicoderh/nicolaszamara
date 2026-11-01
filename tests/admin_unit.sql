-- Unit checks with a synthetic administrator; no real contacts are created.
begin;
set local role service_role;
do $$
declare
  h text := 'pbkdf2_sha256$600000$' || repeat('a',32) || '$' || repeat('b',64);
  u uuid;
  result jsonb;
  total bigint;
begin
  insert into private.admin_users(username,password_hash) values('__admin_unit__',h) returning id into u;
  result := public.admin_access('login_begin',jsonb_build_object('username','__admin_unit__'));
  if result->>'status'<>'challenge' then raise exception 'missing_challenge'; end if;
  result := public.admin_access('login_finish',jsonb_build_object('user_id',u,'expected_hash','wrong','token_hash',repeat('a',64)));
  if result->>'status'<>'invalid_credentials' then raise exception 'race_hash_not_checked'; end if;
  result := public.admin_access('login_finish',jsonb_build_object('user_id',u,'expected_hash',h,'token_hash',repeat('a',64)));
  if result->>'status'<>'authenticated' then raise exception 'login_failed'; end if;
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('f',64)));
  if result->>'status'<>'unauthorized' then raise exception 'unauthorized_read'; end if;
  select count(*) into total from public.interest_registrations;
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('a',64)));
  if (result->>'all_total')::bigint<>total or (result->'summary'->>'total')::bigint<>total then raise exception 'incomplete_summary'; end if;
  if jsonb_array_length(result->'items')>20 then raise exception 'unbounded_page'; end if;
  if result::text like '%lead_fingerprint%' then raise exception 'private_field_exposed'; end if;
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('a',64),'start','2099-01-01T00:00:00Z'));
  if jsonb_array_length(result->'items')<>0 then raise exception 'date_filter_failed'; end if;
  update private.admin_sessions set expires_at=now()-interval '1 minute' where token_hash=repeat('a',64);
  result := public.admin_access('session',jsonb_build_object('token_hash',repeat('a',64)));
  if result->>'status'<>'unauthorized' then raise exception 'expired_session_read'; end if;
  update private.admin_sessions set expires_at=now()+interval '1 hour' where token_hash=repeat('a',64);
  result := public.admin_access('password',jsonb_build_object('token_hash',repeat('a',64),'expected_hash',h,'new_hash',replace(h,repeat('b',64),repeat('c',64))));
  if result->>'status'<>'password_changed' then raise exception 'password_change_failed'; end if;
  if exists(select 1 from private.admin_sessions where user_id=u) then raise exception 'sessions_not_revoked'; end if;
  for i in 1..5 loop perform public.admin_access('login_begin',jsonb_build_object('username','__admin_unit__')); end loop;
  result := public.admin_access('login_begin',jsonb_build_object('username','__admin_unit__'));
  if result->>'status'<>'rate_limited' then raise exception 'rate_limit_failed'; end if;
  if has_function_privilege('anon','public.admin_access(text,jsonb)','execute') or has_function_privilege('authenticated','public.admin_access(text,jsonb)','execute') then raise exception 'public_rpc_access'; end if;
  if has_table_privilege('anon','private.admin_users','select') or has_table_privilege('authenticated','private.admin_sessions','select') then raise exception 'public_credentials_access'; end if;
end $$;
select 'admin_unit_passed' as result;
rollback;
