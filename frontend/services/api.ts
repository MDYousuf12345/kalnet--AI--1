import {
  ApiResponse,
  EmailData,
  HealthData,
  LeadResearchContact,
  LeadResearchData,
  LeadResearchPayload,
  ProposalData,
} from "../types/lead";

export type { EmailData, ProposalData };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected API error";
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function displayFallback(value: string, fallback: string): string {
  return value || fallback;
}

function cleanEmail(value: unknown): string {
  const text = readString(value);
  const mailtoMatch = text.match(/mailto:([^)\s]+)/i);
  if (mailtoMatch) return mailtoMatch[1];
  const emailMatch = text.match(/[\w.\-+]+@[\w.\-]+\.\w+/);
  return emailMatch ? emailMatch[0] : text;
}

function normalizeContacts(value: unknown, fallbackName: string): LeadResearchContact[] {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((contact) => {
      const item = contact as LeadResearchContact;
      return {
        name: readString(item.name) || "Admissions Team",
        role: readString(item.role) || "Decision Maker",
        email: cleanEmail(item.email),
        phone: readString(item.phone),
        website: readString(item.website),
      };
    });
  }

  if (value && typeof value === "object") {
    const item = value as LeadResearchContact;
    return [
      {
        name: readString(item.name) || fallbackName || "Admissions Team",
        role: readString(item.role) || "Decision Maker",
        email: cleanEmail(item.email),
        phone: readString(item.phone),
        website: readString(item.website),
      },
    ];
  }

  return [{ name: fallbackName || "Admissions Team", role: "Decision Maker", email: "", phone: "", website: "" }];
}

function normalizeLeadData(rawValue: unknown, fallbackName: string, fallbackWebsite?: string): LeadResearchData {
  const raw = rawValue as Record<string, unknown>;
  const institutionSize =
    readString(raw.institution_size) ||
    readString(raw.student_size) ||
    readString(raw.size) ||
    "Institution size to be verified";

  return {
    name: displayFallback(readString(raw.name) || readString(raw.institution_name), fallbackName || "Institution"),
    institution_name: displayFallback(readString(raw.institution_name) || readString(raw.name), fallbackName || "Institution"),
    location: readString(raw.location) || "Location to be verified",
    size: institutionSize,
    institution_size: institutionSize,
    student_size: institutionSize,
    contacts: normalizeContacts(raw.contacts, readString(raw.principal_name) || "Admissions Team"),
    website: readString(raw.website) || fallbackWebsite || "",
    pain_points: Array.isArray(raw.pain_points) ? raw.pain_points.map((point) => readString(point)).filter(Boolean) : [],
    recommended_approach: readString(raw.recommended_approach) || "AI-driven workflow automation and centralized communication systems.",
    confidence_score: typeof raw.confidence_score === "number" ? Math.max(0, Math.min(100, raw.confidence_score)) : 72,
  };
}

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
  });

  if (!response.ok) {
    const fallback = `Server returned status code: ${response.status}`;

    try {
      const payload = (await response.json()) as Partial<ApiResponse<T>>;
      throw new Error(payload.error || fallback);
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error;
      }

      throw new Error(fallback);
    }
  }

  return response.json() as Promise<ApiResponse<T>>;
}
 
async function postJson<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return requestJson<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function researchLead(payload: LeadResearchPayload): Promise<ApiResponse<LeadResearchData>> {
  try {
    const json = await postJson<LeadResearchData>("/agent/research", {
      institution_name: payload.institution_name,
      website: payload.website_url,
      website_url: payload.website_url,
    });

    if (!json.success) {
      throw new Error(json.error || "Backend returned an unsuccessful response");
    }

    return {
      success: true,
      data: normalizeLeadData(json.data, payload.institution_name, payload.website_url),
      error: json.error,
    };
  } catch (error: unknown) {
    return {
      success: false,
      data: normalizeLeadData({}, payload.institution_name, payload.website_url),
      error: getErrorMessage(error),
    };
  }
}

