create function private.blog_align_public_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.published_version is distinct from old.published_version then
   update public.blog_publications set version=new.published_version where id=new.id and document=new.document;
 end if;
 return new;
end $$;
revoke all on function private.blog_align_public_version() from public,anon,authenticated;
create trigger blog_order_version after update of published_version on private.blog_articles for each row execute function private.blog_align_public_version();

alter function public.blog_job_transition(text,text,uuid,uuid,jsonb) rename to blog_job_transition_v1;
create function public.blog_job_transition(p_operation text,p_engine text,p_id uuid default null,p_lease uuid default null,p_values jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_id is not null and exists(select 1 from private.blog_jobs where id=p_id and engine<>p_engine) then return jsonb_build_object('status','conflict'); end if;
 return public.blog_job_transition_v1(p_operation,p_engine,p_id,p_lease,p_values);
end $$;
revoke all on function public.blog_job_transition(text,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.blog_job_transition(text,text,uuid,uuid,jsonb) to service_role;
