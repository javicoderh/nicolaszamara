-- Additive blog foundation. Published snapshots are separate from private drafts.
create table private.blog_articles (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'draft' check(state in ('draft','published','archived')),
  version integer not null default 1,
  document jsonb not null,
  published_version integer,
  position integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create table private.blog_revisions (
  article_id uuid not null references private.blog_articles(id) on delete cascade,
  version integer not null,
  document jsonb not null,
  actor text not null,
  created_at timestamptz not null default now(),
  primary key(article_id,version)
);
create table public.blog_publications (
  id uuid primary key references private.blog_articles(id) on delete cascade,
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  document jsonb not null,
  version integer not null,
  position integer not null default 0,
  featured boolean not null default false,
  published_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create unique index blog_one_featured on public.blog_publications(featured) where featured;
create index blog_public_order on public.blog_publications(position,published_at desc,id);
create index blog_public_category on public.blog_publications((document->>'category'),position);
create table public.blog_redirects (
  slug text primary key,
  article_id uuid not null references private.blog_articles(id) on delete cascade
);
create table private.blog_jobs (
  id uuid primary key,
  idea text not null check(length(idea) between 1 and 12000),
  engine text not null check(engine in ('codex_session','api')),
  state text not null default 'pending' check(state in ('pending','processing','needs_input','completed','failed','cancelled')),
  stage text not null default 'brief' check(stage in ('brief','draft','critique','final','done')),
  brief jsonb,
  artifacts jsonb not null default '{}',
  result_id uuid references private.blog_articles(id),
  lease uuid,
  lease_until timestamptz,
  provider_response_id text,
  error_code text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_jobs_pending on private.blog_jobs(created_at,id) where state='pending';
create table private.blog_audit (
  id bigint generated always as identity primary key,
  actor text not null,
  operation text not null,
  article_id uuid,
  created_at timestamptz not null default now()
);
alter table private.blog_articles enable row level security;
alter table private.blog_revisions enable row level security;
alter table private.blog_jobs enable row level security;
alter table private.blog_audit enable row level security;
alter table public.blog_publications enable row level security;
alter table public.blog_redirects enable row level security;
revoke all on private.blog_articles,private.blog_revisions,private.blog_jobs,private.blog_audit,
  public.blog_publications,public.blog_redirects from public,anon,authenticated;
grant select on public.blog_publications,public.blog_redirects to anon,authenticated;
create policy blog_published_read on public.blog_publications for select to anon,authenticated using(true);
create policy blog_redirect_read on public.blog_redirects for select to anon,authenticated
  using(exists(select 1 from public.blog_publications p where p.id=article_id));
grant select,insert,update,delete on private.blog_articles,private.blog_revisions,private.blog_jobs,
  private.blog_audit,public.blog_publications,public.blog_redirects to service_role;
grant usage,select on sequence private.blog_audit_id_seq to service_role;

create function public.blog_read(p_slug text default null,p_category text default null,p_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_doc jsonb; v_items jsonb; v_total bigint;
begin
  if p_page not between 1 and 10000 then return jsonb_build_object('status','invalid'); end if;
  if p_slug is not null then
    select document||jsonb_build_object('id',id,'publishedAt',published_at,'updatedAt',updated_at,'version',version)
      into v_doc from public.blog_publications where slug=p_slug;
    if v_doc is not null then return jsonb_build_object('status','ready','article',v_doc); end if;
    select jsonb_build_object('status','redirect','slug',p.slug) into v_doc from public.blog_redirects r
      join public.blog_publications p on p.id=r.article_id where r.slug=p_slug;
    return coalesce(v_doc,jsonb_build_object('status','not_found'));
  end if;
  select count(*) into v_total from public.blog_publications where p_category is null or document->>'category'=p_category;
  select coalesce(jsonb_agg(x.doc order by x.position,x.published_at desc,x.id),'[]') into v_items from
    (select (document-'document')||jsonb_build_object('id',id,'publishedAt',published_at,'updatedAt',updated_at,'featured',featured) doc,
       position,published_at,id from public.blog_publications
       where p_category is null or document->>'category'=p_category
       order by position,published_at desc,id limit 12 offset ((p_page-1)*12)) x;
  return jsonb_build_object('status','ready','items',v_items,'total',v_total,'page',p_page);
end $$;
revoke all on function public.blog_read(text,text,integer) from public;
grant execute on function public.blog_read(text,text,integer) to anon,authenticated,service_role;

-- Administrative session is checked again in the same transaction as the write.
create function public.blog_admin(p_operation text,p_values jsonb,p_token text default null,p_local boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a private.blog_articles%rowtype; j private.blog_jobs%rowtype; actor text; doc jsonb;
  target uuid; expected integer; rows jsonb; entry jsonb; pos integer; old_slug text;
begin
  if p_local then actor:='codex_session';
  else
    select u.username into actor from private.admin_sessions s join private.admin_users u on u.id=s.user_id
      where s.token_hash=p_token and s.expires_at>now() and s.user_version=u.version for update of u;
    if actor is null then return jsonb_build_object('status','unauthorized'); end if;
  end if;
  if p_operation='list' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into rows from
      (select id,state,version,published_version,position,featured,created_at,updated_at,
        document->>'title' title,document->>'category' category from private.blog_articles order by updated_at desc limit 100) x;
    return jsonb_build_object('status','ready','items',rows);
  elsif p_operation='jobs' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]') into rows from
      (select id,idea,engine,state,stage,result_id,error_code,version,created_at,updated_at from private.blog_jobs order by created_at desc limit 100) x;
    return jsonb_build_object('status','ready','items',rows);
  elsif p_operation='job_create' then
    if p_values->>'engine' not in ('api','codex_session') or (not p_local and p_values->>'engine'='codex_session') then
      return jsonb_build_object('status','invalid'); end if;
    insert into private.blog_jobs(id,idea,engine) values((p_values->>'id')::uuid,p_values->>'idea',p_values->>'engine') on conflict do nothing;
    select * into j from private.blog_jobs where id=(p_values->>'id')::uuid;
    if j.idea<>p_values->>'idea' or j.engine<>p_values->>'engine' then return jsonb_build_object('status','conflict'); end if;
    return jsonb_build_object('status','ready','job',to_jsonb(j));
  elsif p_operation='job_detail' then
    select * into j from private.blog_jobs where id=(p_values->>'id')::uuid;
    return case when found then jsonb_build_object('status','ready','job',to_jsonb(j)) else jsonb_build_object('status','not_found') end;
  elsif p_operation='reorder' then
    perform pg_advisory_xact_lock(7384911);
    if jsonb_typeof(p_values->'items')<>'array' or jsonb_array_length(p_values->'items')>500 then return jsonb_build_object('status','invalid'); end if;
    pos:=0;
    for entry in select value from jsonb_array_elements(p_values->'items') loop
      update private.blog_articles set position=pos where id=(entry->>'id')::uuid and version=(entry->>'version')::integer;
      if not found then raise exception 'blog_order_conflict'; end if;
      update public.blog_publications set position=pos where id=(entry->>'id')::uuid;
      pos:=pos+1;
    end loop;
    return jsonb_build_object('status','ready');
  elsif p_operation='create' then
    target:=(p_values->>'id')::uuid; doc:=p_values->'document';
    insert into private.blog_articles(id,document) values(target,doc) on conflict do nothing;
    select * into a from private.blog_articles where id=target;
    if a.document<>doc then return jsonb_build_object('status','conflict'); end if;
    insert into private.blog_revisions(article_id,version,document,actor) values(target,1,doc,actor) on conflict do nothing;
    return jsonb_build_object('status','ready','article',to_jsonb(a));
  end if;
  target:=(p_values->>'id')::uuid;
  select * into a from private.blog_articles where id=target for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if p_operation='detail' then
    select coalesce(jsonb_agg(jsonb_build_object('version',r.version,'created_at',r.created_at,'actor',r.actor) order by r.version desc),'[]') into rows
      from private.blog_revisions r where r.article_id=target;
    return jsonb_build_object('status','ready','article',to_jsonb(a),'revisions',rows);
  end if;
  expected:=(p_values->>'version')::integer;
  if expected is null or expected<>a.version then return jsonb_build_object('status','conflict'); end if;
  if p_operation in ('save','restore') then
    doc:=p_values->'document';
    if p_operation='restore' then
      select document into doc from private.blog_revisions where article_id=target and version=(p_values->>'restore_version')::integer;
      if doc is null then return jsonb_build_object('status','not_found'); end if;
    end if;
    update private.blog_articles set document=doc,version=version+1,updated_at=now() where id=target returning * into a;
    insert into private.blog_revisions(article_id,version,document,actor) values(target,a.version,doc,actor);
  elsif p_operation='publish' then
    perform pg_advisory_xact_lock(7384911);
    old_slug:=(select slug from public.blog_publications where id=target);
    if exists(select 1 from public.blog_redirects where slug=a.document->>'slug' and article_id<>target)
      then return jsonb_build_object('status','conflict'); end if;
    if old_slug is not null and old_slug<>a.document->>'slug' then
      insert into public.blog_redirects(slug,article_id) values(old_slug,target) on conflict(slug) do update set article_id=excluded.article_id;
    end if;
    insert into public.blog_publications(id,slug,document,version,position,featured,published_at)
      values(target,a.document->>'slug',a.document,a.version,a.position,a.featured,coalesce(a.published_at,now()))
      on conflict(id) do update set slug=excluded.slug,document=excluded.document,version=excluded.version,updated_at=now();
    update private.blog_articles set state='published',published_version=version,published_at=coalesce(published_at,now()) where id=target returning * into a;
  elsif p_operation='archive' then
    delete from public.blog_publications where id=target;
    update private.blog_articles set state='archived',featured=false where id=target returning * into a;
  elsif p_operation='feature' then
    perform pg_advisory_xact_lock(7384911);
    if a.state<>'published' then return jsonb_build_object('status','invalid'); end if;
    update private.blog_articles set featured=false where featured;
    update public.blog_publications set featured=false where featured;
    update private.blog_articles set featured=true where id=target and state='published' returning * into a;
    if not found then return jsonb_build_object('status','invalid'); end if;
    update public.blog_publications set featured=true where id=target;
  elsif p_operation='delete' then
    if a.state<>'archived' then return jsonb_build_object('status','invalid'); end if;
    update private.blog_jobs set result_id=null where result_id=target;
    delete from private.blog_articles where id=target;
  else return jsonb_build_object('status','invalid');
  end if;
  insert into private.blog_audit(actor,operation,article_id) values(actor,p_operation,target);
  return jsonb_build_object('status','ready','article',to_jsonb(a));
exception when unique_violation then return jsonb_build_object('status','conflict');
end $$;
revoke all on function public.blog_admin(text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.blog_admin(text,jsonb,text,boolean) to service_role;

-- Local and API engines share an exclusive lease, including expired-worker fencing.
create function public.blog_job_transition(p_operation text,p_engine text,p_id uuid default null,p_lease uuid default null,p_values jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j private.blog_jobs%rowtype; doc jsonb; article_id uuid; answer jsonb;
begin
  if p_engine not in ('api','codex_session') then return jsonb_build_object('status','invalid'); end if;
  perform pg_advisory_xact_lock(7384912);
  if p_operation='claim' then
    if exists(select 1 from private.blog_jobs where state='processing' and lease_until>now()) then return jsonb_build_object('status','busy'); end if;
    -- Expired calls are uncertain: manual reconciliation avoids duplicate inference charges.
    update private.blog_jobs set state='failed',error_code='lease_expired_reconcile',lease=null where state='processing' and lease_until<=now();
    select * into j from private.blog_jobs where state='pending' and engine=p_engine and (p_id is null or id=p_id) order by created_at,id limit 1 for update;
    if not found then return jsonb_build_object('status','empty'); end if;
    update private.blog_jobs set state='processing',lease=gen_random_uuid(),lease_until=now()+interval '15 minutes',updated_at=now()
      where id=j.id returning * into j;
    return jsonb_build_object('status','ready','job',to_jsonb(j));
  end if;
  select * into j from private.blog_jobs where id=p_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if j.state='completed' and p_operation='complete' then return jsonb_build_object('status','ready','article_id',j.result_id); end if;
  if j.engine<>p_engine or j.lease is distinct from p_lease or j.lease_until<=now() or j.state<>'processing' then
    return jsonb_build_object('status','conflict'); end if;
  if p_operation='checkpoint' then
    update private.blog_jobs set brief=coalesce(p_values->'brief',brief),artifacts=artifacts||coalesce(p_values->'artifacts','{}'),
      stage=coalesce(p_values->>'stage',stage),provider_response_id=p_values->>'response_id',updated_at=now(),lease_until=now()+interval '15 minutes'
      where id=p_id returning * into j;
  elsif p_operation='fail' then
    update private.blog_jobs set state='failed',error_code=p_values->>'error',lease=null,updated_at=now() where id=p_id returning * into j;
  elsif p_operation='complete' then
    if j.brief is null or not(j.artifacts ? 'draft' and j.artifacts ? 'critique') then return jsonb_build_object('status','invalid'); end if;
    article_id:=j.id;
    answer:=public.blog_admin('create',jsonb_build_object('id',article_id,'document',p_values->'document'),null,true);
    if answer->>'status'<>'ready' then return answer; end if;
    update private.blog_jobs set state='completed',stage='done',result_id=article_id,lease=null,updated_at=now() where id=p_id returning * into j;
  else return jsonb_build_object('status','invalid'); end if;
  return jsonb_build_object('status','ready','job',to_jsonb(j));
end $$;
revoke all on function public.blog_job_transition(text,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.blog_job_transition(text,text,uuid,uuid,jsonb) to service_role;
