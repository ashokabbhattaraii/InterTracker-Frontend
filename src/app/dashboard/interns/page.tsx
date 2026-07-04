"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, AlertTriangle, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface InternStatus {
  id: string;
  internId: string;
  name: string;
  team: string;
  category: "RED" | "YELLOW" | "GREEN";
  reasons: string[];
  flags: string[];
  attendanceRate: number;
  monthCalls: number;
  avgCallsPerDay: number;
  daysWorked: number;
  leaveCount: number;
  unapprovedLeaves: number;
  clEarned: number;
  clUsed: number;
  clBalance: number;
}

interface StatusResponse {
  month: number;
  year: number;
  targets: { minCallsPerDay: number; minAttendanceRate: number };
  summary: { red: number; yellow: number; green: number };
  interns: InternStatus[];
}

const CATEGORY_STYLE = {
  RED: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", label: "Needs Action" },
  YELLOW: { dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700", label: "Watch" },
  GREEN: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", label: "On Track" },
} as const;

export default function InternsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<"all" | "ALPHA" | "CALL_CENTER">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "RED" | "YELLOW" | "GREEN">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<StatusResponse>("/interns/status").then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const interns = data?.interns ?? [];

  const filtered = interns.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.internId.toLowerCase().includes(search.toLowerCase());
    const matchesTeam =
      teamFilter === "all" ||
      i.team === teamFilter ||
      (teamFilter === "CALL_CENTER" && i.team === "EA");
    const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
    return matchesSearch && matchesTeam && matchesCategory;
  });

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intern Status Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {interns.length} active — KPI: {data.targets.minCallsPerDay} calls/day ·{" "}
            {data.targets.minAttendanceRate}% attendance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus size={14} />
          Add Intern
        </button>
      </div>

      {/* RAG summary cards — click to filter */}
      <div className="grid grid-cols-3 gap-4">
        {(["RED", "YELLOW", "GREEN"] as const).map((cat) => {
          const count =
            cat === "RED" ? data.summary.red : cat === "YELLOW" ? data.summary.yellow : data.summary.green;
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(active ? "all" : cat)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active ? "border-foreground shadow-sm bg-background" : "border-border bg-background hover:border-neutral-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_STYLE[cat].dot}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {CATEGORY_STYLE[cat].label}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {cat === "RED" ? "Take action now" : cat === "YELLOW" ? "Keep an eye on" : "Going well"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intern by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {([["all", "All"], ["ALPHA", "Alpha"], ["CALL_CENTER", "Call Center"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTeamFilter(key as typeof teamFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                teamFilter === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Attendance</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Avg Calls/Day</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Leaves</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">CL Balance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Why</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((intern) => {
                const style = CATEGORY_STYLE[intern.category];
                return (
                  <tr
                    key={intern.id}
                    onClick={() => router.push(`/dashboard/interns/${intern.id}`)}
                    className="border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{intern.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{intern.internId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        intern.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {intern.team === "ALPHA" ? "Alpha" : intern.team === "EA" ? "EA" : "Call Center"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{intern.attendanceRate}%</td>
                    <td className="px-4 py-3 text-center">{intern.avgCallsPerDay}</td>
                    <td className="px-4 py-3 text-center">
                      {intern.leaveCount}
                      {intern.unapprovedLeaves > 0 && (
                        <span className="ml-1 text-[10px] text-red-600 font-medium">
                          ({intern.unapprovedLeaves} unappr.)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={intern.clBalance < 0 ? "text-red-600 font-medium" : ""}>
                        {intern.clBalance}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        {intern.category !== "GREEN" && (
                          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                        )}
                        <span className="truncate" title={[...intern.reasons, ...intern.flags].join(" · ")}>
                          {[...intern.reasons, ...intern.flags].join(" · ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ExternalLink size={14} className="text-muted-foreground inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No interns match your search</div>
        )}
      </div>
    </div>
  );
}
