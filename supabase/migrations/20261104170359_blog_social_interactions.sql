create table private.blog_comments (
 id uuid primary key,
 article_id uuid not null references private.blog_articles(id) on delete cascade,
 visitor_hash text not null check(visitor_hash ~ '^[0-9a-f]{64}$'),
 display_name text not null check(length(display_name) between 1 and 60),
 body text not null check(length(body) between 1 and 2000),
 state text not null default 'pending' check(state in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 moderated_at timestamptz
);
create index blog_comments_public on private.blog_comments(article_id,state,created_at desc,id);
create index blog_comments_visitor on private.blog_comments(visitor_hash,created_at desc);
create index blog_comments_moderation on private.blog_comments(state,created_at,id);
create table private.blog_likes (
 article_id uuid not null references private.blog_articles(id) on delete cascade,
 visitor_hash text not null check(visitor_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 primary key(article_id,visitor_hash)
);
create table private.blog_social_limits (
 visitor_hash text primary key check(visitor_hash ~ '^[0-9a-f]{64}$'),
 started_at timestamptz not null default now(),
 requests integer not null default 0
);
alter table private.blog_comments enable row level security;
alter table private.blog_likes enable row level security;
alter table private.blog_social_limits enable row level security;
revoke all on private.blog_comments,private.blog_likes,private.blog_social_limits from public,anon,authenticated;
grant select,insert,update,delete on private.blog_comments,private.blog_likes,private.blog_social_limits to service_role;

create function public.blog_engagement(p_operation text,p_article_id uuid,p_visitor_hash text default null,p_values jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare rows jsonb; own_rows jsonb; existing private.blog_comments%rowtype; page integer; total bigint;
begin
 if not exists(select 1 from public.blog_publications where id=p_article_id) then return jsonb_build_object('status','not_found'); end if;
 if p_operation='read' then
   page:=coalesce((p_values->>'page')::integer,1);
   if page not between 1 and 10000 then return jsonb_build_object('status','invalid'); end if;
   select count(*) into total from private.blog_comments where article_id=p_article_id and state='approved';
   select coalesce(jsonb_agg(x.doc order by x.created_at desc,x.id),'[]') into rows from
    (select id,created_at,jsonb_build_object('id',id,'name',display_name,'body',body,'createdAt',created_at,'mine',coalesce(visitor_hash=p_visitor_hash,false)) doc
     from private.blog_comments where article_id=p_article_id and state='approved' order by created_at desc,id limit 20 offset ((page-1)*20)) x;
   select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',display_name,'body',body,'createdAt',created_at,'state',state) order by created_at desc),'[]') into own_rows
     from private.blog_comments where article_id=p_article_id and visitor_hash=p_visitor_hash and state='pending';
   return jsonb_build_object('status','ready','likes',(select count(*) from private.blog_likes where article_id=p_article_id),
    'liked',exists(select 1 from private.blog_likes where article_id=p_article_id and visitor_hash=p_visitor_hash),'comments',rows,'myPending',own_rows,'page',page,'hasMore',page*20<total,'total',total);
 end if;
 if p_visitor_hash is null or p_visitor_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('status','invalid'); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor_hash,7384913));
 insert into private.blog_social_limits(visitor_hash) values(p_visitor_hash) on conflict do nothing;
 update private.blog_social_limits set requests=0,started_at=now() where visitor_hash=p_visitor_hash and started_at<now()-interval '1 hour';
 update private.blog_social_limits set requests=requests+1 where visitor_hash=p_visitor_hash and requests<200;
 if not found then return jsonb_build_object('status','rate_limited'); end if;
 if p_operation='like' then
   if jsonb_typeof(p_values->'liked')<>'boolean' then return jsonb_build_object('status','invalid'); end if;
   if (p_values->>'liked')::boolean then insert into private.blog_likes(article_id,visitor_hash) values(p_article_id,p_visitor_hash) on conflict do nothing;
   else delete from private.blog_likes where article_id=p_article_id and visitor_hash=p_visitor_hash; end if;
   return jsonb_build_object('status','ready','likes',(select count(*) from private.blog_likes where article_id=p_article_id),
     'liked',exists(select 1 from private.blog_likes where article_id=p_article_id and visitor_hash=p_visitor_hash));
 elsif p_operation='comment' then
   select * into existing from private.blog_comments where id=(p_values->>'id')::uuid;
   if found then
     if existing.article_id<>p_article_id or existing.visitor_hash<>p_visitor_hash or existing.body<>p_values->>'body' or existing.display_name<>p_values->>'name' then return jsonb_build_object('status','conflict'); end if;
     return jsonb_build_object('status','ready','id',existing.id,'state',existing.state);
   end if;
   if (select count(*) from private.blog_comments where visitor_hash=p_visitor_hash and created_at>now()-interval '1 hour')>=5 or
     exists(select 1 from private.blog_comments where visitor_hash=p_visitor_hash and created_at>now()-interval '30 seconds') then return jsonb_build_object('status','rate_limited'); end if;
   insert into private.blog_comments(id,article_id,visitor_hash,display_name,body) values((p_values->>'id')::uuid,p_article_id,p_visitor_hash,p_values->>'name',p_values->>'body') returning * into existing;
   return jsonb_build_object('status','ready','id',existing.id,'state','pending');
 elsif p_operation='comment_delete' then
   delete from private.blog_comments where id=(p_values->>'id')::uuid and article_id=p_article_id and visitor_hash=p_visitor_hash;
   return jsonb_build_object('status','ready');
 end if;
 return jsonb_build_object('status','invalid');
end $$;
revoke all on function public.blog_engagement(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.blog_engagement(text,uuid,text,jsonb) to service_role;

alter function public.blog_admin(text,jsonb,text,boolean) rename to blog_admin_v3;
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; comment private.blog_comments%rowtype; actor text;
begin
 if p_operation not in ('comments','comment_moderate','comment_delete') then return public.blog_admin_v3(p_operation,p_values,p_token,p_local); end if;
 result:=public.blog_admin_core('list','{}',p_token,p_local);
 if result->>'status'<>'ready' then return result; end if;
 if p_operation='comments' then
   select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at,x.id),'[]') into result from
     (select c.id,c.article_id,c.display_name,c.body,c.state,c.created_at,c.moderated_at,a.document->>'title' article_title
      from private.blog_comments c join private.blog_articles a on a.id=c.article_id where c.state=coalesce(p_values->>'state','pending') order by c.created_at,c.id limit 100) x;
   return jsonb_build_object('status','ready','items',result);
 end if;
 select * into comment from private.blog_comments where id=(p_values->>'id')::uuid for update;
 if not found then return jsonb_build_object('status','not_found'); end if;
 if p_operation='comment_delete' then delete from private.blog_comments where id=comment.id;
 else
   if p_values->>'state' not in ('approved','rejected','pending') then return jsonb_build_object('status','invalid'); end if;
   update private.blog_comments set state=p_values->>'state',moderated_at=now() where id=comment.id;
 end if;
 if p_local then actor:='codex_session'; else
   select u.username into actor from private.admin_sessions s join private.admin_users u on u.id=s.user_id where s.token_hash=p_token; end if;
 insert into private.blog_audit(actor,operation,article_id) values(actor,p_operation||':'||comment.id::text,comment.article_id);
 return jsonb_build_object('status','ready');
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;
