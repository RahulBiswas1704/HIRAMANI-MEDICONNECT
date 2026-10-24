import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const departments = await HospitalRepo.getDepartments(!all);
    return NextResponse.json({ success: true, data: departments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newDept = await HospitalRepo.createDepartment({
      name: body.name,
      code: body.code.toUpperCase(),
      description: body.description || '',
      contact_phone: body.contact_phone || '',
      contact_email: body.contact_email || '',
      icon_name: body.icon_name || 'Activity',
      is_active: body.is_active !== false,
    });
    return NextResponse.json({ success: true, data: newDept });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID required' }, { status: 400 });
    }

    const updated = await HospitalRepo.updateDepartment(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
