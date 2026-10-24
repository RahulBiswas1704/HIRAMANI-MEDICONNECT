import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notes = await HospitalRepo.getQueryNotes(params.id);
    return NextResponse.json({ success: true, data: notes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const note = await HospitalRepo.addQueryNote(
      params.id,
      body.author_name || 'Staff Member',
      body.note
    );
    return NextResponse.json({ success: true, data: note });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
