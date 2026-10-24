import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department_id = searchParams.get('department_id') || undefined;
    const all = searchParams.get('all') === 'true';

    const doctors = await HospitalRepo.getDoctors(department_id, !all);
    return NextResponse.json({ success: true, data: doctors });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newDoc = await HospitalRepo.createDoctor({
      department_id: body.department_id,
      full_name: body.full_name,
      qualification: body.qualification,
      speciality: body.speciality,
      experience_years: Number(body.experience_years) || 0,
      bio: body.bio || '',
      consultation_fee: Number(body.consultation_fee) || 500,
      follow_up_fee: Number(body.follow_up_fee) || 300,
      room_number: body.room_number || 'OPD-101',
      is_active: body.is_active !== false,
    });
    return NextResponse.json({ success: true, data: newDoc });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 });
    }

    const updated = await HospitalRepo.updateDoctor(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
