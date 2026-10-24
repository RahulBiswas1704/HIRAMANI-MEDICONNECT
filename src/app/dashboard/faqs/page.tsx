'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Plus, Search, Edit2, Trash2, Tag, CheckCircle2, X } from 'lucide-react';
import { FAQ, FAQCategory } from '@/types';

const FAQ_CATEGORIES: FAQCategory[] = [
  'Hospital Information',
  'Appointments',
  'Doctors',
  'Consultation Fees',
  'OPD Timings',
  'Laboratory',
  'Billing',
  'Insurance',
  'Visiting Hours',
  'Location',
  'Other',
];

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const [category, setCategory] = useState<FAQCategory>('Hospital Information');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCat) params.set('category', selectedCat);
      params.set('all', 'true');

      const res = await fetch(`/api/faqs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCat]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const openAddModal = () => {
    setEditingFaq(null);
    setCategory('Hospital Information');
    setQuestion('');
    setAnswer('');
    setKeywords('hospital, timings, appointment');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (f: FAQ) => {
    setEditingFaq(f);
    setCategory(f.category);
    setQuestion(f.question);
    setAnswer(f.answer);
    setKeywords(f.keywords.join(', '));
    setIsActive(f.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await fetch('/api/faqs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFaq.id,
            category,
            question,
            answer,
            keywords,
            is_active: isActive,
          }),
        });
      } else {
        await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            question,
            answer,
            keywords,
            is_active: isActive,
          }),
        });
      }
      setShowModal(false);
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this FAQ entry from the chatbot knowledgebase?')) return;
    try {
      await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' });
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Approved FAQ Knowledgebase</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate approved hospital answers. The patient WhatsApp chatbot strictly utilizes these verified records.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add FAQ Entry</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions, answers, or trigger keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Categories</option>
          {FAQ_CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* FAQ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map(faq => (
          <div
            key={faq.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 flex flex-col justify-between transition ${
              faq.is_active ? 'border-slate-200 hover:shadow-md' : 'border-slate-300 opacity-70'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0e4a7b] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  {faq.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    faq.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {faq.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                {faq.question}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {faq.answer}
              </p>

              {faq.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {faq.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openEditModal(faq)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => handleDelete(faq.id)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingFaq ? 'Edit FAQ Response' : 'Create Approved FAQ'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                >
                  {FAQ_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Question *</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Where is the hospital located?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Hospital Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Provide precise, verified details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Search Keywords (Comma Separated)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="location, address, direction, maps"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeFaq"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-[#0e4a7b] focus:ring-[#0e4a7b]"
                />
                <label htmlFor="activeFaq" className="text-slate-700 font-medium cursor-pointer">
                  Activate for WhatsApp auto-responder
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0e4a7b] hover:bg-[#0b3459] text-white font-semibold rounded-xl transition shadow"
                >
                  {editingFaq ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
