// ==============================================================================
// MEDICONNECT REPOSITORY LAYER
// Robust data access supporting both Supabase PostgreSQL and
// offline Demo Mode with atomic slot reservations and concurrency safety.
// ==============================================================================

import {
  Hospital,
  HospitalSettings,
  Department,
  Doctor,
  DoctorSchedule,
  DoctorTimeOff,
  Appointment,
  PatientQuery,
  QueryNote,
  FAQ,
  AuditLog,
  NotificationLog,
  AppointmentStatus,
  QueryStatus,
  Profile,
  UserRole,
} from '@/types';
import { getSupabaseAdmin, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

// ------------------------------------------------------------------------------
// In-Memory / Local Demo Store (Initialized with realistic Indian hospital data)
// ------------------------------------------------------------------------------
const DEMO_HOSPITAL: Hospital = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Hiramani Memorial Hospital',
  slug: 'hiramani-memorial-hospital',
  registration_number: 'REG-WB-KOL-2024-8976',
  phone: '+91 33 2456 7890',
  emergency_contact: '+91 98765 00108',
  email: 'contact@hiramanimemorial.demo',
  website: 'https://hiramanimemorial.demo',
  address_line1: '124/A Eastern Metropolitan Bypass',
  address_line2: 'Mukundapur, Near Metro Station',
  city: 'Kolkata',
  state: 'West Bengal',
  pincode: '700099',
  google_maps_url: 'https://maps.google.com/?q=Hiramani+Memorial+Hospital+Kolkata',
  timezone: 'Asia/Kolkata',
  is_active: true,
  created_at: new Date().toISOString(),
};

const DEMO_SETTINGS: HospitalSettings = {
  id: '00000000-0000-0000-0000-000000000010',
  hospital_id: DEMO_HOSPITAL.id,
  opd_timings: 'Monday to Saturday: 08:30 AM to 08:00 PM | Sunday: 09:00 AM to 01:00 PM',
  visiting_hours: 'Morning: 11:00 AM to 01:00 PM | Evening: 05:00 PM to 07:00 PM',
  reception_hours: '24 Hours Emergency, Trauma & Reception',
  cancellation_policy: 'Appointments can be cancelled or rescheduled up to 2 hours before the scheduled time with no penalty.',
  booking_policy: 'Appointments can be booked up to 14 days in advance via WhatsApp or online portal.',
  advance_booking_days: 14,
  whatsapp_phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsapp_business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  whatsapp_display_number: '+91 98765 43210',
  is_whatsapp_connected: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
};

const DEMO_DEPARTMENTS: Department[] = [
  { id: '10000000-0000-0000-0000-000000000001', hospital_id: DEMO_HOSPITAL.id, name: 'General Medicine', code: 'GENMED', description: 'Primary care, adult wellness, fever & diabetes management', contact_phone: '+91 33 2456 7891', icon_name: 'Stethoscope', is_active: true, display_order: 1 },
  { id: '10000000-0000-0000-0000-000000000002', hospital_id: DEMO_HOSPITAL.id, name: 'Cardiology', code: 'CARDIO', description: 'Heart care, hypertension, ECG, echocardiography, cardiac prevention', contact_phone: '+91 33 2456 7892', icon_name: 'HeartPulse', is_active: true, display_order: 2 },
  { id: '10000000-0000-0000-0000-000000000003', hospital_id: DEMO_HOSPITAL.id, name: 'Orthopaedics', code: 'ORTHO', description: 'Bones, joints, arthritis, sports injuries, fracture management', contact_phone: '+91 33 2456 7893', icon_name: 'Bone', is_active: true, display_order: 3 },
  { id: '10000000-0000-0000-0000-000000000004', hospital_id: DEMO_HOSPITAL.id, name: 'Dermatology', code: 'DERMA', description: 'Skin, hair, allergies, cosmetic dermatology, acne treatment', contact_phone: '+91 33 2456 7894', icon_name: 'Sparkles', is_active: true, display_order: 4 },
  { id: '10000000-0000-0000-0000-000000000005', hospital_id: DEMO_HOSPITAL.id, name: 'Paediatrics', code: 'PAED', description: 'Child health, immunisation, newborn care, paediatric emergencies', contact_phone: '+91 33 2456 7895', icon_name: 'Baby', is_active: true, display_order: 5 },
  { id: '10000000-0000-0000-0000-000000000006', hospital_id: DEMO_HOSPITAL.id, name: 'Gynaecology & Obstetrics', code: 'GYNAEC', description: 'Women health, prenatal care, fertility, maternity services', contact_phone: '+91 33 2456 7896', icon_name: 'HeartHandshake', is_active: true, display_order: 6 },
  { id: '10000000-0000-0000-0000-000000000007', hospital_id: DEMO_HOSPITAL.id, name: 'ENT (Otolaryngology)', code: 'ENT', description: 'Ear, nose, throat disorders, hearing tests, sinus consultations', contact_phone: '+91 33 2456 7897', icon_name: 'Headphones', is_active: true, display_order: 7 },
];

