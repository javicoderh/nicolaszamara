"""Anonymous click registration. Counting is atomic and idempotent in Postgres."""
from uuid import UUID

from backend.chat_store import rpc, StoreUnavailable
from backend.source_context import source_path


def record_click(payload, visitor):
    try:
        if not isinstance(payload, dict) or set(payload) != {'event_id', 'source', 'source_path'}:
            raise ValueError()
        event = str(UUID(payload['event_id']))
        source = payload['source']
        path = source_path(payload['source_path'])
        if source not in ('chatbot', 'course', 'home'):
            raise ValueError()
        if (source == 'course' and path != '/cursos') or (source == 'home' and path != '/'):
            raise ValueError()
        result = rpc('record_hotmart_click', {'p_event': event, 'p_visitor': visitor,
                                             'p_source': source, 'p_source_path': path})
        return {'recorded': 200, 'rate_limited': 429, 'conflict': 409}.get(result.get('status'), 503), result
    except (ValueError, TypeError, AttributeError):
        return 400, {'status': 'invalid'}
    except StoreUnavailable:
        return 503, {'status': 'unavailable'}
