import json
import logging
import os
import re
import time
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

from openai import base_url
import requests
from bs4 import BeautifulSoup

from .base import (
    as_list,
    clean_email,
    clean_string,
    domain_from_url,
    first_text,
    invoke_json,
    load_prompt,
    success_response,
)


AI2_API_BASE = os.getenv("AI2_API_BASE", "https://kalnet-dashboard-api-3.onrender.com")
AI2_TIMEOUT_SECONDS = float(os.getenv("AI2_TIMEOUT_SECONDS", "20"))
WEBSITE_TIMEOUT_SECONDS = float(os.getenv("WEBSITE_TIMEOUT_SECONDS", "12"))
AI2_RETRIES = int(os.getenv("AI2_RETRIES", "2"))
WEBSITE_RETRIES = int(os.getenv("WEBSITE_RETRIES", "1"))

logger = logging.getLogger("kalnet_ai1.lead_research")


def request_with_retries(url: str, timeout: float, retries: int, **kwargs: Any) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            response = requests.get(url, timeout=timeout, **kwargs)
            if response.status_code >= 500:
                raise requests.HTTPError(f"Upstream returned {response.status_code}", response=response)
            return response
        except requests.RequestException as exc:
            last_error = exc
            logger.warning("request_failed", extra={"url": url, "attempt": attempt + 1, "error": str(exc)})
            if attempt < retries:
                time.sleep(0.7 * (2**attempt))
    raise last_error or requests.RequestException(f"Request failed for {url}")


def fetch_ai2_leads() -> List[Dict[str, Any]]:
    try:
        response = request_with_retries(
            f"{AI2_API_BASE}/leads",
            timeout=AI2_TIMEOUT_SECONDS,
            retries=AI2_RETRIES,
            headers={"User-Agent": "KALNET-AI1/1.0"},
        )
        response.raise_for_status()
        payload = response.json()
        leads = payload.get("message") or payload.get("data") or []
        return leads if isinstance(leads, list) else []
    except (requests.RequestException, ValueError, TypeError) as exc:
        logger.warning("ai2_leads_fetch_failed", extra={"error": str(exc)})
        return []


def get_lead_from_ai2(lead_id: Optional[int]) -> Dict[str, Any]:
    if not lead_id:
        return {}

    try:
        response = request_with_retries(
            f"{AI2_API_BASE}/leads/{lead_id}",
            timeout=AI2_TIMEOUT_SECONDS,
            retries=AI2_RETRIES,
            headers={"User-Agent": "KALNET-AI1/1.0"},
        )
        response.raise_for_status()
        payload = response.json()
        message = payload.get("message") or payload.get("data") or payload
        if isinstance(message, list):
            return message[0] if message else {}
        return message if isinstance(message, dict) else {}
    except (requests.RequestException, ValueError, TypeError) as exc:
        logger.warning("ai2_lead_fetch_failed", extra={"lead_id": lead_id, "error": str(exc)})
        return {}


def search_lead_by_name(name: Optional[str]) -> Dict[str, Any]:
    query = clean_string(name).lower()
    if not query:
        return {}

    leads = fetch_ai2_leads()
    query_tokens = set(re.findall(r"[a-z0-9]+", query))
    best_match: Dict[str, Any] = {}
    best_score = 0.0

    for lead in leads:
        lead_name = clean_string(lead.get("name") or lead.get("institution_name")).lower()
        if not lead_name:
            continue
        if query in lead_name or lead_name in query:
            return lead
        lead_tokens = set(re.findall(r"[a-z0-9]+", lead_name))
        token_score = len(query_tokens & lead_tokens) / max(1, len(query_tokens | lead_tokens))
        ratio_score = SequenceMatcher(None, query, lead_name).ratio()
        score = max(token_score, ratio_score)
        if score > best_score:
            best_score = score
            best_match = lead
    return best_match if best_score >= 0.58 else {}


def normalize_url(url: Optional[str]) -> str:
    value = clean_string(url)
    if not value:
        return ""
    if not value.startswith(("http://", "https://")):
        value = f"https://{value}"
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return value.rstrip("/")


def page_text(html: str) -> tuple[str, List[str]]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "noscript", "svg"]):
        tag.decompose()

    links = []
    for link in soup.find_all("a", href=True):
        label = link.get_text(" ", strip=True).lower()
        href = str(link.get("href", "")).strip()
        if any(keyword in f"{label} {href}".lower() for keyword in ["about", "school", "contact"]):
            links.append(href)

    text = " ".join(node.get_text(" ", strip=True) for node in soup.find_all(["h1", "h2", "h3", "p", "li", "a"]))
    return re.sub(r"\s+", " ", text).strip(), links


