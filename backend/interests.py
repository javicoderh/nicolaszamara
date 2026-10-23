"""Validation and insert-only persistence; no personal data is written to logs."""
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.supabase_config import PROJECT_URL, PUBLISHABLE_KEY
from backend.chat_identity import fingerprint
from backend.chat_store import StoreUnavailable, rpc
from uuid import UUID
from backend.contact_details import PRIVACY_VERSION, normalize_contact
from backend.source_context import source_path

CONTACT_PRIVACY_VERSION = PRIVACY_VERSION


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
    if isinstance(payload, dict) and payload.get('source') == 'chatbot':
        return validate_contact(payload)
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
    allowed = {"name", "email", "phone", "contactPreference", "country", "experience"} if kind == "online" else {"name", "email", "phone", "contactPreference", "city"}
    if set(values) - allowed:
        raise InvalidSubmission("Unexpected fields")
    try:
        details = {**normalize_contact(values), 'source_path': source_path(payload.get('source_path'))}
    except ValueError as error:
        raise InvalidSubmission(str(error)) from None
    return {
        "interest": kind,
        "full_name": text_field(values, "name", 120),
        **details,
        "country": text_field(values, "country", 100) if kind == "online" else None,
        "city": text_field(values, "city", 100) if kind == "nature" else None,
        "experience": text_field(values, "experience", 500, required=False) if kind == "online" else None,
        "updates_consent": payload.get("updatesConsent", False),
        "privacy_consent": True,
        "privacy_version": PRIVACY_VERSION,
    }


def validate_contact(payload):
    if set(payload) - {'source', 'interest', 'values', 'privacyConsent', 'contactConsent', 'updatesConsent',
                       'website', 'request_id', 'conversation_id', 'source_path'}:
        raise InvalidSubmission('Unexpected fields')
    if payload.get('interest') not in ('consultation', 'course', 'online', 'nature'):
        raise InvalidSubmission('Invalid service')
    if payload.get('privacyConsent') is not True or payload.get('contactConsent') is not True:
        raise InvalidSubmission('Consent is required')
    if not isinstance(payload.get('updatesConsent', False), bool) or payload.get('website'):
        raise InvalidSubmission('Invalid submission')
    values = payload.get('values')
    if not isinstance(values, dict) or set(values) - {'name', 'phone', 'email', 'contactPreference'}:
        raise InvalidSubmission('Invalid fields')
    try:
        details = {**normalize_contact(values), 'source_path': source_path(payload.get('source_path'))}
    except ValueError as error:
        raise InvalidSubmission(str(error)) from None
    try:
        UUID(payload.get('request_id'))
        UUID(payload.get('conversation_id'))
    except (ValueError, TypeError, AttributeError):
        raise InvalidSubmission('Invalid request') from None
    return {'interest': payload['interest'], 'full_name': text_field(values, 'name', 120),
            **details, 'contact_channel': details['contact_preference'],
            'contact_consent': True, 'privacy_consent': True, 'privacy_version': CONTACT_PRIVACY_VERSION,
            'updates_consent': payload.get('updatesConsent', False)}


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


def process_submission(payload, visitor=None):
    try:
        record = validate_submission(payload)
    except InvalidSubmission:
        return 400, {"status": "invalid", "message": "Revisa los campos y acepta la información de privacidad."}
    if isinstance(payload, dict) and payload.get('source') == 'chatbot':
        if not visitor:
            return 401, {'status': 'session_required'}
        try:
            digest = fingerprint(json.dumps({'visitor': visitor, 'conversation': payload['conversation_id'],
                                             'record': record}, sort_keys=True, ensure_ascii=False))
            result = rpc('setter_save_contact', {'p_visitor': visitor, 'p_conversation': payload['conversation_id'],
                         'p_request': payload['request_id'], 'p_hash': digest, 'p_record': record})
            return (201 if result['status'] == 'saved' else 429 if result['status'] == 'rate_limited' else 409), result
        except (StoreUnavailable, ValueError):
            return 503, {'status': 'unavailable'}
    try:
        save_interest(record)
    except RateLimited:
        return 429, {"status": "rate_limited", "message": "Recibimos varios intentos. Espera un minuto antes de reintentar."}
    except StorageUnavailable:
        return 503, {"status": "unavailable", "message": "No pudimos confirmar el registro. Inténtalo nuevamente más tarde."}
    return 201, {"status": "saved"}
