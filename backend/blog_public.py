"""Publishable-only blog reader, independent of administrative credentials."""
import json
import os
from urllib.request import Request, urlopen
from urllib.error import URLError
from backend.supabase_config import PROJECT_URL, PUBLISHABLE_KEY


def read_blog(slug=None, category=None, page=1, mode=None):
    operation = {'catalog': 'blog_catalog', 'related': 'blog_related'}.get(mode, 'blog_read')
    arguments = {} if mode == 'catalog' else {'p_slug': slug} if mode == 'related' else {'p_slug': slug, 'p_category': category, 'p_page': page}
    request = Request(os.environ.get('SUPABASE_URL', PROJECT_URL).rstrip('/') + '/rest/v1/rpc/' + operation,
        data=json.dumps(arguments).encode(),
        headers={'apikey': os.environ.get('SUPABASE_PUBLISHABLE_KEY', PUBLISHABLE_KEY), 'Content-Type': 'application/json'})
    try:
        with urlopen(request, timeout=10) as response:
            content = response.read(1024 * 1024 + 1)
            if len(content) > 1024 * 1024: raise ValueError()
            return json.loads(content)
    except (URLError, OSError, ValueError):
        return {'status': 'unavailable'}
