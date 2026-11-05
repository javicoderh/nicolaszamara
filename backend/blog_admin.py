"""Administrative blog API. Imports no inference client; safe for Codex persistence."""
from uuid import UUID
import os
from backend.admin_security import token_hash
from backend.blog_contract import InvalidBlog, article, idea
from backend.chat_store import rpc, StoreUnavailable
from backend.blog_config import generation_ready

OPERATIONS = {'list', 'detail', 'create', 'save', 'publish', 'archive', 'delete', 'restore', 'feature', 'reorder', 'jobs', 'job_create', 'job_detail', 'job_reply', 'job_cancel', 'job_retry', 'job_revalidate', 'catalog', 'category_save', 'category_delete', 'move', 'revision', 'idea_save', 'idea_start', 'generation_info','comments','comment_moderate','comment_delete'}


def process_blog_admin(payload, token, call=rpc):
    if call is rpc:
        call = lambda name, arguments: rpc(name, arguments, max_response_bytes=2 * 1024 * 1024)
    if not token:
        return 401, {'status': 'unauthorized'}, ''
    try:
        if not isinstance(payload, dict) or set(payload) != {'operation', 'action', 'values'} or payload['action'] not in OPERATIONS:
            raise InvalidBlog('invalid_operation')
        action, values = payload['action'], payload['values']
        if not isinstance(values, dict):
            raise InvalidBlog('invalid_values')
        auth = call('admin_access', {'p_operation': 'session', 'p_values': {'token_hash': token_hash(token)}})
        if auth.get('status') != 'authenticated':
            return 401, {'status': 'unauthorized'}, ''
        allowed = {'list': set(), 'jobs': set(), 'create': {'id', 'document'}, 'save': {'id', 'version', 'document'},
                   'job_create': {'id', 'idea'}, 'job_reply': {'id', 'answer'}, 'job_cancel': {'id'}, 'job_retry': {'id'}, 'job_revalidate': {'id'}, 'reorder': {'items'}, 'restore': {'id', 'version', 'restore_version'},
                   'catalog': set(), 'category_save': {'id', 'name', 'position'}, 'category_delete': {'id'}, 'move': {'id', 'version', 'position'}, 'revision': {'id', 'revision'},
                   'idea_save': {'id', 'idea'}, 'idea_start': {'id'}, 'generation_info': set(),'comments':{'state'},'comment_moderate':{'id','state'},'comment_delete':{'id'}}
        fields = allowed.get(action, {'id'} if action in ('detail', 'job_detail') else {'id', 'version'})
        if set(values) != fields:
            raise InvalidBlog('invalid_fields')
        values = dict(values)
        if action in ('comments','comment_moderate') and values['state'] not in ('pending','approved','rejected'): raise InvalidBlog('invalid_comment_state')
        if action == 'generation_info':
            from backend.blog_costs import generation_info
            return 200, {'status': 'ready', **generation_info()}, None
        if 'id' in values and not action.startswith('category_'):
            values['id'] = str(UUID(values['id']))
        if action.startswith('category_'):
            from backend.blog_contract import slug, text
            values['id'] = slug(values['id'])
            if action == 'category_save': values['name'] = text(values['name'], 80)
        if 'position' in values and (type(values['position']) is not int or not 0 <= values['position'] <= 10000): raise InvalidBlog('invalid_position')
        if 'revision' in values and (type(values['revision']) is not int or values['revision'] < 1): raise InvalidBlog('invalid_version')
        if action == 'job_reply':
            from backend.blog_contract import text
            values['answer'] = text(values['answer'], 2000)
        if 'version' in values and (type(values['version']) is not int or values['version'] < 1):
            raise InvalidBlog('invalid_version')
        if action in ('create', 'save'):
            values['document'] = article(values['document'])
            catalog = call('blog_catalog', {})
            category = next((item for item in catalog.get('items', []) if item['id'] == values['document']['category']), None)
            if not category: raise InvalidBlog('invalid_category')
            values['document']['categoryLabel'] = category['name']
        if action == 'publish':
            current = call('blog_admin', {'p_operation': 'detail', 'p_values': {'id': values['id']}, 'p_token': token_hash(token)})
            if current.get('status') != 'ready':
                return 404, {'status': 'not_found'}, None
            article(current['article']['document'], publishing=True)
            for related in current['article']['document'].get('relatedSlugs',[]):
                if related==current['article']['document']['slug'] or call('blog_read',{'p_slug':related}).get('status')!='ready': raise InvalidBlog('invalid_related_article')
        if action in ('job_create', 'idea_start', 'job_revalidate'):
            if not generation_ready():
                return 503, {'status': 'generation_not_configured'}, None
        if action in ('job_create', 'idea_save'):
            values['idea'] = idea(values['idea'])
        if action == 'job_create':
            values['engine'] = 'api'
        if action == 'reorder':
            if not isinstance(values['items'], list) or not 1 <= len(values['items']) <= 500:
                raise InvalidBlog('invalid_order')
            seen = set()
            for item in values['items']:
                if not isinstance(item, dict) or set(item) != {'id', 'version'} or type(item['version']) is not int:
                    raise InvalidBlog('invalid_order')
                ident = str(UUID(item['id']))
                if ident in seen:
                    raise InvalidBlog('duplicate_order')
                seen.add(ident)
        result = call('blog_admin', {'p_operation': action, 'p_values': values, 'p_token': token_hash(token)})
        return {'ready': 200, 'unauthorized': 401, 'conflict': 409, 'retry_limit':409,'category_in_use': 409, 'not_found': 404, 'invalid': 400}.get(result.get('status'), 503), result, None
    except (InvalidBlog, ValueError, TypeError, KeyError, AttributeError):
        return 400, {'status': 'invalid'}, None
    except StoreUnavailable:
        return 503, {'status': 'unavailable'}, None
