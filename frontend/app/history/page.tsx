"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { ActivityType, getHistory, HISTORY_UPDATED_EVENT, HistoryEntry } from "@/utils/history";
import {
  History,
  Clock3,
  FileText,
  Mail,
  Search,
  Sparkles,
  Building2,
  MapPin,
  Users,
  Target,
  RotateCcw,
  Trash2,
} from "lucide-react";

type HistoryContent = Record<string, unknown>;
type HistoryFilter = "all" | ActivityType;

const FILTERS: Array<{ label: string; value: HistoryFilter }> = [
  { label: "All Activities", value: "all" },
  { label: "Research", value: "research" },
  { label: "Emails", value: "email" },
  { label: "Proposals", value: "proposal" },
];

function asRecord(value: unknown): HistoryContent {
  return value && typeof value === "object" ? value as HistoryContent : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => readString(item)).filter(Boolean)
    : [];
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function getInstitutionName(item: HistoryEntry): string {
  const content = asRecord(item.content);
  return readString(content.institution_name)
    || readString(content.name)
    || readString(content.client_name)
    || "Institution";
}

function getSummary(item: HistoryEntry): string {
  const content = asRecord(item.content);
  if (item.type === "research") {
    return readString(content.recommended_approach) || "Lead research completed successfully.";
  }

  if (item.type === "email") {
    return readString(content.body) || readString(content.subject) || "Personalized email generated successfully.";
  }

  if (item.type === "proposal") {
    const executiveSummary = readString(content.executive_summary) || readStringList(content.executive_summary).join(" ");
    return executiveSummary || readString(content.project_title) || "Proposal generated successfully.";
  }

  return "AI generated workflow activity";
}

function getDetails(item: HistoryEntry): Array<{ label: string; value: string }> {
  const content = asRecord(item.content);
  const contacts = Array.isArray(content.contacts) ? content.contacts : [];
  const contact = asRecord(contacts[0]);
  const details = [
    { label: "Location", value: readString(content.location) },
    { label: "Size", value: readString(content.student_size) || readString(content.institution_size) },
    { label: "Contact", value: readString(contact.name) || readString(content.contact_name) },
    { label: "Email", value: readString(contact.email) || readString(content.recipient_email) },
    { label: "Subject", value: readString(content.subject) },
  ];

  return details.filter((detail) => detail.value);
}

function getPainPoints(item: HistoryEntry): string[] {
  const content = asRecord(item.content);
  return readStringList(content.pain_points);
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const reuseItem = (item: HistoryEntry) => {
  localStorage.setItem(
    "selectedHistory",
    JSON.stringify(item.content)
  );

  alert("Record loaded  for reuse in workflow builder. Navigate to the workflow builder and click 'Load from History' to use this record as a template for your new workflow.");
};
    

  useEffect(() => {
    const refreshHistory = () => setHistory(getHistory());

    refreshHistory();
    window.addEventListener(HISTORY_UPDATED_EVENT, refreshHistory);
    window.addEventListener("storage", refreshHistory);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, refreshHistory);
      window.removeEventListener("storage", refreshHistory);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "research":
        return <Search className="w-6 h-6 text-violet-700" />;
      case "email":
        return <Mail className="w-6 h-6 text-blue-700" />;
      case "proposal":
        return <FileText className="w-6 h-6 text-emerald-700" />;
      default:
        return <History className="w-6 h-6 text-slate-700" />;
    }
  };

  const filteredHistory = activeFilter === "all"
    ? history
    : history.filter((item) => item.type === activeFilter);

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case "research":
        return "Research";
      case "email":
        return "Email";
      case "proposal":
        return "Proposal";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Topbar title="Activity History" />

      <div className="p-6 md:p-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 bg-orange-100 text-orange-700 px-5 py-3 rounded-2xl font-medium mb-6">
            <Sparkles className="w-5 h-5" />
            AI Workflow Activity Timeline
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Recent Activities
          </h1>

          <p className="text-slate-500 text-lg md:text-xl leading-8 max-w-4xl">
            Track AI-generated lead research, proposals, personalized outreach emails,
            and enterprise workflow operations.
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 md:p-8">
          <div className="flex flex-wrap gap-3 mb-8">
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`
                    h-11
                    px-4
                    rounded-xl
                    border
                    text-[13px]
                    font-bold
                    transition-all
                    cursor-pointer
                    ${selected
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                  `}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <History className="w-10 h-10 text-slate-400" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                No Activity Found
              </h2>

              <p className="text-slate-500 text-lg max-w-xl leading-8">
                {history.length === 0
                  ? "Your AI-generated research, proposals, and email activities will appear here."
                  : "No records match the selected activity filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredHistory.map((item) => {
                const details = getDetails(item);
                const painPoints = getPainPoints(item);
                const summary = getSummary(item);

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 rounded-[24px] p-5 md:p-7 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                          {getIcon(item.type)}
                        </div>

                        <div>
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                            {getActivityLabel(item.type)}
                          </p>
                          <h3 className="text-2xl font-bold text-slate-900">
                            {getInstitutionName(item)}
                          </h3>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-600 font-medium">
                        <Clock3 className="w-5 h-5" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    <p className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 text-sm leading-7 font-medium line-clamp-4">
                      {summary}
                    </p>

                    {details.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                        {details.map((detail) => (
                          <div key={detail.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                              {detail.label === "Location" && <MapPin className="w-4 h-4" />}
                              {detail.label === "Size" && <Users className="w-4 h-4" />}
                              {detail.label === "Contact" && <Building2 className="w-4 h-4" />}
                              {detail.label === "Email" && <Mail className="w-4 h-4" />}
                              {detail.label === "Subject" && <Target className="w-4 h-4" />}
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                {detail.label}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 break-words">
                              {detail.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {painPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {painPoints.map((point) => (
                          <span
                            key={point}
                            className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-full text-[12px] font-bold"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
