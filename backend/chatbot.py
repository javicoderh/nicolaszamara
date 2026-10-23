"""Conversation coordinator: grounded replies and server-controlled actions."""
import json
import os
from uuid import UUID
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.chat_identity import fingerprint
from backend.chat_store import StoreUnavailable, SupabaseChatUsageStore, budget_limits, usage_metadata
from backend.setter_config import CONFIG, COPY, INSTRUCTIONS, KNOWLEDGE, POLICY, RESPONSES, validate_decision
from backend.provider_settings import output_token_limit, reasoning_effort, request_timeout

MAX_MESSAGES = POLICY["max_context_messages"]
MAX_MESSAGE_LENGTH = POLICY["max_user_message_characters"]
OPENAI_URL = "https://api.openai.com/v1/responses"
MAX_INPUT_BYTES = 65536


class InvalidChatRequest(ValueError):
    pass


class OpenAIUnavailable(Exception):
    def __init__(self, message='unavailable', usage=None):
        super().__init__(message)
        self.usage = usage or {}


def uuid_value(value):
    try:
        return str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise InvalidChatRequest() from None


def validate_messages(messages):
    if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_MESSAGES:
        raise InvalidChatRequest()
    normalized = []
    for message in messages:
        if not isinstance(message, dict) or set(message) != {"role", "content"}:
            raise InvalidChatRequest()
        role, content = message["role"], message["content"]
        if role not in ("user", "assistant") or not isinstance(content, str):
            raise InvalidChatRequest()
        content = content.strip()
        if not content or len(content) > MAX_MESSAGE_LENGTH:
            raise InvalidChatRequest()
        normalized.append({"role": role, "content": content})
    if normalized[-1]["role"] != "user":
        raise InvalidChatRequest()
    return normalized


def trusted_context(state):
    return {"active_topic": state.get("topic", "unknown"), "last_action": state.get("action", "none"),
            "pending_question": "contact_opt_in" if state.get("action") == "offer_contact" else "none",
            "contact_declined": state.get("contact_declined", False), "approved_facts": KNOWLEDGE,
            "previous_reply": (state.get('last_result') or {}).get('reply', ''),
            "allowed_response_keys": list(RESPONSES), "allowed_actions": list(CONFIG["catalog"]["actions"])}


def extract_decision(response, context):
    if not isinstance(response, dict) or response.get("status") != "completed":
        raise OpenAIUnavailable()
    for item in response.get("output", []):
        if item.get("type") == "message":
            for part in item.get("content", []):
                if part.get("type") == "refusal":
                    raise OpenAIUnavailable()
                if part.get("type") == "output_text":
                    try:
                        return validate_decision(json.loads(part["text"]), context, require_reply=True)
                    except (ValueError, TypeError, KeyError):
                        raise OpenAIUnavailable() from None
    raise OpenAIUnavailable()


def encode_provider_payload(messages, context):
    payload = {"model": os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
               "instructions": INSTRUCTIONS + "\n\nContexto confiable del servidor:\n" + json.dumps(context, ensure_ascii=False),
               "input": messages, "text": {"format": CONFIG["structured_output"]},
               "max_output_tokens": output_token_limit(), "store": False}
    effort = reasoning_effort()
    if effort:
        payload['reasoning'] = {'effort': effort}
        payload['service_tier'] = 'default'
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(encoded) > MAX_INPUT_BYTES:
        raise InvalidChatRequest()
    return encoded


def choose_response(messages, context):
    from backend.setter_learning import approved_examples
    context = {**context, 'reviewed_examples': approved_examples()}
    encoded = encode_provider_payload(messages, context)
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise OpenAIUnavailable("not_configured")
    request = Request(OPENAI_URL, data=encoded, method="POST",
                      headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=request_timeout()) as response:
            if response.status != 200:
                raise OpenAIUnavailable()
            result = json.loads(response.read(65536))
        usage = result.get("usage", {})
        metrics = {field: usage[field] for field in ('input_tokens', 'output_tokens', 'total_tokens')
                   if type(usage.get(field)) is int and usage[field] >= 0}
        for field in ('input_tokens_details', 'output_tokens_details'):
            if isinstance(usage.get(field), dict):
                metrics[field] = {key: value for key, value in usage[field].items() if type(value) is int and value >= 0}
        metrics.update({'response_id': result.get('id'), 'actual_model': result.get('model'),
                        'service_tier': result.get('service_tier'), 'response_status': result.get('status')})
        try:
            decision = extract_decision(result, context)
        except OpenAIUnavailable:
            metrics['incomplete_reason'] = (result.get('incomplete_details') or {}).get('reason')
            raise OpenAIUnavailable(usage=metrics) from None
        return decision, metrics
    except HTTPError as error:
        diagnostic = {'provider_http_status': error.code}
        try:
            detail = json.loads(error.read(4096)).get('error', {})
            diagnostic.update({key: detail[key] for key in ('code', 'type') if isinstance(detail.get(key), str)})
        except (ValueError, AttributeError):
            pass
        raise OpenAIUnavailable("not_configured" if error.code in (401, 403) else "unavailable", usage=diagnostic) from None
    except (URLError, OSError, ValueError, TypeError, KeyError, AttributeError):
        raise OpenAIUnavailable() from None


