"""Same-origin administrative API. Never cache credentials or contact records."""
import json
from api.interests import handler as InterestHandler
from backend.admin import process_admin
from backend.admin_security import session_token, session_cookie


class handler(InterestHandler):
    def do_POST(self):
        if self.path.split('?', 1)[0].rstrip('/') != '/api/admin':
            return self.reply(404, {'status': 'not_found'})
        # A non-simple header plus origin checks prevents cross-site form CSRF.
        if not self.same_origin() or self.headers.get('X-Admin-Request') != '1':
            return self.reply(403, {'status': 'invalid'})
        if self.headers.get_content_type() != 'application/json':
            return self.reply(415, {'status': 'invalid'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                return self.reply(413, {'status': 'invalid'})
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            return self.reply(400, {'status': 'invalid'})
        status, result, token = process_admin(payload, session_token(self.headers.get('Cookie')))
        if token is not None:
            self.setter_cookie = session_cookie(token, clear=not token)
        return self.reply(status, result)

    def end_headers(self):
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        self.send_header('Vary', 'Cookie')
        super().end_headers()
