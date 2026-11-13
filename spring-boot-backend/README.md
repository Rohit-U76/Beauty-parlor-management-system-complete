# Modern Unisex Salon — Java Spring Boot Backend

Complete Java 17 + Spring Boot 3.4 backend converted from `server.ts` and `src/db/mysql.ts`.

## Features Included
- **4 Admin Emails + 1 Shared Admin Password** (`SalonSettings.adminEmails` + `SalonSettings.adminPassword`) with Quick PIN & Google OAuth support.
- **Resilient Persistence**: Uses MySQL (`JdbcTemplate`, optional via `salon.mysql.enabled`) with automatic fallback & synchronization to `../data/db.json` (or `SALON_DB_FILE`).
- **All REST Endpoints**:
  - Health & DB Status (`/api/health`, `/api/db/status`)
  - Auth & Profile (`/api/auth/register`, `/api/auth/login`, `/api/auth/admin-reset-password`, `/api/auth/google`, `/api/auth/users`, `/api/auth/users/{id}`)
  - Settings & Maintenance (`/api/settings`, `/api/admin/clear-past-data`)
  - Appointments (`/api/appointments/**`, `/api/appointments/upload-screenshot`)
  - Customers CRM (`/api/customers/**`)
  - Offers & WhatsApp Broadcast (`/api/offers/**`)
  - Inquiries (`/api/inquiries/**`)
  - Notifications & Dispatch (`/api/notifications/**`)
  - UPI QR, Payments, Razorpay Test & Bank SMS Webhook (`/api/qr/generate-upi`, `/api/payment/**`, `/api/webhooks/bank-sms/**`)
  - Gallery & Reviews (`/api/gallery/**`, `/api/reviews/**`)
  - Gemini AI Endpoints (`/api/ai/chat`, `/api/ai/recommend`, `/api/ai/insights`)

## Running Locally
1. Build the React frontend from the project root:
   ```bash
   npm run build
   ```
2. Run the Spring Boot backend (requires Java 17+ and Maven 3.9+):
   ```bash
   cd spring-boot-backend
   mvn spring-boot:run
   ```
   The server starts on `http://0.0.0.0:3000`.
