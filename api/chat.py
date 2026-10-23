"""Vercel function: GET session / POST conversation commands at /api/chat."""
import json

from api.interests import handler as InterestHandler
from backend.chatbot import process_chat
from backend.chat_identity import issue_identity, visitor_from_cookie


class handler(InterestHandler):
    def do_POST(self):
        if self.path.split('?', 1)[0].rstrip('/') != '/api/chat':
            return self.reply(404, {"status": "not_found"})
        if self.headers.get_content_type() != "application/json":
            return self.reply(415, {"status": "invalid"})
        if not self.same_origin():
            return self.reply(403, {"status": "invalid"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.reply(400, {"status": "invalid"})
        if length <= 0 or length > 65536:
            return self.reply(413, {"status": "invalid"})
        try:
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            return self.reply(400, {"status": "invalid"})
        status, result = process_chat(payload, visitor=visitor_from_cookie(self.headers.get('Cookie')))
        self.reply(status, result)

    def do_GET(self):
        if self.path.split('?', 1)[0].rstrip('/') != '/api/chat':
            return self.reply(404, {'status': 'not_found'})
        if not self.same_origin():
            return self.reply(403, {'status': 'invalid'})
        try:
            visitor = visitor_from_cookie(self.headers.get('Cookie'))
            if not visitor:
                visitor, self.setter_cookie = issue_identity()
            status, result = process_chat({'operation': 'session'}, visitor=visitor)
            return self.reply(status, result)
        except ValueError:
            return self.reply(503, {'status': 'not_configured'})

    def unsupported(self):
        self.reply(405, {'status': 'method_not_allowed'})

    do_PUT = unsupported
    do_PATCH = unsupported
    do_DELETE = unsupported
    do_OPTIONS = unsupported
