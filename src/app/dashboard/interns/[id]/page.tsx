"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  BarChart3,
  MapPin,
  Users,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface PerformanceData {
  intern: {
    id: string;
    internId: string;
    name: string;
    email: string | null;
    role: string;
    shift: string;
    joinDate: string | null;
    supervisor: string | null;
  };
  summary: {
    totalCalls: number;
    totalReceived: number;
    totalInterested: number;
    totalTours: number;
    totalHours: number;
    totalDaysWorked: number;
    avgCallsPerDay: number;
    avgHoursPerDay: number;
    connectionRate: number;
    conversionRate: number;
  };
  thisMonth: {
    calls: number;
    received: number;
    interested: number;
    tours: number;
    hours: number;
    daysWorked: number;
  };
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    halfDays: number;
    rate: number;
    monthRate: number;
  };
  category: "RED" | "YELLOW" | "GREEN";
  reasons: string[];
  flags: string[];
  compLeave: {
    earned: number;
    used: number;
    balance: number;
    earningSaturdays: string[];
  };
  saturday: { rostered: number; present: number; dates: string[] };
  leaveDays: {
    AL: number;
    CL: number;
    UL: number;
    HD: number;
    total: number;
    thisMonth: number;
    unapprovedThisMonth: number;
  };
  ranking: { rank: number; total: number };
  kpi: { target: number; daysAboveTarget: number; achievement: number };
  dailyTrend: Array<{
    date: string;
    callsMade: number;
    callsReceived: number;
    interested: number;
    tours: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    calls: number;
    received: number;
    interested: number;
    tours: number;
    days: number;
  }>;
  recentCallLogs: Array<{
    id: string;
    date: string;
    callsMade: number;
    callsReceived: number;
    interestedVisit: number;
    toursMade: number;
    hoursWorked: number;
    remarks: string | null;
  }>;
  tourLogs: Array<{
    id: string;
    date: string;
    visitorName: string;
    visitors: number;
    outcome: string;
    notes: string | null;
  }>;
  leaveRequests: Array<{
    id: string;
    date: string;
    type: string;
    reason: string | null;
    status: string;
  }>;
}

