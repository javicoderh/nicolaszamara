"""Vercel file-based function: POST /api/interests."""
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlsplit

from backend.interests import process_submission
from backend.chat_identity import visitor_from_cookie


class handler(BaseHTTPRequestHandler):
    def reply(self, status, body):
        encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(encoded)))
        if getattr(self, 'setter_cookie', None):
            self.send_header('Set-Cookie', self.setter_cookie)
        if status == 429:
            self.send_header("Retry-After", "60")
        if status == 405:
            self.send_header("Allow", "POST")
        self.end_headers()
        self.wfile.write(encoded)

    def do_POST(self):
        if self.path.split('?', 1)[0].rstrip('/') != '/api/interests':
            return self.reply(404, {"status": "not_found"})
        if self.headers.get_content_type() != "application/json":
            return self.reply(415, {"status": "invalid"})
        if not self.same_origin():
            return self.reply(403, {"status": "invalid"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.reply(400, {"status": "invalid"})
        if length <= 0 or length > 8192:
            return self.reply(413, {"status": "invalid"})
        try:
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            return self.reply(400, {"status": "invalid"})
        if isinstance(payload, dict) and payload.get('source') == 'chatbot':
            status, result = process_submission(payload, visitor=visitor_from_cookie(self.headers.get('Cookie')))
        else:
            status, result = process_submission(payload)
        self.reply(status, result)

    def same_origin(self):
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return False
        origin = self.headers.get('Origin')
        return not origin or urlsplit(origin).netloc == self.headers.get('Host')

    def do_GET(self):
        self.reply(405, {"status": "method_not_allowed"})

    do_PUT = do_GET
    do_PATCH = do_GET
    do_DELETE = do_GET
    do_OPTIONS = do_GET

    def log_message(self, *_args):
        # Avoid logging request URLs or submitted personal information.
        pass
