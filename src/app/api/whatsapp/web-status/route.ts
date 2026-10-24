import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const statusPath = path.resolve(process.cwd(), '.baileys_auth', 'status.json');

  if (!fs.existsSync(statusPath)) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'not_started',
        message: 'WhatsApp Web service has not been started yet. Run: npm run whatsapp:web',
      },
    });
  }

  try {
    const raw = fs.readFileSync(statusPath, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to read WhatsApp Web status' },
      { status: 500 }
    );
  }
}
