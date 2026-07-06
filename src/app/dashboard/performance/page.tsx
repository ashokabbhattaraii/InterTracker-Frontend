"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import {
  BS_MONTHS,
  getCurrentNepaliDate,
  formatNepaliDateFull,
} from "@/lib/nepali-date";

interface WeekData {
  weekNum: number;
  label: string;
  startDay: number;
  endDay: number;
  adStart: string;
  adEnd: string;
  bsMonth: string;
  bsYear: number;
  totals: {
    calls: number;
    received: number;
    interested: number;
    tours: number;
    hours: number;
    attendanceRate: number | null;
  };
  interns: Array<{
    id: string;
    internId: string;
    name: string;
    team: string;
    callsMade: number;
    callsReceived: number;
    interested: number;
    tours: number;
    hours: number;
    daysWorked: number;
    present: number;
    absent: number;
    late: number;
    expectedDays: number;
    avgCallsPerDay: number;
    attendanceRate: number | null;
  }>;
}

interface WeeklyResponse {
  bsYear: number;
  bsMonth: number;
  bsMonthName: string;
  weeks: WeekData[];
}

interface MonthData {
  bsMonth: number;
  bsMonthName: string;
  bsYear: number;
  adStart: string;
  adEnd: string;
  totals: {
    calls: number;
    received: number;
    interested: number;
    tours: number;
    hours: number;
    attendanceRate: number | null;
  };
  interns: Array<{
    id: string;
    internId: string;
    name: string;
    team: string;
    callsMade: number;
    callsReceived: number;
    interested: number;
    tours: number;
    hours: number;
    daysWorked: number;
    present: number;
    expectedDays: number;
    avgCallsPerDay: number;
    attendanceRate: number | null;
  }>;
}

interface MonthlyResponse {
  bsYear: number;
  currentMonth: number;
  months: MonthData[];
}

