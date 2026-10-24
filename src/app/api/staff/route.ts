import { NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET() {
  try {
    const staff = await HospitalRepo.getStaff();
    const auditLogs = await HospitalRepo.getAuditLogs(30);
    return NextResponse.json({ success: true, data: { staff, auditLogs } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
