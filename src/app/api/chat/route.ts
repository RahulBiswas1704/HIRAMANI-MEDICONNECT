import { NextRequest, NextResponse } from 'next/server';
import { BotEngine } from '@/lib/bot/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body.phone || '919876543210';
    const message = body.message || 'menu';
    const reset = Boolean(body.reset);

    if (reset) {
      BotEngine.resetSession(phone);
    }

    const reply = await BotEngine.processMessage(phone, message);

    return NextResponse.json({
      success: true,
      reply: {
        text: reply.text,
        buttons: reply.buttons || [],
        list: reply.list || null,
      },
      session: {
        state: reply.session.state,
        is_human_handover: reply.session.is_human_handover,
      },
    });
  } catch (err: any) {
    console.error('[CHAT API ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
