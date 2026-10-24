import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

/**
 * GET: Retrieve notification logs
 */
export async function GET() {
  try {
    const logs = await HospitalRepo.getNotificationLogs(50);
    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Execute appointment reminders automation workflow
 */
export async function POST() {
  try {
    const summary = await HospitalRepo.sendAppointmentReminders();
    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
