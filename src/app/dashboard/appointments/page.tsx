'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  User,
  Phone,
  FileText,
  AlertCircle,
  Check,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Appointment, Doctor, Department } from '@/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Manual Add Form State
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDoctor) params.set('doctor_id', selectedDoctor);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedDate) params.set('date', selectedDate);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedDoctor, selectedStatus, selectedDate]);

  const fetchDropdowns = async () => {
    try {
      const [dRes, deptRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/departments'),
      ]);
      const [dData, deptData] = await Promise.all([dRes.json(), deptRes.json()]);
      if (dData.success) setDoctors(dData.data);
      if (deptData.success) setDepartments(deptData.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Load available slots when doctor and date change in manual add form
  useEffect(() => {
    if (newDoctorId && newDate) {
      fetch(`/api/doctors/slots?doctor_id=${newDoctorId}&date=${newDate}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setAvailableSlots(data.data);
            if (data.data.length > 0) setNewSlot(data.data[0]);
            else setNewSlot('');
          }
        });
    }
  }, [newDoctorId, newDate]);

  // Handle Manual Appointment Creation
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newDoctorId || !newDate || !newSlot || !newPatientName || !newPatientPhone) {
      setFormError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: newDoctorId,
          appointment_date: newDate,
          start_time: newSlot,
          patient_name: newPatientName,
          patient_phone: newPatientPhone,
          booking_channel: 'web_dashboard',
          administrative_note: newNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchAppointments();
        // Reset
        setNewPatientName('');
        setNewPatientPhone('');
        setNewNote('');
      } else {
        setFormError(data.error || 'Failed to reserve appointment.');
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Update Actions
  const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        setCancelModalApt(null);
        setSelectedApt(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (appointments.length === 0) return;
    const headers = ['Booking Reference,Patient Name,Phone,Doctor,Department,Date,Start Time,End Time,Fee,Status,Channel\n'];
    const rows = appointments.map(a =>
      `"${a.booking_reference}","${a.patient_name}","${a.patient_phone}","${a.doctor_name || ''}","${a.department_name || ''}","${a.appointment_date}","${a.start_time}","${a.end_time}",${a.consultation_fee},"${a.status}","${a.booking_channel}"`
    );
    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [reminderBanner, setReminderBanner] = useState<string | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const handleTriggerReminders = async () => {
    setIsSendingReminders(true);
    setReminderBanner(null);
    try {
      const res = await fetch('/api/automations/reminders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReminderBanner(
          `🔔 Sent ${data.summary.sent} WhatsApp reminder(s) successfully (${data.summary.skipped} already notified earlier).`
        );
        setTimeout(() => setReminderBanner(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReminders(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Appointment Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time WhatsApp & counter bookings, confirm pending requests, or reschedule.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerReminders}
            disabled={isSendingReminders}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Send WhatsApp Reminders for Today & Tomorrow"
          >
            <Bell className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">
              {isSendingReminders ? 'Sending...' : 'Send WhatsApp Reminders'}
            </span>
          </button>

          <button
            onClick={exportToCSV}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (doctors.length > 0) setNewDoctorId(doctors[0].id);
              setShowAddModal(true);
            }}
            className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {reminderBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{reminderBanner}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, phone, reference..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Doctor Filter */}
        <select
          value={selectedDoctor}
          onChange={e => setSelectedDoctor(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Doctors</option>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              {d.full_name} ({d.department_name || d.speciality})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="requested">Pending Request</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Clear date filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Patient Name & Phone</th>
                <th className="py-3.5 px-4">Doctor & Department</th>
                <th className="py-3.5 px-4">Appointment Date</th>
                <th className="py-3.5 px-4">Time Slot</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length > 0 ? (
                appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {apt.booking_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{apt.patient_name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {apt.patient_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{apt.doctor_name}</div>
                      <div className="text-slate-500 text-[11px]">{apt.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {apt.appointment_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {apt.start_time} - {apt.end_time}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₹{apt.consultation_fee}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'requested'
                            ? 'bg-amber-100 text-amber-800'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {apt.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'requested' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="Confirm Booking"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setCancelModalApt(apt);
                              setCancellationReason('');
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedApt(apt)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {isLoading ? 'Loading appointment records...' : 'No appointments matching the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Appointment Detail Modal */}
      {/* -------------------------------------------------------------------- */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Appointment Record</h3>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Reference</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedApt.booking_reference}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Channel</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedApt.booking_channel}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Patient Name</span>
                <span className="font-bold text-slate-900">{selectedApt.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-900">{selectedApt.patient_phone}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Consulting Doctor</span>
                <span className="font-semibold text-slate-900">{selectedApt.doctor_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-900">{selectedApt.department_name}</span>
              </div>

              <div>
                <span className="text-slate-400 block">Date & Slot</span>
                <span className="font-semibold text-slate-900">
                  {selectedApt.appointment_date} ({selectedApt.start_time} - {selectedApt.end_time})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Consultation Fee</span>
                <span className="font-bold text-emerald-700">₹{selectedApt.consultation_fee}</span>
              </div>
            </div>

            {selectedApt.administrative_note && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="font-bold text-slate-700 block mb-1">Administrative Note:</span>
                <span className="text-slate-600">{selectedApt.administrative_note}</span>
              </div>
            )}

            {selectedApt.cancellation_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold block mb-1">Cancellation Reason:</span>
                <span>{selectedApt.cancellation_reason}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Cancel Appointment Modal */}
      {/* -------------------------------------------------------------------- */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-extrabold text-base text-slate-900">Cancel Appointment</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel booking <strong>{cancelModalApt.booking_reference}</strong> for <strong>{cancelModalApt.patient_name}</strong>?
              This slot will immediately be released to other patients.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="e.g. Patient requested cancellation or doctor unavailable..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleUpdateStatus(cancelModalApt.id, 'cancelled', cancellationReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Manual Booking Modal */}
      {/* -------------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Book OPD Appointment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={newDoctorId}
                  onChange={e => setNewDoctorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.department_name || d.speciality}) — Fee: ₹{d.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Available Slot *</label>
                  <select
                    required
                    value={newSlot}
                    onChange={e => setNewSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  >
                    {availableSlots.length > 0 ? (
                      availableSlots.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    ) : (
                      <option value="">No slots free</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={e => setNewPatientName(e.target.value)}
                    placeholder="e.g. Suman Sen"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp Mobile *</label>
                  <input
                    type="text"
                    required
                    value={newPatientPhone}
                    onChange={e => setNewPatientPhone(e.target.value)}
                    placeholder="+919830012345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Note (Optional)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="e.g. Walk-in patient, follow-up visit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableSlots.length === 0}
                  className="px-5 py-2 bg-[#0e4a7b] hover:bg-[#0b3459] text-white font-semibold rounded-xl transition shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
