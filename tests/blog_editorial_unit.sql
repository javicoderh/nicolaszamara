-- Manual transactional checks; fixtures are always rolled back by the caller.
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); doc jsonb; result jsonb; token uuid;
begin
 doc:='{"slug":"editorial-check-a","title":"Primera lectura","category":"naturaleza","cover":"/blog-media/cover-test","coverAlt":"Bosque","bodyImage":{"src":"/blog-media/body-test","alt":"Sendero"},"document":{"version":1,"blocks":[]}}';
 perform public.blog_admin('create',jsonb_build_object('id',a,'document',doc),null,true);
 perform public.blog_admin('create',jsonb_build_object('id',b,'document',doc||'{"slug":"editorial-check-b"}'),null,true);
 perform public.blog_admin('publish',jsonb_build_object('id',a,'version',1),null,true);
 perform public.blog_admin('publish',jsonb_build_object('id',b,'version',1),null,true);
 if public.blog_admin('reorder',jsonb_build_object('items',jsonb_build_array(jsonb_build_object('id',a,'version',1))),null,true)->>'status'<>'conflict' then raise exception 'partial order accepted'; end if;
 result:=public.blog_admin('move',jsonb_build_object('id',b,'version',1,'position',0),null,true);
 if result->>'status'<>'ready' or (select position from private.blog_articles where id=b)<>0 then raise exception 'global move failed'; end if;
 if public.blog_admin('move',jsonb_build_object('id',b,'version',1,'position',1),null,true)->>'status'<>'conflict' then raise exception 'stale order accepted'; end if;
 if public.blog_admin('category_delete','{"id":"naturaleza"}',null,true)->>'status'<>'category_in_use' then raise exception 'used category removed'; end if;
 if public.blog_admin('revision',jsonb_build_object('id',a,'revision',1),null,true)->>'status'<>'ready' then raise exception 'revision unavailable'; end if;
 if jsonb_array_length(public.blog_related('editorial-check-a')->'items')<>1 then raise exception 'related selection failed'; end if;
 perform public.blog_admin('idea_save',jsonb_build_object('id',j,'idea','Idea privada guardada'),null,true);
 if public.blog_worker_tick('acquire','{}')->>'status'<>'empty' then raise exception 'saved idea executed'; end if;
 perform public.blog_admin('idea_start',jsonb_build_object('id',j),null,true);
 result:=public.blog_worker_tick('acquire','{}'); token:=(result->'job'->>'worker_token')::uuid;
 if token is null then raise exception 'saved idea did not start'; end if;
 perform public.blog_worker_tick('advance',jsonb_build_object('id',j,'worker_token',token,'output','{"sources":[]}', 'usage','{"model":"test"}'));
 if not exists(select 1 from private.blog_jobs where id=j and artifacts ? 'brief_record' and brief is not null and stage='draft') then raise exception 'stage trace missing'; end if;
 begin
   update private.blog_jobs set brief='{"changed":true}' where id=j;
   raise exception 'brief mutation accepted';
 exception when raise_exception then if sqlerrm<>'brief_snapshot_immutable' then raise; end if;
 end;
end $$;
select 'blog_editorial_unit_passed' as result;
