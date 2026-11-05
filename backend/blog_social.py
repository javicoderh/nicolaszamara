"""Public social actions. No account, email, IP storage or inference provider."""
import hashlib
import hmac
import os
import re
import secrets
import time
from http.cookies import SimpleCookie, CookieError
from uuid import UUID
from backend.blog_contract import text, InvalidBlog
from backend.chat_store import rpc, StoreUnavailable

COOKIE='nz_blog_visitor'
LIFETIME=365*24*60*60


def signing_key():
    secret=os.environ.get('CHAT_COOKIE_SECRET','').strip() or os.environ.get('SUPABASE_SECRET_KEY','').strip()
    if not secret: raise StoreUnavailable('not_configured')
    return hmac.new(secret.encode(),b'nz-blog-social-v1',hashlib.sha256).digest()


def identity(cookie_header, create=False, now=None):
    now=int(time.time() if now is None else now)
    try:
        jar=SimpleCookie();jar.load(cookie_header or '')
        token,expires,signature=jar[COOKIE].value.split('.')
        unsigned=token+'.'+expires
        if re.fullmatch(r'[A-Za-z0-9_-]{32}',token) and now<int(expires)<=now+LIFETIME and hmac.compare_digest(signature,hmac.new(signing_key(),unsigned.encode(),hashlib.sha256).hexdigest()):
            return hashlib.sha256(token.encode()).hexdigest(),None
    except (CookieError,KeyError,ValueError,TypeError): pass
    if not create: return None,None
    token=secrets.token_urlsafe(24);unsigned=token+'.'+str(now+LIFETIME)
    signature=hmac.new(signing_key(),unsigned.encode(),hashlib.sha256).hexdigest()
    cookie=f'{COOKIE}={unsigned}.{signature}; Path=/api/blog_engagement; Max-Age={LIFETIME}; HttpOnly; SameSite=Lax'
    if os.environ.get('VERCEL') or os.environ.get('APP_ENV')=='production': cookie+='; Secure'
    return hashlib.sha256(token.encode()).hexdigest(),cookie


def process_social(payload,cookie_header,call=rpc):
    if call is rpc: call=lambda name,arguments:rpc(name,arguments,max_response_bytes=512*1024)
    try:
        fields={'read':{'page'},'like':{'liked'},'comment':{'id','name','body','website'},'comment_delete':{'id'}}
        if not isinstance(payload,dict) or payload.get('action') not in fields: raise InvalidBlog('invalid_action')
        action=payload['action']
        if set(payload)!={'action','articleId'}|fields[action]: raise InvalidBlog('invalid_fields')
        article_id=str(UUID(payload['articleId']))
        values={key:payload[key] for key in fields[action]}
        if action=='read' and (type(values['page']) is not int or not 1<=values['page']<=10000): raise InvalidBlog('invalid_page')
        if action=='like' and type(values['liked']) is not bool: raise InvalidBlog('invalid_like')
        if 'id' in values: values['id']=str(UUID(values['id']))
        if action=='comment':
            if values.pop('website'): return 200,{'status':'ready','state':'pending'},None
            values['name']=text(values['name'],60);values['body']=text(values['body'],2000)
        visitor,cookie=identity(cookie_header,create=action!='read')
        result=call('blog_engagement',{'p_operation':action,'p_article_id':article_id,'p_visitor_hash':visitor,'p_values':values})
        return {'ready':200,'not_found':404,'invalid':400,'conflict':409,'rate_limited':429}.get(result.get('status'),503),result,cookie
    except (ValueError,TypeError,KeyError,AttributeError): return 400,{'status':'invalid'},None
    except StoreUnavailable: return 503,{'status':'unavailable'},None
