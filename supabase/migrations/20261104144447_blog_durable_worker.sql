alter table private.blog_jobs add column worker_token uuid;
alter table private.blog_jobs add column worker_until timestamptz;
alter table private.blog_jobs add column submission_started boolean not null default false;
alter table private.blog_jobs add column reserved_micro_usd bigint not null default 0;
create table private.blog_worker_budget(day date primary key, reserved_micro_usd bigint not null default 0);
create table private.blog_worker_config(id boolean primary key default true check(id), endpoint text not null, secret text not null check(length(secret)>=32));
alter table private.blog_worker_budget enable row level security;
alter table private.blog_worker_config enable row level security;
revoke all on private.blog_worker_budget,private.blog_worker_config from public,anon,authenticated;
grant select,insert,update on private.blog_worker_budget,private.blog_worker_config to service_role;

create function private.blog_wake_worker() returns trigger language plpgsql security definer set search_path='' as $$
declare settings private.blog_worker_config%rowtype;
begin
  if new.engine<>'api' or new.state<>'pending' then return new; end if;
  select * into settings from private.blog_worker_config limit 1;
  if found then perform net.http_post(url:=settings.endpoint,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||settings.secret),body:='{}'::jsonb,timeout_milliseconds:=30000); end if;
  return new;
end $$;
revoke all on function private.blog_wake_worker() from public,anon,authenticated;
create trigger blog_job_wakeup after insert on private.blog_jobs for each row execute function private.blog_wake_worker();

create function public.blog_worker_tick(p_operation text,p_values jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare j private.blog_jobs%rowtype; result jsonb; next_stage text; today date:=(now() at time zone 'America/Santiago')::date;
begin
  perform pg_advisory_xact_lock(7384912);
  if p_operation='acquire' then
    if exists(select 1 from private.blog_jobs where state='processing' and
      ((engine='codex_session' and lease_until>now()) or worker_until>now())) then return jsonb_build_object('status','busy'); end if;
    select * into j from private.blog_jobs where engine='api' and state in ('pending','processing') order by created_at,id limit 1 for update;
    if not found then return jsonb_build_object('status','empty'); end if;
    update private.blog_jobs set state='processing',worker_token=gen_random_uuid(),worker_until=now()+interval '45 seconds',
      lease=coalesce(lease,gen_random_uuid()),lease_until=now()+interval '15 minutes',updated_at=now() where id=j.id returning * into j;
    return jsonb_build_object('status','ready','job',to_jsonb(j));
  end if;
  select * into j from private.blog_jobs where id=(p_values->>'id')::uuid for update;
  if not found or j.engine<>'api' or j.worker_token is distinct from (p_values->>'worker_token')::uuid
    or j.worker_until<=now() or j.state<>'processing' then return jsonb_build_object('status','conflict'); end if;
  if p_operation='reserve' then
    if j.submission_started then
      update private.blog_jobs set state='failed',error_code='submission_uncertain_reconcile',worker_until=null where id=j.id;
      return jsonb_build_object('status','uncertain');
    end if;
    -- Conservative reservation: whole maximum context at configured model's standard rates.
    -- Reservations are retained on failure; they are not the actual measured invoice.
    insert into private.blog_worker_budget(day) values(today) on conflict do nothing;
    if j.reserved_micro_usd+3000000 > coalesce((p_values->>'job_limit')::bigint,0) then
      update private.blog_jobs set state='failed',error_code='job_budget_exhausted',worker_until=null where id=j.id;
      return jsonb_build_object('status','budget_exhausted'); end if;
    update private.blog_worker_budget set reserved_micro_usd=reserved_micro_usd+3000000 where day=today
      and reserved_micro_usd+3000000<=coalesce((p_values->>'daily_limit')::bigint,0);
    if not found then
      update private.blog_jobs set state='failed',error_code='daily_budget_exhausted',worker_until=null where id=j.id;
      return jsonb_build_object('status','budget_exhausted'); end if;
    update private.blog_jobs set submission_started=true,reserved_micro_usd=reserved_micro_usd+3000000 where id=j.id;
    return jsonb_build_object('status','ready');
  elsif p_operation='pending' then
    update private.blog_jobs set provider_response_id=p_values->>'response_id',worker_until=null where id=j.id;
  elsif p_operation='clarify' then
    update private.blog_jobs set state='needs_input',artifacts=artifacts||jsonb_build_object('question',p_values->>'question'),worker_until=null where id=j.id;
  elsif p_operation='fail' then
    update private.blog_jobs set state='failed',error_code=p_values->>'error',worker_until=null where id=j.id;
  elsif p_operation='advance' then
    if j.stage='final' then
      result:=public.blog_job_transition('complete','api',j.id,j.lease,jsonb_build_object('document',p_values->'output'));
      if result->>'status'<>'ready' then return result; end if;
    else
      next_stage:=case j.stage when 'brief' then 'draft' when 'draft' then 'critique' when 'critique' then 'final' end;
      update private.blog_jobs set brief=case when stage='brief' then p_values->'output' else brief end,
        artifacts=artifacts||jsonb_build_object(stage,p_values->'output',stage||'_usage',p_values->'usage'),
        stage=next_stage,provider_response_id=null,submission_started=false,worker_until=null,updated_at=now() where id=j.id;
    end if;
  else return jsonb_build_object('status','invalid'); end if;
  return jsonb_build_object('status','ready');
end $$;
revoke all on function public.blog_worker_tick(text,jsonb) from public,anon,authenticated;
grant execute on function public.blog_worker_tick(text,jsonb) to service_role;

-- Configure only after deploying the authenticated worker. No account secrets in migration.
create function public.blog_configure_worker(p_endpoint text,p_secret text) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if p_endpoint !~ '^https://[a-zA-Z0-9.-]+/api/blog_worker$' or length(p_secret)<32 then raise exception 'invalid_worker_config'; end if;
  insert into private.blog_worker_config(id,endpoint,secret) values(true,p_endpoint,p_secret)
    on conflict(id) do update set endpoint=excluded.endpoint,secret=excluded.secret;
  return jsonb_build_object('status','ready');
end $$;
revoke all on function public.blog_configure_worker(text,text) from public,anon,authenticated;
grant execute on function public.blog_configure_worker(text,text) to service_role;

create function public.blog_dispatch_worker() returns void language plpgsql security invoker set search_path='' as $$
declare settings private.blog_worker_config%rowtype;
begin
  select * into settings from private.blog_worker_config limit 1;
  if not found then return; end if;
  if exists(select 1 from private.blog_jobs where engine='api' and state in ('pending','processing')) then
    perform net.http_post(url:=settings.endpoint,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||settings.secret),body:='{}'::jsonb,timeout_milliseconds:=30000);
  end if;
end $$;
revoke all on function public.blog_dispatch_worker() from public,anon,authenticated;
grant execute on function public.blog_dispatch_worker() to service_role;
