import unittest
from unittest.mock import Mock
from api.blog_engagement import handler


class SocialApiTests(unittest.TestCase):
    def test_cross_origin_and_missing_custom_header_are_rejected_before_reading_payload(self):
        request=Mock();request.same_origin.return_value=False
        handler.do_POST(request)
        request.reply.assert_called_once_with(403,{'status':'invalid'})
        request.rfile.read.assert_not_called()
        request.reset_mock();request.same_origin.return_value=True;request.headers.get.return_value=None
        handler.do_POST(request)
        request.reply.assert_called_once_with(403,{'status':'invalid'})
        request.rfile.read.assert_not_called()
