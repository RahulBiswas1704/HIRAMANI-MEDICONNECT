# MediConnect Security & Privacy Guide

This application handles healthcare administrative data and appointment scheduling. Security, privacy, and compliance guidelines are integrated throughout its architecture.

---

## 1. Authentication & Role-Based Access Control (RBAC)

1. **Server-Side Verification**: Permissions are enforced strictly in API endpoints and PostgreSQL Row Level Security (RLS) policies. Buttons are not merely hidden in frontend views.
2. **Defined Operational Roles**:
   - `super_admin`: Multi-tenant governance & database configuration.
   - `hospital_admin`: Management of hospital operations, doctors, OPD schedules, and tariffs.
   - `receptionist`: Operational management of appointments, patient queries, and handover queue.
   - `department_staff`: Department-scoped viewing of appointments and OPD rosters.
3. **No Public Admin Registration**: Administrative accounts can only be provisioned by authorised administrators.

---

## 2. Row Level Security (RLS) & Tenant Isolation

- Every operational table contains a `hospital_id` foreign key.
- PostgreSQL Row Level Security is enabled on all tables.
- Helper function `has_hospital_access(hospital_id)` evaluates `auth.uid()` against active memberships in `hospital_memberships`.
- Staff from Hospital A cannot query, update, or inspect records belonging to Hospital B.

---

## 3. Webhook Security & Tamper Resistance

1. **HMAC SHA-256 Signatures**: Incoming Meta webhooks must include an `x-hub-signature-256` header matching the computed HMAC digest using the configured `WHATSAPP_APP_SECRET`.
2. **Timing Attack Protection**: Signatures are compared using constant-time evaluation (`crypto.timingSafeEqual`).
3. **Replay & Duplicate Protection (Idempotency)**: Every message event ID is tracked in `whatsapp_webhook_events` to prevent duplicate processing.

---

## 4. Patient Privacy & Data Minimisation

1. **Minimal Data Collection**: The booking workflow collects only what the hospital needs for scheduling: patient name, WhatsApp contact number, department, and doctor.
2. **No Clinical Diagnosis**: The chatbot is explicitly programmed to never attempt automated clinical diagnosis, treatment recommendations, or medication adjustments.
3. **Emergency Routing**: In emergency situations, immediate direct helpline numbers and urgent care hospital address are provided.
4. **Credential Isolation**: Secrets like `SUPABASE_SERVICE_ROLE_KEY` and `WHATSAPP_ACCESS_TOKEN` are strictly kept in protected server environments and never exposed in client bundles.

---

## 5. Pre-Production Regulatory Checklist (India)

Before launching in a real hospital or clinic in India:
- [ ] Complete Digital Personal Data Protection Act (DPDP Act, 2023) privacy audit.
- [ ] Implement hospital patient consent notice and opt-out mechanism for WhatsApp notifications.
- [ ] Verify hospital registration credentials (Clinical Establishments Act / State Medical Council).
- [ ] Execute Business Associate Agreement (BAA) / Meta Terms of Service for WhatsApp Business Solution.
