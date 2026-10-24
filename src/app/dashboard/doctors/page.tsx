'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Stethoscope,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { Doctor, Department } from '@/types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [qualification, setQualification] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [experienceYears, setExperienceYears] = useState(10);
  const [consultationFee, setConsultationFee] = useState(600);
  const [followUpFee, setFollowUpFee] = useState(400);
  const [roomNumber, setRoomNumber] = useState('OPD-101');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/doctors?all=true');
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, [fetchDoctors, fetchDepartments]);

  const openAddModal = () => {
    setEditingDoc(null);
    setFullName('');
    setQualification('');
    setSpeciality('');
    setExperienceYears(10);
    setConsultationFee(600);
    setFollowUpFee(400);
    setRoomNumber('OPD-101');
    setBio('');
    setIsActive(true);
    if (departments.length > 0) setDepartmentId(departments[0].id);
    setShowModal(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoc(doc);
    setFullName(doc.full_name);
    setDepartmentId(doc.department_id);
    setQualification(doc.qualification);
    setSpeciality(doc.speciality);
    setExperienceYears(doc.experience_years);
    setConsultationFee(doc.consultation_fee);
    setFollowUpFee(doc.follow_up_fee || 400);
    setRoomNumber(doc.room_number || 'OPD-101');
    setBio(doc.bio || '');
    setIsActive(doc.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        // PATCH
        const res = await fetch('/api/doctors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingDoc.id,
            department_id: departmentId,
            full_name: fullName,
            qualification,
            speciality,
            experience_years: experienceYears,
            consultation_fee: consultationFee,
            follow_up_fee: followUpFee,
            room_number: roomNumber,
            bio,
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchDoctors();
        }
      } else {
        // POST
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department_id: departmentId,
            full_name: fullName,
            qualification,
            speciality,
            experience_years: experienceYears,
            consultation_fee: consultationFee,
            follow_up_fee: followUpFee,
            room_number: roomNumber,
            bio,
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          fetchDoctors();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDoctorStatus = async (doc: Doctor) => {
    try {
      await fetch('/api/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          is_active: !doc.is_active,
        }),
      });
      fetchDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchSearch =
      !search ||
      doc.full_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.speciality.toLowerCase().includes(search.toLowerCase());
    const matchDept = !selectedDept || doc.department_id === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Doctors & OPD Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure consulting physicians, clinical specialties, consultation tariffs, and OPD working hours.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#0e4a7b] hover:bg-[#0b3459] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Specialist Doctor</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search doctor by name, qualification, or speciality..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
        >
          <option value="">All Clinical Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doc => (
          <div
            key={doc.id}
            className={`bg-white rounded-2xl border ${
              doc.is_active ? 'border-slate-200' : 'border-slate-300 opacity-75'
            } p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 text-[#0e4a7b] flex items-center justify-center font-bold text-sm shadow-inner">
                    <Stethoscope className="w-6 h-6 text-[#0e4a7b]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                      {doc.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">{doc.qualification}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleDoctorStatus(doc)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                    doc.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                      : 'bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                  }`}
                  title="Click to toggle active status"
                >
                  {doc.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#0d9488]" />
                  <span>{doc.department_name || 'General Medicine'}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Fee: <strong className="text-slate-900">₹{doc.consultation_fee}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Room: <strong className="text-slate-900">{doc.room_number || 'OPD-101'}</strong>
                  </span>
                </div>

                {doc.bio && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic pt-1 border-t border-slate-100">
                    &ldquo;{doc.bio}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {doc.experience_years}+ Yrs Experience
              </span>
              <button
                onClick={() => openEditModal(doc)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Create / Edit Modal */}
      {/* -------------------------------------------------------------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingDoc ? 'Edit Specialist Doctor' : 'Register New Doctor'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Dr. Rajesh Sen"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                    placeholder="MBBS, MS (Ortho)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Speciality *</label>
                  <input
                    type="text"
                    required
                    value={speciality}
                    onChange={e => setSpeciality(e.target.value)}
                    placeholder="Joint Replacement Surgeon"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={consultationFee}
                    onChange={e => setConsultationFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Follow-up Fee (₹)</label>
                  <input
                    type="number"
                    value={followUpFee}
                    onChange={e => setFollowUpFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Chamber</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    placeholder="OPD-108"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Clinical Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Specialist in knee & hip replacements with over 15 years experience..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4a7b]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeDoc"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-[#0e4a7b] focus:ring-[#0e4a7b]"
                />
                <label htmlFor="activeDoc" className="text-slate-700 font-medium cursor-pointer">
                  Available for Patient WhatsApp Appointments
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
                  {editingDoc ? 'Save Changes' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
