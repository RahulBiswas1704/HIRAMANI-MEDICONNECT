// ==============================================================================
// HIRAMANI MEMORIAL HOSPITAL: CONVERSATIONAL WHATSAPP AUTOMATION ENGINE
// Multi-turn state management, deterministic intent matching, bilingual
// (Bengali + English) exact 7-option main navigation, dynamic slot allocation,
// double-booking prevention, query tickets, and human handover.
// ==============================================================================

import { BotState, ConversationSession, Department, Doctor, PatientQuery, QueryCategory } from '@/types';
import { HospitalRepo } from '@/lib/db/repo';

// In-Memory store for active WhatsApp chat sessions (keyed by normalized phone number)
const sessions = new Map<string, ConversationSession>();

export interface BotReply {
  text: string;
  buttons?: Array<{ id: string; title: string }>;
  list?: {
    buttonTitle: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
  session: ConversationSession;
}

// EXACT BILINGUAL WELCOME MESSAGE AS SPECIFIED
export const EXACT_WELCOME_MESSAGE = `নমস্কার! Hiramani Memorial Hospital-এ আপনাকে স্বাগত।

Welcome to Hiramani Memorial Hospital.

আপনার কী তথ্য প্রয়োজন? How may we help you?

1️⃣ Doctor & Appointment
2️⃣ Departments & Services
3️⃣ Diagnostic Tests & Reports
4️⃣ Admission & Surgery Enquiry
5️⃣ Hospital Location & Contact
6️⃣ Billing & Insurance
7️⃣ Speak to Hospital Staff

Please select an option by typing its number.

জরুরি চিকিৎসার প্রয়োজন হলে WhatsApp উত্তরের জন্য অপেক্ষা করবেন না। হাসপাতালের যাচাইকৃত জরুরি নম্বরে অথবা স্থানীয় জরুরি পরিষেবায় যোগাযোগ করুন।`;

export class BotEngine {
  /**
   * Retrieves or creates a conversation session for a given phone number.
   * Guarantees session isolation between distinct patient phone numbers.
   */
  public static getSession(phone: string): ConversationSession {
    const normalised = phone.replace(/\D/g, '') || 'demo_user';
    let session = sessions.get(normalised);
    if (!session) {
      session = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        hospital_id: '00000000-0000-0000-0000-000000000001',
        phone: normalised,
        state: 'MAIN_MENU',
        state_payload: {},
        is_human_handover: false,
        last_interaction_at: new Date().toISOString(),
      };
      sessions.set(normalised, session);
    }
    return session;
  }

  /**
   * Resets a session back to the initial Main Menu.
   */
  public static resetSession(phone: string): ConversationSession {
    const normalised = phone.replace(/\D/g, '') || 'demo_user';
    const session: ConversationSession = {
      id: `sess-${Date.now()}`,
      hospital_id: '00000000-0000-0000-0000-000000000001',
      phone: normalised,
      state: 'MAIN_MENU',
      state_payload: {},
      is_human_handover: false,
      last_interaction_at: new Date().toISOString(),
    };
    sessions.set(normalised, session);
    return session;
  }

  /**
   * Main entry point to process an incoming user message.
   */
  public static async processMessage(phone: string, rawInput: string): Promise<BotReply> {
    const session = this.getSession(phone);
    const input = (rawInput || '').trim();
    const lower = input.toLowerCase();

    // 1. EMERGENCY BYPASS (Highest Priority - Checked immediately)
    // Supports English & Bengali emergency phrasing
    const isEmergency =
      lower === '🚨' ||
      lower.includes('emergency') ||
      lower.includes('ambulance') ||
      lower.includes('urgent') ||
      lower.includes('heart attack') ||
      lower.includes('chest pain') ||
      lower.includes('bleeding') ||
      lower.includes('stroke') ||
      lower.includes('unconscious') ||
      lower.includes('জরুরি') ||
      lower.includes('বুকে ব্যথা') ||
      lower.includes('হার্ট অ্যাটাক') ||
      lower.includes('অজ্ঞান') ||
      lower.includes('অ্যাম্বুলেন্স') ||
      lower.includes('রক্তপাত');

    if (isEmergency) {
      return this.renderEmergency(session);
    }

    // 2. GLOBAL RESET COMMANDS (Returns patient to exact welcome menu)
    if (
      lower === 'menu' ||
      lower === 'start' ||
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'restart' ||
      lower === 'নমস্কার' ||
      lower === 'মেনু'
    ) {
      session.state = 'MAIN_MENU';
      session.state_payload = {};
      session.is_human_handover = false;
      return this.renderMainMenu(session);
    }

    // 3. HUMAN HANDOVER ACTIVE SESSION HANDLING
    if (session.is_human_handover) {
      if (lower === 'bot' || lower === 'automated' || lower === 'menu' || lower === 'main menu' || lower === 'মেনু') {
        session.is_human_handover = false;
        session.state = 'MAIN_MENU';
        return this.renderMainMenu(session, 'স্বয়ংক্রিয় সহায়তা পুনরায় চালু করা হয়েছে। Automated assistant resumed.');
      }
      return {
        text: '👨‍💼 You are currently connected with *Hospital Reception*.\nA staff member will respond to you shortly.\n\nType *MENU* anytime to return to the automated assistant.',
        buttons: [{ id: 'menu', title: 'Return to Menu' }],
        session,
      };
    }

    // 4. GLOBAL BACK / RETURN COMMAND
    if (lower === 'back' || lower === '0' || lower === 'ফিরে যান') {
      return this.handleBack(session);
    }

    // 5. STATE MACHINE ROUTING
    switch (session.state) {
      case 'MAIN_MENU':
        return this.handleMainMenuInput(session, input);

      case 'DOCTOR_APPOINTMENT_MENU':
        return this.handleDoctorAppointmentMenuInput(session, input);

      case 'DOCTOR_AVAILABILITY_SELECT':
        return this.handleDoctorAvailabilitySelectInput(session, input);

      case 'CHECK_STATUS_INPUT':
        return this.handleCheckStatusInput(session, input);

      case 'BOOKING_DEPT':
        return this.handleBookingDeptInput(session, input);

      case 'BOOKING_DOCTOR':
        return this.handleBookingDoctorInput(session, input);

      case 'BOOKING_DATE':
        return this.handleBookingDateInput(session, input);

      case 'BOOKING_SLOT':
        return this.handleBookingSlotInput(session, input);

      case 'BOOKING_NAME':
        return this.handleBookingNameInput(session, input);

      case 'BOOKING_PHONE':
        return this.handleBookingPhoneInput(session, input);

      case 'BOOKING_CONFIRMATION':
        return this.handleBookingConfirmationInput(session, input);

      case 'CANCEL_RESCHEDULE_INPUT':
        return this.handleCancelRescheduleRefInput(session, input);

      case 'CANCEL_ACTION':
        return this.handleCancelActionInput(session, input);

      case 'RESCHEDULE_DATE':
        return this.handleRescheduleDateInput(session, input);

      case 'RESCHEDULE_SLOT':
        return this.handleRescheduleSlotInput(session, input);

      case 'DEPARTMENTS_SERVICES_MENU':
        return this.handleDepartmentsServicesMenuInput(session, input);

      case 'DEPARTMENT_DETAIL':
        return this.handleDepartmentDetailInput(session, input);

      case 'DIAGNOSTIC_REPORTS_MENU':
        return this.handleDiagnosticReportsMenuInput(session, input);

      case 'DIAGNOSTIC_ENQUIRY_TEXT':
        return this.handleDiagnosticEnquiryTextInput(session, input);

      case 'ADMISSION_SURGERY_MENU':
        return this.handleAdmissionSurgeryMenuInput(session, input);

      case 'ADMISSION_ENQUIRY_TEXT':
        return this.handleAdmissionEnquiryTextInput(session, input);

      case 'SURGERY_ENQUIRY_TEXT':
        return this.handleSurgeryEnquiryTextInput(session, input);

      case 'BILLING_INSURANCE_MENU':
        return this.handleBillingInsuranceMenuInput(session, input);

      case 'BILLING_ENQUIRY_TEXT':
        return this.handleBillingEnquiryTextInput(session, input);

      case 'STAFF_ASSISTANCE_INPUT':
        return this.handleStaffAssistanceTextInput(session, input);

      case 'QUERY_CATEGORY':
        return this.handleQueryCategoryInput(session, input);

      case 'QUERY_TEXT':
        return this.handleQueryTextInput(session, input);

      case 'FAQ_BROWSING':
        return this.handleFAQInput(session, input);

      default:
        session.state = 'MAIN_MENU';
        return this.renderMainMenu(session);
    }
  }

  // ----------------------------------------------------------------------------
  // MAIN MENU RENDERER & HANDLER
  // ----------------------------------------------------------------------------
  public static renderMainMenu(session: ConversationSession, prefixNotice?: string): BotReply {
    session.state = 'MAIN_MENU';
    session.state_payload = {};

    const fullText = prefixNotice ? `${prefixNotice}\n\n${EXACT_WELCOME_MESSAGE}` : EXACT_WELCOME_MESSAGE;

    return {
      text: fullText,
      buttons: [
        { id: '1', title: 'Doctor & Apt' },
        { id: '2', title: 'Departments' },
        { id: '7', title: 'Speak to Staff' },
      ],
      list: {
        buttonTitle: 'Main Menu',
        sections: [
          {
            title: 'Medical Services',
            rows: [
              { id: '1', title: '1. Doctor & Appointment', description: 'Doctors, availability & booking' },
              { id: '2', title: '2. Departments & Services', description: 'Clinical departments & services' },
              { id: '3', title: '3. Diagnostic Tests & Reports', description: 'Pathology, lab & reports' },
              { id: '4', title: '4. Admission & Surgery', description: 'Inpatient & surgery enquiries' },
            ],
          },
          {
            title: 'Hospital Information & Support',
            rows: [
              { id: '5', title: '5. Location & Contact', description: 'Address, map & phone numbers' },
              { id: '6', title: '6. Billing & Insurance', description: 'Fees, cashless TPA & payment' },
              { id: '7', title: '7. Speak to Staff', description: 'Live hospital staff assistance' },
            ],
          },
        ],
      },
      session,
    };
  }

