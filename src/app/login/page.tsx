"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email && password) {
        router.push("/dashboard");
      } else {
        setError("Please enter your email and password");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-accent items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">InternTrack</h1>
          <p className="text-neutral-400 text-lg mb-8">
            Intern Performance & Attendance Tracking System
          </p>
          <div className="space-y-4 text-neutral-300 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Real-time attendance monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Call center & tour performance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Automated leave & compensation management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span>Manager dashboard with KPI insights</span>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-700">
            <p className="text-neutral-500 text-xs">Herald College Kathmandu</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold">InternTrack</h1>
            <p className="text-muted-foreground text-sm mt-1">Herald College Kathmandu</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@herald.edu.np"
                className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background transition-colors hover:border-neutral-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background pr-11 transition-colors hover:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </button>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Accounts</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Admin: admin@herald.edu.np</p>
              <p>Supervisor: priya@herald.edu.np</p>
              <p>Intern: aarav@herald.edu.np</p>
              <p className="text-muted-foreground/60 mt-1">Password: any value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
