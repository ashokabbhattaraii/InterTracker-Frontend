"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Mail, Phone, Clock, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Intern {
  id: string;
  internId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  team: string;
  shift: string;
  joinDate: string | null;
  supervisor: string | null;
  active: boolean;
}

export default function InternsPage() {
  const router = useRouter();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<"all" | "ALPHA" | "CALL_CENTER">("all");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<Intern[]>("/interns").then((d) => {
      setInterns(d);
      setLoading(false);
    });
  }, []);

  const filtered = interns.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.internId.toLowerCase().includes(search.toLowerCase()) ||
      (i.email && i.email.toLowerCase().includes(search.toLowerCase()));
    const matchesTeam =
      teamFilter === "all" ||
      i.team === teamFilter ||
      (teamFilter === "CALL_CENTER" && i.team === "EA");
    return matchesSearch && matchesTeam;
  });

  const alphaCount = interns.filter((i) => i.team === "ALPHA").length;
  const ccCount = interns.filter((i) => i.team === "CALL_CENTER" || i.team === "EA").length;

  if (loading) {
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
          <h1 className="text-2xl font-bold">Intern Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {interns.length} active — {alphaCount} Alpha · {ccCount} Call Center
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus size={14} />
          Add Intern
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {([["all", "All"], ["ALPHA", "Alpha"], ["CALL_CENTER", "Call Center"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTeamFilter(key as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                teamFilter === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((intern) => (
                  <tr
                    key={intern.id}
                    onClick={() => setSelectedIntern(intern)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      selectedIntern?.id === intern.id ? "bg-muted" : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{intern.internId}</td>
                    <td className="px-4 py-3 font-medium">{intern.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        intern.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {intern.team === "ALPHA" ? "Alpha" : intern.team === "EA" ? "EA" : "Call Center"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{intern.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        intern.role === "SUPERVISOR" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {intern.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No interns match your search</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedIntern ? (
            <div className="bg-background border border-border rounded-xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                  {selectedIntern.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{selectedIntern.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{selectedIntern.internId}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      selectedIntern.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedIntern.team === "ALPHA" ? "Alpha" : "Call Center"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {selectedIntern.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={14} className="text-muted-foreground" />
                    <span className="truncate">{selectedIntern.email}</span>
                  </div>
                )}
                {selectedIntern.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>{selectedIntern.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-muted-foreground" />
                  <span>{selectedIntern.shift}</span>
                </div>
                <hr className="border-border" />
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-medium">{selectedIntern.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team</span>
                    <span className="font-medium">{selectedIntern.team === "ALPHA" ? "Alpha" : selectedIntern.team === "EA" ? "EA" : "Call Center"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{selectedIntern.joinDate?.split("T")[0] || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supervisor</span>
                    <span className="font-medium">{selectedIntern.supervisor || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${selectedIntern.active ? "text-emerald-600" : "text-red-600"}`}>
                      {selectedIntern.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/interns/${selectedIntern.id}`)}
                  className="w-full mt-4 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} />
                  View Performance
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-background border border-border rounded-xl p-6 text-center text-muted-foreground">
              <p className="text-sm">Select an intern to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
