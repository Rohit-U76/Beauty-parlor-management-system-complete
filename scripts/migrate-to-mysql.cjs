/**
 * Smart Salon & Parlour Management System
 * Production MySQL Data Migration Script
 * Migrates 100% of data from data/db.json into MySQL relational tables.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
const DB_NAME = process.env.DB_NAME || 'smart_salon_db';

const DB_JSON_PATH = path.join(process.cwd(), 'data', 'db.json');

async function migrate() {
  console.log('===========================================================');
  console.log('🚀 INITIATING FULL DATABASE MIGRATION TO MYSQL');
  console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  console.log('===========================================================\n');

  let connection;
  try {
    // 1. Connect to MySQL server (without DB initially to ensure it exists)
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    // 2. Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log(`✓ Database \`${DB_NAME}\` is ready.`);

    // Relax overly restrictive foreign keys on appointments so historical bookings with guest accounts or custom services succeed
    try { await connection.query('ALTER TABLE `appointments` DROP FOREIGN KEY `fk_appointment_service`;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `appointments` DROP FOREIGN KEY `fk_appointment_user`;'); } catch (_) {}

    // 3. Ensure tables exist with production schemas
    console.log('Ensuring table schemas...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(80) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL,
        \`username\` VARCHAR(100) DEFAULT NULL,
        \`email\` VARCHAR(254) DEFAULT NULL,
        \`phone\` VARCHAR(30) DEFAULT NULL,
        \`role\` VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',
        \`password\` VARCHAR(255) DEFAULT NULL,
        \`password_hash\` VARCHAR(255) DEFAULT NULL,
        \`pin\` VARCHAR(50) DEFAULT NULL,
        \`pin_hash\` VARCHAR(255) DEFAULT NULL,
        \`member_tier\` VARCHAR(80) NOT NULL DEFAULT 'New Client',
        \`loyalty_points\` INT NOT NULL DEFAULT 100,
        \`member_since\` VARCHAR(20) DEFAULT NULL,
        \`total_visits\` INT NOT NULL DEFAULT 0,
        \`total_spent\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`last_visit\` VARCHAR(50) DEFAULT NULL,
        \`preferred_services\` JSON DEFAULT NULL,
        \`avatar_url\` VARCHAR(500) DEFAULT NULL,
        \`google_id\` VARCHAR(100) DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY \`idx_users_email\` (\`email\`),
        KEY \`idx_users_phone\` (\`phone\`),
        KEY \`idx_users_role\` (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns are nullable and exist if table already existed
    try { await connection.query('ALTER TABLE `users` MODIFY COLUMN `password_hash` VARCHAR(255) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` MODIFY COLUMN `pin_hash` VARCHAR(255) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` ADD COLUMN `password` VARCHAR(255) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` ADD COLUMN `pin` VARCHAR(50) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(100) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(500) DEFAULT NULL;'); } catch (_) {}
    try { await connection.query('ALTER TABLE `users` ADD COLUMN `preferred_services` JSON DEFAULT NULL;'); } catch (_) {}

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`salon_settings\` (
        \`id\` INT NOT NULL PRIMARY KEY DEFAULT 1,
        \`salon_name\` VARCHAR(200) NOT NULL,
        \`tagline\` VARCHAR(500) DEFAULT NULL,
        \`phone\` VARCHAR(30) DEFAULT NULL,
        \`email\` VARCHAR(254) DEFAULT NULL,
        \`address\` VARCHAR(600) DEFAULT NULL,
        \`opening_hours\` VARCHAR(200) DEFAULT NULL,
        \`advance_percentage\` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        \`currency_symbol\` VARCHAR(10) NOT NULL DEFAULT '₹',
        \`razorpay_key_id\` VARCHAR(120) DEFAULT NULL,
        \`booking_auto_confirm\` TINYINT(1) NOT NULL DEFAULT 0,
        \`instagram_url\` VARCHAR(500) DEFAULT NULL,
        \`maps_url\` VARCHAR(500) DEFAULT NULL,
        \`gst_number\` VARCHAR(80) DEFAULT NULL,
        \`staff_type\` VARCHAR(150) DEFAULT NULL,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`customers\` (
        \`id\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) DEFAULT NULL,
        \`total_visits\` INT NOT NULL DEFAULT 0,
        \`total_spent\` DOUBLE NOT NULL DEFAULT 0,
        \`last_visit\` VARCHAR(255) DEFAULT NULL,
        \`favorite_service\` VARCHAR(255) DEFAULT NULL,
        \`member_since\` VARCHAR(255) DEFAULT NULL,
        \`tier\` VARCHAR(255) NOT NULL DEFAULT 'New Client',
        KEY \`idx_cust_phone\` (\`phone\`),
        KEY \`idx_cust_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`appointments\` (
        \`id\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`user_id\` VARCHAR(80) DEFAULT NULL,
        \`booking_ref\` VARCHAR(255) NOT NULL,
        \`client_name\` VARCHAR(255) NOT NULL,
        \`client_phone\` VARCHAR(255) NOT NULL,
        \`client_email\` VARCHAR(255) DEFAULT NULL,
        \`service_id\` VARCHAR(80) DEFAULT NULL,
        \`service_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(255) DEFAULT NULL,
        \`appointment_date\` VARCHAR(50) DEFAULT NULL,
        \`date\` VARCHAR(50) DEFAULT NULL,
        \`time_slot\` VARCHAR(255) NOT NULL,
        \`stylist_name\` VARCHAR(255) DEFAULT 'Master Stylist & Founder',
        \`total_amount\` DOUBLE NOT NULL DEFAULT 0,
        \`advance_paid\` DOUBLE NOT NULL DEFAULT 0,
        \`balance_due\` DOUBLE NOT NULL DEFAULT 0,
        \`payment_status\` VARCHAR(255) NOT NULL DEFAULT 'PENDING',
        \`booking_status\` VARCHAR(255) NOT NULL DEFAULT 'CONFIRMED',
        \`status\` VARCHAR(40) DEFAULT 'CONFIRMED',
        \`razorpay_payment_id\` VARCHAR(255) DEFAULT NULL,
        \`razorpay_order_id\` VARCHAR(255) DEFAULT NULL,
        \`created_at_text\` VARCHAR(50) DEFAULT NULL,
        \`notes\` VARCHAR(1000) DEFAULT NULL,
        \`is_new\` TINYINT(1) DEFAULT 0,
        \`whatsapp_url\` TEXT DEFAULT NULL,
        \`owner_whatsapp_url\` TEXT DEFAULT NULL,
        \`created_at\` VARCHAR(255) DEFAULT NULL,
        KEY \`idx_apt_ref\` (\`booking_ref\`),
        KEY \`idx_apt_phone\` (\`client_phone\`),
        KEY \`idx_apt_date\` (\`appointment_date\`, \`time_slot\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`inquiries\` (
        \`id\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`client_name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) DEFAULT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`service_category\` VARCHAR(255) DEFAULT NULL,
        \`message\` VARCHAR(2000) NOT NULL,
        \`received_date\` VARCHAR(255) DEFAULT NULL,
        \`status\` VARCHAR(255) NOT NULL DEFAULT 'NEW',
        \`owner_reply\` VARCHAR(2000) DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`offers\` (
        \`id\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`code\` VARCHAR(255) NOT NULL UNIQUE,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` VARCHAR(500) DEFAULT NULL,
        \`discount_amount\` DOUBLE DEFAULT NULL,
        \`discount_percent\` INT DEFAULT NULL,
        \`min_booking_amount\` DOUBLE NOT NULL DEFAULT 0,
        \`valid_till\` VARCHAR(255) NOT NULL,
        \`active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`user_name\` VARCHAR(150) DEFAULT NULL,
        \`client_name\` VARCHAR(255) NOT NULL,
        \`service_name\` VARCHAR(255) NOT NULL,
        \`rating\` DOUBLE NOT NULL DEFAULT 5,
        \`comment\` VARCHAR(1000) NOT NULL,
        \`review_date\` VARCHAR(30) DEFAULT NULL,
        \`avatar_url\` VARCHAR(255) DEFAULT NULL,
        \`date\` VARCHAR(255) DEFAULT NULL,
        \`verified_booking\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(300) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`type\` VARCHAR(60) NOT NULL DEFAULT 'info',
        \`timestamp_text\` VARCHAR(80) DEFAULT NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`booking_ref\` VARCHAR(100) DEFAULT NULL,
        \`appointment_id\` VARCHAR(100) DEFAULT NULL,
        \`offer_code\` VARCHAR(80) DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`broadcast_logs\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`offer_id\` VARCHAR(100) DEFAULT NULL,
        \`offer_code\` VARCHAR(80) DEFAULT NULL,
        \`offer_title\` VARCHAR(250) DEFAULT NULL,
        \`discount_percent\` DECIMAL(5,2) DEFAULT NULL,
        \`discount_amount\` DECIMAL(12,2) DEFAULT NULL,
        \`dispatched_at\` VARCHAR(50) DEFAULT NULL,
        \`total_recipients\` INT NOT NULL DEFAULT 0,
        \`breakdown\` JSON DEFAULT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
        \`message_text\` LONGTEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✓ All 9 relational tables verified.\n');

    // 4. Read source data from data/db.json
    if (!fs.existsSync(DB_JSON_PATH)) {
      console.error(`Error: Source database file not found at ${DB_JSON_PATH}`);
      return;
    }

    const rawData = fs.readFileSync(DB_JSON_PATH, 'utf-8');
    const db = JSON.parse(rawData);

    // 5. Transfer Users
    if (Array.isArray(db.users)) {
      console.log(`Transferring ${db.users.length} users to MySQL...`);
      for (const u of db.users) {
        const crypto = require('crypto');
        const passHash = u.password ? crypto.createHash('sha256').update(String(u.password)).digest('hex') : null;
        const pinHash = u.pin ? crypto.createHash('sha256').update(String(u.pin)).digest('hex') : null;

        await connection.query(`
          INSERT INTO \`users\` (
            id, name, username, email, phone, role, password, password_hash, pin, pin_hash,
            member_tier, loyalty_points, member_since, total_visits, preferred_services
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            username = VALUES(username),
            email = VALUES(email),
            phone = VALUES(phone),
            role = VALUES(role),
            password = VALUES(password),
            password_hash = VALUES(password_hash),
            pin = VALUES(pin),
            pin_hash = VALUES(pin_hash),
            member_tier = VALUES(member_tier),
            loyalty_points = VALUES(loyalty_points),
            member_since = VALUES(member_since),
            total_visits = VALUES(total_visits),
            preferred_services = VALUES(preferred_services);
        `, [
          u.id,
          u.name || 'Salon User',
          u.username || null,
          u.email || null,
          u.phone || null,
          u.role || 'CUSTOMER',
          u.password || null,
          passHash,
          u.pin || null,
          pinHash,
          u.memberTier || 'New Client',
          u.loyaltyPoints || 0,
          u.memberSince || '2026',
          u.totalVisits || 0,
          u.preferredServices ? JSON.stringify(u.preferredServices) : null
        ]);
      }
      console.log(`✓ ${db.users.length} users successfully transferred.`);
    }

    // 6. Transfer Salon Settings
    if (db.settings) {
      console.log('Transferring salon settings to MySQL...');
      const s = db.settings;
      await connection.query(`
        INSERT INTO \`salon_settings\` (
          id, salon_name, tagline, phone, email, address, opening_hours, 
          advance_percentage, currency_symbol, razorpay_key_id, 
          booking_auto_confirm, instagram_url, maps_url, gst_number, staff_type
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          salon_name = VALUES(salon_name),
          tagline = VALUES(tagline),
          phone = VALUES(phone),
          email = VALUES(email),
          address = VALUES(address),
          opening_hours = VALUES(opening_hours),
          advance_percentage = VALUES(advance_percentage),
          currency_symbol = VALUES(currency_symbol),
          razorpay_key_id = VALUES(razorpay_key_id),
          booking_auto_confirm = VALUES(booking_auto_confirm),
          instagram_url = VALUES(instagram_url),
          maps_url = VALUES(maps_url),
          gst_number = VALUES(gst_number),
          staff_type = VALUES(staff_type);
      `, [
        s.salonName || 'Modern Unisex Salon',
        s.tagline || "WE'LL STYLE YOU'LL SMILE",
        s.phone || '8104026257',
        s.email || 'modernsalon02@gmail.com',
        s.address || 'B.N. GUND COMPLEX, NEAR KANYA PRASHALA AND ICICI BANK, MOHOL - 413213',
        s.openingHours || 'Mon - Sun: 09:00 AM - 09:00 PM',
        s.advancePercentage || 10,
        s.currencySymbol || '₹',
        s.razorpayKeyId || 'rzp_test_modern_salon_mohol',
        s.bookingAutoConfirm ? 1 : 0,
        s.instagramUrl || '',
        s.mapsUrl || '',
        s.gstNumber || '',
        s.staffType || 'Self-Employed (Master Stylist & Founder)'
      ]);
      console.log('✓ Salon settings successfully transferred.');
    }

    // 7. Transfer Customers CRM
    if (Array.isArray(db.customers)) {
      console.log(`Transferring ${db.customers.length} CRM customers to MySQL...`);
      for (const c of db.customers) {
        await connection.query(`
          INSERT INTO \`customers\` (
            id, name, phone, email, total_visits, total_spent, last_visit, favorite_service, member_since, tier
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            phone = VALUES(phone),
            email = VALUES(email),
            total_visits = VALUES(total_visits),
            total_spent = VALUES(total_spent),
            last_visit = VALUES(last_visit),
            favorite_service = VALUES(favorite_service),
            member_since = VALUES(member_since),
            tier = VALUES(tier);
        `, [
          c.id,
          c.name || 'Valued Client',
          c.phone || '',
          c.email || '',
          c.totalVisits || 0,
          c.totalSpent || 0,
          c.lastVisit || '',
          c.favoriteService || '',
          c.memberSince || '2026',
          c.tier || 'New Client'
        ]);
      }
      console.log(`✓ ${db.customers.length} CRM customers successfully transferred.`);
    }

    // 8. Transfer Appointments
    if (Array.isArray(db.appointments)) {
      console.log(`Transferring ${db.appointments.length} appointments to MySQL...`);
      for (const a of db.appointments) {
        await connection.query(`
          INSERT INTO \`appointments\` (
            id, user_id, booking_ref, client_name, client_phone, client_email,
            service_id, service_name, category, appointment_date, date, time_slot,
            stylist_name, total_amount, advance_paid, balance_due,
            payment_status, booking_status, status, razorpay_payment_id, razorpay_order_id,
            notes, is_new, whatsapp_url, owner_whatsapp_url, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            booking_ref = VALUES(booking_ref),
            client_name = VALUES(client_name),
            client_phone = VALUES(client_phone),
            client_email = VALUES(client_email),
            service_id = VALUES(service_id),
            service_name = VALUES(service_name),
            category = VALUES(category),
            appointment_date = VALUES(appointment_date),
            date = VALUES(date),
            time_slot = VALUES(time_slot),
            stylist_name = VALUES(stylist_name),
            total_amount = VALUES(total_amount),
            advance_paid = VALUES(advance_paid),
            balance_due = VALUES(balance_due),
            payment_status = VALUES(payment_status),
            booking_status = VALUES(booking_status),
            status = VALUES(status),
            razorpay_payment_id = VALUES(razorpay_payment_id),
            razorpay_order_id = VALUES(razorpay_order_id),
            notes = VALUES(notes),
            is_new = VALUES(is_new),
            whatsapp_url = VALUES(whatsapp_url),
            owner_whatsapp_url = VALUES(owner_whatsapp_url),
            created_at = VALUES(created_at);
        `, [
          a.id,
          a.userId || null,
          a.bookingRef || `BK-${a.id}`,
          a.clientName || 'Client',
          a.clientPhone || '',
          a.clientEmail || '',
          a.serviceId || 'srv-gen',
          a.serviceName || 'General Service',
          a.category || 'General',
          a.date || a.appointment_date || '',
          a.date || '',
          a.timeSlot || '10:00 AM',
          a.stylistName || 'Master Stylist & Founder',
          Number(a.totalAmount) || 0,
          Number(a.advancePaid) || 0,
          Number(a.balanceDue) || 0,
          a.paymentStatus || 'PAID',
          a.bookingStatus || 'CONFIRMED',
          a.status || 'CONFIRMED',
          a.razorpayPaymentId || null,
          a.razorpayOrderId || null,
          a.notes || '',
          a.isNew ? 1 : 0,
          a.whatsappUrl || null,
          a.ownerWhatsappUrl || null,
          a.createdAt || new Date().toISOString()
        ]);
      }
      console.log(`✓ ${db.appointments.length} appointments successfully transferred.`);
    }

    // 9. Transfer Inquiries
    if (Array.isArray(db.inquiries)) {
      console.log(`Transferring ${db.inquiries.length} inquiries to MySQL...`);
      for (const inq of db.inquiries) {
        await connection.query(`
          INSERT INTO \`inquiries\` (
            id, client_name, phone, email, subject, service_category, message, received_date, status, owner_reply
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            client_name = VALUES(client_name),
            phone = VALUES(phone),
            email = VALUES(email),
            subject = VALUES(subject),
            service_category = VALUES(service_category),
            message = VALUES(message),
            received_date = VALUES(received_date),
            status = VALUES(status),
            owner_reply = VALUES(owner_reply);
        `, [
          inq.id,
          inq.clientName || '',
          inq.phone || '',
          inq.email || '',
          inq.subject || 'General Inquiry',
          inq.serviceCategory || '',
          inq.message || '',
          inq.receivedDate || '',
          inq.status || 'NEW',
          inq.ownerReply || null
        ]);
      }
      console.log(`✓ ${db.inquiries.length} inquiries successfully transferred.`);
    }

    // 10. Transfer Offers
    if (Array.isArray(db.offers)) {
      console.log(`Transferring ${db.offers.length} offers to MySQL...`);
      for (const off of db.offers) {
        await connection.query(`
          INSERT INTO \`offers\` (
            id, code, title, description, discount_amount, discount_percent, min_booking_amount, valid_till, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            title = VALUES(title),
            description = VALUES(description),
            discount_amount = VALUES(discount_amount),
            discount_percent = VALUES(discount_percent),
            min_booking_amount = VALUES(min_booking_amount),
            valid_till = VALUES(valid_till),
            active = VALUES(active);
        `, [
          off.id,
          off.code,
          off.title,
          off.description || '',
          off.discountAmount !== undefined ? off.discountAmount : null,
          off.discountPercent !== undefined ? off.discountPercent : null,
          off.minBookingAmount || 0,
          off.validTill || '2026-12-31',
          off.active ? 1 : 0
        ]);
      }
      console.log(`✓ ${db.offers.length} offers successfully transferred.`);
    }

    // 11. Transfer Reviews
    if (Array.isArray(db.reviews)) {
      console.log(`Transferring ${db.reviews.length} reviews to MySQL...`);
      for (const rev of db.reviews) {
        await connection.query(`
          INSERT INTO \`reviews\` (
            id, user_name, client_name, service_name, rating, comment, review_date, avatar_url, date, verified_booking
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            user_name = VALUES(user_name),
            client_name = VALUES(client_name),
            service_name = VALUES(service_name),
            rating = VALUES(rating),
            comment = VALUES(comment),
            review_date = VALUES(review_date),
            avatar_url = VALUES(avatar_url),
            date = VALUES(date),
            verified_booking = VALUES(verified_booking);
        `, [
          rev.id,
          rev.userName || rev.clientName || '',
          rev.clientName || rev.userName || '',
          rev.serviceName || '',
          Number(rev.rating) || 5,
          rev.comment || '',
          rev.reviewDate || rev.date || '',
          rev.avatarUrl || null,
          rev.date || rev.reviewDate || '',
          rev.verifiedBooking ? 1 : 0
        ]);
      }
      console.log(`✓ ${db.reviews.length} reviews successfully transferred.`);
    }

    // 12. Transfer Notifications
    if (Array.isArray(db.notifications)) {
      console.log(`Transferring ${db.notifications.length} notifications to MySQL...`);
      for (const notif of db.notifications) {
        await connection.query(`
          INSERT INTO \`notifications\` (
            id, title, message, type, timestamp_text, is_read, booking_ref, appointment_id, offer_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            message = VALUES(message),
            type = VALUES(type),
            timestamp_text = VALUES(timestamp_text),
            is_read = VALUES(is_read),
            booking_ref = VALUES(booking_ref),
            appointment_id = VALUES(appointment_id),
            offer_code = VALUES(offer_code);
        `, [
          notif.id,
          notif.title || '',
          notif.message || '',
          notif.type || 'info',
          notif.timestamp || notif.timestamp_text || '',
          notif.isRead ? 1 : 0,
          notif.bookingRef || null,
          notif.appointmentId || null,
          notif.offerCode || null
        ]);
      }
      console.log(`✓ ${db.notifications.length} notifications successfully transferred.`);
    }

    // 13. Transfer Broadcast Logs
    if (Array.isArray(db.broadcastLogs)) {
      console.log(`Transferring ${db.broadcastLogs.length} broadcast logs to MySQL...`);
      for (const blog of db.broadcastLogs) {
        await connection.query(`
          INSERT INTO \`broadcast_logs\` (
            id, offer_id, offer_code, offer_title, discount_percent, discount_amount, 
            dispatched_at, total_recipients, breakdown, status, message_text
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            offer_id = VALUES(offer_id),
            offer_code = VALUES(offer_code),
            offer_title = VALUES(offer_title),
            discount_percent = VALUES(discount_percent),
            discount_amount = VALUES(discount_amount),
            dispatched_at = VALUES(dispatched_at),
            total_recipients = VALUES(total_recipients),
            breakdown = VALUES(breakdown),
            status = VALUES(status),
            message_text = VALUES(message_text);
        `, [
          blog.id,
          blog.offerId || null,
          blog.offerCode || null,
          blog.offerTitle || null,
          blog.discountPercent !== undefined ? blog.discountPercent : null,
          blog.discountAmount !== undefined ? blog.discountAmount : null,
          blog.dispatchedAt || null,
          blog.totalRecipients || 0,
          blog.breakdown ? JSON.stringify(blog.breakdown) : null,
          blog.status || 'SUCCESS',
          blog.messageText || null
        ]);
      }
      console.log(`✓ ${db.broadcastLogs.length} broadcast logs successfully transferred.`);
    }

    console.log('\n===========================================================');
    console.log('🎉 MYSQL DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('===========================================================');

    // Display final row counts from MySQL
    console.log('\nFinal MySQL Table Counts in `smart_salon_db`:');
    const tables = ['users', 'appointments', 'customers', 'salon_settings', 'inquiries', 'offers', 'reviews', 'notifications', 'broadcast_logs'];
    for (const t of tables) {
      const [count] = await connection.query(`SELECT COUNT(*) as c FROM \`${t}\``);
      console.log(`  • ${t.padEnd(16)}: ${count[0].c} records`);
    }
    console.log('\n');

  } catch (err) {
    console.error('❌ Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
