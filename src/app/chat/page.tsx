'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Stethoscope, ShieldCheck, Info } from 'lucide-react';
import { WhatsAppSimulator } from '@/components/chat/WhatsAppSimulator';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="h-5 w-[1px] bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0e4a7b] flex items-center justify-center text-white font-bold">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">MediConnect</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Interactive Bot Sandbox
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold bg-[#0e4a7b] text-white hover:bg-[#0b3459] px-4 py-2 rounded-lg transition shadow-sm"
            >
              Access Admin Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Simulator Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Left Side: Context & Instructions */}
        <div className="flex-1 max-w-lg space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Meta WhatsApp Cloud API v21.0 Engine
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Live Patient WhatsApp Automation Demo
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Experience the automated conversational workflow exactly as a patient would on WhatsApp.
            This interactive simulator connects to our state machine, dynamic slot availability engine, and Supabase database models.
          </p>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Things you can try right now:
            </h4>
            <ul className="text-xs space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">1.</span>
                <span>Type <strong>&quot;Book appointment&quot;</strong> or click button <strong>&quot;1&quot;</strong> to select a department, doctor, and live slot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">2.</span>
                <span>Type <strong>&quot;Who is your cardiologist&quot;</strong> or <strong>&quot;Doctor fees&quot;</strong> to test approved FAQ matching.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">3.</span>
                <span>Complete a booking, copy the generated reference (e.g. <code>APT-20261025-XXXX</code>), then check the <strong>Admin Dashboard</strong> to see it live!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">4.</span>
                <span>Type <strong>&quot;Speak to human&quot;</strong> to test the reception handover queue.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>This demonstration operates in Safe Sandbox Mode without consuming WhatsApp messaging fees.</span>
          </div>
        </div>

        {/* Right Side: The WhatsApp Widget */}
        <div className="w-full max-w-sm sm:max-w-md">
          <WhatsAppSimulator isStandalone={true} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        MediConnect Hospital Automation • Hiramani Memorial Hospital • Designed for clinics & hospitals across India.
      </footer>
    </div>
  );
}
