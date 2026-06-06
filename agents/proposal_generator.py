import re
from typing import Any, Dict

from .base import as_list, clean_string, first_text, invoke_json, load_prompt, success_response


def weeks_from_text(value: Any) -> str:
    text = clean_string(value)
    match = re.search(r"\d+", text)
    return f"{match.group(0)} Weeks" if match else "6 Weeks"


def build_input(user_input: Any) -> str:
    if isinstance(user_input, str):
        return user_input.strip()
    if isinstance(user_input, dict):
        pain_points = "\n".join(f"- {point}" for point in as_list(user_input.get("pain_points")))
        return f"""
Client Name: {first_text(user_input.get("client_name"), user_input.get("institution_name"), user_input.get("name"), default="Client")}
Industry: {first_text(user_input.get("industry"), default="Education")}
Timeline: {first_text(user_input.get("timeline"), default="6 Weeks")}
Budget: {first_text(user_input.get("budget"), default="INR 3L - INR 5L")}
Project Description: {first_text(user_input.get("description"), user_input.get("requirements"))}
Pain Points:
{pain_points}
Recommended Approach: {first_text(user_input.get("recommended_approach"))}
""".strip()
    return str(user_input).strip()


def fallback_proposal(user_input: Any) -> Dict[str, Any]:
    text = build_input(user_input)
    name_match = re.search(r"(?:Client Name|Institution Name):\s*(.+)", text)
    client_name = name_match.group(1).strip() if name_match else "Client"
    industry = first_text(user_input.get("industry") if isinstance(user_input, dict) else "", default="Education")
    budget = first_text(user_input.get("budget") if isinstance(user_input, dict) else "", default="INR 3L - INR 5L")
    timeline = first_text(user_input.get("timeline") if isinstance(user_input, dict) else "", default="6 Weeks")
    return {
        "client_name": client_name,
        "project_title": f"{client_name} AI Workflow Automation Proposal",
        "executive_summary": (
            f"KALNET will help {client_name} modernize high-friction workflows using AI automation that plugs into current systems instead of forcing a replacement.\n\n"
            "The engagement will prioritize practical modules for communication, enquiry tracking, dashboards, and staff productivity, with delivery shaped around the education and hospitality operating patterns KALNET serves from Hyderabad."
        ),
        "proposed_modules": [
            "Discovery and workflow mapping",
            "AI-assisted enquiry and follow-up automation",
            "Centralized communication dashboard",
            "Operational analytics and handover training",
        ],
        "timeline_weeks": weeks_from_text(timeline),
        "price_range_inr": budget,
        "next_steps": [
            "Confirm priority workflows and success metrics",
            "Run a short discovery workshop with stakeholders",
            "Finalize MVP scope, timeline, and implementation plan",
        ],
    }


def ensure_two_paragraphs(summary: str, fallback_summary: str) -> str:
    text = clean_string(summary)
    if "\n\n" in summary and len([part for part in summary.split("\n\n") if clean_string(part)]) >= 2:
        return summary.strip()
    if not text:
        return fallback_summary

    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [sentence for sentence in sentences if sentence]
    if len(sentences) >= 2:
        midpoint = max(1, len(sentences) // 2)
        return f"{' '.join(sentences[:midpoint])}\n\n{' '.join(sentences[midpoint:])}"
    return (
        f"{text}\n\n"
        "KALNET will keep the implementation practical and modular, using the Plug In Not Replace approach to improve priority workflows without disrupting existing operations."
    )


def normalize_proposal(data: Dict[str, Any], user_input: Any) -> Dict[str, Any]:
    fallback = fallback_proposal(user_input)
    executive_summary = data.get("executive_summary")
    if isinstance(executive_summary, list):
        executive_summary_text = "\n\n".join(clean_string(item) for item in executive_summary if clean_string(item))
    else:
        executive_summary_text = str(executive_summary or "").strip()
    proposed_modules = [clean_string(item) for item in as_list(data.get("proposed_modules")) if clean_string(item)][:8]
    next_steps = [clean_string(item) for item in as_list(data.get("next_steps")) if clean_string(item)][:3]
    return {
        "client_name": first_text(data.get("client_name"), fallback["client_name"]),
        "project_title": first_text(data.get("project_title"), fallback["project_title"]),
        "executive_summary": ensure_two_paragraphs(executive_summary_text, fallback["executive_summary"]),
        "proposed_modules": proposed_modules or fallback["proposed_modules"],
        "timeline_weeks": weeks_from_text(data.get("timeline_weeks") or fallback["timeline_weeks"]),
        "price_range_inr": first_text(data.get("price_range_inr"), fallback["price_range_inr"]),
        "next_steps": next_steps or fallback["next_steps"],
    }


def run_proposal_generator(user_input: Any) -> Dict[str, Any]:
    prompt = load_prompt("proposal_generator.txt").replace("{input}", build_input(user_input))
    try:
        data = invoke_json(prompt)
        normalized = normalize_proposal(data, user_input)
    except Exception:
        normalized = fallback_proposal(user_input)
    return success_response(normalized)
