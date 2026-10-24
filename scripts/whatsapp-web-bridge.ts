import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WAMessage,
} from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { BotEngine } from '../src/lib/bot/engine';

const AUTH_DIR = path.resolve(process.cwd(), '.baileys_auth');
const STATUS_FILE = path.resolve(AUTH_DIR, 'status.json');
const REQUEST_FILE = path.resolve(AUTH_DIR, 'pairing_request.json');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

function updateStatus(statusData: Record<string, any>) {
  try {
    fs.writeFileSync(
      STATUS_FILE,
      JSON.stringify({ ...statusData, updatedAt: new Date().toISOString() }, null, 2)
    );
  } catch (err) {
    console.error('Failed to write status file:', err);
  }
}

// Parse optional --phone=<number> command line argument
const phoneArg = process.argv.find((arg) => arg.startsWith('--phone='));
let targetPhoneNumber = phoneArg ? phoneArg.replace('--phone=', '').replace(/\D/g, '') : '';

async function startWhatsAppWebBridge() {
  console.log('\n=============================================================');
  console.log('🏥 HIRAMANI MEMORIAL HOSPITAL — WHATSAPP WEB BRIDGE');
  console.log('Fetching official WhatsApp Web protocol version...');
  console.log('=============================================================\n');

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WhatsApp Web Protocol v${version.join('.')}, isLatest: ${isLatest}`);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // Check if a pairing phone was requested via file
  if (!targetPhoneNumber && fs.existsSync(REQUEST_FILE)) {
    try {
      const req = JSON.parse(fs.readFileSync(REQUEST_FILE, 'utf8'));
      if (req.phone) {
        targetPhoneNumber = req.phone.replace(/\D/g, '');
      }
    } catch (_) {}
  }

  const isPairingCodeMode = Boolean(targetPhoneNumber && !state.creds.registered);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    // Use official macOS Desktop client identity to prevent "Couldn't link device" errors
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  // If pairing code mode is requested and device not registered yet
  if (isPairingCodeMode) {
    setTimeout(async () => {
      try {
        console.log(`\n📲 Requesting 8-character Pairing Code for +${targetPhoneNumber}...`);
        const code = await sock.requestPairingCode(targetPhoneNumber);
        console.log('\n=============================================================');
        console.log(`🔑 WHATSAPP PAIRING CODE: ${code}`);
        console.log('=============================================================');
        console.log('1. Open WhatsApp on your phone');
        console.log('2. Tap Settings (or ⋮) -> Linked Devices -> Link a Device');
        console.log('3. Tap "Link with phone number instead" at the bottom');
        console.log(`4. Enter this 8-character code: ${code}`);
        console.log('=============================================================\n');

        updateStatus({
          status: 'pairing_code',
          pairingCode: code,
          targetPhone: targetPhoneNumber,
          message: `Enter code ${code} in WhatsApp on your phone`,
        });
      } catch (err) {
        console.error('Failed to request pairing code:', err);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !isPairingCodeMode) {
      console.log('\n-------------------------------------------------------------');
      console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP MOBILE APP:');
      console.log('1. Open WhatsApp on your phone');
      console.log('2. Tap Settings (or ⋮) -> Linked Devices -> Link a Device');
      console.log('3. Point your camera at this QR code:');
      console.log('-------------------------------------------------------------\n');

      qrcodeTerminal.generate(qr, { small: true });

      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        updateStatus({
          status: 'scan_qr',
          rawQr: qr,
          qrDataUrl,
          message: 'Please scan QR code using WhatsApp (Linked Devices)',
        });
        console.log('\n🌐 High-Res Web View: http://localhost:3000/dashboard/whatsapp-web');
      } catch (e) {
        console.error('Failed to generate QR data URL:', e);
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`⚠️ Connection closed (statusCode: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      updateStatus({
        status: 'disconnected',
        statusCode,
        message: shouldReconnect ? 'Reconnecting...' : 'Logged out. Scan QR again.',
      });

      if (shouldReconnect) {
        setTimeout(startWhatsAppWebBridge, 3000);
      } else {
        console.log('❌ Device logged out. Clearing credentials to generate fresh QR...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (_) {}
        setTimeout(startWhatsAppWebBridge, 2000);
      }
    } else if (connection === 'open') {
      const userPhone = (sock.user?.id || '').replace(/:.*@/, '@');
      console.log('\n=============================================================');
      console.log('✅ WHATSAPP LINKED & ACTIVE FOR HIRAMANI MEMORIAL HOSPITAL!');
      console.log(`📱 Connected Account: ${sock.user?.name || 'Hiramani Hospital'} (${userPhone})`);
      console.log('🏥 Ready to receive patient messages and book appointments!');
      console.log('=============================================================\n');

      // Clear any pending pairing request
      if (fs.existsSync(REQUEST_FILE)) {
        try { fs.unlinkSync(REQUEST_FILE); } catch (_) {}
      }

      updateStatus({
        status: 'connected',
        phone: userPhone,
        name: sock.user?.name || 'Hiramani Memorial Hospital',
        message: 'Active and listening for messages',
      });
    }
  });

  sock.ev.on('messages.upsert', async (upsert) => {
    if (upsert.type !== 'notify') return;

    for (const msg of upsert.messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid || '';

      if (remoteJid.endsWith('@g.us') || remoteJid.includes('broadcast')) {
        continue;
      }

      const incomingText =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.buttonsResponseMessage?.selectedButtonId ||
        msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        '';

      if (!incomingText.trim()) continue;

      const cleanPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/:\d+/, '');
      const patientName = msg.pushName || 'Patient';

      console.log(`\n📩 [WhatsApp Web] From: +${cleanPhone} (${patientName})`);
      console.log(`   Message: "${incomingText.trim()}"`);

      try {
        const reply = await BotEngine.processMessage(cleanPhone, incomingText);

        console.log(`📤 [WhatsApp Web] Replying to +${cleanPhone}...`);
        await sock.sendMessage(remoteJid, { text: reply.text });
        console.log(`✅ [WhatsApp Web] Response successfully sent!`);
      } catch (error) {
        console.error(`❌ [WhatsApp Web] Error processing message from +${cleanPhone}:`, error);
        await sock.sendMessage(remoteJid, {
          text: 'দুঃখিত, একটি সাময়িক প্রযুক্তিগত সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।\nSorry, a temporary error occurred. Please try again shortly.',
        });
      }
    }
  });
}

startWhatsAppWebBridge().catch((err) => {
  console.error('Fatal WhatsApp Web bridge error:', err);
});