const DEMO_DOCTORS: Doctor[] = [
  { id: '20000000-0000-0000-0000-000000000001', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000001', department_name: 'General Medicine', full_name: 'Dr. Sourav Mukherjee', qualification: 'MBBS, MD (Medicine)', speciality: 'Consultant Physician & Diabetologist', experience_years: 14, bio: 'Specialises in diabetes management, chronic hypertension, and adult fever.', consultation_fee: 600, follow_up_fee: 400, room_number: 'OPD-101', is_active: true, display_order: 1 },
  { id: '20000000-0000-0000-0000-000000000002', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000002', department_name: 'Cardiology', full_name: 'Dr. Ananya Roy Chowdhury', qualification: 'MBBS, MD, DM (Cardiology)', speciality: 'Senior Interventional Cardiologist', experience_years: 18, bio: 'Expertise in preventive cardiology, coronary angioplasty, and heart failure care.', consultation_fee: 900, follow_up_fee: 600, room_number: 'OPD-204', is_active: true, display_order: 2 },
  { id: '20000000-0000-0000-0000-000000000003', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000003', department_name: 'Orthopaedics', full_name: 'Dr. Rajesh Sen', qualification: 'MBBS, MS (Ortho), MCh', speciality: 'Orthopaedic & Joint Replacement Surgeon', experience_years: 16, bio: 'Specialist in arthroscopy, knee/hip replacement, and complex trauma fractures.', consultation_fee: 800, follow_up_fee: 500, room_number: 'OPD-108', is_active: true, display_order: 3 },
  { id: '20000000-0000-0000-0000-000000000004', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000004', department_name: 'Dermatology', full_name: 'Dr. Priyanka Banerjee', qualification: 'MBBS, MD (DVL)', speciality: 'Consultant Dermatologist & Cosmetologist', experience_years: 9, bio: 'Focuses on clinical dermatology, hair disorders, and laser procedures.', consultation_fee: 700, follow_up_fee: 450, room_number: 'OPD-112', is_active: true, display_order: 4 },
  { id: '20000000-0000-0000-0000-000000000005', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000005', department_name: 'Paediatrics', full_name: 'Dr. Amitav Das', qualification: 'MBBS, DCH, MD (Paediatrics)', speciality: 'Senior Paediatrician & Neonatologist', experience_years: 15, bio: 'Dedicated to newborn care, childhood immunisations, and developmental milestones.', consultation_fee: 650, follow_up_fee: 400, room_number: 'OPD-105', is_active: true, display_order: 5 },
  { id: '20000000-0000-0000-0000-000000000006', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000006', department_name: 'Gynaecology & Obstetrics', full_name: 'Dr. Nandini Sengupta', qualification: 'MBBS, MS (Obst & Gynae)', speciality: 'Senior Gynaecologist & Laparoscopic Surgeon', experience_years: 17, bio: 'High-risk pregnancy management, fibroids, adolescent gynaecology.', consultation_fee: 850, follow_up_fee: 500, room_number: 'OPD-210', is_active: true, display_order: 6 },
  { id: '20000000-0000-0000-0000-000000000007', hospital_id: DEMO_HOSPITAL.id, department_id: '10000000-0000-0000-0000-000000000007', department_name: 'ENT (Otolaryngology)', full_name: 'Dr. Subhashis Ghosh', qualification: 'MBBS, MS (ENT)', speciality: 'Senior ENT & Head-Neck Specialist', experience_years: 12, bio: 'Treats chronic sinusitis, hearing impairment, vertigo, and voice disorders.', consultation_fee: 600, follow_up_fee: 400, room_number: 'OPD-115', is_active: true, display_order: 7 },
];

const DEMO_SCHEDULES: DoctorSchedule[] = [
  // Dr. Sourav (Mon, Tue, Wed, Thu, Fri, Sat: 09:00 - 13:00, 20-min slots)
  { id: 's-1-1', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 1, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-1-2', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 2, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-1-3', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 3, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-1-4', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 4, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-1-5', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 5, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-1-6', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000001', day_of_week: 6, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  // Dr. Ananya (Mon-Sat: 10:00 - 14:00, 30-min slots)
  { id: 's-2-1', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 1, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  { id: 's-2-2', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 2, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  { id: 's-2-3', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 3, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  { id: 's-2-4', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 4, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  { id: 's-2-5', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 5, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  { id: 's-2-6', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000002', day_of_week: 6, start_time: '10:00', end_time: '14:00', slot_duration_minutes: 30, max_patients_per_slot: 1, is_active: true },
  // Dr. Rajesh Sen (Mon-Sat: 14:00 - 18:00, 20-min slots)
  { id: 's-3-1', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000003', day_of_week: 1, start_time: '14:00', end_time: '18:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-3-3', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000003', day_of_week: 3, start_time: '14:00', end_time: '18:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
  { id: 's-3-5', hospital_id: DEMO_HOSPITAL.id, doctor_id: '20000000-0000-0000-0000-000000000003', day_of_week: 5, start_time: '14:00', end_time: '18:00', slot_duration_minutes: 20, max_patients_per_slot: 1, is_active: true },
];

const DEMO_FAQS: FAQ[] = [
  { id: 'f-1', hospital_id: DEMO_HOSPITAL.id, category: 'Hospital Information', question: 'Where is Hiramani Memorial Hospital located?', answer: 'Hiramani Memorial Hospital is located at 124/A Eastern Metropolitan Bypass, Mukundapur, Kolkata, West Bengal - 700099 (Near Metro Station). Google Maps: https://maps.google.com/?q=Hiramani+Memorial+Hospital+Kolkata', keywords: ['location', 'address', 'where', 'direction', 'map'], is_active: true, display_order: 1 },
  { id: 'f-2', hospital_id: DEMO_HOSPITAL.id, category: 'OPD Timings', question: 'What are the OPD clinic operating hours?', answer: 'Our OPD runs Monday through Saturday from 08:30 AM to 08:00 PM, and Sundays from 09:00 AM to 01:00 PM. Emergency and trauma care operates 24x7.', keywords: ['timing', 'opd', 'hours', 'open', 'schedule', 'sunday'], is_active: true, display_order: 2 },
  { id: 'f-3', hospital_id: DEMO_HOSPITAL.id, category: 'Consultation Fees', question: 'What are the doctor consultation charges?', answer: 'OPD consultation fees range from ₹600 to ₹900 depending on the specialist. General Medicine is ₹600, Paediatrics ₹650, Orthopaedics ₹800, and Cardiology ₹900.', keywords: ['fee', 'cost', 'charge', 'price', 'consultation'], is_active: true, display_order: 3 },
  { id: 'f-4', hospital_id: DEMO_HOSPITAL.id, category: 'Laboratory', question: 'Is blood testing and radiology available?', answer: 'Yes, our NABL accredited laboratory and diagnostic imaging (Digital X-Ray, USG, 128-Slice CT, 2D-Echo, TMT) operate daily with home blood collection available from 06:30 AM.', keywords: ['lab', 'blood test', 'pathology', 'xray', 'ct scan', 'ultrasound'], is_active: true, display_order: 4 },
  { id: 'f-5', hospital_id: DEMO_HOSPITAL.id, category: 'Visiting Hours', question: 'When can visitors see admitted patients in the ward?', answer: 'Visiting hours are strictly 11:00 AM to 01:00 PM in the morning and 05:00 PM to 07:00 PM in the evening. One visitor pass is issued per patient.', keywords: ['visit', 'visitor', 'timing', 'ward', 'icu'], is_active: true, display_order: 5 },
  { id: 'f-6', hospital_id: DEMO_HOSPITAL.id, category: 'Insurance', question: 'Which health insurance and TPA cards do you accept for cashless billing?', answer: 'We offer cashless hospitalisation with major TPAs and insurers including Star Health, HDFC ERGO, ICICI Lombard, Care Health, Medi Assist, Paramount, and Raksha TPA.', keywords: ['insurance', 'cashless', 'tpa', 'mediclaim', 'claim'], is_active: true, display_order: 6 },
  { id: 'f-7', hospital_id: DEMO_HOSPITAL.id, category: 'Appointments', question: 'How do I cancel or reschedule my appointment?', answer: 'You can cancel or reschedule via WhatsApp by typing "Cancel appointment" or "Reschedule" and providing your booking reference, or by calling reception at +91 33 2456 7890.', keywords: ['cancel', 'reschedule', 'change', 'booking'], is_active: true, display_order: 7 },
];

const DEMO_STAFF: Profile[] = [
  { id: 'u-1', email: 'admin@hiramanihospital.demo', full_name: 'Dr. Debabrata Roy (Medical Director)', role: 'hospital_admin', hospital_id: DEMO_HOSPITAL.id, phone_number: '+919830099999', created_at: new Date().toISOString() },
  { id: 'u-2', email: 'reception@hiramanihospital.demo', full_name: 'Soma Chakraborty (Head Receptionist)', role: 'receptionist', hospital_id: DEMO_HOSPITAL.id, phone_number: '+919830088888', created_at: new Date().toISOString() },
  { id: 'u-3', email: 'cardio.staff@hiramanihospital.demo', full_name: 'Rohan Mitra (Cardiology Coordinator)', role: 'department_staff', hospital_id: DEMO_HOSPITAL.id, phone_number: '+919830077777', created_at: new Date().toISOString() },
];

// In-Memory state for live testing
let inMemoryAppointments: Appointment[] = [
  {
    id: 'apt-demo-1',
    hospital_id: DEMO_HOSPITAL.id,
    booking_reference: 'APT-20261025-4819',
    doctor_id: '20000000-0000-0000-0000-000000000001',
    doctor_name: 'Dr. Sourav Mukherjee',
    department_id: '10000000-0000-0000-0000-000000000001',
    department_name: 'General Medicine',
    patient_name: 'Amit Kumar Roy',
    patient_phone: '+919830111222',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '10:20',
    status: 'confirmed',
    consultation_fee: 600,
    booking_channel: 'whatsapp',
    administrative_note: 'Routine diabetes check-up (Sample Demonstration Record)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'apt-demo-2',
    hospital_id: DEMO_HOSPITAL.id,
    booking_reference: 'APT-20261025-9124',
    doctor_id: '20000000-0000-0000-0000-000000000002',
    doctor_name: 'Dr. Ananya Roy Chowdhury',
    department_id: '10000000-0000-0000-0000-000000000002',
    department_name: 'Cardiology',
    patient_name: 'Meera Sen',
    patient_phone: '+919830222333',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '11:00',
    end_time: '11:30',
    status: 'requested',
    consultation_fee: 900,
    booking_channel: 'whatsapp',
    administrative_note: 'ECG review requested (Sample Demonstration Record)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let inMemoryQueries: PatientQuery[] = [
  {
    id: 'qry-demo-1',
    hospital_id: DEMO_HOSPITAL.id,
    ticket_number: 'TKT-20261025-1001',
    patient_name: 'Arunava Ghosh',
    patient_phone: '+919830012345',
    category: 'Laboratory',
    subject: 'Home Sample Collection Enquiry',
    description: 'Need home blood collection for fasting blood sugar and lipid profile for senior citizen tomorrow at 7am in Mukundapur.',
    status: 'open',
    priority: 'medium',
    assigned_to: 'u-2',
    assigned_to_name: 'Soma Chakraborty (Head Receptionist)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'qry-demo-2',
    hospital_id: DEMO_HOSPITAL.id,
    ticket_number: 'TKT-20261025-1002',
    patient_name: 'Sunita Sharma',
    patient_phone: '+919830067890',
    category: 'Billing',
    subject: 'Cashless TPA Pre-authorization status',
    description: 'Admitted for gallbladder surgery under Star Health policy. Please let us know if pre-auth sanction letter was received.',
    status: 'in_progress',
    priority: 'high',
    assigned_to: 'u-2',
    assigned_to_name: 'Soma Chakraborty (Head Receptionist)',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let inMemoryNotes: QueryNote[] = [
  {
    id: 'note-1',
    query_id: 'qry-demo-2',
    author_id: 'u-2',
    author_name: 'Soma Chakraborty',
    note: 'Spoke with Star Health TPA desk. Initial query raised regarding doctor referral slip; requested documents forwarded.',
    is_internal: true,
    created_at: new Date().toISOString(),
  },
];

let inMemoryAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    hospital_id: DEMO_HOSPITAL.id,
    actor_name: 'System',
    action: 'SYSTEM_BOOT',
    entity_type: 'hospital',
    entity_id: DEMO_HOSPITAL.id,
    details: { message: 'MediConnect platform loaded successfully in demo environment' },
    created_at: new Date().toISOString(),
  },
];

let inMemoryWebhookEventIds = new Set<string>();
let inMemoryNotificationLogs: NotificationLog[] = [];

let inMemoryTimeOff: DoctorTimeOff[] = [
  {
    id: 'timeoff-demo-1',
    hospital_id: DEMO_HOSPITAL.id,
    doctor_id: 'doc-3', // Dr. Ananya Mukherjee
    start_date: '2026-11-15',
    end_date: '2026-11-18',
    reason: 'Annual Pediatric Conference',
  },
];

export function getHospitalTodayDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// ------------------------------------------------------------------------------
// Repository Methods
// ------------------------------------------------------------------------------
export const HospitalRepo = {
  // --- Hospital Settings & Details ---
  async getHospital(): Promise<Hospital> {
    return DEMO_HOSPITAL;
  },

  async updateHospital(updates: Partial<Hospital>): Promise<Hospital> {
    Object.assign(DEMO_HOSPITAL, updates);
    HospitalRepo.logAudit('Staff', 'UPDATE_HOSPITAL', 'hospital', DEMO_HOSPITAL.id, updates);
    return DEMO_HOSPITAL;
  },

  async getSettings(): Promise<HospitalSettings> {
    return DEMO_SETTINGS;
  },

  async updateSettings(updates: Partial<HospitalSettings>): Promise<HospitalSettings> {
    Object.assign(DEMO_SETTINGS, updates);
    HospitalRepo.logAudit('Staff', 'UPDATE_SETTINGS', 'settings', DEMO_SETTINGS.id, updates);
    return DEMO_SETTINGS;
  },

  // --- Departments ---
  async getDepartments(onlyActive = true): Promise<Department[]> {
    return DEMO_DEPARTMENTS.filter(d => (onlyActive ? d.is_active : true)).sort(
      (a, b) => a.display_order - b.display_order
    );
  },

  async getDepartmentById(id: string): Promise<Department | undefined> {
    return DEMO_DEPARTMENTS.find(d => d.id === id);
  },

  async createDepartment(data: Omit<Department, 'id' | 'hospital_id' | 'display_order'>): Promise<Department> {
    const newDept: Department = {
      ...data,
      id: `dept-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      display_order: DEMO_DEPARTMENTS.length + 1,
    };
    DEMO_DEPARTMENTS.push(newDept);
    HospitalRepo.logAudit('Staff', 'CREATE_DEPARTMENT', 'department', newDept.id, { name: newDept.name });
    return newDept;
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
    const dept = DEMO_DEPARTMENTS.find(d => d.id === id);
    if (!dept) return undefined;
    Object.assign(dept, updates);
    HospitalRepo.logAudit('Staff', 'UPDATE_DEPARTMENT', 'department', id, updates);
    return dept;
  },

  // --- Doctors ---
  async getDoctors(departmentId?: string, onlyActive = true): Promise<Doctor[]> {
    let list = DEMO_DOCTORS.filter(d => (onlyActive ? d.is_active : true));
    if (departmentId) {
      list = list.filter(d => d.department_id === departmentId);
    }
    return list.map(doc => {
      const dept = DEMO_DEPARTMENTS.find(d => d.id === doc.department_id);
      return { ...doc, department_name: dept?.name || doc.department_name };
    });
  },

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    const doc = DEMO_DOCTORS.find(d => d.id === id);
    if (!doc) return undefined;
    const dept = DEMO_DEPARTMENTS.find(d => d.id === doc.department_id);
    return { ...doc, department_name: dept?.name || doc.department_name };
  },

  async createDoctor(data: Omit<Doctor, 'id' | 'hospital_id' | 'display_order' | 'department_name'>): Promise<Doctor> {
    const dept = DEMO_DEPARTMENTS.find(d => d.id === data.department_id);
    const newDoc: Doctor = {
      ...data,
      id: `doc-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      department_name: dept?.name,
      display_order: DEMO_DOCTORS.length + 1,
    };
    DEMO_DOCTORS.push(newDoc);
    // Add default schedule (Mon-Sat 10:00 to 13:00)
    for (let day = 1; day <= 6; day++) {
      DEMO_SCHEDULES.push({
        id: `s-${newDoc.id}-${day}`,
        hospital_id: DEMO_HOSPITAL.id,
        doctor_id: newDoc.id,
        day_of_week: day,
        start_time: '10:00',
        end_time: '13:00',
        slot_duration_minutes: 20,
        max_patients_per_slot: 1,
        is_active: true,
      });
    }
    HospitalRepo.logAudit('Staff', 'CREATE_DOCTOR', 'doctor', newDoc.id, { name: newDoc.full_name });
    return newDoc;
  },

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined> {
    const doc = DEMO_DOCTORS.find(d => d.id === id);
    if (!doc) return undefined;
    Object.assign(doc, updates);
    HospitalRepo.logAudit('Staff', 'UPDATE_DOCTOR', 'doctor', id, updates);
    return doc;
  },

  // --- Schedules & Genuinely Available Slots ---
  async getDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    return DEMO_SCHEDULES.filter(s => s.doctor_id === doctorId && s.is_active);
  },

  async getAvailableSlots(doctorId: string, dateStr: string): Promise<string[]> {
    // 1. Verify doctor exists and is active
    const doctor = DEMO_DOCTORS.find(d => d.id === doctorId && d.is_active);
    if (!doctor) return [];

    // 2. Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return [];
    }

    const todayStr = getHospitalTodayDate();
    // 3. Past dates have no available slots
    if (dateStr < todayStr) {
      return [];
    }

    // 4. Validate advance booking window (e.g. 14 days)
    const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();
    const reqMs = new Date(`${dateStr}T00:00:00Z`).getTime();
    const diffDays = Math.ceil((reqMs - todayMs) / (1000 * 60 * 60 * 24));
    const maxDays = DEMO_SETTINGS.advance_booking_days || 14;
    if (diffDays > maxDays) {
      return [];
    }

    // 5. Check if doctor is on scheduled leave/time off
    const isOnLeave = inMemoryTimeOff.some(
      to => to.doctor_id === doctorId && dateStr >= to.start_date && dateStr <= to.end_date
    );
    if (isOnLeave) {
      return [];
    }

    // 6. Determine day of week for requested date
    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday

    // 7. Find active schedule for this day
    const schedule = DEMO_SCHEDULES.find(
      s => s.doctor_id === doctorId && s.day_of_week === dayOfWeek && s.is_active
    );
    if (!schedule) return [];

    // 8. Generate all slot times
    const slots: string[] = [];
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = schedule.slot_duration_minutes || 20;

    for (let time = startMinutes; time + duration <= endMinutes; time += duration) {
      const h = Math.floor(time / 60).toString().padStart(2, '0');
      const m = (time % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }

    // 9. Fetch booked appointments for this doctor on this date
    const bookedAppointments = inMemoryAppointments.filter(
      apt =>
        apt.doctor_id === doctorId &&
        apt.appointment_date === dateStr &&
        apt.status !== 'cancelled'
    );

    const bookedSlots = new Set(bookedAppointments.map(a => a.start_time.slice(0, 5)));

    // Return slots that are NOT booked (Concurrency/Double-booking safe)
    return slots.filter(slot => !bookedSlots.has(slot));
  },

  // --- Doctor Time-Off / Leave Management ---
  async getDoctorTimeOff(doctorId: string): Promise<DoctorTimeOff[]> {
    return inMemoryTimeOff.filter(t => t.doctor_id === doctorId);
  },

  async addDoctorTimeOff(params: {
    doctor_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<DoctorTimeOff> {
    const newRecord: DoctorTimeOff = {
      id: `to-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      doctor_id: params.doctor_id,
      start_date: params.start_date,
      end_date: params.end_date,
      reason: params.reason,
    };
    inMemoryTimeOff.push(newRecord);
    HospitalRepo.logAudit('Staff', 'ADD_TIME_OFF', 'doctor_time_off', newRecord.id, params);
    return newRecord;
  },

  async deleteDoctorTimeOff(id: string): Promise<boolean> {
    const idx = inMemoryTimeOff.findIndex(t => t.id === id);
    if (idx !== -1) {
      inMemoryTimeOff.splice(idx, 1);
      HospitalRepo.logAudit('Staff', 'DELETE_TIME_OFF', 'doctor_time_off', id, {});
      return true;
    }
    return false;
  },

  // --- Atomic Concurrency-Safe Appointment Reservation ---
  async bookAppointment(params: {
    doctor_id: string;
    department_id?: string;
    patient_name: string;
    patient_phone: string;
    appointment_date: string;
    start_time: string;
    booking_channel?: Appointment['booking_channel'];
    administrative_note?: string;
  }): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    // 1. Validate patient name
    if (!params.patient_name || params.patient_name.trim().length < 2) {
      return { success: false, error: 'Patient full name is required (minimum 2 characters).' };
    }

    // 2. Validate patient phone
    const cleanPhone = params.patient_phone ? params.patient_phone.replace(/\D/g, '') : '';
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // 3. Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.appointment_date)) {
      return { success: false, error: 'Invalid appointment date format. Use YYYY-MM-DD.' };
    }

    const todayStr = getHospitalTodayDate();
    // 4. Past date prevention
    if (params.appointment_date < todayStr) {
      return { success: false, error: 'Cannot book appointments for past dates.' };
    }

    // 5. Max advance booking window
    const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();
    const reqMs = new Date(`${params.appointment_date}T00:00:00Z`).getTime();
    const diffDays = Math.ceil((reqMs - todayMs) / (1000 * 60 * 60 * 24));
    const maxDays = DEMO_SETTINGS.advance_booking_days || 14;
    if (diffDays > maxDays) {
      return {
        success: false,
        error: `Appointments can only be booked up to ${maxDays} days in advance.`,
      };
    }

    // 6. Verify doctor existence & status
    const doctor = DEMO_DOCTORS.find(d => d.id === params.doctor_id && d.is_active);
    if (!doctor) {
      return { success: false, error: 'Doctor not found or inactive.' };
    }

    // 7. Check doctor time-off / scheduled leave
    const isOnLeave = inMemoryTimeOff.some(
      to =>
        to.doctor_id === params.doctor_id &&
        params.appointment_date >= to.start_date &&
        params.appointment_date <= to.end_date
    );
    if (isOnLeave) {
      return {
        success: false,
        error: `Dr. ${doctor.full_name} is on scheduled leave on ${params.appointment_date}. Please choose another date or doctor.`,
      };
    }

    // 8. Validate requested time against doctor schedule
    const formattedStartTime = params.start_time.slice(0, 5);
    const dateObj = new Date(`${params.appointment_date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const schedule = DEMO_SCHEDULES.find(
      s => s.doctor_id === params.doctor_id && s.day_of_week === dayOfWeek && s.is_active
    );
    if (!schedule) {
      return {
        success: false,
        error: `Doctor is not scheduled for OPD on this day of the week.`,
      };
    }

    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [schedEndH, schedEndM] = schedule.end_time.split(':').map(Number);
    const [reqH, reqM] = formattedStartTime.split(':').map(Number);
    const reqMins = reqH * 60 + reqM;
    const schedStartMins = startH * 60 + startM;
    const schedEndMins = schedEndH * 60 + schedEndM;

    if (reqMins < schedStartMins || reqMins >= schedEndMins) {
      return {
        success: false,
        error: `Requested slot ${formattedStartTime} is outside doctor OPD hours (${schedule.start_time} - ${schedule.end_time}).`,
      };
    }

    const deptId = params.department_id || doctor.department_id;
    const dept = DEMO_DEPARTMENTS.find(d => d.id === deptId);

    // 9. Concurrency check: Ensure slot is genuinely free right now
    const conflict = inMemoryAppointments.find(
      a =>
        a.doctor_id === params.doctor_id &&
        a.appointment_date === params.appointment_date &&
        a.start_time.slice(0, 5) === formattedStartTime &&
        a.status !== 'cancelled'
    );

    if (conflict) {
      return {
        success: false,
        error: `Slot ${formattedStartTime} on ${params.appointment_date} has already been reserved. Please select another time.`,
      };
    }

    // Calculate end time
    const [h, m] = formattedStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 20;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');
    const formattedEndTime = `${endH}:${endM}`;

    // Generate unique reference e.g. APT-20261025-XXXX
    const dateTag = params.appointment_date.replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `APT-${dateTag}-${randomSuffix}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      booking_reference: bookingReference,
      doctor_id: doctor.id,
      doctor_name: doctor.full_name,
      department_id: deptId,
      department_name: dept?.name || 'General',
      patient_name: params.patient_name.trim(),
      patient_phone: params.patient_phone.trim(),
      appointment_date: params.appointment_date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      status: 'confirmed',
      consultation_fee: doctor.consultation_fee,
      booking_channel: params.booking_channel || 'whatsapp',
      administrative_note: params.administrative_note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryAppointments.unshift(newAppointment);

    HospitalRepo.logAudit(
      params.patient_name,
      'BOOK_APPOINTMENT',
      'appointment',
      newAppointment.id,
      {
        booking_reference: bookingReference,
        doctor: doctor.full_name,
        date: params.appointment_date,
        slot: formattedStartTime,
      }
    );

    return { success: true, appointment: newAppointment };
  },

  // --- Appointments Management ---
  async getAppointments(filters?: {
    search?: string;
    doctor_id?: string;
    department_id?: string;
    status?: AppointmentStatus;
    date?: string;
  }): Promise<Appointment[]> {
    let list = [...inMemoryAppointments];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        a =>
          a.patient_name.toLowerCase().includes(q) ||
          a.booking_reference.toLowerCase().includes(q) ||
          a.patient_phone.includes(q)
      );
    }
    if (filters?.doctor_id) {
      list = list.filter(a => a.doctor_id === filters.doctor_id);
    }
    if (filters?.department_id) {
      list = list.filter(a => a.department_id === filters.department_id);
    }
    if (filters?.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters?.date) {
      list = list.filter(a => a.appointment_date === filters.date);
    }

    return list.sort((a, b) => (b.appointment_date + b.start_time).localeCompare(a.appointment_date + a.start_time));
  },

  async getAppointmentByReference(ref: string): Promise<Appointment | undefined> {
    const cleanRef = ref.trim().toUpperCase();
    return inMemoryAppointments.find(a => a.booking_reference.toUpperCase() === cleanRef);
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<Appointment | undefined> {
    const apt = inMemoryAppointments.find(a => a.id === id);
    if (!apt) return undefined;
    apt.status = status;
    if (reason) apt.cancellation_reason = reason;
    apt.updated_at = new Date().toISOString();

    HospitalRepo.logAudit('Staff', 'UPDATE_APPOINTMENT_STATUS', 'appointment', id, {
      new_status: status,
      reason,
    });
    return apt;
  },

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newSlot: string
  ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    const apt = inMemoryAppointments.find(a => a.id === id);
    if (!apt) return { success: false, error: 'Appointment not found' };

    // Check slot availability
    const formattedSlot = newSlot.slice(0, 5);
    const conflict = inMemoryAppointments.find(
      a =>
        a.id !== id &&
        a.doctor_id === apt.doctor_id &&
        a.appointment_date === newDate &&
        a.start_time.slice(0, 5) === formattedSlot &&
        a.status !== 'cancelled'
    );
    if (conflict) {
      return { success: false, error: 'Slot is already booked by another patient' };
    }

    const [h, m] = formattedSlot.split(':').map(Number);
    const endMinutes = h * 60 + m + 20;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    apt.appointment_date = newDate;
    apt.start_time = formattedSlot;
    apt.end_time = `${endH}:${endM}`;
    apt.status = 'confirmed';
    apt.updated_at = new Date().toISOString();

    HospitalRepo.logAudit('Patient/Staff', 'RESCHEDULE_APPOINTMENT', 'appointment', id, {
      new_date: newDate,
      new_slot: formattedSlot,
    });

    return { success: true, appointment: apt };
  },

  // --- Patient Queries & Ticketing ---
  async createQuery(params: {
    patient_name: string;
    patient_phone: string;
    category: PatientQuery['category'];
    description: string;
    subject?: string;
    priority?: PatientQuery['priority'];
  }): Promise<PatientQuery> {
    const randomTicket = Math.floor(1000 + Math.random() * 9000);
    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticketNumber = `TKT-${dateTag}-${randomTicket}`;

    const newQuery: PatientQuery = {
      id: `qry-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      ticket_number: ticketNumber,
      patient_name: params.patient_name.trim(),
      patient_phone: params.patient_phone.trim(),
      category: params.category,
      subject: params.subject || `${params.category} Enquiry`,
      description: params.description.trim(),
      status: 'open',
      priority: params.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryQueries.unshift(newQuery);
    HospitalRepo.logAudit(params.patient_name, 'CREATE_QUERY', 'query', newQuery.id, {
      ticket_number: ticketNumber,
      category: params.category,
    });

    return newQuery;
  },

  async getQueries(filters?: {
    search?: string;
    status?: QueryStatus;
    category?: PatientQuery['category'];
  }): Promise<PatientQuery[]> {
    let list = [...inMemoryQueries];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        item =>
          item.ticket_number.toLowerCase().includes(q) ||
          item.patient_name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      list = list.filter(item => item.status === filters.status);
    }
    if (filters?.category) {
      list = list.filter(item => item.category === filters.category);
    }
    return list;
  },

  async updateQuery(
    id: string,
    updates: Partial<PatientQuery>
  ): Promise<PatientQuery | undefined> {
    const qry = inMemoryQueries.find(q => q.id === id);
    if (!qry) return undefined;
    Object.assign(qry, updates);
    qry.updated_at = new Date().toISOString();
    HospitalRepo.logAudit('Staff', 'UPDATE_QUERY', 'query', id, updates);
    return qry;
  },

  async getQueryNotes(queryId: string): Promise<QueryNote[]> {
    return inMemoryNotes.filter(n => n.query_id === queryId);
  },

  async addQueryNote(queryId: string, authorName: string, note: string): Promise<QueryNote> {
    const newNote: QueryNote = {
      id: `note-${Date.now()}`,
      query_id: queryId,
      author_name: authorName,
      note,
      is_internal: true,
      created_at: new Date().toISOString(),
    };
    inMemoryNotes.push(newNote);
    return newNote;
  },

  // --- FAQs ---
  async getFAQs(category?: string, onlyActive = true): Promise<FAQ[]> {
    let list = DEMO_FAQS.filter(f => (onlyActive ? f.is_active : true));
    if (category) {
      list = list.filter(f => f.category === category);
    }
    return list.sort((a, b) => a.display_order - b.display_order);
  },

  async searchFAQs(query: string): Promise<FAQ[]> {
    const clean = query.toLowerCase().trim();
    return DEMO_FAQS.filter(
      f =>
        f.is_active &&
        (f.question.toLowerCase().includes(clean) ||
          f.answer.toLowerCase().includes(clean) ||
          f.keywords.some(k => clean.includes(k) || k.includes(clean)))
    );
  },

  async createFAQ(data: Omit<FAQ, 'id' | 'hospital_id' | 'display_order'>): Promise<FAQ> {
    const newFaq: FAQ = {
      ...data,
      id: `faq-${Date.now()}`,
      hospital_id: DEMO_HOSPITAL.id,
      display_order: DEMO_FAQS.length + 1,
    };
    DEMO_FAQS.push(newFaq);
    HospitalRepo.logAudit('Staff', 'CREATE_FAQ', 'faq', newFaq.id, { question: newFaq.question });
    return newFaq;
  },

  async updateFAQ(id: string, updates: Partial<FAQ>): Promise<FAQ | undefined> {
    const faq = DEMO_FAQS.find(f => f.id === id);
    if (!faq) return undefined;
    Object.assign(faq, updates);
    HospitalRepo.logAudit('Staff', 'UPDATE_FAQ', 'faq', id, updates);
    return faq;
  },

  async deleteFAQ(id: string): Promise<boolean> {
    const index = DEMO_FAQS.findIndex(f => f.id === id);
    if (index === -1) return false;
    DEMO_FAQS.splice(index, 1);
    HospitalRepo.logAudit('Staff', 'DELETE_FAQ', 'faq', id, {});
    return true;
  },

  // --- Staff & Roles ---
  async getStaff(): Promise<Profile[]> {
    return DEMO_STAFF;
  },

  // --- Audit Logs ---
  async logAudit(
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    inMemoryAuditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random()}`,
      hospital_id: DEMO_HOSPITAL.id,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
  },

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    return inMemoryAuditLogs.slice(0, limit);
  },

  // --- Webhook Idempotency (Prevent duplicate message processing) ---
  isEventProcessed(eventId: string): boolean {
    return inMemoryWebhookEventIds.has(eventId);
  },

  markEventProcessed(eventId: string): void {
    inMemoryWebhookEventIds.add(eventId);
  },

  // --- Dashboard Metrics ---
  async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = inMemoryAppointments.filter(a => a.appointment_date === today);
    const pendingAppointments = inMemoryAppointments.filter(a => a.status === 'requested');
    const confirmedAppointments = inMemoryAppointments.filter(a => a.status === 'confirmed');
    const cancelledAppointments = inMemoryAppointments.filter(a => a.status === 'cancelled');
    const openQueries = inMemoryQueries.filter(q => q.status === 'open' || q.status === 'in_progress');
    const unassignedQueries = inMemoryQueries.filter(q => !q.assigned_to && q.status !== 'resolved');

    return {
      totalAppointments: inMemoryAppointments.length,
      todayAppointmentsCount: todayAppointments.length,
      pendingCount: pendingAppointments.length,
      confirmedCount: confirmedAppointments.length,
      cancelledCount: cancelledAppointments.length,
      openQueriesCount: openQueries.length,
      unassignedQueriesCount: unassignedQueries.length,
      doctorsCount: DEMO_DOCTORS.filter(d => d.is_active).length,
      departmentsCount: DEMO_DEPARTMENTS.filter(d => d.is_active).length,
      recentAppointments: inMemoryAppointments.slice(0, 5),
      recentQueries: inMemoryQueries.slice(0, 5),
    };
  },

  // --- Automation: Appointment Reminders ---
  async sendAppointmentReminders(): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    logs: NotificationLog[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const eligible = inMemoryAppointments.filter(
      a => (a.appointment_date === today || a.appointment_date === tomorrow) &&
           a.status === 'confirmed'
    );

    let sentCount = 0;
    let skippedCount = 0;
    const newLogs: NotificationLog[] = [];

    for (const apt of eligible) {
      // Avoid sending duplicate reminders
      const alreadySent = inMemoryNotificationLogs.some(
        n => n.reference_id === apt.id && n.notification_type === 'reminder'
      );
      if (alreadySent) {
        skippedCount++;
        continue;
      }

      const reminderBody =
        `🔔 *APPOINTMENT REMINDER - Hiramani Memorial Hospital*\n\n` +
        `Dear ${apt.patient_name},\n` +
        `This is a reminder for your upcoming consultation with *${apt.doctor_name}* (${apt.department_name}).\n\n` +
        `📅 *Date:* ${apt.appointment_date}\n` +
        `⏰ *Time Slot:* ${apt.start_time} - ${apt.end_time}\n` +
        `📌 *Reference:* ${apt.booking_reference}\n\n` +
        `Please arrive 15 minutes before your slot.\n` +
        `Reply *1* to manage or reschedule your appointment.\n\n` +
        `📍 Hiramani Memorial Hospital, Eastern Bypass, Kolkata.`;

      const result = await WhatsAppService.sendTextMessage(apt.patient_phone, reminderBody);

      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        hospital_id: DEMO_HOSPITAL.id,
        recipient_phone: apt.patient_phone,
        notification_type: 'reminder',
        reference_id: apt.id,
        status: result.success ? 'sent' : 'failed',
        message: reminderBody,
        created_at: new Date().toISOString(),
      };

      inMemoryNotificationLogs.unshift(log);
      newLogs.push(log);
      sentCount++;
    }

    HospitalRepo.logAudit('Automated Scheduler', 'SEND_REMINDERS', 'notification', 'batch', {
      eligible_count: eligible.length,
      sent_count: sentCount,
      skipped_count: skippedCount,
    });

    return { processed: eligible.length, sent: sentCount, skipped: skippedCount, logs: newLogs };
  },

  async getNotificationLogs(limit = 50): Promise<NotificationLog[]> {
    return inMemoryNotificationLogs.slice(0, limit);
  },
};
