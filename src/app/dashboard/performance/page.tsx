"use client";

import { useEffect, useState } from "react";
import { Phone, MapPin, Target, TrendingUp } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface CallLog {
  id: string;
  date: string;
  callType: string;
  callsMade: number;
  callsReceived: number;
  interestedVisit: number;
  interestedVisitNames: string | null;
  needsFollowUp: number;
  prospects: number;
  notInterested: number;
  invalidNumbers: number;
  alreadyVisited: number;
  highlyInterested: number;
  remarks: string | null;
  toursMade: number;
  hoursWorked: number;
  intern: { id: string; internId: string; name: string };
}

interface Summary {
  month: number;
  year: number;
  totalLogs: number;
  totalCalls: number;
  totalInterested: number;
  byIntern: Array<{
    intern: { id: string; internId: string; name: string };
    totalCalls: number;
    totalReceived: number;
    totalInterested: number;
    totalTours: number;
    days: number;
  }>;
}

export default function PerformancePage() {
  const [tab, setTab] = useState<"calls" | "summary">("calls");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi<CallLog[]>("/call-logs?from=2026-06-01&to=2026-06-30"),
      fetchApi<Summary>("/call-logs/summary?month=6&year=2026"),
    ]).then(([logs, sum]) => {
      setCallLogs(logs);
      setSummary(sum);
      setLoading(false);
    });
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const totalTours = summary.byIntern.reduce((s, i) => s + i.totalTours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">Call center activity and performance — June 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Phone size={14} /><span className="text-xs">Total Calls (Month)</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalCalls.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp size={14} /><span className="text-xs">Interested Visits</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalInterested}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin size={14} /><span className="text-xs">Tours (Month)</span>
          </div>
          <p className="text-2xl font-bold">{totalTours}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target size={14} /><span className="text-xs">Total Submissions</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalLogs}</p>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl">
        <div className="flex border-b border-border">
          <button onClick={() => setTab("calls")} className={`px-6 py-3 text-sm font-medium transition-colors ${tab === "calls" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            Recent Call Logs
          </button>
          <button onClick={() => setTab("summary")} className={`px-6 py-3 text-sm font-medium transition-colors ${tab === "summary" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            Monthly Summary
          </button>
        </div>

        {tab === "calls" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Intern</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Made</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Received</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Interested</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tours</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{log.intern.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.date.split("T")[0]}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{log.callType || "—"}</td>
                    <td className="px-4 py-3 text-center font-medium">{log.callsMade}</td>
                    <td className="px-4 py-3 text-center">{log.callsReceived}</td>
                    <td className="px-4 py-3 text-center">
                      {log.interestedVisit > 0 ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">{log.interestedVisit}</span>
                      ) : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{log.toursMade}</td>
                    <td className="px-4 py-3 text-center">{log.hoursWorked}h</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{log.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "summary" && (
          <div className="p-6 space-y-4">
            {summary.byIntern.map((item, i) => (
              <div key={item.intern.id} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                <span className="text-sm w-40 truncate font-medium">{item.intern.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (item.totalCalls / (summary.byIntern[0]?.totalCalls || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-24 text-right">{item.totalCalls.toLocaleString()} calls</span>
                <span className="text-xs text-muted-foreground w-16 text-right">{item.totalTours} tours</span>
                <span className="text-xs text-muted-foreground w-14 text-right">{item.days} days</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
