do $$
declare id uuid:=gen_random_uuid(); result jsonb; token uuid;
begin
  perform public.blog_admin('job_create',jsonb_build_object('id',id,'idea','Idea de prueba','engine','api'),null,true);
  result:=public.blog_worker_tick('acquire','{}');
  token:=(result->'job'->>'worker_token')::uuid;
  if token is null then raise exception 'worker not acquired'; end if;
  if public.blog_job_transition('claim','codex_session')->>'status'<>'busy' then raise exception 'local overlap'; end if;
  if public.blog_worker_tick('acquire','{}')->>'status'<>'busy' then raise exception 'worker overlap'; end if;
  if public.blog_worker_tick('reserve',jsonb_build_object('id',id,'worker_token',token,'job_limit',1,'daily_limit',1))->>'status'<>'budget_exhausted' then raise exception 'unbudgeted provider permitted'; end if;
  if exists(select 1 from private.blog_worker_budget where reserved_micro_usd>0) then raise exception 'denied reservation charged'; end if;
  if has_function_privilege('anon','public.blog_worker_tick(text,jsonb)','execute') then raise exception 'public worker'; end if;
end $$;
select 'blog_worker_unit_passed' as result;
