import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root';
const DB_NAME = process.env.DB_NAME || 'smart_salon_db';

let pool: mysql.Pool | null = null;
let isConnected = false;
let lastCheckTime = 0;

export function getMySQLConfig() {
  return {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME
  };
}

export function isMySQLConnected(): boolean {
  return isConnected;
}

export async function initMySQLPool(): Promise<boolean> {
  if (process.env.USE_MYSQL === 'false') {
    isConnected = false;
    console.log('📦 [Database]: Local JSON database active (data/db.json). MySQL is disabled.');
    return false;
  }

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 2000
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    isConnected = true;
    lastCheckTime = Date.now();
    console.log(`[MySQL Database]: Connected successfully to \`${DB_NAME}\` at ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (err: any) {
    isConnected = false;
    console.log(`📦 [Database]: Local JSON database active (data/db.json). (MySQL connection not active: ${err.message})`);
    return false;
  }
}

export function getPool(): mysql.Pool | null {
  return pool;
}

export async function getMySQLStatus(): Promise<{
  connected: boolean;
  type: string;
  host: string;
  database: string;
  tableCounts?: Record<string, number>;
  error?: string;
}> {
  if (!pool || !isConnected) {
    return {
      connected: false,
      type: 'MySQL (Offline Fallback to Local Store)',
      host: DB_HOST,
      database: DB_NAME
    };
  }

  try {
    const tables = ['users', 'appointments', 'customers', 'salon_settings', 'inquiries', 'offers', 'reviews', 'notifications', 'broadcast_logs'];
    const counts: Record<string, number> = {};

    for (const t of tables) {
      try {
        const [rows]: any = await pool.query(`SELECT COUNT(*) as c FROM \`${t}\``);
        counts[t] = rows[0]?.c || 0;
      } catch {
        counts[t] = 0;
      }
    }

    return {
      connected: true,
      type: 'MySQL Relational Database (Production)',
      host: `${DB_HOST}:${DB_PORT}`,
      database: DB_NAME,
      tableCounts: counts
    };
  } catch (err: any) {
    return {
      connected: false,
      type: 'MySQL',
      host: DB_HOST,
      database: DB_NAME,
      error: err.message
    };
  }
}

/**
 * Loads entire salon relational database state directly from MySQL
 */
