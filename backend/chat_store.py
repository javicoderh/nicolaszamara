"""Server-only RPC adapter. Never falls back to process memory."""
import json
import os
import socket
import ssl
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.setter_config import CONFIG, POLICY
from backend.supabase_config import PROJECT_URL
from backend.provider_settings import output_token_limit, reasoning_effort


class StoreUnavailable(Exception):
    pass


def rpc(name, arguments, *, max_response_bytes=65536):
    key = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
    if not key:
        raise StoreUnavailable("not_configured")
    headers = {"apikey": key, "Content-Type": "application/json"}
    if not key.startswith("sb_secret_"):
        headers["Authorization"] = f"Bearer {key}"
    request = Request(f"{os.environ.get('SUPABASE_URL', PROJECT_URL).rstrip('/')}/rest/v1/rpc/{name}",
                      data=json.dumps(arguments).encode(), method="POST", headers=headers)
    try:
        with urlopen(request, timeout=5) as response:
            body = response.read(max_response_bytes + 1)
            if len(body) > max_response_bytes:
                raise StoreUnavailable('rpc_response_too_large')
            value = json.loads(body)
            if response.status != 200 or not isinstance(value, dict):
                raise StoreUnavailable()
            return value
    except HTTPError as error:
        raise StoreUnavailable(f'rpc_http_{error.code}') from None
    except (URLError, OSError) as error:
        reason = getattr(error, 'reason', error)
        code = ('rpc_timeout' if isinstance(reason, TimeoutError) else
                'rpc_tls_certificate' if isinstance(reason, ssl.SSLCertVerificationError) else
                'rpc_tls_failed' if isinstance(reason, ssl.SSLError) else
                'rpc_dns_failed' if isinstance(reason, socket.gaierror) else
                'rpc_connection_refused' if isinstance(reason, ConnectionRefusedError) else
                'rpc_connection_closed' if isinstance(reason, (ConnectionResetError, ConnectionAbortedError)) else
                'rpc_connection_blocked' if isinstance(reason, PermissionError) else 'rpc_connection_failed')
        raise StoreUnavailable(code) from None
    except (ValueError, TypeError):
        raise StoreUnavailable('rpc_invalid_response') from None


def budget_limits():
    """Reserve a conservative text-token bound using explicitly configured rates.

    USD / million tokens equals micro-USD / token. Failed/uncertain attempts keep
    their reservation. No prices are inferred from a model's name.
    """
    try:
        rates = [Decimal(os.environ[key]) for key in ("CHAT_INPUT_USD_PER_MILLION", "CHAT_OUTPUT_USD_PER_MILLION")]
        daily = int(os.environ["CHAT_DAILY_BUDGET_MICRO_USD"])
        if any(not rate.is_finite() or rate <= 0 for rate in rates) or daily <= 0:
            raise ValueError()
        reserve = int((67584 * rates[0] + output_token_limit() * rates[1]).to_integral_value(rounding=ROUND_CEILING))
        return {"daily_budget_micro_usd": daily, "reservation_micro_usd": reserve}
    except (KeyError, ValueError, InvalidOperation, OverflowError):
        raise StoreUnavailable("not_configured") from None


def usage_metadata(usage):
    metadata = {'model': os.environ.get('OPENAI_MODEL', 'gpt-4.1-mini'), 'policy_version': CONFIG['version'],
                'reasoning_effort': reasoning_effort() or None, 'max_output_tokens': output_token_limit(), **usage}
    if all(isinstance(usage.get(field), int) for field in ('input_tokens', 'output_tokens')):
        try:
            amount = Decimal(usage['input_tokens']) * Decimal(os.environ['CHAT_INPUT_USD_PER_MILLION'])
            amount += Decimal(usage['output_tokens']) * Decimal(os.environ['CHAT_OUTPUT_USD_PER_MILLION'])
            metadata['estimated_micro_usd'] = int(amount.to_integral_value(rounding=ROUND_CEILING))
        except (KeyError, ValueError, InvalidOperation, OverflowError):
            pass
    return metadata


class SupabaseChatUsageStore:
    def transition(self, visitor, operation, **values):
        limits = dict(POLICY)
        if operation == "reserve":
            limits.update(budget_limits())
        return rpc("setter_transition", {"p_visitor": visitor, "p_operation": operation,
                                         "p_limits": limits, **{f"p_{key}": value for key, value in values.items()}})
