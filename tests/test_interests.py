import copy
import io
import json
import unittest
from email.message import Message
from urllib.error import HTTPError, URLError
from unittest.mock import MagicMock, patch

from api.interests import handler
from backend.interests import InvalidSubmission, StorageUnavailable, process_submission, save_interest, validate_submission


def submission(kind="nature"):
    values = {"name": " Ana ", "email": " ANA@example.invalid ", "phone": " +56 9 1234 5678 ", "contactPreference": "whatsapp"}
    values.update({"city": "Santiago"} if kind == "nature" else {"country": "Chile", "experience": ""})
    return {"interest": kind, "source_path": '/cursos' if kind == 'online' else '/', "values": values, "privacyConsent": True, "updatesConsent": False}


class ValidationTests(unittest.TestCase):
    def test_normalizes_values_without_enabling_updates(self):
        record = validate_submission(submission())
        self.assertEqual(record["full_name"], "Ana")
        self.assertEqual(record["email"], "ana@example.invalid")
        self.assertEqual(record["phone"], "+56912345678")
        self.assertEqual(record["contact_preference"], "whatsapp")
        self.assertEqual(record['source_path'], '/')
        self.assertFalse(record["updates_consent"])
        self.assertIsNone(record["country"])

    def test_online_has_country_without_city(self):
        record = validate_submission(submission("online"))
        self.assertEqual(record["country"], "Chile")
        self.assertIsNone(record["city"])
        self.assertIsNone(record["experience"])
        self.assertEqual(record['source_path'], '/cursos')

    @patch('backend.interests.save_interest')
    def test_rejects_missing_or_unsafe_source_paths_before_persistence(self, save):
        for path in (None, 'https://external.invalid', '/cursos?ref=value', '/cursos#online'):
            value = submission()
            value['source_path'] = path
            self.assertEqual(process_submission(value)[0], 400)
        save.assert_not_called()

    def test_rejects_invalid_inputs(self):
        invalid = [None, [], {}, {**submission(), "interest": "clinical"},
                   {**submission(), "privacyConsent": False}, {**submission(), "privacyConsent": "true"},
                   {**submission(), "updatesConsent": "false"}, {**submission(), "website": "spam"}]
        for key, value in (("name", ""), ("name", "a" * 121), ("email", "invalid"), ("email", "a@b c.invalid"),
                           ("city", ""), ("city", 123), ("clinical_notes", "extra")):
            payload = copy.deepcopy(submission())
            payload["values"][key] = value
            invalid.append(payload)
        for payload in invalid:
            with self.subTest(payload=payload), self.assertRaises(InvalidSubmission):
                validate_submission(payload)

    @patch("backend.interests.save_interest")
    def test_invalid_payload_never_calls_storage(self, save):
        self.assertEqual(process_submission({})[0], 400)
        save.assert_not_called()

    def test_both_forms_require_phone_and_an_explicit_allowed_preference(self):
        for kind in ('nature', 'online'):
            for key, value in (('phone', None), ('phone', ''), ('phone', '912345678'), ('phone', '+00000000'),
                               ('contactPreference', None), ('contactPreference', ''), ('contactPreference', 'email'),
                               ('contactPreference', ['email'])):
                payload = submission(kind)
                payload['values'][key] = value
                with self.subTest(kind=kind, key=key, value=value), self.assertRaises(InvalidSubmission):
                    validate_submission(payload)
            for key in ('phone', 'contactPreference'):
                payload = submission(kind)
                del payload['values'][key]
                with self.assertRaises(InvalidSubmission): validate_submission(payload)

    def test_both_forms_accept_each_preference_without_changing_it(self):
        for kind in ('nature', 'online'):
            for preference in ('video_call', 'phone', 'whatsapp'):
                payload = submission(kind)
                payload['values']['contactPreference'] = preference
                self.assertEqual(validate_submission(payload)['contact_preference'], preference)


class PersistenceTests(unittest.TestCase):
    @patch("backend.interests.urlopen")
    def test_confirms_only_created_records(self, open_url):
        open_url.return_value.__enter__.return_value.status = 201
        self.assertEqual(process_submission(submission()), (201, {"status": "saved"}))
        request = open_url.call_args.args[0]
        self.assertTrue(request.full_url.endswith("/rest/v1/interest_registrations"))
        self.assertEqual(request.get_header("Prefer"), "return=minimal")
        self.assertNotIn("Authorization", request.headers)

    @patch("backend.interests.urlopen")
    def test_network_failure_does_not_confirm(self, open_url):
        open_url.side_effect = URLError("offline")
        self.assertEqual(process_submission(submission())[0], 503)

    @patch("backend.interests.urlopen")
    def test_non_created_status_does_not_confirm(self, open_url):
        open_url.return_value.__enter__.return_value.status = 200
        with self.assertRaises(StorageUnavailable):
            save_interest(validate_submission(submission()))

    @patch("backend.interests.urlopen")
    def test_rate_limit_is_reported(self, open_url):
        open_url.side_effect = HTTPError("https://example.invalid", 400, "limit", {}, io.BytesIO(b'{"code":"P0001","message":"interest_rate_limited"}'))
        self.assertEqual(process_submission(submission())[0], 429)

    @patch("backend.interests.urlopen")
    def test_database_errors_do_not_leak_details(self, open_url):
        open_url.side_effect = HTTPError("https://example.invalid", 500, "error", {}, io.BytesIO(b'private details'))
        status, body = process_submission(submission())
        self.assertEqual(status, 503)
        self.assertNotIn("private", json.dumps(body))


class HandlerTests(unittest.TestCase):
    def request(self, body, content_type="application/json", length=None):
        request = object.__new__(handler)
        request.path = '/api/interests'
        request.headers = Message()
        request.headers["Content-Type"] = content_type
        request.headers["Content-Length"] = str(len(body) if length is None else length)
        request.rfile = io.BytesIO(body)
        request.wfile = io.BytesIO()
        request.send_response = MagicMock()
        request.send_header = MagicMock()
        request.end_headers = MagicMock()
        return request

    @patch("api.interests.process_submission", return_value=(201, {"status": "saved"}))
    def test_json_post_calls_application(self, process):
        request = self.request(json.dumps(submission()).encode())
        request.do_POST()
        request.send_response.assert_called_once_with(201)
        self.assertEqual(json.loads(request.wfile.getvalue()), {"status": "saved"})
        process.assert_called_once()

    @patch("api.interests.process_submission")
    def test_invalid_http_input_never_calls_storage(self, process):
        for body, mime, size, code in ((b'{}', 'text/plain', None, 415), (b'{', 'application/json', None, 400),
                                      (b'{}', 'application/json', 9000, 413), (b'{}', 'application/json', 'bad', 400)):
            with self.subTest(code=code):
                request = self.request(body, mime, size)
                request.do_POST()
                request.send_response.assert_called_once_with(code)
        process.assert_not_called()

    def test_reads_are_not_supported(self):
        request = self.request(b'')
        request.do_GET()
        request.send_response.assert_called_once_with(405)

    def test_cross_site_post_is_rejected(self):
        request = self.request(b'{}')
        request.headers['Sec-Fetch-Site'] = 'cross-site'
        request.do_POST()
        request.send_response.assert_called_once_with(403)


if __name__ == "__main__":
    unittest.main()
