insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('blog-media','blog-media',false,8388608,array['image/webp']) on conflict(id) do nothing;
create function public.blog_media_visible(p_reference text) returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('visible',exists(select 1 from public.blog_publications p
    where p.document->>'cover'=p_reference or p.document->>'ogImage'=p_reference
      or exists(select 1 from jsonb_array_elements(p.document->'document'->'blocks') b where b->>'type'='image' and b->>'src'=p_reference)));
$$;
revoke all on function public.blog_media_visible(text) from public,anon,authenticated;
grant execute on function public.blog_media_visible(text) to service_role;
