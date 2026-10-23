"""Versioned selector contract and approved copy, shared by server consumers."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "config" / "chatbot"


def load_config(root=ROOT):
    config = json.loads((root / "setter.config.json").read_text(encoding="utf-8"))
    copy = json.loads((root / config["files"]["responses"]).read_text(encoding="utf-8"))
    schema = config["structured_output"]["schema"]
    templates = copy["model_response_templates"]
    if set(schema["properties"]["response_key"]["enum"]) != set(templates) or set(config["decisions"]) != set(templates):
        raise ValueError("Selector catalog mismatch")
    if config["policy"]["reveal_delay_ms"] != 800:
        raise ValueError("The base delay must be 800 ms")
    for decision in config["decisions"].values():
        if not set(decision["actions"]) <= set(config["catalog"]["actions"]):
            raise ValueError("Unknown action")
    prompts = "\n\n".join((root / config["files"][key]).read_text(encoding="utf-8")
                            for key in ("system_prompt", "developer_prompt"))
    return config, copy, prompts


CONFIG, COPY, INSTRUCTIONS = load_config()
POLICY = CONFIG["policy"]
RESPONSES = COPY["model_response_templates"]
KNOWLEDGE = json.loads((ROOT / 'knowledge.es.json').read_text(encoding='utf-8'))['facts']


def validate_decision(value, context, require_reply=False):
    fields = {"topic", "response_key", "action", "contact_signal"}
    if not isinstance(value, dict) or set(value) not in (fields, fields | {'reply'}):
        raise ValueError("Invalid decision")
    if require_reply and 'reply' not in value:
        raise ValueError('Missing conversational reply')
    if 'reply' in value:
        reply = value['reply']
        if not isinstance(reply, str) or not 1 <= len(reply.strip()) <= 700 or re.search(r'https?://|www\.|\]\(|[<>]|[\x00-\x08]', reply, re.I):
            raise ValueError('Invalid conversational reply')
    for field, prop in CONFIG["structured_output"]["schema"]["properties"].items():
        if field == 'reply':
            continue
        if value[field] not in prop["enum"]:
            raise ValueError("Unknown decision value")
    allowed = CONFIG["decisions"][value["response_key"]]
    if value["topic"] not in allowed["topics"] or value["action"] not in allowed["actions"]:
        raise ValueError("Invalid decision combination")
    if value["response_key"] not in context["allowed_response_keys"] or value["action"] not in context["allowed_actions"]:
        raise ValueError("Action not allowed")
    contact = value["action"] in ("offer_contact", "start_contact_capture")
    if contact and (value["contact_signal"] == "declined" or
                    (context.get("contact_declined") and value["contact_signal"] != "requested")):
        raise ValueError("Contact was declined")
    if value["action"] == "start_contact_capture" and value["contact_signal"] != "requested":
        raise ValueError("Capture requires an explicit request")
    return value
