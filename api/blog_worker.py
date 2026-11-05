"""Private worker endpoint invoked by persistent database outbox dispatch."""
import hmac
import os
from api.interests import handler as InterestHandler
from backend.blog_worker import worker_tick
from backend.chat_store import StoreUnavailable


class handler(InterestHandler):
    def do_POST(self):
        secret = os.environ.get('BLOG_WORKER_SECRET', '')
        if len(secret) < 32 or not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + secret):
            return self.reply(401, {'status': 'unauthorized'})
        try: return self.reply(200, worker_tick())
        except StoreUnavailable: return self.reply(503, {'status': 'unavailable'})
