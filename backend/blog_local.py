"""Codex persistence only: pure validation + Supabase RPC, never provider calls."""
from uuid import UUID
from backend.blog_contract import idea, brief, generated_article, editorial_critique, InvalidBlog
from backend.chat_store import rpc


def local_command(operation, values, call=rpc):
    if call is rpc:
        call = lambda name, arguments: rpc(name, arguments, max_response_bytes=2 * 1024 * 1024)
    if operation == 'create':
        return call('blog_admin', {'p_operation': 'job_create', 'p_local': True, 'p_values': {
            'id': str(UUID(values['id'])), 'idea': idea(values['idea']), 'engine': 'codex_session'}})
    if operation not in ('claim', 'checkpoint', 'complete', 'fail'):
        raise ValueError('invalid_operation')
    payload = dict(values.get('values', {}))
    if 'brief' in payload:
        payload['brief'] = brief(payload['brief'])
    if 'critique' in payload.get('artifacts',{}): payload['artifacts']['critique']=editorial_critique(payload['artifacts']['critique'])
    if operation == 'complete':
        current=call('blog_admin',{'p_operation':'job_detail','p_values':{'id':str(UUID(values['id']))},'p_local':True})
        task_brief=current.get('job',{}).get('brief')
        if not task_brief: raise InvalidBlog('missing_brief')
        payload['document'] = generated_article(payload['document'],task_brief)
    return call('blog_job_transition', {'p_operation': operation, 'p_engine': 'codex_session',
        'p_id': str(UUID(values['id'])) if values.get('id') else None,
        'p_lease': str(UUID(values['lease'])) if values.get('lease') else None, 'p_values': payload})
