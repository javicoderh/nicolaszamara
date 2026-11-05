"""Private WebP storage. Public delivery requires a published reference."""
import base64
import json
import os
import struct
from uuid import uuid4, UUID
from urllib.request import Request, urlopen
from backend.supabase_config import PROJECT_URL
from backend.chat_store import rpc, StoreUnavailable
from backend.admin_security import token_hash


def webp_dimensions(content):
    if len(content) < 30 or len(content) > 8 * 1024 * 1024 or content[:4] != b'RIFF' or content[8:12] != b'WEBP':
        raise ValueError('invalid_image')
    if content[12:16] == b'VP8X':
        width = 1 + int.from_bytes(content[24:27], 'little'); height = 1 + int.from_bytes(content[27:30], 'little')
    elif content[12:16] == b'VP8 ' and content[23:26] == b'\x9d\x01\x2a':
        width, height = (value & 0x3fff for value in struct.unpack('<HH', content[26:30]))
    elif content[12:16] == b'VP8L' and content[20] == 0x2f:
        bits = int.from_bytes(content[21:25], 'little'); width = (bits & 0x3fff) + 1; height = ((bits >> 14) & 0x3fff) + 1
    else: raise ValueError('invalid_webp')
    if width < 1 or height < 1 or width * height > 20_000_000: raise ValueError('image_too_large')
    return width, height


def storage_request(path, content=None):
    key = os.environ.get('SUPABASE_SECRET_KEY', '')
    if not key: raise StoreUnavailable()
    headers = {'apikey': key, 'Content-Type': 'image/webp'}
    if not key.startswith('sb_secret_'): headers['Authorization'] = 'Bearer ' + key
    req = Request(os.environ.get('SUPABASE_URL', PROJECT_URL).rstrip('/') + '/storage/v1/object/' + path,
        method='POST' if content is not None else 'GET', data=content, headers=headers)
    try:
        with urlopen(req, timeout=15) as response:
            body = response.read(8 * 1024 * 1024 + 1)
            if len(body) > 8 * 1024 * 1024: raise StoreUnavailable()
            return body
    except OSError: raise StoreUnavailable() from None


def upload(payload, token):
    if not token: return {'status': 'unauthorized'}
    session = rpc('admin_access', {'p_operation': 'session', 'p_values': {'token_hash': token_hash(token)}})
    if session.get('status') != 'authenticated': return {'status': 'unauthorized'}
    if not isinstance(payload, dict) or set(payload) not in ({'content'}, {'content','variants'}): raise ValueError('invalid_payload')
    content = base64.b64decode(payload['content'], validate=True)
    width, height = webp_dimensions(content)
    variants = payload.get('variants', {})
    if not isinstance(variants, dict) or set(variants) - {'480','960','1440'}: raise ValueError('invalid_variants')
    decoded = {}
    for size, encoded in variants.items():
        data = base64.b64decode(encoded,validate=True)
        variant_width, variant_height = webp_dimensions(data)
        if variant_width > int(size) or variant_width > width or abs(variant_width/variant_height-width/height)>.02: raise ValueError('invalid_variants')
        decoded[size] = data
    ident = str(uuid4())
    storage_request('blog-media/' + ident + '.webp', content)
    for size, data in decoded.items(): storage_request('blog-media/' + ident + '-' + size + '.webp', data)
    return {'status': 'ready', 'src': '/blog-media/' + ident, 'width': width, 'height': height}


def public_media(ident, width=None):
    ident = str(UUID(ident))
    if width is not None and width not in ('480','960','1440'): raise ValueError('invalid_width')
    result = rpc('blog_media_visible', {'p_reference': '/blog-media/' + ident})
    if result.get('visible') is not True: return None
    return storage_request('authenticated/blog-media/' + ident + ('-'+width if width else '') + '.webp')
