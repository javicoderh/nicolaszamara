do $$
<<recovery>>
declare ids uuid[]:='{}'; id uuid; result jsonb; token uuid; oldtoken uuid; n integer; stage integer; done_count integer;
begin
 -- More than three jobs continue serially without another browser action.
 for n in 1..5 loop
   id:=gen_random_uuid(); ids:=array_append(ids,id);
   perform public.blog_admin('job_create',jsonb_build_object('id',id,'idea','Solicitud de control '||n,'engine','api'),null,true);
   update private.blog_jobs set created_at=now()+n*interval '1 second' where private.blog_jobs.id=recovery.id;
 end loop;
 foreach id in array ids loop
   for stage in 1..4 loop
     result:=public.blog_worker_tick('acquire','{}');token:=(result->'job'->>'worker_token')::uuid;
     if result->'job'->>'id'<>id::text then raise exception 'FIFO broken'; end if;
     if public.blog_worker_tick('reserve',jsonb_build_object('id',id,'worker_token',token,'job_limit',12000000,'daily_limit',60000000))->>'status'<>'ready' then raise exception 'bounded reservation failed'; end if;
     result:=public.blog_worker_tick('advance',jsonb_build_object('id',id,'worker_token',token,'output',
       case stage when 1 then '{"sources":[]}'::jsonb when 2 then '{"text":"Borrador de control"}'::jsonb when 3 then '{"checks":[]}'::jsonb
         else jsonb_build_object('slug','recovery-test-'||id::text,'title','Muestra de control','category','naturaleza','document',jsonb_build_object('version',1,'blocks','[]'::jsonb)) end,
       'usage',jsonb_build_object('model','test-only','costMicroUsd',null)));
     if result->>'status'<>'ready' then raise exception 'advance failed at stage %',stage; end if;
   end loop;
   if public.blog_job_transition('complete','api',id,gen_random_uuid(),'{}')->>'status'<>'ready' then raise exception 'completion not idempotent'; end if;
   if public.blog_job_transition('complete','codex_session',id,gen_random_uuid(),'{}')->>'status'<>'conflict' then raise exception 'engine changed on completion'; end if;
 end loop;
 select count(*) into done_count from private.blog_jobs where private.blog_jobs.id=any(ids) and state='completed' and result_id is not null;
 if done_count<>5 then raise exception 'queue stopped after three'; end if;
 if exists(select 1 from public.blog_publications where public.blog_publications.id=any(ids)) then raise exception 'automatic publication'; end if;
 -- Expired worker tokens are fenced; cancellation rejects a late provider result.
 id:=gen_random_uuid();perform public.blog_admin('job_create',jsonb_build_object('id',id,'idea','Control de recuperacion','engine','api'),null,true);
 result:=public.blog_worker_tick('acquire','{}');oldtoken:=(result->'job'->>'worker_token')::uuid;
 update private.blog_jobs set worker_until=now()-interval '1 second' where private.blog_jobs.id=recovery.id;
 result:=public.blog_worker_tick('acquire','{}');token:=(result->'job'->>'worker_token')::uuid;
 if token=oldtoken or public.blog_worker_tick('advance',jsonb_build_object('id',id,'worker_token',oldtoken,'output','{}'))->>'status'<>'conflict' then raise exception 'expired worker accepted'; end if;
 perform public.blog_admin('job_cancel',jsonb_build_object('id',id),null,true);
 if public.blog_worker_tick('advance',jsonb_build_object('id',id,'worker_token',token,'output','{}'))->>'status'<>'conflict' then raise exception 'late cancelled result accepted'; end if;
 -- Retry count is bounded and prior records remain auditable.
 update private.blog_jobs set state='failed' where private.blog_jobs.id=recovery.id;
 perform public.blog_admin('job_retry',jsonb_build_object('id',id),null,true);
 update private.blog_jobs set state='failed' where private.blog_jobs.id=recovery.id;
 perform public.blog_admin('job_retry',jsonb_build_object('id',id),null,true);
 update private.blog_jobs set state='failed' where private.blog_jobs.id=recovery.id;
 if public.blog_admin('job_retry',jsonb_build_object('id',id),null,true)->>'status'<>'retry_limit' then raise exception 'unbounded retry'; end if;
end $$;
select 'blog_recovery_unit_passed' as result;
