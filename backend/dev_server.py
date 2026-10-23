"""Run with python -m backend.dev_server; Vite proxies /api to this server."""
from http.server import ThreadingHTTPServer
from backend.local_environment import load_local_environment

from api.chat import handler as ChatHandler
from api.interests import handler as InterestHandler
from api.chat_feedback import handler as FeedbackHandler
from api.hotmart_click import handler as HotmartClickHandler


class DevApiHandler(InterestHandler):
    def do_POST(self):
        if self.path.split('?', 1)[0].rstrip('/') == '/api/hotmart_click':
            return HotmartClickHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat_feedback':
            return FeedbackHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat':
            return ChatHandler.do_POST(self)
        return super().do_POST()

    def do_GET(self):
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat':
            return ChatHandler.do_GET(self)
        return super().do_GET()


if __name__ == "__main__":
    load_local_environment()
    print("API local: http://127.0.0.1:3001/api/interests y /api/chat")
    ThreadingHTTPServer(("127.0.0.1", 3001), DevApiHandler).serve_forever()
