import copy
import io
import json
import os
import unittest
from email.message import Message
from pathlib import Path
from unittest.mock import MagicMock, patch
from urllib.error import URLError
from uuid import uuid4

from api.chat import handler
from backend.chatbot import (InvalidChatRequest, OpenAIUnavailable, choose_response, extract_decision,
                             process_chat, render_decision, trusted_context, validate_messages)
from backend.chat_identity import issue_identity, visitor_from_cookie
from backend.chat_store import StoreUnavailable, SupabaseChatUsageStore, budget_limits, rpc
from backend.interests import InvalidSubmission, process_submission, validate_submission
from backend.setter_config import CONFIG, POLICY, RESPONSES, validate_decision

ENV = {'CHAT_COOKIE_SECRET': 'unit-secret-with-at-least-32-characters', 'OPENAI_API_KEY': 'unit-key',
       'CHAT_INPUT_USD_PER_MILLION': '1', 'CHAT_OUTPUT_USD_PER_MILLION': '2', 'CHAT_DAILY_BUDGET_MICRO_USD': '1000000'}
VISITOR, CONVERSATION, REQUEST = (str(uuid4()) for _ in range(3))
DECISION = {'topic': 'course', 'response_key': 'hotmart_link', 'action': 'show_hotmart', 'contact_signal': 'none', 'reply': RESPONSES['hotmart_link']}


def state(**values):
    return {'conversation_id': CONVERSATION, 'completed_rounds': 0, 'provider_attempts': 0, 'topic': 'unknown',
            'action': 'none', 'contact_declined': False, 'can_send': True, 'closed': False, **values}


def payload():
    return {'messages': [{'role': 'user', 'content': 'Quiero inscribirme'}], 'conversation_id': CONVERSATION, 'request_id': REQUEST}


def contact(preference='whatsapp'):
    return {'source': 'chatbot', 'source_path': '/chatbot', 'interest': 'consultation', 'conversation_id': CONVERSATION, 'request_id': REQUEST,
            'values': {'name': ' Ana ', 'contactPreference': preference, 'phone': '+56 9 1234 5678',
                       'email': ' ANA@example.invalid '},
            'privacyConsent': True, 'contactConsent': True, 'updatesConsent': False}


class ValidationTests(unittest.TestCase):
    def test_history_validation(self):
        self.assertEqual(validate_messages(payload()['messages']), payload()['messages'])
        for value in ([], None, [{'role': 'system', 'content': 'x'}], [{'role': 'user', 'content': 'x' * 1001}],
                      [{'role': 'assistant', 'content': 'x'}], [{'role': 'user', 'content': 'x', 'quota': 0}],
                      [{'role': 'user', 'content': 'x'}] * 13):
            with self.subTest(value=value), self.assertRaises(InvalidChatRequest):
                validate_messages(value)

    def test_all_32_reference_decisions_are_valid_contracts(self):
        cases = json.loads(Path('config/chatbot/decision-cases.json').read_text(encoding='utf-8'))
        self.assertEqual(len(cases['model_cases']), 32)
        for case in cases['model_cases']:
            with self.subTest(case=case['id']):
                context = {**cases['server_context_defaults'], **case['input']['server_context']}
                self.assertEqual(validate_decision(case['expected'], context), case['expected'])

    def test_invalid_combinations_and_contact_signals(self):
        invalid = [{**DECISION, 'action': 'start_contact_capture'}, {**DECISION, 'topic': 'nature'},
                   {**DECISION, 'response_key': 'unknown'}, {**DECISION, 'extra': True},
                   {'topic': 'course', 'response_key': 'contact_offer', 'action': 'start_contact_capture', 'contact_signal': 'none'},
                   {'topic': 'course', 'response_key': 'contact_offer', 'action': 'offer_contact', 'contact_signal': 'declined'}]
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_decision(value, trusted_context(state()))

    def test_declined_contact_persists_until_requested_again(self):
        context = trusted_context(state(contact_declined=True))
        offer = {'topic': 'course', 'response_key': 'contact_offer', 'action': 'offer_contact', 'contact_signal': 'none'}
        with self.assertRaises(ValueError): validate_decision(offer, context)
        self.assertEqual(validate_decision({**offer, 'contact_signal': 'requested'}, context)['action'], 'offer_contact')

    def test_closing_is_deterministic_and_respects_health_and_decline(self):
        late = state(completed_rounds=7, topic='consultation')
        consultation = {'topic': 'consultation', 'response_key': 'consultation_info', 'action': 'show_consultation', 'contact_signal': 'none'}
        self.assertEqual(render_decision(consultation, late)['action'], 'offer_contact')
        self.assertEqual(render_decision(consultation, {**late, 'contact_declined': True})['action'], 'show_consultation')
        medical = {'topic': 'consultation', 'response_key': 'medical_boundary', 'action': 'none', 'contact_signal': 'none'}
        self.assertEqual(render_decision(medical, late)['reply'], RESPONSES['medical_boundary'])


