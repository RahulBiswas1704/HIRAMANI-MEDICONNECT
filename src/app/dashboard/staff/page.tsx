'use client';

import React, { useState, useEffect } from 'react';
import { Users2, ShieldCheck, UserCheck, Clock, ShieldAlert, FileText, Lock } from 'lucide-react';
import { Profile, AuditLog } from '@/types';

export default function StaffPage() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setStaff(data.data.staff || []);
        setAuditLogs(data.data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Access Permissions</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-based access control (RBAC), tenant isolation, and audit trail of administrative actions.
        </p>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-[#0e4a7b]" />
          <h3 className="font-extrabold text-sm text-slate-900">Hospital RBAC Permission Framework</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-1.5">
            <span className="font-bold text-[#0e4a7b] block text-sm">Super Admin</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Full platform governance, tenant configuration, and database maintenance access.
            </p>
          </div>

          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1.5">
            <span className="font-bold text-[#0d9488] block text-sm">Hospital Admin</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Manage hospital settings, clinical departments, doctors, tariffs, and staff credentials.
            </p>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
            <span className="font-bold text-indigo-700 block text-sm">Receptionist</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Confirm/reschedule appointments, manage patient WhatsApp enquiries, and handle live handovers.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-sm">Department Staff</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              View assigned department appointment queues and specialist rosters only.
            </p>
          </div>
        </div>
      </div>

      {/* Authorized Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <h3 className="font-bold text-sm text-slate-900">Authorized Personnel</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Designated Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.full_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-sky-100 text-[#0e4a7b] font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {s.role.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{s.phone_number || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0e4a7b]" />
            <h3 className="font-extrabold text-sm text-slate-900">Operational Audit Logs</h3>
          </div>
          <span className="text-[11px] text-slate-400">Chronological Event Trail</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto text-xs pr-1">
          {auditLogs.map(log => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-white transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-slate-600 font-semibold">{log.actor_name}</span>
                </div>
                {log.details && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
