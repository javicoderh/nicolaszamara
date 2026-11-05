import unittest
from unittest.mock import patch, Mock
from backend.blog_contract import brief, InvalidBlog
from scripts.inspect_blog_response import main


def sample_brief():
    sources = ['https://example.org/a', 'https://example.org/b']
    return {
        'objective': 'educar_audiencia', 'target': 'publico_general', 'category': 'naturaleza',
        'topic': 'Observar el bosque', 'angle': 'Aprender a observar sin recolectar',
        'audienceDescription': 'Personas adultas', 'focusKeyword': 'observar bosque',
        'keyPoints': ['Identificar formas', 'Escuchar sonidos', 'Respetar senderos'], 'sources': sources,
        'sourceDetails': [{'url': source, 'title': 'Fuente', 'contribution': 'Contexto',
                           'accessedAt': '2026-11-04T00:00:00Z'} for source in sources],
    }


class BriefFieldTests(unittest.TestCase):
    def test_null_optional_text_is_empty_but_never_fabricated(self):
        value = sample_brief()
        for key in ('seoTitle', 'ogTitle', 'ogDescription', 'desiredSlug', 'externalResourceDescription', 'editorialSummary'):
            value[key] = None
        value['editorialDecisions'] = {'target': None}
        value['sourceDetails'][0]['label'] = None
        result = brief(value)
        self.assertEqual(result['seoTitle'], '')
        self.assertEqual(result['editorialDecisions']['target'], '')
        self.assertEqual(result['sourceDetails'][0]['label'], '')

    def test_required_field_and_invalid_optional_type_report_exact_path(self):
        for field, value, error in [('audienceDescription', None, 'invalid_text:audienceDescription:type'),
                                    ('topic', '', 'invalid_text:topic:required'),
                                    ('angle', 'x' * 2001, 'invalid_text:angle:length'),
                                    ('seoTitle', [], 'invalid_text:seoTitle:type')]:
            with self.assertRaises(InvalidBlog) as caught:
                brief({**sample_brief(), field: value})
            self.assertEqual(str(caught.exception), error)

    def test_nested_source_and_decision_fields_are_identified(self):
        value = sample_brief()
        value['sourceDetails'][1]['contribution'] = None
        with self.assertRaisesRegex(InvalidBlog, r'invalid_text:sourceDetails\[1\].contribution:type'):
            brief(value)
        value = sample_brief()
        value['editorialDecisions'] = {'keyPoints': ['Unexpected list']}
        with self.assertRaisesRegex(InvalidBlog, 'invalid_text:editorialDecisions.keyPoints:type'):
            brief(value)

    def test_inspection_only_polls_existing_response_and_never_starts_generation(self):
        provider = Mock()
        provider.poll.return_value = {'status': 'completed'}
        with patch('scripts.inspect_blog_response.OpenAIArticleProvider', return_value=provider), \
             patch('scripts.inspect_blog_response.extract_output', return_value=sample_brief()), \
             patch('scripts.inspect_blog_response.load_local_environment'), patch('builtins.print'):
            self.assertEqual(main(['resp_existing']), 0)
        provider.poll.assert_called_once_with('resp_existing')
        provider.start.assert_not_called()

    def test_invalid_source_urls_report_field_and_reason_without_private_link_contents(self):
        cases = [('http://example.org/paper', 'https_required'),
                 ('https://example.org:wrong/paper', 'invalid_structure'),
                 ('https://example.org:8443/paper', 'port_not_allowed'),
                 ('https://user:secret@example.org/paper', 'credentials_not_allowed'),
                 ('https://127.0.0.1/paper', 'private_address'),
                 ('https://localhost/paper', 'local_address'),
                 ('[paper](https://example.org/paper)', 'https_required'),
                 ('https://example.org/a paper', 'invalid_characters')]
        for reference, reason in cases:
            value = sample_brief(); value['sources'][0] = reference
            with self.assertRaises(InvalidBlog) as caught: brief(value)
            self.assertEqual(str(caught.exception), 'invalid_url:sources[0]:' + reason)
            self.assertNotIn('secret', str(caught.exception))

    def test_optional_resource_and_reel_are_distinguished_from_sources(self):
        with self.assertRaisesRegex(InvalidBlog, 'invalid_url:externalResourceUrl:https_required'):
            brief({**sample_brief(), 'externalResourceUrl': '/consulta'})
        result=brief({**sample_brief(), 'reels': ['http://example.org/reel']})
        self.assertEqual(result['reels'],[])
        self.assertIn('invalid_url:reels[0]:https_required',result['editorialWarnings'])
        value=sample_brief();value['sourceDetails'][1]['url']='http://example.org/b'
        with self.assertRaisesRegex(InvalidBlog, r'invalid_url:sourceDetails\[1\].url:https_required'):
            brief(value)

    def test_malformed_optional_reel_does_not_discard_research_or_valid_reels(self):
        valid='https://www.instagram.com/reel/valid/'
        result=brief({**sample_brief(),'reels':['https://instagram.com/reel/invalid link',valid]})
        self.assertEqual(result['reels'],[valid])
        self.assertEqual(result['sources'],sample_brief()['sources'])
        self.assertEqual(result['editorialWarnings'],['invalid_url:reels[0]:invalid_characters'])
        self.assertEqual(brief(result)['editorialWarnings'],result['editorialWarnings'])
