import unittest
from unittest.mock import patch
from backend.blog_media import webp_dimensions, public_media


class MediaTests(unittest.TestCase):
    def test_rejects_non_images_and_oversize_dimensions(self):
        for content in (b'<svg onload="alert(1)"/>', b'not a photo'):
            with self.assertRaises(ValueError): webp_dimensions(content)
        content = b'RIFF' + bytes(4) + b'WEBPVP8X' + bytes(8) + bytes([255] * 6)
        with self.assertRaises(ValueError): webp_dimensions(content)

    def test_webp_extended_header_dimensions(self):
        content = b'RIFF' + bytes(4) + b'WEBPVP8X' + bytes(8) + (639).to_bytes(3,'little') + (479).to_bytes(3,'little')
        self.assertEqual(webp_dimensions(content), (640,480))

    @patch('backend.blog_media.storage_request')
    @patch('backend.blog_media.rpc', return_value={'visible': False})
    def test_draft_media_never_reaches_storage_delivery(self, rpc, storage):
        self.assertIsNone(public_media('00000000-0000-0000-0000-000000000000'))
        storage.assert_not_called()
