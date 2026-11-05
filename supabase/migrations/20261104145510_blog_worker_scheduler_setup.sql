-- Installed now, scheduled only when a deployed worker is explicitly configured.
create extension if not exists pg_cron;
create function private.blog_ensure_schedule() returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from cron.job where jobname='blog-generation-ticks') then
    perform cron.schedule('blog-generation-ticks','* * * * *','select public.blog_dispatch_worker()');
  end if;
end $$;
revoke all on function private.blog_ensure_schedule() from public,anon,authenticated;
grant execute on function private.blog_ensure_schedule() to service_role;
create or replace function public.blog_configure_worker(p_endpoint text,p_secret text) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if p_endpoint !~ '^https://[a-zA-Z0-9.-]+/api/blog_worker$' or length(p_secret)<32 then raise exception 'invalid_worker_config'; end if;
  insert into private.blog_worker_config(id,endpoint,secret) values(true,p_endpoint,p_secret)
    on conflict(id) do update set endpoint=excluded.endpoint,secret=excluded.secret;
  perform private.blog_ensure_schedule();
  return jsonb_build_object('status','ready');
end $$;
