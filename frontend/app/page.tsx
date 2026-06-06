"use client";

import Link from "next/link";
import Topbar from "@/components/Topbar";
import {
  Search,
  Mail,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  type RecentResearch = {
    school: string;
    location: string;
    size: string;
    confidence: number;
    status: string;
  };

  type RecentEmail = {
    recipient: string;
    subject: string;
    length: string;
    time: string;
  };

  const stats = [
    {
      title: "Total Leads Processed",
      value: "Live",
      description: "Connected to AI-2 lead import",
      icon: Search,
      bg: "bg-indigo-50 text-indigo-600",
      accent: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Emails Generated",
      value: "<120",
      description: "Word-controlled personalized drafts",
      icon: Mail,
      bg: "bg-blue-50 text-blue-600",
      accent: "from-blue-500 to-blue-600",
    },
    {
      title: "Success Rate",
      value: "JSON",
      description: "Shared schema validation",
      icon: ShieldCheck,
      bg: "bg-emerald-50 text-emerald-600",
      accent: "from-emerald-500 to-emerald-600",
    },
    {
      title: "API Usage (Groq)",
      value: "Groq",
      description: "llama-3.3-70b-versatile",
      icon: Zap,
      bg: "bg-amber-50 text-amber-500",
      accent: "from-amber-500 to-amber-600",
    },
  ];

  const activeAgents = [
    {
      name: "Lead Researcher",
      role: "Haripriya's Agent",
      status: "Active",
      endpoint: "/agent/research",
      desc: "Scrapes institutions with BeautifulSoup fallback and drafts operational profiles.",
      link: "/lead-researcher",
      icon: Search,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      name: "Proposal Generator",
      role: "Harsha's Agent",
      status: "Active",
      endpoint: "/agent/proposal",
      desc: "Drafts executive SOW summaries, pricing grids, and milestones in structured JSON.",
      link: "/proposal-generator",
      icon: FileText,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      name: "Email Personaliser",
      role: "Susmitha's Agent",
      status: "Active",
      endpoint: "/agent/email",
      desc: "Generates ultra-short cold outreach emails under 120 words with banned word controls.",
      link: "/email-generator",
      icon: Mail,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
  ];

  const recentResearch: RecentResearch[] = [];
  const recentEmails: RecentEmail[] = [];

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* TOPBAR */}
      <Topbar title="KALNET AI-1 Dashboard" subtitle="Overview of intelligent Sales outreach agents, lead analysis, and campaign logs" />

      <div className="px-10 py-8 max-w-[1440px] mx-auto space-y-10">
        
        {/* HERO HEADER */}
        <div className="
          relative
          overflow-hidden
          rounded-[32px]
          bg-gradient-to-br
          from-[#060B1F]
          via-[#0E1538]
          to-[#1C255C]
          p-10
          md:p-16
          text-white
          border
          border-slate-800
          shadow-2xl
        ">
          <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Empower Your Sales Team <br />
                With AI Sales Agents
              </h1>
              <p className="text-slate-300 text-[15.5px] leading-relaxed max-w-2xl font-medium tracking-wide">
                AI-powered outreach infrastructure for intelligent lead research, proposal generation, and personalized institutional engagement workflows.
              </p>
            </div>

            <div className="flex gap-4 shrink-0 mt-6 lg:mt-0">
              <Link
                href="/lead-researcher"
                className="
                  px-8
                  py-4
                  rounded-xl
                  bg-gradient-to-r
                  from-[#6D5EF9]
                  to-[#4F3EED]
                  hover:from-[#5C4DF7]
                  hover:to-[#3E2DDC]
                  text-white
                  font-bold
                  text-[15px]
                  shadow-lg
                  shadow-violet-600/20
                  transition-all
                  flex
                  items-center
                  gap-2
                  cursor-pointer
                  hover:scale-[1.02]
                  active:scale-[0.98]
                "
              >
                <span>Launch Researcher</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="
                  bg-white
                  rounded-[24px]
                  border
                  border-slate-100
                  shadow-sm
                  p-8
                  flex
                  flex-col
                  justify-between
                  hover:shadow-md
                  transition-all
                  group
                "
              >
                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-2">Active</span>
                </div>

                <div className="mt-8 space-y-2">
                  <span className="text-slate-400 text-[13.5px] font-bold block">{stat.title}</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">{stat.value}</h3>
                  <p className="text-[13px] text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* GRAPH & ACTIVE AGENTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SVG Weekly Performance Graph */}
          <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800">Weekly Performance Graph</h3>
                <p className="text-[13.5px] text-slate-400 font-medium">Outreach emails generated & positive responses captured</p>
              </div>

              <div className="flex items-center gap-4 text-[13.5px] font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Emails Dispatched
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  Lead Responses
                </span>
              </div>
            </div>

            {/* Line chart in pure premium SVG styling */}
            <div className="h-64 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="200" x2="600" y2="200" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="600" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="20" x2="600" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Fill Area Gradient (Emails Dispatched) */}
                <path
                  d="M0 200 L100 130 L200 160 L300 80 L400 90 L500 40 L600 20 L600 200 Z"
                  fill="url(#indigo-grad)"
                  opacity="0.08"
                />

                {/* Path Lines */}
                <path
                  d="M0 200 L100 130 L200 160 L300 80 L400 90 L500 40 L600 20"
                  stroke="#6D5EF9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M0 200 L100 180 L200 170 L300 130 L400 140 L500 90 L600 70"
                  stroke="#34D399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 2"
                />

                {/* Nodes circles */}
                <circle cx="100" cy="130" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="200" cy="160" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="300" cy="80" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="400" cy="90" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="500" cy="40" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />
                <circle cx="600" cy="20" r="5" fill="#6D5EF9" stroke="#FFF" strokeWidth="1.5" />

                <defs>
                  <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6D5EF9" />
                    <stop offset="100%" stopColor="#FFF" />
                  </linearGradient>
                </defs>
              </svg>
              {/* X Axis Labels */}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Active AI Agents Status Cards */}
          <div className="lg:col-span-4 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-[17px] font-extrabold text-slate-800">AI Agent Status Cards</h3>
              <p className="text-[13.5px] text-slate-400 font-medium">Operational system endpoints & modules</p>
            </div>

            <div className="space-y-4">
              {activeAgents.map((agent, idx) => {
                const Icon = agent.icon;
                return (
                  <Link href={agent.link} key={idx} className="block group">
                    <div className="
                      p-5
                      rounded-xl
                      border
                      border-slate-100
                      hover:border-[#6D5EF9]/40
                      hover:bg-slate-50/50
                      transition-all
                      flex
                      items-center
                      gap-4
                    ">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${agent.color}`}>
                        <Icon className="w-5.5 h-5.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[15.5px] text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {agent.name}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-[10px] text-emerald-500 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Active
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-400 font-semibold">{agent.role}</p>
                        <p className="text-[13.5px] text-slate-500 font-medium line-clamp-1 mt-1">{agent.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM TABLES ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Lead Research */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-5">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800">Recent Lead Research Activity</h3>
                <p className="text-[13.5px] text-slate-400 font-medium">Calculated institution sizes & AI scraping confidence</p>
              </div>
              <Link href="/lead-researcher" className="text-[13px] font-bold text-[#6D5EF9] hover:underline flex items-center gap-1">
                <span>View Researcher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="py-3 px-3">Institution</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[14px] font-medium text-slate-700">
                  {recentResearch.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <span className="font-extrabold text-slate-800 block">{item.school}</span>
                        <span className="text-[11px] text-slate-400 font-bold block mt-0.5">📍 {item.location}</span>
                      </td>
                      <td className="py-4 px-3 font-semibold text-slate-500">{item.size}</td>
                      <td className="py-4 px-3 font-bold text-[#6D5EF9]">{item.confidence}%</td>
                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === "Scraped" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentResearch.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                        No lead research activity yet. Run the Lead Research Agent to populate this table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Emails */}
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-5">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800">Recent Generated Emails Table</h3>
                <p className="text-[13.5px] text-slate-400 font-medium">B2B personalized sales outreach messages</p>
              </div>
              <Link href="/email-generator" className="text-[13px] font-bold text-[#6D5EF9] hover:underline flex items-center gap-1">
                <span>View Generator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentEmails.map((email, idx) => (
                <div
                  key={idx}
                  className="
                    p-5
                    rounded-xl
                    border
                    border-slate-100
                    bg-slate-50/30
                    space-y-2
                    relative
                    hover:border-blue-200/50
                    hover:bg-slate-50
                    transition-all
                  "
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[14.5px] text-slate-800 truncate pr-3">{email.recipient}</span>
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {email.time}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-slate-500 font-medium leading-relaxed line-clamp-1">{email.subject}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-bold bg-white border border-slate-200/60 rounded px-2 py-0.5">
                      {email.length}
                    </span>
                    <span className="text-[12px] font-extrabold text-indigo-600 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Generated
                    </span>
                  </div>
                </div>
              ))}
              {recentEmails.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-slate-400 font-semibold text-[13px]">
                  No generated emails yet. Create a draft from the Email Personaliser to see activity here.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
