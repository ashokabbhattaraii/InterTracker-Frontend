"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, X, Filter } from "lucide-react";
import { fetchApi, putApi } from "@/lib/api";

interface LeaveRequest {
  id: string;
  internId: string;
  date: string;
  type: string;
  reason: string | null;
  status: string;
  appliedOn: string;
  intern: { id: string; internId: string; name: string };
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadLeaves = () => {
    setLoading(true);
    fetchApi<LeaveRequest[]>(`/leaves?status=${filter}`).then((d) => {
      setLeaves(d);
      setLoading(false);
    });
  };

  useEffect(() => { loadLeaves(); }, [filter]);

  const handleApprove = async (id: string) => {
    await putApi(`/leaves/${id}/approve`);
    loadLeaves();
  };

  const handleReject = async (id: string) => {
    await putApi(`/leaves/${id}/reject`);
    loadLeaves();
  };

  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;
  const rejected = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage intern leave requests</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-warning">{pending}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Approved</p>
          <p className="text-2xl font-bold text-success">{approved}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Rejected</p>
          <p className="text-2xl font-bold text-danger">{rejected}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold">{leaves.length}</p>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <div className="flex gap-1">
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No leave requests found</div>
        ) : (
          <div className="divide-y divide-border/50">
            {leaves.map((leave) => (
              <div key={leave.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {leave.intern.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{leave.intern.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.date.split("T")[0]} · {leave.type} · Applied {leave.appliedOn.split("T")[0]}
                    </p>
                    {leave.reason && <p className="text-xs text-muted-foreground mt-0.5">{leave.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {leave.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(leave.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => handleReject(leave.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                      leave.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {leave.status === "APPROVED" ? <Check size={12} /> : <X size={12} />}
                      {leave.status.charAt(0) + leave.status.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
