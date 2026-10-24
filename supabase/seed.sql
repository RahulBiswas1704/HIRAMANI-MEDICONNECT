-- ==============================================================================
-- MEDICONNECT: SEED DATA FOR DEMONSTRATION & LOCAL DEVELOPMENT
-- ALL DATA IN THIS FILE IS FICTIONAL AND FOR DEMONSTRATION PURPOSES ONLY
-- ==============================================================================

-- 1. Demo Hospital
INSERT INTO public.hospitals (
    id, name, slug, registration_number, phone, emergency_contact, email, website,
    address_line1, address_line2, city, state, pincode, google_maps_url, timezone, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Hiramani Memorial Hospital',
    'hiramani-memorial-hospital',
    'REG-WB-KOL-2024-8976',
    '+91 33 2456 7890',
    '+91 98765 00108',
    'contact@hiramanimemorial.demo',
    'https://hiramanimemorial.demo',
    '124/A Eastern Metropolitan Bypass',
    'Mukundapur, Near Metro Station',
    'Kolkata',
    'West Bengal',
    '700099',
    'https://maps.google.com/?q=Hiramani+Memorial+Hospital+Kolkata',
    'Asia/Kolkata',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. Hospital Settings
INSERT INTO public.hospital_settings (
    id, hospital_id, opd_timings, visiting_hours, reception_hours,
    cancellation_policy, booking_policy, is_whatsapp_connected
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Monday to Saturday: 08:30 AM to 08:00 PM | Sunday: 09:00 AM to 01:00 PM',
    'Morning: 11:00 AM to 01:00 PM | Evening: 05:00 PM to 07:00 PM',
    '24 Hours Emergency, Ambulance & Helpdesk Available',
    'Appointments can be cancelled or rescheduled up to 2 hours before the scheduled time with no penalty.',
    'Appointments can be booked up to 14 days in advance via WhatsApp or online portal.',
    FALSE
) ON CONFLICT (hospital_id) DO NOTHING;

-- 3. Departments
INSERT INTO public.departments (id, hospital_id, name, code, description, contact_phone, contact_email, icon_name, is_active, display_order)
VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'General Medicine', 'GENMED', 'Primary care, adult wellness, fever, lifestyle illness management', '+91 33 2456 7891', 'genmed@hiramanihospital.demo', 'Stethoscope', TRUE, 1),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Cardiology', 'CARDIO', 'Heart care, hypertension, ECG, echocardiography, cardiac prevention', '+91 33 2456 7892', 'cardio@hiramanihospital.demo', 'HeartPulse', TRUE, 2),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Orthopaedics', 'ORTHO', 'Bones, joints, arthritis, sports injuries, fracture management', '+91 33 2456 7893', 'ortho@hiramanihospital.demo', 'Bone', TRUE, 3),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Dermatology', 'DERMA', 'Skin, hair, allergies, cosmetic dermatology, acne treatment', '+91 33 2456 7894', 'derma@hiramanihospital.demo', 'Sparkles', TRUE, 4),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Paediatrics', 'PAED', 'Child health, immunisation, newborn care, paediatric emergencies', '+91 33 2456 7895', 'paed@hiramanihospital.demo', 'Baby', TRUE, 5),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Gynaecology & Obstetrics', 'GYNAEC', 'Women health, prenatal care, fertility, maternity services', '+91 33 2456 7896', 'gynaec@hiramanihospital.demo', 'HeartHandshake', TRUE, 6),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'ENT (Otolaryngology)', 'ENT', 'Ear, nose, throat disorders, hearing tests, sinus consultations', '+91 33 2456 7897', 'ent@hiramanihospital.demo', 'Headphones', TRUE, 7)
ON CONFLICT (id) DO NOTHING;

-- 4. Doctors
INSERT INTO public.doctors (id, hospital_id, department_id, full_name, qualification, speciality, experience_years, bio, consultation_fee, follow_up_fee, room_number, is_active, display_order)
VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Dr. Sourav Mukherjee', 'MBBS, MD (Medicine)', 'Consultant Physician & Diabetologist', 14, 'Specialises in diabetes management, chronic hypertension, and adult fever.', 600.00, 400.00, 'OPD-101', TRUE, 1),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Dr. Ananya Roy Chowdhury', 'MBBS, MD, DM (Cardiology)', 'Senior Interventional Cardiologist', 18, 'Expertise in preventive cardiology, coronary angioplasty, and heart failure care.', 900.00, 600.00, 'OPD-204', TRUE, 2),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Dr. Rajesh Sen', 'MBBS, MS (Ortho), MCh', 'Orthopaedic & Joint Replacement Surgeon', 16, 'Specialist in arthroscopy, knee/hip replacement, and complex trauma fractures.', 800.00, 500.00, 'OPD-108', TRUE, 3),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Dr. Priyanka Banerjee', 'MBBS, MD (DVL)', 'Consultant Dermatologist & Cosmetologist', 9, 'Focuses on clinical dermatology, hair disorders, and laser procedures.', 700.00, 450.00, 'OPD-112', TRUE, 4),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Dr. Amitav Das', 'MBBS, DCH, MD (Paediatrics)', 'Senior Paediatrician & Neonatologist', 15, 'Dedicated to newborn care, childhood immunisations, and developmental milestones.', 650.00, 400.00, 'OPD-105', TRUE, 5),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Dr. Nandini Sengupta', 'MBBS, MS (Obst & Gynae)', 'Senior Gynaecologist & Laparoscopic Surgeon', 17, 'High-risk pregnancy management, fibroids, adolescent gynaecology.', 850.00, 500.00, 'OPD-210', TRUE, 6),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Dr. Subhashis Ghosh', 'MBBS, MS (ENT)', 'Senior ENT & Head-Neck Specialist', 12, 'Treats chronic sinusitis, hearing impairment, vertigo, and voice disorders.', 600.00, 400.00, 'OPD-115', TRUE, 7)
ON CONFLICT (id) DO NOTHING;

