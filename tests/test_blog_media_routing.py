import unittest
from unittest.mock import Mock,patch
from backend.dev_server import DevApiHandler

class MediaRoutingTests(unittest.TestCase):
    def test_admin_preview_get_reaches_media_handler(self):
        request=Mock();request.path='/api/admin/media?id=00000000-0000-4000-8000-000000000001&preview=1'
        with patch('api.blog_media.handler.do_GET') as media:
            DevApiHandler.do_GET(request)
        media.assert_called_once_with(request)

    def test_public_variant_get_reaches_media_handler(self):
        request=Mock();request.path='/blog-media/00000000-0000-4000-8000-000000000001?width=480'
        with patch('api.blog_media.handler.do_GET') as media:
            DevApiHandler.do_GET(request)
        media.assert_called_once_with(request)
