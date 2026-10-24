'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Phone, Mail, Stethoscope, CheckCircle2, X } from 'lucide-react';
import { Department, Doctor } from '@/types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        fetch('/api/departments?all=true'),
        fetch('/api/doctors?all=true'),
      ]);
      const [deptData, docData] = await Promise.all([deptRes.json(), docRes.json()]);
      if (deptData.success) setDepartments(deptData.data);
      if (docData.success) setDoctors(docData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setContactPhone('+91 33 2456 7890');
    setContactEmail('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description || '');
    setContactPhone(d.contact_phone || '');
    setContactEmail(d.contact_email || '');
    setIsActive(d.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await fetch('/api/departments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingDept.id,
            name,
            code,
            description,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            is_active: isActive,
          }),
        });
      } else {
        await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            code,
            description,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            is_active: isActive,
          }),
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Departments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hospital outpatient specialties, clinic contact numbers, and doctor associations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptDocs = doctors.filter(d => d.department_id === dept.id && d.is_active);
          return (
            <div
              key={dept.id}
              className={`bg-white rounded-2xl border ${
                dept.is_active ? 'border-slate-200' : 'border-slate-300 opacity-70'
              } p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{dept.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {dept.description || 'Specialized outpatient and diagnostic care.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {dept.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept.contact_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Stethoscope className="w-3.5 h-3.5 text-[#0e4a7b]" />
                    <span>{deptDocs.length} Specialists Assigned</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => openEditModal(dept)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingDept ? 'Edit Clinical Department' : 'Create Department'}
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
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Cardiology"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code / Short Tag *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="CARDIO"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Heart care, hypertension, echocardiography..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desk Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 33 2456 7892"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="cardio@hospital.demo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeDept"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-[#0e4a7b] focus:ring-[#0e4a7b]"
                />
                <label htmlFor="activeDept" className="text-slate-700 font-medium cursor-pointer">
                  Display in WhatsApp patient booking menu
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
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
