import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const doctor_id = searchParams.get('doctor_id') || undefined;
    const department_id = searchParams.get('department_id') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const date = searchParams.get('date') || undefined;

    const appointments = await HospitalRepo.getAppointments({
      search,
      doctor_id,
      department_id,
      status,
      date,
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await HospitalRepo.bookAppointment({
      doctor_id: body.doctor_id,
      department_id: body.department_id,
      patient_name: body.patient_name,
      patient_phone: body.patient_phone,
      appointment_date: body.appointment_date,
      start_time: body.start_time,
      booking_channel: body.booking_channel || 'web_dashboard',
      administrative_note: body.administrative_note,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.appointment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, status, reason, new_date, new_slot } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Appointment ID required' }, { status: 400 });
    }

    if (action === 'reschedule') {
      const res = await HospitalRepo.rescheduleAppointment(id, new_date, new_slot);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: res.appointment });
    }

    if (status) {
      const updated = await HospitalRepo.updateAppointmentStatus(id, status, reason);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
