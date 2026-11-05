import json
from urllib.parse import urlsplit, parse_qs
from api.interests import handler as InterestHandler
from backend.admin_security import session_token, token_hash
from backend.blog_media import upload, public_media, storage_request
from backend.chat_store import StoreUnavailable, rpc
from uuid import UUID


class handler(InterestHandler):
    def do_POST(self):
        if not self.same_origin() or self.headers.get('X-Admin-Request') != '1': return self.reply(403, {'status': 'invalid'})
        if self.headers.get_content_type() != 'application/json': return self.reply(415, {'status': 'invalid'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4_000_000: return self.reply(413, {'status': 'invalid'})
            result = upload(json.loads(self.rfile.read(length)), session_token(self.headers.get('Cookie')))
            return self.reply(200 if result['status'] == 'ready' else 401, result)
        except (ValueError, TypeError, KeyError): return self.reply(400, {'status': 'invalid'})
        except StoreUnavailable: return self.reply(503, {'status': 'unavailable'})

    def do_GET(self):
        try:
            path = urlsplit(self.path)
            params = parse_qs(path.query)
            ident = str(UUID(params.get('id', [path.path.rsplit('/', 1)[-1]])[0]))
            if params.get('preview') == ['1']:
                token = session_token(self.headers.get('Cookie'))
                if not token or rpc('admin_access', {'p_operation': 'session', 'p_values': {'token_hash': token_hash(token)}}).get('status') != 'authenticated':
                    return self.reply(401, {'status': 'unauthorized'})
                content = storage_request('authenticated/blog-media/' + ident + '.webp')
            else: content = public_media(ident, params.get('width',[None])[0])
            if content is None: return self.reply(404, {'status': 'not_found'})
            self.send_response(200); self.send_header('Content-Type', 'image/webp'); self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff'); self.end_headers(); self.wfile.write(content)
        except (ValueError, TypeError): return self.reply(404, {'status': 'not_found'})
        except StoreUnavailable: return self.reply(503, {'status': 'unavailable'})
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            # Image requests are commonly cancelled when a modal closes. The
            # response may already have started: never send a second JSON reply.
            self.close_connection = True
