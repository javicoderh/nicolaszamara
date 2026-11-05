import unittest
from unittest.mock import Mock, patch
from backend.blog_sources import public_addresses, read_source, TextOnly, MAX_SOURCE_BYTES, collect_sources
from backend.blog_contract import InvalidBlog


class SourcesTests(unittest.TestCase):
    def test_blocked_source_does_not_discard_two_successful_reads(self):
        def read(reference):
            if reference.endswith('/blocked'):
                raise InvalidBlog('source_unreadable')
            return {'url': reference, 'accessible': True, 'excerpt': 'Evidence ' * 30}
        snapshots, warnings = collect_sources(
            ['https://example.org/a', 'https://example.org/blocked', 'https://example.org/b'], read)
        self.assertEqual([item['url'] for item in snapshots],
                         ['https://example.org/a', 'https://example.org/b'])
        self.assertEqual(warnings, [{'url': 'https://example.org/blocked',
            'reason': 'source_unreadable', 'action': 'excluded'}])

    def test_insufficient_remaining_sources_still_blocks(self):
        with self.assertRaisesRegex(InvalidBlog, 'insufficient_accessible_sources'):
            collect_sources(['https://example.org/a', 'https://example.org/b'],
                            Mock(side_effect=OSError('offline')))

    def test_final_can_reuse_real_snapshots_during_outage(self):
        previous = [{'url': 'https://example.org/' + name, 'accessible': True,
                     'excerpt': 'Previously read evidence. ' * 10} for name in ('a', 'b')]
        snapshots, warnings = collect_sources([item['url'] for item in previous],
            Mock(side_effect=OSError('offline')), previous)
        self.assertEqual(snapshots, previous)
        self.assertEqual([item['action'] for item in warnings], ['retained_snapshot'] * 2)

    def test_unsafe_address_is_never_treated_as_optional_source(self):
        with self.assertRaisesRegex(InvalidBlog, 'source_address_blocked'):
            collect_sources(['https://example.org/a'],
                            Mock(side_effect=InvalidBlog('source_address_blocked')))

    def test_duplicate_or_empty_snapshots_do_not_satisfy_minimum(self):
        with self.assertRaisesRegex(InvalidBlog, 'insufficient_accessible_sources'):
            collect_sources(['https://example.org/a', 'https://example.org/a'],
                Mock(side_effect=OSError('offline')), [{'url':'https://example.org/a',
                    'accessible': True, 'excerpt': ''}])

    def test_redirect_to_http_identifies_redirect_and_never_connects_insecurely(self):
        response=Mock(status=302);response.getheader.return_value='http://example.org/paper'
        connection=Mock();connection.getresponse.return_value=response
        connect=Mock(return_value=connection)
        with self.assertRaisesRegex(InvalidBlog,r'invalid_url:source.redirect\[1\]:https_required'):
            read_source('https://example.org/paper',connect)
        self.assertEqual(connect.call_count,1)

    def test_blocks_mixed_public_and_internal_dns_answers(self):
        for addresses in (['127.0.0.1'], ['8.8.8.8', '10.0.0.1'], ['::1'], ['169.254.169.254']):
            with patch('backend.blog_sources.socket.getaddrinfo', return_value=[(0,0,0,'',(address,443)) for address in addresses]):
                with self.assertRaises(InvalidBlog): public_addresses('example.org')

    def test_redirect_is_validated_before_connecting_to_new_destination(self):
        response = Mock(status=302); response.getheader.return_value = 'https://127.0.0.1/private'
        connection = Mock(); connection.getresponse.return_value = response
        connect = Mock(return_value=connection)
        with self.assertRaises(InvalidBlog): read_source('https://example.org/source', connect)
        self.assertEqual(connect.call_count, 1)
        connection.close.assert_called_once()

    def test_reads_only_bounded_text_and_records_resolved_reference(self):
        response = Mock(status=200); response.getheader.return_value = 'text/html; charset=utf-8'
        response.read.return_value = ('<html><script>hidden</script><p>' + 'Fuente primaria de naturaleza. '*10 + '</p></html>').encode()
        connection = Mock(); connection.getresponse.return_value = response
        result = read_source('https://example.org/source', Mock(return_value=connection))
        self.assertNotIn('hidden', result['excerpt'])
        self.assertTrue(result['accessible'])
        self.assertEqual(result['resolvedUrl'], 'https://example.org/source')
        response.read.assert_called_once_with(MAX_SOURCE_BYTES)
        connection.close.assert_called_once()

    def test_reads_article_after_large_institutional_page_header(self):
        body = ('<html><head><script>' + 'x' * 140000
                + '</script></head><body><p>' + 'Clinical evidence and limitations. ' * 20
                + '</p></body></html>').encode()
        response = Mock(status=200)
        response.getheader.return_value = 'text/html; charset=utf-8'
        response.read.side_effect = lambda size: body[:size]
        connection = Mock()
        connection.getresponse.return_value = response
        result = read_source('https://example.org/research', Mock(return_value=connection))
        self.assertIn('Clinical evidence', result['excerpt'])
        self.assertNotIn('xxx', result['excerpt'])

    def test_rejects_page_without_sufficient_readable_text(self):
        response = Mock(status=200)
        response.getheader.return_value = 'text/html'
        response.read.return_value = b'<script>hidden content</script><p>Too short.</p>'
        connection = Mock()
        connection.getresponse.return_value = response
        with self.assertRaisesRegex(InvalidBlog, 'source_insufficient_text'):
            read_source('https://example.org/empty', Mock(return_value=connection))
        connection.close.assert_called_once()
