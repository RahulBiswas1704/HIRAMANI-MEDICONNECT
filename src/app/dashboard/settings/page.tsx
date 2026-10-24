'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  ShieldAlert,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  MapPin,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Hospital, HospitalSettings } from '@/types';

export default function SettingsPage() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hospital Profile Editable Fields
  const [hospName, setHospName] = useState('Hiramani Memorial Hospital');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [website, setWebsite] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Operational Settings Form Fields
  const [opdTimings, setOpdTimings] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [receptionHours, setReceptionHours] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [bookingPolicy, setBookingPolicy] = useState('');
  const [diagnosticInfo, setDiagnosticInfo] = useState('');
  const [admissionInfo, setAdmissionInfo] = useState('');
  const [billingInfo, setBillingInfo] = useState('');
  const [insuranceInfo, setInsuranceInfo] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');

  // Webhook Simulator State
  const [testMessage, setTestMessage] = useState('Show OPD timings');
  const [testPhone, setTestPhone] = useState('919830000000');
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  const handleSimulateWebhook = async () => {
    setSimulatingWebhook(true);
    setWebhookTestResult(null);
    try {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: testPhone,
                      id: `wamid.TEST_${Date.now()}`,
                      type: 'text',
                      text: { body: testMessage },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setWebhookTestResult({
        status: res.status,
        response: data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setWebhookTestResult({
        status: 'Error',
        response: { error: err.message },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        const h = data.data.hospital;
        const s = data.data.settings;
        setHospital(h);
        setSettings(s);

        // Hospital Profile
        setHospName(h.name || 'Hiramani Memorial Hospital');
        setRegistrationNumber(h.registration_number || '');
        setAddressLine1(h.address_line1 || '');
        setAddressLine2(h.address_line2 || '');
        setCity(h.city || '');
        setState(h.state || '');
        setPincode(h.pincode || '');
        setPhone(h.phone || '');
        setEmergencyContact(h.emergency_contact || '');
        setWebsite(h.website || '');
        setGoogleMapsUrl(h.google_maps_url || '');

        // Settings
        setOpdTimings(s.opd_timings || '');
        setVisitingHours(s.visiting_hours || '');
        setReceptionHours(s.reception_hours || '');
        setCancellationPolicy(s.cancellation_policy || '');
        setBookingPolicy(s.booking_policy || '');
        setDiagnosticInfo(s.diagnostic_services_info || '');
        setAdmissionInfo(s.admission_info || '');
        setBillingInfo(s.billing_info || '');
        setInsuranceInfo(s.insurance_info || '');
        setPhoneId(s.whatsapp_phone_number_id || '');
        setWabaId(s.whatsapp_business_account_id || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital: {
            name: hospName,
            registration_number: registrationNumber,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state,
            pincode,
            phone,
            emergency_contact: emergencyContact,
            website,
            google_maps_url: googleMapsUrl,
          },
          settings: {
            opd_timings: opdTimings,
            visiting_hours: visitingHours,
            reception_hours: receptionHours,
            cancellation_policy: cancellationPolicy,
            booking_policy: bookingPolicy,
            diagnostic_services_info: diagnosticInfo,
            admission_info: admissionInfo,
            billing_info: billingInfo,
            insurance_info: insuranceInfo,
            whatsapp_phone_number_id: phoneId,
            whatsapp_business_account_id: wabaId,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    navigator.clipboard.writeText(`${origin}/api/whatsapp/webhook`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
        Loading hospital configuration...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Profile & Operational Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hospital profile details, verified emergency contacts, clinical hours, services, and Meta WhatsApp integration.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Hospital profile and operational settings saved successfully. Chatbot and dashboard updated.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        {/* Section 1: Hospital Profile Editable Fields */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-[#0e4a7b]" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Hospital Identity & Contact Details</h3>
              <p className="text-[11px] text-slate-500">Official hospital parameters rendered to patients in WhatsApp and online desk.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital Display Name *</label>
              <input
                type="text"
                value={hospName}
                onChange={e => setHospName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Registration Number</label>
              <input
                type="text"
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
                placeholder="e.g. REG-WB-KOL-2024-8976"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="124/A Eastern Metropolitan Bypass"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line 2 / Landmark</label>
              <input
                type="text"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Mukundapur, Near Metro Station"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Kolkata"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="West Bengal"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Postal Code (PIN)</label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="700099"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reception Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 33 2456 7890"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-rose-700 mb-1">Verified Emergency Helpline Number</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 00108"
                className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Hospital Website</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://hiramani-hospital.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Google Maps Directions URL</label>
              <input
                type="text"
                value={googleMapsUrl}
                onChange={e => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Timings & Policies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-[#0d9488]" />
            <h3 className="font-extrabold text-sm text-slate-900">Hospital Operating Hours & Booking Rules</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">OPD Clinic Schedules</label>
              <input
                type="text"
                value={opdTimings}
                onChange={e => setOpdTimings(e.target.value)}
                placeholder="Monday to Saturday: 08:30 AM to 08:00 PM | Sunday: 09:00 AM to 01:00 PM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inpatient Visiting Hours</label>
                <input
                  type="text"
                  value={visitingHours}
                  onChange={e => setVisitingHours(e.target.value)}
                  placeholder="Morning: 11:00 AM to 01:00 PM | Evening: 05:00 PM to 07:00 PM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reception & Helpdesk Hours</label>
                <input
                  type="text"
                  value={receptionHours}
                  onChange={e => setReceptionHours(e.target.value)}
                  placeholder="24 Hours Emergency, Trauma & Reception Desk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation & Rescheduling Policy</label>
              <textarea
                rows={2}
                value={cancellationPolicy}
                onChange={e => setCancellationPolicy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Policy</label>
              <textarea
                rows={2}
                value={bookingPolicy}
                onChange={e => setBookingPolicy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Diagnostic, Admission & Billing Operational Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Hospital Services, Admission & Billing Content</h3>
              <p className="text-[11px] text-slate-500">Configure information displayed under options 3, 4, and 6 in the WhatsApp chatbot.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnostic Services & Laboratory Notes</label>
              <textarea
                rows={2}
                value={diagnosticInfo}
                onChange={e => setDiagnosticInfo(e.target.value)}
                placeholder="e.g. NABL Accredited pathology, home blood sample collection from 06:30 AM, 128-Slice CT, 2D Echo"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admission & Surgery Enquiry Information</label>
              <textarea
                rows={2}
                value={admissionInfo}
                onChange={e => setAdmissionInfo(e.target.value)}
                placeholder="e.g. 24x7 admission desk on Ground Floor. Doctor admission slip and government photo ID required."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing & Payment Notes</label>
                <textarea
                  rows={2}
                  value={billingInfo}
                  onChange={e => setBillingInfo(e.target.value)}
                  placeholder="e.g. Cash, UPI (GPay/PhonePe/Paytm), Cards, NEFT. Payment accepted at Ground Floor & 2nd Floor counters."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insurance & Cashless TPA Information</label>
                <textarea
                  rows={2}
                  value={insuranceInfo}
                  onChange={e => setInsuranceInfo(e.target.value)}
                  placeholder="e.g. Star Health, Medi Assist, HDFC ERGO, ICICI Lombard, Paramount, Vidal Health, GIPSA."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: WhatsApp Cloud API Integration Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Official WhatsApp Business Platform (Cloud API)
              </h3>
            </div>

            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-200">
              {settings?.is_whatsapp_connected ? 'Connected to Meta API' : 'Safe Sandbox Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The platform is configured with Meta Graph API <strong>v21.0</strong>. In local development or testing,
            the chatbot operates smoothly in Sandbox Mode without consuming WhatsApp messaging fees.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                placeholder="e.g. 109284729102938"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                placeholder="e.g. 293847201928374"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
              />
            </div>
          </div>

          {/* Webhook Endpoint Helper */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Your Webhook Callback URL:</span>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="text-[11px] font-bold text-[#0e4a7b] hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
            <code className="block p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-xs overflow-x-auto">
              /api/whatsapp/webhook
            </code>
            <p className="text-[11px] text-slate-500 leading-normal">
              Provide this endpoint in your Meta App Dashboard under <strong>WhatsApp → Configuration → Callback URL</strong>.
              Verify token is set to <code>mediconnect_secure_webhook_verify_token_2026</code>.
            </p>
          </div>

          {/* Interactive Webhook Simulator */}
          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0e4a7b]" />
                Live Webhook Inbound Tester
              </span>
              <span className="text-[10px] bg-sky-200 text-[#0e4a7b] font-semibold px-2 py-0.5 rounded">
                Developer Utility
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dispatch a synthetic Meta WhatsApp webhook POST event to test signature verification, idempotency, and automated responses in real-time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Simulated Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Simulated Sender Phone</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={simulatingWebhook}
              onClick={handleSimulateWebhook}
              className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {simulatingWebhook ? 'Simulating Webhook...' : 'Fire Synthetic Webhook Event'}
            </button>

            {webhookTestResult && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Status: {webhookTestResult.status}</span>
                  <span>{webhookTestResult.timestamp}</span>
                </div>
                <pre className="text-slate-800 overflow-x-auto">
                  {JSON.stringify(webhookTestResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
