"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import {
  Mail,
  Copy,
  Check,
  RefreshCw,
  User,
  AlertCircle,
  Send,
} from "lucide-react";
import { useInstitution } from "@/app/context/InstitutionContext";
import { generateEmail } from "@/services/api";
import { LeadResearchContact } from "@/types/lead";
import { saveHistory } from "@/utils/history";

export default function EmailGeneratorPage() {
  const { currentInstitutionData } = useInstitution();

  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  
  
  // Pain points list
  const [painPoints, setPainPoints] = useState<{text: string, active: boolean}[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [emailClientOpened, setEmailClientOpened] = useState(false);

  // Load from Global Context
  useEffect(() => {
    if (currentInstitutionData) {
      let nameStr = "";
      let emailStr = "";
      let roleStr = "Decision Maker";
      const contacts = currentInstitutionData.contacts;
      if (Array.isArray(contacts) && contacts.length > 0) {
        const primaryContact = contacts[0] as LeadResearchContact;
        nameStr = primaryContact.name || "";
        emailStr = primaryContact.email || "";
        roleStr = primaryContact.role || roleStr;
      }
      queueMicrotask(() => {
        setInstitutionName(currentInstitutionData.institution_name);
        setContactName(nameStr);
        setContactEmail(emailStr);
        setContactRole(roleStr);
        
        if (currentInstitutionData.pain_points && currentInstitutionData.pain_points.length > 0) {
          setPainPoints(currentInstitutionData.pain_points.map((p: string) => ({ text: p, active: true })));
        } else {
          setPainPoints([]);
        }
      });
    }
  }, [currentInstitutionData]);

  const togglePainPoint = (idx: number) => {
    setPainPoints(prev => {
      const copy = [...prev];
      copy[idx].active = !copy[idx].active;
      return copy;
    });
  };

  const handleGenerate = async () => {
    if (!institutionName.trim()) {
      setError("Please enter an institution name.");
      return;
    }

    setLoading(true);
    setError("");
    setEmailClientOpened(false);
    
    try {
      const activePoints = painPoints.filter(p => p.active).map(p => p.text);
      
      const result = await generateEmail(
        institutionName,
        contactName,
        contactRole,
        activePoints,
        selectedTone
      );
      
      if (result.success && result.data) {
        setSubject(result.data.subject);
        setBody(result.data.body);
        
        const words = result.data.body.trim().split(/\s+/).length;
        setWordCount(words);
        saveHistory("email", {
          institution_name: institutionName,
          recipient_email: contactEmail,
          contact_name: contactName || "Admissions Team",
          contact_role: contactRole || "Decision Maker",
          pain_points: activePoints,
          subject: result.data.subject,
          body: result.data.body,
        });
      } else {
        setError(result.error || "Failed to generate email");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!subject || !body) return;
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    if (!subject || !body) return;
   

    const recipient = contactEmail.trim();
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setEmailClientOpened(true);
    setTimeout(() => setEmailClientOpened(false), 3000);
  };
  const clearForm = () => {
  setInstitutionName("");
  setContactName("");
  setContactEmail("");
  setContactRole("");
  setPainPoints([]);
  setSubject("");
  setBody("");
  setError("");
  setWordCount(0);
};

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-20">
      <Topbar title="Email Generator" subtitle="Generate high-converting, personalized B2B cold emails tailored to lead intelligence" />

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-8">
        
        {/* TWO COLUMN PANEL OR EMPTY STATE */}
        {!currentInstitutionData ? (
          <div className="bg-white rounded-[24px] border border-dashed border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
             <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
               <Mail className="w-8 h-8" />
             </div>
             <h3 className="text-[20px] font-extrabold text-slate-700">No Institution Selected</h3>
             <p className="text-[15px] font-medium text-slate-400 max-w-md">
               Search an institution first on the Lead Research page to generate personalized outreach.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANEL: CONFIGURATOR */}
          <div className="lg:col-span-4 space-y-8">
            <div className="
              bg-white
              rounded-2xl
              border
              border-slate-100
              shadow-sm
              p-8
              space-y-6
            ">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="text-xl">📧</span>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Email Content Configurator
                </h3>
              </div>

              {/* Institution Name */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="
                    w-full
                    h-14
                    rounded-xl
                    border
                    border-slate-200/80
                    px-4
                    text-base
                    text-slate-800
                    font-medium
                    outline-none
                    focus:border-[#6D5EF9]
                    transition-all
                  "
                />
              </div>

              {/* Contact Name & Role */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="
                      w-full
                      h-14
                      rounded-xl
                      border
                      border-slate-200/80
                      px-4
                      text-base
                      text-slate-800
                      font-medium
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contact Role
                  </label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    className="
                      w-full
                      h-14
                      rounded-xl
                      border
                      border-slate-200/80
                      px-4
                      text-base
                      text-slate-800
                      font-medium
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>
              </div>
              {/* Contact Email */}
              <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
              Contact Email
             </label>

              <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="
              w-full
              h-14
              rounded-xl
              border
              border-slate-200/80
              px-4
              text-base
              text-slate-800
              font-medium
              outline-none
              focus:border-[#6D5EF9]
              transition-all
            "
          />
        </div>

              {/* Tone Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Outreach Tone Selector
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Professional", "Friendly", "Formal", "Direct"].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedTone(tone)}
                      className={`
                        h-10
                        rounded-xl
                        border
                        font-bold
                        text-[11px]
                        tracking-wide
                        transition-all
                        cursor-pointer
                        ${
                          selectedTone === tone
                            ? "bg-indigo-50 border-[#6D5EF9] text-[#6D5EF9] shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }
                      `}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Point Tags Selector */}
              {/* Editable Pain Points */}
<div className="space-y-2">
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
    Pain Points
  </label>

  {painPoints.map((point, idx) => (
    <div key={idx} className="flex gap-2 mb-2">
      <input
        type="text"
        value={point.text}
        onChange={(e) => {
          const updated = [...painPoints];
          updated[idx].text = e.target.value;
          setPainPoints(updated);
        }}
        className="
          flex-1
          h-11
          rounded-xl
          border
          border-slate-200
          px-3
          text-sm
          text-slate-700
        "
      />

      <button
        type="button"
        onClick={() => togglePainPoint(idx)}
        className={`
          px-3
          rounded-xl
          text-xs
          font-bold
          ${
            point.active
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-400"
          }
        `}
      >
        {point.active ? "ON" : "OFF"}
      </button>
    </div>
  ))}
</div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-gradient-to-r
                  from-[#6D5EF9]
                  to-[#4F3EED]
                  hover:from-[#5C4DF7]
                  hover:to-[#3E2DDC]
                  text-white
                  font-bold
                  text-base
                  shadow-md
                  shadow-violet-600/20
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  cursor-pointer
                  disabled:opacity-80
                "
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Generate Email</span>
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
    h-12
    rounded-xl
    border
    border-slate-200
    bg-white
    hover:bg-slate-50
    text-slate-600
    font-bold
    transition-all
    cursor-pointer
  "
>
  Clear Form
</button>


          </div>

          {/* RIGHT PANEL: GMAIL PREVIEW */}
          <div className="lg:col-span-8">
            
            {/* Loading Skeleton */}
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6 animate-pulse min-h-[320px]">
                <div className="h-10 bg-slate-200 rounded w-1/4"></div>
                <div className="h-40 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            )}

            {/* Gmail Preview Body */}
            {body && !loading && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Gmail toolbar header */}
                <div className="bg-[#FAFBFD] px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                    <span className="text-lg font-extrabold text-slate-800 ml-3 tracking-tight">New Message — Cold Outreach Agent</span>
                  </div>

                  {/* Dynamic word count badge */}
                  <span className={`px-3 py-1 rounded-md font-bold text-[12px] border ${
                    wordCount <= 120 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {wordCount} Words ({wordCount <= 120 ? "Compliant" : "Too Long"})
                  </span>
                </div>

                {/* To: principal and Subject */}
                <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-4 text-[15px] text-slate-500 font-medium">
                  <span className="w-16 text-right">To:</span>
                  <span className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    {contactName || "Admissions Team"} &lt;{contactEmail || "recipient email pending"}&gt;
                  </span>
                </div>

                <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-4 text-[15px] text-slate-500 font-medium">
                  <span className="w-16 text-right">Subject:</span>
                  <span className="text-lg font-extrabold text-slate-800 tracking-tight">{subject}</span>
                </div>

                {/* Body message content */}
                <div className="p-8 bg-slate-50/30 max-h-[600px] overflow-y-auto min-h-[320px]">
                  <div className="
                    bg-white
                    border
                    border-slate-200/60
                    rounded-2xl
                    p-8
                    shadow-sm
                    text-base
                    leading-8
                    max-w-none
                    text-slate-700
                    font-medium
                    whitespace-pre-wrap
                  ">
                    {body}
                  </div>
                </div>

                {/* Gmail actions footer */}
                <div className="bg-[#FAFBFD] px-6 py-4.5 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <button
                    onClick={handleGenerate}
                    className="
                      px-4
                      py-2
                      rounded-lg
                      bg-slate-50
                      hover:bg-slate-100
                      text-slate-600
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
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Agent</span>
                  </button>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    {emailClientOpened && (
                      <span className="text-[12px] font-bold text-emerald-600">
                        Opening email client...
                      </span>
                    )}

                    <button
                      onClick={copyToClipboard}
                      disabled={!subject || !body}
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
                        justify-center
                        gap-1.5
                        shadow-md
                        shadow-violet-600/10
                        transition-all
                        cursor-pointer
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied Email!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white/80" />
                          <span>Copy Email Draft</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={sendEmail}
                      disabled={!subject || !body}
                      className="
                        px-4
                        py-2
                        rounded-lg
                        bg-emerald-600
                        hover:bg-emerald-700
                        text-white
                        font-bold
                        text-[12.5px]
                        flex
                        items-center
                        justify-center
                        gap-1.5
                        shadow-md
                        shadow-emerald-600/10
                        transition-all
                        cursor-pointer
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      <Send className="w-3.5 h-3.5 text-white/90" />
                      <span>Send Email</span>
                    </button>
                  </div>
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
