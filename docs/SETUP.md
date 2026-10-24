# MediConnect Setup & Configuration Guide

A beginner-friendly step-by-step setup guide for configuring MediConnect for local development and connecting to production services.

---

## 1. Quick Start (Zero-Setup Demo Sandbox Mode)

MediConnect is designed to run locally out-of-the-box **without requiring external API keys or cloud database accounts**.

### Step 1: Clone and Install Dependencies
```bash
git clone <repository-url>
cd "HIRAMANI WP CHAT BOT"
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Public Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Interactive WhatsApp Patient Chat**: [http://localhost:3000/chat](http://localhost:3000/chat)
- **Hospital Admin Portal**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Staff Login**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 2. Connecting Supabase (Production PostgreSQL + RLS)

When you are ready to connect a cloud PostgreSQL database:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
3. In your Supabase Dashboard, open **SQL Editor**, and execute the migration file:
   - Open and copy `supabase/migrations/20261025000000_init_schema.sql` → Run Query.
   - Open and copy `supabase/seed.sql` → Run Query.
4. Copy `.env.example` to `.env.local` and paste your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```
5. Restart `npm run dev`. MediConnect will automatically connect to your cloud PostgreSQL database with full Row Level Security!

---

## 3. Connecting Meta WhatsApp Business Cloud API

To connect a verified hospital WhatsApp Business number:

### Step 1: Create a Meta Developer Application
1. Go to [developers.facebook.com](https://developers.facebook.com/) and sign in with your Facebook account.
2. Click **My Apps → Create App**.
3. Choose **Other → Business** app type.
4. Name the application (e.g. `Hiramani Hospital WhatsApp`).

### Step 2: Set Up WhatsApp Product
1. Under Add Products to Your App, find **WhatsApp** and click **Set up**.
2. Select your Meta Business Manager account.
3. In the WhatsApp API Setup screen, copy:
   - **Temporary Access Token** (or generate a Permanent System User Token under Business Settings → System Users).
   - **Phone Number ID**.
   - **WhatsApp Business Account ID (WABA)**.

### Step 3: Configure Environment Variables
In `.env.local`:
```env
WHATSAPP_API_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=109284729102938
WHATSAPP_BUSINESS_ACCOUNT_ID=293847201928374
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_APP_SECRET=your_meta_app_secret
WHATSAPP_VERIFY_TOKEN=mediconnect_secure_webhook_verify_token_2026
```

### Step 4: Configure Meta Webhook
1. In Meta App Dashboard, navigate to **WhatsApp → Configuration**.
2. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://<your-public-domain>/api/whatsapp/webhook` (For local testing, use [ngrok](https://ngrok.com) or [localtunnel]: `ngrok http 3000`).
   - **Verify Token**: `mediconnect_secure_webhook_verify_token_2026`
3. Click **Verify and Save**.
4. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages`
   - `message_deliveries`

Now send a WhatsApp message to your test number from your smartphone! MediConnect will automatically respond with the interactive hospital menu.
