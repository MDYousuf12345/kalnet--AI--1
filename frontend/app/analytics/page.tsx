"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import DashboardCard from "@/components/DashboardCard";
import {
  getHistory,
  HISTORY_UPDATED_EVENT,
  HistoryEntry
} from "@/utils/history";

import {
  TrendingUp,
  Activity,
  Sparkles,
  Mail,
  FileText,
  Search,
  BarChart3,
  Database,
} from "lucide-react";

export default function AnalyticsPage() {

  

const [history, setHistory] =
  useState<HistoryEntry[]>([]);

useEffect(() => {
  const loadHistory = () => {
    setHistory(getHistory());
  };

  loadHistory();

  window.addEventListener(
    HISTORY_UPDATED_EVENT,
    loadHistory
  );

  return () => {
    window.removeEventListener(
      HISTORY_UPDATED_EVENT,
      loadHistory
    );
  };
}, []);

const researchCount =
  history.filter(
    (item) => item.type === "research"
  ).length;

  const batchCount =
  history.filter(
    item => item.type === "batch"
  ).length;

const emailCount =
  history.filter(
    (item) => item.type === "email"
  ).length;

const proposalCount =
  history.filter(
    (item) => item.type === "proposal"
  ).length;

const totalActivities =
  researchCount +
  emailCount +
  proposalCount;

const successRate =
  totalActivities === 0
    ? 0
    : Math.round(
        ((emailCount + proposalCount) /
          totalActivities) *
          100
      );

  return (

    <div className="
      min-h-screen
      bg-[#F4F7FB]
    ">

      {/* TOPBAR */}

      <Topbar title="Analytics Dashboard" />

      <div className="
        p-10
      ">

        {/* HERO */}

        <div className="
          mb-10
        ">

          <div className="
            inline-flex
            items-center
            gap-3
            bg-violet-100
            text-violet-700
            px-5
            py-3
            rounded-2xl
            font-medium
            mb-6
          ">

            <Sparkles className="
              w-5
              h-5
            " />

            AI Performance Intelligence

          </div>

          <h1 className="
            text-5xl
            font-bold
            text-slate-900
            mb-4
          ">

            Analytics Overview

          </h1>

          <p className="
            text-slate-500
            text-xl
            leading-8
            max-w-4xl
          ">

            Monitor AI outreach performance,
            proposal generation metrics,
            email personalization success,
            and enterprise lead conversion intelligence.

          </p>

        </div>

        {/* STATS */}

        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-4
          gap-6
          mb-10
        ">

          <DashboardCard
            title="Lead Research Generated"
            value={researchCount.toString()}
            color="text-violet-600"
            icon={
              <Search className="
                w-6
                h-6
              " />
            }
          />

          <DashboardCard
            title="Emails Generated"
            value={emailCount.toString()}
            color="text-blue-600"
            icon={
              <Mail className="
                w-6
                h-6
              " />
            }
          />

          <DashboardCard
            title="Proposals Created"
            value={proposalCount.toString()}
            color="text-emerald-600"
            icon={
              <FileText className="
                w-6
                h-6
              " />
            }
          />

         <DashboardCard
  title="Batch Campaigns"
  value={batchCount.toString()}
  color="text-orange-600"
  icon={
    <Database className="w-6 h-6" />
  }
/>

        </div>

        {/* PERFORMANCE GRID */}

        <div className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-8
        ">

          {/* SYSTEM PERFORMANCE */}

          <div className="
            bg-white
            rounded-[32px]
            border
            border-slate-200
            shadow-sm
            p-8
          ">

            <div className="
              flex
              items-center
              gap-4
              mb-8
            ">

              <div className="
                w-14
                h-14
                rounded-2xl
                bg-violet-100
                flex
                items-center
                justify-center
              ">

                <Activity className="
                  w-7
                  h-7
                  text-violet-700
                " />

              </div>

              <div>

                <h2 className="
                  text-3xl
                  font-bold
                  text-slate-900
                ">

                  System Performance

                </h2>

                <p className="
                  text-slate-500
                  mt-1
                ">

                  AI workflow operational metrics

                </p>

              </div>

            </div>

            <div className="
              space-y-8
            ">

              {/* AI ACCURACY */}
<div>
  <div className="flex justify-between mb-3">
    <span className="text-slate-600 font-medium">
      AI Accuracy
    </span>

    <span className="font-bold text-slate-900">
      {successRate}%
    </span>
  </div>

  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
    <div
      className="
        h-4
        rounded-full
        bg-gradient-to-r
        from-violet-600
        to-indigo-600
      "
      style={{ width: `${successRate}%` }}
    ></div>
  </div>
</div>

{/* OUTREACH */}
<div>
  <div className="flex justify-between mb-3">
    <span className="text-slate-600 font-medium">
      Outreach Success
    </span>

    <span className="font-bold text-slate-900">
      {emailCount > 0 ? "100%" : "0%"}
    </span>
  </div>

  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
    <div
      className="
        h-4
        rounded-full
        bg-gradient-to-r
        from-blue-600
        to-cyan-500
      "
      style={{
        width: `${emailCount > 0 ? 100 : 0}%`,
      }}
    ></div>
  </div>
</div>


{/* PROPOSAL QUALITY */}
<div>
  <div className="flex justify-between mb-3">
    <span className="text-slate-600 font-medium">
      Proposal Quality
    </span>

    <span className="font-bold text-slate-900">
      {proposalCount > 0 ? "100%" : "0%"}
    </span>
  </div>

  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
    <div
      className="
        h-4
        rounded-full
        bg-gradient-to-r
        from-emerald-500
        to-teal-500
      "
      style={{
        width: `${proposalCount > 0 ? 100 : 0}%`,
      }}
    ></div>
  </div>
</div>
              

              {/* PROPOSAL QUALITY */}

              <div>

                <div className="
                  flex
                  justify-between
                  mb-3
                ">

                  <span className="
                    text-slate-600
                    font-medium
                  ">

                    Proposal Quality

                  </span>

                  <span className="
                    font-bold
                    text-slate-900
                  ">

                    92%

                  </span>

                </div>

                <div className="
                  w-full
                  h-4
                  bg-slate-100
                  rounded-full
                  overflow-hidden
                ">

                  <div className="
                    w-[92%]
                    h-4
                    rounded-full
                    bg-gradient-to-r
                    from-emerald-500
                    to-teal-500
                  "></div>

                </div>

              </div>

            </div>

          </div>

          {/* AI INSIGHTS */}

          <div className="
            bg-white
            rounded-[32px]
            border
            border-slate-200
            shadow-sm
            p-8
          ">

            <div className="
              flex
              items-center
              gap-4
              mb-8
            ">

              <div className="
                w-14
                h-14
                rounded-2xl
                bg-emerald-100
                flex
                items-center
                justify-center
              ">

                <BarChart3 className="
                  w-7
                  h-7
                  text-emerald-700
                " />

              </div>

              <div>

                <h2 className="
                  text-3xl
                  font-bold
                  text-slate-900
                ">

                  AI Insights

                </h2>

                <p className="
                  text-slate-500
                  mt-1
                ">

                  Enterprise outreach intelligence

                </p>

              </div>

            </div>

            <div className="
              space-y-5
            ">

              <div className="
                bg-violet-50
                border
                border-violet-100
                rounded-3xl
                p-6
              ">

                <h3 className="
                  text-xl
                  font-bold
                  text-slate-900
                  mb-3
                ">

                  High Engagement Leads

                </h3>

                <p className="
                  text-slate-600
                  leading-8
                ">

                  Total Lead Research operations completed: {researchCount}

                </p>

              </div>

              <div className="
                bg-blue-50
                border
                border-blue-100
                rounded-3xl
                p-6
              ">

                <h3 className="
                  text-xl
                  font-bold
                  text-slate-900
                  mb-3
                ">

                  Proposal Conversion

                </h3>

                <p className="
                  text-slate-600
                  leading-8
                ">

                  Total proposals generated using AI workflows: {proposalCount}

                </p>

              </div>

              <div className="
                bg-emerald-50
                border
                border-emerald-100
                rounded-3xl
                p-6
              ">

                <h3 className="
                  text-xl
                  font-bold
                  text-slate-900
                  mb-3
                ">

                  Outreach Optimization

                </h3>

                <p className="
                  text-slate-600
                  leading-8
                ">

                  Total personalized emails generated: {emailCount}

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}