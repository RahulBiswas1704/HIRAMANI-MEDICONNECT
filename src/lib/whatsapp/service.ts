// ==============================================================================
// MEDICONNECT: OFFICIAL META WHATSAPP CLOUD API INTEGRATION SERVICE
// Graph API v21.0 - Interactive lists, quick reply buttons, text messages,
// HMAC SHA-256 webhook signature verification, and safe development fallback.
// ==============================================================================

import crypto from 'crypto';

export interface WhatsAppButtonOption {
  id: string;
  title: string;
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  mode: 'live' | 'demo';
  error?: string;
}

export class WhatsAppService {
  private static apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  private static phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  private static accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  private static appSecret = process.env.WHATSAPP_APP_SECRET || '';
  private static verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mediconnect_secure_webhook_verify_token_2026';

  /**
   * Checks if live Meta WhatsApp credentials are configured.
   */
  public static isConfigured(): boolean {
    return Boolean(
      this.phoneNumberId &&
      this.accessToken &&
      this.accessToken.length > 20 &&
      !this.accessToken.includes('your-access-token')
    );
  }

  /**
   * Verifies the Webhook Subscription challenge from Meta App Dashboard.
   */
  public static verifySubscription(mode: string | null, token: string | null, challenge: string | null): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Verifies the x-hub-signature-256 header against the request body using SHA-256 HMAC.
   */
  public static verifyWebhookSignature(rawBody: string, signatureHeader?: string | null): boolean {
    if (!this.appSecret) {
      // In development mode when app secret is not configured, pass verification
      return true;
    }

    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    try {
      const signature = signatureHeader.substring(7);
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');

      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Normalises an Indian or international phone number into standard WhatsApp format (e.g. 919876543210).
   */
  public static normalisePhoneNumber(phone: string): string {
    let digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.substring(1);
    }
    if (digitsOnly.length === 10) {
      // Standard Indian 10-digit mobile number
      return `91${digitsOnly}`;
    }
    return digitsOnly;
  }

  /**
   * Send a standard plain text message.
   */
  public static async sendTextMessage(to: string, body: string): Promise<SendMessageResult> {
    const normalisedTo = this.normalisePhoneNumber(to);

    if (!this.isConfigured()) {
      console.log(`[WHATSAPP DEMO MODE] Send to ${normalisedTo}:\n${body}`);
      return {
        success: true,
        messageId: `wamid.DEMO_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        mode: 'demo',
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalisedTo,
          type: 'text',
          text: {
            preview_url: false,
            body,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WHATSAPP API ERROR]', data);
        return {
          success: false,
          mode: 'live',
          error: data.error?.message || 'Meta Cloud API call failed',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        mode: 'live',
      };
    } catch (err: any) {
      console.error('[WHATSAPP NETWORK ERROR]', err);
      return {
        success: false,
        mode: 'live',
        error: err.message || 'Network error connecting to Meta API',
      };
    }
  }

  /**
   * Send interactive Quick Reply buttons (up to 3 buttons).
   */
  public static async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButtonOption[],
    headerText?: string,
    footerText = 'Hiramani Memorial Hospital'
  ): Promise<SendMessageResult> {
    const normalisedTo = this.normalisePhoneNumber(to);

    if (!this.isConfigured()) {
      console.log(`[WHATSAPP DEMO MODE] Interactive Buttons to ${normalisedTo}:\n${bodyText}\nButtons:`, buttons);
      return {
        success: true,
        messageId: `wamid.DEMO_BTN_${Date.now()}`,
        mode: 'demo',
      };
    }

    try {
      const formattedButtons = buttons.slice(0, 3).map((btn, index) => ({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title.slice(0, 20), // WhatsApp enforces max 20 characters
        },
      }));

      const interactivePayload: any = {
        type: 'button',
        body: { text: bodyText },
        footer: { text: footerText },
        action: { buttons: formattedButtons },
      };

      if (headerText) {
        interactivePayload.header = { type: 'text', text: headerText.slice(0, 60) };
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalisedTo,
          type: 'interactive',
          interactive: interactivePayload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WHATSAPP API BUTTONS ERROR]', data);
        // Fallback to text message if interactive buttons fail
        const fallbackText = `${bodyText}\n\n` + buttons.map(b => `• ${b.title}`).join('\n');
        return this.sendTextMessage(normalisedTo, fallbackText);
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        mode: 'live',
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'live',
        error: err.message,
      };
    }
  }

  /**
   * Send an interactive List Menu (up to 10 choices).
   */
  public static async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonTitle: string,
    sections: WhatsAppListSection[],
    headerText?: string,
    footerText = 'Hiramani Memorial Hospital'
  ): Promise<SendMessageResult> {
    const normalisedTo = this.normalisePhoneNumber(to);

    if (!this.isConfigured()) {
      console.log(`[WHATSAPP DEMO MODE] Interactive List to ${normalisedTo}:\n${bodyText}`);
      return {
        success: true,
        messageId: `wamid.DEMO_LIST_${Date.now()}`,
        mode: 'demo',
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalisedTo,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: headerText ? { type: 'text', text: headerText.slice(0, 60) } : undefined,
          body: { text: bodyText },
          footer: { text: footerText },
          action: {
            button: buttonTitle.slice(0, 20),
            sections,
          },
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WHATSAPP API LIST ERROR]', data);
        // Fallback to text message
        let fallback = `${bodyText}\n`;
        sections.forEach(s => {
          fallback += `\n*${s.title}*\n`;
          s.rows.forEach(r => {
            fallback += `• ${r.title} (${r.description || ''})\n`;
          });
        });
        return this.sendTextMessage(normalisedTo, fallback);
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        mode: 'live',
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'live',
        error: err.message,
      };
    }
  }
}
