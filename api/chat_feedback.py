"""Explicitly submitted feedback; no public review or approval operation."""
import json

from api.interests import handler as InterestHandler
from backend.chat_identity import visitor_from_cookie
from backend.setter_learning import save_feedback


class handler(InterestHandler):
    def do_POST(self):
        if self.headers.get_content_type() != 'application/json':
            return self.reply(415, {'status': 'invalid'})
        if not self.same_origin():
            return self.reply(403, {'status': 'invalid'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8192:
                return self.reply(413, {'status': 'invalid'})
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            return self.reply(400, {'status': 'invalid'})
        status, value = save_feedback(payload, visitor_from_cookie(self.headers.get('Cookie')))
        self.reply(status, value)
