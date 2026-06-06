"use client";
import { saveHistory } from "@/utils/history";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import {
  Sparkles,
  FileText,
  IndianRupee,
  Clock,
  Download,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useInstitution } from "@/app/context/InstitutionContext";
import { generateProposal } from "@/services/api";
import { ProposalData } from "@/types/lead";

export default function ProposalGeneratorPage() {
  const { currentInstitutionData } = useInstitution();

  // Input fields
  const [clientName, setClientName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [industry, setIndustry] = useState("Education");
  const [timeline, setTimeline] = useState("6 Weeks");
  const [budget, setBudget] = useState("INR 3L - INR 5L");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProposalData | null>(null);
  
  // Interaction states
  const [copied, setCopied] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Load from Global Context
  useEffect(() => {
    if (currentInstitutionData) {
      queueMicrotask(() => {
        setClientName(currentInstitutionData.institution_name || "");
        if (currentInstitutionData.pain_points && currentInstitutionData.pain_points.length > 0) {
          setRequirements(currentInstitutionData.pain_points.join(", "));
        }
      });
    }
  }, [currentInstitutionData]);

  const handleGenerate = async () => {
    if (!clientName.trim()) {
      setError("Please specify a Client Name.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiResult = await generateProposal(
        clientName,
        requirements,
        industry,
        timeline,
        budget,
        currentInstitutionData?.pain_points || [],
        currentInstitutionData?.recommended_approach || ""
      );
      if (apiResult.success && apiResult.data) {
  setResult(apiResult.data);

  saveHistory("proposal", {
    institution_name: clientName,
    requirements,
    industry,
    timeline,
    budget,
    proposal: apiResult.data,
  });
} else {
        setError(apiResult.error || "Failed to generate proposal");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyProposalToClipboard = () => {
    if (!result) return;
    const fullText = `
PROPOSAL FOR: ${result.client_name}
PROJECT TITLE: ${result.project_title}
INDUSTRY: ${result.industry}

1. EXECUTIVE SUMMARY:
${result.executive_summary}

2. PROPOSED MODULES:
${(result.proposed_modules || []).map((m: string) => `- ${m}`).join("\n")}

3. TIMELINE: ${result.timeline_weeks}
4. INVESTMENT ESTIMATE: ${result.price_range_inr}

5. NEXT STEPS:
${(result.next_steps || []).map((s: string, idx: number) => `${idx + 1}. ${s}`).join("\n")}
    `.trim();
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportProposal = () => {
    if (!result) return;
    setPdfSuccess(true);
    setTimeout(() => {
      setPdfSuccess(false);
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${result.client_name.replace(/\s+/g, "_")}_AI_Proposal.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1000);
  };
  const clearForm = () => {
  setClientName("");
  setRequirements("");
  setIndustry("Education");
  setTimeline("6 Weeks");
  setBudget("INR 3L - INR 5L");

  setResult(null);
  setError("");
  setCopied(false);
};
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-20">
      <Topbar title="Proposal Generator" subtitle="Draft tailored consulting agreements and Statement of Work (SOW) documents instantly" />

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-8">
        
        {/* TWO-COLUMN LAYOUT OR EMPTY STATE */}
        {!currentInstitutionData ? (
          <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
             <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
               <FileText className="w-8 h-8" />
             </div>
             <h3 className="text-[20px] font-extrabold text-slate-700">No Institution Selected</h3>
             <p className="text-[15px] font-medium text-slate-400 max-w-md">
               Search an institution first on the Lead Research page to generate a personalized SOW proposal.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: PROPOSAL INPUT FORMS */}
          <div className="lg:col-span-5 space-y-6">
            <div className="
              bg-white
              rounded-[24px]
              border
              border-slate-100
              shadow-sm
              p-6
              space-y-5
            ">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="text-lg">💼</span>
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  Configure SOW Proposal
                </h3>
              </div>

              {/* Client Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Client Name / Institution
                </label>
                <input
                  type="text"
                  placeholder="Enter institution name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="
                    w-full
                    h-11
                    rounded-xl
                    border
                    border-slate-200/80
                    px-4
                    text-[13.5px]
                    text-slate-800
                    outline-none
                    focus:border-[#6D5EF9]
                    transition-all
                  "
                />
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Project Requirement Brief
                </label>
                <textarea
                  placeholder="What operational pain points do they need automated? E.g., student spreadsheets tracking, attendance, banking fee ledgers..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="
                    w-full
                    h-28
                    p-4
                    rounded-xl
                    border
                    border-slate-200/80
                    text-[13.5px]
                    text-slate-800
                    outline-none
                    resize-none
                    focus:border-[#6D5EF9]
                    transition-all
                    leading-relaxed
                  "
                />
              </div>

              {/* Industry, Timeline, Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Industry Type
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-2
                      text-[13px]
                      text-slate-800
                      bg-white
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  >
                    <option value="Education">Education</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="SaaS">SaaS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Timeline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Weeks"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-800
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Budget Range
                  </label>
                  <input
                    type="text"
                  placeholder="e.g. INR 3L - INR 5L"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-800
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="
                  w-full
                  h-12
                  rounded-xl
                  bg-gradient-to-r
                  from-[#6D5EF9]
                  to-[#4F3EED]
                  hover:from-[#5C4DF7]
                  hover:to-[#3E2DDC]
                  text-white
                  font-bold
                  text-[13px]
                  shadow-md
                  shadow-violet-600/20
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-2
                  cursor-pointer
                  disabled:opacity-80
                "
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Proposal</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-[12px] font-medium">{error}</span>
                </div>
              )}
            </div>
              <button
  type="button"
  onClick={clearForm}
  className="
    w-full
    h-11
    rounded-xl
    border
    border-slate-200
    bg-white
    hover:bg-slate-50
    text-slate-600
    font-bold
    text-[13px]
    transition-all
  "
>
  Clear Form
</button>
            {/* Proposal Specs Banner */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[24px] p-5 space-y-3.5 text-slate-500 font-medium text-[12.5px]">
              <div className="flex items-center gap-2">
                <span className="w-4.5 h-4.5 rounded bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-600 font-bold">✓</span>
                <h4 className="font-extrabold text-slate-800 text-[13px]">KALNET SOW Core Rules:</h4>
              </div>
              <p className="leading-relaxed">
                All business proposals must explicitly represent KALNET&apos;s <strong className="text-slate-800">Plug In Not Replace</strong> integration philosophy, focusing heavily on Education + Hospitality verticals, with clear timelines and modular delivery frameworks.
              </p>
            </div>
          </div>

          {/* RIGHT: PREMIUM DOCUMENT CONTAINER */}
          <div className="lg:col-span-7">
            
            {/* Loading Skeleton */}
            {loading && (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6 animate-pulse">
                <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-slate-200 rounded-xl"></div>
                  <div className="h-16 bg-slate-200 rounded-xl"></div>
                </div>
                <div className="h-28 bg-slate-200 rounded-xl"></div>
              </div>
            )}

            {/* Consulting Document Output */}
            {result && !loading && (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* SOW Document Bar */}
                <div className="bg-[#FAFBFD] px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📄</span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Consulting Statement of Work</span>
                      <span className="text-[13.5px] font-extrabold text-slate-800 mt-1 block">SOW Agreement — KALNET AI</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 font-bold text-[10px] text-indigo-600">
                    <Sparkles className="w-3 h-3 text-indigo-500 animate-spin-slow" />
                    <span>AI Badge Verified</span>
                  </div>
                </div>

                {/* SOW CONTENT VIEW */}
                <div className="p-6 md:p-8 space-y-8 bg-slate-50/20 max-h-[640px] overflow-y-auto">
                  
                  {/* consulting SOW header block */}
                  <div className="
                    bg-gradient-to-br
                    from-[#060B1F]
                    via-[#0F173D]
                    to-[#1C255F]
                    rounded-2xl
                    p-6
                    text-white
                    shadow-md
                    relative
                    overflow-hidden
                  ">
                    <div className="absolute right-0 bottom-0 opacity-5 w-40 h-40 bg-white rounded-full blur-xl pointer-events-none"></div>
                    <span className="text-[#A297FF] font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Outreach SOW Plan
                    </span>
                    <h3 className="text-lg md:text-xl font-extrabold tracking-tight">
                      {result.project_title}
                    </h3>

                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10 text-slate-300 text-[12.5px] font-semibold">
                      <span className="flex items-center gap-1.5"><strong className="text-white">Client:</strong> {result.client_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5"><strong className="text-white">Vertical:</strong> {result.industry}</span>
                    </div>
                  </div>

                  {/* SOW 1. Executive Summary */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>01.</span> Executive Summary
                    </h4>
                    <div className="space-y-3">
                      {result.executive_summary.split(/\n{2,}/).map((para: string, idx: number) => (
                        <p
                          key={idx}
                          className="
                            bg-white
                            border
                            border-slate-200/60
                            rounded-xl
                            p-4
                            text-[13px]
                            leading-relaxed
                            text-slate-600
                            font-medium
                            shadow-sm
                          "
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* SOW 2. Proposed Modules */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>02.</span> Proposed Modules & Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {result.proposed_modules && result.proposed_modules.map((module: string, idx: number) => (
                        <div
                          key={idx}
                          className="
                            bg-white
                            border
                            border-slate-200/60
                            rounded-xl
                            p-4
                            flex
                            items-center
                            gap-3
                            shadow-sm
                            hover:border-[#6D5EF9]/40
                            transition-all
                          "
                        >
                          <div className="w-7 h-7 rounded bg-[#6D5EF9]/10 flex items-center justify-center text-[#6D5EF9] shrink-0 font-extrabold text-[11px]">
                            {idx + 1}
                          </div>
                          <span className="text-[12.5px] font-bold text-slate-700">
                            {module}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SOW 3. Delivery & Investment */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>03.</span> Project Timeline & Investment Estimate
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex items-center gap-4.5 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#6D5EF9] flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Duration Estimate
                          </p>
                          <h4 className="text-base font-extrabold text-slate-800 mt-1.5">
                            {result.timeline_weeks}
                          </h4>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex items-center gap-4.5 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            Price Estimate
                          </p>
                          <h4 className="text-base font-extrabold text-slate-800 mt-1.5">
                            {result.price_range_inr}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SOW 4. Next Steps */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
                    <h4 className="text-[13px] font-bold flex items-center gap-1.5 text-slate-200 uppercase tracking-wider">
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                      04. Engagement & Next Steps
                    </h4>
                    <div className="space-y-3">
                      {result.next_steps && result.next_steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-emerald-300 shrink-0 mt-0.5 shadow-inner">
                            {idx + 1}
                          </div>
                          <span className="text-[12.5px] text-slate-300 font-medium leading-relaxed">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* SOW Document Actions footer */}
                <div className="bg-[#FAFBFD] px-6 py-4.5 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={exportProposal}
                    disabled={pdfSuccess}
                    className="
                      px-4
                      py-2
                      rounded-lg
                      bg-slate-50
                      hover:bg-slate-100
                      text-slate-600
                      hover:text-slate-800
                      font-bold
                      text-[12.5px]
                      flex
                      items-center
                      gap-1.5
                      border
                      border-slate-200/40
                      transition-all
                      cursor-pointer
                    "
                  >
                    {pdfSuccess ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>
  {pdfSuccess ? "Exporting..." : "Export Proposal"}
</span>
                  </button>

                  <button
                    onClick={copyProposalToClipboard}
                    className="
                      px-4
                      py-2
                      rounded-lg
                      bg-[#6D5EF9]
                      hover:bg-[#4F3EED]
                      text-white
                      font-bold
                      text-[12.5px]
                      flex
                      items-center
                      gap-1.5
                      shadow-md
                      shadow-violet-600/10
                      transition-all
                      cursor-pointer
                    "
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied SOW!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/80" />
                        <span>Copy Proposal</span>
                      </>
                    )}
                    <button
  onClick={handleGenerate}
  className="
    px-4
    py-2
    rounded-lg
    bg-slate-100
    hover:bg-slate-200
    text-slate-700
    font-bold
    text-[12px]
  "
>
  Regenerate
</button>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