def scrape_website(url: Optional[str]) -> str:
    base_url = normalize_url(url)
    if not base_url:
        return ""

    candidates = [
    base_url,
    f"{base_url}/about",
    f"{base_url}/about-us",
    f"{base_url}/contact",
    f"{base_url}/contact-us",

    f"{base_url}/admissions",
    f"{base_url}/academics",
    f"{base_url}/departments",
    f"{base_url}/placements",
    f"{base_url}/examinations",
    f"{base_url}/research",
    f"{base_url}/student-services",
    f"{base_url}/erp",
]
    collected: List[str] = []
    seen: set[str] = set()

    for candidate in candidates:
        if candidate in seen or len(collected) >= 4:
            continue
        seen.add(candidate)
        try:
            response = request_with_retries(
                candidate,
                timeout=WEBSITE_TIMEOUT_SECONDS,
                retries=WEBSITE_RETRIES,
                headers={"User-Agent": "Mozilla/5.0 (compatible; KALNET-AI1/1.0)"},
                allow_redirects=True,
            )
            response.raise_for_status()
            if "text/html" not in response.headers.get("content-type", ""):
                continue
            text, discovered_links = page_text(response.text)
            if len(text) > 80:
                collected.append(f"URL: {candidate}\n{text[:1800]}")
            for href in discovered_links[:8]:
                absolute = urljoin(base_url + "/", href).rstrip("/")
                if absolute.startswith(base_url) and absolute not in seen:
                    candidates.append(absolute)
        except (requests.RequestException, ValueError) as exc:
            logger.warning("website_scrape_failed", extra={"url": candidate, "error": str(exc)})
            continue

    return "\n\n".join(collected)[:6000]


def extract_email(*texts: str) -> str:
    for text in texts:
        match = re.search(r"[\w.\-+]+@[\w.\-]+\.\w+", text or "")
        if match:
            return match.group(0)
    return ""


def extract_phone(*texts: str) -> str:
    for text in texts:
        match = re.search(r"(?:\+91[\s-]?)?(?:0[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}", text or "")
        if match:
            return match.group(0).strip()
    return ""

def extract_operational_signals(text: str):
    text = text.lower()

    signals = []

    if "admission" in text:
        signals.append("admissions")

    if "placement" in text:
        signals.append("placements")

    if "attendance" in text:
        signals.append("attendance")

    if "examination" in text:
        signals.append("examinations")

    if "research" in text:
        signals.append("research")

    if "parent portal" in text:
        signals.append("parent_portal")

    if "student portal" in text:
        signals.append("student_portal")

    if "hostel" in text:
        signals.append("hostel_management")

    if "library" in text:
        signals.append("library_management")

    return signals



PAIN_POINT_MAP = {
    "admissions": "Admissions enquiry follow-up",
    "placements": "Placement coordination tracking",
    "attendance": "Attendance monitoring visibility",
    "examinations": "Examination workflow coordination",
    "research": "Research administration complexity",
    "hostel_management": "Hostel operations management",
    "library_management": "Library resource tracking",
    "student_portal": "Student service request management",
    "parent_portal": "Parent communication management",
}
CATEGORY_PAIN_POINTS = {
    "research_university": [
        "Research project tracking across departments",
        "Faculty collaboration workflow visibility",
        "Grant management administration",
    ],

    "university": [
        "Examination workflow coordination",
        "Cross-department reporting visibility",
        "Student service request management",
    ],

    "engineering_college": [
        "Placement workflow coordination",
        "Industry partnership tracking",
        "Student internship management",
    ],

    "medical_college": [
        "Patient training workflow visibility",
        "Clinical department coordination",
        "Research documentation management",
    ],

    "school": [
        "Admissions enquiry follow-up",
        "Parent communication workflows",
        "Attendance monitoring visibility",
    ],

    "default": [
        "Manual administrative work",
        "Communication workflow inefficiencies",
        "Data management visibility challenges",
    ]
}
def generate_pain_points_from_website(website_text: str) -> List[str]:
    signals = extract_operational_signals(website_text)

    pain_points = []

    for signal in signals:
        if signal in PAIN_POINT_MAP:
            pain_points.append(
                PAIN_POINT_MAP[signal]
            )

    return pain_points[:3]
def infer_institution_category(
    institution_name: str,
    website_text: str
) -> str:

    text = (
        institution_name + " " + website_text
    ).lower()

    if (
        "iit" in text
        or "national institute of technology" in text
        or "research centre" in text
        or "research center" in text
    ):
        return "research_university"

    if (
        "engineering" in text
        or "technology" in text
        or "polytechnic" in text
    ):
        return "engineering_college"

    if (
        "medical" in text
        or "hospital" in text
        or "health sciences" in text
    ):
        return "medical_college"

    if (
        "school" in text
        or "cbse" in text
        or "icse" in text
        or "secondary education" in text
    ):
        return "school"

    if "university" in text:
        return "university"

    return "default"
def infer_location(data: Dict[str, Any], llm_data: Dict[str, Any], institution_name: str) -> str:
    location = first_text(
        llm_data.get("location"),
        data.get("location"),
        ", ".join(
            part
            for part in [
                clean_string(data.get("district")),
                clean_string(data.get("city")),
                clean_string(data.get("state")),
                clean_string(data.get("country")),
            ]
            if part
        ),
    )
    if location:
        return location
    city_state = {
        "hyderabad": "Hyderabad, Telangana",
        "secunderabad": "Secunderabad, Telangana",
        "mumbai": "Mumbai, Maharashtra",
        "delhi": "Delhi",
        "bangalore": "Bangalore, Karnataka",
        "bengaluru": "Bengaluru, Karnataka",
        "kolkata": "Kolkata, West Bengal",
        "pune": "Pune, Maharashtra",
    }
    for city, resolved in city_state.items():
        if city in institution_name.lower():
            return resolved
    return "Location to be verified"