export default function InternProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "calls" | "attendance">("overview");

  useEffect(() => {
    if (params.id) {
      fetchApi<PerformanceData>(`/interns/${params.id}/performance`).then((d) => {
        setData(d);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const { intern, summary, thisMonth, attendance, ranking, kpi, dailyTrend, weeklyTrend, recentCallLogs, category, reasons, flags, compLeave, saturday, leaveDays } = data;
  const maxDailyCalls = Math.max(...dailyTrend.map((d) => d.callsMade), 1);
  const maxWeeklyCalls = Math.max(...weeklyTrend.map((d) => d.calls), 1);

  const categoryStyle = {
    RED: { badge: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Needs Action", banner: "bg-red-50 border-red-200 text-red-800" },
    YELLOW: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", label: "Watch", banner: "bg-amber-50 border-amber-200 text-amber-800" },
    GREEN: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: "On Track", banner: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  }[category];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/interns")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold">
            {intern.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{intern.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyle.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                {categoryStyle.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {intern.internId} · {intern.role} · {intern.email || "No email"}
            </p>
          </div>
        </div>
        <div className="text-right hidden lg:block">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award size={14} />
            <span>
              Rank <span className="font-bold text-foreground">#{ranking.rank}</span> of {ranking.total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month by calls</p>
        </div>
      </div>

      {/* Status reasons + leave-pattern flags */}
      {(reasons.length > 0 || flags.length > 0) && (
        <div className={`border rounded-xl p-4 ${categoryStyle.banner}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5">
            {category === "GREEN" ? "Status" : "Attention needed"}
          </p>
          <ul className="text-sm space-y-1">
            {[...reasons, ...flags.filter((f) => !reasons.includes(f))].map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Calls" value={summary.totalCalls.toLocaleString()} icon={Phone} />
        <MetricCard label="Avg/Day" value={`${summary.avgCallsPerDay}`} icon={BarChart3} />
        <MetricCard label="Connection Rate" value={`${summary.connectionRate}%`} icon={TrendingUp} />
        <MetricCard label="Conversion Rate" value={`${summary.conversionRate}%`} icon={Target} />
        <MetricCard label="Attendance" value={`${attendance.rate}%`} icon={Calendar} />
      </div>

      {/* Attendance & comp-leave snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniStat label="Days Present" value={`${attendance.present}`} />
        <MiniStat label="Saturdays Rostered" value={`${saturday.rostered}`} />
        <MiniStat label="Saturdays Present" value={`${saturday.present}`} />
        <MiniStat label="Comp Leave Earned" value={`${compLeave.earned}`} />
        <MiniStat label="Comp Leave Used" value={`${compLeave.used}`} />
        <MiniStat label="Comp Leave Remaining" value={`${compLeave.balance}`} />
      </div>

      {/* This Month Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniStat label="Calls This Month" value={thisMonth.calls.toLocaleString()} />
        <MiniStat label="Received" value={thisMonth.received.toLocaleString()} />
        <MiniStat label="Interested" value={`${thisMonth.interested}`} />
        <MiniStat label="Tours" value={`${thisMonth.tours}`} />
        <MiniStat label="Hours" value={`${thisMonth.hours}h`} />
        <MiniStat label="Days Worked" value={`${thisMonth.daysWorked}`} />
      </div>

      {/* KPI Achievement Bar */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} />
            <span className="font-semibold text-sm">KPI Achievement</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Target: {kpi.target} calls/day · Met on {kpi.daysAboveTarget}/{summary.totalDaysWorked} days
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              kpi.achievement >= 80 ? "bg-emerald-500" : kpi.achievement >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, kpi.achievement)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {kpi.achievement}% of working days met the daily target
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-background border border-border rounded-xl">
        <div className="flex border-b border-border">
          {(["overview", "calls", "attendance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Daily Trend" : t === "calls" ? "Call History" : "Attendance"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="p-6">
            <h4 className="font-medium text-sm mb-4">Daily Calls (Last 14 Sessions)</h4>
            <div className="flex items-end gap-1 h-40">
              {dailyTrend.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.callsMade}</span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      d.callsMade >= kpi.target ? "bg-emerald-400" : "bg-neutral-300"
                    }`}
                    style={{ height: `${(d.callsMade / maxDailyCalls) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-[9px] text-muted-foreground rotate-[-45deg] w-8 text-center">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-400" />
                <span>Above target ({kpi.target}+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-neutral-300" />
                <span>Below target</span>
              </div>
            </div>

            <h4 className="font-medium text-sm mt-8 mb-4">Weekly Summary</h4>
            <div className="space-y-2">
              {weeklyTrend.map((w) => (
                <div key={w.week} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-20">W/{w.week.slice(5)}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(w.calls / maxWeeklyCalls) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-20 text-right">{w.calls} calls</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{w.days} days</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "calls" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Made</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Received</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Interested</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tours</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recentCallLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-6 py-3">{log.date.split("T")[0]}</td>
                    <td className="px-4 py-3 text-center font-medium">{log.callsMade}</td>
                    <td className="px-4 py-3 text-center">{log.callsReceived}</td>
                    <td className="px-4 py-3 text-center">
                      {log.interestedVisit > 0 ? (
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{log.interestedVisit}</span>
                      ) : "0"}
                    </td>
                    <td className="px-4 py-3 text-center">{log.toursMade}</td>
                    <td className="px-4 py-3 text-center">{log.hoursWorked}h</td>
                    <td className="px-4 py-3 text-center">
                      {log.callsMade >= kpi.target ? (
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">Met</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">Below</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "attendance" && (
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600 font-medium">Present</p>
                <p className="text-2xl font-bold text-emerald-700">{attendance.present}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Absent</p>
                <p className="text-2xl font-bold text-red-700">{attendance.absent}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-600 font-medium">Late</p>
                <p className="text-2xl font-bold text-amber-700">{attendance.late}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Half Days</p>
                <p className="text-2xl font-bold text-blue-700">{attendance.halfDays}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">Rate (lifetime / month)</p>
                <p className="text-2xl font-bold">
                  {attendance.rate}% <span className="text-sm font-medium text-muted-foreground">/ {attendance.monthRate}%</span>
                </p>
              </div>
            </div>

            {/* Saturday duty & comp leave */}
            <h4 className="font-medium text-sm mb-3">Saturday Duty & Compensation Leave</h4>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <MiniStat label="Saturdays Rostered" value={`${saturday.rostered}`} />
              <MiniStat label="Saturdays Present" value={`${saturday.present}`} />
              <MiniStat label="CL Earned" value={`${compLeave.earned}`} />
              <MiniStat label="CL Used" value={`${compLeave.used}`} />
              <MiniStat label="CL Remaining" value={`${compLeave.balance}`} />
            </div>
            {compLeave.balance < 0 && (
              <p className="text-xs text-red-600 mb-4">
                ⚠ Comp leave overspent — {compLeave.used} used against {compLeave.earned} earned.
              </p>
            )}
            {saturday.dates.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">Saturdays worked (comp leave earned):</p>
                <div className="flex flex-wrap gap-1.5">
                  {saturday.dates.map((d) => (
                    <span key={d} className="text-xs font-mono px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Leave breakdown */}
            <h4 className="font-medium text-sm mb-3">Leave Days</h4>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
              <MiniStat label="Approved (AL)" value={`${leaveDays.AL}`} />
              <MiniStat label="Comp Leave (CL)" value={`${leaveDays.CL}`} />
              <MiniStat label="Unapproved (UL)" value={`${leaveDays.UL}`} />
              <MiniStat label="Half Day (HD)" value={`${leaveDays.HD}`} />
              <MiniStat label="Total Leave Days" value={`${leaveDays.total}`} />
              <MiniStat label="This Month" value={`${leaveDays.thisMonth}`} />
            </div>

            {data.leaveRequests.length > 0 && (
              <>
                <h4 className="font-medium text-sm mb-3">Leave History</h4>
                <div className="space-y-2">
                  {data.leaveRequests.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{l.date.split("T")[0]}</p>
                        <p className="text-xs text-muted-foreground">{l.type} — {l.reason || "No reason"}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        l.status === "APPROVED" ? "bg-emerald-100 text-emerald-700"
                          : l.status === "REJECTED" ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: {
  label: string; value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
