"""Authenticated administration. All data access is behind a server-only RPC."""
import calendar
import secrets
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from backend.admin_security import password_hash, verify_password, token_hash
from backend.chat_store import rpc, StoreUnavailable

SANTIAGO = ZoneInfo('America/Santiago')
# Fixed dummy hash for unknown usernames; never a usable account.
DUMMY_HASH = 'pbkdf2_sha256$600000$' + '00' * 16 + '$' + '00' * 32


def date_bounds(filters):
    if not isinstance(filters, dict) or set(filters) - {'mode', 'day', 'month', 'start', 'end', 'interest', 'reading'}:
        raise ValueError()
    mode = filters.get('mode', 'all')
    start = end = None
    if mode == 'day':
        start = date.fromisoformat(filters['day'])
        end = start + timedelta(days=1)
    elif mode == 'month':
        raw = filters['month']
        if not isinstance(raw, str) or len(raw) != 7:
            raise ValueError()
        start = date.fromisoformat(raw + '-01')
        end = start + timedelta(days=calendar.monthrange(start.year, start.month)[1])
    elif mode == 'range':
        start = date.fromisoformat(filters['start'])
        last = date.fromisoformat(filters['end'])
        if last < start:
            raise ValueError()
        end = last + timedelta(days=1)
    elif mode != 'all':
        raise ValueError()
    interest = filters.get('interest', '')
    if interest not in ('', 'consultation', 'course', 'online', 'nature'):
        raise ValueError()
    reading = filters.get('reading', 'all')
    if reading not in ('all', 'unread', 'read'):
        raise ValueError()
    # Santiago has midnight DST changes; converting local boundaries individually
    # preserves the calendar day rather than assuming every day lasts 24 hours.
    stamp = lambda value: datetime.combine(value, time.min, SANTIAGO).astimezone(timezone.utc).isoformat() if value else None
    return {'start': stamp(start), 'end': stamp(end), 'interest': interest or None, 'reading': reading}


def cursor_values(value):
    if value is None:
        return {}
    if not isinstance(value, dict) or set(value) != {'created_at', 'id'}:
        raise ValueError()
    stamp = datetime.fromisoformat(value['created_at'].replace('Z', '+00:00'))
    if stamp.tzinfo is None:
        raise ValueError()
    return {'cursor_at': stamp.isoformat(), 'cursor_id': str(UUID(value['id']))}


def process_admin(payload, token=None, call=rpc):
    """Return HTTP status, public response, optional new token ('' clears cookie)."""
    try:
        if not isinstance(payload, dict):
            raise ValueError()
        operation = payload.get('operation')
        permitted = {
            'login': {'operation', 'username', 'password'}, 'session': {'operation'},
            'logout': {'operation'}, 'interests': {'operation', 'filters', 'cursor'},
            'detail': {'operation', 'id'}, 'password': {'operation', 'currentPassword', 'newPassword'},
            'mark_read': {'operation', 'id'},
        }
        if operation not in permitted or set(payload) - permitted[operation]:
            raise ValueError()
        def access(action, values):
            return call('admin_access', {'p_operation': action, 'p_values': values})

        if operation == 'login':
            username, password = payload.get('username'), payload.get('password')
            if not isinstance(username, str) or not 1 <= len(username) <= 80 or not isinstance(password, str) or not 1 <= len(password) <= 128:
                raise ValueError()
            challenge = access('login_begin', {'username': username.strip()})
            if challenge.get('status') == 'rate_limited':
                return 429, {'status': 'rate_limited'}, None
            matched = verify_password(password, challenge.get('password_hash', DUMMY_HASH))
            if challenge.get('status') != 'challenge' or not matched:
                return 401, {'status': 'invalid_credentials'}, None
            new_token = secrets.token_urlsafe(32)
            result = access('login_finish', {'user_id': challenge['user_id'], 'expected_hash': challenge['password_hash'],
                                            'token_hash': token_hash(new_token)})
            if result.get('status') != 'authenticated':
                return 401, {'status': 'invalid_credentials'}, None
            return 200, {'status': 'authenticated', 'username': result['username']}, new_token

        if not token:
            return 401, {'status': 'unauthorized'}, ''
        identity = {'token_hash': token_hash(token)}
        if operation == 'session':
            result = access('session', identity)
        elif operation == 'logout':
            access('logout', identity)
            return 200, {'status': 'signed_out'}, ''
        elif operation == 'password':
            current, new = payload.get('currentPassword'), payload.get('newPassword')
            if not isinstance(current, str) or not 1 <= len(current) <= 128 or not isinstance(new, str) or not 12 <= len(new) <= 128 or current == new:
                raise ValueError()
            session = access('session', identity)
            if session.get('status') != 'authenticated':
                return 401, {'status': 'unauthorized'}, ''
            challenge = access('login_begin', {'username': session['username']})
            if challenge.get('status') == 'rate_limited':
                return 429, {'status': 'rate_limited'}, None
            if not verify_password(current, challenge.get('password_hash', DUMMY_HASH)):
                return 400, {'status': 'wrong_password'}, None
            result = access('password', {**identity, 'expected_hash': challenge['password_hash'], 'new_hash': password_hash(new)})
            if result.get('status') == 'password_changed':
                return 200, {'status': 'password_changed'}, ''
        elif operation == 'interests':
            result = access('interests', {**identity, **date_bounds(payload.get('filters', {})), **cursor_values(payload.get('cursor'))})
        else:
            result = access(operation, {**identity, 'id': str(UUID(payload.get('id')))})
        status = result.get('status')
        if status == 'unauthorized':
            return 401, {'status': 'unauthorized'}, ''
        if status == 'not_found':
            return 404, {'status': 'not_found'}, None
        if status not in ('authenticated', 'ready'):
            raise StoreUnavailable()
        return 200, result, None
    except (ValueError, TypeError, KeyError, OverflowError, AttributeError):
        return 400, {'status': 'invalid'}, None
    except StoreUnavailable:
        return 503, {'status': 'unavailable'}, None
