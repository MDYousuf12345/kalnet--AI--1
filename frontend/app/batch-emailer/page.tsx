"use client";
import {
  sendBatchEmails,
  sendEmail,
} from "@/services/api";
import { getHistory } from "@/utils/history";
import { saveHistory } from "@/utils/history";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import {
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Eye,
  X,
  Sparkles,
  Layers,
  Database,
} from "lucide-react";
import { Ai2Lead, fetchAi2Leads, generateBatchEmails } from "@/services/api";

type BatchLeadStatus = "Imported" | "Ready" | "Generating" | "Sent" | "Failed";

type BatchLead = {
  id: number;
  name: string;
  size: string;
  location: string;
  painPoints: string[];
  status: BatchLeadStatus;
  progress: number;
  email: string;
  subject: string;
  error: string | null;
  contactName: string;
  contactRole: string;
  recipientEmail: string;
  selected: boolean;
};

export default function BatchEmailerPage() {
  const [leads, setLeads] = useState<BatchLead[]>([]);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<BatchLead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [queueError, setQueueError] = useState("");

  // Statistics
  const totalLeads = leads.length;
  const emailsSent = leads.filter(l => l.status === "Sent").length;
  const emailsPending = leads.filter(l => l.status === "Ready" || l.status === "Imported").length;
  const emailsFailed = leads.filter(l => l.status === "Failed").length;
  const estimatedCompletion = sending ? `${Math.ceil((leads.filter(l => l.status === "Ready").length * 1.5))} seconds` : "0 seconds";
  const history = getHistory();
  const handleFetchAi2Leads = async () => {
    setUploading(true);
    setQueueError("");
    try {
      const result = await fetchAi2Leads();
      if (!result.success) {
        setQueueError(result.error || "Unable to fetch AI-2 leads.");
      }
      const imported = (result.data.leads || []).map((record: Ai2Lead, index: number) => {
        const district = record.district || "";
        const state = record.state || "";
        const location = [district, state, record.country].filter(Boolean).join(", ") || "Location to be verified";
        const size = record.student_count
          ? `${record.company_size_category || "Medium"}-sized institution with ${record.student_count} students`
          : record.company_size_category
            ? `${record.company_size_category}-sized institution`
            : "Institution size to be verified";
        return {
          id: Date.now() + index,
          name: record.name || record.institution_name || "Institution",
          size,
          location,
          painPoints: [],
          status: "Imported" as BatchLeadStatus,
          progress: 0,
          email: "",
          subject: "",
          error: null,
          contactName: record.principal_name || "Admissions Team",
          contactRole: "Principal",
          recipientEmail: record.email || "",
          selected: false,
        };
      });
     
      setLeads(imported);
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : "AI-2 import failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (leads.length === 0) return;
    setGenerating(true);
    setQueueError("");
    setLeads(prev => prev.map(lead => ({ ...lead, status: "Generating", progress: 25, error: null })));

    const result = await generateBatchEmails(
      leads.map((lead) => ({
        institution_name: lead.name,
        contact_name: lead.contactName,
        contact_role: lead.contactRole,
        pain_points: lead.painPoints,
        tone: "Professional",
      }))
    );

    setLeads(prev => prev.map((lead, index) => {
      const item = result.data.results[index];
      if (result.success && item?.success) {
        return {
          ...lead,
          status: "Ready",
          progress: 100,
          subject: item.data.subject,
          email: item.data.body,
          error: null,
        };
      }
      return {
        ...lead,
        status: "Failed",
        progress: 100,
        error: item?.error || result.error || "Email generation failed",
      };
    }));
    setGenerating(false);
  };

  const handleSendBatch = async () => {

  setSending(true);

  const selectedReadyLeads = leads.filter(
    lead =>
      selectedLeads.includes(lead.id) &&
      lead.status === "Ready"
  );

  if (selectedReadyLeads.length === 0) {
    alert("Please select at least one Ready lead.");
    setSending(false);
    return;
  }

  for (const lead of selectedReadyLeads) {

    const result = await sendEmail(
      lead.recipientEmail,
      lead.subject,
      lead.email
    );

    if (result.success) {

      setLeads(prev =>
        prev.map(l =>
          l.id === lead.id
            ? { ...l, status: "Sent" }
            : l
        )
      );

    } else {

      setLeads(prev =>
        prev.map(l =>
          l.id === lead.id
            ? {
                ...l,
                status: "Failed",
                error: result.error || "Send failed"
              }
            : l
        )
      );

    }

  }

  setSending(false);
};


  const handleRetryFailed = () => {
    setLeads(prev => 
      prev.map(l => l.status === "Failed" ? { ...l, status: "Imported", error: null, progress: 0 } : l)
    );
  };
  const toggleLeadSelection = (id: number) => {
  setSelectedLeads(prev =>
    prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
  );
};
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-20">
      <Topbar title="Batch Emailer" subtitle="Launch bulk cold outreach campaigns and track automated AI queue dispatches" />

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-8">

        {/* ENTERPRISE SUCCESS METRICS HUB */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6D5EF9] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Total Emails</span>
              <h4 className="text-xl font-extrabold text-slate-800 mt-1">{totalLeads}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Sent</span>
              <h4 className="text-xl font-extrabold text-slate-800 mt-1">{emailsSent}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Pending In Queue</span>
              <h4 className="text-xl font-extrabold text-slate-800 mt-1">{emailsPending}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Failed</span>
              <h4 className="text-xl font-extrabold text-[#C81E3D] mt-1">{emailsFailed}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Est. Completion</span>
              <h4 className="text-sm font-extrabold text-slate-800 mt-1.5">{estimatedCompletion}</h4>
            </div>
          </div>
        </div>

        {/* PROCESS CONTROLS HUB */}
        <div className="
          bg-white
          rounded-[24px]
          border
          border-slate-100
          shadow-sm
          p-6
          flex
          flex-col
          md:flex-row
          items-center
          justify-between
          gap-6
        ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6D5EF9] flex items-center justify-center text-lg font-bold">
              🛠️
            </div>
            <div>
              <h3 className="text-[14.5px] font-extrabold text-slate-800">Outreach Queue Dashboard</h3>
              <p className="text-[12px] text-slate-400 font-medium">Fetch institution records from AI-2, run LLM Personalizer triggers, and stream cold outreach campaigns.</p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0 flex-wrap">
            {/* Fetch AI-2 Leads */}
            <button
              onClick={handleFetchAi2Leads}
              disabled={uploading || sending || generating}
              className="
                px-4
                py-2.5
                rounded-xl
                bg-slate-50
                hover:bg-slate-100
                border
                border-slate-200
                text-slate-700
                font-bold
                text-[12.5px]
                flex
                items-center
                gap-1.5
                transition-all
                cursor-pointer
                disabled:opacity-50
              "
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Upload className="w-4 h-4 text-slate-500" />
              )}
              <span>Fetch AI-2 Leads</span>
            </button>

            {/* Generate Emails */}
            <button
              onClick={handleGenerateBatch}
              disabled={generating || sending}
              className="
                px-4
                py-2.5
                rounded-xl
                bg-gradient-to-r
                from-[#6D5EF9]
                to-[#4F3EED]
                hover:from-[#5C4DF7]
                hover:to-[#3E2DDC]
                text-white
                font-bold
                text-[12.5px]
                flex
                items-center
                gap-1.5
                shadow-md
                shadow-violet-600/15
                transition-all
                cursor-pointer
                disabled:opacity-50
              "
            >
              {generating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI Personalize Batch</span>
            </button>

            {/* Send Batch */}
            <button
              onClick={handleSendBatch}
              disabled={sending || generating || leads.filter(l => l.status === "Ready").length === 0}
              className="
                px-4
                py-2.5
                rounded-xl
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                font-bold
                text-[12.5px]
                flex
                items-center
                gap-1.5
                shadow-md
                shadow-emerald-600/15
                transition-all
                cursor-pointer
                disabled:opacity-50
              "
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>
  Send Selected
  ({selectedLeads.length})
</span>
            </button>
          </div>
        </div>
<button
  onClick={() => {

    const blob =
      new Blob(
        [
          JSON.stringify(
            leads,
            null,
            2
          )
        ],
        {
          type:
          "application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      "campaign.json";

    a.click();
  }}
  className="
    px-4
    py-2.5
    rounded-xl
    bg-slate-100
    hover:bg-slate-200
    text-slate-700
    font-bold
    text-[12px]
  "
>
  Export Campaign
</button>
        {queueError && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 flex items-center gap-2 text-[12.5px] font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{queueError}</span>
          </div>
        )}

        {/* PROGRESS DISPLAY */}
        {sending && (
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-3.5 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center text-[12.5px] font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Streaming dispatches to school administration nodes...
              </span>
              <span>{overallProgress}% Complete</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${overallProgress}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              ></div>
            </div>
          </div>
        )}
        {leads.length > 0 && (
<div className="
bg-white
rounded-2xl
border
border-slate-100
shadow-sm
p-6
">
  <h3 className="
  text-lg
  font-bold
  text-slate-800
  mb-4
  ">
    Campaign Summary
  </h3>

  <div className="
  grid
  grid-cols-4
  gap-4
  ">
    <div>
      <p className="text-slate-400 text-xs">
        Imported
      </p>
      <p className="font-bold text-xl">
        {totalLeads}
      </p>
    </div>

    <div>
      <p className="text-slate-400 text-xs">
        Ready
      </p>
      <p className="font-bold text-blue-600 text-xl">
        {
          leads.filter(
            l => l.status === "Ready"
          ).length
        }
      </p>
    </div>

    <div>
      <p className="text-slate-400 text-xs">
        Sent
      </p>
      <p className="font-bold text-emerald-600 text-xl">
        {emailsSent}
      </p>
    </div>

    <div>
      <p className="text-slate-400 text-xs">
        Failed
      </p>
      <p className="font-bold text-red-600 text-xl">
        {emailsFailed}
      </p>
    </div>
  </div>
</div>
)}
        {/* MAIN WORKSPACE: LEADS AND QUEUE DRAWER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Leads table */}
          <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-4.5 px-5">Lead / Organization</th>
                    <th className="py-4.5 px-5">Location</th>
                    <th className="py-4.5 px-5">Pain Points Detected</th>
                    <th className="py-4.5 px-5">Status</th>
                    <th className="py-4.5 px-5 text-center">AI Review</th>
                    <th className="py-4 px-4">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="w-4 h-4"
                      />
                    </td>
                      <td className="py-4 px-5">
                        <h4 className="font-extrabold text-slate-800 leading-snug">{lead.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 block">{lead.size}</span>
                      </td>

                      <td className="py-4 px-5 text-slate-500 font-semibold">
                        {lead.location}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {lead.painPoints.map((p: string, idx: number) => (
                            <span
                              key={idx}
                              className="
                                px-2.5
                                py-0.5
                                rounded-full
                                bg-red-50/70
                                text-[#C81E3D]
                                text-[10px]
                                font-bold
                                border
                                border-red-100/50
                              "
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {lead.status === "Imported" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                            Imported
                          </span>
                        )}
                        {lead.status === "Generating" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold">
                            Generating
                          </span>
                        )}
                        {lead.status === "Ready" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                            AI Ready
                          </span>
                        )}
                        {lead.status === "Sent" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold">
                            Sent
                          </span>
                        )}
                        {lead.status === "Failed" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 text-[11px] font-bold">
                            Failed
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-center">
                        {lead.status === "Imported" || lead.status === "Generating" ? (
                          <span className="text-[11px] text-slate-400 italic">Unprocessed</span>
                        ) : (
                          <button
                            onClick={() => setSelectedEmail(lead)}
                            className="
                              p-1.5
                              rounded-lg
                              bg-slate-50
                              hover:bg-slate-100
                              text-[#6D5EF9]
                              border
                              border-slate-200/50
                              transition-all
                              cursor-pointer
                              inline-flex
                              items-center
                              justify-center
                            "
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: SEND QUEUE & FAILED LEADS DIAGNOSTICS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* FAILED LEADS CONTAINER */}
            {leads.filter(l => l.status === "Failed").length > 0 && (
              <div className="bg-red-50/50 border border-red-100 rounded-[24px] p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-red-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h3 className="text-[13.5px] font-extrabold text-[#C81E3D] uppercase tracking-wider">
                      Failed Dispatches
                    </h3>
                  </div>
                  
                  {/* Retry Button */}
                  <button
                    onClick={handleRetryFailed}
                    className="
                      px-3
                      py-1.5
                      rounded-lg
                      bg-[#C81E3D]
                      hover:bg-[#AC1A34]
                      text-white
                      font-bold
                      text-[10px]
                      uppercase
                      tracking-wider
                      transition-all
                      cursor-pointer
                    "
                  >
                    Retry Leads
                  </button>
                </div>

                <div className="space-y-3">
                  {leads.filter(l => l.status === "Failed").map((fLead) => (
                    <div key={fLead.id} className="bg-white p-3.5 rounded-xl border border-red-100 shadow-sm space-y-1">
                      <span className="font-extrabold text-[12.5px] text-slate-800 block">{fLead.name}</span>
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        {fLead.error}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEND QUEUE MONITOR UI */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-lg">📋</span>
                <h3 className="text-[14px] font-extrabold text-slate-800">
                  SMTP Dispatch Queue
                </h3>
              </div>

              <div className="space-y-3.5">
                {leads.filter(l => l.status === "Ready").length > 0 ? (
                  leads.filter(l => l.status === "Ready").map((qLead, idx) => (
                    <div key={qLead.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/20 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#6D5EF9] font-extrabold text-[9.5px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-slate-800 truncate">{qLead.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">
                        Pending offset
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-[12px] font-medium bg-slate-50/30 border border-slate-100 rounded-xl">
                    <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No dispatches pending in the outgoing queue.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL EMAIL CAMPAIGN PREVIEW */}
      {selectedEmail && (
        <div className="
          fixed
          inset-0
          z-50
          bg-slate-900/60
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
          animate-in
          fade-in
        ">
          <div className="
            bg-white
            rounded-[24px]
            border
            border-slate-100
            shadow-2xl
            w-full
            max-w-xl
            overflow-hidden
            flex
            flex-col
            animate-in
            zoom-in-95
          ">
            {/* Modal Header */}
            <div className="bg-[#FAFBFD] px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📧</span>
                <span className="text-[13.5px] font-extrabold text-slate-800">Generated Email Preview</span>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient School</span>
                <h4 className="text-[14.5px] font-extrabold text-slate-800">{selectedEmail.name}</h4>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Generated Body</span>
                <div className="
                  bg-slate-50
                  border
                  border-slate-200/60
                  rounded-xl
                  p-5
                  text-[13px]
                  leading-relaxed
                  text-slate-700
                  font-medium
                  whitespace-pre-wrap
                  max-h-[260px]
                  overflow-y-auto
                ">
                  {selectedEmail.email || "Email draft is still processing."}
                </div>
              </div>
            </div>
        
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-[#FAFBFD] flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="
                  px-4
                  py-2
                  rounded-xl
                  bg-[#6D5EF9]
                  hover:bg-[#4F3EED]
                  text-white
                  font-bold
                  text-[12.5px]
                  transition-all
                  cursor-pointer
                "
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
