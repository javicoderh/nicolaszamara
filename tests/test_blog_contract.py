import hashlib
import json
import unittest
from pathlib import Path
from uuid import uuid4
from unittest.mock import Mock, patch
from backend.blog_contract import idea, document, article, brief, InvalidBlog
from backend.blog_local import local_command
from backend.blog_admin import process_blog_admin


def sample():
    return {'slug': 'tiempo-en-el-bosque', 'title': 'Tiempo en el bosque', 'summary': 'Una invitación a observar.',
            'author': 'Equipo editorial', 'category': 'naturaleza', 'document': {'version': 1, 'blocks': [{'type': 'paragraph', 'text': 'Un paseo para observar con calma.'}]}}


class ContractTests(unittest.TestCase):
    def test_long_article_fits_the_shared_limits_and_oversize_documents_are_rejected(self):
        from backend.blog_contract import generated_article
        value=json.loads((Path(__file__).parent/'fixtures/blog/long_article.json').read_text(encoding='utf-8'))
        result=generated_article(value,{'desiredLength':'long','category':'naturaleza','focusKeyword':'naturaleza cotidiana','sources':value['sources']})
        self.assertTrue(1200<=result['wordCount']<=1500)
        self.assertLess(len(json.dumps(result,ensure_ascii=False).encode()),262144)
        for blocks in ([{'type':'paragraph','text':'x'}]*201,[{'type':'paragraph','text':'x'*3000}]*100):
            with self.assertRaises(InvalidBlog): article({**sample(),'document':{'version':1,'blocks':blocks}})

    def test_null_seo_values_inherit_and_explicit_overrides_survive(self):
        self.assertIsNone(article(sample())['seoTitle'])
        self.assertEqual(article({**sample(),'seoTitle':'SEO elegido'})['seoTitle'],'SEO elegido')

    def test_partial_drafts_and_normalized_slugs(self):
        from backend.blog_contract import slug
        self.assertEqual(article({**sample(),'slug':'','title':''})['slug'],'')
        self.assertEqual(slug('Árboles y calma'),'arboles-y-calma')
        for value in ['admin','../privado','api']:
            with self.assertRaises(InvalidBlog): slug(value)

    def test_critique_retains_actionable_corrections_and_rejects_empty_artifacts(self):
        from backend.blog_contract import editorial_critique
        result=editorial_critique({'checks':[{'name':'fuentes','passed':False,'note':'Falta atribucion'}],'corrections':['Atribuir el hallazgo a sus autores.']})
        self.assertFalse(result['checks'][0]['passed'])
        self.assertEqual(len(result['corrections']),1)
        with self.assertRaises(InvalidBlog): editorial_critique({})

    def test_idea_limits_are_not_silent_truncation(self):
        self.assertEqual(idea('  Un tema claro  '), 'Un tema claro')
        for value in ('', None, 'a ' * 1501, 'a' * 12001):
            with self.assertRaises(InvalidBlog): idea(value)

    def test_blocks_reject_scripts_unknown_fields_and_heading_one(self):
        for block in ({'type': 'html', 'text': '<script/>'}, {'type': 'heading', 'level': 1, 'text': 'Hola'},
                      {'type': 'paragraph', 'text': 'x', 'onclick': 'alert(1)'}, {'type': 'link', 'text': 'x', 'href': 'javascript:alert(1)'}):
            with self.assertRaises(InvalidBlog): document({'version': 1, 'blocks': [block]})

    def test_real_content_hash_and_publication_gate(self):
        data = article(sample())
        canonical = json.dumps(data['document'], ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
        self.assertEqual(data['contentHash'], hashlib.sha256(canonical).hexdigest())
        with self.assertRaises(InvalidBlog): article(sample(), publishing=True)
        complete = {**sample(), 'cover': 'https://example.com/photo.jpg', 'coverAlt': 'Un bosque',
                    'bodyImage': {'src': 'https://example.com/interior.jpg', 'alt': 'Sendero entre arboles'}}
        self.assertEqual(article(complete, publishing=True)['slug'], complete['slug'])

    def test_publication_requires_two_distinct_described_images(self):
        complete = {**sample(), 'cover': 'https://example.com/a.webp', 'coverAlt': 'Bosque'}
        for image in ({}, {'src': complete['cover'], 'alt': 'Repetida'}, {'src': 'https://example.com/b.webp', 'alt': ''}):
            with self.assertRaises(InvalidBlog): article({**complete, 'bodyImage': image}, publishing=True)
        for position in (-1, True, 200, 'auto'):
            with self.assertRaises(InvalidBlog): article({**complete, 'bodyImage': {'afterBlock': position}})

    def test_generated_text_discards_images_before_validation(self):
        from backend.blog_contract import text_article
        data = sample()
        generated = {**data, 'cover': 'javascript:bad', 'bodyImage': {'src': 'javascript:bad'},
                     'document': {'version': 1, 'blocks': data['document']['blocks'] + [{'type': 'image', 'src': 'javascript:bad'}]}}
        normalized = text_article(generated)
        self.assertEqual(normalized['cover'], '')
        self.assertEqual(normalized['bodyImage']['src'], '')
        self.assertEqual(normalized['document'], data['document'])

    def test_brief_preserves_narrative_and_audience_and_requires_sources(self):
        data = {'objective': 'aumentar_engagement', 'target': 'naturaleza', 'category': 'naturaleza',
            'topic': 'Pasear por un bosque', 'angle': 'Observar el ritmo del lugar', 'audienceDescription': 'Adultos de 40 a 60 años',
            'focusKeyword': 'banos de bosque', 'keyPoints': ['Observar el paisaje', 'Escuchar el lugar', 'Dar tiempo a la experiencia'],
            'sources': ['https://example.com/a', 'https://example.org/b'], 'tone': 'poetico', 'narrativeApproach': 'storytelling'}
        data['sourceDetails']=[{'url':source,'title':'Referencia primaria','origin':'web_search','accessedAt':'2026-11-04T00:00:00Z','contribution':'Describe el tema','claims':['La observacion del entorno requiere tiempo']} for source in data['sources']]
        result = brief(data)
        self.assertEqual(result['tone'], 'poetico')
        self.assertEqual(result['narrativeApproach'], 'storytelling')
        self.assertEqual(result['audienceDescription'], data['audienceDescription'])
        with self.assertRaises(InvalidBlog): brief({**data, 'sources': [data['sources'][0]]})

    def test_local_persistence_does_not_require_provider(self):
        task_brief={'category':'naturaleza','focusKeyword':'banos de bosque','desiredLength':'short','sources':['https://example.org/a','https://example.org/b']}
        call = Mock(side_effect=[{'status':'ready'},{'status':'ready','job':{'brief':task_brief}},{'status':'ready'}])
        final={**sample(),'sources':task_brief['sources'],'document':{'version':1,'blocks':[{'type':'paragraph','text':'Una palabra ' * 200}]}}
        with patch.dict('os.environ', {}, clear=True):
            local_command('create', {'id': str(uuid4()), 'idea': 'Un artículo sobre naturaleza'}, call)
            local_command('complete', {'id': str(uuid4()), 'lease': str(uuid4()), 'values': {'document': final}}, call)
        self.assertEqual(call.call_count, 3)
        self.assertEqual(call.call_args.args[1]['p_engine'],'codex_session')
        self.assertEqual(call.call_args.args[1]['p_values']['document']['cover'],'')

    def test_admin_never_allows_local_bypass_or_unvalidated_writes(self):
        call = Mock(return_value={'status': 'authenticated'})
        self.assertEqual(process_blog_admin({'operation': 'blog', 'action': 'list', 'values': {}}, None, call)[0], 401)
        call.assert_not_called()
        payload = {'operation': 'blog', 'action': 'job_create', 'values': {'id': str(uuid4()), 'idea': 'Tema', 'engine': 'codex_session'}}
        self.assertEqual(process_blog_admin(payload, 'token', call)[0], 400)
        self.assertEqual(call.call_count, 1)


if __name__ == '__main__': unittest.main()
