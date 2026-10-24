import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const category = (searchParams.get('category') as any) || undefined;

    const queries = await HospitalRepo.getQueries({ search, status, category });
    return NextResponse.json({ success: true, data: queries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = await HospitalRepo.createQuery({
      patient_name: body.patient_name,
      patient_phone: body.patient_phone,
      category: body.category,
      description: body.description,
      subject: body.subject,
      priority: body.priority,
    });
    return NextResponse.json({ success: true, data: query });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Query ID required' }, { status: 400 });
    }

    const updated = await HospitalRepo.updateQuery(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Query not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
