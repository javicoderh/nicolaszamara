"""Opt-in feedback and bounded, reviewed examples; never trains on raw chat."""
from uuid import UUID

from backend.chat_store import StoreUnavailable, rpc


def approved_examples():
    try:
        result = rpc('setter_learning_examples', {})
        examples = result.get('examples', [])
        return examples[:8] if isinstance(examples, list) else []
    except StoreUnavailable:
        return []


def save_feedback(payload, visitor):
    if not visitor:
        return 401, {'status': 'session_required'}
    fields = {'id', 'conversation_id', 'request_id', 'category', 'question', 'suggestion', 'comment', 'consent'}
    try:
        if not isinstance(payload, dict) or set(payload) != fields or payload['consent'] is not True:
            raise ValueError()
        if payload['category'] not in ('irrelevant', 'missing', 'unnatural', 'incorrect'):
            raise ValueError()
        values = {key: str(UUID(payload[key])) for key in ('id', 'conversation_id', 'request_id')}
        for key, minimum, maximum in (('question', 5, 500), ('suggestion', 10, 1000), ('comment', 0, 500)):
            value = payload[key]
            if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
                raise ValueError()
            values[key] = value.strip()
        result = rpc('setter_feedback_save', {'p_visitor': visitor, 'p_values': {
            **values, 'category': payload['category'], 'consent': True}})
        status = result.get('status')
        return {'saved': 201, 'rate_limited': 429, 'not_found': 404, 'conflict': 409, 'invalid': 400}.get(status, 503), result
    except (ValueError, TypeError, AttributeError):
        return 400, {'status': 'invalid'}
    except StoreUnavailable:
        return 503, {'status': 'storage_unavailable'}
