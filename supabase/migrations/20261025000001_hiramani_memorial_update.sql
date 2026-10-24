-- ==============================================================================
-- HIRAMANI MEMORIAL HOSPITAL: ADDITIVE MIGRATION
-- Updates hospital identity to Hiramani Memorial Hospital and ensures compatibility
-- with the 7-option conversational categories. Preserves all existing records.
-- ==============================================================================

-- 1. Update Hospital Display Name and Identity
UPDATE public.hospitals
SET 
    name = 'Hiramani Memorial Hospital',
    slug = 'hiramani-memorial-hospital',
    website = 'https://hiramanimemorial.demo',
    email = 'contact@hiramanimemorial.demo',
    google_maps_url = 'https://maps.google.com/?q=Hiramani+Memorial+Hospital+Kolkata'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Add advance_booking_days column to hospital_settings if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'hospital_settings' 
        AND column_name = 'advance_booking_days'
    ) THEN
        ALTER TABLE public.hospital_settings 
        ADD COLUMN advance_booking_days INTEGER DEFAULT 14;
    END IF;
END $$;

-- 3. Ensure patient_queries category check constraint supports all 7-option categories
-- (Doctor & Appointments, Departments & Services, Diagnostic Tests & Reports,
--  Admission & Surgery Enquiry, Hospital Location & Contact, Billing & Insurance,
--  Speak to Hospital Staff, plus legacy categories)
ALTER TABLE public.patient_queries 
DROP CONSTRAINT IF EXISTS patient_queries_category_check;

ALTER TABLE public.patient_queries
ADD CONSTRAINT patient_queries_category_check CHECK (
    category IN (
        'Doctor & Appointments',
        'Departments & Services',
        'Diagnostic Tests & Reports',
        'Admission & Surgery Enquiry',
        'Hospital Location & Contact',
        'Billing & Insurance',
        'Speak to Hospital Staff',
        'Appointments',
        'Billing',
        'Laboratory',
        'Medical Records',
        'General Enquiry',
        'Complaints',
        'Other'
    )
);
