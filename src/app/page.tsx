'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  MessageSquare,
  CalendarCheck,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Sparkles,
  ChevronRight,
  Database,
  Lock,
  Headphones,
  FileText,
  HelpCircle,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { WhatsAppSimulator } from '@/components/chat/WhatsAppSimulator';

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. Header & Navigation */}
      {/* ---------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e4a7b] flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">MediConnect</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold bg-sky-100 text-[#0e4a7b] px-2 py-0.5 rounded-full">
                WhatsApp Healthcare Suite
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0e4a7b] transition">Features</a>
            <a href="#workflow" className="hover:text-[#0e4a7b] transition">Booking Flow</a>
            <a href="#departments" className="hover:text-[#0e4a7b] transition">Specialities</a>
            <a href="#whatsapp" className="hover:text-[#0e4a7b] transition">Cloud API</a>
            <a href="#compliance" className="hover:text-[#0e4a7b] transition">Security & Trust</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0e4a7b] px-3 py-2 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-semibold bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <span>Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. Hero Section */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-sky-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Designed for Hospitals & Clinics Across India
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Automate Patient OPD & Enquiries on{' '}
                <span className="text-[#0e4a7b]">WhatsApp</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Empower patients to book real doctor appointments, browse OPD timings, inspect consultation fees,
                and receive instant confirmations 24x7 through official WhatsApp Cloud API automation.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="bg-[#25d366] hover:bg-[#20ba5c] text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2.5 text-sm"
                >
                  <MessageSquare className="w-5 h-5 text-slate-950 fill-current" />
                  Try Live WhatsApp Chatbot
                </button>

                <Link
                  href="/dashboard"
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center gap-2 text-sm"
                >
                  <Building2 className="w-4 h-4 text-[#0e4a7b]" />
                  Explore Hospital Admin Dashboard
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                  <span>Meta Cloud API v21.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0d9488]" />
                  <span>Zero Double-Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#0d9488]" />
                  <span>Human Handover Ready</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Chat Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white p-3 rounded-3xl shadow-2xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 mb-2 px-2 flex items-center justify-between">
                  <span>Interactive Patient Screen</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Active Sandbox
                  </span>
                </div>
                <WhatsAppSimulator />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. Key Feature Cards */}
      {/* ---------------------------------------------------------------------- */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#0e4a7b]">
              Comprehensive Hospital Platform
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything Your Hospital Needs to Automate Front-Desk Operations
            </h3>
            <p className="text-sm text-slate-600">
              Transform busy reception phone lines into smooth, reliable automated workflows that patients love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-[#0e4a7b]">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">24x7 OPD Appointment Booking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Patients select clinical departments, view consulting specialists, choose genuinely available slots,
                and receive immediate confirmed booking references.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-[#0d9488]">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Dynamic Slot Generation & Overlap Prevention</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates live open slots strictly from doctor working schedules, duration, and leave blocks. Database-level atomic locks prevent double booking.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Transparent Fees & Schedules</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Patients can browse OPD timing schedules, specialist credentials, consultation charges, and follow-up policies directly in chat.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Approved FAQ Knowledgebase</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chatbot answers visiting hours, insurance TPAs, blood testing, and reports using authorized hospital FAQs. Never fabricates medical advice.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Reception Human Handover</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When complex queries arise, the bot gracefully transitions to reception desk staff and creates an internal ticket for swift resolution.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">24x7 Emergency Assistance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provides verified emergency hospital hotlines, ambulance phone numbers, and urgent trauma center directions immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. Patient Booking Workflow Explanation */}
      {/* ---------------------------------------------------------------------- */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#0d9488]">
              Automated Conversational Journey
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How Patients Book an Appointment in 60 Seconds
            </h3>
            <p className="text-sm text-slate-600">
              Intuitive, interactive options that work seamlessly on WhatsApp without requiring app downloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-[#0e4a7b] text-white font-bold text-xs flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Select Department</h4>
              <p className="text-xs text-slate-600">
                Patient replies with department number or taps quick buttons (General Medicine, Cardiology, Orthopaedics, etc.).
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-[#0e4a7b] text-white font-bold text-xs flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Choose Specialist</h4>
              <p className="text-xs text-slate-600">
                Inspects doctor qualifications, consultation fees, and chooses specific doctor or &apos;Any Available Doctor&apos;.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-[#0e4a7b] text-white font-bold text-xs flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Select Live Slot</h4>
              <p className="text-xs text-slate-600">
                Presents genuine available slots from the database. Double bookings are blocked atomically.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 mb-1 text-base">Instant Confirmation</h4>
              <p className="text-xs text-slate-600">
                Unique booking reference generated (e.g. <code>APT-20261025-XXXX</code>) and synced to the hospital dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. WhatsApp Cloud API Integration Section */}
      {/* ---------------------------------------------------------------------- */}
      <section id="whatsapp" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Meta Official Cloud API Architecture
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Enterprise Reliability with Official WhatsApp Business Platform
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Built strictly on Meta’s official Graph API (v21.0). Avoid risky third-party unofficial WhatsApp Web scrapers that risk phone number banning.
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Webhook endpoint with HMAC SHA-256 signature verification (<code>x-hub-signature-256</code>)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Message deduplication & idempotency handling with event tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Interactive list menus and quick-reply action buttons</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configurable Safe Sandbox Mode for immediate local development without API keys</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  href="/dashboard/settings"
                  className="bg-[#25d366] hover:bg-[#20ba5c] text-slate-950 font-bold px-5 py-3 rounded-xl transition text-xs flex items-center gap-2"
                >
                  Inspect API Settings
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/chat"
                  className="text-slate-300 hover:text-white border border-slate-700 px-5 py-3 rounded-xl transition text-xs font-medium"
                >
                  Open Sandbox
                </Link>
              </div>
            </div>

            {/* Code / Architecture Display */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-xs font-mono space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">Webhook Signature & Payload Security</span>
                <span className="text-emerald-400 text-[10px]">VERIFIED</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
{`// Meta Graph API v21.0 Webhook Handler
POST /api/whatsapp/webhook
Headers:
  x-hub-signature-256: sha256=e9d48...

Payload:
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "919876543210",
          "id": "wamid.HBgLM...",
          "type": "text",
          "text": { "body": "Book appointment" }
        }]
      }
    }]
  }]
}`}
              </pre>
              <div className="text-[11px] text-slate-400 leading-normal">
                HMAC SHA-256 checked with <code>crypto.timingSafeEqual</code> before processing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 6. Medical & Regulatory Disclaimer */}
      {/* ---------------------------------------------------------------------- */}
      <section id="compliance" className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Healthcare Advisory & Demonstration Notice
          </div>
          <p className="text-xs text-amber-900 leading-relaxed max-w-3xl mx-auto">
            <strong>Demonstration Notice:</strong> MediConnect sample data (doctors, departments, OPD schedules) is for demonstration and software evaluation purposes. In a production deployment, this platform must be linked with verified hospital credentials, licensed medical specialists, and authorized hospital policies in compliance with the Digital Personal Data Protection Act (DPDP), 2023 and applicable Ministry of Health guidelines.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 7. Footer */}
      {/* ---------------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#0e4a7b] flex items-center justify-center text-white font-bold text-xs">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">MediConnect</span>
            <span>• Hospital WhatsApp Automation</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Admin Dashboard</Link>
            <Link href="/chat" className="hover:text-slate-900 transition">Patient Bot Sandbox</Link>
            <Link href="/login" className="hover:text-slate-900 transition">Staff Sign In</Link>
          </div>

          <div>
            © {new Date().getFullYear()} MediConnect. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <FloatingChatButton />

      {/* Modal for full live chat experience from hero CTA */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <WhatsAppSimulator onClose={() => setShowDemoModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