-- 5. Doctor Weekly Schedules (Sample regular shifts)
INSERT INTO public.doctor_schedules (id, hospital_id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
VALUES
-- Dr. Sourav Mukherjee (Mon, Wed, Fri: 09:00 - 13:00)
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, '09:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 3, '09:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 5, '09:00:00', '13:00:00', 20),
-- Dr. Ananya Roy Chowdhury (Tue, Thu, Sat: 10:00 - 14:00)
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 2, '10:00:00', '14:00:00', 30),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 4, '10:00:00', '14:00:00', 30),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 6, '10:00:00', '14:00:00', 30),
-- Dr. Rajesh Sen (Mon, Wed, Sat: 14:00 - 18:00)
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 1, '14:00:00', '18:00:00', 20),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 3, '14:00:00', '18:00:00', 20),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 6, '14:00:00', '18:00:00', 20),
-- Dr. Priyanka Banerjee (Tue, Fri: 15:00 - 19:00)
('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 2, '15:00:00', '19:00:00', 20),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 5, '15:00:00', '19:00:00', 20),
-- Dr. Amitav Das (Mon to Fri: 10:00 - 13:00)
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 1, '10:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 2, '10:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 3, '10:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 4, '10:00:00', '13:00:00', 20),
('30000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 5, '10:00:00', '13:00:00', 20)
ON CONFLICT (id) DO NOTHING;

-- 6. FAQs (Approved Knowledgebase)
INSERT INTO public.faqs (id, hospital_id, category, question, answer, keywords, is_active, display_order)
VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hospital Information', 'Where is Hiramani Memorial Hospital located?', 'Hiramani Memorial Hospital is located at 124/A Eastern Metropolitan Bypass, Mukundapur, Kolkata, West Bengal - 700099 (Near Metro Station). Google Maps: https://maps.google.com/?q=Hiramani+Memorial+Hospital+Kolkata', ARRAY['location', 'address', 'where', 'direction', 'map'], TRUE, 1),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'OPD Timings', 'What are the OPD clinic operating hours?', 'Our OPD runs Monday through Saturday from 08:30 AM to 08:00 PM, and Sundays from 09:00 AM to 01:00 PM. Emergency and trauma care operates 24x7.', ARRAY['timing', 'opd', 'hours', 'open', 'schedule', 'sunday'], TRUE, 2),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Consultation Fees', 'What are the doctor consultation charges?', 'OPD consultation fees range from ₹600 to ₹900 depending on the specialist. General Medicine is ₹600, Paediatrics ₹650, Orthopaedics ₹800, and Cardiology ₹900.', ARRAY['fee', 'cost', 'charge', 'price', 'consultation'], TRUE, 3),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Laboratory', 'Is blood testing and radiology available?', 'Yes, our NABL accredited laboratory and diagnostic imaging (Digital X-Ray, USG, 128-Slice CT, 2D-Echo, TMT) operate daily with home blood collection available from 06:30 AM.', ARRAY['lab', 'blood test', 'pathology', 'xray', 'ct scan', 'ultrasound'], TRUE, 4),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Visiting Hours', 'When can visitors see admitted patients in the ward?', 'Visiting hours are strictly 11:00 AM to 01:00 PM in the morning and 05:00 PM to 07:00 PM in the evening. One visitor pass is issued per patient.', ARRAY['visit', 'visitor', 'timing', 'ward', 'icu'], TRUE, 5),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Insurance', 'Which health insurance and TPA cards do you accept for cashless billing?', 'We offer cashless hospitalisation with major TPAs and insurers including Star Health, HDFC ERGO, ICICI Lombard, Care Health, Medi Assist, Paramount, and Raksha TPA.', ARRAY['insurance', 'cashless', 'tpa', 'mediclaim', 'claim'], TRUE, 6),
('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Appointments', 'How do I cancel or reschedule my appointment?', 'You can cancel or reschedule via WhatsApp by typing "Cancel appointment" or "Reschedule" and providing your booking reference, or by calling reception at +91 33 2456 7890.', ARRAY['cancel', 'reschedule', 'change', 'booking'], TRUE, 7)
ON CONFLICT (id) DO NOTHING;

-- 7. Sample Initial Patient Queries
INSERT INTO public.patient_queries (id, hospital_id, ticket_number, patient_name, patient_phone, category, subject, description, status, priority)
VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TKT-20261025-1001', 'Arunava Ghosh', '+919830012345', 'Laboratory', 'Home Sample Collection Enquiry', 'Need home blood collection for fasting blood sugar and lipid profile for senior citizen tomorrow at 7am in Mukundapur.', 'open', 'medium'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TKT-20261025-1002', 'Sunita Sharma', '+919830067890', 'Billing', 'Cashless TPA Pre-authorization status', 'Admitted for gallbladder surgery under Star Health policy. Please let us know if pre-auth sanction letter was received.', 'in_progress', 'high')
ON CONFLICT (id) DO NOTHING;
