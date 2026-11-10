"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ClipboardList, Calendar, MapPin, AlertTriangle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DEMO_ACCOUNTS } from '../data/mock';

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  }

  function fillDemo(acct: typeof DEMO_ACCOUNTS[0]) {
    setIdentifier(acct.identifier);
    setPassword(acct.password);
    setError('');
  }

  const features = [
    { icon: <Calendar size={20} />, text: 'Smart timetable management' },
    { icon: <AlertTriangle size={20} />, text: 'Real-time conflict detection' },
    { icon: <MapPin size={20} />, text: 'Venue availability & swaps' },
    { icon: <Bell size={20} />, text: 'Instant schedule notifications' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1a2f5c] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#3b6fd4]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-[#234080]/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#3b6fd4]/10 rounded-full blur-2xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#3b6fd4] flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-white">Timy</h1>
              <p className="text-blue-300 text-sm">Kisii University</p>
            </div>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="font-display text-4xl text-white leading-tight">
              Academic Scheduling,<br />
              <span className="text-[#9bbdf0]">Simplified.</span>
            </h2>
            <p className="text-blue-200 text-base leading-relaxed mt-4">
              The central platform for timetable management, venue coordination, and academic scheduling at Kisii University.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-blue-100">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-blue-300">
                  {f.icon}
                </div>
                <span className="text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-blue-400 text-xs">
          <p>© 2025 Kisii University · Timy Academic Management System</p>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#1a2f5c] flex items-center justify-center">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display text-2xl text-[#1a2f5c]">Timy</span>
              <p className="text-slate-500 text-xs">Kisii University</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
              <p className="text-sm text-slate-500 mt-1">Use your university ID or email address</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="University ID / Email"
                placeholder="e.g. IN16/00015/24 or STF/089"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3b6fd4] focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full justify-center py-2.5" loading={loading}>
                Sign In
              </Button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-xs text-slate-500 text-center mb-3 font-medium">DEMO ACCOUNTS</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acct => (
                <button
                  key={acct.identifier}
                  onClick={() => fillDemo(acct)}
                  className="p-3 bg-white rounded-lg border border-slate-200 text-left hover:border-[#3b6fd4] hover:bg-blue-50 transition-colors group"
                >
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-[#1a2f5c]">{acct.name.split(' ').slice(-1)[0]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{acct.role.replace('_', ' ')}</p>
                  <p className="text-xs font-mono text-slate-400 mt-1">{acct.identifier}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
