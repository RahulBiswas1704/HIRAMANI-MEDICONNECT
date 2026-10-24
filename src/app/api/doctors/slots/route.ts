import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get('doctor_id');
    const date = searchParams.get('date');

    if (!doctor_id || !date) {
      return NextResponse.json({ success: false, error: 'doctor_id and date are required' }, { status: 400 });
    }

    const slots = await HospitalRepo.getAvailableSlots(doctor_id, date);
    return NextResponse.json({ success: true, data: slots });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
