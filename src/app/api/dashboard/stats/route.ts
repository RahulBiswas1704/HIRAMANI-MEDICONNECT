import { NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET() {
  try {
    const metrics = await HospitalRepo.getDashboardMetrics();
    return NextResponse.json({ success: true, data: metrics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
