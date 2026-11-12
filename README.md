# 💇‍♀️ Modern Unisex Salon & Management System

> Complete beauty parlour and salon management web application with online booking, client CRM, advance payments, WhatsApp marketing broadcasts, QR check-in passes, and admin suite.

---

## 🚀 Quick Start (Zero Extra Setup)

To run the application locally on any machine:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```

The application will start automatically at:
👉 **`http://localhost:3000`**

*(Note: If port 3000 is occupied by another application, the server will automatically fall back to `http://localhost:3001` without crashing!)*

### 3. Database Migration & Status (MySQL)
To run or re-sync the full database migration to MySQL:
```bash
npm run db:migrate
```
To inspect live MySQL table records and connection health:
```bash
npm run db:status
```

### 4. Verify Health & Tests
To run the automated 24-test validation suite:
```bash
npm test
```
To run TypeScript type checks and production bundle validation:
```bash
npm run check
```

---

## 🔑 Login & Access Credentials

| Role | Identifier / Phone | PIN / Password | Description |
| :--- | :--- | :--- | :--- |
| **Salon Owner (Admin)** | Quick PIN: `9999` *(or Phone: `8104026257`)* | Admin PIN: `9999` *(or `admin`)* | Full admin control, appointments, CRM, billing, & broadcasts |
| **Registered Client** | `9822012345` | `password123` | Priya Sharma (VIP Member) |
| **Sign in with Google** | Any Google Account | One-click OAuth | Instant profile creation + 100 bonus loyalty points |
| **New Client Registration** | Any 10-digit mobile number | Any chosen password | Instant account creation + 100 bonus loyalty points |

---

## 📖 Production Deployment Guide

For complete production server setup, MySQL database export/import, and client handover instructions, refer to **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.

---

## ✨ Features Overview

### 1. 📢 Dynamic WhatsApp Offer Broadcast Suite
- Admin can compose promotional offers with discount codes, minimum booking thresholds, and validity dates.
- Aggregates unique client phone numbers across all past appointments and registered customer profiles.
- Generates **Native WhatsApp** (`api.whatsapp.com`) and **WhatsApp Web** (`web.whatsapp.com`) deep links pre-filled with formatted promotional copy and direct booking links with discount codes attached.
- Tracks broadcast dispatch logs in the database.

### 2. 👥 Dynamic Client CRM & Loyalty Engine
- Live analytics tracking: total visits, lifetime spend, favorite services, and membership tier (`New Client`, `Standard`, `Silver VIP`, `VIP Member`).
- Automatically updates client stats upon each completed booking or status update.
- Search, filter, and edit client profiles directly in the Admin Suite.

### 3. 🎫 QR Appointment Pass & Salon Check-In
- Generates a branded digital Appointment Pass with QR code for every confirmed booking.
- Enables quick check-in at the salon counter.
- One-click print / save pass as PDF.

### 4. ⏰ Smart Appointment Reminders & Rescheduling
- Persistent reminder notification banner for clients with upcoming appointments.
- Full rescheduling workflow with real-time slot conflict checks against already booked time slots.

### 5. 🎁 Service Bundle Builder
- Interactive multi-service package builder allowing clients to customize packages and get bundled discounts.

### 6. 💳 Direct Bank UPI & Automated Bank SMS Verification (0% Gateway Fee)
- 100% direct deposit into Salon's HDFC Bank current account (`50200072074441`) and PhonePe Merchant (`ghodakedinesh@ybl`), eliminating 2% third-party gateway deductions.
- Dynamic NPCI UPI QR code generation with exact advance deposit amount pre-locked.
- Automated Bank SMS webhook engine (`/api/webhooks/bank-sms`) with 12-digit UTR regex parsing and instant auto-matching.
- Live Webhook Testing Simulator in Admin Suite for presentations, college viva, and demo without real bank transfers.
- 15-minute chair hold protection against telecom latency, plus 1-click admin manual approval/rejection.

### 7. ⏱️ 3-Hour Slot Batches & Real-Time Chair Capacity (9 AM - 10 PM)
- Salon operates between 9:00 AM and 10:00 PM with 3-hour booking batches:
  - `09:00 AM - 12:00 PM` (Morning Batch)
  - `12:00 PM - 03:00 PM` (Afternoon Batch)
  - `03:00 PM - 06:00 PM` (Late Afternoon Batch)
  - `06:00 PM - 10:00 PM` (Evening & Night Batch - 4 hrs)
- Strictly limited to a maximum of 3 clients per slot with dynamic real-time chair availability calculation.
- Past slots on the current day are automatically marked as unavailable.
- Owner Break / Blackout manager allows salon owner to block dates with reason banners.

### 8. 🛡️ System Robustness & Database Engine
- Native MySQL 8.0+ relational persistence layer with automated migration tools (`npm run db:migrate`).
- Resilient fallback to local JSON database (`data/db.json`) during offline development.
- Cross-platform LF line-ending normalization via `.gitattributes`.
- Vite file-watcher exclusions for database writes preventing reload flickers.
- Google OAuth 2.0 and Owner PIN terminal authentication.

---

## 📁 Project Structure

```text
├── src/
│   ├── components/            # UI components (Modals, Passes, Reminders, Bundles, Broadcasts)
│   ├── context/               # SalonContext state management & Google Auth
│   ├── db/                    # MySQL connection pooling & relational queries (mysql.ts)
│   ├── utils/                 # Time-slot, availability, & reminder calculations
│   └── views/                 # Customer and Admin views
├── server.ts                  # Express backend with MySQL integration & REST APIs
├── schema.sql                 # Complete MySQL schema & all migrated records
├── data/
│   ├── db.json                # Local JSON snapshot
│   └── mysql-dump.sql         # Production MySQL SQL dump for one-click import
├── backend-java/              # Spring Boot backend with MySQL configuration
├── scripts/                   # Automated test scripts & database migration tools
└── DEPLOYMENT_GUIDE.md        # Comprehensive production deployment & client handover guide
```

---

## 🤝 Contribution & Merging

Refer to [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for branch management and rebase guidelines.
