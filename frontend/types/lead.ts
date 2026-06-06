export interface LeadResearchPayload {
  institution_name: string;
  website_url?: string;
}

export interface LeadResearchContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  website?: string;
}

export interface LeadResearchData {
  name: string;
  institution_name: string;
  location: string;
  size: string;
  institution_size: string;
  student_size: string;
  contacts: LeadResearchContact[];
  website: string;
  pain_points: string[];
  recommended_approach: string;
  confidence_score: number;
}

export interface HealthData {
  status: string;
  system: string;
  llm: string;
  groq_configured: boolean;
  ai2_endpoint: string;
  python_executable: string;
  environment: string;
  active_agents: string[];
}

export interface EmailData {
  subject: string;
  body: string;
}

export interface ProposalData {
  client_name: string;
  industry?: string;
  project_title: string;
  executive_summary: string;
  proposed_modules: string[];
  timeline_weeks: string;
  price_range_inr: string;
  next_steps: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}
