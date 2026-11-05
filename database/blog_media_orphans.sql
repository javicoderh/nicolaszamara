-- Read-only inventory. Do not delete from storage.objects using SQL.
-- Candidates require explicit review and deletion through the Storage API.
with assets as (
 select name,created_at,substring(name from '^([0-9a-f-]{36})(?:-(?:480|960|1440))?\.webp$') as media_id
 from storage.objects where bucket_id='blog-media' and created_at<now()-interval '90 days'
), documents as (
 select document from private.blog_articles union all
 select document from private.blog_revisions union all
 select document from public.blog_publications
)
select name,created_at from assets where media_id is not null and not exists(
 select 1 from documents where document->>'cover'='/blog-media/'||media_id
   or document->'bodyImage'->>'src'='/blog-media/'||media_id or document->>'ogImage'='/blog-media/'||media_id
) order by created_at,name;