export async function loadDbFromMySQL(): Promise<any | null> {
  if (!pool || !isConnected) return null;

  try {
    // 1. Users
    const [userRows]: any = await pool.query('SELECT * FROM `users`');
    const users = (userRows || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'CUSTOMER',
      password: u.password || '',
      pin: u.pin || undefined,
      memberTier: u.member_tier || 'New Client',
      loyaltyPoints: u.loyalty_points || 0,
      memberSince: u.member_since || '2026',
      totalVisits: u.total_visits || 0,
      avatarUrl: u.avatar_url || undefined,
      googleId: u.google_id || undefined,
      gender: u.gender || undefined,
      birthDate: u.birth_date || undefined,
      anniversaryDate: u.anniversary_date || undefined,
      preferredStylist: u.preferred_stylist || undefined,
      skinOrHairType: u.skin_or_hair_type || undefined,
      specialNotes: u.special_notes || undefined,
      address: u.address || undefined,
      city: u.city || undefined,
      emergencyContact: u.emergency_contact || undefined,
      allergies: u.allergies || undefined,
      preferredSlot: u.preferred_slot || undefined,
      preferredServices: typeof u.preferred_services === 'string' 
        ? JSON.parse(u.preferred_services) 
        : (u.preferred_services || [])
    }));

    // 2. Settings
    const [settingRows]: any = await pool.query('SELECT * FROM `salon_settings` WHERE id = 1');
    const s = settingRows?.[0] || {};
    const settings = {
      salonName: s.salon_name || 'Modern Unisex Salon',
      tagline: s.tagline || "WE'LL STYLE YOU'LL SMILE",
      phone: s.phone || '8104026257',
      email: s.email || 'modernsalon02@gmail.com',
      address: s.address || 'B.N. GUND COMPLEX, NEAR KANYA PRASHALA AND ICICI BANK, MOHOL - 413213',
      openingHours: s.opening_hours || 'Mon - Sun: 09:00 AM - 09:00 PM',
      advancePercentage: Number(s.advance_percentage) || 10,
      currencySymbol: s.currency_symbol || '₹',
      razorpayKeyId: s.razorpay_key_id || 'rzp_test_modern_salon_mohol',
      bookingAutoConfirm: Boolean(s.booking_auto_confirm),
      instagramUrl: s.instagram_url || '',
      mapsUrl: s.maps_url || '',
      gstNumber: s.gst_number || '',
      staffType: s.staff_type || 'Self-Employed (Master Stylist & Founder)'
    };

    // 3. Customers CRM
    const [custRows]: any = await pool.query('SELECT * FROM `customers`');
    const customers = (custRows || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      totalVisits: c.total_visits || 0,
      totalSpent: c.total_spent || 0,
      lastVisit: c.last_visit || '',
      favoriteService: c.favorite_service || '',
      memberSince: c.member_since || '2026',
      tier: c.tier || 'New Client'
    }));

    // 4. Appointments
    const [aptRows]: any = await pool.query('SELECT * FROM `appointments` ORDER BY created_at DESC');
    const appointments = (aptRows || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id || '',
      bookingRef: a.booking_ref,
      clientName: a.client_name,
      clientPhone: a.client_phone,
      clientEmail: a.client_email || '',
      serviceId: a.service_id || 'srv-gen',
      serviceName: a.service_name,
      category: a.category || 'General',
      date: a.date || a.appointment_date || '',
      appointment_date: a.appointment_date || a.date || '',
      timeSlot: a.time_slot,
      stylistName: a.stylist_name || 'Master Stylist & Founder',
      totalAmount: Number(a.total_amount) || 0,
      advancePaid: Number(a.advance_paid) || 0,
      balanceDue: Number(a.balance_due) || 0,
      paymentStatus: a.payment_status || 'PAID',
      bookingStatus: a.booking_status || 'CONFIRMED',
      status: a.status || a.booking_status || 'CONFIRMED',
      razorpayPaymentId: a.razorpay_payment_id || null,
      razorpayOrderId: a.razorpay_order_id || null,
      createdAt: a.created_at || a.created_at_text || new Date().toISOString(),
      notes: a.notes || '',
      isNew: Boolean(a.is_new),
      whatsappUrl: a.whatsapp_url || '',
      ownerWhatsappUrl: a.owner_whatsapp_url || ''
    }));

    // 5. Inquiries
    const [inqRows]: any = await pool.query('SELECT * FROM `inquiries` ORDER BY created_at DESC');
    const inquiries = (inqRows || []).map((inq: any) => ({
      id: inq.id,
      clientName: inq.client_name,
      phone: inq.phone,
      email: inq.email || '',
      subject: inq.subject,
      serviceCategory: inq.service_category || '',
      message: inq.message,
      receivedDate: inq.received_date || '',
      status: inq.status || 'NEW',
      ownerReply: inq.owner_reply || undefined
    }));

    // 6. Offers
    const [offRows]: any = await pool.query('SELECT * FROM `offers`');
    const offers = (offRows || []).map((o: any) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      description: o.description || '',
      discountAmount: o.discount_amount !== null ? Number(o.discount_amount) : undefined,
      discountPercent: o.discount_percent !== null ? Number(o.discount_percent) : undefined,
      minBookingAmount: Number(o.min_booking_amount) || 0,
      validTill: o.valid_till,
      active: Boolean(o.active)
    }));

    // 7. Reviews
    const [revRows]: any = await pool.query('SELECT * FROM `reviews` ORDER BY created_at DESC');
    const reviews = (revRows || []).map((r: any) => ({
      id: r.id,
      userName: r.user_name || r.client_name,
      clientName: r.client_name || r.user_name,
      serviceName: r.service_name,
      rating: Number(r.rating) || 5,
      comment: r.comment || '',
      reviewDate: r.review_date || r.date || '',
      date: r.date || r.review_date || '',
      avatarUrl: r.avatar_url || '',
      verifiedBooking: Boolean(r.verified_booking)
    }));

    // 8. Notifications
    const [notifRows]: any = await pool.query('SELECT * FROM `notifications` ORDER BY created_at DESC');
    const notifications = (notifRows || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      timestamp: n.timestamp_text || '',
      read: Boolean(n.is_read),
      isRead: Boolean(n.is_read),
      bookingRef: n.booking_ref || undefined,
      appointmentId: n.appointment_id || undefined,
      offerCode: n.offer_code || undefined
    }));

    // 9. Broadcast Logs
    const [blogRows]: any = await pool.query('SELECT * FROM `broadcast_logs` ORDER BY created_at DESC');
    const broadcastLogs = (blogRows || []).map((b: any) => ({
      id: b.id,
      offerId: b.offer_id,
      offerCode: b.offer_code,
      offerTitle: b.offer_title,
      discountPercent: b.discount_percent !== null ? Number(b.discount_percent) : undefined,
      discountAmount: b.discount_amount !== null ? Number(b.discount_amount) : undefined,
      dispatchedAt: b.dispatched_at,
      totalRecipients: b.total_recipients || 0,
      breakdown: typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : (b.breakdown || {}),
      status: b.status || 'SUCCESS',
      messageText: b.message_text || ''
    }));

    return {
      users,
      settings,
      customers,
      appointments,
      inquiries,
      offers,
      reviews,
      notifications,
      broadcastLogs
    };
  } catch (err: any) {
    console.error('[MySQL Load Error]:', err.message);
    return null;
  }
}

/**
 * Saves or updates a user directly in MySQL
 */
