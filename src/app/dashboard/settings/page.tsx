"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Bell, Clock, Target, Users, Shield } from "lucide-react";
import { fetchApi, postApi } from "@/lib/api";

interface Intern {
  id: string;
  internId: string;
  name: string;
  team: string;
}

interface RosterEntry {
  id: string;
  internId: string;
  date: string;
}

// All Saturdays (yyyy-mm-dd) in the given month/year, UTC-based.
function saturdaysOf(year: number, month0: number): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(year, month0, 1));
  while (d.getUTCMonth() === month0) {
    if (d.getUTCDay() === 6) out.push(d.toISOString().split("T")[0]);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export default function SettingsPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [notifications, setNotifications] = useState([
    { key: "late", label: "Late check-in alerts", description: "When intern checks in after shift start", enabled: true },
    { key: "absent", label: "Absent without leave", description: "Intern marked absent without prior request", enabled: true },
    { key: "pattern", label: "Leave pattern detection", description: "Flag repeated same-day absences", enabled: true },
    { key: "kpi", label: "KPI below target", description: "After 3 consecutive days below target", enabled: false },
    { key: "pending", label: "Pending leave reminder", description: "Leave request pending 24+ hours", enabled: true },
  ]);

  const now = new Date();
  const [rosterMonth] = useState(now.getMonth());
  const [rosterYear] = useState(now.getFullYear());
  const saturdays = useMemo(() => saturdaysOf(rosterYear, rosterMonth), [rosterYear, rosterMonth]);
  const [selectedSat, setSelectedSat] = useState<string>("");
  const [rosteredIds, setRosteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApi<Intern[]>("/interns").then(setInterns);
  }, []);

  useEffect(() => {
    if (!selectedSat && saturdays.length) setSelectedSat(saturdays[0]);
  }, [saturdays, selectedSat]);

  useEffect(() => {
    if (!selectedSat) return;
    fetchApi<RosterEntry[]>(`/attendance/roster?month=${rosterMonth + 1}&year=${rosterYear}`)
      .then((rows) =>
        setRosteredIds(new Set(rows.filter((r) => r.date === selectedSat).map((r) => r.internId))),
      )
      .catch(() => setRosteredIds(new Set()));
  }, [selectedSat, rosterMonth, rosterYear]);

  const toggleRoster = async (internId: string) => {
    const rostered = !rosteredIds.has(internId);
    setRosteredIds((prev) => {
      const next = new Set(prev);
      if (rostered) next.add(internId);
      else next.delete(internId);
      return next;
    });
    await postApi("/attendance/roster", { internId, date: selectedSat, rostered }).catch(() => {});
  };

  const toggleNotification = (key: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">System configuration and KPI targets</p>
      </div>

      {/* KPI Targets */}
      <section className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2.5 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Target size={16} className="text-accent" />
            </div>
            KPI Targets
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Minimum Calls Per Day" value={15} hint="Daily target for each intern" />
            <InputField label="Minimum Visits Booked Per Week" value={10} hint="Weekly interested visits target" />
            <InputField label="Minimum Tours Per Month" value={5} hint="Monthly tours target" />
            <InputField label="Minimum Attendance Rate (%)" value={85} hint="Required attendance percentage" />
          </div>
        </div>
      </section>

      {/* Shift Settings */}
      <section className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2.5 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock size={16} className="text-accent" />
            </div>
            Shift Settings
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Late Threshold (minutes)" value={15} hint="Auto-mark as Late if check-in exceeds this" />
            <InputField label="Session Timeout (minutes)" value={30} hint="Auto-logout after inactivity" />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2.5 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bell size={16} className="text-accent" />
            </div>
            Notifications
          </h3>
        </div>
        <div className="divide-y divide-border">
          {notifications.map((setting) => (
            <div key={setting.key} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium">{setting.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
              </div>
              <button
                onClick={() => toggleNotification(setting.key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  setting.enabled ? "bg-accent" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    setting.enabled ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Saturday Duty Roster */}
      <section className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2.5 text-[15px]">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users size={16} className="text-accent" />
            </div>
            Saturday Duty Roster
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-[42px]">
            Pick a Saturday, then mark who is rostered. Rostered interns who report that day earn comp leave.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {saturdays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Saturdays in this month.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Saturday</label>
                <select
                  value={selectedSat}
                  onChange={(e) => setSelectedSat(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {saturdays.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">{rosteredIds.size} rostered</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interns.map((intern) => {
                  const checked = rosteredIds.has(intern.id);
                  return (
                    <label
                      key={intern.id}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        checked ? "border-accent bg-accent/5" : "border-border hover:border-neutral-300 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRoster(intern.id)}
                        className="w-4 h-4 rounded border-neutral-300 accent-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{intern.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        intern.team === "ALPHA" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"
                      }`}>
                        {intern.team === "ALPHA" ? "A" : "CC"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pb-4">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm">
          <Save size={15} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="number"
        defaultValue={value}
        className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
