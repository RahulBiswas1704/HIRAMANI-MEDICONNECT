'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  UserCheck,
  Building2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Appointment, PatientQuery } from '@/types';

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Heading & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Hospital Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time appointment queues, doctor schedules, and WhatsApp patient enquiries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition text-xs flex items-center gap-1.5 shadow-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/dashboard/appointments"
            className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Appointments</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Today&apos;s OPD Queue</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#0e4a7b] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics?.todayAppointmentsCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Real-time active queue
          </div>
        </div>

        {/* Confirmed Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Confirmed Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics?.confirmedCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Total {metrics?.totalAppointments ?? 0} bookings recorded
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Requests</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {metrics?.pendingCount ?? 0}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Requires receptionist approval
          </div>
        </div>

        {/* Open Patient Queries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Open Enquiries</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics?.openQueriesCount ?? 0}
          </div>
          <div className="text-[11px] text-purple-700 font-medium">
            {metrics?.unassignedQueriesCount ?? 0} unassigned tickets
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{metrics?.doctorsCount ?? 7} Active Doctors</div>
            <div className="text-slate-500 text-[11px]">Across OPD Specialties</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{metrics?.departmentsCount ?? 7} Departments</div>
            <div className="text-slate-500 text-[11px]">Configured & Operational</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{metrics?.cancelledCount ?? 0} Cancelled</div>
            <div className="text-slate-500 text-[11px]">Slots released to patients</div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/chat"
            target="_blank"
            className="w-full sm:w-auto text-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5"
          >
            <span>Simulate Patient Chat</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Content Split: Recent Appointments & Recent Patient Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Appointments */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Appointments</h3>
              <p className="text-[11px] text-slate-500">Live booking feed from WhatsApp and Web Portal</p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-[#0e4a7b] hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Ref & Patient</th>
                  <th className="py-3 px-4">Doctor & Dept</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentAppointments?.length ? (
                  metrics.recentAppointments.map((apt: Appointment) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{apt.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{apt.booking_reference}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{apt.doctor_name}</div>
                        <div className="text-[11px] text-slate-500">{apt.department_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{apt.appointment_date}</div>
                        <div className="text-[11px] text-slate-500">{apt.start_time} - {apt.end_time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'requested'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {apt.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      No appointments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Queries & Tickets */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Patient Enquiries & Tickets</h3>
              <p className="text-[11px] text-slate-500">Front desk requests submitted via WhatsApp</p>
            </div>
            <Link
              href="/dashboard/queries"
              className="text-xs font-semibold text-[#0e4a7b] hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {metrics?.recentQueries?.length ? (
              metrics.recentQueries.map((qry: PatientQuery) => (
                <div
                  key={qry.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:bg-white transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-mono">
                      {qry.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        qry.status === 'open'
                          ? 'bg-purple-100 text-purple-800'
                          : qry.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {qry.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800">{qry.patient_name} • <span className="text-slate-500 font-normal">{qry.category}</span></div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {qry.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No patient queries submitted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
