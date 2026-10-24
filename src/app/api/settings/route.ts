import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET() {
  try {
    const hospital = await HospitalRepo.getHospital();
    const settings = await HospitalRepo.getSettings();
    return NextResponse.json({ success: true, data: { hospital, settings } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let updatedHospital;
    let updatedSettings;

    if (body.hospital) {
      updatedHospital = await HospitalRepo.updateHospital(body.hospital);
    }

    if (body.settings) {
      updatedSettings = await HospitalRepo.updateSettings(body.settings);
    } else {
      const { hospital: _, ...settingsUpdates } = body;
      if (Object.keys(settingsUpdates).length > 0) {
        updatedSettings = await HospitalRepo.updateSettings(settingsUpdates);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hospital: updatedHospital || (await HospitalRepo.getHospital()),
        settings: updatedSettings || (await HospitalRepo.getSettings()),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
