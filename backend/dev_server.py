"""Run with python -m backend.dev_server; Vite proxies /api to this server."""
from http.server import ThreadingHTTPServer
from backend.local_environment import load_local_environment

from api.chat import handler as ChatHandler
from api.interests import handler as InterestHandler
from api.chat_feedback import handler as FeedbackHandler
from api.hotmart_click import handler as HotmartClickHandler
from api.admin import handler as AdminHandler


class DevApiHandler(InterestHandler):
    def do_POST(self):
        if self.path.split('?',1)[0].rstrip('/')=='/api/blog_engagement':
            from api.blog_engagement import handler as SocialHandler
            return SocialHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/admin/media':
            from api.blog_media import handler as MediaHandler
            return MediaHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/blog_worker':
            from api.blog_worker import handler as WorkerHandler
            return WorkerHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/admin':
            return AdminHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/hotmart_click':
            return HotmartClickHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat_feedback':
            return FeedbackHandler.do_POST(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat':
            return ChatHandler.do_POST(self)
        return super().do_POST()

    def do_GET(self):
        if self.path.split('?', 1)[0].rstrip('/') == '/api/admin/media':
            from api.blog_media import handler as MediaHandler
            return MediaHandler.do_GET(self)
        if self.path.split('?',1)[0].rstrip('/')=='/api/blog_engagement':
            from api.blog_engagement import handler as SocialHandler
            return SocialHandler.do_GET(self)
        if self.path.split('?', 1)[0].startswith('/blog-media/'):
            from api.blog_media import handler as MediaHandler
            return MediaHandler.do_GET(self)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/blog':
            from urllib.parse import urlsplit, parse_qs
            from backend.blog_public import read_blog
            params = parse_qs(urlsplit(self.path).query)
            try:
                result = read_blog(params.get('slug', [None])[0], params.get('category', [None])[0], int(params.get('page', ['1'])[0]), params.get('mode', [None])[0])
            except ValueError:
                result = {'status': 'invalid'}
            return self.reply({'ready': 200, 'redirect': 200, 'not_found': 404, 'invalid': 400}.get(result['status'], 503), result)
        if self.path.split('?', 1)[0].rstrip('/') == '/api/health':
            from backend.blog_config import generation_ready
            return self.reply(200, {'status': 'ready', 'blogGenerationEnabled': generation_ready()})
        if self.path.split('?', 1)[0].rstrip('/') == '/api/chat':
            return ChatHandler.do_GET(self)
        return super().do_GET()


if __name__ == "__main__":
    load_local_environment()
    print("API local: http://127.0.0.1:3001 (/api/admin, /api/interests, /api/chat y /api/hotmart_click)")
    ThreadingHTTPServer(("127.0.0.1", 3001), DevApiHandler).serve_forever()
