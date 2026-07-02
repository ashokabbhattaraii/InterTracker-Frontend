"use client";

import { useEffect, useState } from "react";
import { fetchApi, postApi } from "@/lib/api";
import { ChevronLeft, ChevronRight, Download, X, Gift, AlertTriangle } from "lucide-react";

type AttendanceStatus = "P" | "A" | "L" | "HD" | "AL" | "UL" | "CL" | "ND";

const statusColors: Record<AttendanceStatus, string> = {
  P: "bg-emerald-100 text-emerald-700 border-emerald-200",
  A: "bg-red-100 text-red-700 border-red-200",
  L: "bg-amber-100 text-amber-700 border-amber-200",
  HD: "bg-amber-50 text-amber-600 border-amber-200",
  AL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  UL: "bg-red-50 text-red-600 border-red-200",
  CL: "bg-blue-100 text-blue-700 border-blue-200",
  ND: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

interface GridRow {
  id: string;
  internId: string;
  name: string;
  team?: string;
  days: Record<string, string>;
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  clEarned: number;
  clUsed: number;
  clBalance: number;
}

interface GridData {
  month: number;
  year: number;
  daysInMonth: number;
  grid: GridRow[];
}

interface InternPreview {
  intern: { id: string; internId: string; name: string; team: string };
  month: number;
  year: number;
  breakdown: Record<string, number>;
  compLeave: {
    earned: number;
    used: number;
    balance: number;
    eligibleExtraLeave: boolean;
    earningSaturdays: string[];
  };
  flags: string[];
}

export default function AttendancePage() {
  const [data, setData] = useState<GridData | null>(null);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<InternPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchApi<GridData>(`/attendance?month=${month}&year=${year}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [month, year]);

  const openPreview = (internDbId: string) => {
    setPreviewLoading(true);
    setPreview(null);
    fetchApi<InternPreview>(`/attendance/intern/${internDbId}/preview?month=${month}&year=${year}`)
      .then((p) => setPreview(p))
      .finally(() => setPreviewLoading(false));
  };

  const handleStatusChange = async (internDbId: string, date: string, status: string) => {
    const res = await postApi<{ warning?: string | null }>("/attendance", {
      internId: internDbId,
      date,
      status,
    });
    if (res?.warning) {
      setWarning(res.warning);
      setTimeout(() => setWarning(null), 5000);
    }
    loadData();
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const days = Array.from({ length: data.daysInMonth }, (_, i) => {
    const d = i + 1;
    return { day: d, date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Grid</h1>
          <p className="text-muted-foreground text-sm mt-1">Monthly attendance view — {monthName} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-lg">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-l-lg transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-sm font-medium">{monthName} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-r-lg transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(statusColors).map(([code, cls]) => (
          <div key={code} className="flex items-center gap-1.5">
            <span className={`inline-block w-6 h-5 rounded text-center leading-5 text-[10px] font-medium border ${cls}`}>{code}</span>
            <span className="text-muted-foreground">
              {code === "P" && "Present"}{code === "A" && "Absent"}{code === "L" && "Late"}
              {code === "HD" && "Half Day"}{code === "AL" && "Approved Leave"}
              {code === "UL" && "Unapproved Leave"}{code === "CL" && "Comp Leave"}{code === "ND" && "No Duty"}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 bg-background z-10 text-left px-4 py-3 font-medium text-muted-foreground min-w-[140px]">Intern</th>
                {days.map(({ day }) => (
                  <th key={day} className="px-1 py-3 font-medium text-muted-foreground text-center min-w-[32px]">{day}</th>
                ))}
                <th className="px-3 py-3 font-medium text-muted-foreground text-center min-w-[40px]">%</th>
                <th className="px-3 py-3 font-medium text-blue-600 text-center min-w-[44px]" title="Comp Leave balance (earned − used)">CL</th>
              </tr>
            </thead>
            <tbody>
              {data.grid.map((intern) => (
                <tr key={intern.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="sticky left-0 bg-background z-10 px-4 py-2 font-medium whitespace-nowrap">
                    <button
                      onClick={() => openPreview(intern.id)}
                      className="text-left hover:text-accent transition-colors group"
                    >
                      <span className="text-sm group-hover:underline">{intern.name}</span>
                      <span className="block text-muted-foreground text-[10px]">{intern.internId}</span>
                    </button>
                  </td>
                  {days.map(({ date }) => {
                    const status = intern.days[date] as AttendanceStatus | undefined;
                    return (
                      <td key={date} className="px-0.5 py-2 text-center">
                        <select
                          value={status || ""}
                          onChange={(e) => handleStatusChange(intern.id, date, e.target.value)}
                          className={`w-7 h-5 rounded text-[10px] font-medium border appearance-none text-center cursor-pointer ${
                            status ? statusColors[status] : "bg-neutral-50 text-neutral-300 border-neutral-200"
                          }`}
                        >
                          <option value="">—</option>
                          {(Object.keys(statusColors) as AttendanceStatus[]).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold text-sm ${
                      intern.attendanceRate >= 90 ? "text-emerald-600" : intern.attendanceRate >= 80 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {intern.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      title={`Earned ${intern.clEarned} · Used ${intern.clUsed}`}
                      className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        intern.clBalance > 0
                          ? "bg-blue-100 text-blue-700"
                          : intern.clBalance < 0
                          ? "bg-red-100 text-red-700"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {intern.clBalance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CL-balance warning toast */}
      {warning && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-2.5 max-w-sm px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl shadow-lg">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">{warning}</p>
        </div>
      )}

      {/* Intern preview drawer */}
      {(preview || previewLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setPreview(null); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-background h-full shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewLoading || !preview ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{preview.intern.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {preview.intern.internId} · {preview.intern.team}
                    </p>
                  </div>
                  <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-muted rounded-lg">
                    <X size={16} />
                  </button>
                </div>

                {/* Comp leave */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
                    <Gift size={15} className="text-blue-600" />
                    <span className="text-sm font-semibold">Comp Leave</span>
                    {preview.compLeave.eligibleExtraLeave && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Eligible for extra leave
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-border text-center">
                    <div className="py-3">
                      <p className="text-xl font-bold text-emerald-600">{preview.compLeave.earned}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
                    </div>
                    <div className="py-3">
                      <p className="text-xl font-bold text-amber-600">{preview.compLeave.used}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Used</p>
                    </div>
                    <div className="py-3">
                      <p className={`text-xl font-bold ${preview.compLeave.balance > 0 ? "text-blue-600" : preview.compLeave.balance < 0 ? "text-red-600" : "text-neutral-400"}`}>
                        {preview.compLeave.balance}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
                    </div>
                  </div>
                  {preview.compLeave.earningSaturdays.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-border">
                      <p className="text-[10px] text-muted-foreground mb-1">Earned by working Saturdays:</p>
                      <div className="flex flex-wrap gap-1">
                        {preview.compLeave.earningSaturdays.map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status breakdown */}
                <div>
                  <p className="text-sm font-semibold mb-2">
                    This month ({preview.month}/{preview.year})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.breakdown).length === 0 && (
                      <span className="text-xs text-muted-foreground">No attendance data this month.</span>
                    )}
                    {Object.entries(preview.breakdown).map(([code, count]) => (
                      <div
                        key={code}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                          statusColors[code as AttendanceStatus] ?? "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}
                      >
                        <span className="font-bold">{code}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div>
                  <p className="text-sm font-semibold mb-2">Pattern flags</p>
                  {preview.flags.length === 0 ? (
                    <p className="text-xs text-emerald-600">No concerning patterns detected.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {preview.flags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
