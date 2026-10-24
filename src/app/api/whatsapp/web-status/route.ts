import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve(process.cwd(), '.baileys_auth');
const STATUS_FILE = path.resolve(AUTH_DIR, 'status.json');
const REQUEST_FILE = path.resolve(AUTH_DIR, 'pairing_request.json');

export async function GET() {
  if (!fs.existsSync(STATUS_FILE)) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'not_started',
        message: 'WhatsApp Web service has not been started yet. Run: npm run whatsapp:web',
      },
    });
  }

  try {
    const raw = fs.readFileSync(STATUS_FILE, 'utf8');
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = (body?.phone || '').replace(/\D/g, '');

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10+ digit phone number with country code (e.g. 919876543210)' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    fs.writeFileSync(
      REQUEST_FILE,
      JSON.stringify({ phone, requestedAt: new Date().toISOString() }, null, 2)
    );

    return NextResponse.json({
      success: true,
      data: {
        message: `Pairing request saved for +${phone}. Restarting bridge to issue 8-character code.`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit pairing request' },
      { status: 500 }
    );
  }
}