def render_decision(decision, state):
    topic = decision["topic"]
    if topic == "unknown" and decision["response_key"] not in ("urgent_attention", "out_of_scope"):
        topic = state.get("topic", "unknown")
    declined = decision["contact_signal"] == "declined" or (state.get("contact_declined", False) and decision["contact_signal"] != "requested")
    fixed = decision['response_key'] in ('medical_boundary', 'urgent_attention', 'payment_unverified', 'privacy_info', 'goodbye', 'out_of_scope')
    reply = RESPONSES[decision['response_key']] if fixed else decision.get('reply', RESPONSES[decision['response_key']]).strip()
    action = decision["action"]
    round_number = state.get("completed_rounds", 0) + 1
    if round_number >= POLICY["conversion_from_response"] and decision["response_key"] not in (
            "medical_boundary", "urgent_attention", "privacy_info", "goodbye", "payment_unverified", "out_of_scope"):
        if topic == "course" and action not in ('show_hotmart', 'start_contact_capture'):
            reply += " " + COPY["local_closure_copy"]["hotmart"]
        elif topic in ("consultation", "therapies", "online", "nature") and not declined and action != "start_contact_capture":
            reply += " " + COPY["local_closure_copy"]["contact"]
            action = "offer_contact"
    return {"reply": reply, "topic": topic, "action": action, "response_key": decision["response_key"],
            "contact_signal": decision["contact_signal"], "contact_declined": declined,
            "version": CONFIG["version"], "stop": decision["action"] == "stop"}


def public_result(result):
    try:
        budget_limits()
        enabled = CONFIG.get('active', False) and bool(os.environ.get("OPENAI_API_KEY", "").strip())
    except StoreUnavailable:
        enabled = False
    result = {**result, "policy": POLICY, "provider_enabled": enabled}
    if os.environ.get('CHAT_TEST_METRICS') == '1':
        result['testing_configuration'] = {'model': os.environ.get('OPENAI_MODEL', 'gpt-4.1-mini'),
            'reasoning_effort': reasoning_effort(), 'max_output_tokens': output_token_limit()}
    return result


def testing_metrics(result, usage):
    if os.environ.get('CHAT_TEST_METRICS') == '1':
        result['testing_usage'] = usage_metadata(usage)
    return result


def process_chat(payload, visitor=None, store=None, selector=None):
    store = store or SupabaseChatUsageStore()
    selector = selector or choose_response
    if not visitor:
        return 401, {"status": "session_required"}
    attempt_usage = {}
    try:
        if not isinstance(payload, dict):
            raise InvalidChatRequest()
        operation = payload.get("operation", "send")
        if operation not in ("session", "send", "restart", "start_capture", "cancel_capture"):
            raise InvalidChatRequest()
        if operation != "send":
            conversation = uuid_value(payload.get("conversation_id")) if operation != "session" else None
            result = store.transition(visitor, operation, conversation=conversation)
            return 200, public_result(result)
        messages = validate_messages(payload.get("messages"))
        request_id = uuid_value(payload.get("request_id"))
        conversation = uuid_value(payload.get("conversation_id"))
        digest = fingerprint(json.dumps({"conversation": conversation, "messages": messages}, sort_keys=True, ensure_ascii=False))
        result = store.transition(visitor, "lookup", conversation=conversation, request=request_id, hash=digest)
        if result["status"] != "new":
            return 200, public_result(result)
        if not CONFIG.get('active', False) or not os.environ.get("OPENAI_API_KEY", "").strip():
            return 503, public_result({**result, "status": "not_configured"})
        # Validate the entire provider input before reserving a billable attempt.
        if len(encode_provider_payload(messages, trusted_context(result['state']))) > MAX_INPUT_BYTES - 512:
            raise InvalidChatRequest()
        result = store.transition(visitor, "reserve", conversation=conversation, request=request_id, hash=digest)
        if result["status"] != "reserved":
            return 200, public_result(result)
        try:
            decision, usage = selector(messages, trusted_context(result["state"]))
            attempt_usage = usage
            validate_decision(decision, trusted_context(result["state"]), require_reply=True)
            rendered = render_decision(decision, result["state"])
            rendered['request_id'] = request_id
        except (OpenAIUnavailable, ValueError) as error:
            failed = store.transition(visitor, "fail", conversation=conversation, request=request_id)
            return 503, testing_metrics(public_result({**failed, "status": "provider_failed"}), getattr(error, 'usage', {}))
        completed = store.transition(visitor, "complete", conversation=conversation, request=request_id,
                                     result=rendered, usage=usage_metadata(usage))
        return 200, testing_metrics(public_result(completed), usage)
    except InvalidChatRequest:
        return 400, {"status": "invalid"}
    except (StoreUnavailable, ValueError):
        return 503, testing_metrics({"status": "storage_unavailable", "provider_enabled": False}, attempt_usage)
