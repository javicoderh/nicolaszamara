"""POST-only click registration. No visitor-facing analytics read endpoint."""
import json

from api.interests import handler as InterestHandler
from backend.chat_identity import issue_identity, visitor_from_cookie
from backend.hotmart_tracking import record_click


class handler(InterestHandler):
    def do_POST(self):
        if self.headers.get_content_type() != 'application/json':
            return self.reply(415, {'status': 'invalid'})
        if not self.same_origin():
            return self.reply(403, {'status': 'invalid'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 1024:
                return self.reply(413, {'status': 'invalid'})
            payload = json.loads(self.rfile.read(length))
            visitor = visitor_from_cookie(self.headers.get('Cookie'))
            if not visitor:
                visitor, self.setter_cookie = issue_identity()
        except (ValueError, UnicodeError):
            return self.reply(400, {'status': 'invalid'})
        status, result = record_click(payload, visitor)
        self.reply(status, result)
