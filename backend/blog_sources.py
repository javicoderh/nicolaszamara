"""Bounded HTTPS reads pinned to validated public addresses, including redirects."""
import http.client
import ipaddress
import socket
import ssl
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin
from backend.blog_contract import url, InvalidBlog

MAX_SOURCE_BYTES = 2 * 1024 * 1024


def collect_sources(references, read=None, previous=()):
    """Tolerate unavailable references while retaining a minimum of two reads."""
    read = read or read_source
    cached = {item.get('url'): item for item in previous
              if isinstance(item, dict) and item.get('accessible') is True
              and isinstance(item.get('excerpt'), str) and len(item['excerpt']) >= 100}

    def attempt(reference):
        try:
            return read(reference), None
        except (OSError, InvalidBlog) as error:
            # Address and URL validation failures remain fatal.
            if isinstance(error, InvalidBlog) and str(error) not in (
                    'source_unreadable', 'source_insufficient_text', 'source_redirect_limit'):
                raise
            reason = str(error) if isinstance(error, InvalidBlog) else 'source_connection_failed'
            snapshot = cached.get(reference)
            return snapshot, {'url': reference, 'reason': reason,
                              'action': 'retained_snapshot' if snapshot else 'excluded'}

    with ThreadPoolExecutor(max_workers=3) as readers:
        results = list(readers.map(attempt, dict.fromkeys(references)))
    snapshots = [snapshot for snapshot, _ in results if snapshot is not None]
    warnings = [warning for _, warning in results if warning is not None]
    if len(snapshots) < 2:
        raise InvalidBlog('insufficient_accessible_sources')
    return snapshots, warnings


class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'): self.skip = max(0, self.skip - 1)
    def handle_data(self, value):
        if not self.skip: self.parts.append(value)


def public_addresses(hostname):
    values = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    addresses = list(dict.fromkeys(value[4][0] for value in values))
    if not addresses or any(not ipaddress.ip_address(value).is_global for value in addresses): raise InvalidBlog('source_address_blocked')
    return addresses


class PinnedHTTPS(http.client.HTTPSConnection):
    def connect(self):
        addresses = public_addresses(self.host)
        raw = socket.create_connection((addresses[0], 443), timeout=self.timeout)
        try: self.sock = ssl.create_default_context().wrap_socket(raw, server_hostname=self.host)
        except Exception: raw.close(); raise


def read_source(reference, connect=PinnedHTTPS):
    current = reference
    for redirect in range(4):
        parts = urlsplit(url(current,field='source.initial' if redirect==0 else f'source.redirect[{redirect}]'))
        connection = connect(parts.hostname, timeout=6)
        try:
            connection.request('GET', (parts.path or '/') + ('?' + parts.query if parts.query else ''), headers={'User-Agent': 'NicolasZamaraEditorial/1.0', 'Accept': 'text/html,text/plain'})
            response = connection.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                current = urljoin(current, response.getheader('Location', '')); continue
            if response.status != 200 or response.getheader('Content-Type', '').split(';')[0] not in ('text/html', 'text/plain'): raise InvalidBlog('source_unreadable')
            # Institutional pages can have large script/style headers before
            # their article body. Keep a bounded read without cutting at 128 KiB.
            content = response.read(MAX_SOURCE_BYTES)
            parser = TextOnly(); parser.feed(content.decode('utf-8', errors='replace'))
            excerpt = ' '.join(' '.join(parser.parts).split())[:6000]
            if len(excerpt) < 100: raise InvalidBlog('source_insufficient_text')
            return {'url': reference, 'resolvedUrl': current, 'accessible': True, 'accessedAt': datetime.now(timezone.utc).isoformat(), 'excerpt': excerpt}
        finally: connection.close()
    raise InvalidBlog('source_redirect_limit')
