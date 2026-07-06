"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi, postApi } from "@/lib/api";
import { ChevronLeft, ChevronRight, Download, X, Gift, AlertTriangle, Save, ExternalLink, FileSpreadsheet, Check } from "lucide-react";
import * as XLSX from "xlsx";

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
  const router = useRouter();
  const [data, setData] = useState<GridData | null>(null);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<InternPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  // Unsaved edits, keyed `${internDbId}|${date}` → new status ("" = clear).
  // Nothing hits the API until "Save Attendance" is clicked.
  const [pending, setPending] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportTeam, setExportTeam] = useState<"all" | "ALPHA" | "CALL_CENTER">("all");
  const [exportRange, setExportRange] = useState<"current" | "selected" | "range">("current");
  const [exportFromMonth, setExportFromMonth] = useState(month);
  const [exportFromYear, setExportFromYear] = useState(year);
  const [exportToMonth, setExportToMonth] = useState(month);
  const [exportToYear, setExportToYear] = useState(year);
  const [exporting, setExporting] = useState(false);
  const [exportSheets, setExportSheets] = useState({
    grid: true,
    summary: true,
    teamwise: true,
    compLeave: true,
  });

  const loadData = () => {
    setLoading(true);
    fetchApi<GridData>(`/attendance?month=${month}&year=${year}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    setPending({});
    loadData();
    setExportFromMonth(month);
    setExportFromYear(year);
    setExportToMonth(month);
    setExportToYear(year);
  }, [month, year]);

  const openPreview = (internDbId: string) => {
    setPreviewLoading(true);
    setPreview(null);
    fetchApi<InternPreview>(`/attendance/intern/${internDbId}/preview?month=${month}&year=${year}`)
      .then((p) => setPreview(p))
      .finally(() => setPreviewLoading(false));
  };

  // Stage the change locally only — saved in one batch by saveAttendance().
  const handleStatusChange = (internDbId: string, date: string, status: string) => {
    setPending((p) => {
      const key = `${internDbId}|${date}`;
      const original = data?.grid.find((g) => g.id === internDbId)?.days[date] ?? "";
      const next = { ...p };
      if (status === original) delete next[key];
      else next[key] = status;
      return next;
    });
  };

  const pendingCount = Object.keys(pending).length;

  const saveAttendance = async () => {
    if (pendingCount === 0 || saving) return;
    setSaving(true);
    try {
      const records = Object.entries(pending).map(([key, status]) => {
        const [internId, date] = key.split("|");
        return { internId, date, status };
      });
      const res = await postApi<{ warnings?: string[] }>("/attendance/bulk", { records });
      if (res?.warnings?.length) {
        setWarning(res.warnings.join(" "));
        setTimeout(() => setWarning(null), 6000);
      }
      setPending({});
      loadData();
    } catch {
      setWarning("Failed to save attendance. Please try again.");
      setTimeout(() => setWarning(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getMonthsToExport = (): Array<{ m: number; y: number }> => {
    if (exportRange === "current") return [{ m: month, y: year }];
    if (exportRange === "selected") return [{ m: month, y: year }];
    const months: Array<{ m: number; y: number }> = [];
    let cm = exportFromMonth, cy = exportFromYear;
    while (cy < exportToYear || (cy === exportToYear && cm <= exportToMonth)) {
      months.push({ m: cm, y: cy });
      if (cm === 12) { cm = 1; cy++; } else { cm++; }
    }
    return months;
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const monthsToExport = getMonthsToExport();

      const allGrids: Array<GridData & { m: number; y: number }> = [];
      const failedMonths: string[] = [];

      for (const { m, y } of monthsToExport) {
        try {
          const d = await fetchApi<GridData>(`/attendance?month=${m}&year=${y}`);
          allGrids.push({ ...d, m, y });
        } catch {
          const mName = new Date(y, m - 1).toLocaleString("default", { month: "short" });
          failedMonths.push(`${mName} ${y}`);
        }
      }

      if (allGrids.length === 0) {
        setWarning(`Export failed — could not fetch data for ${failedMonths.join(", ")}. Check your connection.`);
        setTimeout(() => setWarning(null), 6000);
        setExporting(false);
        return;
      }

      if (failedMonths.length > 0) {
        setWarning(`Skipped ${failedMonths.join(", ")} (server error). Exported available months.`);
        setTimeout(() => setWarning(null), 6000);
      }

      const wb = XLSX.utils.book_new();

      for (const gridData of allGrids) {
        const mName = new Date(gridData.y, gridData.m - 1).toLocaleString("default", { month: "short" });
        const sheetSuffix = monthsToExport.length > 1 ? ` ${mName} ${gridData.y}` : "";

        const filteredGrid = exportTeam === "all"
          ? gridData.grid
          : gridData.grid.filter((i) =>
              exportTeam === "ALPHA" ? i.team === "ALPHA" : i.team !== "ALPHA"
            );

        const daysList = Array.from({ length: gridData.daysInMonth }, (_, i) => i + 1);

        if (exportSheets.grid) {
          const headers = ["#", "Name", "ID", "Team", ...daysList.map(String), "Present", "Absent", "Late", "Leave", "Rate %"];
          const rows = filteredGrid.map((intern, idx) => {
            const statuses = daysList.map((d) => {
              const date = `${gridData.y}-${String(gridData.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              return intern.days[date] || "";
            });
            return [
              idx + 1, intern.name, intern.internId, intern.team || "",
              ...statuses,
              intern.present, intern.absent, intern.late, intern.leave, intern.attendanceRate,
            ];
          });
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          ws["!cols"] = [
            { wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
            ...daysList.map(() => ({ wch: 4 })),
            { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 8 },
          ];
          const name = `Grid${sheetSuffix}`.slice(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, name);
        }

        if (exportSheets.teamwise) {
          const teams = [
            { key: "ALPHA", label: "Alpha" },
            { key: "CALL_CENTER", label: "CC" },
          ];
          for (const { key, label } of teams) {
            if (exportTeam !== "all" && exportTeam !== key) continue;
            const teamInterns = gridData.grid.filter((i) =>
              key === "ALPHA" ? i.team === "ALPHA" : i.team !== "ALPHA"
            );
            if (teamInterns.length === 0) continue;
            const headers = ["#", "Name", "ID", ...daysList.map(String), "Present", "Absent", "Rate %"];
            const rows = teamInterns.map((intern, idx) => {
              const statuses = daysList.map((d) => {
                const date = `${gridData.y}-${String(gridData.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                return intern.days[date] || "";
              });
              return [idx + 1, intern.name, intern.internId, ...statuses, intern.present, intern.absent, intern.attendanceRate];
            });
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            ws["!cols"] = [
              { wch: 4 }, { wch: 22 }, { wch: 12 },
              ...daysList.map(() => ({ wch: 4 })),
              { wch: 8 }, { wch: 8 }, { wch: 8 },
            ];
            const name = `${label}${sheetSuffix}`.slice(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, name);
          }
        }
      }

      if (exportSheets.summary) {
        const summaryHeaders = ["#", "Name", "ID", "Team", "Month", "Present", "Absent", "Late", "Leave", "Attendance %", "CL Earned", "CL Used", "CL Balance"];
        const summaryRows: (string | number)[][] = [];
        let idx = 0;
        for (const gridData of allGrids) {
          const mName = new Date(gridData.y, gridData.m - 1).toLocaleString("default", { month: "short" });
          const filteredGrid = exportTeam === "all"
            ? gridData.grid
            : gridData.grid.filter((i) =>
                exportTeam === "ALPHA" ? i.team === "ALPHA" : i.team !== "ALPHA"
              );
          for (const intern of filteredGrid) {
            idx++;
            summaryRows.push([
              idx, intern.name, intern.internId, intern.team || "",
              `${mName} ${gridData.y}`,
              intern.present, intern.absent, intern.late, intern.leave, intern.attendanceRate,
              intern.clEarned, intern.clUsed, intern.clBalance,
            ]);
          }
        }
        const totalPresent = summaryRows.reduce((s, r) => s + (r[5] as number), 0);
        const totalAbsent = summaryRows.reduce((s, r) => s + (r[6] as number), 0);
        const totalLate = summaryRows.reduce((s, r) => s + (r[7] as number), 0);
        const totalLeave = summaryRows.reduce((s, r) => s + (r[8] as number), 0);
        const avgRate = summaryRows.length > 0
          ? Math.round(summaryRows.reduce((s, r) => s + (r[9] as number), 0) / summaryRows.length)
          : 0;
        summaryRows.push([
          "", "TOTAL", "", "", "",
          totalPresent, totalAbsent, totalLate, totalLeave, avgRate,
          summaryRows.reduce((s, r) => s + (r[10] as number), 0),
          summaryRows.reduce((s, r) => s + (r[11] as number), 0),
          summaryRows.reduce((s, r) => s + (r[12] as number), 0),
        ]);
        const ws = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
        ws["!cols"] = [
          { wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
          { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 12 },
          { wch: 10 }, { wch: 10 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Summary");
      }

      if (exportSheets.compLeave) {
        const lastGrid = allGrids[allGrids.length - 1];
        const filteredGrid = exportTeam === "all"
          ? lastGrid.grid
          : lastGrid.grid.filter((i) =>
              exportTeam === "ALPHA" ? i.team === "ALPHA" : i.team !== "ALPHA"
            );
        const clHeaders = ["#", "Name", "ID", "Team", "CL Earned", "CL Used", "CL Balance", "Status"];
        const clRows = filteredGrid.map((intern, idx) => [
          idx + 1, intern.name, intern.internId, intern.team || "",
          intern.clEarned, intern.clUsed, intern.clBalance,
          intern.clBalance < 0 ? "OVERSPENT" : intern.clBalance > 0 ? "Available" : "Zero",
        ]);
        const ws = XLSX.utils.aoa_to_sheet([clHeaders, ...clRows]);
        ws["!cols"] = [
          { wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
          { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "Comp Leave");
      }

      const monthsToExp = getMonthsToExport();
      let fileName: string;
      if (monthsToExp.length === 1) {
        const mName = new Date(monthsToExp[0].y, monthsToExp[0].m - 1).toLocaleString("default", { month: "long" });
        fileName = `Attendance_${mName}_${monthsToExp[0].y}`;
      } else {
        const fromName = new Date(monthsToExp[0].y, monthsToExp[0].m - 1).toLocaleString("default", { month: "short" });
        const toName = new Date(monthsToExp[monthsToExp.length - 1].y, monthsToExp[monthsToExp.length - 1].m - 1).toLocaleString("default", { month: "short" });
        fileName = `Attendance_${fromName}-${toName}_${monthsToExp[0].y}${monthsToExp[monthsToExp.length - 1].y !== monthsToExp[0].y ? `-${monthsToExp[monthsToExp.length - 1].y}` : ""}`;
      }
      if (exportTeam !== "all") fileName += `_${exportTeam}`;
      fileName += ".xlsx";

      XLSX.writeFile(wb, fileName);
      setShowExport(false);
    } finally {
      setExporting(false);
    }
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
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
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
                    const key = `${intern.id}|${date}`;
                    const edited = key in pending;
                    const status = (edited ? pending[key] : intern.days[date]) as
                      | AttendanceStatus
                      | undefined
                      | "";
                    return (
                      <td key={date} className="px-0.5 py-2 text-center">
                        <select
                          value={status || ""}
                          onChange={(e) => handleStatusChange(intern.id, date, e.target.value)}
                          className={`w-7 h-5 rounded text-[10px] font-medium border appearance-none text-center cursor-pointer ${
                            status ? statusColors[status] : "bg-neutral-50 text-neutral-300 border-neutral-200"
                          } ${edited ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
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

      {/* Unsaved-changes bar — one bulk API call on Save */}
      {pendingCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-background border border-border rounded-xl shadow-xl">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{pendingCount}</span> unsaved change{pendingCount > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setPending({})}
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      )}

      {/* CL-balance warning toast */}
      {warning && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-2.5 max-w-sm px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl shadow-lg">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">{warning}</p>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowExport(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                <h3 className="font-bold text-lg">Export Attendance</h3>
              </div>
              <button onClick={() => setShowExport(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Date range selection */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Date Range</p>
              <div className="flex gap-1 bg-muted rounded-lg p-1 mb-3">
                {([["current", "Current Month"], ["selected", "Selected Month"], ["range", "From — To"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setExportRange(key as typeof exportRange)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      exportRange === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {exportRange === "current" && (
                <p className="text-sm text-muted-foreground px-1">
                  Exporting <span className="font-medium text-foreground">{monthName} {year}</span> (current view)
                </p>
              )}

              {exportRange === "selected" && (
                <div className="flex items-center gap-2 px-1">
                  <select
                    value={month}
                    disabled
                    className="text-sm border border-border rounded-lg px-3 py-2 bg-muted"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(2000, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    disabled
                    className="text-sm border border-border rounded-lg px-3 py-2 bg-muted"
                  >
                    <option value={year}>{year}</option>
                  </select>
                  <span className="text-xs text-muted-foreground ml-1">(uses current page selection)</span>
                </div>
              )}

              {exportRange === "range" && (
                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">From</span>
                    <select
                      value={exportFromMonth}
                      onChange={(e) => setExportFromMonth(Number(e.target.value))}
                      className="text-sm border border-border rounded-lg px-3 py-2 bg-background flex-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(2000, i).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={exportFromYear}
                      onChange={(e) => setExportFromYear(Number(e.target.value))}
                      className="text-sm border border-border rounded-lg px-3 py-2 bg-background w-24"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">To</span>
                    <select
                      value={exportToMonth}
                      onChange={(e) => setExportToMonth(Number(e.target.value))}
                      className="text-sm border border-border rounded-lg px-3 py-2 bg-background flex-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(2000, i).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={exportToYear}
                      onChange={(e) => setExportToYear(Number(e.target.value))}
                      className="text-sm border border-border rounded-lg px-3 py-2 bg-background w-24"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const months = getMonthsToExport();
                      return months.length > 0
                        ? `${months.length} month${months.length > 1 ? "s" : ""} — each month gets its own grid sheet`
                        : "Invalid range (from must be before to)";
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Team filter */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Team</p>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {([["all", "All Teams"], ["ALPHA", "Alpha"], ["CALL_CENTER", "Call Center"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setExportTeam(key as typeof exportTeam)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      exportTeam === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sheet selection */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Sheets to include</p>
              <div className="space-y-2">
                {([
                  ["grid", "Attendance Grid", "Full day-by-day grid with status codes (one per month)"],
                  ["summary", "Summary", "Consolidated stats per intern across all selected months"],
                  ["teamwise", "Team-wise Sheets", "Separate sheet for Alpha & Call Center (one per month)"],
                  ["compLeave", "Comp Leave", "Comp leave earned, used, and balance breakdown"],
                ] as const).map(([key, label, desc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setExportSheets((s) => ({ ...s, [key]: !s[key] }))}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-left w-full ${
                      exportSheets[key] ? "border-accent bg-accent/5" : "border-border hover:border-neutral-400"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      exportSheets[key] ? "bg-accent text-accent-foreground" : "border border-border"
                    }`}>
                      {exportSheets[key] && <Check size={12} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export button */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {getMonthsToExport().length} month{getMonthsToExport().length !== 1 ? "s" : ""}
                {" · "}
                {Object.values(exportSheets).filter(Boolean).length} sheet type{Object.values(exportSheets).filter(Boolean).length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={exportToExcel}
                disabled={!Object.values(exportSheets).some(Boolean) || exporting || getMonthsToExport().length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {exporting ? "Exporting…" : "Export .xlsx"}
              </button>
            </div>
          </div>
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
                    <h2
                      onClick={() => { setPreview(null); router.push(`/dashboard/interns/${preview.intern.id}`); }}
                      className="text-lg font-bold hover:underline cursor-pointer"
                    >
                      {preview.intern.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {preview.intern.internId} · {preview.intern.team}
                    </p>
                  </div>
                  <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-muted rounded-lg">
                    <X size={16} />
                  </button>
                </div>
                <button
                  onClick={() => { setPreview(null); router.push(`/dashboard/interns/${preview.intern.id}`); }}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink size={12} />
                  View full performance profile
                </button>

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
