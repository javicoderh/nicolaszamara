import unittest
from unittest.mock import Mock,patch
from api.blog_media import handler


class MediaDisconnectTests(unittest.TestCase):
    def request(self):
        request=Mock()
        request.path='/blog-media/00000000-0000-4000-8000-000000000001'
        return request

    def test_cancelled_image_is_not_fetched_or_sent_again(self):
        for error in (ConnectionAbortedError,ConnectionResetError,BrokenPipeError):
            request=self.request();request.wfile.write.side_effect=error()
            with patch('api.blog_media.public_media',return_value=b'RIFF WEBP') as fetch:
                handler.do_GET(request)
            self.assertTrue(request.close_connection)
            fetch.assert_called_once()
            request.wfile.write.assert_called_once_with(b'RIFF WEBP')
            request.reply.assert_not_called()

    def test_disconnect_during_headers_does_not_try_to_send_another_response(self):
        request=self.request();request.end_headers.side_effect=ConnectionAbortedError()
        with patch('api.blog_media.public_media',return_value=b'RIFF WEBP'):
            handler.do_GET(request)
        request.reply.assert_not_called();request.wfile.write.assert_not_called()
        self.assertTrue(request.close_connection)

    def test_private_preview_disconnect_is_handled_after_authentication(self):
        request=self.request();request.path='/api/admin/media?id=00000000-0000-4000-8000-000000000001&preview=1'
        request.wfile.write.side_effect=ConnectionAbortedError()
        with patch('api.blog_media.session_token',return_value='test'),patch('api.blog_media.rpc',return_value={'status':'authenticated'}),patch('api.blog_media.storage_request',return_value=b'RIFF WEBP'):
            handler.do_GET(request)
        request.reply.assert_not_called();self.assertTrue(request.close_connection)
