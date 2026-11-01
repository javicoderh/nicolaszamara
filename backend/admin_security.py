"""Password derivation and opaque session cookies, independent of storage."""
import hashlib
import hmac
import os
import secrets
from http.cookies import SimpleCookie, CookieError

COOKIE_NAME = 'nz_admin'
SESSION_SECONDS = 8 * 60 * 60
ITERATIONS = 600000


def password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), ITERATIONS).hex()
    return f'pbkdf2_sha256${ITERATIONS}${salt}${digest}'


def verify_password(password, encoded):
    try:
        algorithm, count, salt, expected = encoded.split('$')
        if algorithm != 'pbkdf2_sha256' or int(count) != ITERATIONS or len(salt) != 32 or len(expected) != 64:
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), ITERATIONS).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, AttributeError):
        return False


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def session_token(cookie):
    try:
        jar = SimpleCookie()
        jar.load(cookie or '')
        token = jar[COOKIE_NAME].value
        return token if len(token) == 43 and all(c.isascii() and (c.isalnum() or c in '-_') for c in token) else None
    except (CookieError, KeyError):
        return None


def session_cookie(token='', clear=False):
    value = f'{COOKIE_NAME}={token}; Path=/api/admin; Max-Age={0 if clear else SESSION_SECONDS}; HttpOnly; SameSite=Strict'
    if os.environ.get('VERCEL') or os.environ.get('APP_ENV') == 'production':
        value += '; Secure'
    return value
