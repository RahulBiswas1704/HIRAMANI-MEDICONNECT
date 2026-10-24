-- ==============================================================================
-- MEDICONNECT: HOSPITAL WHATSAPP AUTOMATION PLATFORM
-- INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY MIGRATION
-- Multi-tenant hospital isolation with PostgreSQL RLS & Concurrency-safe Booking
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Hospital staff & administrators linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. HOSPITALS (Tenants)
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    registration_number TEXT,
    phone TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    email TEXT,
    website TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    google_maps_url TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. HOSPITAL_MEMBERSHIPS (Role-Based Access Control)
-- Roles: 'super_admin', 'hospital_admin', 'receptionist', 'department_staff'
CREATE TABLE IF NOT EXISTS public.hospital_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'hospital_admin', 'receptionist', 'department_staff')),
    department_id UUID, -- Optional link for department staff
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(hospital_id, user_id)
);

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    icon_name TEXT DEFAULT 'Activity',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(hospital_id, code)
);

-- 5. DOCTORS
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    qualification TEXT NOT NULL,
    speciality TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    bio TEXT,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    follow_up_fee NUMERIC(10, 2) DEFAULT 300.00,
    room_number TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. DOCTOR_SCHEDULES (Weekly OPD Working Hours)
-- day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 15 CHECK (slot_duration_minutes > 0),
    max_patients_per_slot INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (start_time < end_time)
);

-- 7. DOCTOR_TIME_OFF (Leave, Holiday & Unavailability dates)
CREATE TABLE IF NOT EXISTS public.doctor_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (start_date <= end_date)
);

-- 8. PATIENT_CONTACTS (Identified by E.164 phone number)
CREATE TABLE IF NOT EXISTS public.patient_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    whatsapp_phone TEXT NOT NULL, -- e.g. +919876543210
    display_name TEXT,
    gender TEXT,
    age INT,
    language_preference TEXT DEFAULT 'en',
    consent_received BOOLEAN DEFAULT TRUE NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(hospital_id, whatsapp_phone)
);

-- 9. APPOINTMENTS
-- Status: 'requested', 'confirmed', 'reschedule_requested', 'cancelled', 'completed', 'no_show'
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    booking_reference TEXT NOT NULL UNIQUE, -- e.g. APT-20261025-ABCD
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    patient_contact_id UUID REFERENCES public.patient_contacts(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('requested', 'confirmed', 'reschedule_requested', 'cancelled', 'completed', 'no_show')),
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    booking_channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (booking_channel IN ('whatsapp', 'web_dashboard', 'phone', 'walk_in')),
    administrative_note TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Concurrency safe partial unique index to avoid double booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking 
ON public.appointments(doctor_id, appointment_date, start_time) 
WHERE status NOT IN ('cancelled');

-- 10. PATIENT_CONVERSATIONS (WhatsApp Sessions)
CREATE TABLE IF NOT EXISTS public.patient_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_contact_id UUID REFERENCES public.patient_contacts(id) ON DELETE SET NULL,
    whatsapp_phone TEXT NOT NULL,
    current_state TEXT NOT NULL DEFAULT 'MAIN_MENU',
    state_payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_human_handover BOOLEAN DEFAULT FALSE NOT NULL,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(hospital_id, whatsapp_phone)
);

-- 11. CONVERSATION_MESSAGES (Audit & History of chat)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.patient_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text',
    body TEXT,
    payload JSONB,
    whatsapp_message_id TEXT,
    delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. PATIENT_QUERIES (Ticketing system for enquiries & feedback)
-- Status: 'open', 'assigned', 'in_progress', 'waiting_for_patient', 'resolved', 'closed'
CREATE TABLE IF NOT EXISTS public.patient_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL UNIQUE, -- e.g. TKT-20261025-1001
    patient_contact_id UUID REFERENCES public.patient_contacts(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Appointments', 'Billing', 'Laboratory', 'Medical Records', 'General Enquiry', 'Complaints', 'Other')),
    subject TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_for_patient', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. QUERY_ASSIGNMENTS (Audit of assignment changes)
CREATE TABLE IF NOT EXISTS public.query_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.patient_queries(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. QUERY_NOTES (Internal staff notes on patient queries)
CREATE TABLE IF NOT EXISTS public.query_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.patient_queries(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. FAQS (Knowledgebase for automated WhatsApp replies)
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'Hospital Information', 'Appointments', 'Doctors', 'Consultation Fees',
        'OPD Timings', 'Laboratory', 'Billing', 'Insurance', 'Visiting Hours', 'Location', 'Other'
    )),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. HOSPITAL_SETTINGS
CREATE TABLE IF NOT EXISTS public.hospital_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE UNIQUE,
    opd_timings TEXT DEFAULT 'Mon - Sat: 08:30 AM to 08:00 PM, Sun: 09:00 AM to 01:00 PM',
    visiting_hours TEXT DEFAULT '11:00 AM - 01:00 PM and 05:00 PM - 07:00 PM daily',
    reception_hours TEXT DEFAULT '24 Hours Emergency & Reception',
    cancellation_policy TEXT DEFAULT 'Appointments can be cancelled or rescheduled up to 2 hours before the scheduled time free of charge.',
    booking_policy TEXT DEFAULT 'Appointments can be booked up to 14 days in advance.',
    advance_booking_days INT DEFAULT 14 NOT NULL,
    whatsapp_phone_number_id TEXT,
    whatsapp_business_account_id TEXT,
    whatsapp_display_number TEXT,
    is_whatsapp_connected BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. MESSAGE_TEMPLATES (Meta approved template configurations)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('AUTHENTICATION', 'MARKETING', 'UTILITY')),
    language TEXT DEFAULT 'en' NOT NULL,
    meta_status TEXT DEFAULT 'APPROVED',
    body_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(hospital_id, name, language)
);

