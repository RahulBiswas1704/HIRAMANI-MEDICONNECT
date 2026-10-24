# Hiramani Memorial Hospital — WhatsApp Automation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Meta WhatsApp Cloud API](https://img.shields.io/badge/WhatsApp%20Cloud%20API-v21.0-25D366?logo=whatsapp)](https://developers.facebook.com/docs/whatsapp/cloud-api)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Cloud%20Postgres-00E599?logo=postgresql)](https://neon.tech/)
[![Netlify](https://img.shields.io/badge/Netlify-Live%20Production-00C7B7?logo=netlify)](https://hiramani-mediconnect.netlify.app)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-FCC624?logo=vitest)](https://vitest.dev/)

An enterprise-ready, open-source bilingual (Bengali & English) Hospital WhatsApp Automation Platform engineered specifically for **Hiramani Memorial Hospital** and small-to-medium hospitals in India.

---

## 🌐 Live Production Deployment

| Service | Live URL / Details |
|---|---|
| **Public Hospital Web Portal** | [https://hiramani-mediconnect.netlify.app](https://hiramani-mediconnect.netlify.app) |
| **Hospital Admin Dashboard** | [https://hiramani-mediconnect.netlify.app/dashboard](https://hiramani-mediconnect.netlify.app/dashboard) |
| **Interactive WhatsApp Simulator** | [https://hiramani-mediconnect.netlify.app/chat](https://hiramani-mediconnect.netlify.app/chat) |
| **Meta Webhook Endpoint** | `https://hiramani-mediconnect.netlify.app/api/whatsapp/webhook` |
| **Cloud PostgreSQL Database** | Hosted on **Neon AWS us-east-2** (`hiramani_hospital`) |
| **Webhook Verify Token** | `mediconnect_secure_webhook_verify_token_2026` |

---

## 🏥 About Hiramani Memorial Hospital

- **Address**: 124/A Eastern Metropolitan Bypass, Mukundapur, Near Metro Station, Kolkata, West Bengal 700099
- **General Reception & OPD**: `+91 33 2456 7890`
- **24x7 Emergency & Ambulance**: `+91 98765 00108`
- **OPD Timings**: Monday to Saturday: 08:30 AM – 08:00 PM | Sunday: 09:00 AM – 01:00 PM
- **Emergency Department**: Open 24 Hours, 365 Days

---

## ✨ WhatsApp Patient Experience

### 1. Bilingual Welcome Message
When a patient messages `Hi`, `Hello`, `নমস্কার`, or sends any initial greeting, the bot responds with the official bilingual greeting:

```text
নমস্কার! হীরামণি মেমোরিয়াল হসপিটালে আপনাকে স্বাগত। 🏥
Welcome to Hiramani Memorial Hospital WhatsApp Service.

আমি আপনাকে কীভাবে সাহায্য করতে পারি? / How can I help you today?

1. 📅 ডাক্তার দেখানো / Book Doctor Appointment
2. 👨‍⚕️ ডাক্তারদের তালিকা ও সময় / Doctors List & Timings
3. 🕒 ওপিডি ও ভিজিটিং সময় / OPD & Visiting Hours
4. ❓ সাধারণ প্রশ্ন ও অনুসন্ধান / General Enquiry & FAQs
5. 💬 অভিযোগ বা মতামত / Feedback or Complaint
6. 🚨 জরুরি সহায়তা / Emergency Helpline
7. 👤 প্রতিনিধির সাথে কথা / Speak to Receptionist

অনুগ্রহ করে ১ থেকে ৭ নম্বরের মধ্যে একটি বেছে নিন।
Please reply with a number from 1 to 7.
```

### 2. Streamlined 7-Option Menu Routing
1. **Option 1 (Book Appointment)**: Filter by department or select directly from our 7 specialist doctors. Choose from real upcoming dates and open 15-minute time slots. Receive an instant booking reference (e.g. `HMH-20261025-XXXX`) and WhatsApp confirmation card.
2. **Option 2 (Doctors List & Timings)**: View detailed doctor qualifications (MBBS, MD, MS, DM), consultation tariffs, room numbers, and OPD weekly schedule.
3. **Option 3 (OPD & Visiting Hours)**: View OPD schedule, inpatient visiting hours, and 24/7 reception availability.
4. **Option 4 (General Enquiry & FAQs)**: Approved knowledgebase for diagnostic services, admission procedures, cash/insurance billing, and health check packages.
5. **Option 5 (Feedback or Complaint)**: Log a patient query directly to hospital management with automated ticket tracking (`HMH-Q-XXXXXX`).
6. **Option 6 (Emergency Helpline)**: Immediate, unhindered emergency hotline display (`+91 98765 00108`) with 24x7 ambulance routing.
7. **Option 7 (Speak to Receptionist)**: Seamless handover to front-desk staff with automated bot pause.

---

## 📱 How to Connect Your Actual WhatsApp Business Number

Everything on the cloud infrastructure side (**Neon PostgreSQL Database** + **Netlify HTTPS Hosting** + **Webhook Verification Endpoint**) has already been automated and deployed!

Because Meta requires SMS OTP verification on physical SIM cards to protect phone numbers against unauthorized takeover, follow these 3 simple steps to connect your actual WhatsApp number:

### Step 1: Open Meta for Developers
1. Visit [Meta for Developers](https://developers.facebook.com/) and log in with your Facebook account.
2. Click **My Apps** > **Create App**. Select **Other** > **Business**.
3. Under **Add products to your app**, locate **WhatsApp** and click **Set up**.

### Step 2: Configure the Live Webhook
1. In the left sidebar, click **WhatsApp** > **Configuration**.
2. Under **Webhook**, click **Edit** and enter:
   - **Callback URL**: `https://hiramani-mediconnect.netlify.app/api/whatsapp/webhook`
   - **Verify Token**: `mediconnect_secure_webhook_verify_token_2026`
3. Click **Verify and save**. Meta will ping the live Netlify endpoint and verify immediately with a green checkmark!
4. Under **Webhook fields**, click **Manage** and subscribe to **`messages`**.

### Step 3: Add Your Phone Number
1. In the left sidebar, go to **WhatsApp** > **API Setup**.
2. Scroll to **Step 5: Add a phone number**.
3. Enter your hospital's WhatsApp phone number.
4. Meta will send a **6-digit SMS OTP code** to your phone. Enter the code in Meta's portal to verify ownership.
5. Copy your **Phone Number ID** and **Permanent Access Token**.
6. In your Netlify dashboard (or `.env.local`), set:
   ```env
   WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"
   WHATSAPP_ACCESS_TOKEN="your_system_user_token_here"
   ```

*You're all set! Any patient texting your verified WhatsApp number will now receive the official Hiramani Memorial Hospital bilingual chatbot.*

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS (Curated Medical Palette) |
| **Cloud Hosting** | Netlify Serverless Functions (AWS us-east-2) |
| **Database** | Neon Cloud PostgreSQL (Serverless connection pooling) |
| **WhatsApp Engine** | Meta WhatsApp Business Platform Cloud API (`v21.0`) |
| **Testing** | Vitest (35/35 passing unit & integration tests) |

---

## 🧪 Local Testing & Simulator

You can test the entire platform locally without entering WhatsApp credentials:

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Visit:
- **WhatsApp Web Simulator**: [http://localhost:3000/chat](http://localhost:3000/chat)
- **Admin Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Staff Sign In**: [http://localhost:3000/login](http://localhost:3000/login)

Run the automated test suite:
```bash
npm test
```

---

## 🔒 Security & Medical Advisory

- **Medical Disclaimer**: The automated chatbot provides scheduling, department routing, and hospital information only. It does not provide medical diagnoses or prescriptions. Emergencies are immediately directed to the hospital emergency helpline.
- **Data Protection**: Patient records are encrypted and protected under healthcare privacy best practices and India's Digital Personal Data Protection (DPDP) Act, 2023.

---

## 📄 License

MIT License. Engineered for Hiramani Memorial Hospital.
