"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  PhoneCall,
  Calendar,
  Users,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  { name: "Performance", href: "/dashboard/performance", icon: PhoneCall },
  { name: "Leaves", href: "/dashboard/leaves", icon: Calendar },
  { name: "Interns", href: "/dashboard/interns", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Import", href: "/dashboard/import", icon: Upload },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#111111] text-white transform transition-transform duration-200 lg:relative lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-[#111111] font-black text-sm">IT</span>
            </div>
            <span className="font-bold text-[15px] tracking-tight">InternTrack</span>
          </Link>
          <button
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white text-[#111111] shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">Admin User</p>
              <p className="text-[11px] text-neutral-500 truncate">admin@herald.edu.np</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-[13px] text-neutral-500 hover:text-white hover:bg-white/[0.06] w-full transition-all duration-150"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-background shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-muted-foreground">
              {navigation.find(
                (n) =>
                  pathname === n.href ||
                  (n.href !== "/dashboard" && pathname.startsWith(n.href))
              )?.name || "Overview"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#FAFAFA]">
          {children}
        </main>
      </div>
    </div>
  );
}
