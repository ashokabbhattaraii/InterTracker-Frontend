"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  Award,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi, putApi } from "@/lib/api";

interface DashboardData {
  totalInterns: number;
  teams: { alpha: number; callCenter: number; ea: number };
  present: number;
  absent: number;
  late: number;
  totalCallsToday: number;
  totalToursToday: number;
  alphaCallsToday: number;
  ccCallsToday: number;
  pendingLeaves: number;
  pendingLeavesList: Array<{
    id: string;
    date: string;
    type: string;
    reason: string;
    intern: { id: string; name: string };
  }>;
  notCheckedIn: Array<{ id: string; name: string; team: string }>;
  leaderboard: Array<{
    id: string;
    name: string;
    internId: string;
    team: string;
    totalCalls: number;
    totalTours: number;
    interested: number;
  }>;
  alphaLeaderboard: Array<{
    id: string;
    name: string;
    internId: string;
    team: string;
    totalCalls: number;
    totalTours: number;
    interested: number;
  }>;
  ccLeaderboard: Array<{
    id: string;
    name: string;
    internId: string;
    team: string;
    totalCalls: number;
    totalTours: number;
    interested: number;
  }>;
  todayCalls: Array<{ id: string; name: string; team: string; callsMade: number; interested: number; tours: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardView, setLeaderboardView] = useState<"all" | "alpha" | "cc">("all");

  useEffect(() => {
    fetchApi<DashboardData>("/dashboard").then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    await putApi(`/leaves/${id}/approve`);
    const updated = await fetchApi<DashboardData>("/dashboard");
    setData(updated);
  };

  const handleReject = async (id: string) => {
    await putApi(`/leaves/${id}/reject`);
    const updated = await fetchApi<DashboardData>("/dashboard");
    setData(updated);
  };

  const currentLeaderboard =
    leaderboardView === "alpha" ? data.alphaLeaderboard
      : leaderboardView === "cc" ? data.ccLeaderboard
      : data.leaderboard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview for today
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Present" value={data.present} subtext={`of ${data.totalInterns}`} color="text-success" />
        <StatCard icon={UserX} label="Absent" value={data.absent} subtext="today" color="text-danger" />
        <StatCard icon={Clock} label="Late" value={data.late} subtext="today" color="text-warning" />
        <StatCard icon={Users} label="Total Interns" value={data.totalInterns} subtext="active" color="text-foreground" />
      </div>

      {/* Team Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Layers size={14} />
            <span className="text-xs">Alpha Team</span>
          </div>
          <p className="text-xl font-bold">{data.teams.alpha}</p>
          <p className="text-xs text-muted-foreground">{data.alphaCallsToday} calls today</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Phone size={14} />
            <span className="text-xs">Call Center</span>
          </div>
          <p className="text-xl font-bold">{data.teams.callCenter + data.teams.ea}</p>
          <p className="text-xs text-muted-foreground">{data.ccCallsToday} calls today</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Phone size={14} />
            <span className="text-xs">Total Calls</span>
          </div>
          <p className="text-xl font-bold">{data.totalCallsToday}</p>
          <p className="text-xs text-muted-foreground">across all teams</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MapPin size={14} />
            <span className="text-xs">Tours Today</span>
          </div>
          <p className="text-xl font-bold">{data.totalToursToday}</p>
          <p className="text-xs text-muted-foreground">college visits</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText size={14} />
            <span className="text-xs">Pending Leaves</span>
          </div>
          <p className="text-xl font-bold">{data.pendingLeaves}</p>
          <p className="text-xs text-muted-foreground">awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard with team tabs */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Award size={16} />
              Monthly Leaderboard
            </h3>
          </div>
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
            {(["all", "alpha", "cc"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setLeaderboardView(v)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  leaderboardView === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "all" ? "All" : v === "alpha" ? "Alpha" : "Call Center"}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {currentLeaderboard.slice(0, 8).map((item, i) => (
              <div
                key={item.internId}
                onClick={() => router.push(`/dashboard/interns/${item.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-neutral-300 text-neutral-700" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate hover:underline">{item.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.team === "ALPHA" ? "Alpha" : "CC"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.totalCalls} calls · {item.interested} interested · {item.totalTours} tours</p>
                </div>
              </div>
            ))}
            {currentLeaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data for this team yet</p>
            )}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText size={16} />
              Pending Leave Requests
            </h3>
            <span className="text-xs text-muted-foreground">{data.pendingLeaves} pending</span>
          </div>
          {data.pendingLeavesList.length > 0 ? (
            <div className="space-y-3">
              {data.pendingLeavesList.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p
                      onClick={() => router.push(`/dashboard/interns/${leave.intern.id}`)}
                      className="text-sm font-medium hover:underline cursor-pointer"
                    >
                      {leave.intern.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leave.date.split("T")[0]} — {leave.type} — {leave.reason || "No reason"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(leave.id)} className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:bg-neutral-800 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleReject(leave.id)} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending requests</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Not checked in */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp size={16} />
              Not Checked In
            </h3>
            <span className="text-xs text-danger font-medium">{data.notCheckedIn.length} missing</span>
          </div>
          {data.notCheckedIn.length > 0 ? (
            <div className="space-y-2">
              {data.notCheckedIn.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/dashboard/interns/${item.id}`)}
                  className="flex items-center gap-3 p-3 bg-danger/5 border border-danger/10 rounded-lg cursor-pointer hover:bg-danger/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center">
                    <UserX size={14} className="text-danger" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium hover:underline">{item.name}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    item.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {item.team === "ALPHA" ? "Alpha" : "CC"}
                  </span>
                </div>
              ))}
              {data.notCheckedIn.length > 10 && (
                <p className="text-xs text-muted-foreground">+{data.notCheckedIn.length - 10} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All interns checked in</p>
          )}
        </div>

        {/* Today's call activity */}
        <div className="bg-background border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Phone size={16} />
            Today&apos;s Call Activity
          </h3>
          {data.todayCalls.length > 0 ? (
            <div className="space-y-2">
              {data.todayCalls.map((log) => (
                <div
                  key={log.id}
                  onClick={() => router.push(`/dashboard/interns/${log.id}`)}
                  className="flex items-center justify-between p-2.5 text-sm rounded-lg hover:bg-muted/30 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium hover:underline">{log.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      log.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {log.team === "ALPHA" ? "Alpha" : "CC"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-bold text-sm text-foreground">{log.callsMade}</span>
                    {log.interested > 0 && <span className="text-emerald-600">{log.interested} int.</span>}
                    {log.tours > 0 && <span className="text-blue-600">{log.tours} tours</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No calls logged yet today</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: number; subtext: string; color: string;
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className={color} />
        <span className="text-xs text-muted-foreground">{subtext}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
