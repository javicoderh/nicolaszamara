-- Catalog operations use the same session validation and exclusive mutation lock.
create table public.blog_categories (
  id text primary key check(id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check(length(name) between 1 and 80),
  position integer not null default 0
);
insert into public.blog_categories(id,name,position) values
 ('naturaleza','Naturaleza',0),('terapias','Terapias',1),('flores-de-bach','Flores de Bach',2),('formacion','Formación',3);
alter table public.blog_categories enable row level security;
revoke all on public.blog_categories from public,anon,authenticated;
grant select on public.blog_categories to anon,authenticated;
grant select,insert,update,delete on public.blog_categories to service_role;
create policy blog_categories_read on public.blog_categories for select to anon,authenticated using(true);
alter function public.blog_admin(text,jsonb,text,boolean) rename to blog_admin_v1;
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare answer jsonb; a private.blog_articles%rowtype; entries jsonb; item jsonb; pos integer; ids uuid[]; existing uuid[];
begin
  if p_operation not in ('catalog','category_save','category_delete','move','revision','idea_save','idea_start','reorder','list') then
    return public.blog_admin_v1(p_operation,p_values,p_token,p_local);
  end if;
  answer:=public.blog_admin_core('list','{}',p_token,p_local);
  if answer->>'status'<>'ready' then return answer; end if;
  perform pg_advisory_xact_lock(7384911);
  if p_operation='catalog' then
    select coalesce(jsonb_agg(to_jsonb(c) order by c.position,c.id),'[]') into entries from public.blog_categories c;
    return jsonb_build_object('status','ready','items',entries);
  elsif p_operation='category_save' then
    insert into public.blog_categories(id,name,position) values(p_values->>'id',p_values->>'name',(p_values->>'position')::integer)
      on conflict(id) do update set name=excluded.name,position=excluded.position;
  elsif p_operation='category_delete' then
    if exists(select 1 from private.blog_articles where document->>'category'=p_values->>'id') or
       exists(select 1 from public.blog_publications where document->>'category'=p_values->>'id') or
       exists(select 1 from private.blog_jobs where brief->>'category'=p_values->>'id' and state in ('pending','processing')) then
      return jsonb_build_object('status','category_in_use'); end if;
    delete from public.blog_categories where id=p_values->>'id';
  elsif p_operation='list' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into entries from
      (select id,state,version,published_version,position,featured,created_at,updated_at,document->>'author' author,
        document->>'title' title,document->>'category' category from private.blog_articles order by updated_at desc limit 500) x;
    return jsonb_build_object('status','ready','items',entries);
  elsif p_operation='revision' then
    select document into entries from private.blog_revisions where article_id=(p_values->>'id')::uuid and version=(p_values->>'revision')::integer;
    if not found then return jsonb_build_object('status','not_found'); end if;
    return jsonb_build_object('status','ready','document',entries);
  elsif p_operation='idea_save' then
    insert into private.blog_jobs(id,idea,engine,state,artifacts) values((p_values->>'id')::uuid,p_values->>'idea','api','cancelled','{"savedIdea":true}') on conflict do nothing;
    if not exists(select 1 from private.blog_jobs where id=(p_values->>'id')::uuid and idea=p_values->>'idea' and artifacts->>'savedIdea'='true') then
      return jsonb_build_object('status','conflict'); end if;
  elsif p_operation='idea_start' then
    update private.blog_jobs set state='pending',artifacts=artifacts-'savedIdea',updated_at=now()
      where id=(p_values->>'id')::uuid and state='cancelled' and artifacts->>'savedIdea'='true';
    if not found then return jsonb_build_object('status','conflict'); end if;
  elsif p_operation in ('move','reorder') then
    -- All versions and the complete publication set are checked before any mutation.
    if p_operation='reorder' then
      entries:=p_values->'items';
      select array_agg((value->>'id')::uuid order by value->>'id') into ids from jsonb_array_elements(entries);
      select array_agg(id order by id::text) into existing from public.blog_publications;
      if ids is distinct from existing or cardinality(ids)<>(select count(distinct u) from unnest(ids) u) then return jsonb_build_object('status','conflict'); end if;
      for item in select value from jsonb_array_elements(entries) loop
        if not exists(select 1 from private.blog_articles where id=(item->>'id')::uuid and version=(item->>'version')::integer and state='published') then
          return jsonb_build_object('status','conflict'); end if;
      end loop;
      pos:=0;
      for item in select value from jsonb_array_elements(entries) loop
        update private.blog_articles set position=pos,version=version+1,updated_at=now() where id=(item->>'id')::uuid returning * into a;
        insert into private.blog_revisions(article_id,version,document,actor) values(a.id,a.version,a.document,'editorial_order');
        update private.blog_articles set published_version=case when published_version=a.version-1 then a.version else published_version end where id=a.id;
        update public.blog_publications set position=pos where id=a.id;
        pos:=pos+1;
      end loop;
    else
      select * into a from private.blog_articles where id=(p_values->>'id')::uuid for update;
      if not found then return jsonb_build_object('status','not_found'); end if;
      if a.version<>(p_values->>'version')::integer or a.state<>'published' then return jsonb_build_object('status','conflict'); end if;
      select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'version',x.version) order by x.position,x.published_at desc,x.id),'[]') into entries
        from private.blog_articles x where x.state='published' and x.id<>a.id;
      pos:=least(greatest((p_values->>'position')::integer,0),jsonb_array_length(entries));
      entries:=coalesce((select jsonb_agg(v) from jsonb_array_elements(entries) with ordinality e(v,n) where n<=pos),'[]') ||
        jsonb_build_array(jsonb_build_object('id',a.id,'version',a.version)) ||
        coalesce((select jsonb_agg(v) from jsonb_array_elements(entries) with ordinality e(v,n) where n>pos),'[]');
      return public.blog_admin('reorder',jsonb_build_object('items',entries),p_token,p_local);
    end if;
  end if;
  return jsonb_build_object('status','ready');
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;

create function public.blog_catalog() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('status','ready','items',coalesce(jsonb_agg(to_jsonb(c) order by c.position,c.id),'[]')) from public.blog_categories c;
$$;
create function public.blog_related(p_slug text) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('status','ready','items',coalesce(jsonb_agg(x.doc order by x.priority,x.position,x.published_at desc,x.id),'[]')) from
 (select p.id,p.position,p.published_at,p.document-'document' as doc,
   coalesce(array_position(array(select jsonb_array_elements_text(current.document->'relatedSlugs')),p.slug),100) priority
  from public.blog_publications current join public.blog_publications p on p.id<>current.id
  where current.slug=p_slug and (p.document->>'category'=current.document->>'category' or current.document->'relatedSlugs' ? p.slug)
  order by priority,p.position,p.published_at desc,p.id limit 3) x;
$$;
revoke all on function public.blog_catalog(),public.blog_related(text) from public;
grant execute on function public.blog_catalog(),public.blog_related(text) to anon,authenticated,service_role;
