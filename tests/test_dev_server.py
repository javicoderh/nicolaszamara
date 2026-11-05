import unittest
from unittest.mock import MagicMock, patch
from backend.dev_server import DevApiHandler


class LocalRoutingTests(unittest.TestCase):
    def test_health_has_no_database_dependency(self):
        request = object.__new__(DevApiHandler)
        request.path = '/api/health'
        request.reply = MagicMock()
        with patch('backend.blog_config.generation_ready', return_value=True):
            request.do_GET()
        request.reply.assert_called_once_with(200, {'status': 'ready', 'blogGenerationEnabled': True})

    @patch('backend.dev_server.AdminHandler.do_POST')
    def test_admin_is_dispatched_to_its_handler(self, admin):
        request = object.__new__(DevApiHandler)
        request.path = '/api/admin'
        request.do_POST()
        admin.assert_called_once_with(request)
