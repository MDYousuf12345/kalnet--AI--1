export type ActivityType = "research" | "email" | "proposal" | "batch";

export type HistoryEntry = {
  id: number;
  type: ActivityType;
  content: unknown;
  createdAt: string;
};

export const HISTORY_STORAGE_KEY = "kalnet-history";
export const HISTORY_UPDATED_EVENT = "kalnet-history-updated";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown): string {
  return readString(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeType(type: string): ActivityType {
  const cleanType = type.toLowerCase().trim();
  if (cleanType === "emails") return "email";
  if (cleanType === "proposals") return "proposal";
  if (cleanType === "research") return "research";
  if (cleanType === "email") return "email";
  if (cleanType === "proposal") return "proposal";
  return "research";
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value ?? "");
}

function getInstitutionName(content: Record<string, unknown>): string {
  return normalizeText(content.institution_name || content.name || content.client_name);
}

function getRecipientEmail(content: Record<string, unknown>): string {
  const contacts = Array.isArray(content.contacts) ? content.contacts : [];
  const firstContact = asRecord(contacts[0]);
  return normalizeText(content.recipient_email || content.email || firstContact.email);
}

function getSubject(content: Record<string, unknown>): string {
  return normalizeText(content.subject || content.project_title);
}

function getGeneratedContent(type: ActivityType, content: Record<string, unknown>): string {
  let generatedValue: unknown = content;

  if (type === "email") {
    generatedValue = content.body || content.generated_content || content;
  }

  if (type === "proposal") {
    generatedValue = {
      project_title: content.project_title,
      executive_summary: content.executive_summary,
      proposed_modules: content.proposed_modules,
      next_steps: content.next_steps,
      price_range_inr: content.price_range_inr,
      timeline_weeks: content.timeline_weeks,
    };
  }

  if (type === "research") {
    generatedValue = {
      location: content.location,
      student_size: content.student_size || content.institution_size,
      contacts: content.contacts,
      pain_points: content.pain_points,
      recommended_approach: content.recommended_approach,
      website: content.website,
      confidence_score: content.confidence_score,
    };
  }

  return stableStringify(generatedValue).toLowerCase().replace(/\s+/g, " ");
}

function getDuplicateKey(entry: Pick<HistoryEntry, "type" | "content">): string {
  const type = normalizeType(entry.type);
  const content = asRecord(entry.content);
  return [
    type,
    getInstitutionName(content),
    getSubject(content),
    getRecipientEmail(content),
    getGeneratedContent(type, content),
  ].join("|");
}

function dedupeHistory(entries: HistoryEntry[]): HistoryEntry[] {
  const byKey = new Map<string, HistoryEntry>();

  for (const entry of entries) {
    const normalizedEntry = {
      ...entry,
      type: normalizeType(entry.type),
    };
    const key = getDuplicateKey(normalizedEntry);
    const existing = byKey.get(key);

    if (!existing || new Date(normalizedEntry.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byKey.set(key, normalizedEntry);
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    const deduped = dedupeHistory(parsed as HistoryEntry[]);
    if (deduped.length !== parsed.length) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(deduped));
    }
    return deduped;
  } catch {
    return [];
  }
}

export const saveHistory = (
  type: ActivityType,
  content: unknown
): HistoryEntry => {
  const existing = readHistory();
  const now = new Date().toISOString();
  const nextEntry: HistoryEntry = {
    id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
    type: normalizeType(type),
    content,
    createdAt: now,
  };
  const nextKey = getDuplicateKey(nextEntry);
  const duplicate = existing.find((entry) => getDuplicateKey(entry) === nextKey);

  const updated = duplicate
    ? [
        { ...duplicate, content, createdAt: now },
        ...existing.filter((entry) => entry.id !== duplicate.id),
      ]
    : [nextEntry, ...existing];

  localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(updated)
  );

  window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  return duplicate ? { ...duplicate, content, createdAt: now } : nextEntry;
};

export const getHistory = (): HistoryEntry[] => {
  return readHistory();
};
