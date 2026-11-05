begin;
do $$
declare ident uuid:=gen_random_uuid(); result jsonb; j private.blog_jobs%rowtype;
begin
 if has_function_privilege('anon','public.blog_admin(text,jsonb,text,boolean)','execute')
   or has_function_privilege('authenticated','public.blog_admin(text,jsonb,text,boolean)','execute') then raise exception 'public_access'; end if;
 insert into private.blog_jobs(id,idea,engine,state,stage,provider_response_id,error_code,attempts,reserved_micro_usd,submission_started)
 values(ident,'Unit fixture','api','failed','brief','resp_saved_unit','invalid_url',2,6000000,true);
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident));
 if result->>'status'<>'unauthorized' then raise exception 'missing_auth'; end if;
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident),null,true);
 if result->>'status'<>'ready' then raise exception 'not_ready: %',result; end if;
 select * into j from private.blog_jobs where id=ident;
 if j.state<>'pending' or j.stage<>'brief' or j.provider_response_id<>'resp_saved_unit' or j.attempts<>2
   or j.reserved_micro_usd<>6000000 or not j.submission_started or j.worker_token is not null then raise exception 'response_not_preserved'; end if;
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident),null,true);
 if result->>'status'<>'conflict' then raise exception 'duplicate_revalidation'; end if;
 update private.blog_jobs set state='failed',error_code='invalid_url',artifacts=artifacts||' {"responseRevalidations":3}'::jsonb where id=ident;
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident),null,true);
 if result->>'status'<>'retry_limit' then raise exception 'unbounded_revalidation'; end if;
 update private.blog_jobs set artifacts='{}',engine='codex_session' where id=ident;
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident),null,true);
 if result->>'status'<>'conflict' then raise exception 'wrong_engine'; end if;
 update private.blog_jobs set engine='api',provider_response_id=null where id=ident;
 result:=public.blog_admin('job_revalidate',jsonb_build_object('id',ident),null,true);
 if result->>'status'<>'conflict' then raise exception 'missing_response'; end if;
end $$;
rollback;
