"use client";

import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="sticky top-0 z-40 flex w-full items-center justify-between gap-4 border-b border-slate-100/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/50 bg-[#F4F6FA] text-slate-500 hover:bg-slate-200/60"
          aria-label="Open dashboard"
        >
          <Menu className="h-4.5 w-4.5" />
        </Link>

        <div className="min-w-0 space-y-0.5">
          <h1 className="truncate text-[20px] font-extrabold leading-tight text-slate-900 sm:text-[22px]">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden truncate text-[13.5px] font-medium text-[#7C849B] sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/lead-researcher"
        className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#4F46E5] px-4 text-[13.5px] font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-[#4338CA]"
      >
        <Sparkles className="h-4 w-4 text-white" />
        <span className="hidden sm:inline">AI-1 Project</span>
      </Link>
    </div>
  );
}
