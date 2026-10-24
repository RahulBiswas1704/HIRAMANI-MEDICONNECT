import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'doctor_id parameter is required' },
        { status: 400 }
      );
    }

    const timeOff = await HospitalRepo.getDoctorTimeOff(doctorId);
    return NextResponse.json({ success: true, data: timeOff });
  } catch (error) {
    console.error('Error in GET /api/doctors/timeoff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctor time-off schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctor_id, start_date, end_date, reason } = body;

    if (!doctor_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'doctor_id, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    if (start_date > end_date) {
      return NextResponse.json(
        { success: false, error: 'start_date cannot be after end_date' },
        { status: 400 }
      );
    }

    const record = await HospitalRepo.addDoctorTimeOff({
      doctor_id,
      start_date,
      end_date,
      reason,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error in POST /api/doctors/timeoff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record doctor leave' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const deleted = await HospitalRepo.deleteDoctorTimeOff(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Time-off record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Time-off record removed' });
  } catch (error) {
    console.error('Error in DELETE /api/doctors/timeoff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete time-off record' },
      { status: 500 }
    );
  }
}
