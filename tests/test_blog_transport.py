import unittest
import socket
import ssl
from unittest.mock import Mock, patch
from urllib.error import HTTPError, URLError
from api.interests import handler
from backend.chat_store import rpc, StoreUnavailable

class TransportTests(unittest.TestCase):
    def test_client_disconnect_is_handled_without_repeating_work(self):
        for error in (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            request = Mock()
            request.setter_cookie = None
            request.wfile.write.side_effect = error()
            handler.reply(request, 200, {'status': 'ready'})
            self.assertTrue(request.close_connection)
            request.wfile.write.assert_called_once()

    def test_disconnect_during_headers_is_also_handled(self):
        request = Mock()
        request.send_response.side_effect = ConnectionAbortedError()
        handler.reply(request, 200, {'status': 'ready'})
        request.wfile.write.assert_not_called()

    def test_storage_diagnostics_do_not_expose_error_bodies_or_credentials(self):
        cases = [(HTTPError('https://private', 503, 'sensitive', {}, None), 'rpc_http_503'),
                 (URLError(TimeoutError('sensitive')), 'rpc_timeout'),
                 (URLError('sensitive'), 'rpc_connection_failed')]
        for error, expected in cases:
            with patch.dict('os.environ', {'SUPABASE_SECRET_KEY': 'secret'}), patch('backend.chat_store.urlopen', side_effect=error):
                with self.assertRaises(StoreUnavailable) as caught: rpc('blog_catalog', {})
                self.assertEqual(str(caught.exception), expected)

    def test_network_failures_are_classified_without_logging_credentials(self):
        cases=[(socket.gaierror('private detail'),'rpc_dns_failed'),
               (ssl.SSLCertVerificationError('private detail'),'rpc_tls_certificate'),
               (PermissionError('private detail'),'rpc_connection_blocked'),
               (ConnectionResetError('private detail'),'rpc_connection_closed'),
               (ConnectionRefusedError('private detail'),'rpc_connection_refused')]
        for error,expected in cases:
            with patch.dict('os.environ',{'SUPABASE_SECRET_KEY':'secret'}),patch('backend.chat_store.urlopen',side_effect=URLError(error)):
                with self.assertRaises(StoreUnavailable) as caught: rpc('blog_catalog',{})
                self.assertEqual(str(caught.exception),expected)
