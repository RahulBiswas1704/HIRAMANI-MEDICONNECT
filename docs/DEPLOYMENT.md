# MediConnect Production Deployment Guide

Instructions for deploying MediConnect to modern cloud infrastructure.

---

## 1. Hosting Options

### Option A: Vercel (Recommended)
1. Push your repository to GitHub or GitLab.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Add all environment variables from `.env.example`:
   - `NEXT_PUBLIC_APP_URL` (set to your custom domain, e.g. `https://hospital.example.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WHATSAPP_API_VERSION=v21.0`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_APP_SECRET`
   - `WHATSAPP_VERIFY_TOKEN`
5. Click **Deploy**.

### Option B: Self-Hosted Docker / VPS (Ubuntu / Node.js)
1. Provision a VPS (DigitalOcean, AWS EC2, or Hetzner).
2. Install Node.js v20+ and reverse proxy (Nginx or Caddy with automated HTTPS Let's Encrypt).
3. Build the production bundle:
   ```bash
   npm run build
   ```
4. Start with PM2:
   ```bash
   pm2 start npm --name "mediconnect" -- start
   ```

---

## 2. Domain & HTTPS Requirements

Meta's WhatsApp Business Platform Cloud API **strictly requires a valid, publicly accessible HTTPS webhook endpoint**.
- Webhook URL: `https://<your-verified-domain>/api/whatsapp/webhook`
- SSL certificates must be issued by a recognized Certificate Authority (Let's Encrypt, Cloudflare, DigiCert). Self-signed certificates are rejected by Meta.

---

## 3. Database Migration Execution

Before serving production traffic:
1. Open Supabase Dashboard SQL Editor.
2. Run `supabase/migrations/20261025000000_init_schema.sql` to initialize all 20 tables, indexes, constraints, and RLS policies.
3. Replace seed hospital data with verified hospital details.

---

## 4. Production Launch Checklist

- [ ] All environment variables configured in production hosting.
- [ ] Database migrations executed on live Supabase PostgreSQL.
- [ ] Meta Webhook verified with challenge handshake.
- [ ] Subscribed to `messages` and `message_deliveries` webhook events.
- [ ] Completed test booking with live WhatsApp mobile phone.
- [ ] Verified that booking appears in Hospital Admin Appointments queue.
- [ ] Configured hospital emergency contact numbers and verified accuracy.