@patch.dict(os.environ, ENV)
class CoordinatorTests(unittest.TestCase):
    def test_authorizes_before_provider_and_commits_approved_result(self):
        store, selector = MagicMock(), MagicMock(return_value=(DECISION, {'input_tokens': 10}))
        store.transition.side_effect = [{'status': 'new', 'state': state()}, {'status': 'reserved', 'state': state(provider_attempts=1)},
                                       {'status': 'completed', 'state': state(completed_rounds=1), 'result': {'reply': 'approved'}}]
        code, result = process_chat(payload(), VISITOR, store, selector)
        self.assertEqual(code, 200)
        self.assertEqual([call.args[1] for call in store.transition.call_args_list], ['lookup', 'reserve', 'complete'])
        self.assertEqual(store.transition.call_args.kwargs['result']['reply'], RESPONSES['hotmart_link'])
        self.assertEqual(selector.call_count, 1)
        self.assertEqual(result['policy'], POLICY)

    def test_no_provider_after_preflight_rejection_or_idempotent_recovery(self):
        for outcome in ('conversation_closed', 'attempt_budget_exhausted', 'daily_limit', 'capture_active',
                        'pending', 'uncertain', 'failed', 'completed', 'request_conflict', 'conversation_changed'):
            with self.subTest(outcome=outcome):
                store, selector = MagicMock(), MagicMock()
                store.transition.return_value = {'status': outcome, 'state': state()}
                self.assertEqual(process_chat(payload(), VISITOR, store, selector)[1]['status'], outcome)
                selector.assert_not_called()

    def test_reservation_denial_never_calls_provider(self):
        store, selector = MagicMock(), MagicMock()
        store.transition.side_effect = [{'status': 'new', 'state': state()}, {'status': 'global_budget_exhausted', 'state': state()}]
        process_chat(payload(), VISITOR, store, selector)
        selector.assert_not_called()

    @patch('backend.chatbot.MAX_INPUT_BYTES', 100)
    def test_oversized_provider_payload_is_rejected_before_reservation(self):
        store, selector = MagicMock(), MagicMock()
        store.transition.return_value = {'status': 'new', 'state': state()}
        self.assertEqual(process_chat(payload(), VISITOR, store, selector)[0], 400)
        self.assertEqual(store.transition.call_count, 1)
        selector.assert_not_called()

    def test_provider_failure_does_not_count_a_round_or_retry(self):
        store, selector = MagicMock(), MagicMock(side_effect=OpenAIUnavailable())
        store.transition.side_effect = [{'status': 'new', 'state': state()}, {'status': 'reserved', 'state': state()}, {'status': 'failed', 'state': state()}]
        self.assertEqual(process_chat(payload(), VISITOR, store, selector)[0], 503)
        self.assertEqual(store.transition.call_args.args[1], 'fail')
        selector.assert_called_once()

    def test_storage_failure_after_provider_does_not_retry_or_claim_success(self):
        store, selector = MagicMock(), MagicMock(return_value=(DECISION, {}))
        store.transition.side_effect = [{'status': 'new', 'state': state()}, {'status': 'reserved', 'state': state()}, StoreUnavailable()]
        self.assertEqual(process_chat(payload(), VISITOR, store, selector)[1]['status'], 'storage_unavailable')
        selector.assert_called_once()

    def test_invalid_or_missing_identity_never_reaches_storage(self):
        store = MagicMock()
        self.assertEqual(process_chat(payload(), store=store)[0], 401)
        for value in ({}, {**payload(), 'request_id': 'invalid'}, {**payload(), 'messages': []}, []):
            self.assertEqual(process_chat(value, VISITOR, store)[0], 400)
        store.transition.assert_not_called()

    @patch.dict(os.environ, {'OPENAI_API_KEY': ''})
    def test_no_key_still_allows_capture_and_saved_replay(self):
        store, selector = MagicMock(), MagicMock()
        store.transition.return_value = {'status': 'new', 'state': state()}
        self.assertEqual(process_chat(payload(), VISITOR, store, selector)[1]['status'], 'not_configured')
        code, _ = process_chat({'operation': 'start_capture', 'conversation_id': CONVERSATION}, VISITOR, store, selector)
        self.assertEqual(code, 200)
        selector.assert_not_called()


