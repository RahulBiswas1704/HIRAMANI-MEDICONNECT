# MediConnect — Hospital WhatsApp Automation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Meta WhatsApp Cloud API](https://img.shields.io/badge/WhatsApp%20Cloud%20API-v21.0-25D366?logo=whatsapp)](https://developers.facebook.com/docs/whatsapp/cloud-api)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-FCC624?logo=vitest)](https://vitest.dev/)

An enterprise-ready, open-source Hospital WhatsApp Automation Platform engineered for clinics, nursing homes, and small-to-medium hospitals in India.

---

## 🏥 Overview

MediConnect enables hospitals to automate patient communication through the official **Meta WhatsApp Business Platform Cloud API**. Patients can book appointments, check doctor availability, review consultation fees, track queries, and speak to reception—while hospital staff manage all operations from a clean, secure admin dashboard.

---

## ✨ Key Features

- **24x7 WhatsApp Appointment Booking**: Guided multi-turn workflow with real slot generation.
- **Double-Booking Safeguards**: Concurrency-safe atomic reservations in database transactions.
- **Doctors & OPD Roster Management**: Configure specialist doctors, consultation tariffs, rooms, and weekly schedules.
- **Clinical Departments**: Manage outpatient departments and specialist assignments.
- **Patient Queries & Feedback Desk**: Ticketing system with category filtering, staff assignments, and internal case notes.
- **Approved FAQ Knowledgebase**: Curated hospital answers for visiting hours, billing, insurance TPAs, and lab tests.
- **Human Receptionist Handover**: Seamless transition to front-desk staff with automated bot pause.
- **Emergency Helpline Integration**: Immediate routing to 24x7 emergency and ambulance numbers.
- **Interactive WhatsApp Simulator Widget**: Full web-based sandbox for local testing without WhatsApp API keys.
- **Official Meta Cloud API Webhook**: `v21.0` endpoint with HMAC SHA-256 signature verification and message deduplication.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Curated Medical Palette) |
| **Icons** | Lucide React |
| **Database** | Supabase PostgreSQL + Row Level Security (RLS) |
| **Messaging** | Meta WhatsApp Business Platform Cloud API (v21.0) |
| **Testing** | Vitest Unit & Integration Suites |

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone <repository-url>
cd "HIRAMANI WP CHAT BOT"
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Visit the application in your browser:
- **Public Portal**: [http://localhost:3000](http://localhost:3000)
- **WhatsApp Patient Chatbot Simulator**: [http://localhost:3000/chat](http://localhost:3000/chat)
- **Hospital Admin Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Staff Sign In**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🧪 Running Tests

Execute the comprehensive test suite (booking engine, double booking prevention, bot state machine, webhook signatures, phone normalization):

```bash
npm test
```

---

## 📁 Repository Structure

```
├── docs/
│   ├── ARCHITECTURE.md    # System architecture, ER diagram, request flow
│   ├── SETUP.md           # Step-by-step setup guide for Supabase & WhatsApp
│   ├── WORKFLOWS.md       # Booking, query, and handover operational rules
│   ├── SECURITY.md        # Authentication, RLS, patient privacy & DPDP guidelines
│   └── DEPLOYMENT.md      # Vercel & VPS deployment instructions
├── src/
│   ├── app/               # Next.js App Router (pages & API routes)
│   │   ├── api/
│   │   │   ├── whatsapp/webhook/  # Meta Cloud API webhook handler
│   │   │   ├── appointments/      # Appointment CRUD & rescheduling
│   │   │   ├── doctors/           # Doctor profiles & slot calculation
│   │   │   ├── departments/       # Department management
│   │   │   ├── queries/           # Inbound patient queries & notes
│   │   │   ├── faqs/              # Knowledgebase management
│   │   │   └── chat/              # Interactive patient chat API
│   │   ├── dashboard/             # Admin portal (appointments, doctors, settings)
│   │   ├── chat/                  # Standalone patient WhatsApp simulator
│   │   ├── login/                 # Staff authentication
│   │   └── page.tsx               # Public landing page
│   ├── components/        # Reusable UI components & WhatsApp simulator
│   ├── lib/
│   │   ├── bot/engine.ts  # Multi-turn conversational state engine
│   │   ├── db/repo.ts     # Dual-mode repository layer (Supabase + Demo)
│   │   ├── supabase/      # Supabase client & admin helpers
│   │   └── whatsapp/      # Meta WhatsApp Cloud API client
│   └── types/             # TypeScript models & state interfaces
└── supabase/
    ├── migrations/        # 20261025000000_init_schema.sql (20 tables + RLS)
    └── seed.sql           # Realistic Indian hospital demonstration data
```

---

## 🔒 Security & Medical Advisory

- **Demonstration Notice**: Seed doctors, departments, and tariffs represent fictional demonstration data for evaluation.
- **Medical Disclaimer**: The automated chatbot does not provide medical diagnoses, clinical evaluations, or medication advice. Life-threatening emergencies are directed to verified hospital emergency hotlines.
- **Compliance**: For production hospital deployment in India, consult [docs/SECURITY.md](docs/SECURITY.md) for Digital Personal Data Protection (DPDP Act, 2023) guidance.

---

## 📄 License

MIT License. Designed with excellence for healthcare providers.
