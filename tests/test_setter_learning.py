import unittest
import io
import json
from pathlib import Path
from email.message import Message
from unittest.mock import MagicMock, patch
from uuid import uuid4

from backend.chat_store import StoreUnavailable
from backend.setter_learning import approved_examples, save_feedback
from backend.chatbot import render_decision, trusted_context
from backend.setter_config import validate_decision, RESPONSES, KNOWLEDGE, INSTRUCTIONS
from api.chat_feedback import handler


def suggestion():
    return {'id': str(uuid4()), 'request_id': str(uuid4()), 'conversation_id': str(uuid4()),
            'category': 'irrelevant', 'question': '¿En qué consiste el método floral Bach?',
            'suggestion': 'Explicar el método y preguntar si le interesa aprenderlo.', 'comment': '', 'consent': True}


class LearningTests(unittest.TestCase):
    def request(self, body=b'{}'):
        request = object.__new__(handler)
        request.headers = Message()
        request.headers['Content-Type'] = 'application/json'
        request.headers['Content-Length'] = str(len(body))
        request.headers['Host'] = 'localhost:5173'
        request.headers['Origin'] = 'http://localhost:5173'
        request.rfile = io.BytesIO(body)
        request.reply = MagicMock()
        return request

    @patch('api.chat_feedback.save_feedback')
    def test_cross_origin_and_oversized_feedback_never_reaches_storage(self, save):
        request = self.request()
        request.headers.replace_header('Origin', 'https://elsewhere.invalid')
        request.do_POST()
        self.assertEqual(request.reply.call_args.args[0], 403)
        request = self.request()
        request.headers.replace_header('Content-Length', '9000')
        request.do_POST()
        self.assertEqual(request.reply.call_args.args[0], 413)
        save.assert_not_called()

    @patch('api.chat_feedback.visitor_from_cookie', return_value='signed-visitor')
    @patch('api.chat_feedback.save_feedback', return_value=(201, {'status': 'saved'}))
    def test_feedback_endpoint_uses_signed_identity_and_confirms_actual_save(self, save, identity):
        request = self.request()
        request.do_POST()
        save.assert_called_once_with({}, 'signed-visitor')
        request.reply.assert_called_once_with(201, {'status': 'saved'})

    @patch('backend.setter_learning.rpc', return_value={'status': 'saved'})
    def test_only_explicit_case_is_submitted_and_no_model_is_invoked(self, rpc):
        visitor = str(uuid4())
        self.assertEqual(save_feedback(suggestion(), visitor), (201, {'status': 'saved'}))
        self.assertEqual(rpc.call_args.args[0], 'setter_feedback_save')
        self.assertNotIn('messages', rpc.call_args.args[1]['p_values'])

    @patch('backend.setter_learning.rpc')
    def test_missing_identity_consent_or_unexpected_payload_never_reaches_storage(self, rpc):
        self.assertEqual(save_feedback(suggestion(), None)[0], 401)
        for update in ({'consent': False}, {'consent': 'true'}, {'id': 'bad'}, {'messages': []},
                       {'question': ''}, {'suggestion': 'x' * 1001}, {'category': 'approve'}):
            with self.subTest(update=update):
                self.assertEqual(save_feedback({**suggestion(), **update}, str(uuid4()))[0], 400)
        rpc.assert_not_called()

    @patch('backend.setter_learning.rpc', side_effect=StoreUnavailable())
    def test_optional_examples_fail_open_but_feedback_save_does_not_claim_success(self, rpc):
        self.assertEqual(approved_examples(), [])
        self.assertEqual(save_feedback(suggestion(), str(uuid4()))[0], 503)

    @patch('backend.setter_learning.rpc', return_value={'examples': [{'question': 'Caso', 'answer': 'Respuesta'}] * 12})
    def test_examples_are_bounded_and_loaded_only_through_reviewed_rpc(self, rpc):
        self.assertEqual(len(approved_examples()), 8)
        rpc.assert_called_once_with('setter_learning_examples', {})

    def test_natural_reply_is_used_instead_of_the_generic_services_list(self):
        decision = {'topic': 'therapies', 'response_key': 'therapies_info', 'action': 'show_therapies',
                    'contact_signal': 'none', 'reply': 'El método de Bach parte de observar los estados emocionales. ¿Te interesa aprenderlo?'}
        self.assertEqual(render_decision(validate_decision(decision, trusted_context({}), require_reply=True), {})['reply'], decision['reply'])
        for reply in ('', 'x' * 701, 'Abre https://example.com', '<script>x</script>'):
            with self.assertRaises(ValueError):
                validate_decision({**decision, 'reply': reply}, trusted_context({}), require_reply=True)
        with self.assertRaises(ValueError):
            validate_decision({k: v for k, v in decision.items() if k != 'reply'}, trusted_context({}), require_reply=True)

    def test_health_boundary_cannot_be_replaced_with_a_generated_claim(self):
        decision = {'topic': 'therapies', 'response_key': 'medical_boundary', 'action': 'none',
                    'contact_signal': 'none', 'reply': 'Esta frase no debe publicarse.'}
        self.assertEqual(render_decision(decision, {})['reply'], RESPONSES['medical_boundary'])

    def test_educational_flower_associations_are_available_to_the_provider(self):
        facts = {fact['id']: fact for fact in trusted_context({})['approved_facts']}
        for key, name in (('bach_mimulus', 'Mimulus'), ('bach_aspen', 'Aspen'), ('bach_rock_rose', 'Rock Rose'),
                          ('bach_red_chestnut', 'Red Chestnut'), ('bach_white_chestnut', 'White Chestnut')):
            self.assertIn(name, facts[key]['text'])
            self.assertTrue(facts[key]['source'].startswith('https://bachcentre.com/'))
        self.assertIn('EDUCACIÓN SOBRE EL MÉTODO', INSTRUCTIONS)
        self.assertIn('INDICACIÓN PERSONAL', INSTRUCTIONS)
        self.assertNotIn('orientaci?n', INSTRUCTIONS)

    def test_institutional_voice_is_explicit_and_used_by_protected_copy(self):
        self.assertIn('VOZ INSTITUCIONAL', INSTRUCTIONS)
        self.assertIn('primera persona plural', INSTRUCTIONS)
        self.assertIn('Podemos', RESPONSES['greeting'])
        self.assertIn('podemos', RESPONSES['payment_unverified'])
        self.assertIn('Podemos', RESPONSES['medical_boundary'])
        self.assertNotIn('Nicolás Zamara ofrece', json.dumps(KNOWLEDGE, ensure_ascii=False))

    def test_educational_replies_remain_conversational_while_personal_indications_use_boundary_copy(self):
        cases = json.loads(Path('config/chatbot/education-cases.json').read_text(encoding='utf-8'))['cases']
        for case in cases:
            with self.subTest(case=case['id']):
                reply = 'Según Bach, Mimulus se asocia a miedos conocidos y Aspen a aprensión sin causa identificable; Rock Rose, a terror intenso.'
                decision = {'topic': 'therapies', 'response_key': case['response_key'],
                            'action': 'none' if case['response_key'] == 'medical_boundary' else 'show_therapies',
                            'contact_signal': 'none', 'reply': reply}
                result = render_decision(validate_decision(decision, trusted_context({}), require_reply=True), {})
                if case['response_key'] == 'medical_boundary':
                    self.assertEqual(result['reply'], RESPONSES['medical_boundary'])
                else:
                    self.assertEqual(result['reply'], reply)
                    for name in case['expected_mentions']:
                        self.assertIn(name, result['reply'])
                    for phrase in case['forbidden_reply']:
                        self.assertNotIn(phrase, result['reply'].lower())


if __name__ == '__main__':
    unittest.main()
