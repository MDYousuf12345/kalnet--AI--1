import json
import logging
import os
import re
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq


PROJECT_DIR = Path(__file__).resolve().parents[1]
PROMPT_DIR = PROJECT_DIR / "prompts"
load_dotenv(PROJECT_DIR / ".env")

GROQ_MODEL = (os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile").strip()
GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))
LLM_RETRIES = int(os.getenv("LLM_RETRIES", "2"))
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "45"))
GROQ_SSL_VERIFY = os.getenv("GROQ_SSL_VERIFY", "false").strip().lower() not in {"0", "false", "no"}

logger = logging.getLogger("kalnet_ai1.agents")
llm: Optional[ChatGroq] = None

BANNED_EMAIL_PHRASES = [
    "I hope this finds you well",
    "synergy",
    "Dear Sir/Madam",
]


def initialize_llm() -> ChatGroq:
    """Create the shared Groq chat model exactly once."""
    global llm
    if llm is not None:
        return llm

    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is required for Groq agent calls")

    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=GROQ_MODEL,
        temperature=LLM_TEMPERATURE,
        timeout=LLM_TIMEOUT_SECONDS,
        max_retries=0,
        http_client=httpx.Client(verify=GROQ_SSL_VERIFY, timeout=LLM_TIMEOUT_SECONDS),
        http_async_client=httpx.AsyncClient(verify=GROQ_SSL_VERIFY, timeout=LLM_TIMEOUT_SECONDS),
        model_kwargs={"response_format": {"type": "json_object"}},
    )
    logger.info("groq_llm_initialized", extra={"model": GROQ_MODEL})
    return llm


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    return initialize_llm()


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    return {"success": True, "data": data, "error": None}


def error_response(error: Exception | str) -> Dict[str, Any]:
    return {"success": False, "data": {}, "error": str(error)}


def load_prompt(filename: str) -> str:
    path = PROMPT_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")


def invoke_text(prompt: str) -> str:
    chain = (
        ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Return exactly one valid JSON object. Do not include markdown fences, prose, or extra keys.",
                ),
                ("human", "{prompt}"),
            ]
        )
        | get_llm()
        | StrOutputParser()
    )

    last_error: Exception | None = None
    for attempt in range(LLM_RETRIES + 1):
        try:
            return chain.invoke({"prompt": prompt}).strip()
        except Exception as exc:
            last_error = exc
            logger.warning("groq_invoke_failed", extra={"attempt": attempt + 1, "error": str(exc)})
            if attempt < LLM_RETRIES:
                time.sleep(0.8 * (attempt + 1))
    raise last_error or RuntimeError("Groq invocation failed")


def parse_json_object(text: str) -> Dict[str, Any]:
    cleaned = re.sub(r"```(?:json)?|```", "", text, flags=re.IGNORECASE).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start < 0 or end <= start:
        raise ValueError("LLM output did not contain a JSON object")
    cleaned = cleaned[start:end]
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        repaired = re.sub(r",\s*([}\]])", r"\1", cleaned)
        parsed = json.loads(repaired)
    if not isinstance(parsed, dict):
        raise ValueError("LLM output JSON must be an object")
    return parsed


def invoke_json(prompt: str) -> Dict[str, Any]:
    return parse_json_object(invoke_text(prompt))


def clean_string(value: Any) -> str:
    if value is None:
        return ""
    text = re.sub(r"\s+", " ", str(value).strip())
    return "" if text.lower() in {"not available", "n/a", "none", "null", "unknown", "-"} else text


def clean_email(value: Any) -> str:
    text = clean_string(value)
    mailto_match = re.search(r"mailto:([^)\s]+)", text, flags=re.IGNORECASE)
    if mailto_match:
        return mailto_match.group(1).strip()
    email_match = re.search(r"[\w.\-+]+@[\w.\-]+\.\w+", text)
    return email_match.group(0) if email_match else text


def first_text(*values: Any, default: str = "") -> str:
    for value in values:
        text = clean_string(value)
        if text:
            return text
    return default


def as_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    if isinstance(value, str) and value.strip():
        return [part.strip() for part in re.split(r"[,;\n]", value) if part.strip()]
    return []


def clamp_int(value: Any, minimum: int = 0, maximum: int = 100, default: int = 0) -> int:
    try:
        number = int(float(str(value).strip().replace("%", "")))
    except (TypeError, ValueError):
        number = default
    return max(minimum, min(maximum, number))


def clamp_words(text: str, limit: int) -> str:
    words = text.split()
    return text if len(words) <= limit else " ".join(words[:limit]).rstrip(" ,.;") + "."


def remove_banned_email_phrases(text: str) -> str:
    cleaned = text
    for phrase in BANNED_EMAIL_PHRASES:
        cleaned = re.sub(re.escape(phrase), "", cleaned, flags=re.IGNORECASE).strip()
    return re.sub(r"\n{3,}", "\n\n", cleaned)


def domain_from_url(url: str) -> str:
    text = clean_string(url).lower()
    text = re.sub(r"^https?://", "", text)
    text = text.split("/")[0].strip()
    return text[4:] if text.startswith("www.") else text