def normalize_size(data: Dict[str, Any], llm_data: Dict[str, Any]) -> str:
    direct = first_text(
        llm_data.get("size"),
        llm_data.get("institution_size"),
        data.get("institution_size"),
        data.get("student_size"),
    )
    if direct:
        return direct
    count = first_text(data.get("student_count"), data.get("students"), data.get("student_strength"))
    category = first_text(data.get("company_size_category"))
    if count:
        return f"{category or 'Medium'}-sized institution with {str(count).replace('+', '').strip()} students"
    return f"{category}-sized institution" if category else "Institution size to be verified"


def normalize_contacts(data: Dict[str, Any], llm_data: Dict[str, Any], website_text: str, website: str) -> List[Dict[str, str]]:
    contacts = llm_data.get("contacts")
    candidates = contacts if isinstance(contacts, list) else [contacts] if isinstance(contacts, dict) else []
    domain = domain_from_url(website)
    inferred_email = f"info@{domain}" if domain and "." in domain else ""
    normalized: List[Dict[str, str]] = []

    for candidate in candidates[:3]:
        if not isinstance(candidate, dict):
            continue
        normalized.append(
            {
                "name": first_text(candidate.get("name"), default="Admissions Team"),
                "role": first_text(candidate.get("role"), default="Decision Maker"),
                "email": first_text(clean_email(candidate.get("email")), clean_email(data.get("email")), extract_email(website_text), inferred_email),
                "phone": first_text(candidate.get("phone"), data.get("phone"), extract_phone(website_text)),
            }
        )
    if normalized:
        return normalized
    return [
        {
            "name": first_text(data.get("principal_name"), data.get("contact_name"), default="Admissions Team"),
            "role": first_text(data.get("contact_role"), default="Decision Maker"),
            "email": first_text(clean_email(data.get("email")), extract_email(website_text), inferred_email),
            "phone": first_text(data.get("phone"), extract_phone(website_text)),
        }
    ]


def normalize_pain_points(
    value: Any,
    website_text: str = "",
    institution_name: str = "",
) -> List[str]:

    points = [
        clean_string(item)
        for item in as_list(value)
    ]

    points = [
        point for point in points
        if point
    ]

    if len(points) >= 2:
        return points[:3]

    category = infer_institution_category(
        institution_name,
        website_text,
    )

    return CATEGORY_PAIN_POINTS.get(
        category,
        CATEGORY_PAIN_POINTS["default"]
    )[:3]


def normalize_lead_output(
    input_text: str,
    website: Optional[str],
    ai2_data: Dict[str, Any],
    llm_data: Optional[Dict[str, Any]] = None,
    website_text: str = "",
) -> Dict[str, Any]:
    llm_data = llm_data or {}
    institution_name = first_text(
        llm_data.get("name"),
        llm_data.get("institution_name"),
        ai2_data.get("institution_name"),
        ai2_data.get("name"),
        input_text,
        default="Institution",
    )
    website_value = first_text(llm_data.get("website"), ai2_data.get("website"), website)
    return {
        "name": institution_name,
        "location": infer_location(ai2_data, llm_data, institution_name),
        "size": normalize_size(ai2_data, llm_data),
        "contacts": normalize_contacts(ai2_data, llm_data, website_text, website_value),
        "pain_points": normalize_pain_points(
    llm_data.get("pain_points")
    or ai2_data.get("pain_points"),
    website_text,
    institution_name,
),
        "recommended_approach": first_text(
            llm_data.get("recommended_approach"),
            default="Use KALNET's Plug In Not Replace approach to automate priority workflows, centralize communication, and give the team a practical operating dashboard without replacing existing systems.",
        ),
    }


def run_lead_research(input_text: str = "", website: Optional[str] = None, lead_id: Optional[int] = None) -> Dict[str, Any]:
    ai2_data = get_lead_from_ai2(lead_id) if lead_id else search_lead_by_name(input_text)
    website = website or clean_string(ai2_data.get("website"))
    website_text = scrape_website(website)
    print("WEBSITE LENGTH:", len(website_text))
    print(website_text[:1000]) 
    prompt = (
        load_prompt("lead_research.txt")
        .replace("{ai2_data}", json.dumps(ai2_data, ensure_ascii=False))
        .replace("{input_text}", input_text)
        .replace("{website}", website or "")
        .replace("{website_text}", website_text)
    )
    print("COLLEGE:", input_text)
    print("WEBSITE:", website)
    print("WEBSITE TEXT LENGTH:", len(website_text))
    try:
        llm_data = invoke_json(prompt)
    except Exception as exc:
        logger.warning("lead_research_llm_fallback", extra={"lead_id": lead_id, "input_text": input_text, "error": str(exc)})
        llm_data = {}
    return success_response(normalize_lead_output(input_text, website, ai2_data, llm_data, website_text))
