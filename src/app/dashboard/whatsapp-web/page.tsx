'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Radio,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface BridgeStatus {
  status: 'not_started' | 'scan_qr' | 'connected' | 'disconnected';
  phone?: string;
  name?: string;
  qrDataUrl?: string;
  message?: string;
  updatedAt?: string;
}

export default function WhatsAppWebPage() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/web-status');
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch status', e);
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Web QR Connection
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" /> Live Bridge
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect any physical WhatsApp number to Hiramani Memorial Hospital without needing a Meta Developer Account.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Refresh Status
        </button>
      </div>

      {/* Main Connection Status Card */}
      {status?.status === 'connected' ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[11px] font-extrabold px-4 py-1 rounded-bl-xl tracking-wider uppercase">
            Connected & Active
          </div>

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-xl font-black text-slate-900">
            WhatsApp Phone Number Linked!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1.5">
            Your WhatsApp device is successfully linked. Any patient texting this number will immediately receive the Hiramani Memorial Hospital automated assistant.
          </p>

          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Linked Account
              </div>
              <div className="text-sm font-bold text-slate-800">
                {status.name || 'Hiramani Hospital'}
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WhatsApp ID / Phone
              </div>
              <div className="text-sm font-mono font-bold text-emerald-700">
                {status.phone || 'Active'}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard/appointments"
              className="px-4 py-2 bg-[#0e4a7b] hover:bg-[#135d96] text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              View Incoming Appointments
            </Link>
            <Link
              href="/chat"
              target="_blank"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
            >
              <span>Test Simulator</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      ) : status?.status === 'scan_qr' && status.qrDataUrl ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: QR Display */}
            <div className="flex flex-col items-center text-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Scan with WhatsApp
              </div>
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={status.qrDataUrl}
                  alt="WhatsApp Web QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Waiting for scan... auto-refreshes every 20s
              </div>
            </div>

            {/* Right: Step-by-Step Instructions */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                How to link your phone:
              </h2>

              <ol className="space-y-3">
                <li className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#0e4a7b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    Open <strong className="font-semibold text-slate-900">WhatsApp</strong> on your mobile phone.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#0e4a7b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    Tap <strong className="font-semibold text-slate-900">Settings</strong> (iOS) or the <strong className="font-semibold text-slate-900">three dots ⋮</strong> (Android) and choose <strong className="font-semibold text-slate-900">Linked Devices</strong>.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-[#0e4a7b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    Tap <strong className="font-semibold text-emerald-700">Link a Device</strong> and point your camera at the QR code on the left!
                  </div>
                </li>
              </ol>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>End-to-End Secure:</strong> Messages flow directly through your WhatsApp account with full hospital double-booking prevention and doctor schedule lookup.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Terminal className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Start the WhatsApp Web Bridge
            </h2>
            <p className="text-xs text-slate-600">
              To connect your phone, run the WhatsApp Web bridge command in your terminal. It will instantly generate your login QR code here and in your console.
            </p>

            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs flex items-center justify-between shadow-inner">
              <span>npm run whatsapp:web</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Command</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Once you start the command, this page will automatically refresh with your scan code.
            </p>
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900">Zero Meta Approval</div>
          <div className="text-[11px] text-slate-500 mt-1">
            No business verification or Facebook developer registration needed. Link immediately.
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-[#0e4a7b]/10 text-[#0e4a7b] flex items-center justify-center mb-2.5">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900">Bilingual 7-Option Flow</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Exact Bengali and English welcome message with doctor rosters and 15-min booking slots.
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900">Auto Reconnection</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Credentials persist in your local session. Reconnects seamlessly after restarts.
          </div>
        </div>
      </div>
    </div>
  );
}
