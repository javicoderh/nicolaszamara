alter table private.blog_jobs add column attempts integer not null default 1;
alter function public.blog_worker_tick(text,jsonb) rename to blog_worker_tick_v1;
create function public.blog_worker_tick(p_operation text,p_values jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare j private.blog_jobs%rowtype; result jsonb;
begin
  perform pg_advisory_xact_lock(7384912);
  if p_operation<>'acquire' then
    select * into j from private.blog_jobs where id=(p_values->>'id')::uuid for update;
    if not found or j.state<>'processing' or j.engine<>'api' or j.worker_token is distinct from (p_values->>'worker_token')::uuid or j.worker_until<=now() then
      return jsonb_build_object('status','conflict'); end if;
    if p_operation in ('advance','clarify','fail') then
      update private.blog_jobs set artifacts=artifacts||jsonb_build_object(j.stage||'_record',jsonb_build_object(
        'stage',j.stage,'attempt',j.attempts,'responseId',coalesce(p_values->>'response_id',j.provider_response_id),'usage',p_values->'usage',
        'protocolVersion','nz-blog-v1','finishedAt',now(),'error',p_values->>'error')) where id=j.id;
    end if;
  end if;
  result:=public.blog_worker_tick_v1(p_operation,p_values);
  -- Dispatch the next stage immediately; cron remains a recovery mechanism.
  if p_operation='advance' and result->>'status'='ready' then perform public.blog_dispatch_worker(); end if;
  return result;
end $$;
revoke all on function public.blog_worker_tick(text,jsonb) from public,anon,authenticated;
grant execute on function public.blog_worker_tick(text,jsonb) to service_role;

alter function public.blog_admin(text,jsonb,text,boolean) rename to blog_admin_v2;
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; j private.blog_jobs%rowtype;
begin
  if p_operation not in ('job_retry','jobs') then return public.blog_admin_v2(p_operation,p_values,p_token,p_local); end if;
  result:=public.blog_admin_core('list','{}',p_token,p_local);
  if result->>'status'<>'ready' then return result; end if;
  if p_operation='jobs' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]') into result from
      (select id,idea,engine,state,stage,result_id,error_code,attempts,version,created_at,updated_at,reserved_micro_usd,
        artifacts->'savedIdea' as saved_idea from private.blog_jobs order by created_at desc limit 100) x;
    return jsonb_build_object('status','ready','items',result);
  end if;
  perform pg_advisory_xact_lock(7384912);
  select * into j from private.blog_jobs where id=(p_values->>'id')::uuid for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if j.attempts>=3 or j.state<>'failed' then return jsonb_build_object('status','retry_limit'); end if;
  update private.blog_jobs set attempts=attempts+1,artifacts=artifacts||jsonb_build_object('attempt_'||attempts,artifacts),updated_at=now() where id=j.id;
  return public.blog_admin_v2(p_operation,p_values,p_token,p_local);
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;

create function private.blog_freeze_brief() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.brief is not null and old.brief is distinct from new.brief then raise exception 'brief_snapshot_immutable'; end if;
  return new;
end $$;
revoke all on function private.blog_freeze_brief() from public,anon,authenticated;
create trigger blog_brief_snapshot before update of brief on private.blog_jobs for each row execute function private.blog_freeze_brief();
