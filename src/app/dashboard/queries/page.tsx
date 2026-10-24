'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareText,
  Search,
  Filter,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Send,
  X,
  FileText,
  Tag,
} from 'lucide-react';
import { PatientQuery, QueryNote, Profile } from '@/types';

export default function QueriesPage() {
  const [queries, setQueries] = useState<PatientQuery[]>([]);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Query Drawer / Details
  const [selectedQuery, setSelectedQuery] = useState<PatientQuery | null>(null);
  const [notes, setNotes] = useState<QueryNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');

  const fetchQueries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/queries?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQueries(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data.staff || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
    fetchStaff();
  }, [fetchQueries, fetchStaff]);

  const openQueryDetail = async (q: PatientQuery) => {
    setSelectedQuery(q);
    setResolutionSummary(q.resolution_summary || '');
    try {
      const res = await fetch(`/api/queries/${q.id}/notes`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedQuery) return;
    try {
      const res = await fetch('/api/queries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedQuery.id,
          status,
          resolution_summary: status === 'resolved' ? resolutionSummary : undefined,
          resolved_at: status === 'resolved' ? new Date().toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedQuery(data.data);
        fetchQueries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (staffId: string) => {
    if (!selectedQuery) return;
    const staff = staffList.find(s => s.id === staffId);
    try {
      const res = await fetch('/api/queries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedQuery.id,
          assigned_to: staffId,
          assigned_to_name: staff?.full_name,
          status: 'assigned',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedQuery(data.data);
        fetchQueries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery || !newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/queries/${selectedQuery.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote.trim(),
          author_name: 'Reception Team',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(prev => [...prev, data.data]);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Queries & Support Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage inbound questions, billing enquiries, complaints, and live receptionist handovers.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticket number, patient name, description..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Categories</option>
          <option value="Appointments">Appointments</option>
          <option value="Billing">Billing & Insurance</option>
          <option value="Laboratory">Laboratory & Reports</option>
          <option value="Medical Records">Medical Records</option>
          <option value="General Enquiry">General Enquiry</option>
          <option value="Complaints">Complaints & Grievances</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_patient">Waiting for Patient</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Queries List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Query Cards */}
        <div className={`space-y-3 ${selectedQuery ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {queries.length > 0 ? (
            queries.map(q => {
              const isSelected = selectedQuery?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => openQueryDetail(q)}
                  className={`bg-white rounded-2xl border p-4.5 shadow-sm space-y-2 cursor-pointer transition ${
                    isSelected
                      ? 'border-[#0e4a7b] ring-2 ring-[#0e4a7b]/20 bg-sky-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {q.ticket_number}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0d9488] bg-teal-50 px-2 py-0.5 rounded-full">
                        {q.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        q.status === 'open'
                          ? 'bg-purple-100 text-purple-800'
                          : q.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : q.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {q.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-xs">
                    {q.patient_name} <span className="font-normal text-slate-500">({q.patient_phone})</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Assigned: {q.assigned_to_name || 'Unassigned'}</span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              {isLoading ? 'Loading patient queries...' : 'No queries match your selected filters.'}
            </div>
          )}
        </div>

        {/* Right: Drawer for selected query details & notes */}
        {selectedQuery && (
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {selectedQuery.ticket_number}
                </span>
                <span className="ml-2 font-bold text-xs text-[#0e4a7b]">
                  {selectedQuery.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info */}
            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1 border border-slate-200">
              <div className="font-bold text-slate-900">{selectedQuery.patient_name}</div>
              <div className="text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {selectedQuery.patient_phone}
              </div>
              <p className="text-slate-700 mt-2 text-xs leading-relaxed whitespace-pre-wrap">
                {selectedQuery.description}
              </p>
            </div>

            {/* Workflow Status & Assignment Controls */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={selectedQuery.status}
                  onChange={e => handleUpdateStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b] font-medium"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_patient">Waiting for Patient</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Staff</label>
                <select
                  value={selectedQuery.assigned_to || ''}
                  onChange={e => handleAssign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Internal Staff Notes Feed */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Internal Case Notes & Updates
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notes.length > 0 ? (
                  notes.map(n => (
                    <div key={n.id} className="p-2.5 bg-sky-50/50 border border-sky-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-[#0e4a7b]">{n.author_name}</span>
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-800">{n.note}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No internal notes yet.</div>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add internal note..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || isAddingNote}
                  className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
