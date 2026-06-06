"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import {
  Save,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Link2,
  FolderOpen,
  Activity,
  AlertCircle
} from "lucide-react";
import { fetchHealth } from "@/services/api";
import { HealthData } from "@/types/lead";

export default function SettingsPage() {
  // Key inputs
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [themeMode, setThemeMode] = useState("light");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState("");
  
  // FastAPI Endpoints
  const [researchEndpoint, setResearchEndpoint] = useState("http://localhost:8000/agent/research");
  const [proposalEndpoint, setProposalEndpoint] = useState("http://localhost:8000/agent/proposal");
  const [emailEndpoint, setEmailEndpoint] = useState("http://localhost:8000/agent/email");

  // Workspace Settings
  const [defaultSignature, setDefaultSignature] = useState("Yousuf | AI-1 Outreach Team, KALNET");
  const [targetRegion, setTargetRegion] = useState("Region selected per campaign");
  const [defaultCurrency, setDefaultCurrency] = useState("INR (₹)");

  // Notification Preferences
  const [notifyResearch, setNotifyResearch] = useState(true);
  const [notifyProposal, setNotifyProposal] = useState(true);
  const [notifyBatch, setNotifyBatch] = useState(false);

  const [saved, setSaved] = useState(false);

  const isValidHttpUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const endpointsValid = [researchEndpoint, proposalEndpoint, emailEndpoint].every(isValidHttpUrl);

  useEffect(() => {
    const storedKey = localStorage.getItem("groq-api-key") || "";
    const storedModel = localStorage.getItem("selected-model") || "llama-3.3-70b-versatile";
    queueMicrotask(() => {
      setApiKey(storedKey);
      setSelectedModel(storedModel);
    });

    fetchHealth().then((result) => {
      setHealth(result.data);
      setHealthError(result.success ? "" : result.error || "Health check failed");
    });
  }, []);

  const saveSettings = () => {
    localStorage.setItem("groq-api-key", apiKey);
    localStorage.setItem("selected-model", selectedModel);
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const teamMembers = [
    { name: "Mohammed Yousuf", role: "Team Lead", focus: "Architecture, PR Review, Daily Standup" },
    { name: "Haripriya Chakilam", role: "LLM Engineer 1", focus: "Lead Research Agent, BeautifulSoup Scraper" },
    { name: "G. Harsha Adithya", role: "LLM Engineer 2", focus: "Proposal Generator Agent, Structured JSON" },
    { name: "Susmitha Nalla", role: "LLM Engineer 3", focus: "Email Personalisation Agent, Batch Processor" },
    { name: "Kathroju Shiva Teja", role: "Prompt Engineer", focus: "All prompts, failure iterations, prompt library" },
    { name: "Aswitha Kota", role: "API & Internal Tool", focus: "FastAPI endpoints, Next.js tool connect" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-20">
      <Topbar title="Settings" subtitle="Configure Groq API integration, FastAPI endpoints, workspace preferences, and manage team members" />

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MAIN CONFIGURATION FORM */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* API KEY & MODEL PREFERENCES CARD */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="text-lg">🔑</span>
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  AI Model & API Keys
                </h3>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Groq API Key
                  </label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#6D5EF9] hover:underline"
                  >
                    Configure GROQ_API_KEY for backend access
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter GROQ_API_KEY..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      pl-4
                      pr-12
                      text-[13.5px]
                      text-slate-800
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Model selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  AI Model Selector
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="
                    w-full
                    h-11
                    rounded-xl
                    border
                    border-slate-200/80
                    px-3
                    text-[13.5px]
                    text-slate-800
                    bg-white
                    outline-none
                    focus:border-[#6D5EF9]
                    transition-all
                  "
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Backend Health</span>
                  <span className={`text-[12.5px] font-extrabold mt-1 flex items-center gap-1.5 ${health?.status === "healthy" ? "text-emerald-600" : "text-red-600"}`}>
                    {health?.status === "healthy" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {health?.status || "Checking"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Groq Model</span>
                  <span className="text-[12.5px] font-extrabold text-slate-700 mt-1 block">{health?.llm || selectedModel}</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI-2 Endpoint</span>
                  <span className="text-[12.5px] font-extrabold text-slate-700 mt-1 block truncate">{health?.ai2_endpoint || "Checking"}</span>
                </div>
              </div>

              {healthError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-[11.5px] font-bold">{healthError}</span>
                </div>
              )}
            </div>

            {/* FASTAPI ENDPOINT URLS CARD */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Link2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  FastAPI Endpoint URLs
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Research URL
                  </label>
                  <input
                    type="text"
                    value={researchEndpoint}
                    onChange={(e) => setResearchEndpoint(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-755
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Proposal URL
                  </label>
                  <input
                    type="text"
                    value={proposalEndpoint}
                    onChange={(e) => setProposalEndpoint(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-755
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Email URL
                  </label>
                  <input
                    type="text"
                    value={emailEndpoint}
                    onChange={(e) => setEmailEndpoint(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-755
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>
              </div>

              {!endpointsValid && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-[11.5px] font-bold">All FastAPI endpoints must use valid HTTP or HTTPS URLs.</span>
                </div>
              )}
            </div>

            {/* WORKSPACE SETTINGS CARD */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <FolderOpen className="w-5 h-5 text-indigo-500" />
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  Workspace Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Default Email Signature
                  </label>
                  <input
                    type="text"
                    value={defaultSignature}
                    onChange={(e) => setDefaultSignature(e.target.value)}
                    className="
                      w-full
                      h-11
                      rounded-xl
                      border
                      border-slate-200/80
                      px-3
                      text-[13px]
                      text-slate-755
                      outline-none
                      focus:border-[#6D5EF9]
                      transition-all
                    "
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Target Outreach Region
                    </label>
                    <input
                      type="text"
                      value={targetRegion}
                      onChange={(e) => setTargetRegion(e.target.value)}
                      className="
                        w-full
                        h-11
                        rounded-xl
                        border
                        border-slate-200/80
                        px-3
                        text-[13px]
                        text-slate-755
                        outline-none
                        focus:border-[#6D5EF9]
                        transition-all
                      "
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Default Currency
                    </label>
                    <input
                      type="text"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="
                        w-full
                        h-11
                        rounded-xl
                        border
                        border-slate-200/80
                        px-3
                        text-[13px]
                        text-slate-755
                        outline-none
                        focus:border-[#6D5EF9]
                        transition-all
                      "
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TEAM MEMBERS CARD */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  AI-1 Team Members & Roles
                </h3>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Member Name</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Task Focus Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12.5px]">
                    {teamMembers.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{m.name}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">{m.role}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{m.focus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: THEME TOGGLE & NOTIFICATIONS CARD */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* THEME & SYSTEM PREFERENCES */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="text-lg">🌈</span>
                <h3 className="text-[14.5px] font-extrabold text-slate-800">
                  Theme Settings
                </h3>
              </div>

              {/* Theme Toggle */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Visual Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setThemeMode("light")}
                    className={`
                      h-11
                      rounded-xl
                      border
                      flex
                      items-center
                      justify-center
                      gap-2
                      font-bold
                      text-[12.5px]
                      transition-all
                      cursor-pointer
                      ${
                        themeMode === "light"
                          ? "bg-indigo-50 border-[#6D5EF9] text-[#6D5EF9]"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }
                    `}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </button>

                  <button
                    onClick={() => setThemeMode("dark")}
                    className={`
                      h-11
                      rounded-xl
                      border
                      flex
                      items-center
                      justify-center
                      gap-2
                      font-bold
                      text-[12.5px]
                      transition-all
                      cursor-pointer
                      ${
                        themeMode === "dark"
                          ? "bg-indigo-50 border-[#6D5EF9] text-[#6D5EF9]"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }
                    `}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <label className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wider block">
                  Notification Preferences
                </label>

                <div className="space-y-3.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyResearch}
                      onChange={(e) => setNotifyResearch(e.target.checked)}
                      className="w-4.5 h-4.5 text-[#6D5EF9] rounded border-slate-300 focus:ring-[#6D5EF9]/10"
                    />
                    <span className="text-[12.5px] font-bold text-slate-600">Research Complete Alerts</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyProposal}
                      onChange={(e) => setNotifyProposal(e.target.checked)}
                      className="w-4.5 h-4.5 text-[#6D5EF9] rounded border-slate-300 focus:ring-[#6D5EF9]/10"
                    />
                    <span className="text-[12.5px] font-bold text-slate-600">Proposal Ready Notifications</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyBatch}
                      onChange={(e) => setNotifyBatch(e.target.checked)}
                      className="w-4.5 h-4.5 text-[#6D5EF9] rounded border-slate-300 focus:ring-[#6D5EF9]/10"
                    />
                    <span className="text-[12.5px] font-bold text-slate-600">Batch Complete Desktop Alerts</span>
                  </label>
                </div>
              </div>

              {/* Save settings CTA */}
              <div className="pt-2">
                <button
                  onClick={saveSettings}
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
                    shadow-violet-600/25
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-2
                    cursor-pointer
                  "
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>

              {saved && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11.5px] font-medium">Settings saved to local storage!</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
