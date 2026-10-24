# MediConnect Clinical & Administrative Workflows

This document outlines the operational rules and multi-turn workflows powering MediConnect.

---

## Workflow 1: Patient Appointment Booking

1. **Trigger**: Patient selects *1. Book Appointment* or messages intent (e.g. *"I want to book an appointment with a doctor"*).
2. **Department Selection**: Bot presents active hospital departments. Patient selects by number or title.
3. **Specialist Selection**: Bot filters doctors belonging to the selected department and presents their qualifications and tariffs. Patient selects a doctor or chooses *Any Available Doctor*.
4. **Date Selection**: Bot calculates upcoming OPD clinic dates and verifies that the selected doctor has an active schedule and is not on leave (`doctor_time_off`).
5. **Real Slot Generation**: Bot queries the database repository to retrieve slots where `status != 'cancelled'`. Already booked slots are stripped from the menu.
6. **Patient Data Collection**: Collects patient name and WhatsApp phone number.
7. **Summary & Confirmation**: Presents a structured summary with patient name, doctor, department, date, slot, and consultation fee.
8. **Atomic Reservation**: Slot is locked atomically. If a concurrent patient booked the same slot milliseconds prior, the collision is detected and the patient is prompted to choose another slot.
9. **Reference Generation**: Generates booking code `APT-YYYYMMDD-XXXX`.
10. **Dashboard Synchronisation**: The booking immediately appears in `/dashboard/appointments`.

---

## Workflow 2: Patient Query & Feedback Ticketing

1. **Trigger**: Patient selects *8. Submit a Query* or types enquiry.
2. **Categorisation**: Patient selects category:
   - Appointments
   - Billing & Insurance
   - Laboratory & Reports
   - Medical Records
   - General Enquiry
   - Complaints & Grievances
3. **Description**: Patient provides a short message describing their request.
4. **Ticket Creation**: System creates a query record with unique ticket code `TKT-YYYYMMDD-XXXX`.
5. **Staff Notification**: Ticket is placed in the reception queue `/dashboard/queries`.
6. **Internal Collaboration**: Hospital staff can assign the ticket, add internal case notes, and mark the status (*In Progress*, *Waiting for Patient*, *Resolved*).

---

## Workflow 3: Reception Human Handover

1. **Trigger**: Patient types *"speak to human"*, *"connect me to reception"*, or option *10*.
2. **Handover Flag**: Bot sets `is_human_handover: true` on the conversation session.
3. **Queue Insertion**: System logs an urgent support query alerting the front desk team.
4. **Automated Response Paused**: Automated menu responses are paused to prevent confusing the conversation.
5. **Direct Emergency Line Provided**: The patient is given the hospital reception phone number `+91 33 2456 7890`.
6. **Resumption**: Patient can type *"BOT"* or *"MENU"* at any time to return to automated self-service.

---

## Workflow 4: Cancellation and Rescheduling

1. **Trigger**: Patient chooses *9. Cancel or Reschedule* or messages booking reference.
2. **Verification**: Bot looks up the reference in the database.
3. **Policy Verification**: Confirms that cancellation is within the hospital's allowable cancellation window (up to 2 hours prior to scheduled slot).
4. **Execution**:
   - For cancellation: updates appointment status to `cancelled` and records reason in audit log. Slot is immediately freed for other patients.
   - For rescheduling: prompts patient for new date and available slot, then updates the reservation atomically.
