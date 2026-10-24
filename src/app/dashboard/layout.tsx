'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Stethoscope, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-800">
              Hiramani Memorial Hospital • Kolkata
            </h1>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" /> Asia/Kolkata (IST)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs text-emerald-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              WhatsApp Automation Active
            </div>

            <Link
              href="/chat"
              target="_blank"
              className="bg-[#25d366] hover:bg-[#20ba5c] text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Patient Bot</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