export async function saveUserToMySQL(user: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
      INSERT INTO \`users\` (
        id, name, username, email, phone, role, password, pin, 
        member_tier, loyalty_points, member_since, total_visits, preferred_services, google_id, avatar_url,
        gender, birth_date, anniversary_date, preferred_stylist, skin_or_hair_type,
        special_notes, address, city, emergency_contact, allergies, preferred_slot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        username = VALUES(username),
        email = VALUES(email),
        phone = VALUES(phone),
        role = VALUES(role),
        password = VALUES(password),
        pin = VALUES(pin),
        member_tier = VALUES(member_tier),
        loyalty_points = VALUES(loyalty_points),
        member_since = VALUES(member_since),
        total_visits = VALUES(total_visits),
        preferred_services = VALUES(preferred_services),
        google_id = VALUES(google_id),
        avatar_url = VALUES(avatar_url),
        gender = VALUES(gender),
        birth_date = VALUES(birth_date),
        anniversary_date = VALUES(anniversary_date),
        preferred_stylist = VALUES(preferred_stylist),
        skin_or_hair_type = VALUES(skin_or_hair_type),
        special_notes = VALUES(special_notes),
        address = VALUES(address),
        city = VALUES(city),
        emergency_contact = VALUES(emergency_contact),
        allergies = VALUES(allergies),
        preferred_slot = VALUES(preferred_slot);
    `, [
      user.id,
      user.name,
      user.username || null,
      user.email || null,
      user.phone || null,
      user.role || 'CUSTOMER',
      user.password || null,
      user.pin || null,
      user.memberTier || 'New Client',
      user.loyaltyPoints || 0,
      user.memberSince || '2026',
      user.totalVisits || 0,
      user.preferredServices ? JSON.stringify(user.preferredServices) : null,
      user.googleId || null,
      user.avatarUrl || null,
      user.gender || null,
      user.birthDate || null,
      user.anniversaryDate || null,
      user.preferredStylist || null,
      user.skinOrHairType || null,
      user.specialNotes || null,
      user.address || null,
      user.city || null,
      user.emergencyContact || null,
      user.allergies || null,
      user.preferredSlot || null
    ]);
  } catch (err: any) {
    console.error('[MySQL Save User Error]:', err.message);
  }
}

/**
 * Saves or updates a customer record in MySQL CRM table
 */
export async function saveCustomerToMySQL(c: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
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
      c.name || 'Client',
      c.phone || '',
      c.email || '',
      Number(c.totalVisits) || 0,
      Number(c.totalSpent) || 0,
      c.lastVisit || 'Just Joined',
      c.favoriteService || 'General Styling',
      c.memberSince || '2026',
      c.tier || 'New Client'
    ]);
  } catch (err: any) {
    console.error('[MySQL Save Customer Error]:', err.message);
  }
}

/**
 * Saves or updates an appointment directly in MySQL
 */
export async function saveAppointmentToMySQL(apt: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
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
        owner_whatsapp_url = VALUES(owner_whatsapp_url);
    `, [
      apt.id,
      apt.userId || null,
      apt.bookingRef || `BK-${apt.id}`,
      apt.clientName || 'Client',
      apt.clientPhone || '',
      apt.clientEmail || '',
      apt.serviceId || 'srv-gen',
      apt.serviceName || 'General Service',
      apt.category || 'General',
      apt.date || apt.appointment_date || '',
      apt.date || '',
      apt.timeSlot || '10:00 AM',
      apt.stylistName || 'Master Stylist & Founder',
      Number(apt.totalAmount) || 0,
      Number(apt.advancePaid) || 0,
      Number(apt.balanceDue) || 0,
      apt.paymentStatus || 'PAID',
      apt.bookingStatus || 'CONFIRMED',
      apt.status || 'CONFIRMED',
      apt.razorpayPaymentId || null,
      apt.razorpayOrderId || null,
      apt.notes || '',
      apt.isNew ? 1 : 0,
      apt.whatsappUrl || null,
      apt.ownerWhatsappUrl || null,
      apt.createdAt || new Date().toISOString()
    ]);
  } catch (err: any) {
    console.error('[MySQL Save Appointment Error]:', err.message);
  }
}

/**
 * Updates salon settings in MySQL
 */
export async function saveSettingsToMySQL(s: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
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
  } catch (err: any) {
    console.error('[MySQL Save Settings Error]:', err.message);
  }
}

/**
 * Saves review to MySQL
 */
export async function saveReviewToMySQL(rev: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
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
  } catch (err: any) {
    console.error('[MySQL Save Review Error]:', err.message);
  }
}

/**
 * Saves inquiry to MySQL
 */
export async function saveInquiryToMySQL(inq: any) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(`
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
  } catch (err: any) {
    console.error('[MySQL Save Inquiry Error]:', err.message);
  }
}

/**
 * Deletes inquiry from MySQL
 */
export async function deleteInquiryFromMySQL(id: string) {
  if (!pool || !isConnected) return;
  try {
    await pool.query('DELETE FROM `inquiries` WHERE id = ?', [id]);
  } catch (err: any) {
    console.error('[MySQL Delete Inquiry Error]:', err.message);
  }
}
