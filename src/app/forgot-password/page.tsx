'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered hospital email address to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Recovery Link Dispatched</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong>{email}</strong>, a secure password reset link has been dispatched.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-xs font-semibold text-[#0e4a7b] hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@hiramanihospital.demo"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b] pl-10"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0e4a7b] hover:bg-[#0b3459] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow transition"
              >
                Send Password Reset Email
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
