"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  Volume2,
  BellRing,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../lib/api-client";
import { COHORTS } from "../data/mock";

interface CohortOption {
  id: string;
  name: string;
  code: string;
}

export function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [institutionalId, setInstitutionalId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCohorts() {
      try {
        const res = await apiClient.catalog.cohorts();
        if (active && res && Array.isArray(res.items) && res.items.length > 0) {
          setCohorts(res.items);
          setCohortId(res.items[0].id);
          return;
        }
      } catch {
        // Fallback to initial mock cohorts for pilot testing
      }
      if (active) {
        const fallback = COHORTS.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
        }));
        setCohorts(fallback);
        if (fallback.length > 0) setCohortId(fallback[0].id);
      }
      setLoadingCohorts(false);
    }
    loadCohorts();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !institutionalId.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!cohortId) {
      setError("Please select your academic cohort.");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: fullName.trim(),
      institutionalId: institutionalId.trim(),
      email: email.trim(),
      password,
      cohortId,
    });
    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Registration failed. Please check your details.");
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel - Institutional Context */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1a2f5c] flex-col justify-between p-12 relative overflow-hidden text-white">
        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <GraduationCap size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">Timy</h1>
              <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                Kisii University Pilot
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs font-medium">
              <BellRing size={13} className="text-amber-400" />
              Pilot Live Ring & Sync Ready
            </span>
            <h2 className="font-display text-4xl text-white font-bold leading-tight">
              Create your student <br />
              <span className="text-amber-300">academic portal.</span>
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed max-w-md pt-2">
              Join your cohort schedule with zero lag. When a lecturer reschedules or relocates your common unit, your device alerts and synchronizes instantly.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                <Volume2 size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Instant Audio Ring</p>
                <p className="text-xs text-blue-200">Zero-latency synthesized chimes on venue shifts & schedule updates.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Personalized Cohort Timetable</p>
                <p className="text-xs text-blue-200">Live calendar reconciled directly against your official academic structure.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Seamless Pilot Priming</p>
                <p className="text-xs text-blue-200">Audio contexts and notification bridges prime automatically on signup.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-blue-300/70 text-xs">
          <p>© 2026 Kisii University · School of Information Science and Technology</p>
        </div>
      </div>

      {/* Right panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Student Account Registration</h2>
            <p className="text-sm text-slate-500 mt-1">
              Set up your student portal to connect with the live pilot schedule.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Brian Ochieng"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admission / Institutional ID
              </label>
              <input
                type="text"
                required
                value={institutionalId}
                onChange={(e) => setInstitutionalId(e.target.value)}
                placeholder="e.g. IN16/00142/23"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                University Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. b.ochieng@kisii.ac.ke"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Cohort / Programme
              </label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password (min. 10 chars with letters & digits)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Priming device & creating portal...</span>
              ) : (
                <>
                  <span>Create Account & Join Live Pilot</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
