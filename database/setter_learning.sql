-- Optional, explicitly submitted cases. Pending suggestions never reach the model.
create table private.setter_feedback (
  id uuid primary key,
  visitor uuid not null,
  conversation_id uuid not null,
  request_id uuid not null,
  category text not null check (category in ('irrelevant','missing','unnatural','incorrect')),
  question text not null check (char_length(question) between 5 and 500),
  actual_reply text not null,
  suggestion text not null check (char_length(suggestion) between 10 and 1000),
  comment text not null default '' check (char_length(comment) <= 500),
  consent_version text not null default 'setter-feedback-2026-10-23',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  unique (visitor, request_id)
);
create index setter_feedback_visitor_date on private.setter_feedback(visitor, created_at);
create index setter_feedback_pending on private.setter_feedback(created_at) where status = 'pending';
alter table private.setter_feedback enable row level security;
revoke all on private.setter_feedback from public, anon, authenticated;
grant select, insert, update, delete on private.setter_feedback to service_role;

create table private.setter_examples (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid unique references private.setter_feedback(id),
  question text not null check (char_length(question) between 5 and 500),
  answer text not null check (char_length(answer) between 10 and 1000),
  topic text not null check (topic in ('consultation','therapies','course','online','nature','unknown')),
  enabled boolean not null default true,
  reviewed_by text not null check (char_length(trim(reviewed_by)) > 0),
  reviewed_at timestamptz not null default now()
);
alter table private.setter_examples enable row level security;
revoke all on private.setter_examples from public, anon, authenticated;
grant select, insert, update, delete on private.setter_examples to service_role;

create or replace function public.setter_feedback_save(p_visitor uuid, p_values jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare existing private.setter_feedback; answer jsonb;
begin
  if p_values->'consent' is distinct from 'true'::jsonb then
    return jsonb_build_object('status','invalid');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_visitor::text, 8934));
  select * into existing from private.setter_feedback
    where visitor = p_visitor and request_id = (p_values->>'request_id')::uuid;
  if found then
    if existing.id = (p_values->>'id')::uuid and existing.question = p_values->>'question'
      and existing.suggestion = p_values->>'suggestion' and existing.comment = p_values->>'comment'
      and existing.category = p_values->>'category' then
      return jsonb_build_object('status','saved');
    end if;
    return jsonb_build_object('status','conflict');
  end if;
  if (select count(*) from private.setter_feedback where visitor=p_visitor
      and created_at >= date_trunc('day',now() at time zone 'America/Santiago') at time zone 'America/Santiago') >= 20 then
    return jsonb_build_object('status','rate_limited');
  end if;
  select result into answer from private.setter_requests
    where visitor=p_visitor and request_id=(p_values->>'request_id')::uuid
      and conversation_id=(p_values->>'conversation_id')::uuid and status='completed';
  if answer is null then return jsonb_build_object('status','not_found'); end if;
  insert into private.setter_feedback(id,visitor,conversation_id,request_id,category,question,actual_reply,suggestion,comment)
    values ((p_values->>'id')::uuid,p_visitor,(p_values->>'conversation_id')::uuid,
      (p_values->>'request_id')::uuid,p_values->>'category',p_values->>'question',answer->>'reply',
      p_values->>'suggestion',coalesce(p_values->>'comment',''));
  return jsonb_build_object('status','saved');
end $$;

create or replace function public.setter_learning_examples()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('examples', coalesce(jsonb_agg(jsonb_build_object(
    'question',question,'answer',answer,'topic',topic)), '[]'::jsonb))
  from (select question,answer,topic from private.setter_examples
    where enabled order by reviewed_at desc, id limit 8) examples;
$$;

-- Editorial operation. Never expose this operation through the visitor API.
create or replace function public.setter_feedback_review(p_id uuid, p_approve boolean, p_reviewer text,
  p_question text default null, p_answer text default null, p_topic text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item private.setter_feedback;
begin
  if p_reviewer is null or char_length(trim(p_reviewer))=0 then raise exception 'Reviewer required'; end if;
  select * into item from private.setter_feedback where id=p_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if item.status <> 'pending' then return jsonb_build_object('status','already_reviewed'); end if;
  if p_approve then
    if p_question is null or p_answer is null or p_topic is null then raise exception 'Reviewed example required'; end if;
    insert into private.setter_examples(feedback_id,question,answer,topic,reviewed_by)
      values (p_id,p_question,p_answer,p_topic,p_reviewer);
  end if;
  update private.setter_feedback set status=case when p_approve then 'approved' else 'rejected' end,
    reviewed_at=now(),reviewed_by=p_reviewer where id=p_id;
  return jsonb_build_object('status',case when p_approve then 'approved' else 'rejected' end);
end $$;

revoke all on function public.setter_feedback_save(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.setter_learning_examples() from public,anon,authenticated;
revoke all on function public.setter_feedback_review(uuid,boolean,text,text,text,text) from public,anon,authenticated;
grant execute on function public.setter_feedback_save(uuid,jsonb) to service_role;
grant execute on function public.setter_learning_examples() to service_role;
grant execute on function public.setter_feedback_review(uuid,boolean,text,text,text,text) to service_role;
