'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For demo mode / local development, allow authorized demo credentials
      if (
        (email === 'admin@hiramanihospital.demo' && password === 'Admin@2026') ||
        (email === 'reception@hiramanihospital.demo' && password === 'Reception@2026') ||
        (email.includes('@') && password.length >= 6)
      ) {
        // Save demo session cookie / storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mediconnect_user', JSON.stringify({ email, role: email.includes('admin') ? 'hospital_admin' : 'receptionist' }));
        }
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Password must be at least 6 characters.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#0e4a7b] flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">MediConnect</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">
          Hospital Staff & Admin Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Secure portal for authorised healthcare personnel only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@hiramanihospital.demo"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b] pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#0e4a7b] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b] pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0e4a7b] hover:bg-[#0b3459] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Demonstration Quick Login
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@hiramanihospital.demo', 'Admin@2026')}
                className="text-left p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition text-[11px]"
              >
                <div className="font-semibold text-slate-800">Hospital Admin</div>
                <div className="text-slate-500 text-[10px]">Medical Director</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('reception@hiramanihospital.demo', 'Reception@2026')}
                className="text-left p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl transition text-[11px]"
              >
                <div className="font-semibold text-slate-800">Receptionist</div>
                <div className="text-slate-500 text-[10px]">Front Desk Staff</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800 transition">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
