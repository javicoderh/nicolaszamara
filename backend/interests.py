"""Validation and insert-only persistence; no personal data is written to logs."""
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.supabase_config import PROJECT_URL, PUBLISHABLE_KEY

PRIVACY_VERSION = "2026-10-21"


class InvalidSubmission(ValueError):
    pass


class StorageUnavailable(Exception):
    pass


class RateLimited(Exception):
    pass


def text_field(values, key, maximum, required=True):
    value = values.get(key, "")
    if not isinstance(value, str):
        raise InvalidSubmission("Invalid text field")
    value = value.strip()
    if len(value) > maximum or (required and not value):
        raise InvalidSubmission("Invalid text length")
    return value or None


def validate_submission(payload):
    if not isinstance(payload, dict) or payload.get("interest") not in ("online", "nature"):
        raise InvalidSubmission("Invalid interest")
    if payload.get("privacyConsent") is not True:
        raise InvalidSubmission("Privacy consent is required")
    if not isinstance(payload.get("updatesConsent", False), bool) or payload.get("website"):
        raise InvalidSubmission("Invalid submission")
    values = payload.get("values")
    if not isinstance(values, dict):
        raise InvalidSubmission("Invalid fields")
    kind = payload["interest"]
    allowed = {"name", "email", "country", "experience"} if kind == "online" else {"name", "email", "city"}
    if set(values) - allowed:
        raise InvalidSubmission("Unexpected fields")
    email = text_field(values, "email", 254).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise InvalidSubmission("Invalid email")
    return {
        "interest": kind,
        "full_name": text_field(values, "name", 120),
        "email": email,
        "country": text_field(values, "country", 100) if kind == "online" else None,
        "city": text_field(values, "city", 100) if kind == "nature" else None,
        "experience": text_field(values, "experience", 500, required=False) if kind == "online" else None,
        "updates_consent": payload.get("updatesConsent", False),
        "privacy_consent": True,
        "privacy_version": PRIVACY_VERSION,
    }


def save_interest(record):
    # This is a publishable key, restricted to INSERT by database grants and RLS.
    # Never substitute a service_role/secret key: public writes need no read privileges.
    url = os.environ.get("SUPABASE_URL", PROJECT_URL).rstrip("/")
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", PUBLISHABLE_KEY)
    request = Request(
        f"{url}/rest/v1/interest_registrations",
        data=json.dumps(record).encode("utf-8"),
        method="POST",
        headers={"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            if response.status != 201:
                raise StorageUnavailable()
    except HTTPError as error:
        try:
            details = json.loads(error.read(4096))
        except (ValueError, UnicodeError):
            details = {}
        if not isinstance(details, dict):
            details = {}
        if error.code == 429 or (details.get("code") == "P0001" and details.get("message") == "interest_rate_limited"):
            raise RateLimited() from None
        raise StorageUnavailable() from None
    except (URLError, TimeoutError, OSError):
        raise StorageUnavailable() from None


def process_submission(payload):
    try:
        record = validate_submission(payload)
    except InvalidSubmission:
        return 400, {"status": "invalid", "message": "Revisa los campos y acepta la información de privacidad."}
    try:
        save_interest(record)
    except RateLimited:
        return 429, {"status": "rate_limited", "message": "Recibimos varios intentos. Espera un minuto antes de reintentar."}
    except StorageUnavailable:
        return 503, {"status": "unavailable", "message": "No pudimos confirmar el registro. Inténtalo nuevamente más tarde."}
    return 201, {"status": "saved"}