export default function PerformancePage() {
  const router = useRouter();
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const now = getCurrentNepaliDate();
  const [bsYear, setBsYear] = useState(now.year);
  const [bsMonth, setBsMonth] = useState(now.month);

  useEffect(() => {
    setLoading(true);
    const teamParam = teamFilter !== "ALL" ? `&team=${teamFilter}` : "";

    if (view === "weekly") {
      fetchApi<WeeklyResponse>(
        `/performance/weekly?bsYear=${bsYear}&bsMonth=${bsMonth}${teamParam}`,
      ).then((d) => {
        setWeeklyData(d);
        setLoading(false);
      });
    } else {
      fetchApi<MonthlyResponse>(
        `/performance/monthly?bsYear=${bsYear}${teamParam}`,
      ).then((d) => {
        setMonthlyData(d);
        setLoading(false);
      });
    }
  }, [view, bsYear, bsMonth, teamFilter]);

  function prevMonth() {
    if (bsMonth === 1) {
      setBsMonth(12);
      setBsYear(bsYear - 1);
    } else {
      setBsMonth(bsMonth - 1);
    }
  }

  function nextMonth() {
    if (bsMonth === 12) {
      setBsMonth(1);
      setBsYear(bsYear + 1);
    } else {
      setBsMonth(bsMonth + 1);
    }
  }

  const todayBS = getCurrentNepaliDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Nepali Calendar (B.S.) — Today: {formatNepaliDateFull(todayBS)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background"
          >
            <option value="ALL">All Teams</option>
            <option value="ALPHA">Alpha</option>
            <option value="CALL_CENTER">Call Center</option>
            <option value="EA">EA</option>
          </select>
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setView("weekly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "weekly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Navigator */}
      {view === "weekly" && (
        <div className="flex items-center justify-between bg-background border border-border rounded-xl px-5 py-3">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold text-lg">
              {BS_MONTHS[bsMonth - 1]} {bsYear}
            </p>
            <p className="text-xs text-muted-foreground">
              Nepali Month {bsMonth} of 12
            </p>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={bsYear === todayBS.year && bsMonth >= todayBS.month}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {view === "monthly" && (
        <div className="flex items-center justify-between bg-background border border-border rounded-xl px-5 py-3">
          <button
            onClick={() => setBsYear(bsYear - 1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold text-lg">B.S. {bsYear}</p>
            <p className="text-xs text-muted-foreground">
              Yearly Performance Overview
            </p>
          </div>
          <button
            onClick={() => setBsYear(bsYear + 1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={bsYear >= todayBS.year}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      )}

      {/* WEEKLY VIEW */}
      {!loading && view === "weekly" && weeklyData && (
        <div className="space-y-4">
          {/* Note about attendance tracking */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium">Attendance tracked from Asadh 1, 2082 (June 15, 2025)</p>
            <p className="text-xs mt-1 text-blue-600">
              Call performance is tracked from the beginning. Attendance rate only appears for weeks on or after Asadh 1.
            </p>
          </div>

          {weeklyData.weeks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No data available for this month.
            </div>
          )}

          {weeklyData.weeks.map((week) => (
            <div
              key={week.weekNum}
              className="bg-background border border-border rounded-xl overflow-hidden"
            >
              {/* Week Header */}
              <button
                onClick={() =>
                  setExpandedWeek(
                    expandedWeek === week.weekNum ? null : week.weekNum,
                  )
                }
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-accent-foreground">
                      W{week.weekNum}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{week.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {week.adStart} to {week.adEnd}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <StatPill icon={Phone} value={week.totals.calls} label="Calls" />
                  <StatPill
                    icon={TrendingUp}
                    value={week.totals.interested}
                    label="Interested"
                  />
                  <StatPill icon={MapPin} value={week.totals.tours} label="Tours" />
                  <StatPill icon={Clock} value={`${week.totals.hours}h`} label="Hours" />
                  {week.totals.attendanceRate !== null && (
                    <StatPill
                      icon={Calendar}
                      value={`${week.totals.attendanceRate}%`}
                      label="Attendance"
                      color={
                        week.totals.attendanceRate >= 85
                          ? "text-emerald-600"
                          : week.totals.attendanceRate >= 70
                            ? "text-amber-600"
                            : "text-red-600"
                      }
                    />
                  )}
                  <ChevronRight
                    size={16}
                    className={`text-muted-foreground transition-transform ${
                      expandedWeek === week.weekNum ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Intern Table */}
              {expandedWeek === week.weekNum && (
                <div className="border-t border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Intern
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Team
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Calls
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Received
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Interested
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Tours
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Avg/Day
                        </th>
                        <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                          Days
                        </th>
                        {week.totals.attendanceRate !== null && (
                          <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                            Attendance
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {week.interns.map((intern, i) => (
                        <tr
                          key={intern.id}
                          onClick={() => router.push(`/dashboard/interns/${intern.id}`)}
                          className="border-t border-border/50 hover:bg-muted/20 cursor-pointer"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-5">
                                {i + 1}
                              </span>
                              <span className="font-medium hover:underline">
                                {intern.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <TeamBadge team={intern.team} />
                          </td>
                          <td className="px-3 py-3 text-center font-semibold">
                            {intern.callsMade}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {intern.callsReceived}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {intern.interested > 0 ? (
                              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                {intern.interested}
                              </span>
                            ) : (
                              "0"
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">{intern.tours}</td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={
                                intern.avgCallsPerDay >= 15
                                  ? "text-emerald-600 font-medium"
                                  : intern.avgCallsPerDay >= 10
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }
                            >
                              {intern.avgCallsPerDay}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {intern.daysWorked}
                          </td>
                          {week.totals.attendanceRate !== null && (
                            <td className="px-3 py-3 text-center">
                              {intern.attendanceRate !== null ? (
                                <span
                                  className={`font-medium ${
                                    intern.attendanceRate >= 85
                                      ? "text-emerald-600"
                                      : intern.attendanceRate >= 70
                                        ? "text-amber-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {intern.attendanceRate}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {week.interns.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-5 py-8 text-center text-muted-foreground"
                          >
                            No activity recorded this week.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MONTHLY VIEW */}
      {!loading && view === "monthly" && monthlyData && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium">Attendance tracked from Asadh 1, 2082 (June 15, 2025)</p>
            <p className="text-xs mt-1 text-blue-600">
              Call performance is tracked from the beginning. Attendance rate appears only for months from Asadh onward.
            </p>
          </div>

          {monthlyData.months.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No data available for this year.
            </div>
          )}

          {/* Monthly summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyData.months.map((m) => (
              <button
                key={m.bsMonth}
                onClick={() =>
                  setExpandedMonth(expandedMonth === m.bsMonth ? null : m.bsMonth)
                }
                className={`bg-background border rounded-xl p-4 text-left transition-all hover:shadow-md ${
                  expandedMonth === m.bsMonth
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border"
                } ${m.bsMonth === todayBS.month && m.bsYear === todayBS.year ? "ring-2 ring-accent" : ""}`}
              >
                <p className="text-xs text-muted-foreground font-medium">
                  {m.bsMonthName} {m.bsYear}
                </p>
                <p className="text-xl font-bold mt-1">
                  {m.totals.calls.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">calls</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-emerald-600">{m.totals.interested} int.</span>
                  <span>{m.totals.tours} tours</span>
                  {m.totals.attendanceRate !== null && (
                    <span
                      className={
                        m.totals.attendanceRate >= 85
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {m.totals.attendanceRate}% att.
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Expanded month detail */}
          {expandedMonth !== null && (
            <div className="bg-background border border-border rounded-xl overflow-hidden">
              {(() => {
                const month = monthlyData.months.find(
                  (m) => m.bsMonth === expandedMonth,
                );
                if (!month) return null;
                return (
                  <>
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">
                          {month.bsMonthName} {month.bsYear} — Performance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AD: {month.adStart} to {month.adEnd}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatPill
                          icon={Phone}
                          value={month.totals.calls}
                          label="Calls"
                        />
                        <StatPill
                          icon={TrendingUp}
                          value={month.totals.interested}
                          label="Interested"
                        />
                        <StatPill
                          icon={MapPin}
                          value={month.totals.tours}
                          label="Tours"
                        />
                        {month.totals.attendanceRate !== null && (
                          <StatPill
                            icon={Calendar}
                            value={`${month.totals.attendanceRate}%`}
                            label="Attendance"
                            color={
                              month.totals.attendanceRate >= 85
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                              Intern
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Team
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Calls
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Received
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Interested
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Tours
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Hours
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Avg/Day
                            </th>
                            <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                              Days
                            </th>
                            {month.totals.attendanceRate !== null && (
                              <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                                Attendance
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {month.interns.map((intern, i) => (
                            <tr
                              key={intern.id}
                              onClick={() => router.push(`/dashboard/interns/${intern.id}`)}
                              className="border-t border-border/50 hover:bg-muted/20 cursor-pointer"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-5">
                                    {i + 1}
                                  </span>
                                  <span className="font-medium hover:underline">
                                    {intern.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <TeamBadge team={intern.team} />
                              </td>
                              <td className="px-3 py-3 text-center font-semibold">
                                {intern.callsMade}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {intern.callsReceived}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {intern.interested > 0 ? (
                                  <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                    {intern.interested}
                                  </span>
                                ) : (
                                  "0"
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {intern.tours}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {intern.hours}h
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span
                                  className={
                                    intern.avgCallsPerDay >= 15
                                      ? "text-emerald-600 font-medium"
                                      : intern.avgCallsPerDay >= 10
                                        ? "text-amber-600"
                                        : "text-red-600"
                                  }
                                >
                                  {intern.avgCallsPerDay}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-muted-foreground">
                                {intern.daysWorked}
                              </td>
                              {month.totals.attendanceRate !== null && (
                                <td className="px-3 py-3 text-center">
                                  {intern.attendanceRate !== null ? (
                                    <span
                                      className={`font-medium ${
                                        intern.attendanceRate >= 85
                                          ? "text-emerald-600"
                                          : intern.attendanceRate >= 70
                                            ? "text-amber-600"
                                            : "text-red-600"
                                      }`}
                                    >
                                      {intern.attendanceRate}%
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                          {month.interns.length === 0 && (
                            <tr>
                              <td
                                colSpan={10}
                                className="px-5 py-8 text-center text-muted-foreground"
                              >
                                No activity recorded this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="hidden lg:flex items-center gap-1.5">
      <Icon size={13} className="text-muted-foreground" />
      <span className={`text-sm font-semibold ${color || ""}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function TeamBadge({ team }: { team: string }) {
  const style =
    team === "ALPHA"
      ? "bg-violet-100 text-violet-700"
      : team === "CALL_CENTER"
        ? "bg-sky-100 text-sky-700"
        : "bg-amber-100 text-amber-700";
  const label =
    team === "ALPHA" ? "Alpha" : team === "CALL_CENTER" ? "CC" : "EA";
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${style}`}>
      {label}
    </span>
  );
}
