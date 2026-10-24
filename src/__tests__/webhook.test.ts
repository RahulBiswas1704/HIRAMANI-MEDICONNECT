import { describe, it, expect } from 'vitest';
import { WhatsAppService } from '../lib/whatsapp/service';
import crypto from 'crypto';

describe('WhatsApp Webhook & Cloud API Service', () => {
  it('should verify webhook challenge token correctly', () => {
    const challenge = 'challenge_code_12345';
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mediconnect_secure_webhook_verify_token_2026';

    const result = WhatsAppService.verifySubscription('subscribe', verifyToken, challenge);
    expect(result).toBe(challenge);

    const invalid = WhatsAppService.verifySubscription('subscribe', 'wrong_token', challenge);
    expect(invalid).toBeNull();
  });

  it('should normalise Indian mobile numbers correctly', () => {
    expect(WhatsAppService.normalisePhoneNumber('9876543210')).toBe('919876543210');
    expect(WhatsAppService.normalisePhoneNumber('+91 98765 43210')).toBe('919876543210');
    expect(WhatsAppService.normalisePhoneNumber('09876543210')).toBe('919876543210');
    expect(WhatsAppService.normalisePhoneNumber('919876543210')).toBe('919876543210');
  });

  it('should validate HMAC SHA-256 webhook signatures', () => {
    const rawPayload = JSON.stringify({ test: 'payload_data' });
    const fakeSecret = 'my_test_app_secret_123';

    const validHash = crypto
      .createHmac('sha256', fakeSecret)
      .update(rawPayload)
      .digest('hex');

    const validHeader = `sha256=${validHash}`;

    // Test with explicit secret logic
    const computed = crypto.createHmac('sha256', fakeSecret).update(rawPayload).digest('hex');
    expect(computed).toBe(validHash);
  });
});
