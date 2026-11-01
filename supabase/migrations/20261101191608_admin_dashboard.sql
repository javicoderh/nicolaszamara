-- Administrative tables remain private; the only entry point is a server RPC.
create table private.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (length(username) between 1 and 80),
  password_hash text not null check (password_hash ~ '^pbkdf2_sha256\$600000\$[0-9a-f]{32}\$[0-9a-f]{64}$'),
  version integer not null default 1,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  password_changed_at timestamptz not null default now()
);
create table private.admin_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references private.admin_users(id) on delete cascade,
  user_version integer not null,
  expires_at timestamptz not null default (now() + interval '8 hours')
);
create index admin_sessions_user_idx on private.admin_sessions(user_id);
create index admin_sessions_expiry_idx on private.admin_sessions(expires_at);
create index interest_admin_pagination_idx on public.interest_registrations(created_at desc, id desc);
alter table private.admin_users enable row level security;
alter table private.admin_sessions enable row level security;
revoke all on private.admin_users, private.admin_sessions from public, anon, authenticated;
grant select, insert, update, delete on private.admin_users, private.admin_sessions to service_role;

create function public.admin_access(p_operation text, p_values jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_user private.admin_users%rowtype;
  v_id uuid;
  v_rows jsonb;
  v_summary jsonb;
  v_total bigint;
  v_start timestamptz;
  v_end timestamptz;
  v_interest text;
  v_cursor_at timestamptz;
  v_cursor_id uuid;
begin
  if p_operation = 'login_begin' then
    select * into v_user from private.admin_users
      where username = p_values->>'username' for update;
    if not found then return jsonb_build_object('status','invalid_credentials'); end if;
    if v_user.window_started_at <= now() - interval '15 minutes' then
      v_user.attempts := 0;
      v_user.window_started_at := now();
    end if;
    if v_user.attempts >= 5 then return jsonb_build_object('status','rate_limited'); end if;
    update private.admin_users set attempts = v_user.attempts + 1, window_started_at = v_user.window_started_at where id = v_user.id;
    return jsonb_build_object('status','challenge','user_id',v_user.id,'password_hash',v_user.password_hash);
  end if;

  if p_operation = 'login_finish' then
    select * into v_user from private.admin_users where id = (p_values->>'user_id')::uuid for update;
    if not found or v_user.password_hash <> p_values->>'expected_hash' then
      return jsonb_build_object('status','invalid_credentials');
    end if;
    delete from private.admin_sessions where expires_at <= now();
    insert into private.admin_sessions(token_hash,user_id,user_version)
      values(p_values->>'token_hash', v_user.id, v_user.version);
    update private.admin_users set attempts=0, window_started_at=now() where id=v_user.id;
    return jsonb_build_object('status','authenticated','username',v_user.username);
  end if;

  select u.* into v_user from private.admin_sessions s join private.admin_users u on u.id=s.user_id
    where s.token_hash=p_values->>'token_hash' and s.expires_at>now() and s.user_version=u.version
    for update of u;
  if not found then return jsonb_build_object('status','unauthorized'); end if;
  if p_operation='session' then
    return jsonb_build_object('status','authenticated','username',v_user.username);
  elsif p_operation='logout' then
    delete from private.admin_sessions where token_hash=p_values->>'token_hash';
    return jsonb_build_object('status','signed_out');
  elsif p_operation='password' then
    if v_user.password_hash <> p_values->>'expected_hash' then return jsonb_build_object('status','unauthorized'); end if;
    update private.admin_users set password_hash=p_values->>'new_hash',version=version+1,password_changed_at=now(),attempts=0,window_started_at=now()
      where id=v_user.id;
    delete from private.admin_sessions where user_id=v_user.id;
    return jsonb_build_object('status','password_changed');
  elsif p_operation='detail' then
    select jsonb_build_object(
      'id',id,'interest',interest,'full_name',full_name,'email',email,'phone',phone,
      'country',country,'city',city,'experience',experience,'contact_preference',contact_preference,
      'contact_channel',contact_channel,'source',source,'source_path',source_path,
      'created_at',created_at,'management_status',management_status,'privacy_consent',privacy_consent,
      'privacy_version',privacy_version,'privacy_accepted_at',privacy_accepted_at,
      'contact_consent',contact_consent,'contact_accepted_at',contact_accepted_at,'updates_consent',updates_consent
    ) into v_rows from public.interest_registrations where id=(p_values->>'id')::uuid;
    if v_rows is null then return jsonb_build_object('status','not_found'); end if;
    return jsonb_build_object('status','ready','record',v_rows);
  elsif p_operation <> 'interests' then
    raise exception 'invalid_admin_operation';
  end if;
  v_start := (p_values->>'start')::timestamptz;
  v_end := (p_values->>'end')::timestamptz;
  v_interest := p_values->>'interest';
  v_cursor_at := (p_values->>'cursor_at')::timestamptz;
  v_cursor_id := (p_values->>'cursor_id')::uuid;
  select count(*) into v_total from public.interest_registrations;
  select jsonb_build_object(
    'total', count(*),
    'consultation', count(*) filter(where interest='consultation'),
    'course', count(*) filter(where interest='course'),
    'online', count(*) filter(where interest='online'),
    'nature', count(*) filter(where interest='nature'),
    'new', count(*) filter(where management_status='new'),
    'form', count(*) filter(where source='form'),
    'chatbot', count(*) filter(where source='chatbot')
  ) into v_summary from public.interest_registrations
    where (v_start is null or created_at>=v_start) and (v_end is null or created_at<v_end)
      and (v_interest is null or interest=v_interest);
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id desc),'[]'::jsonb) into v_rows
    from (select id,created_at,full_name,interest,source,contact_preference,management_status
      from public.interest_registrations
      where (v_start is null or created_at>=v_start) and (v_end is null or created_at<v_end)
        and (v_interest is null or interest=v_interest)
        and (v_cursor_at is null or (created_at,id)<(v_cursor_at,v_cursor_id))
      order by created_at desc,id desc limit 21) t;
  return jsonb_build_object('status','ready','all_total',v_total,'summary',v_summary,
    'items', case when jsonb_array_length(v_rows)>20 then v_rows-20 else v_rows end,
    'next_cursor', case when jsonb_array_length(v_rows)>20 then
      jsonb_build_object('created_at',v_rows->19->>'created_at','id',v_rows->19->>'id') else null end);
end $$;
revoke all on function public.admin_access(text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_access(text,jsonb) to service_role;
