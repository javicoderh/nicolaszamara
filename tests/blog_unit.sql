-- Unit tests for publication isolation and exclusive job ownership. No retained data.
do $$
declare ident uuid:=gen_random_uuid(); jobid uuid:=gen_random_uuid(); leaseid uuid;
  result jsonb; snapshot jsonb;
begin
  snapshot:='{"slug":"blog-unit-test","title":"Primera versión","category":"naturaleza","cover":"/blog-media/opening-test","coverAlt":"Bosque","bodyImage":{"src":"/blog-media/interior-test","alt":"Sendero"},"document":{"version":1,"blocks":[]}}';
  result:=public.blog_admin('create',jsonb_build_object('id',ident,'document',snapshot),null,true);
  if result->>'status'<>'ready' then raise exception 'create failed'; end if;
  if public.blog_read('blog-unit-test')->>'status'<>'not_found' then raise exception 'draft exposed'; end if;
  if (public.blog_media_visible('/blog-media/interior-test')->>'visible')::boolean then raise exception 'draft media exposed'; end if;
  perform public.blog_admin('publish',jsonb_build_object('id',ident,'version',1),null,true);
  if not (public.blog_media_visible('/blog-media/interior-test')->>'visible')::boolean then raise exception 'published interior hidden'; end if;
  perform public.blog_admin('save',jsonb_build_object('id',ident,'version',1,'document',snapshot||'{"title":"Borrador privado"}'::jsonb),null,true);
  if public.blog_read('blog-unit-test')->'article'->>'title'<>'Primera versión' then raise exception 'draft changed publication'; end if;
  if public.blog_admin('save',jsonb_build_object('id',ident,'version',1,'document',snapshot),null,true)->>'status'<>'conflict' then raise exception 'stale write accepted'; end if;
  perform public.blog_admin('detail',jsonb_build_object('id',ident),null,true);
  if public.blog_admin('list','{}',null,false)->>'status'<>'unauthorized' then raise exception 'missing session accepted'; end if;
  perform public.blog_admin('job_create',jsonb_build_object('id',jobid,'idea','Idea sintética','engine','codex_session'),null,true);
  if public.blog_job_transition('claim','api')->>'status'<>'empty' then raise exception 'local job claimed by api'; end if;
  result:=public.blog_job_transition('claim','codex_session',jobid);
  leaseid:=(result->'job'->>'lease')::uuid;
  if leaseid is null then raise exception 'no lease'; end if;
  if public.blog_job_transition('claim','api')->>'status'<>'busy' then raise exception 'parallel claim accepted'; end if;
  if public.blog_job_transition('complete','codex_session',jobid,gen_random_uuid(),'{}')->>'status'<>'conflict' then raise exception 'wrong owner'; end if;
  if public.blog_job_transition('complete','codex_session',jobid,leaseid,'{}')->>'status'<>'invalid' then raise exception 'missing artifacts accepted'; end if;
  perform public.blog_admin('archive',jsonb_build_object('id',ident,'version',2),null,true);
  if public.blog_read('blog-unit-test')->>'status'<>'not_found' then raise exception 'archive exposed'; end if;
  if (public.blog_media_visible('/blog-media/interior-test')->>'visible')::boolean then raise exception 'archived media exposed'; end if;
  if has_table_privilege('anon','private.blog_jobs','select') or has_function_privilege('anon','public.blog_admin(text,jsonb,text,boolean)','execute') then raise exception 'public admin access'; end if;
end $$;
select 'blog_unit_passed' as result;