-- 18. NOTIFICATION_LOGS (Outbound reminders and alerts)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    recipient_phone TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('booking_confirmation', 'reminder', 'cancellation', 'query_update', 'staff_alert')),
    reference_id UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 19. AUDIT_LOGS (Traceability for sensitive hospital actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 20. WHATSAPP_WEBHOOK_EVENTS (Idempotency and raw event recording)
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL UNIQUE, -- WhatsApp message or status ID
    event_type TEXT NOT NULL, -- 'message', 'status'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(hospital_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_queries_status ON public.patient_queries(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(hospital_id, category, is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doc ON public.doctor_schedules(doctor_id, day_of_week, is_active);

-- ==============================================================================
-- ATOMIC CONCURRENCY FUNCTION: BOOK APPOINTMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
    p_hospital_id UUID,
    p_doctor_id UUID,
    p_department_id UUID,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_booking_reference TEXT,
    p_booking_channel TEXT DEFAULT 'whatsapp',
    p_administrative_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_id UUID;
    v_doctor_fee NUMERIC(10,2);
    v_new_id UUID;
BEGIN
    -- 1. Check if doctor exists and get consultation fee
    SELECT consultation_fee INTO v_doctor_fee
    FROM public.doctors
    WHERE id = p_doctor_id AND hospital_id = p_hospital_id AND is_active = TRUE;

    IF v_doctor_fee IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Doctor not found or inactive');
    END IF;

    -- 2. Concurrency Check: lock and verify if slot already taken
    SELECT id INTO v_existing_id
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND start_time = p_start_time
      AND status NOT IN ('cancelled')
    FOR UPDATE;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected slot has already been reserved');
    END IF;

    -- 3. Insert reservation atomically
    INSERT INTO public.appointments (
        hospital_id,
        booking_reference,
        doctor_id,
        department_id,
        patient_name,
        patient_phone,
        appointment_date,
        start_time,
        end_time,
        consultation_fee,
        booking_channel,
        administrative_note,
        status
    ) VALUES (
        p_hospital_id,
        p_booking_reference,
        p_doctor_id,
        p_department_id,
        p_patient_name,
        p_patient_phone,
        p_appointment_date,
        p_start_time,
        p_end_time,
        v_doctor_fee,
        p_booking_channel,
        p_administrative_note,
        'confirmed'
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_new_id,
        'booking_reference', p_booking_reference,
        'consultation_fee', v_doctor_fee
    );
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if auth.uid() has membership in hospital
CREATE OR REPLACE FUNCTION public.has_hospital_access(hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_memberships
    WHERE hospital_memberships.hospital_id = $1
      AND hospital_memberships.user_id = auth.uid()
      AND hospital_memberships.is_active = TRUE
  );
$$;

-- 1. Public read-only policies for public hospital information
CREATE POLICY "Public can view active hospitals" ON public.hospitals FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active departments" ON public.departments FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active doctors" ON public.doctors FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view doctor schedules" ON public.doctor_schedules FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active faqs" ON public.faqs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view hospital settings" ON public.hospital_settings FOR SELECT USING (TRUE);

-- 2. Staff authenticated policies (Tenant-isolated)
CREATE POLICY "Hospital staff can view appointments" ON public.appointments FOR SELECT TO authenticated
USING (public.has_hospital_access(hospital_id));

CREATE POLICY "Hospital staff can update appointments" ON public.appointments FOR UPDATE TO authenticated
USING (public.has_hospital_access(hospital_id));

CREATE POLICY "Hospital staff can insert appointments" ON public.appointments FOR INSERT TO authenticated
WITH CHECK (public.has_hospital_access(hospital_id));

CREATE POLICY "Hospital staff can view queries" ON public.patient_queries FOR SELECT TO authenticated
USING (public.has_hospital_access(hospital_id));

CREATE POLICY "Hospital staff can update queries" ON public.patient_queries FOR UPDATE TO authenticated
USING (public.has_hospital_access(hospital_id));

CREATE POLICY "Hospital staff can insert queries" ON public.patient_queries FOR INSERT TO authenticated
WITH CHECK (public.has_hospital_access(hospital_id));
