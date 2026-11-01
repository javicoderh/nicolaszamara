import io
import json
import os
import unittest
from email.message import Message
from unittest.mock import MagicMock, patch
from uuid import uuid4

from api.admin import handler
from backend.admin import process_admin, date_bounds, cursor_values
from backend.admin_security import password_hash, verify_password, session_cookie, session_token, token_hash
from backend.chat_store import StoreUnavailable


class SecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.encoded = password_hash('a-unit-password-only')

    def test_salted_hash_and_password_verification(self):
        self.assertNotIn('a-unit-password-only', self.encoded)
        self.assertNotEqual(self.encoded, password_hash('a-unit-password-only'))
        self.assertTrue(verify_password('a-unit-password-only', self.encoded))
        self.assertFalse(verify_password('wrong', self.encoded))
        for value in ('broken', None, 'pbkdf2_sha256$1$aa$bb'):
            self.assertFalse(verify_password('anything', value))

    @patch.dict(os.environ, {'APP_ENV': 'production'})
    def test_cookie_is_private_scoped_and_clearable(self):
        token = 'a' * 43
        cookie = session_cookie(token)
        for part in ('HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/api/admin', 'Max-Age=28800'):
            self.assertIn(part, cookie)
        self.assertEqual(session_token(cookie), token)
        self.assertIsNone(session_token('nz_admin=bad'))
        self.assertIsNone(session_token('nz_admin=' + 'é' * 43))
        self.assertIn('Max-Age=0', session_cookie(clear=True))
        self.assertEqual(len(token_hash(token)), 64)


class FilterTests(unittest.TestCase):
    def test_chilean_calendar_dates_and_inclusive_range(self):
        self.assertEqual(date_bounds({'mode': 'day', 'day': '2026-11-01'})['start'], '2026-11-01T03:00:00+00:00')
        self.assertEqual(date_bounds({'mode': 'month', 'month': '2026-02'})['end'], '2026-03-01T03:00:00+00:00')
        self.assertEqual(date_bounds({'mode': 'range', 'start': '2026-10-31', 'end': '2026-11-01'})['end'], '2026-11-02T03:00:00+00:00')
        self.assertEqual(date_bounds({}), {'start': None, 'end': None, 'interest': None, 'reading': 'all'})
        self.assertEqual(date_bounds({'reading': 'unread'})['reading'], 'unread')
        self.assertEqual(date_bounds({'reading': 'read'})['reading'], 'read')

    def test_dst_day_does_not_assume_24_hours(self):
        value = date_bounds({'mode': 'day', 'day': '2026-09-06'})
        self.assertEqual(value['start'], '2026-09-06T04:00:00+00:00')
        self.assertEqual(value['end'], '2026-09-07T03:00:00+00:00')

    def test_invalid_filters_and_cursors(self):
        for filters in ({'mode': 'bad'}, {'mode': 'day', 'day': 'bad'}, {'mode': 'month', 'month': '2026-13'},
                        {'mode': 'range', 'start': '2026-11-02', 'end': '2026-11-01'}, {'interest': 'bad'}, {'reading': 'bad'}, {'sql': 'x'}):
            with self.subTest(filters=filters), self.assertRaises((ValueError, KeyError)):
                date_bounds(filters)
        for cursor in ({'id': 'bad'}, {'id': str(uuid4()), 'created_at': '2026-01-01'}, 'bad'):
            with self.assertRaises(ValueError): cursor_values(cursor)


