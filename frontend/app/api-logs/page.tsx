"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Eye,
} from "lucide-react";

type ApiLog = {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: string;
  agent: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
};

export default function ApiLogsPage() {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  const logs: ApiLog[] = [];
  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "SUCCESS" && log.status >= 200 && log.status < 300) ||
      (filter === "FAILED" && (log.status < 200 || log.status >= 300));

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.endpoint.toLowerCase().includes(query) ||
      log.agent.toLowerCase().includes(query) ||
      log.id.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-20">
      <Topbar title="API Logs" subtitle="Inspect live API calls, payloads, and response latency across LLM agents" />

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            {["ALL", "SUCCESS", "FAILED"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl font-bold text-[12px] tracking-wide transition-all cursor-pointer ${
                  filter === type
                    ? "bg-[#6D5EF9] text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by endpoint or agent..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200/80 pl-10 pr-4 text-[13px] text-slate-700 bg-slate-50/50 outline-none focus:bg-white focus:border-[#6D5EF9] transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-4.5 px-5">Request ID</th>
                    <th className="py-4.5 px-5">Agent / Route</th>
                    <th className="py-4.5 px-5">Latency</th>
                    <th className="py-4.5 px-5">Status</th>
                    <th className="py-4.5 px-5 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/50 transition-colors font-medium cursor-pointer ${
                        selectedLog?.id === log.id ? "bg-indigo-50/30" : ""
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-800">{log.id}</span>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{log.timestamp}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {log.method}
                          </span>
                          <span className="font-bold text-slate-800">{log.endpoint}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-semibold">{log.agent}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 text-slate-600 font-bold text-[12px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.responseTime}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {log.status >= 200 && log.status < 300 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{log.status} OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 text-[11px] font-bold">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>{log.status} ERR</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#6D5EF9] border border-slate-200/50 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No live API logs have been captured in this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5">
            {selectedLog ? (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-[14.5px] font-extrabold text-slate-800">
                      Request Details: {selectedLog.id}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedLog.timestamp}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-slate-50 text-slate-700 border-slate-100">
                    {selectedLog.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[12.5px] font-medium text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">LLM Agent</span>
                    <span className="font-extrabold text-slate-800 mt-1 block">{selectedLog.agent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Response Latency</span>
                    <span className="font-extrabold text-slate-800 mt-1 block">{selectedLog.responseTime}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Request Payload (JSON)
                  </h4>
                  <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl text-[11.5px] font-mono overflow-x-auto leading-normal border border-slate-800">
                    {JSON.stringify(selectedLog.requestPayload, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Response Payload (JSON)
                  </h4>
                  <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-[11.5px] font-mono overflow-x-auto leading-normal border border-slate-800">
                    {JSON.stringify(selectedLog.responsePayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAFBFD] rounded-[24px] border border-slate-200/50 p-12 text-center text-slate-400 font-medium">
                <Database className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <span>Select an API request log from the table to inspect payloads and performance diagnostics.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
