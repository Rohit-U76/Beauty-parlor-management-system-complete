# 🚀 Smart Salon & Parlour Management System - Client Deployment & Database Guide

> **Confidential & Production Handover Documentation**  
> Complete guide for deploying the AI-Based Smart Salon & Parlour Management System with MySQL relational database, Google Sign-In authentication, and 10% advance deposit payment processing.

---

## 📋 Table of Contents
1. [Architecture & Database Overview](#1-architecture--database-overview)
2. [Database Migration: H2 to MySQL](#2-database-migration-h2-to-mysql)
3. [Environment Configuration & Confidential Details](#3-environment-configuration--confidential-details)
4. [New Feature: Sign in with Google (OAuth 2.0)](#4-new-feature-sign-in-with-google-oauth-20)
5. [Database Setup & Import Instructions](#5-database-setup--import-instructions)
6. [Running Locally & Verification](#6-running-locally--verification)
7. [Production Deployment Options](#7-production-deployment-options)
8. [API Health & System Monitoring](#8-api-health--system-monitoring)

---

## 1. Architecture & Database Overview

The system is architected for high reliability, resilience, and real-world scale:

```text
┌──────────────────────────────────────────────────────────────┐
│          Modern Responsive React 19 Frontend                 │
│   (Vite, TailwindCSS, Motion, Lucide, Recharts, Canvas Confetti)│
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON API
                               ▼
┌──────────────────────────────────────────────────────────────┐
│           Express + TypeScript REST Backend Server           │
│   - Google OAuth 2.0 & Custom Auth Engine                    │
│   - Razorpay 10% Advance Deposit Engine                      │
│   - NPCI UPI QR Generator                                    │
│   - WhatsApp Broadcast Suite with Deep Linking               │
│   - Google Gemini AI Stylist Assistant                       │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  MySQL 8.0+ Primary Database │ │ Optional Spring Boot 3 Java │
│  (Host: 3306, smart_salon_db)│ │ Backend (backend-java/ 8080)│
│  - Users & Customers CRM     │ └─────────────────────────────┘
│  - Appointments & Passports  │
│  - Reviews, Offers, Inquiries│
│  - Settings & Broadcast Logs │
└──────────────────────────────┘
```

---

## 2. Database Migration: H2 to MySQL

### What Changed:
- **Prior State**: The backend previously defaulted to an embedded in-memory H2 database (`jdbc:h2:mem:smartsalondb`) and local JSON persistence.
- **New State**:
  - The entire database was converted to **MySQL 8.0+** relational tables with strict utf8mb4 encoding, foreign keys, indexes, and timestamps.
  - **Spring Boot Backend (`backend-java`)**: Reconfigured `application.properties` to connect to MySQL (`com.mysql.cj.jdbc.Driver`, `org.hibernate.dialect.MySQLDialect`) by default.
  - **Node.js/Express Backend (`server.ts`)**: Integrated the `mysql2/promise` connection pool with auto-reconnect, database health monitoring, and graceful fallback.
  - **Data Transfer**: 100% of existing historical data (appointments, users, CRM customers, settings, notifications, reviews, offers, inquiries, and broadcast logs) has been migrated into MySQL `smart_salon_db`.

### MySQL Database Tables Overview:
| Table Name | Description | Record Count |
|:---|:---|:---:|
| `users` | Admin, staff, and registered clients with Google OAuth IDs | 8 |
| `appointments` | Bookings with 10% advance deposit and Razorpay references | 21 |
| `customers` | Dynamic CRM profiles with lifetime spend & VIP tiers | 9 |
| `salon_settings` | Salon address, UPI VPA, Razorpay credentials, working hours | 1 |
| `inquiries` | Bridal & customer consultation messages | 2 |
| `offers` | Promotional coupons (`GLOW20`, `FIRST10`, `BRIDAL500`) | 3 |
| `reviews` | Verified client feedback and satisfaction aspect ratings | 11 |
| `notifications` | System, SMS, and WhatsApp dispatch alerts | 47 |
| `broadcast_logs` | WhatsApp bulk promotional campaign dispatches | 22 |
| `services` | Complete service catalog with duration & pricing | 5+ |

---

## 3. Environment Configuration & Confidential Details

To ensure confidential details (passwords, secret keys, merchant tokens) remain secure and are **never exposed in Git**, create a `.env` file in the root directory (based on `.env.example`).

### `.env` Production Variables:
```env
# 1. Server Configuration
PORT=3000
NODE_ENV=production
APP_URL="https://your-domain.com"
CORS_ALLOWED_ORIGINS="https://your-domain.com"

# 2. MySQL Database Connection (Confidential)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_mysql_password
DB_NAME=smart_salon_db

# 3. Google OAuth 2.0 (Sign in with Google)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# 4. Razorpay Live Payment Gateway
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_live_key_secret"
VITE_RAZORPAY_KEY_ID="rzp_live_your_key_id"

# 5. Salon Direct UPI VPA
SALON_UPI_VPA="8104026257@okicici"

# 6. Google Gemini AI API Key
GEMINI_API_KEY="your_gemini_api_key"

# 7. Admin Quick PIN
ADMIN_PIN="9999"
```

> [!SECURITY NOTE]
> Ensure `.env` file permissions are restricted on the production server (`chmod 600 .env`). The `.gitignore` file already excludes `.env` to prevent accidental leakage.

---

## 4. New Feature: Sign in with Google (OAuth 2.0)

Clients can now sign in using their Google account in one click:
- **Endpoint**: `POST /api/auth/google`
- **Features**:
  - Automatically verifies Google credential token or profile payload.
  - Links to an existing account if the email is registered.
  - Automatically creates a new `CUSTOMER` account with **100 bonus loyalty reward points** on first sign-in.
  - Syncs the client's Google avatar image and full name into the CRM.
  - Available on both the customer login and registration screens.

---

## 5. Database Setup & Import Instructions

### Option A: Automated Node.js Migration (Recommended)
Run the automated migration script:
```bash
npm run db:migrate
```
This script connects to your MySQL server, initializes the database schema, and transfers all data with progress reporting.

### Option B: Import SQL Dump Directly
A complete standalone SQL dump is provided at `data/mysql-dump.sql` (and `schema.sql`):
```bash
# Using MySQL Command Line:
mysql -u root -p < data/mysql-dump.sql

# Or using phpMyAdmin / MySQL Workbench:
# 1. Open phpMyAdmin or MySQL Workbench
# 2. Go to 'Import' tab
# 3. Select 'data/mysql-dump.sql' and click 'Go' / 'Execute'
```

### Check Database Status:
To verify all table counts and connection health:
```bash
npm run db:status
```

---

## 6. Running Locally & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```
The server will start at: `http://localhost:3000`

### 3. Run Automated Tests
Execute the 24-test test suite:
```bash
npm test
```
Expected output:
```text
======================================================
  📊 TEST RESULTS SUMMARY
======================================================
Total Tests Run : 24
Passed          : 24
Failed          : 0
Success Rate    : 100.0%

✅ ALL TESTS PASSED SUCCESSFULLY! 🚀
```

### 4. Build Production Bundle
```bash
npm run check
```

---

## 7. Production Deployment Options

### Option 1: Node.js Production Server (PM2 / Systemd)
```bash
# Build the production bundle
npm run build

# Start with PM2 process manager
npm install -g pm2
pm2 start dist/server.cjs --name "smart-salon"
pm2 save
pm2 startup
```

### Option 2: Docker Deployment
A Dockerfile is available for running the containerized application on Google Cloud Run, AWS ECS, or DigitalOcean App Platform:
```bash
docker build -t smart-salon:latest .
docker run -p 3000:3000 --env-file .env smart-salon:latest
```

### Option 3: Java Spring Boot Backend (Enterprise Mode)
If deploying the Java backend (`backend-java`):
```bash
cd backend-java
mvn clean package -DskipTests
java -jar target/smart-salon-backend-1.0.0.jar
```
The Spring Boot backend will start at `http://localhost:8080` connected to MySQL `smart_salon_db`.

---

## 8. API Health & System Monitoring

The application provides dedicated health and database status endpoints for load balancers (e.g. AWS ALB, GCP Cloud Load Balancing):

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service uptime, API status, and live MySQL database connectivity |
| `GET` | `/api/db/status` | Real-time MySQL connection details and live table row counts |
| `POST` | `/api/auth/google` | Google OAuth authentication handler |
| `POST` | `/api/auth/login` | Email/Phone + password or Admin PIN verification |
| `POST` | `/api/payment/create-order` | Razorpay 10% advance deposit order creation |
| `POST` | `/api/payment/verify` | Razorpay payment signature verification & booking confirmation |

### Health Check Response (`GET /api/health`):
```json
{
  "status": "ok",
  "service": "Smart Salon Backend & Payment API",
  "database": {
    "connected": true,
    "type": "MySQL Relational Database (Production)",
    "host": "localhost:3306",
    "database": "smart_salon_db",
    "tableCounts": {
      "users": 8,
      "appointments": 21,
      "customers": 9,
      "salon_settings": 1,
      "inquiries": 2,
      "offers": 3,
      "reviews": 11,
      "notifications": 47,
      "broadcast_logs": 22
    }
  }
}
```

---

## 🔑 Default Credentials for Client Handover

| Role | Identifier / Mobile | Secret / PIN | Description |
|:---|:---|:---|:---|
| **Salon Owner (Admin)** | Quick PIN: `9999` *(or Phone: `8104026257`)* | Admin PIN: `9999` *(or `admin`)* | Full administrative access, appointment management, CRM, and broadcast logs |
| **VIP Client** | `9822012345` | `password123` | Priya Sharma (VIP Tier) |
| **Google Sign-In** | Any Google account | Authenticated via Google | Instant customer profile + 100 welcome bonus reward points |
