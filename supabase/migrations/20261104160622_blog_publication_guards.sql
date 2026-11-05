-- Safe related projections, publication integrity and idempotent visibility updates.
create or replace function public.blog_related(p_slug text) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('status','ready','items',coalesce(jsonb_agg(x.doc order by x.priority,x.position,x.published_at desc,x.id),'[]')) from
 (select p.id,p.position,p.published_at,(p.document-'document')||jsonb_build_object('id',p.id) as doc,
   coalesce(array_position(array(select jsonb_array_elements_text(current.document->'relatedSlugs')),p.slug),100) priority
  from public.blog_publications current join public.blog_publications p on p.id<>current.id
  where current.slug=p_slug and (p.document->>'category'=current.document->>'category' or current.document->'relatedSlugs' ? p.slug)
  order by priority,p.position,p.published_at desc,p.id limit 3) x;
$$;

create function private.blog_publication_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.blog_categories where id=new.document->>'category') then raise exception 'invalid_category'; end if;
  if exists(select 1 from jsonb_array_elements_text(new.document->'relatedSlugs') as links(related_slug) where
    links.related_slug=new.slug or not exists(select 1 from public.blog_publications p where p.slug=links.related_slug)) then raise exception 'invalid_related_article'; end if;
  if tg_op='UPDATE' and new.document=old.document and new.slug=old.slug and new.version=old.version then new.updated_at:=old.updated_at; end if;
  return new;
end $$;
revoke all on function private.blog_publication_guard() from public,anon,authenticated;
create trigger blog_publication_integrity before insert or update of document on public.blog_publications for each row execute function private.blog_publication_guard();

create or replace function private.blog_require_editorial_images() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(btrim(new.document->>'cover'),'')='' or
     coalesce(btrim(new.document->>'coverAlt'),'')='' or
     coalesce(btrim(new.document->'bodyImage'->>'src'),'')='' or
     coalesce(btrim(new.document->'bodyImage'->>'alt'),'')='' or
     new.document->>'cover'=new.document->'bodyImage'->>'src' or
     exists(select 1 from jsonb_array_elements(new.document->'document'->'blocks') b where b->>'type'='image') then
    raise exception 'article_requires_two_images';
  end if;
  return new;
end;
$$;