  private static async handleMainMenuInput(session: ConversationSession, input: string): Promise<BotReply> {
    const clean = input.toLowerCase();

    // Map Bengali numerals and emoji numerals to standard ASCII numbers
    const normalizedInput = clean
      .replace(/১/g, '1')
      .replace(/২/g, '2')
      .replace(/৩/g, '3')
      .replace(/৪/g, '4')
      .replace(/৫/g, '5')
      .replace(/৬/g, '6')
      .replace(/৭/g, '7')
      .replace(/1️⃣/g, '1')
      .replace(/2️⃣/g, '2')
      .replace(/3️⃣/g, '3')
      .replace(/4️⃣/g, '4')
      .replace(/5️⃣/g, '5')
      .replace(/6️⃣/g, '6')
      .replace(/7️⃣/g, '7');

    // OPTION 1: Doctor & Appointment
    if (
      normalizedInput === '1' ||
      normalizedInput.includes('doctor') ||
      normalizedInput.includes('appointment') ||
      normalizedInput.includes('ডাক্তার') ||
      normalizedInput.includes('অ্যাপয়েন্টমেন্ট') ||
      normalizedInput.includes('আমি ডাক্তার দেখাতে চাই') ||
      normalizedInput.includes('ডাক্তারের অ্যাপয়েন্টমেন্ট চাই') ||
      normalizedInput.includes('book')
    ) {
      return this.renderDoctorAppointmentMenu(session);
    }

    // OPTION 2: Departments & Services
    if (
      normalizedInput === '2' ||
      normalizedInput.includes('department') ||
      normalizedInput.includes('service') ||
      normalizedInput.includes('বিভাগ') ||
      normalizedInput.includes('পরিষেবা')
    ) {
      return this.renderDepartmentsServices(session);
    }

    // OPTION 3: Diagnostic Tests & Reports
    if (
      normalizedInput === '3' ||
      normalizedInput.includes('diagnostic') ||
      normalizedInput.includes('test') ||
      normalizedInput.includes('report') ||
      normalizedInput.includes('ডায়াগনস্টিক') ||
      normalizedInput.includes('পরীক্ষা') ||
      normalizedInput.includes('রিপোর্ট') ||
      normalizedInput.includes('lab') ||
      normalizedInput.includes('blood') ||
      normalizedInput.includes('xray') ||
      normalizedInput.includes('scan')
    ) {
      return this.renderDiagnosticReportsMenu(session);
    }

    // OPTION 4: Admission & Surgery Enquiry
    if (
      normalizedInput === '4' ||
      normalizedInput.includes('admission') ||
      normalizedInput.includes('surgery') ||
      normalizedInput.includes('ভর্তি') ||
      normalizedInput.includes('অস্ত্রোপচার') ||
      normalizedInput.includes('bed') ||
      normalizedInput.includes('operation')
    ) {
      return this.renderAdmissionSurgeryMenu(session);
    }

    // OPTION 5: Hospital Location & Contact
    if (
      normalizedInput === '5' ||
      normalizedInput.includes('location') ||
      normalizedInput.includes('contact') ||
      normalizedInput.includes('address') ||
      normalizedInput.includes('ঠিকানা') ||
      normalizedInput.includes('যোগাযোগ') ||
      normalizedInput.includes('হাসপাতালের ঠিকানা কোথায়?') ||
      normalizedInput.includes('map') ||
      normalizedInput.includes('phone')
    ) {
      return this.renderLocationAndContact(session);
    }

    // OPTION 6: Billing & Insurance
    if (
      normalizedInput === '6' ||
      normalizedInput.includes('billing') ||
      normalizedInput.includes('insurance') ||
      normalizedInput.includes('বিলিং') ||
      normalizedInput.includes('বিমা') ||
      normalizedInput.includes('charge') ||
      normalizedInput.includes('fee') ||
      normalizedInput.includes('cashless') ||
      normalizedInput.includes('payment')
    ) {
      return this.renderBillingInsuranceMenu(session);
    }

    // OPTION 7: Speak to Hospital Staff
    if (
      normalizedInput === '7' ||
      normalizedInput.includes('staff') ||
      normalizedInput.includes('speak') ||
      normalizedInput.includes('human') ||
      normalizedInput.includes('কর্মীদের') ||
      normalizedInput.includes('কথা বলতে চাই') ||
      normalizedInput.includes('reception') ||
      normalizedInput.includes('help')
    ) {
      return this.renderSpeakToStaffPrompt(session);
    }

    // Fallback: Check FAQ search
    const matchedFaqs = await HospitalRepo.searchFAQs(clean);
    if (matchedFaqs.length > 0) {
      const best = matchedFaqs[0];
      return {
        text: `💡 *${best.question}*\n\n${best.answer}\n\nReply *MENU* for main menu or *7* to speak with hospital staff.`,
        buttons: [
          { id: '1', title: 'Doctor & Apt' },
          { id: '7', title: 'Speak to Staff' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    // Unknown intent recovery
    return {
      text:
        `দুঃখিত, আপনার বার্তাটি বুঝতে পারিনি। দয়া করে নিচের মেনু থেকে একটি বিকল্প নির্বাচন করুন (১-৭)।\n\n` +
        `Sorry, I did not understand that. Please reply with an option number (1-7) or type *MENU* to view options.`,
      buttons: [
        { id: '1', title: '1. Doctor & Apt' },
        { id: '5', title: '5. Location' },
        { id: 'menu', title: 'Main Menu' },
      ],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // OPTION 1: DOCTOR & APPOINTMENT WORKFLOW
  // ----------------------------------------------------------------------------
  public static renderDoctorAppointmentMenu(session: ConversationSession): BotReply {
    session.state = 'DOCTOR_APPOINTMENT_MENU';
    session.state_payload = {};

    const text =
      `ডাক্তার ও অ্যাপয়েন্টমেন্ট বিভাগে স্বাগতম।\n\n` +
      `Welcome to Doctor & Appointment Services.\n\n` +
      `Please choose an option:\n\n` +
      `1. View Doctors & Specialities\n` +
      `2. Check Doctor Availability\n` +
      `3. Book an Appointment\n` +
      `4. Reschedule an Appointment\n` +
      `5. Cancel an Appointment\n` +
      `6. Check Appointment Status\n` +
      `7. Main Menu`;

    return {
      text,
      buttons: [
        { id: '1', title: 'View Doctors' },
        { id: '3', title: 'Book Appointment' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleDoctorAppointmentMenuInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    const clean = input.toLowerCase().replace(/১/g, '1').replace(/২/g, '2').replace(/৩/g, '3').replace(/৪/g, '4').replace(/৫/g, '5').replace(/৬/g, '6').replace(/৭/g, '7');

    // 1. View Doctors & Specialities
    if (clean === '1' || clean.includes('view') || clean.includes('doctor') || clean.includes('speciality')) {
      return this.renderDoctorsList(session);
    }

    // 2. Check Doctor Availability
    if (clean === '2' || clean.includes('availab')) {
      return this.renderDoctorAvailabilitySelection(session);
    }

    // 3. Book an Appointment
    if (clean === '3' || clean.includes('book')) {
      return this.startBookingFlow(session);
    }

    // 4. Reschedule an Appointment
    if (clean === '4' || clean.includes('reschedule')) {
      session.state = 'CANCEL_RESCHEDULE_INPUT';
      session.state_payload.action = 'reschedule';
      return {
        text: `📝 *Reschedule Appointment*\n\nPlease enter your *Booking Reference* (e.g. *APT-20261025-4819*).\n\n_Type 'menu' to return._`,
        session,
      };
    }

    // 5. Cancel an Appointment
    if (clean === '5' || clean.includes('cancel')) {
      session.state = 'CANCEL_RESCHEDULE_INPUT';
      session.state_payload.action = 'cancel';
      return {
        text: `📝 *Cancel an Appointment*\n\nPlease enter your *Booking Reference* (e.g. *APT-20261025-4819*).\n\n_Type 'menu' to return._`,
        session,
      };
    }

    // 6. Check Appointment Status
    if (clean === '6' || clean.includes('status')) {
      session.state = 'CHECK_STATUS_INPUT';
      return {
        text: `🔍 *Check Appointment Status*\n\nPlease enter your *Booking Reference* (e.g. *APT-20261025-4819*).\n\n_Type 'menu' to return._`,
        session,
      };
    }

    // 7. Main Menu
    if (clean === '7' || clean.includes('menu')) {
      return this.renderMainMenu(session);
    }

    return {
      text: `Please choose a valid option (1-7) from the Doctor & Appointment menu, or type *MENU*.`,
      buttons: [
        { id: '1', title: 'View Doctors' },
        { id: '3', title: 'Book Appointment' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async renderDoctorsList(session: ConversationSession): Promise<BotReply> {
    const doctors = await HospitalRepo.getDoctors();
    if (doctors.length === 0) {
      return {
        text:
          `ডাক্তারের তথ্য এই মুহূর্তে উপলব্ধ নেই। অনুগ্রহ করে হাসপাতালের কর্মীদের সঙ্গে যোগাযোগ করুন।\n\n` +
          `Doctor information is currently unavailable. Please contact hospital staff for assistance.`,
        buttons: [
          { id: '7', title: 'Speak to Staff' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    let text = `🩺 *Hiramani Memorial Hospital • Specialist Doctors*\n\n`;
    doctors.forEach((d, idx) => {
      text += `${idx + 1}. *${d.full_name}*\n   ${d.speciality} (${d.qualification})\n   Consultation Fee: ₹${d.consultation_fee} | Room: ${d.room_number || 'OPD'}\n\n`;
    });
    text += `Reply *3* to Book an Appointment, or *7* for Main Menu.`;

    return {
      text,
      buttons: [
        { id: '3', title: 'Book Appointment' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async renderDoctorAvailabilitySelection(session: ConversationSession): Promise<BotReply> {
    session.state = 'DOCTOR_AVAILABILITY_SELECT';
    const doctors = await HospitalRepo.getDoctors();

    if (doctors.length === 0) {
      return {
        text: `Doctor schedule information is currently unavailable. Please contact hospital staff.`,
        buttons: [{ id: 'menu', title: 'Main Menu' }],
        session,
      };
    }

    let text = `📅 *Check Doctor Availability*\n\nPlease select a doctor to check their upcoming schedule:\n\n`;
    doctors.forEach((d, idx) => {
      text += `${idx + 1}️⃣  *${d.full_name}* (${d.speciality})\n`;
    });
    text += `\nReply with the doctor number (e.g. *1*) or *0* for Main Menu.`;

    return {
      text,
      buttons: doctors.slice(0, 3).map((d, i) => ({ id: `${i + 1}`, title: d.full_name.slice(0, 20) })),
      session,
    };
  }

  private static async handleDoctorAvailabilitySelectInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input === '0' || input.toLowerCase() === 'menu') {
      return this.renderDoctorAppointmentMenu(session);
    }

    const doctors = await HospitalRepo.getDoctors();
    const num = parseInt(input, 10);
    let selectedDoctor: Doctor | undefined;

    if (!isNaN(num) && num >= 1 && num <= doctors.length) {
      selectedDoctor = doctors[num - 1];
    } else {
      selectedDoctor = doctors.find(d => d.full_name.toLowerCase().includes(input.toLowerCase()));
    }

    if (!selectedDoctor) {
      return {
        text: `Please enter a valid doctor number (1 to ${doctors.length}) or *0* to return:`,
        session,
      };
    }

    const dates = await this.getUpcomingDatesForDoctor(selectedDoctor.id, 3);
    let text = `🩺 *Doctor Availability*\n\n*${selectedDoctor.full_name}* (${selectedDoctor.speciality})\nConsultation Fee: ₹${selectedDoctor.consultation_fee}\n\n*Upcoming OPD Dates & Available Slots:*\n\n`;

    for (const d of dates) {
      const slots = await HospitalRepo.getAvailableSlots(selectedDoctor.id, d.dateStr);
      text += `📅 *${d.label}* (${d.dateStr}):\n`;
      if (slots.length > 0) {
        text += `   ${slots.slice(0, 6).join(', ')}${slots.length > 6 ? ' ...' : ''}\n\n`;
      } else {
        text += `   _No slots available or OPD closed_\n\n`;
      }
    }

    text += `Reply *1* to Book an Appointment, or *MENU* for Main Menu.`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Book Appointment' },
        { id: 'menu', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleCheckStatusInput(session: ConversationSession, input: string): Promise<BotReply> {
    const ref = input.trim().toUpperCase();
    if (ref === 'MENU' || ref === '0') {
      return this.renderMainMenu(session);
    }

    const apt = await HospitalRepo.getAppointmentByReference(ref);
    if (!apt) {
      return {
        text: `❌ No appointment found for booking reference "*${ref}*".\n\nPlease double check and enter your booking reference (e.g. *APT-20261025-4819*), or type *MENU* to return.`,
        session,
      };
    }

    session.state = 'MAIN_MENU';
    const text =
      `📄 *Appointment Status • Hiramani Memorial Hospital*\n\n` +
      `• *Booking Reference:* *${apt.booking_reference}*\n` +
      `• *Patient Name:* ${apt.patient_name}\n` +
      `• *Doctor:* ${apt.doctor_name}\n` +
      `• *Department:* ${apt.department_name}\n` +
      `• *Date:* ${apt.appointment_date}\n` +
      `• *Time:* ${apt.start_time} - ${apt.end_time}\n` +
      `• *Status:* *${apt.status.toUpperCase()}*\n` +
      `• *Consultation Fee:* ₹${apt.consultation_fee} (Pay at Reception Counter)\n\n` +
      `_Please arrive 15 minutes before your consultation._\n\n` +
      `Reply *MENU* to return to the options.`;

    return {
      text,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // OPTION 2: DEPARTMENTS & SERVICES WORKFLOW
  // ----------------------------------------------------------------------------
  public static async renderDepartmentsServices(session: ConversationSession): Promise<BotReply> {
    session.state = 'DEPARTMENTS_SERVICES_MENU';
    const depts = await HospitalRepo.getDepartments();

    let text =
      `বিভাগ ও পরিষেবা\n\n` +
      `Departments & Services\n\n` +
      `Please select a department or service:\n\n`;

    if (depts.length === 0) {
      text += `_Department information is currently being updated. Please contact hospital staff for details._\n\n`;
    } else {
      depts.forEach((d, idx) => {
        text += `${idx + 1}️⃣  *${d.name}*\n    _${d.description || 'Specialised Clinical Care'}_\n\n`;
      });
    }

    text += `Reply with the number (e.g. *1*) or department name, or *0* for Main Menu.`;

    return {
      text,
      buttons: [
        { id: '1', title: depts[0]?.name || 'Medicine' },
        { id: '2', title: depts[1]?.name || 'Cardiology' },
        { id: '0', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleDepartmentsServicesMenuInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input === '0' || input.toLowerCase() === 'menu' || input.toLowerCase() === 'back') {
      return this.renderMainMenu(session);
    }

    const depts = await HospitalRepo.getDepartments();
    const num = parseInt(input, 10);
    let selectedDept: Department | undefined;

    if (!isNaN(num) && num >= 1 && num <= depts.length) {
      selectedDept = depts[num - 1];
    } else {
      selectedDept = depts.find(
        d =>
          d.id === input ||
          d.name.toLowerCase().includes(input.toLowerCase()) ||
          d.code.toLowerCase() === input.toLowerCase()
      );
    }

    if (!selectedDept) {
      return {
        text: `Please enter a valid department number (1 to ${depts.length}) or *0* for Main Menu:`,
        session,
      };
    }

    session.state_payload.selected_dept_id = selectedDept.id;
    session.state = 'DEPARTMENT_DETAIL';

    // Fetch doctors associated with this department
    const doctors = await HospitalRepo.getDoctors(selectedDept.id);
    const doctorNames = doctors.length > 0 ? doctors.map(d => `• ${d.full_name} (${d.qualification})`).join('\n') : '• Details available on request with hospital staff';

    const text =
      `🏥 *${selectedDept.name} Department*\n\n` +
      `${selectedDept.description || 'Dedicated clinical department at Hiramani Memorial Hospital.'}\n\n` +
      `📋 *Available Services:*\n` +
      `• Comprehensive Outpatient (OPD) Consultations\n` +
      `• Inpatient Care & High-Dependency Monitoring\n` +
      `• Diagnostic Evaluation & Treatment Protocols\n` +
      `• Emergency & Specialist Referral\n\n` +
      `👨‍⚕️ *Consultant Doctors:*\n${doctorNames}\n\n` +
      `⏰ *Operating Hours:* Monday - Saturday: 08:00 AM - 08:00 PM\n` +
      `📞 *Department Contact:* Hospital Front Desk\n\n` +
      `Reply *1* to Book an Appointment in this department, *2* to View Other Departments, or *7* for Main Menu.`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Book Appointment' },
        { id: '2', title: 'Other Depts' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleDepartmentDetailInput(session: ConversationSession, input: string): Promise<BotReply> {
    const clean = input.toLowerCase();
    if (clean === '1' || clean.includes('book')) {
      return this.startBookingFlow(session);
    }
    if (clean === '2' || clean.includes('dept') || clean.includes('back')) {
      return this.renderDepartmentsServices(session);
    }
    return this.renderMainMenu(session);
  }

  // ----------------------------------------------------------------------------
  // OPTION 3: DIAGNOSTIC TESTS & REPORTS WORKFLOW
  // ----------------------------------------------------------------------------
  public static renderDiagnosticReportsMenu(session: ConversationSession): BotReply {
    session.state = 'DIAGNOSTIC_REPORTS_MENU';
    session.state_payload = {};

    const text =
      `ডায়াগনস্টিক পরীক্ষা ও রিপোর্ট\n\n` +
      `Diagnostic Tests & Reports\n\n` +
      `Please select an option:\n\n` +
      `1. Available Diagnostic Tests\n` +
      `2. Test Preparation Information\n` +
      `3. Laboratory Timings\n` +
      `4. Report Collection Information\n` +
      `5. Ask About a Diagnostic Test\n` +
      `6. Main Menu`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Available Tests' },
        { id: '3', title: 'Lab Timings' },
        { id: '6', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleDiagnosticReportsMenuInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    const clean = input.toLowerCase().replace(/১/g, '1').replace(/২/g, '2').replace(/৩/g, '3').replace(/৪/g, '4').replace(/৫/g, '5').replace(/৬/g, '6');

    // 1. Available Diagnostic Tests
    if (clean === '1' || clean.includes('available')) {
      const text =
        `🔬 *Available Diagnostic Tests • Hiramani Memorial Hospital*\n\n` +
        `• *Hematology & Pathology:* Complete Blood Count (CBC), ESR, Blood Grouping, Peripheral Smear\n` +
        `• *Biochemistry:* Fasting / PP Blood Sugar, HbA1c, Lipid Profile, Liver Function (LFT), Kidney Function (KFT), Thyroid Profile (T3, T4, TSH)\n` +
        `• *Cardiology Diagnostics:* 12-Lead ECG, 2D Echocardiography with Color Doppler\n` +
        `• *Radiology & Imaging:* Digital X-Ray, Ultrasonography (USG Whole Abdomen / Pelvis), 128-Slice CT Scan\n` +
        `• *Clinical Pathology:* Routine Urine Analysis, Stool Examination\n\n` +
        `_Note: Diagnostic investigation prices are established as per hospital schedule. Please contact hospital diagnostic counter for verified pricing._\n\n` +
        `Reply *5* to Ask About a Test or *6* for Main Menu.`;

      return {
        text,
        buttons: [
          { id: '5', title: 'Ask About a Test' },
          { id: '6', title: 'Main Menu' },
        ],
        session,
      };
    }

    // 2. Test Preparation Information
    if (clean === '2' || clean.includes('prep')) {
      const text =
        `📋 *Diagnostic Test Preparation Instructions*\n\n` +
        `• *Fasting Blood Sugar & Lipid Profile:* Requires 8 to 10 hours of overnight fasting. Plain water is permitted.\n` +
        `• *Post-Prandial (PP) Sugar:* Blood sample must be taken exactly 2 hours after finishing your meal.\n` +
        `• *Pelvic / Lower Abdomen Ultrasound (USG):* Patient must have a full bladder. Drink 4-5 glasses of water 1 hour prior to scan and do not urinate.\n` +
        `• *Upper Abdomen Ultrasound:* Requires 6 hours strict fasting.\n` +
        `• *Digital X-Ray / ECG:* No prior fasting required. Wear comfortable clothing without metallic buttons/jewelry.\n\n` +
        `_For specialized tests, please follow exact instructions provided by your consultant doctor._\n\n` +
        `Reply *6* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '6', title: 'Main Menu' }],
        session,
      };
    }

    // 3. Laboratory Timings
    if (clean === '3' || clean.includes('timing') || clean.includes('hours')) {
      const text =
        `⏰ *Laboratory & Diagnostic Timings*\n\n` +
        `• *Routine Sample Collection:* Monday - Saturday: 07:00 AM - 08:00 PM\n` +
        `• *Sunday Sample Collection:* 07:00 AM - 01:00 PM\n` +
        `• *Diagnostic Counter Desk:* 07:30 AM - 08:30 PM Daily\n` +
        `• *Emergency Pathology & Diagnostics:* 24x7 Active\n\n` +
        `_Home blood sample collection is available in select areas with prior booking._\n\n` +
        `Reply *6* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '6', title: 'Main Menu' }],
        session,
      };
    }

    // 4. Report Collection Information
    if (clean === '4' || clean.includes('collection')) {
      const text =
        `📄 *Report Collection Information*\n\n` +
        `• *Routine Blood & Urine Reports:* Same day by 06:00 PM\n` +
        `• *Digital X-Ray & Ultrasound Reports:* Within 2 hours of scan completion\n` +
        `• *Specialized Cultures & Biopsies:* 48 to 72 hours\n` +
        `• *Collection Counter:* Diagnostic Helpdesk, Ground Floor (Please carry the physical payment receipt)\n\n` +
        `⚠️ *Patient Privacy Notice:* For medical confidentiality and security, diagnostic reports cannot be delivered over unverified WhatsApp requests without hospital verification.\n\n` +
        `Reply *6* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '6', title: 'Main Menu' }],
        session,
      };
    }

    // 5. Ask About a Diagnostic Test
    if (clean === '5' || clean.includes('ask')) {
      session.state = 'DIAGNOSTIC_ENQUIRY_TEXT';
      return {
        text:
          `🔬 *Ask About a Diagnostic Test*\n\n` +
          `Please type the name of the test or enquiry you would like information on.\n` +
          `Our diagnostic staff will review your query and provide verified assistance.\n\n` +
          `_Type 'menu' to cancel._`,
        session,
      };
    }

    // 6. Main Menu
    if (clean === '6' || clean.includes('menu')) {
      return this.renderMainMenu(session);
    }

    return {
      text: `Please reply with an option number between 1 and 6, or type *MENU*.`,
      session,
    };
  }

  private static async handleDiagnosticEnquiryTextInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'back') {
      return this.renderDiagnosticReportsMenu(session);
    }

    if (input.trim().length < 3) {
      return {
        text: `Please enter a brief description of the test or query you need assistance with:`,
        session,
      };
    }

    const query = await HospitalRepo.createQuery({
      patient_name: session.state_payload.patient_name || 'WhatsApp Patient',
      patient_phone: session.phone.startsWith('+') ? session.phone : `+${session.phone}`,
      category: 'Diagnostic Tests & Reports',
      description: input.trim(),
      priority: 'medium',
    });

    session.state = 'MAIN_MENU';
    session.state_payload = {};

    return {
      text:
        `✅ *Diagnostic Enquiry Received*\n\n` +
        `• *Ticket Reference:* *${query.ticket_number}*\n` +
        `• *Category:* Diagnostic Tests & Reports\n` +
        `• *Status:* Awaiting Staff Review\n\n` +
        `Our diagnostic department has received your enquiry and will contact you with verified information.\n\n` +
        `Reply *MENU* to return to the options.`,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // OPTION 4: ADMISSION & SURGERY ENQUIRY WORKFLOW
  // ----------------------------------------------------------------------------
  public static renderAdmissionSurgeryMenu(session: ConversationSession): BotReply {
    session.state = 'ADMISSION_SURGERY_MENU';
    session.state_payload = {};

    const text =
      `ভর্তি ও অস্ত্রোপচার সংক্রান্ত তথ্য\n\n` +
      `Admission & Surgery Enquiry\n\n` +
      `Please select an option:\n\n` +
      `1. Admission Information\n` +
      `2. Surgery Enquiry\n` +
      `3. Required Documents\n` +
      `4. Room and Bed Enquiry\n` +
      `5. Insurance and Payment Enquiry\n` +
      `6. Speak to Hospital Staff\n` +
      `7. Main Menu`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Admission Info' },
        { id: '2', title: 'Surgery Enquiry' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleAdmissionSurgeryMenuInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    const clean = input.toLowerCase().replace(/১/g, '1').replace(/২/g, '2').replace(/৩/g, '3').replace(/৪/g, '4').replace(/৫/g, '5').replace(/৬/g, '6').replace(/৭/g, '7');

    // 1. Admission Information
    if (clean === '1' || clean.includes('admission')) {
      const text =
        `🏥 *Inpatient Admission Information • Hiramani Memorial Hospital*\n\n` +
        `• *Planned Admissions:* Our 24x7 admission desk is situated on the Ground Floor. Please bring the admission advice slip issued by your consultant doctor.\n` +
        `• *Emergency Admissions:* Handled directly at our round-the-clock Emergency & Trauma Care Casualty.\n` +
        `• *Clinical Assessment:* Bed allocation and admission are subject to clinical evaluation by authorised hospital staff.\n\n` +
        `🚨 *Emergency Notice:* If urgent medical treatment is needed, please do not wait for a WhatsApp response. Proceed to the nearest hospital emergency room immediately.\n\n` +
        `Reply *2* for Surgery Enquiry or *7* for Main Menu.`;

      return {
        text,
        buttons: [
          { id: '2', title: 'Surgery Enquiry' },
          { id: '7', title: 'Main Menu' },
        ],
        session,
      };
    }

    // 2. Surgery Enquiry
    if (clean === '2' || clean.includes('surgery')) {
      session.state = 'SURGERY_ENQUIRY_TEXT';
      return {
        text:
          `🏥 *Surgery & Procedure Enquiry*\n\n` +
          `Please describe the surgery or procedure you are enquiring about (e.g. Procedure name, treating surgeon, proposed date).\n\n` +
          `_Important Notice: The hospital cannot provide medical opinions or confirm OT/bed availability over WhatsApp. A clinical coordinator will review your request._\n\n` +
          `_Type 'menu' to cancel._`,
        session,
      };
    }

    // 3. Required Documents
    if (clean === '3' || clean.includes('doc')) {
      const text =
        `📑 *Documents Required for Inpatient Admission*\n\n` +
        `1. Government Photo ID Card of the Patient (Aadhaar / Voter ID / Passport)\n` +
        `2. Government Photo ID Card of Primary Attendant\n` +
        `3. Doctor's Admission Recommendation Slip & Current Prescriptions\n` +
        `4. Prior Medical History, Discharge Summaries & Recent Diagnostic Reports\n` +
        `5. Health Insurance TPA Card & Policy Documents (for Cashless Hospitalisation)\n\n` +
        `Reply *7* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '7', title: 'Main Menu' }],
        session,
      };
    }

    // 4. Room and Bed Enquiry
    if (clean === '4' || clean.includes('bed') || clean.includes('room')) {
      const text =
        `🛏️ *Hospital Accommodation Categories*\n\n` +
        `• *General Ward:* Separate male & female multi-bed wards with round-the-clock nursing supervision\n` +
        `• *Semi-Private Ward:* Twin-sharing air-conditioned room with attendant seating\n` +
        `• *Single Private Deluxe Room:* Dedicated air-conditioned private room with patient monitor, TV & attendant bed\n` +
        `• *Critical Care Units (ICU / HDU / CCU):* Fully equipped intensive care with 1:1 nursing and advanced ventilators\n\n` +
        `_Note: Room and bed availability is dynamic and must be verified by the hospital admission desk. We never guarantee bed availability without verified confirmation._\n\n` +
        `Reply *6* to Speak to Hospital Staff or *7* for Main Menu.`;

      return {
        text,
        buttons: [
          { id: '6', title: 'Speak to Staff' },
          { id: '7', title: 'Main Menu' },
        ],
        session,
      };
    }

    // 5. Insurance and Payment Enquiry
    if (clean === '5' || clean.includes('insurance') || clean.includes('payment')) {
      const text =
        `💳 *Admission Insurance & Payment Guidelines*\n\n` +
        `• *Cashless TPA Desk:* Located on the Ground Floor, active 24x7 for pre-authorisation assistance.\n` +
        `• *Planned Surgery:* Pre-authorisation is recommended 48 hours prior to planned admission.\n` +
        `• *Emergency Admission:* Cashless intimations are submitted to insurers within 24 hours of emergency admission.\n` +
        `• *Initial Deposit:* An admission security deposit is payable at registration, adjustable against the final bill.\n\n` +
        `Reply *7* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '7', title: 'Main Menu' }],
        session,
      };
    }

    // 6. Speak to Hospital Staff
    if (clean === '6' || clean.includes('staff')) {
      return this.renderSpeakToStaffPrompt(session);
    }

    // 7. Main Menu
    if (clean === '7' || clean.includes('menu')) {
      return this.renderMainMenu(session);
    }

    return {
      text: `Please reply with an option number between 1 and 7, or type *MENU*.`,
      session,
    };
  }

  private static async handleSurgeryEnquiryTextInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'back') {
      return this.renderAdmissionSurgeryMenu(session);
    }

    if (input.trim().length < 3) {
      return {
        text: `Please enter a short description of the surgery or procedure:`,
        session,
      };
    }

    const query = await HospitalRepo.createQuery({
      patient_name: session.state_payload.patient_name || 'WhatsApp Patient',
      patient_phone: session.phone.startsWith('+') ? session.phone : `+${session.phone}`,
      category: 'Admission & Surgery Enquiry',
      description: input.trim(),
      priority: 'high',
    });

    session.state = 'MAIN_MENU';
    session.state_payload = {};

    return {
      text:
        `✅ *Surgery Enquiry Recorded*\n\n` +
        `• *Ticket Reference:* *${query.ticket_number}*\n` +
        `• *Category:* Admission & Surgery Enquiry\n` +
        `• *Status:* Awaiting Staff Confirmation\n\n` +
        `Your surgery enquiry has been forwarded to our clinical coordination desk. An authorised hospital team member will review your query and contact you.\n\n` +
        `_Note: All surgery scheduling, surgeon availability, and bed allocations require formal hospital verification._\n\n` +
        `Reply *MENU* to return to the options.`,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  private static async handleAdmissionEnquiryTextInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    return this.handleSurgeryEnquiryTextInput(session, input);
  }

  // ----------------------------------------------------------------------------
  // OPTION 5: HOSPITAL LOCATION & CONTACT WORKFLOW
  // ----------------------------------------------------------------------------
  public static async renderLocationAndContact(session: ConversationSession): Promise<BotReply> {
    session.state = 'MAIN_MENU';
    session.state_payload = {};

    const hosp = await HospitalRepo.getHospital();
    const settings = await HospitalRepo.getSettings();

    // Check if hospital contact information has been configured
    if (!hosp.address_line1 || !hosp.phone) {
      return {
        text:
          `হাসপাতালের ঠিকানা ও যোগাযোগ\n\n` +
          `Hospital Location & Contact\n\n` +
          `"Hospital contact information is not yet configured. Please contact authorised hospital staff for assistance."\n\n` +
          `বাংলা:\n` +
          `"হাসপাতালের যোগাযোগের তথ্য এখনও যুক্ত করা হয়নি। অনুগ্রহ করে হাসপাতালের কর্মীদের সঙ্গে যোগাযোগ করুন।"\n\n` +
          `Reply *MENU* to return to the options.`,
        buttons: [{ id: 'menu', title: 'Main Menu' }],
        session,
      };
    }

    let text =
      `হাসপাতালের ঠিকানা ও যোগাযোগ\n\n` +
      `Hospital Location & Contact\n\n` +
      `🏥 *${hosp.name}*\n` +
      `📍 *Address:* ${hosp.address_line1}${hosp.address_line2 ? ', ' + hosp.address_line2 : ''}, ${hosp.city}, ${hosp.state} - ${hosp.pincode}\n` +
      `📞 *Reception Phone:* ${hosp.phone}\n` +
      `🚨 *Verified Emergency Contact:* ${hosp.emergency_contact || '112 / 108'}\n`;

    if (hosp.website) {
      text += `🌐 *Official Website:* ${hosp.website}\n`;
    }

    if (hosp.google_maps_url) {
      text += `🗺️ *Google Maps Directions:* ${hosp.google_maps_url}\n`;
    }

    text +=
      `\n⏰ *Hospital Opening Hours:* Open 24 Hours (Emergency, Trauma & Inpatient)\n` +
      `🕒 *OPD Clinic Hours:* ${settings.opd_timings || 'Monday - Saturday: 08:00 AM - 08:00 PM'}\n` +
      `🕒 *Reception Contact Hours:* ${settings.reception_hours || '08:00 AM - 09:00 PM Daily'}\n\n` +
      `Reply *MENU* to return to the options.`;

    return {
      text,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // OPTION 6: BILLING & INSURANCE WORKFLOW
  // ----------------------------------------------------------------------------
  public static renderBillingInsuranceMenu(session: ConversationSession): BotReply {
    session.state = 'BILLING_INSURANCE_MENU';
    session.state_payload = {};

    const text =
      `বিলিং ও বিমা সংক্রান্ত তথ্য\n\n` +
      `Billing & Insurance\n\n` +
      `Please select an option:\n\n` +
      `1. Billing Enquiry\n` +
      `2. Consultation Charges\n` +
      `3. Insurance Information\n` +
      `4. Cashless Treatment Enquiry\n` +
      `5. Payment Methods\n` +
      `6. Speak to Billing Staff\n` +
      `7. Main Menu`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Billing Enquiry' },
        { id: '2', title: 'Doctor Charges' },
        { id: '7', title: 'Main Menu' },
      ],
      session,
    };
  }

  private static async handleBillingInsuranceMenuInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    const clean = input.toLowerCase().replace(/১/g, '1').replace(/২/g, '2').replace(/৩/g, '3').replace(/৪/g, '4').replace(/৫/g, '5').replace(/৬/g, '6').replace(/৭/g, '7');

    // 1. Billing Enquiry
    if (clean === '1' || clean.includes('enquiry')) {
      session.state = 'BILLING_ENQUIRY_TEXT';
      return {
        text:
          `💳 *Submit Billing Enquiry*\n\n` +
          `Please briefly describe your billing question or invoice enquiry.\n\n` +
          `⚠️ *Important Security Rule:* Never share bank card PINs, banking passwords, OTPs, or financial security credentials.\n\n` +
          `_Type 'menu' to cancel._`,
        session,
      };
    }

    // 2. Consultation Charges
    if (clean === '2' || clean.includes('charge') || clean.includes('fee')) {
      const doctors = await HospitalRepo.getDoctors();
      let msg = `💳 *Verified Doctor Consultation Fees (OPD)*\n\n`;
      doctors.forEach(doc => {
        msg += `• *${doc.full_name}* (${doc.department_name})\n  Fee: ₹${doc.consultation_fee} (Follow-up: ₹${doc.follow_up_fee || 300})\n`;
      });
      msg += `\n_All fees are verified as per hospital policy. Payment accepted at reception counter._\n\nReply *1* to Book an Appointment or *7* for Main Menu.`;

      return {
        text: msg,
        buttons: [
          { id: '1', title: 'Book Appointment' },
          { id: '7', title: 'Main Menu' },
        ],
        session,
      };
    }

    // 3. Insurance Information
    if (clean === '3' || clean.includes('insurance')) {
      const text =
        `🏥 *Empanelled Insurance TPAs & Providers*\n\n` +
        `Hiramani Memorial Hospital supports cashless hospitalisation for major insurers and TPAs, including:\n\n` +
        `• Star Health & Allied Insurance\n` +
        `• Medi Assist Insurance TPA\n` +
        `• HDFC ERGO General Insurance\n` +
        `• ICICI Lombard General Insurance\n` +
        `• Paramount Health Services TPA\n` +
        `• Vidal Health Insurance TPA\n` +
        `• Heritage Health Insurance TPA\n` +
        `• National Insurance / New India Assurance (GIPSA)\n\n` +
        `_Note: Coverage approval and admissible items depend on your specific insurance policy terms. Please submit a query for claim verification._\n\n` +
        `Reply *1* for Billing Enquiry or *7* for Main Menu.`;

      return {
        text,
        buttons: [
          { id: '1', title: 'Billing Enquiry' },
          { id: '7', title: 'Main Menu' },
        ],
        session,
      };
    }

    // 4. Cashless Treatment Enquiry
    if (clean === '4' || clean.includes('cashless')) {
      const text =
        `📋 *Cashless Treatment Procedure*\n\n` +
        `1. *Card Submission:* Present your health insurance TPA e-card, policy document & Government Photo ID at our TPA Desk.\n` +
        `2. *Pre-Authorization:* The hospital TPA desk submits pre-authorisation request to your insurer/TPA.\n` +
        `3. *Initial Approval:* Insurer verifies policy validity and issues initial sanction letter.\n` +
        `4. *Discharge & Settlement:* Final approval is processed on discharge. Patient only settles non-medical/deductible charges.\n\n` +
        `_For planned procedures, please visit the TPA desk 48 hours prior._\n\n` +
        `Reply *7* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '7', title: 'Main Menu' }],
        session,
      };
    }

    // 5. Payment Methods
    if (clean === '5' || clean.includes('payment')) {
      const text =
        `💳 *Accepted Payment Methods*\n\n` +
        `• *UPI:* Google Pay, PhonePe, Paytm, BHIM, Amazon Pay\n` +
        `• *Cards:* Credit & Debit Cards (Visa, MasterCard, RuPay)\n` +
        `• *Banking:* Net Banking, NEFT / RTGS transfers\n` +
        `• *Cash:* Accepted at Billing Counters on Ground Floor and 2nd Floor\n\n` +
        `⚠️ *Safety Warning:* Hiramani Memorial Hospital never asks patients to transfer funds to personal phone numbers or third-party links via WhatsApp.\n\n` +
        `Reply *7* for Main Menu.`;

      return {
        text,
        buttons: [{ id: '7', title: 'Main Menu' }],
        session,
      };
    }

    // 6. Speak to Billing Staff
    if (clean === '6' || clean.includes('staff')) {
      session.state = 'BILLING_ENQUIRY_TEXT';
      return {
        text: `Please enter your billing query and our billing desk staff will follow up with you:`,
        session,
      };
    }

    // 7. Main Menu
    if (clean === '7' || clean.includes('menu')) {
      return this.renderMainMenu(session);
    }

    return {
      text: `Please reply with an option number between 1 and 7, or type *MENU*.`,
      session,
    };
  }

  private static async handleBillingEnquiryTextInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'back') {
      return this.renderBillingInsuranceMenu(session);
    }

    if (input.trim().length < 3) {
      return {
        text: `Please provide a brief description of your billing query:`,
        session,
      };
    }

    const query = await HospitalRepo.createQuery({
      patient_name: session.state_payload.patient_name || 'WhatsApp Patient',
      patient_phone: session.phone.startsWith('+') ? session.phone : `+${session.phone}`,
      category: 'Billing & Insurance',
      description: input.trim(),
      priority: 'medium',
    });

    session.state = 'MAIN_MENU';
    session.state_payload = {};

    return {
      text:
        `✅ *Billing Enquiry Submitted*\n\n` +
        `• *Ticket Reference:* *${query.ticket_number}*\n` +
        `• *Category:* Billing & Insurance\n` +
        `• *Status:* Assigned to Billing Desk\n\n` +
        `Our hospital billing team has received your query and will follow up with verified information.\n\n` +
        `Reply *MENU* to return to the options.`,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // OPTION 7: SPEAK TO HOSPITAL STAFF WORKFLOW (HUMAN HANDOVER)
  // ----------------------------------------------------------------------------
  public static renderSpeakToStaffPrompt(session: ConversationSession): BotReply {
    session.state = 'STAFF_ASSISTANCE_INPUT';
    session.state_payload = {};

    const text =
      `আমাদের হাসপাতালের কর্মীদের সঙ্গে যোগাযোগ করার জন্য ধন্যবাদ।\n\n` +
      `Thank you for contacting Hiramani Memorial Hospital.\n\n` +
      `Please briefly tell us what assistance you need. Our team will review your request.\n\n` +
      `For urgent medical assistance, please do not wait for a WhatsApp reply. Contact verified emergency services.`;

    return {
      text,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  private static async handleStaffAssistanceTextInput(
    session: ConversationSession,
    input: string
  ): Promise<BotReply> {
    if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'back') {
      return this.renderMainMenu(session);
    }

    if (input.trim().length < 2) {
      return {
        text: `Please describe what assistance you need from hospital staff:`,
        session,
      };
    }

    // Create query ticket in DB
    const query = await HospitalRepo.createQuery({
      patient_name: session.state_payload.patient_name || 'WhatsApp Patient',
      patient_phone: session.phone.startsWith('+') ? session.phone : `+${session.phone}`,
      category: 'Speak to Hospital Staff',
      description: input.trim(),
      priority: 'high',
    });

    // Mark session as awaiting human assistance
    session.is_human_handover = true;
    session.state = 'MAIN_MENU';
    session.state_payload = { ticket_number: query.ticket_number };

    return {
      text:
        `✅ আমাদের কর্মীরা আপনার অনুরোধটি গ্রহণ করেছেন।\n\n` +
        `Thank you. Your request has been recorded.\n\n` +
        `📌 *Reference Ticket:* *${query.ticket_number}*\n` +
        `📋 *Category:* Speak to Hospital Staff\n` +
        `*Status:* Assigned to Hospital Staff\n\n` +
        `An authorised hospital staff member will review your message and respond shortly.\n\n` +
        `_Type 'MENU' at any time to return to the automated assistant._`,
      buttons: [{ id: 'menu', title: 'Return to Bot' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // EMERGENCY WORKFLOW (VERIFIED & SAFE)
  // ----------------------------------------------------------------------------
  private static async renderEmergency(session: ConversationSession): Promise<BotReply> {
    const hosp = await HospitalRepo.getHospital();
    return {
      text:
        `🚨 *জরুরি চিকিৎসা সহায়তা • EMERGENCY CARE*\n` +
        `🏥 *Hiramani Memorial Hospital*\n\n` +
        `জরুরি চিকিৎসার প্রয়োজন হলে WhatsApp উত্তরের জন্য অপেক্ষা করবেন না। হাসপাতালের যাচাইকৃত জরুরি নম্বরে অথবা স্থানীয় জরুরি পরিষেবায় যোগাযোগ করুন।\n\n` +
        `If you or someone near you has a medical emergency:\n\n` +
        `📞 *24x7 Emergency Contact:* ${hosp.emergency_contact || '112 / 108'}\n` +
        `🚑 *Ambulance Desk:* ${hosp.phone || '108'}\n` +
        `📍 *Emergency Casualty Address:*\n${hosp.name}, ${hosp.address_line1}, ${hosp.city}\n\n` +
        `🚨 *National Emergency Number:* 112 / 108\n\n` +
        `⚠️ *Important Safety Notice:* The WhatsApp chatbot cannot provide clinical diagnoses or emergency medical treatment. Please proceed to the nearest hospital emergency room immediately.`,
      buttons: [
        { id: '7', title: 'Speak to Staff' },
        { id: 'menu', title: 'Main Menu' },
      ],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // APPOINTMENT BOOKING MULTI-STEP FLOW
  // ----------------------------------------------------------------------------
  private static async startBookingFlow(session: ConversationSession): Promise<BotReply> {
    session.state = 'BOOKING_DEPT';
    session.state_payload = {};

    const depts = await HospitalRepo.getDepartments();
    let text = `📅 *Book an Appointment - Step 1 of 6*\n\nPlease select a Department:\n\n`;
    depts.forEach((d, idx) => {
      text += `${idx + 1}️⃣  *${d.name}*\n    _${d.description || ''}_\n\n`;
    });
    text += `Reply with the number (e.g. *1*) or department name.`;

    const rows = depts.map((d, idx) => ({
      id: d.id,
      title: `${idx + 1}. ${d.name}`,
      description: d.description?.slice(0, 50),
    }));

    return {
      text,
      list: {
        buttonTitle: 'Select Department',
        sections: [{ title: 'Hospital Departments', rows }],
      },
      buttons: [
        { id: '1', title: depts[0]?.name || 'General' },
        { id: '2', title: depts[1]?.name || 'Cardiology' },
        { id: 'menu', title: 'Cancel / Menu' },
      ],
      session,
    };
  }

  private static async handleBookingDeptInput(session: ConversationSession, input: string): Promise<BotReply> {
    const depts = await HospitalRepo.getDepartments();
    let selectedDept: Department | undefined;

    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= depts.length) {
      selectedDept = depts[num - 1];
    } else {
      selectedDept = depts.find(
        d =>
          d.id === input ||
          d.name.toLowerCase().includes(input.toLowerCase()) ||
          d.code.toLowerCase() === input.toLowerCase()
      );
    }

    if (!selectedDept) {
      return {
        text: `Please select a valid department number between 1 and ${depts.length}, or type *menu* to cancel.`,
        session,
      };
    }

    session.state_payload.dept_id = selectedDept.id;
    session.state_payload.dept_name = selectedDept.name;
    session.state = 'BOOKING_DOCTOR';

    const doctors = await HospitalRepo.getDoctors(selectedDept.id);
    if (doctors.length === 0) {
      return {
        text: `No doctors currently available in ${selectedDept.name}. Please select another department or contact reception.`,
        buttons: [{ id: 'back', title: 'Choose Department' }],
        session,
      };
    }

    let text = `👨‍⚕️ *Select Doctor - Step 2 of 6*\n\nDepartment: *${selectedDept.name}*\n\n`;
    doctors.forEach((doc, idx) => {
      text += `${idx + 1}️⃣  *${doc.full_name}*\n    ${doc.qualification} • Fee: ₹${doc.consultation_fee}\n\n`;
    });
    text += `0️⃣  *Any Available Doctor*\n\nReply with doctor number or *0* for any available doctor.`;

    const buttons = doctors.slice(0, 2).map((d, i) => ({ id: d.id, title: d.full_name.slice(0, 20) }));
    buttons.push({ id: 'any', title: 'Any Doctor' });

    return {
      text,
      buttons,
      session,
    };
  }

  private static async handleBookingDoctorInput(session: ConversationSession, input: string): Promise<BotReply> {
    const deptId = session.state_payload.dept_id;
    const doctors = await HospitalRepo.getDoctors(deptId);

    let selectedDoctor: Doctor | undefined;
    const num = parseInt(input, 10);

    if (input.toLowerCase() === 'any' || num === 0) {
      selectedDoctor = doctors[0];
    } else if (!isNaN(num) && num >= 1 && num <= doctors.length) {
      selectedDoctor = doctors[num - 1];
    } else {
      selectedDoctor = doctors.find(
        d => d.id === input || d.full_name.toLowerCase().includes(input.toLowerCase())
      );
    }

    if (!selectedDoctor) {
      return {
        text: `Please enter a valid doctor number (1 to ${doctors.length}) or *0* for Any Doctor.`,
        session,
      };
    }

    session.state_payload.doctor_id = selectedDoctor.id;
    session.state_payload.doctor_name = selectedDoctor.full_name;
    session.state_payload.consultation_fee = selectedDoctor.consultation_fee;
    session.state = 'BOOKING_DATE';

    const dates = await this.getUpcomingDatesForDoctor(selectedDoctor.id, 4);
    session.state_payload.available_dates = dates;

    let text = `📅 *Choose Date - Step 3 of 6*\n\nDoctor: *${selectedDoctor.full_name}*\n\nPlease select your preferred appointment date:\n\n`;
    dates.forEach((d, idx) => {
      text += `${idx + 1}️⃣  *${d.label}* (${d.dateStr})\n`;
    });
    text += `\nReply with *1*, *2*, *3*, or *4*.`;

    const buttons = dates.slice(0, 3).map((d, i) => ({
      id: d.dateStr,
      title: `${d.label.slice(0, 10)} (${d.dateStr.slice(5)})`,
    }));

    return {
      text,
      buttons,
      session,
    };
  }

  private static async handleBookingDateInput(session: ConversationSession, input: string): Promise<BotReply> {
    const dates: Array<{ dateStr: string; label: string }> = session.state_payload.available_dates || [];
    let selectedDateStr: string | undefined;

    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= dates.length) {
      selectedDateStr = dates[num - 1].dateStr;
    } else {
      const matched = dates.find(d => d.dateStr === input || input.includes(d.dateStr));
      if (matched) selectedDateStr = matched.dateStr;
    }

    if (!selectedDateStr) {
      return {
        text: `Please choose a valid date number (1 to ${dates.length || 4}) or reply *MENU* to restart.`,
        session,
      };
    }

    session.state_payload.date = selectedDateStr;
    session.state = 'BOOKING_SLOT';

    const doctorId = session.state_payload.doctor_id;
    if (!doctorId) {
      return this.renderMainMenu(session, 'Booking session expired. Please choose an option from the menu:');
    }

    const slots = await HospitalRepo.getAvailableSlots(doctorId, selectedDateStr);

    if (slots.length === 0) {
      session.state = 'BOOKING_DATE';
      return {
        text: `⚠️ No slots available for *${session.state_payload.doctor_name}* on *${selectedDateStr}*.\nPlease select a different date:`,
        buttons: [
          { id: '1', title: 'Choose Date' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    session.state_payload.available_slots = slots;

    let text = `⏰ *Select Time Slot - Step 4 of 6*\n\nDate: *${selectedDateStr}*\nDoctor: *${session.state_payload.doctor_name}*\n\nAvailable slots:\n\n`;
    slots.slice(0, 8).forEach((slot, idx) => {
      text += `${idx + 1}️⃣  *${slot}*\n`;
    });
    text += `\nReply with the slot number (e.g. *1*) or time (e.g. *${slots[0]}*).`;

    const buttons = slots.slice(0, 3).map((s, i) => ({ id: s, title: s }));

    return {
      text,
      buttons,
      session,
    };
  }

  private static async handleBookingSlotInput(session: ConversationSession, input: string): Promise<BotReply> {
    const slots: string[] = session.state_payload.available_slots || [];
    let selectedSlot: string | undefined;

    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= slots.length) {
      selectedSlot = slots[num - 1];
    } else {
      selectedSlot = slots.find(s => s === input.slice(0, 5));
    }

    if (!selectedSlot) {
      return {
        text: `Please select an available slot number or time from the list above.`,
        session,
      };
    }

    session.state_payload.slot = selectedSlot;
    session.state = 'BOOKING_NAME';

    return {
      text:
        `👤 *Patient Details - Step 5 of 6*\n\n` +
        `Selected Time: *${session.state_payload.date} at ${selectedSlot}*\n\n` +
        `Please enter the *Patient's Full Name*:\n` +
        `_(e.g. Rahul Sharma)_`,
      session,
    };
  }

  private static async handleBookingNameInput(session: ConversationSession, input: string): Promise<BotReply> {
    const name = input.trim();
    if (name.length < 2) {
      return {
        text: 'Please enter a valid patient name (at least 2 letters):',
        session,
      };
    }

    session.state_payload.patient_name = name;
    session.state = 'BOOKING_PHONE';

    return {
      text:
        `📱 *Contact Number - Step 6 of 6*\n\n` +
        `Please provide the 10-digit WhatsApp phone number for booking updates.\n\n` +
        `Reply *1* to use this number (*${session.phone}*), or type a new 10-digit number.`,
      buttons: [{ id: '1', title: 'Use This Number' }],
      session,
    };
  }

  private static async handleBookingPhoneInput(session: ConversationSession, input: string): Promise<BotReply> {
    let phone = session.phone;
    if (input !== '1' && input.toLowerCase() !== 'yes') {
      const cleanDigits = input.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        phone = `+91${cleanDigits}`;
      } else if (cleanDigits.length >= 10) {
        phone = `+${cleanDigits}`;
      } else {
        return {
          text: 'Please enter a valid 10-digit mobile number, or reply *1* to use your current WhatsApp number:',
          buttons: [{ id: '1', title: 'Use Current Phone' }],
          session,
        };
      }
    } else {
      phone = session.phone.startsWith('+') ? session.phone : `+${session.phone}`;
    }

    session.state_payload.patient_phone = phone;
    session.state = 'BOOKING_CONFIRMATION';

    const p = session.state_payload;
    const summary =
      `📋 *BOOKING SUMMARY • Hiramani Memorial Hospital*\n\n` +
      `• *Patient:* ${p.patient_name}\n` +
      `• *Phone:* ${p.patient_phone}\n` +
      `• *Department:* ${p.dept_name}\n` +
      `• *Doctor:* ${p.doctor_name}\n` +
      `• *Date:* ${p.date}\n` +
      `• *Time Slot:* ${p.slot}\n` +
      `• *Consultation Fee:* ₹${p.consultation_fee} (Pay at hospital counter)\n\n` +
      `Reply *1* to CONFIRM this booking or *2* to CANCEL.`;

    return {
      text: summary,
      buttons: [
        { id: '1', title: 'Confirm Booking' },
        { id: '2', title: 'Cancel' },
      ],
      session,
    };
  }

  private static async handleBookingConfirmationInput(session: ConversationSession, input: string): Promise<BotReply> {
    const clean = input.toLowerCase();

    if (clean === '2' || clean === 'cancel') {
      session.state = 'MAIN_MENU';
      session.state_payload = {};
      return this.renderMainMenu(session, '❌ Appointment booking was cancelled.');
    }

    if (clean !== '1' && clean !== 'confirm' && clean !== 'yes') {
      return {
        text: 'Please reply *1* to Confirm your booking or *2* to Cancel.',
        buttons: [
          { id: '1', title: 'Confirm' },
          { id: '2', title: 'Cancel' },
        ],
        session,
      };
    }

    // ATOMIC RESERVATION in Database
    const p = session.state_payload;
    if (!p.doctor_id || !p.date || !p.slot || !p.patient_name || !p.patient_phone) {
      return this.renderMainMenu(session, 'Booking session expired or incomplete. Please start over:');
    }

    const result = await HospitalRepo.bookAppointment({
      doctor_id: p.doctor_id,
      department_id: p.dept_id,
      patient_name: p.patient_name,
      patient_phone: p.patient_phone,
      appointment_date: p.date,
      start_time: p.slot,
      booking_channel: 'whatsapp',
      administrative_note: 'Booked via Hiramani Memorial Hospital WhatsApp Automation',
    });

    if (!result.success || !result.appointment) {
      session.state = 'BOOKING_SLOT';
      return {
        text: `⚠️ *Slot Unavailable*\n\n${result.error || 'The slot was just taken by another patient.'}\n\nPlease choose another available time:`,
        buttons: [
          { id: 'back', title: 'Select Other Slot' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    const apt = result.appointment;
    session.state = 'MAIN_MENU';
    session.state_payload = {};

    const confirmationText =
      `🎉 *APPOINTMENT CONFIRMED!*\n\n` +
      `Your appointment has been successfully scheduled at *Hiramani Memorial Hospital*.\n\n` +
      `📌 *Booking Reference:* *${apt.booking_reference}*\n` +
      `👤 *Patient:* ${apt.patient_name}\n` +
      `👨‍⚕️ *Doctor:* ${apt.doctor_name}\n` +
      `🏥 *Department:* ${apt.department_name}\n` +
      `📅 *Date:* ${apt.appointment_date}\n` +
      `⏰ *Time:* ${apt.start_time} - ${apt.end_time}\n` +
      `💳 *Consultation Fee:* ₹${apt.consultation_fee} (Pay at Reception)\n\n` +
      `📍 *Instructions:*\n` +
      `• Please arrive 15 minutes prior to your slot.\n` +
      `• Show this reference *${apt.booking_reference}* at the OPD reception counter.\n` +
      `• To check status or modify, reply *1* from Main Menu.\n\n` +
      `Thank you for choosing Hiramani Memorial Hospital!`;

    return {
      text: confirmationText,
      buttons: [
        { id: 'menu', title: 'Main Menu' },
        { id: '1', title: 'Doctor & Apt' },
      ],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // CANCELLATION & RESCHEDULING
  // ----------------------------------------------------------------------------
  private static async handleCancelRescheduleRefInput(session: ConversationSession, input: string): Promise<BotReply> {
    const ref = input.trim().toUpperCase();
    if (ref === 'MENU' || ref === '0') {
      return this.renderMainMenu(session);
    }

    const apt = await HospitalRepo.getAppointmentByReference(ref);
    if (!apt) {
      return {
        text: `❌ No appointment found for reference "*${ref}*".\nPlease double check and enter the reference (e.g. *APT-20261025-4819*), or reply *MENU* to exit.`,
        session,
      };
    }

    session.state_payload.booking_ref = apt.booking_reference;
    session.state_payload.apt_id = apt.id;

    // Check action
    if (session.state_payload.action === 'cancel') {
      await HospitalRepo.updateAppointmentStatus(apt.id, 'cancelled', 'Cancelled by patient via WhatsApp');
      session.state = 'MAIN_MENU';
      return {
        text: `✅ Your appointment (*${apt.booking_reference}*) has been CANCELLED as requested.\n\nReply *1* anytime to book a new appointment or *MENU* for options.`,
        buttons: [
          { id: '1', title: 'Book New Appointment' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    if (session.state_payload.action === 'reschedule') {
      session.state = 'RESCHEDULE_DATE';
      const dates = await this.getUpcomingDatesForDoctor(apt.doctor_id, 4);
      session.state_payload.available_dates = dates;

      let text = `📅 *Reschedule Appointment*\n\nDoctor: *${apt.doctor_name}*\nPlease select a new date:\n\n`;
      dates.forEach((d, idx) => {
        text += `${idx + 1}️⃣  *${d.label}* (${d.dateStr})\n`;
      });

      return {
        text,
        buttons: dates.slice(0, 3).map(d => ({ id: d.dateStr, title: d.label })),
        session,
      };
    }

    session.state = 'CANCEL_ACTION';
    const text =
      `📄 *Appointment Details*\n\n` +
      `• *Reference:* ${apt.booking_reference}\n` +
      `• *Patient:* ${apt.patient_name}\n` +
      `• *Doctor:* ${apt.doctor_name}\n` +
      `• *Date & Time:* ${apt.appointment_date} at ${apt.start_time}\n` +
      `• *Status:* ${apt.status.toUpperCase()}\n\n` +
      `What would you like to do?\n` +
      `1️⃣  *Cancel Appointment*\n` +
      `2️⃣  *Reschedule Appointment*\n` +
      `3️⃣  *Keep Appointment & Return to Menu*`;

    return {
      text,
      buttons: [
        { id: '1', title: 'Cancel Appointment' },
        { id: '2', title: 'Reschedule' },
        { id: '3', title: 'Keep Appointment' },
      ],
      session,
    };
  }

  private static async handleCancelActionInput(session: ConversationSession, input: string): Promise<BotReply> {
    const clean = input.toLowerCase();

    if (clean === '1' || clean.includes('cancel')) {
      const aptId = session.state_payload.apt_id;
      if (!aptId) {
        return this.renderMainMenu(session, 'Session expired. Please choose an option from the menu:');
      }
      await HospitalRepo.updateAppointmentStatus(aptId, 'cancelled', 'Cancelled by patient via WhatsApp');
      session.state = 'MAIN_MENU';
      return {
        text: `✅ Your appointment (*${session.state_payload.booking_ref}*) has been CANCELLED as requested.\n\nReply *1* anytime to book a new appointment or *MENU* for options.`,
        buttons: [
          { id: '1', title: 'Book New Appointment' },
          { id: 'menu', title: 'Main Menu' },
        ],
        session,
      };
    }

    if (clean === '2' || clean.includes('reschedule')) {
      session.state = 'RESCHEDULE_DATE';
      const apt = await HospitalRepo.getAppointmentByReference(session.state_payload.booking_ref || '');
      const dates = apt ? await this.getUpcomingDatesForDoctor(apt.doctor_id, 4) : this.getUpcomingDates(4);
      session.state_payload.available_dates = dates;

      let text = `📅 *Reschedule Appointment*\n\nPlease select a new date:\n\n`;
      dates.forEach((d, idx) => {
        text += `${idx + 1}️⃣  *${d.label}* (${d.dateStr})\n`;
      });

      return {
        text,
        buttons: dates.slice(0, 3).map(d => ({ id: d.dateStr, title: d.label })),
        session,
      };
    }

    session.state = 'MAIN_MENU';
    return this.renderMainMenu(session, 'Your appointment remains unchanged.');
  }

  private static async handleRescheduleDateInput(session: ConversationSession, input: string): Promise<BotReply> {
    const dates: Array<{ dateStr: string; label: string }> = session.state_payload.available_dates || [];
    let selectedDateStr: string | undefined;

    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= dates.length) {
      selectedDateStr = dates[num - 1].dateStr;
    } else {
      const matched = dates.find(d => d.dateStr === input);
      if (matched) selectedDateStr = matched.dateStr;
    }

    if (!selectedDateStr) {
      return {
        text: 'Please select a valid date number (1 to 4):',
        session,
      };
    }

    session.state_payload.new_date = selectedDateStr;
    session.state = 'RESCHEDULE_SLOT';

    const bookingRef = session.state_payload.booking_ref || '';
    const apt = await HospitalRepo.getAppointmentByReference(bookingRef);
    const slots = apt ? await HospitalRepo.getAvailableSlots(apt.doctor_id, selectedDateStr) : [];

    if (slots.length === 0) {
      return {
        text: `No slots available on *${selectedDateStr}*. Please select another date:`,
        buttons: [{ id: 'back', title: 'Choose Another Date' }],
        session,
      };
    }

    session.state_payload.available_slots = slots;
    let text = `⏰ *Select New Time Slot*\n\nDate: *${selectedDateStr}*\n\n`;
    slots.slice(0, 6).forEach((s, idx) => {
      text += `${idx + 1}️⃣  *${s}*\n`;
    });

    return {
      text,
      buttons: slots.slice(0, 3).map(s => ({ id: s, title: s })),
      session,
    };
  }

  private static async handleRescheduleSlotInput(session: ConversationSession, input: string): Promise<BotReply> {
    const slots: string[] = session.state_payload.available_slots || [];
    let selectedSlot: string | undefined;

    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= slots.length) {
      selectedSlot = slots[num - 1];
    } else {
      selectedSlot = slots.find(s => s === input.slice(0, 5));
    }

    if (!selectedSlot) {
      return { text: 'Please select a valid slot from the list above.', session };
    }

    const aptId = session.state_payload.apt_id;
    const newDate = session.state_payload.new_date;
    if (!aptId || !newDate) {
      return this.renderMainMenu(session, 'Session expired. Please choose an option from the menu:');
    }

    const result = await HospitalRepo.rescheduleAppointment(aptId, newDate, selectedSlot);
    if (!result.success || !result.appointment) {
      return {
        text: `⚠️ Could not reschedule: ${result.error || 'Slot unavailable'}. Please select another slot.`,
        session,
      };
    }

    session.state = 'MAIN_MENU';
    return {
      text:
        `🎉 *APPOINTMENT RESCHEDULED!*\n\n` +
        `• *Reference:* ${result.appointment.booking_reference}\n` +
        `• *Doctor:* ${result.appointment.doctor_name}\n` +
        `• *New Date:* ${result.appointment.appointment_date}\n` +
        `• *New Time:* ${result.appointment.start_time} - ${result.appointment.end_time}\n\n` +
        `We have updated your reservation at Hiramani Memorial Hospital. See you then!`,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  // ----------------------------------------------------------------------------
  // GENERAL QUERY HANDLING & FAQS
  // ----------------------------------------------------------------------------
  private static async handleQueryCategoryInput(session: ConversationSession, input: string): Promise<BotReply> {
    const categories: Array<PatientQuery['category']> = [
      'Doctor & Appointments',
      'Departments & Services',
      'Diagnostic Tests & Reports',
      'Admission & Surgery Enquiry',
      'Hospital Location & Contact',
      'Billing & Insurance',
      'Speak to Hospital Staff',
    ];

    let category: PatientQuery['category'] | undefined;
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= categories.length) {
      category = categories[num - 1];
    } else {
      category = categories.find(c => c.toLowerCase().includes(input.toLowerCase()));
    }

    if (!category) {
      return {
        text: 'Please select a valid category number between 1 and 7:',
        session,
      };
    }

    session.state_payload.query_category = category;
    session.state = 'QUERY_TEXT';

    return {
      text:
        `📝 *Describe your Query*\n\n` +
        `Category: *${category}*\n\n` +
        `Please type a short description of your question or issue.\n` +
        `_Note: Please do not include confidential clinical diagnostic files or prescriptions._`,
      session,
    };
  }

  private static async handleQueryTextInput(session: ConversationSession, input: string): Promise<BotReply> {
    if (input.trim().length < 3) {
      return {
        text: 'Please provide a brief description (at least 3 characters):',
        session,
      };
    }

    const category = session.state_payload.query_category || 'General Enquiry';
    const query = await HospitalRepo.createQuery({
      patient_name: session.state_payload.patient_name || 'WhatsApp Patient',
      patient_phone: session.phone.startsWith('+') ? session.phone : `+${session.phone}`,
      category,
      description: input.trim(),
      priority: 'medium',
    });

    session.state = 'MAIN_MENU';
    session.state_payload = {};

    return {
      text:
        `✅ *Query Submitted Successfully!*\n\n` +
        `• *Ticket Number:* *${query.ticket_number}*\n` +
        `• *Category:* ${query.category}\n` +
        `• *Status:* Open (Assigned to Hospital Staff)\n\n` +
        `Our hospital support staff has received your request and will follow up shortly.\n\n` +
        `Reply *MENU* to return to options.`,
      buttons: [{ id: 'menu', title: 'Main Menu' }],
      session,
    };
  }

  private static async handleFAQInput(session: ConversationSession, input: string): Promise<BotReply> {
    const matched = await HospitalRepo.searchFAQs(input);
    if (matched.length > 0) {
      return {
        text: `💡 *${matched[0].question}*\n\n${matched[0].answer}\n\nReply *MENU* to return or ask another question.`,
        buttons: [{ id: 'menu', title: 'Main Menu' }],
        session,
      };
    }
    return this.renderMainMenu(session);
  }

  // ----------------------------------------------------------------------------
  // HELPER METHODS
  // ----------------------------------------------------------------------------
  private static handleBack(session: ConversationSession): BotReply {
    session.state = 'MAIN_MENU';
    return this.renderMainMenu(session);
  }

  private static async getUpcomingDatesForDoctor(
    doctorId: string,
    count = 4
  ): Promise<Array<{ dateStr: string; label: string }>> {
    const dates: Array<{ dateStr: string; label: string }> = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 14 && dates.length < count; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const slots = await HospitalRepo.getAvailableSlots(doctorId, dateStr);
      if (slots.length > 0) {
        let label = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
        if (i === 0) label = `Today (${label})`;
        else if (i === 1) label = `Tomorrow (${label})`;
        dates.push({ dateStr, label });
      }
    }

    if (dates.length === 0) {
      return this.getUpcomingDates(count);
    }
    return dates;
  }

  private static getUpcomingDates(count = 4): Array<{ dateStr: string; label: string }> {
    const dates = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      let label = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
      if (i === 0) label = `Today (${label})`;
      if (i === 1) label = `Tomorrow (${label})`;
      dates.push({ dateStr, label });
    }
    return dates;
  }
}
