alter function public.blog_admin(text,jsonb,text,boolean) rename to blog_admin_core;
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare answer jsonb; j private.blog_jobs%rowtype;
begin
  if p_operation not in ('job_cancel','job_reply','job_retry') then return public.blog_admin_core(p_operation,p_values,p_token,p_local); end if;
  answer:=public.blog_admin_core('list','{}',p_token,p_local);
  if answer->>'status'<>'ready' then return answer; end if;
  select * into j from private.blog_jobs where id=(p_values->>'id')::uuid for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if j.state='completed' then return jsonb_build_object('status','conflict'); end if;
  if p_operation='job_cancel' then
    update private.blog_jobs set state='cancelled',worker_token=null,lease=null,worker_until=null,updated_at=now() where id=j.id;
  elsif p_operation='job_reply' then
    if j.state<>'needs_input' or length(p_values->>'answer') not between 1 and 2000 or length(j.idea)+length(p_values->>'answer')>11950
      then return jsonb_build_object('status','invalid'); end if;
    update private.blog_jobs set idea=idea||E'\nAclaración del autor: '||(p_values->>'answer'),state='pending',provider_response_id=null,
      worker_token=null,worker_until=null,submission_started=false,updated_at=now() where id=j.id;
  elsif p_operation='job_retry' then
    if j.state<>'failed' then return jsonb_build_object('status','conflict'); end if;
    update private.blog_jobs set state='pending',provider_response_id=null,worker_token=null,worker_until=null,
      submission_started=false,error_code=null,updated_at=now() where id=j.id;
  end if;
  return jsonb_build_object('status','ready');
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;
create trigger blog_job_resume_wakeup after update of state on private.blog_jobs for each row when(new.state='pending' and old.state<>'pending') execute function private.blog_wake_worker();

create function public.blog_sitemap() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('status','ready','items',coalesce(jsonb_agg(jsonb_build_object('slug',slug,'updatedAt',updated_at)),'[]'))
  from public.blog_publications where coalesce(document->>'crawlPolicy','index')='index';
$$;
revoke all on function public.blog_sitemap() from public;
grant execute on function public.blog_sitemap() to anon,authenticated,service_role;