class CoordinatorTests(unittest.TestCase):
    def test_mark_read_requires_session_and_accepts_only_a_valid_id(self):
        record_id = str(uuid4())
        call = MagicMock(return_value={'status': 'ready', 'id': record_id, 'read_at': '2026-11-01T12:00:00Z'})
        self.assertEqual(process_admin({'operation': 'mark_read', 'id': record_id}, call=call)[0], 401)
        call.assert_not_called()
        self.assertEqual(process_admin({'operation': 'mark_read', 'id': 'invalid'}, 'a' * 43, call)[0], 400)
        call.assert_not_called()
        result = process_admin({'operation': 'mark_read', 'id': record_id}, 'a' * 43, call)
        self.assertEqual(result[0], 200)
        self.assertEqual(call.call_args.args[1], {'p_operation': 'mark_read', 'p_values': {'id': record_id, 'token_hash': token_hash('a' * 43)}})
        self.assertEqual(result[1]['read_at'], '2026-11-01T12:00:00Z')

    def test_mark_read_preserves_not_found_and_expired_session_errors(self):
        for status, code in (('not_found', 404), ('unauthorized', 401)):
            call = MagicMock(return_value={'status': status})
            self.assertEqual(process_admin({'operation': 'mark_read', 'id': str(uuid4())}, 'a' * 43, call)[0], code)

    def test_no_session_never_queries_interests(self):
        call = MagicMock()
        self.assertEqual(process_admin({'operation': 'interests'}, call=call)[:2], (401, {'status': 'unauthorized'}))
        call.assert_not_called()

    def test_wrong_password_returns_no_hash_and_no_session(self):
        call = MagicMock(return_value={'status': 'challenge', 'password_hash': 'private-hash'})
        with patch('backend.admin.verify_password', return_value=False):
            code, result, token = process_admin({'operation': 'login', 'username': 'unit', 'password': 'wrong'}, call=call)
        self.assertEqual((code, result, token), (401, {'status': 'invalid_credentials'}, None))
        self.assertEqual(call.call_count, 1)

    def test_login_creates_opaque_token_and_never_returns_hash(self):
        call = MagicMock(side_effect=[{'status': 'challenge', 'password_hash': 'private-hash', 'user_id': str(uuid4())}, {'status': 'authenticated', 'username': 'unit'}])
        with patch('backend.admin.verify_password', return_value=True):
            code, result, token = process_admin({'operation': 'login', 'username': 'unit', 'password': 'valid'}, call=call)
        self.assertEqual(code, 200)
        self.assertEqual(result, {'status': 'authenticated', 'username': 'unit'})
        self.assertEqual(len(token), 43)
        self.assertEqual(call.call_args.args[1]['p_values']['token_hash'], token_hash(token))

    def test_locked_account_does_not_verify_or_create_session(self):
        call = MagicMock(return_value={'status': 'rate_limited'})
        with patch('backend.admin.verify_password') as verify:
            self.assertEqual(process_admin({'operation': 'login', 'username': 'unit', 'password': 'x'}, call=call)[0], 429)
            verify.assert_not_called()

    def test_expired_session_discards_cookie_and_never_falls_back(self):
        call = MagicMock(return_value={'status': 'unauthorized'})
        self.assertEqual(process_admin({'operation': 'detail', 'id': str(uuid4())}, 'a' * 43, call), (401, {'status': 'unauthorized'}, ''))

    def test_filters_are_normalized_and_cursor_forwarded(self):
        call = MagicMock(return_value={'status': 'ready', 'items': []})
        result = process_admin({'operation': 'interests', 'filters': {'mode': 'day', 'day': '2026-11-01'},
                                'cursor': {'created_at': '2026-11-01T10:00:00Z', 'id': str(uuid4())}}, 'a' * 43, call)
        self.assertEqual(result[0], 200)
        values = call.call_args.args[1]['p_values']
        self.assertEqual(values['end'], '2026-11-02T03:00:00+00:00')
        self.assertIn('cursor_id', values)
        self.assertNotIn('a' * 43, values.values())

    def test_password_change_verifies_current_and_revokes_cookie(self):
        call = MagicMock(side_effect=[{'status': 'authenticated', 'username': 'unit'},
                                     {'status': 'challenge', 'password_hash': 'old-hash'}, {'status': 'password_changed'}])
        with patch('backend.admin.verify_password', return_value=True), patch('backend.admin.password_hash', return_value='new-hash'):
            self.assertEqual(process_admin({'operation': 'password', 'currentPassword': 'old', 'newPassword': 'a-new-password'}, 'a' * 43, call),
                             (200, {'status': 'password_changed'}, ''))
        self.assertEqual(call.call_args.args[1]['p_values']['new_hash'], 'new-hash')

    def test_password_change_wrong_current_does_not_write(self):
        call = MagicMock(side_effect=[{'status': 'authenticated', 'username': 'unit'}, {'status': 'challenge', 'password_hash': 'old-hash'}])
        with patch('backend.admin.verify_password', return_value=False):
            self.assertEqual(process_admin({'operation': 'password', 'currentPassword': 'wrong', 'newPassword': 'a-new-password'}, 'a' * 43, call)[1], {'status': 'wrong_password'})
        self.assertEqual(call.call_count, 2)

    def test_invalid_input_and_unavailable_store_are_closed(self):
        for payload in (None, {'operation': 'bad'}, {'operation': 'login', 'username': 'unit', 'password': 'x', 'role': 'admin'},
                        {'operation': 'password', 'currentPassword': 'old', 'newPassword': 'short'}, {'operation': 'detail', 'id': 'bad'}):
            self.assertEqual(process_admin(payload, 'a' * 43, MagicMock())[0], 400)
        call = MagicMock(side_effect=StoreUnavailable())
        self.assertEqual(process_admin({'operation': 'session'}, 'a' * 43, call)[0], 503)


class HttpTests(unittest.TestCase):
    def request(self, body, extra=None):
        instance = object.__new__(handler)
        instance.path = '/api/admin'
        instance.headers = Message()
        for key, value in {'Host': 'localhost:5173', 'Origin': 'http://localhost:5173', 'Content-Type': 'application/json',
                           'X-Admin-Request': '1', 'Content-Length': str(len(body)), **(extra or {})}.items():
            instance.headers[key] = value
        instance.rfile = io.BytesIO(body)
        instance.reply = MagicMock()
        return instance

    @patch('api.admin.process_admin')
    def test_cross_origin_and_missing_csrf_header_rejected(self, process):
        for extra in ({'Origin': 'https://evil.invalid'}, {'X-Admin-Request': ''}):
            instance = self.request(b'{}', extra)
            instance.do_POST()
            self.assertEqual(instance.reply.call_args.args[0], 403)
        process.assert_not_called()

    @patch('api.admin.process_admin', return_value=(200, {'status': 'authenticated', 'username': 'unit'}, 'a' * 43))
    def test_sets_httponly_cookie_and_returns_only_public_result(self, process):
        instance = self.request(json.dumps({'operation': 'login'}).encode())
        instance.do_POST()
        self.assertIn('HttpOnly', instance.setter_cookie)
        self.assertEqual(instance.reply.call_args.args[1], {'status': 'authenticated', 'username': 'unit'})
