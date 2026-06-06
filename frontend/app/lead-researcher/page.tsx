"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import {
  Sparkles,
  Search,
  Building2,
  MapPin,
  Users,
  PhoneCall,
  AlertTriangle,
  Target,
  Lightbulb,
  Loader2,
  Mail,
  FileText,
  X,
  Copy,
  Check,
  Send
} from "lucide-react";
import { researchLead, generateEmail, generateProposal, type EmailData, type ProposalData } from "@/services/api";
import { useInstitution } from "@/app/context/InstitutionContext";
import { transformInstitutionData } from "@/services/transformInstitutionData";
import { saveHistory } from "@/utils/history";

type LeadResearchCardData = {
  name: string;
  nameLines: string[];
  locationLines: string[];
  sizeLines: string[];
  contactLines: string[];
  contact: ContactLike;
  website: string;
  pain_points: string[];
  recommended_approach: string;
  footer_badge: string;
  confidence_score: number;
};

type ContactLike = {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function LeadResearcherPage() {
  const { setCurrentInstitutionData } = useInstitution();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<LeadResearchCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Action buttons dynamic states
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<EmailData | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<ProposalData | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [emailClientOpened, setEmailClientOpened] = useState(false);

  // Helper parsers to structure response variables into premium UI line breaks
  const splitName = (name: string) => {
    const words = name.split(" ");
    if (words.length <= 1) return [name, ""];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  };

  const splitLocation = (location: string) => {
    if (!location) return ["Location to be verified", ""];
    if (location.includes(",")) {
      const [city, ...rest] = location.split(",");
      return [`${city.trim()},`, rest.join(",").trim()];
    }
    return [location, ""];
  };

  const splitSize = (size: string) => {
    if (!size) return ["Institution size", "to be verified"];
    if (size.includes(" with ")) {
      const idx = size.indexOf(" with ");
      return [size.slice(0, idx).trim(), size.slice(idx + 1).trim()];
    }
    if (size.includes("(")) {
      const idx = size.indexOf("(");
      return [size.slice(0, idx).trim(), size.slice(idx)];
    }
    return [size, ""];
  };

  const splitContact = (contacts: unknown) => {
    if (Array.isArray(contacts) && contacts.length > 0) {
      const contact = contacts[0] as ContactLike;
      return [
        contact.name || "Admissions Team",
        contact.email || "",
        contact.phone || ""
      ];
    }
    return ["Admissions Team", "", ""];
  };

  const firstContact = (contacts: unknown): ContactLike => {
    if (Array.isArray(contacts) && contacts.length > 0) {
      return contacts[0] as ContactLike;
    }
    return { name: "Admissions Team", role: "Decision Maker", email: "", phone: "" };
  };

  // Perform research calling the backend API
  const handleGenerateResearch = async (searchQuery?: string) => {
    const targetQuery = searchQuery !== undefined ? searchQuery : query;
    if (!targetQuery.trim()) {
      setError("Please enter an institution to analyze.");
      return;
    }

    setError("");
    setLoading(true);
    setData(null); // Dynamic UI feedback: clear old data immediately
    setCurrentInstitutionData(null); // Clear global state immediately
    setGeneratedEmail(null);
    setGeneratedProposal(null);

    try {
      const result = await researchLead({ institution_name: targetQuery });
      
      if (result.success && result.data) {
        const transformedData = transformInstitutionData(result.data);

        setData({
          name: transformedData.institution_name,
          nameLines: splitName(transformedData.institution_name),
          locationLines: splitLocation(transformedData.location),
          sizeLines: splitSize(transformedData.student_size),
          contactLines: splitContact(transformedData.contacts),
          contact: firstContact(transformedData.contacts),
          website: transformedData.website,
          pain_points: transformedData.pain_points,
          recommended_approach: transformedData.recommended_approach,
          footer_badge: "Focus on digital transformation, workflow automation, and data-driven decision making.",
          confidence_score: transformedData.confidence_score
        });

        setCurrentInstitutionData(transformedData);

        // Set default local storage for cross-page navigation (legacy fallback)
        localStorage.setItem("kalnet_lead_data", JSON.stringify(transformedData));
        saveHistory("research", {
          ...transformedData,
          search_query: targetQuery.trim()
        });
      } else {
        setError(result.error || "Failed to fetch AI insights. Please try again.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Connection failed. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger Email Personaliser Agent
  const handleGenerateEmail = async () => {
    if (!data) return;

    setError("");
    setGeneratingEmail(true);
    setGeneratedEmail(null);
    setEmailClientOpened(false);

    try {
      const result = await generateEmail(
        data.name,
        data.contact.name || "Admissions Team",
        data.contact.role || "Decision Maker",
        data.pain_points,
        "Professional"
      );

      if (result.success && result.data) {
        setGeneratedEmail(result.data);
        setEmailModalOpen(true);
        
        // Sync in local storage
        const currentLocal = JSON.parse(localStorage.getItem("kalnet_lead_data") || "{}");
        localStorage.setItem("kalnet_lead_data", JSON.stringify({
          ...currentLocal,
          generated_email: result.data
        }));
        saveHistory("email", {
          institution_name: data.name,
          recipient_email: data.contact.email || "",
          contact_name: data.contact.name || "Admissions Team",
          contact_role: data.contact.role || "Decision Maker",
          pain_points: data.pain_points,
          subject: result.data.subject,
          body: result.data.body
        });
      } else {
        setError(result.error || "Email generation agent returned an error.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "An unexpected error occurred during email creation.");
    } finally {
      setGeneratingEmail(false);
    }
  };

  // Trigger Proposal SOW Generator Agent
  const handleGenerateProposal = async () => {
    if (!data) return;

    setError("");
    setGeneratingProposal(true);
    setGeneratedProposal(null);

    try {
      const result = await generateProposal(
        data.name,
        data.pain_points.join(", "),
        "Education",
        "6 Weeks",
        "INR 3L - INR 5L"
      );

      if (result.success && result.data) {
        setGeneratedProposal(result.data);
        setProposalModalOpen(true);

        // Sync in local storage
        const currentLocal = JSON.parse(localStorage.getItem("kalnet_lead_data") || "{}");
        localStorage.setItem("kalnet_lead_data", JSON.stringify({
          ...currentLocal,
          generated_proposal: result.data
        }));
        saveHistory("proposal", {
          institution_name: data.name,
          pain_points: data.pain_points,
          ...result.data
        });
      } else {
        setError(result.error || "Proposal SOW generation agent failed.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "An unexpected error occurred during proposal formulation.");
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleSendEmail = (email: EmailData) => {
    const recipient = (data?.contact.email || "").trim();
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

    window.location.href = mailtoUrl;
    setEmailClientOpened(true);
    setTimeout(() => setEmailClientOpened(false), 3000);
  };

  // Startup effects removed to keep the initial state empty as requested

  return (
    <div className="min-h-screen bg-[#F8F9FC] pb-24">
      {/* Top Navbar */}
      <Topbar
        title="Lead Researcher"
        subtitle="Discover insights about your leads to personalize outreach"
      />

      <div className="px-10 py-9 max-w-7xl mx-auto space-y-9 fade-in">
        
        {/* HERO SECTION */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAE8FF] text-[#6D5EF9] text-[12px] font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-[#6D5EF9]" />
            <span>AI Powered Institution Intelligence</span>
          </div>

          <h2 className="text-[44px] font-extrabold text-[#060814] tracking-tight leading-none">
            Lead Research Agent
          </h2>

          <p className="text-[#64748B] text-[16px] font-medium max-w-3xl leading-relaxed">
            Analyze educational institutions, discover operational pain points, and generate intelligent outreach insights automatically using AI.
          </p>
        </div>

        {/* SEARCH BOX SECTION */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4.5">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Input Wrapper */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search institution..."
                className="
                  w-full
                  h-14
                  pl-12
                  pr-4
                  bg-[#F8F9FD]
                  border
                  border-slate-200/50
                  rounded-2xl
                  text-[16px]
                  text-slate-800
                  font-semibold
                  outline-none
                  focus:bg-white
                  focus:border-[#6D5EF9]
                  transition-all
                "
              />
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Button 1: Generate Research */}
              <button
                onClick={() => handleGenerateResearch()}
                disabled={loading || generatingEmail || generatingProposal}
                className="
                  h-14
                  px-6
                  rounded-2xl
                  bg-gradient-to-r
                  from-[#6D5EF9]
                  to-[#5849E8]
                  hover:from-[#5849E8]
                  hover:to-[#4536D4]
                  text-white
                  font-bold
                  text-[14.5px]
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  shadow-lg
                  shadow-violet-600/20
                  transition-all
                  cursor-pointer
                  disabled:opacity-80
                  shrink-0
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Research...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>Generate Research</span>
                  </>
                )}
              </button>

              {/* Button 2: Generate Email */}
              <button
                onClick={handleGenerateEmail}
                disabled={loading || generatingEmail || generatingProposal || !data}
                className="
                  h-14
                  px-6
                  rounded-2xl
                  bg-white
                  border
                  border-slate-200/60
                  hover:bg-slate-50
                  hover:border-slate-350
                  text-slate-700
                  font-bold
                  text-[14.5px]
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  transition-all
                  cursor-pointer
                  shadow-sm
                  shrink-0
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {generatingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    <span>Generating Email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4.5 h-4.5 text-slate-500" />
                    <span>Generate Email</span>
                  </>
                )}
              </button>

              {/* Button 3: Generate Proposal */}
              <button
                onClick={handleGenerateProposal}
                disabled={loading || generatingEmail || generatingProposal || !data}
                className="
                  h-14
                  px-6
                  rounded-2xl
                  bg-white
                  border
                  border-slate-200/60
                  hover:bg-slate-50
                  hover:border-slate-350
                  text-slate-700
                  font-bold
                  text-[14.5px]
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  transition-all
                  cursor-pointer
                  shadow-sm
                  shrink-0
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {generatingProposal ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    <span>Generating Proposal...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4.5 h-4.5 text-slate-500" />
                    <span>Generate Proposal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[13px] font-bold mt-2 ml-2">
              {error}
            </p>
          )}
        </div>

        {/* LOADING OR RESULT BLOCKS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 h-48 flex flex-col justify-between">
                <div className="w-11 h-11 bg-slate-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !data ? (
          <div className="space-y-9 fade-in">
            {/* EMPTY STATE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Institution Empty State */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 flex flex-col justify-between h-48">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
                    <Building2 className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12.5px] font-bold text-slate-300 uppercase tracking-wider block mb-0.5">
                      Institution
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400 block leading-tight">
                      Awaiting research...
                    </span>
                  </div>
                </div>
              </div>
              {/* Location Empty State */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 flex flex-col justify-between h-48">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
                    <MapPin className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12.5px] font-bold text-slate-300 uppercase tracking-wider block mb-0.5">
                      Location
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400 block leading-tight">
                      Awaiting research...
                    </span>
                  </div>
                </div>
              </div>
              {/* Size Empty State */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 flex flex-col justify-between h-48">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
                    <Users className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12.5px] font-bold text-slate-300 uppercase tracking-wider block mb-0.5">
                      Institution Size
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400 block leading-tight">
                      Awaiting research...
                    </span>
                  </div>
                </div>
              </div>
              {/* Contact Empty State */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 flex flex-col justify-between h-48">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
                    <PhoneCall className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12.5px] font-bold text-slate-300 uppercase tracking-wider block mb-0.5">
                      Contact
                    </span>
                    <span className="text-[14px] font-semibold text-slate-400 block leading-tight">
                      Awaiting research...
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER DETAIL EMPTY STATE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Pain Points Empty */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 md:p-8 flex flex-col gap-6">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight leading-tight opacity-50">
                      Pain Points
                    </h3>
                    <p className="text-[#94A3B8] text-[13px] font-semibold mt-0.5">
                      Key operational challenges identified
                    </p>
                  </div>
                </div>
                <div className="space-y-3.5 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-dashed border-slate-200 rounded-[18px] py-4 px-5 flex items-center gap-4">
                      <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0"></span>
                      <span className="text-[14px] font-semibold text-slate-400 leading-relaxed">
                        Search institution to analyze pain points...
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Approach Empty */}
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-7 md:p-8 flex flex-col justify-between gap-6">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center shrink-0">
                    <Target className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight leading-tight opacity-50">
                      Recommended Approach
                    </h3>
                    <p className="text-[#94A3B8] text-[13px] font-semibold mt-0.5">
                      AI generated outreach strategy
                    </p>
                  </div>
                </div>
                <div className="border border-dashed border-slate-200 rounded-[20px] p-6 flex-1 flex flex-col items-center justify-center text-center gap-4 bg-slate-50/50 min-h-[160px]">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#6D5EF9]/10 animate-ping"></div>
                    <div className="relative w-12 h-12 rounded-full bg-[#EAE8FF] text-[#6D5EF9] flex items-center justify-center">
                      <Sparkles className="w-5.5 h-5.5 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-[15px] font-bold text-slate-700">AI Waiting State</h4>
                    <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                      Search an institution to generate AI-powered research insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          data && (
            <div className="space-y-9 fade-in">
              {/* RESULT CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* CARD 1: Institution */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#F0EFFF] text-[#6D5EF9] flex items-center justify-center mb-6">
                      <Building2 className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[12.5px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                        Institution
                      </span>
                      <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                        {data.nameLines[0]}
                      </span>
                      {data.nameLines[1] && (
                        <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                          {data.nameLines[1]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 2: Location */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-6">
                      <MapPin className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[12.5px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                        Location
                      </span>
                      <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                        {data.locationLines[0]}
                      </span>
                      {data.locationLines[1] && (
                        <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                          {data.locationLines[1]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 3: Institution Size */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mb-6">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[12.5px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                        Institution Size
                      </span>
                      <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                        {data.sizeLines[0]}
                      </span>
                      {data.sizeLines[1] && (
                        <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                          {data.sizeLines[1]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 4: Contact */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center mb-6">
                      <PhoneCall className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[12.5px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-0.5">
                        Contact
                      </span>
                      <span className="text-[18px] font-extrabold text-[#0F172A] block leading-tight">
                        {data.contactLines[0]}
                      </span>
                      {data.contactLines[1] && (
                        <span className="text-[15px] font-extrabold text-[#0F172A] block leading-tight">
                          {data.contactLines[1]}
                        </span>
                      )}
                      {data.contactLines[2] && (
                        <span className="text-[13px] font-bold text-slate-500 block leading-tight mt-1">
                          {data.contactLines[2]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* LOWER DETAIL SECTION: PAIN POINTS & RECOMMENDED APPROACH */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* PAIN POINTS CARD */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 md:p-8 flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#FFEBEB] text-[#FF453A] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                        Pain Points
                      </h3>
                      <p className="text-[#94A3B8] text-[13px] font-semibold mt-0.5">
                        Key operational challenges identified
                      </p>
                    </div>
                  </div>

                  {/* List of Soft Red Rows */}
                  <div className="space-y-3.5 flex-1">
                    {data.pain_points.map((point: string, index: number) => (
                      <div
                        key={index}
                        className="
                          bg-[#FFF5F5]
                          border
                          border-[#FFE3E3]
                          rounded-[18px]
                          py-4
                          px-5
                          flex
                          items-center
                          gap-4
                          transition-all
                          hover:scale-[1.005]
                        "
                      >
                        <span className="w-2 h-2 rounded-full bg-[#FF453A] shrink-0"></span>
                        <span className="text-[14px] font-semibold text-[#822B3B] leading-relaxed">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECOMMENDED APPROACH CARD */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7 md:p-8 flex flex-col justify-between gap-6">
                  {/* Header */}
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F7ED] text-[#10B981] flex items-center justify-center shrink-0">
                      <Target className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                        Recommended Approach
                      </h3>
                      <p className="text-[#94A3B8] text-[13px] font-semibold mt-0.5">
                        AI generated outreach strategy
                      </p>
                    </div>
                  </div>

                  {/* Recommended Text Container */}
                  <div className="
                    bg-[#F2FBF7]
                    border
                    border-[#DFECE5]
                    rounded-[20px]
                    p-6
                    flex-1
                    flex
                    items-center
                    transition-all
                    hover:scale-[1.005]
                  ">
                    <p className="text-[14px] font-semibold text-[#255C47] leading-relaxed">
                      {data.recommended_approach}
                    </p>
                  </div>

                  {/* Green Footer Badge */}
                  <div className="
                    w-full
                    bg-[#EBF9F2]
                    border
                    border-[#D5EFE1]
                    py-3.5
                    px-4.5
                    rounded-xl
                    flex
                    items-center
                    gap-3
                    text-[#10B981]
                  ">
                    <Lightbulb className="w-5 h-5 shrink-0 fill-[#10B981] text-white" />
                    <span className="text-[12.5px] font-bold text-[#1F543F] leading-tight">
                      {data.footer_badge}
                    </span>
                  </div>

                </div>

              </div>
            </div>
          )
        )}

      </div>

      {/* EMAIL OUTCOME MODAL */}
      {emailModalOpen && generatedEmail && (
        <div className="fixed inset-0 z-100 bg-[#060814]/65 backdrop-blur-md flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-2xl rounded-[24px] border border-slate-100 shadow-2xl p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBF5FF] text-[#1D4ED8] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 leading-tight">
                    Outreach Email Draft
                  </h3>
                  <p className="text-[12px] font-semibold text-slate-400">
                    AI Personaliser Agent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer animate-pulse"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Email Fields */}
            <div className="space-y-4 text-left">
              {/* Subject Row */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/40">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Subject Line
                </span>
                <span className="text-[14.5px] font-bold text-slate-800">
                  {generatedEmail.subject}
                </span>
              </div>

              {/* Body Text Box */}
              <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-200/40 max-h-[300px] overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Message Body
                </span>
                <p className="text-[14px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {generatedEmail.body}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            {emailClientOpened && (
              <p className="text-[12px] font-bold text-emerald-600 -mt-1">
                Opening your email client with the generated draft.
              </p>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
                  );
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="
                  px-5
                  h-11
                  rounded-xl
                  bg-[#6D5EF9]
                  hover:bg-[#5849E8]
                  text-white
                  font-bold
                  text-[13.5px]
                  flex
                  items-center
                  gap-2
                  transition-all
                  cursor-pointer
                  shadow-md
                  shadow-violet-600/15
                "
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Draft</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleSendEmail(generatedEmail)}
                disabled={!generatedEmail.subject || !generatedEmail.body}
                className="
                  px-5
                  h-11
                  rounded-xl
                  bg-emerald-600
                  hover:bg-emerald-700
                  text-white
                  font-bold
                  text-[13.5px]
                  flex
                  items-center
                  justify-center
                  gap-2
                  transition-all
                  cursor-pointer
                  shadow-md
                  shadow-emerald-600/15
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <Send className="w-4 h-4" />
                <span>Send Email</span>
              </button>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="
                  px-5
                  h-11
                  rounded-xl
                  bg-white
                  border
                  border-slate-200
                  hover:bg-slate-50
                  text-slate-600
                  font-bold
                  text-[13.5px]
                  transition-colors
                  cursor-pointer
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSAL OUTCOME MODAL */}
      {proposalModalOpen && generatedProposal && (
        <div className="fixed inset-0 z-100 bg-[#060814]/65 backdrop-blur-md flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-3xl rounded-[24px] border border-slate-100 shadow-2xl p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EAFDF3] text-[#10B981] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 leading-tight">
                    Statement of Work Proposal
                  </h3>
                  <p className="text-[12px] font-semibold text-slate-400">
                    AI Proposal Generator Agent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProposalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Proposal Fields */}
            <div className="space-y-4 text-left overflow-y-auto max-h-[380px] pr-1">
              {/* Project Title */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/40">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Project Title
                </span>
                <span className="text-[16px] font-extrabold text-[#6D5EF9] block">
                  {generatedProposal.project_title || `${data?.name} Digital Integration`}
                </span>
                <p className="text-[13px] text-slate-500 font-semibold mt-1">
                  Client: {generatedProposal.client_name || data?.name} | Industry: {generatedProposal.industry || "Education"}
                </p>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-[13.5px] font-extrabold text-slate-800">
                  Executive Summary
                </h4>
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 space-y-2 text-[13.5px] text-slate-655 font-medium leading-relaxed">
                  {Array.isArray(generatedProposal.executive_summary) ? (
                    generatedProposal.executive_summary.map((item: string, idx: number) => (
                      <p key={idx}>{item}</p>
                    ))
                  ) : (
                    <p>{generatedProposal.executive_summary}</p>
                  )}
                </div>
              </div>

              {/* Proposed Modules */}
              <div className="space-y-2.5">
                <h4 className="text-[13.5px] font-extrabold text-slate-800">
                  Proposed Integration Modules
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(generatedProposal.proposed_modules) &&
                    generatedProposal.proposed_modules.map((module: string, idx: number) => (
                      <div key={idx} className="bg-[#F8F9FD] border border-slate-200/40 rounded-xl p-3.5 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#EAE8FF] text-[#6D5EF9] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-semibold text-slate-700">
                          {module}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Timeline and Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    Estimated Timeline
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-800">
                    {generatedProposal.timeline_weeks || "6 Weeks Duration"}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    Financial Investment
                  </span>
                  <span className="text-[15px] font-extrabold text-emerald-600">
                    {generatedProposal.price_range_inr || "₹3,00,000 - ₹5,00,000"}
                  </span>
                </div>
              </div>

              {/* Next Steps */}
              {generatedProposal.next_steps && (
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-extrabold text-slate-800">
                    Next Steps & Implementation
                  </h4>
                  <div className="bg-[#F4FBF8] border border-emerald-100 rounded-xl p-4 space-y-2 text-[13px] text-[#255C47] font-semibold leading-relaxed">
                    {Array.isArray(generatedProposal.next_steps) ? (
                      generatedProposal.next_steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <span>•</span>
                          <span>{step}</span>
                        </div>
                      ))
                    ) : (
                      <p>{generatedProposal.next_steps}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(generatedProposal, null, 2)
                  );
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="
                  px-5
                  h-11
                  rounded-xl
                  bg-[#6D5EF9]
                  hover:bg-[#5849E8]
                  text-white
                  font-bold
                  text-[13.5px]
                  flex
                  items-center
                  gap-2
                  transition-all
                  cursor-pointer
                  shadow-md
                  shadow-violet-600/15
                "
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setProposalModalOpen(false)}
                className="
                  px-5
                  h-11
                  rounded-xl
                  bg-white
                  border
                  border-slate-200
                  hover:bg-slate-50
                  text-slate-600
                  font-bold
                  text-[13.5px]
                  transition-colors
                  cursor-pointer
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