@patch.dict(os.environ, ENV)
class AdapterTests(unittest.TestCase):
    @patch('backend.chatbot.urlopen')
    def test_responses_api_uses_schema_no_storage_and_usage(self, open_url):
        response = open_url.return_value.__enter__.return_value
        response.status = 200
        response.read.return_value = json.dumps({'status': 'completed', 'output': [{'type': 'message', 'content': [
            {'type': 'output_text', 'text': json.dumps(DECISION)}]}], 'usage': {'input_tokens': 10, 'output_tokens': 5}}).encode()
        decision, usage = choose_response(payload()['messages'], trusted_context(state()))
        self.assertEqual(decision, DECISION)
        body = json.loads(open_url.call_args.args[0].data)
        self.assertEqual(body['text']['format'], CONFIG['structured_output'])
        self.assertFalse(body['store'])
        self.assertEqual(usage['input_tokens'], 10)
        self.assertNotIn('contact_email', body['instructions'])

    def test_incomplete_refusal_and_unknown_decisions_fail(self):
        for response in ({'status': 'incomplete'}, {'status': 'completed', 'output': []},
                         {'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'refusal'}]}]}):
            with self.assertRaises(OpenAIUnavailable): extract_decision(response, trusted_context(state()))

    def test_budget_requires_explicit_rates_and_uses_a_conservative_bound(self):
        self.assertEqual(budget_limits()['reservation_micro_usd'], 68608)
        with patch.dict(os.environ, {'CHAT_INPUT_USD_PER_MILLION': 'NaN'}), self.assertRaises(StoreUnavailable): budget_limits()
        with patch.dict(os.environ, {'CHAT_DAILY_BUDGET_MICRO_USD': '0'}), self.assertRaises(StoreUnavailable): budget_limits()

    @patch('backend.chat_store.urlopen')
    def test_missing_server_key_never_calls_public_storage(self, open_url):
        with patch.dict(os.environ, {'SUPABASE_SECRET_KEY': ''}), self.assertRaises(StoreUnavailable): rpc('setter_transition', {})
        open_url.assert_not_called()

    @patch.dict(os.environ, {'SUPABASE_SECRET_KEY': 'sb_secret_unit'})
    @patch('backend.chat_store.urlopen')
    def test_rpc_uses_server_key_and_failure_is_closed(self, open_url):
        response = open_url.return_value.__enter__.return_value
        response.status, response.read.return_value = 200, b'{"status":"ready"}'
        self.assertEqual(rpc('setter_transition', {})['status'], 'ready')
        self.assertEqual(open_url.call_args.args[0].get_header('Apikey'), 'sb_secret_unit')
        open_url.side_effect = URLError('offline')
        with self.assertRaises(StoreUnavailable): rpc('setter_transition', {})


@patch.dict(os.environ, ENV)
class ContactTests(unittest.TestCase):
    @patch('backend.interests.rpc')
    def test_each_contact_channel_requires_email_before_storage(self, save):
        for preference in ('video_call', 'phone', 'whatsapp'):
            for email in ('', None, 'invalid'):
                value = contact(preference)
                value['values']['email'] = email
                self.assertEqual(process_submission(value, VISITOR)[0], 400)
        value = contact()
        value['values']['contactPreference'] = 'email'
        self.assertEqual(process_submission(value, VISITOR)[0], 400)
        save.assert_not_called()

    def test_normalizes_each_preference_with_required_phone(self):
        for preference in ('whatsapp', 'phone', 'video_call'):
            record = validate_submission(contact(preference))
            self.assertEqual(record['full_name'], 'Ana')
            self.assertFalse(record['updates_consent'])
            self.assertEqual(record['email'], 'ana@example.invalid')
            self.assertEqual(record['phone'], '+56912345678')
            self.assertEqual(record['source_path'], '/chatbot')
            self.assertEqual(record['contact_preference'], preference)

    def test_explicit_consent_service_and_minimal_fields_required(self):
        for change in ({'contactConsent': False}, {'privacyConsent': 'true'}, {'interest': 'clinical'}, {'request_id': 'x'}, {'updatesConsent': 'true'}):
            with self.subTest(change=change), self.assertRaises(InvalidSubmission): validate_submission({**contact(), **change})
        value = contact()
        value['values']['clinical_notes'] = 'must not be accepted'
        with self.assertRaises(InvalidSubmission): validate_submission(value)

    @patch('backend.interests.rpc', return_value={'status': 'saved'})
    def test_saved_only_after_atomic_insert_and_same_hash_for_retry(self, call):
        self.assertEqual(process_submission(contact(), VISITOR), (201, {'status': 'saved'}))
        first = call.call_args
        self.assertEqual(process_submission(contact(), VISITOR)[0], 201)
        self.assertEqual(first, call.call_args)
        self.assertNotIn('messages', call.call_args.args[1])
        call.side_effect = StoreUnavailable()
        self.assertEqual(process_submission(contact(), VISITOR)[0], 503)

    @patch('backend.interests.rpc')
    def test_anonymous_or_unconsented_capture_never_saves(self, call):
        self.assertEqual(process_submission(contact())[0], 401)
        self.assertEqual(process_submission({**contact(), 'contactConsent': False}, VISITOR)[0], 400)
        call.assert_not_called()


@patch.dict(os.environ, ENV)
class IdentityAndHttpTests(unittest.TestCase):
    def test_cookie_is_signed_http_only_and_rejects_tampering(self):
        visitor, cookie = issue_identity()
        self.assertEqual(visitor_from_cookie(cookie), visitor)
        self.assertIn('HttpOnly', cookie)
        self.assertIn('SameSite=Lax', cookie)
        self.assertIsNone(visitor_from_cookie(cookie.replace(visitor, str(uuid4()))))
        with patch('backend.chat_identity.time.time', return_value=99999999999):
            self.assertIsNone(visitor_from_cookie(cookie))
        with patch.dict(os.environ, {'APP_ENV': 'production'}):
            self.assertIn('Secure', issue_identity()[1])

    def request(self, body=b'{}'):
        request = object.__new__(handler)
        request.path = '/api/chat'
        request.headers = Message()
        request.headers['Content-Type'] = 'application/json'
        request.headers['Content-Length'] = str(len(body))
        request.rfile, request.wfile = io.BytesIO(body), io.BytesIO()
        request.send_response, request.send_header, request.end_headers = MagicMock(), MagicMock(), MagicMock()
        return request

    @patch('api.chat.process_chat', return_value=(200, {'status': 'ready'}))
    def test_get_bootstraps_cookie_and_session_without_provider(self, process):
        request = self.request()
        request.do_GET()
        self.assertIn('HttpOnly', request.setter_cookie)
        self.assertEqual(process.call_args.args[0], {'operation': 'session'})

    @patch('api.chat.process_chat')
    def test_rejects_invalid_http_and_cross_origin(self, process):
        for header, value in (('Content-Type', 'text/plain'), ('Content-Length', '65537'), ('Sec-Fetch-Site', 'cross-site'), ('Origin', 'https://elsewhere.invalid')):
            request = self.request()
            request.headers.replace_header(header, value) if header in request.headers else request.headers.add_header(header, value)
            request.do_POST()
            self.assertGreaterEqual(request.send_response.call_args.args[0], 400)
        process.assert_not_called()

    def test_local_origin_requires_preserved_browser_host(self):
        request = self.request()
        request.headers['Origin'] = 'http://localhost:5173'
        request.headers['Host'] = 'localhost:5173'
        request.headers['Sec-Fetch-Site'] = 'same-origin'
        self.assertTrue(request.same_origin())
        request.headers.replace_header('Host', '127.0.0.1:3001')
        self.assertFalse(request.same_origin())
        request.headers.replace_header('Host', 'localhost:5173')
        request.headers.replace_header('Origin', 'https://elsewhere.invalid')
        self.assertFalse(request.same_origin())


if __name__ == '__main__':
    unittest.main()
