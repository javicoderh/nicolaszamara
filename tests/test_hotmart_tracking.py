import io
import unittest
from email.message import Message
from unittest.mock import MagicMock, patch
from uuid import uuid4

from api.hotmart_click import handler
from backend.chat_store import StoreUnavailable
from backend.hotmart_tracking import record_click
from backend.source_context import source_path


def click(source='chatbot', path='/chatbot'):
    return {'event_id': str(uuid4()), 'source': source, 'source_path': path}


class HotmartTrackingTests(unittest.TestCase):
    @patch('backend.hotmart_tracking.rpc', return_value={'status': 'recorded'})
    def test_the_three_sources_use_server_rpc_with_signed_visitor(self, rpc):
        visitor = str(uuid4())
        for source, path in (('chatbot', '/chatbot'), ('course', '/cursos'), ('home', '/')):
            self.assertEqual(record_click(click(source, path), visitor)[0], 200)
            self.assertEqual(rpc.call_args.args[1]['p_visitor'], visitor)
            self.assertEqual(rpc.call_args.args[1]['p_source'], source)

    @patch('backend.hotmart_tracking.rpc')
    def test_rejects_forged_identity_and_invalid_sources_or_paths_before_storage(self, rpc):
        for changes in ({'visitor': str(uuid4())}, {'source': 'other'}, {'event_id': 'bad'},
                        {'source_path': 'https://external.invalid'}, {'source_path': '/cursos?email=value'},
                        {'source': 'course', 'source_path': '/'}, {'source_path': '//external'}):
            self.assertEqual(record_click({**click(), **changes}, str(uuid4()))[0], 400)
        rpc.assert_not_called()

    @patch('backend.hotmart_tracking.rpc', side_effect=StoreUnavailable())
    def test_storage_failure_does_not_claim_a_count(self, rpc):
        self.assertEqual(record_click(click(), str(uuid4())), (503, {'status': 'unavailable'}))

    def request(self):
        request = object.__new__(handler)
        request.headers = Message()
        request.headers['Content-Type'] = 'application/json'
        request.headers['Content-Length'] = '2'
        request.headers['Host'] = 'localhost:5173'
        request.headers['Origin'] = 'http://localhost:5173'
        request.rfile = io.BytesIO(b'{}')
        request.reply = MagicMock()
        return request

    @patch('api.hotmart_click.visitor_from_cookie', return_value=None)
    @patch('api.hotmart_click.issue_identity', return_value=('visitor', 'signed-http-only-cookie'))
    @patch('api.hotmart_click.record_click', return_value=(200, {'status': 'recorded'}))
    def test_first_click_establishes_the_shared_identity(self, record, issue, visitor):
        request = self.request()
        request.do_POST()
        self.assertEqual(request.setter_cookie, 'signed-http-only-cookie')
        record.assert_called_once_with({}, 'visitor')

    @patch('api.hotmart_click.record_click')
    def test_cross_origin_clicks_never_reach_storage(self, record):
        request = self.request()
        request.headers.replace_header('Origin', 'https://elsewhere.invalid')
        request.do_POST()
        request.reply.assert_called_once_with(403, {'status': 'invalid'})
        record.assert_not_called()

    def test_relative_route_normalization(self):
        self.assertEqual(source_path('/cursos/'), '/cursos')
        self.assertEqual(source_path('/'), '/')
        for path in (None, 'https://external.invalid', '/cursos#section', '/cursos?ref=value', '//external'):
            with self.assertRaises(ValueError): source_path(path)


if __name__ == '__main__':
    unittest.main()
