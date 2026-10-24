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
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface BridgeStatus {
  status: 'not_started' | 'scan_qr' | 'pairing_code' | 'connected' | 'disconnected';
  phone?: string;
  name?: string;
  qrDataUrl?: string;
  pairingCode?: string;
  targetPhone?: string;
  message?: string;
  updatedAt?: string;
}

export default function WhatsAppWebPage() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [copied, setCopied] = useState(false);

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
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setSubmittingPhone(true);
    setPhoneMessage('');

    try {
      const res = await fetch('/api/whatsapp/web-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setPhoneMessage('Code requested! It will appear below in 3-5 seconds.');
        fetchStatus();
      } else {
        setPhoneMessage(data.error || 'Failed to request code');
      }
    } catch (err: any) {
      setPhoneMessage(err?.message || 'Error sending request');
    } finally {
      setSubmittingPhone(false);
    }
  };

  const copyPairingCode = () => {
    if (status?.pairingCode) {
      navigator.clipboard.writeText(status.pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Web Connection
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" /> Live Bridge
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect your WhatsApp number to Hiramani Memorial Hospital instantly via QR Code or 8-digit Pairing Code.
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
      ) : status?.status === 'pairing_code' && status.pairingCode ? (
        <div className="bg-white rounded-2xl border-2 border-sky-500/50 p-8 shadow-sm">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <div className="w-14 h-14 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black text-slate-900">
              Enter this 8-Character Pairing Code on Your Phone
            </h2>

            <p className="text-xs text-slate-600">
              In WhatsApp, tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong> &gt; <strong>&quot;Link with phone number instead&quot;</strong> and enter this code:
            </p>

            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-center gap-4 shadow-inner">
              <span className="font-mono text-3xl font-black tracking-widest text-emerald-400">
                {status.pairingCode}
              </span>
              <button
                onClick={copyPairingCode}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Waiting for you to enter code on WhatsApp...
            </div>
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
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Official macOS Desktop protocol active
              </div>
            </div>

            {/* Right: Step-by-Step Instructions & Alternative Code Link */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                How to link:
              </h2>

              <ol className="space-y-2.5">
                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#0e4a7b] text-white font-bold flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Open WhatsApp on your phone.</span>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#0e4a7b] text-white font-bold flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>Tap <strong>Settings</strong> or <strong>⋮</strong> &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.</span>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#0e4a7b] text-white font-bold flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>Point your camera at this QR code!</span>
                </li>
              </ol>

              {/* Alternative: Link with Phone Number instead */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" /> Prefer 8-digit Pairing Code instead of Camera?
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Enter your phone number with country code (e.g. <code>919876543210</code>) to link without scanning.
                </p>
                <form onSubmit={handleRequestPairingCode} className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="919876543210"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                  <button
                    type="submit"
                    disabled={submittingPhone}
                    className="px-3.5 py-2 bg-[#0e4a7b] hover:bg-[#135d96] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {submittingPhone ? 'Requesting...' : 'Get Code'}
                  </button>
                </form>
                {phoneMessage && (
                  <p className="text-[11px] text-sky-700 mt-1.5 font-medium">{phoneMessage}</p>
                )}
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
          </div>
        </div>
      )}
    </div>
  );
}
