"""Run with python -m backend.dev_server; Vite proxies /api to this server."""
from http.server import ThreadingHTTPServer

from api.interests import handler

if __name__ == "__main__":
    print("API: http://127.0.0.1:3001/api/interests")
    ThreadingHTTPServer(("127.0.0.1", 3001), handler).serve_forever()
