import json
from urllib.parse import urlsplit,parse_qs
from api.interests import handler as InterestHandler
from backend.blog_social import process_social


class handler(InterestHandler):
    def do_GET(self):
        try:
            params=parse_qs(urlsplit(self.path).query)
            payload={'action':'read','articleId':params.get('articleId',[''])[0],'page':int(params.get('page',['1'])[0])}
        except ValueError: return self.reply(400,{'status':'invalid'})
        status,result,_=process_social(payload,self.headers.get('Cookie'))
        return self.reply(status,result)

    def do_POST(self):
        if not self.same_origin() or self.headers.get('X-Blog-Request')!='1': return self.reply(403,{'status':'invalid'})
        if self.headers.get_content_type()!='application/json': return self.reply(415,{'status':'invalid'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=12288: return self.reply(413,{'status':'invalid'})
            payload=json.loads(self.rfile.read(length))
            if isinstance(payload,dict) and payload.get('action')=='read': return self.reply(400,{'status':'invalid'})
        except (ValueError,UnicodeError): return self.reply(400,{'status':'invalid'})
        status,result,cookie=process_social(payload,self.headers.get('Cookie'))
        if cookie: self.setter_cookie=cookie
        return self.reply(status,result)

    def end_headers(self):
        self.send_header('Vary','Cookie')
        self.send_header('X-Robots-Tag','noindex, nofollow')
        super().end_headers()
