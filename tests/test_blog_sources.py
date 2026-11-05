import unittest
from unittest.mock import Mock, patch
from backend.blog_sources import public_addresses, read_source, TextOnly
from backend.blog_contract import InvalidBlog


class SourcesTests(unittest.TestCase):
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
        response.read.assert_called_once_with(131072)
        connection.close.assert_called_once()
