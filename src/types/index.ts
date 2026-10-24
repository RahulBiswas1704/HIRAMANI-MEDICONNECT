// ==============================================================================
// MEDICONNECT - TYPE DEFINITIONS
// ==============================================================================

export type UserRole = 'super_admin' | 'hospital_admin' | 'receptionist' | 'department_staff';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: UserRole;
  hospital_id: string;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  registration_number?: string;
  phone: string;
  emergency_contact: string;
  email?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  google_maps_url?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export interface HospitalSettings {
  id: string;
  hospital_id: string;
  opd_timings: string;
  visiting_hours: string;
  reception_hours: string;
  cancellation_policy: string;
  booking_policy: string;
  advance_booking_days?: number;
  diagnostic_services_info?: string;
  admission_info?: string;
  billing_info?: string;
  insurance_info?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_display_number?: string;
  is_whatsapp_connected: boolean;
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  icon_name?: string;
  is_active: boolean;
  display_order: number;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  department_id: string;
  department_name?: string;
  full_name: string;
  qualification: string;
  speciality: string;
  experience_years: number;
  bio?: string;
  consultation_fee: number;
  follow_up_fee?: number;
  room_number?: string;
  is_active: boolean;
  display_order: number;
}

export interface DoctorSchedule {
  id: string;
  hospital_id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
  is_active: boolean;
}

export interface DoctorTimeOff {
  id: string;
  hospital_id: string;
  doctor_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  reason?: string;
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'reschedule_requested'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type BookingChannel = 'whatsapp' | 'web_dashboard' | 'phone' | 'walk_in';

export interface Appointment {
  id: string;
  hospital_id: string;
  booking_reference: string;
  doctor_id: string;
  doctor_name?: string;
  department_id: string;
  department_name?: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: AppointmentStatus;
  consultation_fee: number;
  booking_channel: BookingChannel;
  administrative_note?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type QueryCategory =
  | 'Doctor & Appointments'
  | 'Departments & Services'
  | 'Diagnostic Tests & Reports'
  | 'Admission & Surgery Enquiry'
  | 'Hospital Location & Contact'
  | 'Billing & Insurance'
  | 'Speak to Hospital Staff'
  | 'Appointments'
  | 'Billing'
  | 'Laboratory'
  | 'Medical Records'
  | 'General Enquiry'
  | 'Complaints'
  | 'Other';

export type QueryStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_for_patient'
  | 'resolved'
  | 'closed';

export type QueryPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PatientQuery {
  id: string;
  hospital_id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone: string;
  category: QueryCategory;
  subject?: string;
  description: string;
  status: QueryStatus;
  priority: QueryPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  resolved_at?: string;
  resolution_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryNote {
  id: string;
  query_id: string;
  author_id?: string;
  author_name?: string;
  note: string;
  is_internal: boolean;
  created_at: string;
}

export type FAQCategory =
  | 'Hospital Information'
  | 'Appointments'
  | 'Doctors'
  | 'Consultation Fees'
  | 'OPD Timings'
  | 'Laboratory'
  | 'Billing'
  | 'Insurance'
  | 'Visiting Hours'
  | 'Location'
  | 'Other';

export interface FAQ {
  id: string;
  hospital_id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  display_order: number;
}

export interface AuditLog {
  id: string;
  hospital_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  hospital_id: string;
  recipient_phone: string;
  notification_type: 'booking_confirmation' | 'reminder' | 'cancellation' | 'query_update' | 'staff_alert';
  reference_id?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  message: string;
  created_at: string;
}

// Conversation states for the WhatsApp Bot
export type BotState =
  | 'MAIN_MENU'
  | 'DOCTOR_APPOINTMENT_MENU'
  | 'DOCTOR_AVAILABILITY_SELECT'
  | 'CHECK_STATUS_INPUT'
  | 'BOOKING_DEPT'
  | 'BOOKING_DOCTOR'
  | 'BOOKING_DATE'
  | 'BOOKING_SLOT'
  | 'BOOKING_NAME'
  | 'BOOKING_PHONE'
  | 'BOOKING_CONFIRMATION'
  | 'CANCEL_RESCHEDULE_INPUT'
  | 'CANCEL_ACTION'
  | 'RESCHEDULE_DATE'
  | 'RESCHEDULE_SLOT'
  | 'DEPARTMENTS_SERVICES_MENU'
  | 'DEPARTMENT_DETAIL'
  | 'DIAGNOSTIC_REPORTS_MENU'
  | 'DIAGNOSTIC_ENQUIRY_TEXT'
  | 'ADMISSION_SURGERY_MENU'
  | 'ADMISSION_ENQUIRY_TEXT'
  | 'SURGERY_ENQUIRY_TEXT'
  | 'BILLING_INSURANCE_MENU'
  | 'BILLING_ENQUIRY_TEXT'
  | 'STAFF_ASSISTANCE_INPUT'
  | 'QUERY_CATEGORY'
  | 'QUERY_TEXT'
  | 'HUMAN_HANDOVER'
  | 'EMERGENCY'
  | 'FAQ_BROWSING';

export interface ConversationSession {
  id: string;
  hospital_id: string;
  phone: string;
  state: BotState;
  state_payload: {
    dept_id?: string;
    doctor_id?: string;
    date?: string;
    slot?: string;
    patient_name?: string;
    patient_phone?: string;
    booking_ref?: string;
    query_category?: QueryCategory;
    previous_state?: BotState;
    [key: string]: any;
  };
  is_human_handover: boolean;
  last_interaction_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  interactive_type?: 'buttons' | 'list';
  options?: Array<{ id: string; title: string; description?: string }>;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}
