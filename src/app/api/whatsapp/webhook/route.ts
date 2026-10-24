import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { BotEngine } from '@/lib/bot/engine';
import { HospitalRepo } from '@/lib/db/repo';

/**
 * GET: Webhook verification challenge from Meta App Dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifiedChallenge = WhatsAppService.verifySubscription(mode, token, challenge);

  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed. Token mismatch.' }, { status: 403 });
}

/**
 * POST: Incoming WhatsApp messages and status events from Meta Cloud API
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 1. Signature Verification
    const isValidSignature = WhatsAppService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn('[WEBHOOK SECURITY] Invalid x-hub-signature-256 rejected');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // 2. Validate Meta payload structure
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // 3. Process Delivery Status Updates (sent, delivered, read, failed)
    if (value.statuses && value.statuses.length > 0) {
      const statusObj = value.statuses[0];
      const messageId = statusObj.id;
      const status = statusObj.status; // 'delivered' | 'read' | 'failed'
      // Log delivery status
      console.log(`[WHATSAPP STATUS UPDATE] Message ${messageId} -> ${status}`);
      return NextResponse.json({ status: 'received_status' }, { status: 200 });
    }

    // 4. Process Incoming User Messages
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const messageId = message.id;

      // Idempotency: Prevent duplicate processing of the same message event
      if (HospitalRepo.isEventProcessed(messageId)) {
        console.log(`[WHATSAPP DEDUP] Message ${messageId} already processed. Skipping.`);
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      const senderPhone = message.from; // e.g. "919876543210"
      let userText = '';

      // Extract text content from text or interactive replies
      if (message.type === 'text') {
        userText = message.text?.body || '';
      } else if (message.type === 'interactive') {
        if (message.interactive?.button_reply) {
          userText = message.interactive.button_reply.id || message.interactive.button_reply.title;
        } else if (message.interactive?.list_reply) {
          userText = message.interactive.list_reply.id || message.interactive.list_reply.title;
        }
      }

      if (userText) {
        // Run conversational state engine
        const reply = await BotEngine.processMessage(senderPhone, userText);

        // Send response back to user via WhatsApp Cloud API
        if (reply.buttons && reply.buttons.length > 0) {
          await WhatsAppService.sendInteractiveButtons(senderPhone, reply.text, reply.buttons);
        } else if (reply.list) {
          await WhatsAppService.sendInteractiveList(
            senderPhone,
            reply.text,
            reply.list.buttonTitle,
            reply.list.sections
          );
        } else {
          await WhatsAppService.sendTextMessage(senderPhone, reply.text);
        }

        // Mark event processed for idempotency
        HospitalRepo.markEventProcessed(messageId);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]', err);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
