"""Signed anonymous browser identity; no browser supplied counters are trusted."""
import hashlib
import hmac
import os
import time
from datetime import datetime, timedelta, timezone
from http.cookies import SimpleCookie, CookieError
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

COOKIE_NAME = "nz_setter"


def secret():
    value = os.environ.get("CHAT_COOKIE_SECRET", "")
    if len(value) < 32:
        raise ValueError("CHAT_COOKIE_SECRET must have at least 32 characters")
    return value.encode()


def fingerprint(value):
    return hmac.new(secret(), value.encode("utf-8"), hashlib.sha256).hexdigest()


def visitor_from_cookie(header):
    try:
        cookies = SimpleCookie()
        cookies.load(header or "")
        visitor, expiry, signature = cookies[COOKIE_NAME].value.split(".")
        UUID(visitor)
        if int(expiry) <= time.time() or not hmac.compare_digest(signature, fingerprint(f"{visitor}.{expiry}")):
            return None
        return visitor
    except (KeyError, ValueError, CookieError):
        return None


def issue_identity():
    visitor = str(uuid4())
    now = datetime.now(timezone.utc)
    local = now.astimezone(ZoneInfo("America/Santiago"))
    expires = int((local + timedelta(days=8)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    token = f"{visitor}.{expires}"
    cookie = f"{COOKIE_NAME}={token}.{fingerprint(token)}; Path=/; Max-Age={expires - int(now.timestamp())}; HttpOnly; SameSite=Lax"
    if os.environ.get("VERCEL") or os.environ.get("APP_ENV") == "production":
        cookie += "; Secure"
    return visitor, cookie
