import { describe, it, expect, beforeEach } from 'vitest';
import { HospitalRepo } from '../lib/db/repo';

describe('Hospital Booking & Slot Availability Engine', () => {
  const doctorId = '20000000-0000-0000-0000-000000000001'; // Dr. Sourav Mukherjee
  const testDate = '2026-10-26'; // A Monday

  it('should retrieve active departments and doctors', async () => {
    const depts = await HospitalRepo.getDepartments();
    expect(depts.length).toBeGreaterThan(0);
    expect(depts[0]).toHaveProperty('name');

    const doctors = await HospitalRepo.getDoctors();
    expect(doctors.length).toBeGreaterThan(0);
    expect(doctors.find(d => d.id === doctorId)).toBeDefined();
  });

  it('should generate available slots based on doctor schedule', async () => {
    const slots = await HospitalRepo.getAvailableSlots(doctorId, testDate);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toBe('09:00');
  });

  it('should book an appointment atomically and return a unique reference', async () => {
    const result = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Test Patient Subrata',
      patient_phone: '+919830000001',
      appointment_date: testDate,
      start_time: '09:00',
      booking_channel: 'whatsapp',
    });

    expect(result.success).toBe(true);
    expect(result.appointment).toBeDefined();
    expect(result.appointment?.booking_reference).toMatch(/^APT-\d{8}-\d{4}$/);
    expect(result.appointment?.status).toBe('confirmed');
    expect(result.appointment?.start_time).toBe('09:00');
    expect(result.appointment?.end_time).toBe('09:20');
  });

  it('should prevent double-booking for the exact same doctor, date, and slot', async () => {
    // Attempting to book the same slot (09:00 on testDate) that was just booked
    const duplicateAttempt = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Second Patient Conflict',
      patient_phone: '+919830000002',
      appointment_date: testDate,
      start_time: '09:00',
    });

    expect(duplicateAttempt.success).toBe(false);
    expect(duplicateAttempt.error).toContain('already been reserved');

    // Slot 09:00 should no longer appear in available slots list
    const updatedSlots = await HospitalRepo.getAvailableSlots(doctorId, testDate);
    expect(updatedSlots.includes('09:00')).toBe(false);
  });

  it('should reschedule an appointment to another free slot', async () => {
    const initialBooking = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Reschedule Patient',
      patient_phone: '+919830000003',
      appointment_date: testDate,
      start_time: '09:20',
    });

    expect(initialBooking.success).toBe(true);
    const aptId = initialBooking.appointment!.id;

    // Reschedule to 09:40
    const rescheduleResult = await HospitalRepo.rescheduleAppointment(aptId, testDate, '09:40');
    expect(rescheduleResult.success).toBe(true);
    expect(rescheduleResult.appointment?.start_time).toBe('09:40');

    // Previous slot 09:20 should now be freed
    const slots = await HospitalRepo.getAvailableSlots(doctorId, testDate);
    expect(slots.includes('09:20')).toBe(true);
  });

  it('should cancel an appointment and free the reserved slot', async () => {
    const booking = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Cancel Patient',
      patient_phone: '+919830000004',
      appointment_date: testDate,
      start_time: '10:00',
    });

    expect(booking.success).toBe(true);
    const aptId = booking.appointment!.id;

    const cancelled = await HospitalRepo.updateAppointmentStatus(aptId, 'cancelled', 'Patient requested cancellation');
    expect(cancelled?.status).toBe('cancelled');

    // Verify slot 10:00 is now free again
    const slots = await HospitalRepo.getAvailableSlots(doctorId, testDate);
    expect(slots.includes('10:00')).toBe(true);
  });

  it('should reject booking attempts for past dates', async () => {
    const pastResult = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Past Patient',
      patient_phone: '+919830000005',
      appointment_date: '2020-01-15',
      start_time: '10:00',
    });

    expect(pastResult.success).toBe(false);
    expect(pastResult.error).toContain('past dates');

    const pastSlots = await HospitalRepo.getAvailableSlots(doctorId, '2020-01-15');
    expect(pastSlots).toEqual([]);
  });

  it('should reject booking attempts beyond maximum advance booking window (14 days)', async () => {
    const futureResult = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Far Future Patient',
      patient_phone: '+919830000006',
      appointment_date: '2027-01-01',
      start_time: '10:00',
    });

    expect(futureResult.success).toBe(false);
    expect(futureResult.error).toContain('advance');

    const futureSlots = await HospitalRepo.getAvailableSlots(doctorId, '2027-01-01');
    expect(futureSlots).toEqual([]);
  });

  it('should reject booking when doctor is on scheduled leave/time-off', async () => {
    // Add leave for Dr. Sourav Mukherjee on 2026-10-28 (Wednesday)
    const leaveDate = '2026-10-28';
    await HospitalRepo.addDoctorTimeOff({
      doctor_id: doctorId,
      start_date: leaveDate,
      end_date: leaveDate,
      reason: 'Specialist Medical Symposium',
    });

    // Slots should be empty on leave date
    const slots = await HospitalRepo.getAvailableSlots(doctorId, leaveDate);
    expect(slots).toEqual([]);

    // Direct booking attempt should be rejected
    const leaveBooking = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Leave Date Patient',
      patient_phone: '+919830000007',
      appointment_date: leaveDate,
      start_time: '09:00',
    });

    expect(leaveBooking.success).toBe(false);
    expect(leaveBooking.error).toContain('scheduled leave');
  });

  it('should reject booking when requested slot is outside doctor OPD hours', async () => {
    const outOfHoursResult = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Night Patient',
      patient_phone: '+919830000008',
      appointment_date: testDate,
      start_time: '03:00', // Middle of night
    });

    expect(outOfHoursResult.success).toBe(false);
    expect(outOfHoursResult.error).toContain('outside doctor OPD hours');
  });

  it('should reject booking when patient phone number is invalid', async () => {
    const badPhoneResult = await HospitalRepo.bookAppointment({
      doctor_id: doctorId,
      patient_name: 'Valid Name',
      patient_phone: '123', // Incomplete number
      appointment_date: testDate,
      start_time: '10:20',
    });

    expect(badPhoneResult.success).toBe(false);
    expect(badPhoneResult.error).toContain('valid 10-digit mobile number');
  });
});

