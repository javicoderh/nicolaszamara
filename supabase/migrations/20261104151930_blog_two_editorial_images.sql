-- Editorial images are attached after the text pipeline, never by the brief.
create or replace function public.blog_media_visible(p_reference text) returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('visible',exists(select 1 from public.blog_publications p
    where p.document->>'cover'=p_reference or p.document->>'ogImage'=p_reference
      or p.document->'bodyImage'->>'src'=p_reference));
$$;
revoke all on function public.blog_media_visible(text) from public,anon,authenticated;
grant execute on function public.blog_media_visible(text) to service_role;

create function private.blog_require_editorial_images() returns trigger
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
revoke all on function private.blog_require_editorial_images() from public,anon,authenticated;
create trigger blog_publication_images before insert or update of document on public.blog_publications
for each row execute function private.blog_require_editorial_images();
