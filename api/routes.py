import os
import sys
from services.email_sender import send_email
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from starlette.concurrency import run_in_threadpool

from agents.base import GROQ_API_KEY, GROQ_MODEL, success_response
from agents.email_personaliser import process_batch, run_email_personaliser
from agents.lead_research_agent import AI2_API_BASE, fetch_ai2_leads, run_lead_research
from agents.proposal_generator import run_proposal_generator
from backend.schemas import (
    Ai2LeadsData,
    ApiResponse,
    BatchEmailData,
    BatchEmailRequestPayload,
    EmailData,
    EmailRequestPayload,
    HealthData,
    LeadResearchData,
    ProposalData,
    ProposalRequestPayload,
    ResearchRequestPayload,
)


router = APIRouter()


@router.get("/", response_model=ApiResponse[HealthData])
@router.get("/health", response_model=ApiResponse[HealthData])
async def health_check() -> Dict[str, Any]:
    return success_response(
        {
            "status": "healthy",
            "system": "KALNET AI-1 REST Server",
            "llm": f"Groq {GROQ_MODEL}",
            "groq_configured": bool(GROQ_API_KEY),
            "ai2_endpoint": AI2_API_BASE,
            "python_executable": sys.executable,
            "environment": os.getenv("APP_ENV", "development"),
            "active_agents": [
                "Lead Researcher",
                "Proposal Generator",
                "Email Personaliser",
                "Batch Emailer",
            ],
        }
    )


@router.post("/agent/research", response_model=ApiResponse[LeadResearchData])
async def agent_research(payload: ResearchRequestPayload) -> Dict[str, Any]:
    institution_name = payload.institution_name or payload.name or ""
    if payload.lead_id is None and not institution_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="institution_name, name, or lead_id is required",
        )
    return await run_in_threadpool(
        run_lead_research,
        input_text=institution_name,
        website=payload.website or payload.website_url,
        lead_id=payload.lead_id,
    )


@router.get("/agent/leads", response_model=ApiResponse[Ai2LeadsData])
async def agent_leads() -> Dict[str, Any]:
    leads = await run_in_threadpool(fetch_ai2_leads)
    return success_response({"leads": leads})


@router.post("/agent/proposal", response_model=ApiResponse[ProposalData])
async def agent_proposal(payload: ProposalRequestPayload) -> Dict[str, Any]:
    return await run_in_threadpool(run_proposal_generator, payload.to_agent_input())


@router.post("/agent/email", response_model=ApiResponse[EmailData])
async def agent_email(payload: EmailRequestPayload) -> Dict[str, Any]:
    return await run_in_threadpool(run_email_personaliser, payload.model_dump())


@router.post("/agent/batch-email", response_model=ApiResponse[BatchEmailData])
async def agent_batch_email(payload: BatchEmailRequestPayload) -> Dict[str, Any]:
    results = await run_in_threadpool(process_batch, [lead.model_dump() for lead in payload.leads])
    return success_response({"results": results})
@router.post("/agent/send-batch")
async def send_batch(payload: dict):

    results = []

    for email in payload.get("emails", []):

        try:

            await send_email(
                recipient=email["recipient_email"],
                subject=email["subject"],
                body=email["body"]
            )

            results.append({
                "institution": email["institution_name"],
                "status": "sent"
            })

        except Exception as e:

            results.append({
                "institution": email["institution_name"],
                "status": "failed",
                "error": str(e)
            })

    return success_response({
        "results": results
    })
from pydantic import BaseModel
from services.email_sender import send_email

class SendEmailPayload(BaseModel):
    recipient: str
    subject: str
    body: str

@router.post("/agent/send-email")
async def send_single_email(payload: SendEmailPayload):
    return await send_email(
        recipient=payload.recipient,
        subject=payload.subject,
        body=payload.body
    )
