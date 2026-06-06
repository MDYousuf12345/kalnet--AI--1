import { LeadResearchContact } from "../types/lead";

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown): string {
  const text = readString(value);
  const mailtoMatch = text.match(/mailto:([^)\s]+)/i);
  if (mailtoMatch) return mailtoMatch[1];
  const emailMatch = text.match(/[\w.\-+]+@[\w.\-]+\.\w+/);
  return emailMatch ? emailMatch[0] : text;
}

function normalizeContacts(value: unknown): LeadResearchContact[] {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((contact) => {
      const item = contact as LeadResearchContact;
      return {
        name: item.name || "Admissions Team",
        role: item.role || "Decision Maker",
        email: cleanEmail(item.email),
        phone: item.phone || "",
        website: item.website || "",
      };
    });
  }

  const raw = value as Record<string, unknown> | null;
  if (raw && typeof raw === "object") {
    return [
      {
        name: readString(raw.name) || "Admissions Team",
        role: readString(raw.role) || "Decision Maker",
        email: cleanEmail(raw.email),
        phone: readString(raw.phone),
        website: readString(raw.website),
      },
    ];
  }

  return [{ name: "Admissions Team", role: "Decision Maker", email: "", phone: "", website: "" }];
}

export function transformInstitutionData(apiResponse: unknown) {
  const rawData = apiResponse as Record<string, unknown>;
  const district = readString(rawData.district);
  const city = readString(rawData.city);
  const state = readString(rawData.state);
  const country = readString(rawData.country);
  const locationParts = [district || city, state, country].filter(Boolean);
  const location = readString(rawData.location) || locationParts.join(", ") || "Location to be verified";
  const institutionSize =
    readString(rawData.institution_size) ||
    readString(rawData.student_size) ||
    readString(rawData.size) ||
    "Institution size to be verified";

  const transformedData = {
    name: readString(rawData.name) || readString(rawData.institution_name) || "Institution",
    institution_name: readString(rawData.institution_name) || readString(rawData.name) || "Institution",
    location,
    size: institutionSize,
    institution_size: institutionSize,
    student_size: institutionSize,
    website: readString(rawData.website),
    contacts: normalizeContacts(rawData.contacts),
    pain_points: Array.isArray(rawData.pain_points)
      ? rawData.pain_points.map((point) => readString(point)).filter(Boolean)
      : [],
    recommended_approach: readString(rawData.recommended_approach) || "AI-driven workflow automation and centralized communication systems.",
    confidence_score: typeof rawData.confidence_score === "number" ? Math.max(0, Math.min(100, rawData.confidence_score)) : 72,
  };

  return transformedData;
}