export async function generateEmail(
  institutionName: string,
  contactName: string,
  contactRole: string,
  painPoints: string[],
  tone = "Professional"
): Promise<ApiResponse<EmailData>> {
  try {
    const json = await postJson<EmailData>("/agent/email", {
      institution_name: institutionName,
      contact_name: contactName || "Admissions Team",
      contact_role: contactRole || "Decision Maker",
      pain_points: painPoints,
      tone,
    });
    return json.success ? json : { ...json, data: { subject: "", body: "" } };
  } catch (error: unknown) {
    return {
      success: false,
      data: { subject: "", body: "" },
      error: getErrorMessage(error),
    };
  }
}

export async function generateProposal(
  clientName: string,
  requirements?: string,
  industry = "Education",
  timeline = "6 Weeks",
  budget = "INR 3L - INR 5L",
  painPoints: string[] = [],
  recommendedApproach = ""
): Promise<ApiResponse<ProposalData>> {
  try {
    const json = await postJson<ProposalData>("/agent/proposal", {
      client_name: clientName,
      description: requirements || `${clientName} ${industry} workflow automation proposal`,
      requirements: requirements || "",
      industry,
      timeline,
      budget,
      pain_points: painPoints,
      recommended_approach: recommendedApproach,
    });
    return json.success ? json : {
      ...json,
      data: {
        client_name: "",
        industry,
        project_title: "",
        executive_summary: "",
        proposed_modules: [],
        timeline_weeks: "",
        price_range_inr: "",
        next_steps: [],
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      data: {
        client_name: "",
        industry,
        project_title: "",
        executive_summary: "",
        proposed_modules: [],
        timeline_weeks: "",
        price_range_inr: "",
        next_steps: [],
      },
      error: getErrorMessage(error),
    };
  }
}

export async function generateBatchEmails(
  leads: Array<{
    institution_name: string;
    contact_name: string;
    contact_role: string;
    pain_points: string[];
    tone?: string;
  }>
): Promise<ApiResponse<{ results: ApiResponse<EmailData>[] }>> {
  try {
    return await postJson<{ results: ApiResponse<EmailData>[] }>("/agent/batch-email", { leads });
  } catch (error: unknown) {
    return {
      success: false,
      data: { results: [] },
      error: getErrorMessage(error),
    };
  }
}
export async function sendBatchEmails(
  emails: Array<{
    institution_name: string;
    recipient_email: string;
    subject: string;
    body: string;
  }>
): Promise<ApiResponse<{ results: unknown[] }>> {
  try {
    return await postJson<{ results: unknown[] }>(
      "/agent/send-batch",
      { emails }
    );
  } catch (error: unknown) {
    return {
      success: false,
      data: { results: [] },
      error: getErrorMessage(error),
    };
  }
}
export type Ai2Lead = {
  name?: string;
  institution_name?: string;
  district?: string;
  state?: string;
  student_count?: number | string;
  company_size_category?: string;
  principal_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
};

export async function fetchAi2Leads(): Promise<ApiResponse<{ leads: Ai2Lead[] }>> {
  try {
    return await requestJson<{ leads: Ai2Lead[] }>("/agent/leads");
  } catch (error: unknown) {
    return {
      success: false,
      data: { leads: [] },
      error: getErrorMessage(error),
    };
  }
}

export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  try {
    return await requestJson<HealthData>("/health");
  } catch (error: unknown) {
    return {
      success: false,
      data: {
        status: "unreachable",
        system: "KALNET AI-1 REST Server",
        llm: "",
        groq_configured: false,
        ai2_endpoint: "",
        python_executable: "",
        environment: "",
        active_agents: [],
      },
      error: getErrorMessage(error),
    };
  }
}
export async function sendEmail(
  recipient: string,
  subject: string,
  body: string
) {
  return postJson(
    "/agent/send-email",
    {
      recipient,
      subject,
      body,
    }
  );
}