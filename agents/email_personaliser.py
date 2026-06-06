import json
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from .base import (
    PROJECT_DIR,
    as_list,
    clamp_words,
    clean_string,
    first_text,
    invoke_json,
    load_prompt,
    remove_banned_email_phrases,
    success_response,
)


BATCH_EMAIL_DELAY_SECONDS = 1.0
FAILED_LOG_PATH = PROJECT_DIR / "logs" / "batch_email_failures.jsonl"
logger = logging.getLogger("kalnet_ai1.email_personaliser")


def contact_name_or_team(name: str) -> str:
    value = clean_string(name)
    return value if value and value.lower() not in {"there", "principal"} else "Admissions Team"


def build_fallback_email(lead: Dict[str, Any]) -> Dict[str, str]:
    institution_name = first_text(lead.get("institution_name"), default="your institution")
    contact_name = contact_name_or_team(first_text(lead.get("contact_name"), lead.get("principal_name")))
    pain_points = [clean_string(point) for point in as_list(lead.get("pain_points")) if clean_string(point)]
    pain_text = ", ".join(pain_points[:2]) if pain_points else "manual coordination and follow-up gaps"
    body = f"""Dear {contact_name},

We reviewed {institution_name} and noticed opportunities around {pain_text}.

KALNET can plug into your existing workflows to automate follow-ups, centralize communication, and reduce manual coordination without replacing current systems.

Would you be open to a short discussion this week?

Regards,
KALNET AI Solutions"""
    return {
        "subject": f"Workflow automation for {institution_name}",
        "body": clamp_words(remove_banned_email_phrases(body.strip()), 120),
    }


def normalize_email(data: Dict[str, Any], lead: Dict[str, Any]) -> Dict[str, str]:
    fallback = build_fallback_email(lead)
    subject = first_text(data.get("subject"), fallback["subject"])
    body = first_text(data.get("body"), fallback["body"])
    body = remove_banned_email_phrases(body)
    if not body.lower().startswith(("dear ", "hello ")):
        body = f"Dear {contact_name_or_team(first_text(lead.get('contact_name')))},\n\n{body}"
    body = re.sub(
        r"^(Dear[^\n]*,)\s*(?:\n\s*)?(?:Hi|Hello|Dear)\s+[^,\n]+,\s*",
        r"\1\n\n",
        body,
        flags=re.IGNORECASE,
    )
    return {"subject": clamp_words(subject, 14), "body": clamp_words(body.strip(), 120)}


def run_email_personaliser(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    normalized_input = {
        "institution_name": first_text(lead_data.get("institution_name")),
        "contact_name": contact_name_or_team(first_text(lead_data.get("contact_name"))),
        "contact_role": first_text(lead_data.get("contact_role"), default="Decision Maker"),
        "pain_points": lead_data.get("pain_points", []),
        "tone": first_text(lead_data.get("tone"), default="Professional"),
    }
    prompt = load_prompt("email_personaliser.txt").replace("{input}", json.dumps(normalized_input, ensure_ascii=False))
    try:
        data = invoke_json(prompt)
        normalized = normalize_email(data, lead_data)
    except Exception as exc:
        logger.warning("email_llm_fallback", extra={"institution_name": normalized_input["institution_name"], "error": str(exc)})
        normalized = build_fallback_email(lead_data)
    return success_response(normalized)


def log_failed_entry(index: int, lead: Dict[str, Any], error: str) -> None:
    FAILED_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "index": index,
        "institution_name": lead.get("institution_name"),
        "contact_name": lead.get("contact_name"),
        "error": error,
    }
    with FAILED_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def process_batch(leads_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for index, lead in enumerate(leads_list):
        try:
            result = run_email_personaliser(lead)
        except Exception as exc:
            logger.exception("batch_email_failed", extra={"index": index, "institution_name": lead.get("institution_name")})
            result = {"success": False, "data": {}, "error": str(exc)}
        if not result.get("success"):
            log_failed_entry(index, lead, str(result.get("error") or "Unknown batch email failure"))
        results.append(result)
        if index < len(leads_list) - 1:
            time.sleep(BATCH_EMAIL_DELAY_SECONDS)
    return results
