from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T
    error: Optional[str] = None


class StrictPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ResearchRequestPayload(StrictPayload):
    lead_id: Optional[int] = Field(default=None, ge=1)
    institution_name: Optional[str] = Field(default=None, min_length=1, max_length=180)
    name: Optional[str] = Field(default=None, min_length=1, max_length=180)
    website: Optional[str] = Field(default=None, max_length=300)
    website_url: Optional[str] = Field(default=None, max_length=300)


class EmailRequestPayload(StrictPayload):
    institution_name: str = Field(min_length=1, max_length=180)
    contact_name: str = Field(default="Admissions Team", max_length=120)
    contact_role: str = Field(default="Decision Maker", max_length=120)
    pain_points: List[str] = Field(default_factory=list, max_length=8)
    tone: Optional[str] = Field(default="Professional", max_length=40)

    @field_validator("pain_points")
    @classmethod
    def trim_pain_points(cls, value: List[str]) -> List[str]:
        return [item.strip() for item in value if item and item.strip()][:8]


class ProposalRequestPayload(StrictPayload):
    description: Optional[str] = Field(default=None, max_length=2500)
    text: Optional[str] = Field(default=None, max_length=2500)
    client_name: Optional[str] = Field(default=None, min_length=1, max_length=180)
    requirements: Optional[str] = Field(default=None, max_length=2000)
    industry: Optional[str] = Field(default="Education", max_length=80)
    timeline: Optional[str] = Field(default="6 Weeks", max_length=80)
    budget: Optional[str] = Field(default="INR 3L - INR 5L", max_length=120)
    pain_points: List[str] = Field(default_factory=list, max_length=8)
    recommended_approach: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_description_or_client(self) -> "ProposalRequestPayload":
        if not (self.description or self.text or self.requirements or self.client_name):
            raise ValueError("description, text, requirements, or client_name is required")
        return self

    @field_validator("pain_points")
    @classmethod
    def trim_proposal_pain_points(cls, value: List[str]) -> List[str]:
        return [item.strip() for item in value if item and item.strip()][:8]

    def to_agent_input(self) -> Dict[str, Any]:
        description = self.description or self.text or self.requirements or ""
        return {
            "description": description,
            "client_name": self.client_name,
            "requirements": self.requirements or description,
            "industry": self.industry,
            "timeline": self.timeline,
            "budget": self.budget,
            "pain_points": self.pain_points,
            "recommended_approach": self.recommended_approach,
        }


class BatchEmailRequestPayload(StrictPayload):
    leads: List[EmailRequestPayload] = Field(min_length=1, max_length=500)


class LeadResearchContact(BaseModel):
    name: str
    role: str
    email: str = ""
    phone: str = ""


class LeadResearchData(BaseModel):
    name: str
    location: str
    size: str
    contacts: List[LeadResearchContact]
    pain_points: List[str]
    recommended_approach: str


class EmailData(BaseModel):
    subject: str
    body: str


class ProposalData(BaseModel):
    client_name: str
    project_title: str
    executive_summary: str
    proposed_modules: List[str]
    timeline_weeks: str
    price_range_inr: str
    next_steps: List[str]


class BatchEmailData(BaseModel):
    results: List[ApiResponse[EmailData]]


class Ai2LeadsData(BaseModel):
    leads: List[dict]


class HealthData(BaseModel):
    status: str
    system: str
    llm: str
    groq_configured: bool
    ai2_endpoint: str
    python_executable: str = ""
    environment: str = "development"
    active_agents: List[str]
