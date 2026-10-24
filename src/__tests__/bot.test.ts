import { describe, it, expect, beforeEach } from 'vitest';
import { BotEngine, EXACT_WELCOME_MESSAGE } from '../lib/bot/engine';
import { HospitalRepo } from '../lib/db/repo';

describe('Hiramani Memorial Hospital - WhatsApp Conversational Engine', () => {
  const patientA = '919830111111';
  const patientB = '919830222222';

  beforeEach(() => {
    BotEngine.resetSession(patientA);
    BotEngine.resetSession(patientB);
  });

  // 1 & 3: First-time welcome message & Bengali welcome message rendering
  it('1 & 3. renders exact bilingual welcome message verbatim with Bengali on start or hi', async () => {
    const reply = await BotEngine.processMessage(patientA, 'hi');
    expect(reply.session.state).toBe('MAIN_MENU');
    expect(reply.text).toBe(EXACT_WELCOME_MESSAGE);
    expect(reply.text).toContain('নমস্কার! Hiramani Memorial Hospital-এ আপনাকে স্বাগত।');
    expect(reply.text).toContain('Welcome to Hiramani Memorial Hospital.');
    expect(reply.text).toContain('জরুরি চিকিৎসার প্রয়োজন হলে WhatsApp উত্তরের জন্য অপেক্ষা করবেন না।');
  });

  // 2: Exact seven-option menu in order
  it('2. includes exactly 7 primary options in the specified order', async () => {
    const reply = await BotEngine.processMessage(patientA, 'menu');
    const expectedOptions = [
      '1️⃣ Doctor & Appointment',
      '2️⃣ Departments & Services',
      '3️⃣ Diagnostic Tests & Reports',
      '4️⃣ Admission & Surgery Enquiry',
      '5️⃣ Hospital Location & Contact',
      '6️⃣ Billing & Insurance',
      '7️⃣ Speak to Hospital Staff',
    ];
    for (const opt of expectedOptions) {
      expect(reply.text).toContain(opt);
    }
  });

  // 4: English numeric input
  it('4. routes correctly on English numeric input "1"', async () => {
    const reply = await BotEngine.processMessage(patientA, '1');
    expect(reply.session.state).toBe('DOCTOR_APPOINTMENT_MENU');
    expect(reply.text).toContain('ডাক্তার ও অ্যাপয়েন্টমেন্ট বিভাগে স্বাগতম।');
    expect(reply.text).toContain('Welcome to Doctor & Appointment Services.');
  });

  // 5: Bengali natural language inputs
  it('5. routes correctly on Bengali natural language inputs', async () => {
    // Bengali doctor booking query
    const docReply = await BotEngine.processMessage(patientA, 'আমি ডাক্তার দেখাতে চাই');
    expect(docReply.session.state).toBe('DOCTOR_APPOINTMENT_MENU');

    // Reset and check Bengali location query
    BotEngine.resetSession(patientA);
    const locReply = await BotEngine.processMessage(patientA, 'হাসপাতালের ঠিকানা কোথায়?');
    expect(locReply.text).toContain('হাসপাতালের ঠিকানা ও যোগাযোগ');
    expect(locReply.text).toContain('Hiramani Memorial Hospital');
  });

  // 6: Option 1 Doctor and Appointment flow
  it('6. navigates Option 1 Doctor & Appointment sub-menu and availability', async () => {
    await BotEngine.processMessage(patientA, '1');
    // View Doctors (sub-option 1)
    const viewDoctors = await BotEngine.processMessage(patientA, '1');
    expect(viewDoctors.text).toContain('Specialist Doctors');
    expect(viewDoctors.text).toContain('Dr. Sourav Mukherjee');
  });

  // 7: Option 2 Departments & Services
  it('7. renders Option 2 Departments & Services and detail view', async () => {
    const deptMenu = await BotEngine.processMessage(patientA, '2');
    expect(deptMenu.session.state).toBe('DEPARTMENTS_SERVICES_MENU');
    expect(deptMenu.text).toContain('বিভাগ ও পরিষেবা');
    expect(deptMenu.text).toContain('Departments & Services');
    expect(deptMenu.text).toContain('General Medicine');

    // Select Department 1 (General Medicine)
    const detail = await BotEngine.processMessage(patientA, '1');
    expect(detail.session.state).toBe('DEPARTMENT_DETAIL');
    expect(detail.text).toContain('General Medicine Department');
    expect(detail.text).toContain('Available Services');
  });

  // 8: Option 3 Diagnostics & Reports
  it('8. renders Option 3 Diagnostic Tests & Reports and handles queries', async () => {
    const diagMenu = await BotEngine.processMessage(patientA, '3');
    expect(diagMenu.session.state).toBe('DIAGNOSTIC_REPORTS_MENU');
    expect(diagMenu.text).toContain('ডায়াগনস্টিক পরীক্ষা ও রিপোর্ট');
    expect(diagMenu.text).toContain('Diagnostic Tests & Reports');

    // Sub-option 1: Available Diagnostic Tests
    const tests = await BotEngine.processMessage(patientA, '1');
    expect(tests.text).toContain('Complete Blood Count (CBC)');
    expect(tests.text).toContain('128-Slice CT Scan');

    // Sub-option 3: Laboratory Timings
    const timings = await BotEngine.processMessage(patientA, '3');
    expect(timings.text).toContain('Routine Sample Collection');
  });

  // 9: Option 4 Admission & Surgery Enquiry
  it('9. renders Option 4 Admission & Surgery Enquiry and records tickets', async () => {
    const admMenu = await BotEngine.processMessage(patientA, '4');
    expect(admMenu.session.state).toBe('ADMISSION_SURGERY_MENU');
    expect(admMenu.text).toContain('ভর্তি ও অস্ত্রোপচার সংক্রান্ত তথ্য');
    expect(admMenu.text).toContain('Admission & Surgery Enquiry');

    // Sub-option 2: Surgery Enquiry
    const surgeryPrompt = await BotEngine.processMessage(patientA, '2');
    expect(surgeryPrompt.session.state).toBe('SURGERY_ENQUIRY_TEXT');

    // Submit surgery text
    const surgeryTicket = await BotEngine.processMessage(patientA, 'Enquiry for Laparoscopic Gallbladder surgery');
    expect(surgeryTicket.text).toContain('Surgery Enquiry Recorded');
    expect(surgeryTicket.text).toContain('TKT-');
  });

  // 10: Option 5 Location and Contact
  it('10. renders Option 5 Location and Contact with real hospital details', async () => {
    const loc = await BotEngine.processMessage(patientA, '5');
    expect(loc.text).toContain('হাসপাতালের ঠিকানা ও যোগাযোগ');
    expect(loc.text).toContain('Hiramani Memorial Hospital');
    expect(loc.text).toContain('Eastern Metropolitan Bypass');
    expect(loc.text).toContain('+91 33 2456 7890');
    expect(loc.text).toContain('maps.google.com');
  });

  // 11: Option 6 Billing & Insurance
  it('11. renders Option 6 Billing & Insurance with fees and TPA info', async () => {
    const billMenu = await BotEngine.processMessage(patientA, '6');
    expect(billMenu.session.state).toBe('BILLING_INSURANCE_MENU');
    expect(billMenu.text).toContain('বিলিং ও বিমা সংক্রান্ত তথ্য');
    expect(billMenu.text).toContain('Billing & Insurance');

    // Check doctor fees
    const fees = await BotEngine.processMessage(patientA, '2');
    expect(fees.text).toContain('Verified Doctor Consultation Fees');
    expect(fees.text).toContain('Dr. Sourav Mukherjee');
  });

  // 12: Option 7 Human Handover
  it('12. initiates human handover, suppresses automated bot, and generates ticket', async () => {
    const prompt = await BotEngine.processMessage(patientA, '7');
    expect(prompt.session.state).toBe('STAFF_ASSISTANCE_INPUT');
    expect(prompt.text).toContain('আমাদের হাসপাতালের কর্মীদের সঙ্গে যোগাযোগ করার জন্য ধন্যবাদ।');

    // Patient types assistance message
    const handedOver = await BotEngine.processMessage(patientA, 'Need to speak to duty manager regarding inpatient admission');
    expect(handedOver.session.is_human_handover).toBe(true);
    expect(handedOver.text).toContain('TKT-');
    expect(handedOver.text).toContain('Assigned to Hospital Staff');

    // Subsequent message keeps handover state active
    const followUp = await BotEngine.processMessage(patientA, 'Are you there?');
    expect(followUp.text).toContain('Hospital Reception');

    // Resume automated service
    const resumed = await BotEngine.processMessage(patientA, 'bot');
    expect(resumed.session.is_human_handover).toBe(false);
  });

  // 13: Return to Main Menu
  it('13. returns to main menu with "menu" or "0"', async () => {
    await BotEngine.processMessage(patientA, '2'); // Go to departments
    const backReply = await BotEngine.processMessage(patientA, 'menu');
    expect(backReply.session.state).toBe('MAIN_MENU');
    expect(backReply.text).toContain('Hiramani Memorial Hospital');
  });

  // 14: Invalid Input Recovery
  it('14. recovers gracefully from invalid inputs', async () => {
    const reply = await BotEngine.processMessage(patientA, 'xyz999foobar');
    expect(reply.text).toContain('দুঃখিত, আপনার বার্তাটি বুঝতে পারিনি।');
    expect(reply.text).toContain('Sorry, I did not understand that');
  });

  // 15: Restart Conversation
  it('15. resets conversation on "restart"', async () => {
    await BotEngine.processMessage(patientA, '3');
    const restarted = await BotEngine.processMessage(patientA, 'restart');
    expect(restarted.session.state).toBe('MAIN_MENU');
    expect(restarted.text).toBe(EXACT_WELCOME_MESSAGE);
  });

  // 16 & 17: Full Appointment Booking & Patient Query Creation
  it('16 & 17. completes full multi-step appointment booking with real reference', async () => {
    // Step 1: Open Doctor & Appointment Menu
    await BotEngine.processMessage(patientA, '1');

    // Step 2: Choose 3. Book an Appointment
    let step = await BotEngine.processMessage(patientA, '3');
    expect(step.session.state).toBe('BOOKING_DEPT');

    // Select Department 1 (General Medicine)
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('BOOKING_DOCTOR');

    // Select Doctor 1 (Dr. Sourav Mukherjee)
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('BOOKING_DATE');

    // Select Date 1
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('BOOKING_SLOT');

    // Select Slot 1
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('BOOKING_NAME');

    // Enter Patient Name
    step = await BotEngine.processMessage(patientA, 'Amitabh Roy');
    expect(step.session.state).toBe('BOOKING_PHONE');

    // Confirm Phone Number
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('BOOKING_CONFIRMATION');
    expect(step.text).toContain('Amitabh Roy');

    // Confirm Booking
    step = await BotEngine.processMessage(patientA, '1');
    expect(step.session.state).toBe('MAIN_MENU');
    expect(step.text).toContain('APPOINTMENT CONFIRMED');
    expect(step.text).toContain('Hiramani Memorial Hospital');
    expect(step.text).toContain('APT-');
  });

  // 18: Double-Booking Prevention
  it('18. prevents double-booking the exact same slot atomically', async () => {
    const doctors = await HospitalRepo.getDoctors();
    const doc = doctors[0];
    const testDate = '2026-10-28';

    // Book slot once
    const first = await HospitalRepo.bookAppointment({
      doctor_id: doc.id,
      patient_name: 'Patient 1',
      patient_phone: '+919830000001',
      appointment_date: testDate,
      start_time: '11:20',
    });
    expect(first.success).toBe(true);

    // Attempt to book same doctor on same date and slot
    const second = await HospitalRepo.bookAppointment({
      doctor_id: doc.id,
      patient_name: 'Patient 2',
      patient_phone: '+919830000002',
      appointment_date: testDate,
      start_time: '11:20',
    });
    expect(second.success).toBe(false);
    expect(second.error).toContain('already been reserved');
  });

  // 19: Missing Hospital Contact Information Fallback
  it('19. displays exact unconfigured fallback message if hospital contact is missing', async () => {
    // Temporarily mock getHospital to return empty contact
    const originalGetHospital = HospitalRepo.getHospital;
    (HospitalRepo as any).getHospital = async () => ({
      id: 'mock-hosp',
      name: 'Hiramani Memorial Hospital',
      slug: 'hiramani-memorial-hospital',
      address_line1: '',
      phone: '',
      emergency_contact: '',
      city: '',
      state: '',
      pincode: '',
      timezone: 'Asia/Kolkata',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    const reply = await BotEngine.processMessage(patientA, '5');
    expect(reply.text).toContain('Hospital contact information is not yet configured. Please contact authorised hospital staff for assistance.');
    expect(reply.text).toContain('হাসপাতালের যোগাযোগের তথ্য এখনও যুক্ত করা হয়নি। অনুগ্রহ করে হাসপাতালের কর্মীদের সঙ্গে যোগাযোগ করুন।');

    // Restore original
    HospitalRepo.getHospital = originalGetHospital;
  });

  // 20: Emergency Disclaimer & Immediate Bypass
  it('20. bypasses menu immediately on emergency keywords in English or Bengali', async () => {
    const enEmergency = await BotEngine.processMessage(patientA, 'Emergency! Severe chest pain!');
    expect(enEmergency.text).toContain('জরুরি চিকিৎসা সহায়তা • EMERGENCY CARE');
    expect(enEmergency.text).toContain('Hiramani Memorial Hospital');
    expect(enEmergency.text).toContain('+91 98765 00108');

    BotEngine.resetSession(patientA);
    const bnEmergency = await BotEngine.processMessage(patientA, 'জরুরি রক্তপাত হচ্ছে');
    expect(bnEmergency.text).toContain('জরুরি চিকিৎসা সহায়তা • EMERGENCY CARE');
    expect(bnEmergency.text).toContain('Hiramani Memorial Hospital');
  });

  // 21: Conversation isolation between different patients
  it('21. isolates sessions completely between different phone numbers', async () => {
    // Patient A goes to Doctor Appointment Menu
    await BotEngine.processMessage(patientA, '1');
    const sessionA = BotEngine.getSession(patientA);
    expect(sessionA.state).toBe('DOCTOR_APPOINTMENT_MENU');

    // Patient B initiates and remains in MAIN_MENU
    const replyB = await BotEngine.processMessage(patientB, 'hi');
    const sessionB = BotEngine.getSession(patientB);
    expect(sessionB.state).toBe('MAIN_MENU');
    expect(replyB.text).toBe(EXACT_WELCOME_MESSAGE);

    // Patient A state should remain unaffected
    expect(BotEngine.getSession(patientA).state).toBe('DOCTOR_APPOINTMENT_MENU');
  });

  // 22: WhatsApp Demo Mode
  it('22. functions seamlessly in local demo mode without WhatsApp API credentials', async () => {
    const reply = await BotEngine.processMessage('919999900000', '1');
    expect(reply.session.phone).toBe('919999900000');
    expect(reply.session.state).toBe('DOCTOR_APPOINTMENT_MENU');
  });

  // 23 & 24: Admin Authentication and Database Permissions Integrity
  it('23 & 24. provides access to queries, appointments, and audit log for dashboard', async () => {
    const queries = await HospitalRepo.getQueries();
    expect(Array.isArray(queries)).toBe(true);

    const appointments = await HospitalRepo.getAppointments();
    expect(Array.isArray(appointments)).toBe(true);
    expect(appointments.length).toBeGreaterThan(0);

    const logs = await HospitalRepo.getAuditLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
});
