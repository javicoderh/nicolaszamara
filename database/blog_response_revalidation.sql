-- Recheck a saved response after a validation fix, without another provider POST.
alter function public.blog_admin(text,jsonb,text,boolean) rename to blog_admin_v4;
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; j private.blog_jobs%rowtype; rechecks integer;
begin
 if p_operation<>'job_revalidate' then return public.blog_admin_v4(p_operation,p_values,p_token,p_local); end if;
 result:=public.blog_admin_core('list','{}',p_token,p_local);
 if result->>'status'<>'ready' then return result; end if;
 perform pg_advisory_xact_lock(7384912);
 select * into j from private.blog_jobs where id=(p_values->>'id')::uuid for update;
 if not found then return jsonb_build_object('status','not_found'); end if;
 if j.engine<>'api' or j.state<>'failed' or j.provider_response_id is null
   or j.provider_response_id !~ '^resp_[a-zA-Z0-9_-]+$'
   or coalesce(j.error_code,'') !~ '^(invalid_|insufficient_|article_|sources_|unsupported_|source_)' then
   return jsonb_build_object('status','conflict'); end if;
 rechecks:=coalesce((j.artifacts->>'responseRevalidations')::integer,0);
 if rechecks>=3 then return jsonb_build_object('status','retry_limit'); end if;
 update private.blog_jobs set state='pending',error_code=null,worker_token=null,worker_until=null,lease=null,lease_until=null,
   artifacts=artifacts||jsonb_build_object('responseRevalidations',rechecks+1,
     'revalidationHistory',coalesce(artifacts->'revalidationHistory','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
       'at',now(),'stage',j.stage,'error',j.error_code,'responseId',j.provider_response_id))),updated_at=now()
   where id=j.id returning * into j;
 perform public.blog_dispatch_worker();
 return jsonb_build_object('status','ready','job',to_jsonb(j));
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;
