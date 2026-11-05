import os
import unittest
from unittest.mock import Mock,patch
from uuid import uuid4
from backend.blog_social import identity,process_social


class SocialTests(unittest.TestCase):
    def test_reading_does_not_create_a_cookie_and_signed_identity_cannot_be_forged(self):
        with patch.dict(os.environ,{'CHAT_COOKIE_SECRET':'test-signing-secret'},clear=True):
            self.assertEqual(identity(None,now=1000),(None,None))
            visitor,cookie=identity(None,create=True,now=1000)
            self.assertEqual(len(visitor),64)
            self.assertIn('HttpOnly',cookie)
            self.assertEqual(identity(cookie.split(';')[0],now=1001),(visitor,None))
            self.assertEqual(identity(cookie.split(';')[0]+'changed',now=1001),(None,None))

    def test_like_accepts_only_a_boolean_desired_state_and_keeps_identity_server_side(self):
        call=Mock(return_value={'status':'ready','likes':1,'liked':True})
        with patch.dict(os.environ,{'CHAT_COOKIE_SECRET':'test-signing-secret'},clear=True):
            status,result,cookie=process_social({'action':'like','articleId':str(uuid4()),'liked':True},None,call)
        self.assertEqual(status,200);self.assertNotIn('visitor_hash',result);self.assertTrue(cookie)
        self.assertEqual(call.call_args.args[1]['p_values'],{'liked':True})
        call.reset_mock()
        self.assertEqual(process_social({'action':'like','articleId':str(uuid4()),'liked':'yes'},None,call)[0],400)
        call.assert_not_called()

    def test_comment_limits_and_honeypot_do_not_reach_the_database(self):
        call=Mock()
        payload={'action':'comment','articleId':str(uuid4()),'id':str(uuid4()),'name':'Lector','body':'Una observacion','website':''}
        self.assertEqual(process_social({**payload,'body':'a'*2001},None,call)[0],400)
        self.assertEqual(process_social({**payload,'website':'spam'},None,call)[0],200)
        self.assertEqual(process_social({**payload,'visitor_hash':'forged'},None,call)[0],400)
        call.assert_not_called()

    def test_read_has_no_side_effect_identity_and_only_uses_the_public_article_identifier(self):
        call=Mock(return_value={'status':'ready','comments':[]})
        self.assertEqual(process_social({'action':'read','articleId':str(uuid4()),'page':1},None,call)[0],200)
        self.assertIsNone(call.call_args.args[1]['p_visitor_hash'])
