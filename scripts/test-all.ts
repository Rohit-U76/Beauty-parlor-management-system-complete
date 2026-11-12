import { 
  normalizeTimeSlot, 
  parseSlotTimeToMinutes, 
  SALON_TIME_SLOTS,
  isSlotBlockedByAdmin,
  isSlotAvailableForDate,
  getSlotAvailability,
  getLocalDateString
} from '../src/utils/availability';
import { 
  parseAppointmentDateTime, 
  getAppointmentReminderInfo 
} from '../src/utils/appointmentReminderUtils';
import { BlockedSlotWindow } from '../src/types';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  ✓ [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ suite, name, passed: false, error: err.message || String(err), durationMs });
    console.error(`  ✗ [FAIL] ${name} (${durationMs}ms):`, err.message || err);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected '${expected}', got '${actual}'`);
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('  🧪 RUNNING COMPREHENSIVE TEST SUITE - MODERN SALON');
  console.log('======================================================\n');

  // ==========================================
  // SUITE 1: Business Logic & Utility Functions
  // ==========================================
  console.log('--- Suite 1: Core Utilities & Availability Calculation ---');

  await runTest('Utilities', 'normalizeTimeSlot trims and standardizes time slots', () => {
    assertEqual(normalizeTimeSlot(' 09:30 am  '), '09:30 AM', 'Proper normalization of lowercase and spaces');
    assertEqual(normalizeTimeSlot(''), '', 'Empty string handling');
  });

  await runTest('Utilities', 'parseSlotTimeToMinutes accurately calculates minutes from midnight', () => {
    assertEqual(parseSlotTimeToMinutes('09:30 AM'), 9 * 60 + 30, '09:30 AM should be 570 mins');
    assertEqual(parseSlotTimeToMinutes('12:00 PM'), 12 * 60, '12:00 PM should be 720 mins');
    assertEqual(parseSlotTimeToMinutes('01:30 PM'), 13 * 60 + 30, '01:30 PM should be 810 mins');
    assertEqual(parseSlotTimeToMinutes('07:30 PM'), 19 * 60 + 30, '07:30 PM should be 1170 mins');
    assertEqual(parseSlotTimeToMinutes('12:15 AM'), 15, '12:15 AM should be 15 mins');
  });

  await runTest('Utilities', 'SALON_TIME_SLOTS covers complete salon working hours (9 AM - 10 PM in 3hr/4hr batches)', () => {
    assertEqual(SALON_TIME_SLOTS.length, 4, `Expected 4 slots (3-4hr batches), got ${SALON_TIME_SLOTS.length}`);
    assert(SALON_TIME_SLOTS.includes('09:00 AM - 12:00 PM'), 'Should include morning slot 09:00 AM - 12:00 PM');
    assert(SALON_TIME_SLOTS.includes('06:00 PM - 10:00 PM'), 'Should include night slot 06:00 PM - 10:00 PM');
  });

  await runTest('Utilities', 'parseAppointmentDateTime correctly parses date and time slots', () => {
    const parsed = parseAppointmentDateTime('2026-10-15', '04:00 PM');
    assertEqual(parsed.getFullYear(), 2026, 'Year matches');
    assertEqual(parsed.getMonth(), 9, 'Month matches (October = index 9)');
    assertEqual(parsed.getDate(), 15, 'Day matches');
    assertEqual(parsed.getHours(), 16, '4 PM matches 16:00');
    assertEqual(parsed.getMinutes(), 0, 'Minutes matches 0');
  });

  await runTest('Utilities', 'getAppointmentReminderInfo calculates upcoming reminder thresholds', () => {
    const reference = new Date(2026, 9, 15, 10, 0, 0); // Oct 15, 2026, 10:00 AM
    const appointment = {
      id: 'apt-test-1',
      bookingRef: 'SS-TEST-001',
      clientName: 'Test Client',
      clientPhone: '9876543210',
      clientEmail: 'test@example.com',
      serviceId: 'srv-1',
      serviceName: 'Hair Styling',
      category: 'Hair',
      date: '2026-10-15',
      timeSlot: '02:00 PM',
      totalAmount: 500,
      advancePaid: 50,
      balanceDue: 450,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      createdAt: '2026-10-15T08:00:00Z'
    };

    const info = getAppointmentReminderInfo(appointment as any, reference);
    assertEqual(info.isToday, true, 'Should be detected as today');
    assertEqual(info.isUpcoming, true, 'Should be upcoming since 2:00 PM is after 10:00 AM');
    assertEqual(info.isPast, false, 'Should not be marked as past');
    assert(info.isUpcoming24h, 'Should be within 24h window');
    assert(Math.abs(info.hoursUntil - 4) < 0.1, `Hours until should be ~4 hours, got ${info.hoursUntil}`);

    // Test past appointment earlier today (e.g. 7:30 PM appointment when current time is 9:15 PM)
    const lateReference = new Date(2026, 9, 15, 21, 15, 0); // 9:15 PM
    const pastAppt = { ...appointment, timeSlot: '07:30 PM' };
    const pastInfo = getAppointmentReminderInfo(pastAppt as any, lateReference);
    assertEqual(pastInfo.isToday, true, 'Should be detected as today');
    assertEqual(pastInfo.isPast, true, '7:30 PM at 9:15 PM should be detected as passed');
    assertEqual(pastInfo.isUpcoming, false, 'Passed appointment must NOT be marked as upcoming');
    assertEqual(pastInfo.isUpcoming24h, false, 'Passed appointment must NOT be in 24h upcoming alert');

    // Test tomorrow appointment
    const tomorrowAppt = { ...appointment, date: '2026-10-16', timeSlot: '11:00 AM' };
    const tomorrowInfo = getAppointmentReminderInfo(tomorrowAppt as any, reference);
    assertEqual(tomorrowInfo.isTomorrow, true, 'Should be detected as tomorrow');
    assertEqual(tomorrowInfo.isUpcoming, true, 'Tomorrow appointment should be upcoming');
    assertEqual(tomorrowInfo.headingLabel, 'Upcoming Appointment Tomorrow', 'Heading should say Upcoming Appointment Tomorrow');
  });

  await runTest('Utilities', 'isSlotBlockedByAdmin accurately enforces owner break and scheduled blackout windows', () => {
    const todayIso = getLocalDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = getLocalDateString(tomorrow);

    // 1. Quick Master Toggle: isOwnerOnBreakToday
    const checkTodayBreak = isSlotBlockedByAdmin('01:30 PM', todayIso, [], true);
    assertEqual(checkTodayBreak.isBlocked, true, 'isOwnerOnBreakToday must block today slots');
    const checkTomorrowWithTodayBreak = isSlotBlockedByAdmin('01:30 PM', tomorrowIso, [], true);
    assertEqual(checkTomorrowWithTodayBreak.isBlocked, false, 'isOwnerOnBreakToday must not block tomorrow');

    // 2. Full Day Scheduled Blackout
    const rules: BlockedSlotWindow[] = [
      {
        id: 'rule-full-tomorrow',
        title: 'Full Day Off',
        date: tomorrowIso,
        allDay: true,
        active: true,
        reason: 'Owner holiday',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule-range-today',
        title: 'Afternoon Break',
        date: todayIso,
        allDay: false,
        startTime: '01:30 PM',
        endTime: '05:30 PM',
        active: true,
        reason: 'Staff training',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rule-paused',
        title: 'Paused Leave',
        date: tomorrowIso,
        allDay: true,
        active: false,
        createdAt: new Date().toISOString()
      }
    ];

    // Check tomorrow with full day block
    const tomorrowSlotCheck = isSlotBlockedByAdmin('11:45 AM', tomorrowIso, rules, false);
    assertEqual(tomorrowSlotCheck.isBlocked, true, 'Full day rule must block 11:45 AM');

    // Check time range block on today (01:30 PM to 05:30 PM)
    const inRangeCheck = isSlotBlockedByAdmin('02:45 PM', todayIso, rules, false);
    assertEqual(inRangeCheck.isBlocked, true, '02:45 PM falls within 01:30 PM - 05:30 PM');

    const outRangeMorningCheck = isSlotBlockedByAdmin('09:30 AM', todayIso, rules, false);
    assertEqual(outRangeMorningCheck.isBlocked, false, '09:30 AM is outside 01:30 PM - 05:30 PM');

    // Verify slot availability status
    const slotInfoBlocked = getSlotAvailability([], tomorrowIso, '10:30 AM', 3, rules, false);
    assertEqual(slotInfoBlocked.status, 'SOLD_OUT', 'Blocked slot must have status SOLD_OUT');
    assertEqual(slotInfoBlocked.isBlockedByAdmin, true, 'Slot info should indicate isBlockedByAdmin: true');
    assertEqual(slotInfoBlocked.remainingSeats, 0, 'Blocked slot remaining seats must be 0');
  });

  // ==========================================
  // SUITE 2: Backend API Endpoints
  // ==========================================
  console.log('\n--- Suite 2: Backend REST APIs & Authentication ---');

  await runTest('API: Health', 'GET /api/health responds with service status ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assertEqual(res.status, 200, 'Status should be 200');
    const json = await res.json();
    assertEqual(json.status, 'ok', 'Status property should be ok');
  });

  await runTest('API: Auth', 'POST /api/auth/login validates Owner PIN 9999 for instant admin access', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: '9999', role: 'ADMIN' })
    });
    assertEqual(res.status, 200, 'Status should be 200');
    const json = await res.json();
    assert(json.success === true, 'Login should succeed');
    assertEqual(json.user?.role, 'ADMIN', 'Role should be ADMIN');
  });

  await runTest('API: Auth', 'POST /api/auth/login handles customer login and rejects bad password', async () => {
    // Valid customer login
    const validRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rohit', password: 'password123' })
    });
    assertEqual(validRes.status, 200, 'Valid login should return 200');
    const validJson = await validRes.json();
    assert(validJson.success === true, 'Success should be true');
    assertEqual(validJson.user?.role, 'CUSTOMER', 'Role should be CUSTOMER');

    // Invalid password
    const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rohit', password: 'wrongpassword' })
    });
    assertEqual(invalidRes.status, 401, 'Invalid credentials should return 401');
    const invalidJson = await invalidRes.json();
    assert(invalidJson.success === false, 'Success should be false on wrong password');
  });

  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testUser = `testuser_${Date.now()}`;

  await runTest('API: Auth', 'POST /api/auth/register registers new user and credits 100 points', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test Client',
        username: testUser,
        email: `${testUser}@example.com`,
        phone: testPhone,
        password: 'securepassword123',
        preferredServices: ['Hair Spa', 'Facial']
      })
    });
    assertEqual(res.status, 200, 'Registration should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assertEqual(json.user?.loyaltyPoints, 100, 'New user should receive 100 loyalty points');
    assertEqual(json.user?.totalVisits, 0, 'New user totalVisits must be strictly 0');
  });

  await runTest('API: Auth', 'POST /api/auth/register prevents duplicate phone registration', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Client',
        username: `dup_${Date.now()}`,
        email: `dup_${Date.now()}@example.com`,
        phone: testPhone,
        password: 'securepassword123'
      })
    });
    assertEqual(res.status, 400, 'Duplicate phone registration must return 400');
    const json = await res.json();
    assert(json.success === false, 'Success should be false for duplicate');
  });

  await runTest('API: Auth', 'POST /api/auth/google handles Google OAuth sign-in and credits 100 points', async () => {
    const testGoogleEmail = `google_tester_${Date.now()}@gmail.com`;
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          email: testGoogleEmail,
          name: 'Google Test Client',
          picture: 'https://lh3.googleusercontent.com/test-avatar',
          sub: `google_test_${Date.now()}`
        }
      })
    });
    assertEqual(res.status, 200, 'Google sign-in responds with 200 OK');
    const json = await res.json();
    assert(json.success === true, 'Google auth should succeed');
    assert(json.user?.email === testGoogleEmail, 'User email matches Google profile');
    assertEqual(json.user?.loyaltyPoints, 100, 'New Google user gets 100 bonus loyalty points');
    assertEqual(json.user?.role, 'CUSTOMER', 'New Google user has CUSTOMER role');
  });

  await runTest('API: Database', 'GET /api/db/status returns database connectivity and table stats', async () => {
    const res = await fetch(`${BASE_URL}/api/db/status`);
    assertEqual(res.status, 200, 'Database status responds with 200 OK');
    const json = await res.json();
    assert(json.type !== undefined, 'Database type must be returned');
    assert(json.connected !== undefined, 'Connection status boolean must be returned');
  });

  await runTest('API: Settings', 'GET and PUT /api/settings manages salon configurations', async () => {
    const getRes = await fetch(`${BASE_URL}/api/settings`);
    assertEqual(getRes.status, 200, 'GET /api/settings should return 200');
    const getJson = await getRes.json();
    assert(getJson.success === true, 'Success should be true');
    assert(getJson.settings?.salonName !== undefined, 'Settings must include salonName');

    const originalAdvance = getJson.settings?.advancePercentage || 10;
    // Update settings
    const putRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advancePercentage: 15 })
    });
    assertEqual(putRes.status, 200, 'PUT /api/settings should return 200');
    const putJson = await putRes.json();
    assertEqual(putJson.settings?.advancePercentage, 15, 'Advance percentage should be updated to 15');

    // Restore original advance
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advancePercentage: originalAdvance })
    });
  });

  // ==========================================
  // SUITE 3: Payment & QR Calculations
  // ==========================================
  console.log('\n--- Suite 3: Payment & UPI QR Code Processing ---');

  await runTest('API: Payment', 'POST /api/payment/create-order calculates 10% advance deposit accurately', async () => {
    const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalAmount: 2500,
        advancePercentage: 10,
        customerName: 'Test Client',
        customerPhone: '9822012345',
        serviceNames: ['3D HD Bridal Makeup']
      })
    });
    assertEqual(res.status, 200, 'Create order should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assertEqual(json.totalAmount, 2500, 'Total should be 2500');
    assertEqual(json.advanceAmount, 250, '10% of 2500 is 250');
    assertEqual(json.remainingAmount, 2250, 'Remaining should be 2250');
    assertEqual(json.amountInPaise, 25000, 'Amount in paise should be 25000');
    assert(Boolean(json.orderId), 'Order ID must be generated');
  });

  await runTest('API: Payment', 'POST /api/payment/verify confirms advance payment & generates booking reference', async () => {
    const res = await fetch(`${BASE_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpayOrderId: 'order_test_123',
        razorpayPaymentId: 'pay_test_456',
        advanceAmount: 250,
        totalAmount: 2500
      })
    });
    assertEqual(res.status, 200, 'Payment verify should return 200');
    const json = await res.json();
    assertEqual(json.status, 'PAID', 'Status should be PAID');
    assert(json.bookingRef.startsWith('SS-'), 'Booking ref must start with SS-');
    assertEqual(json.balanceDue, 2250, 'Balance due must be total - advance');
  });

  await runTest('API: QR', 'POST /api/qr/generate-upi generates compliant NPCI UPI payment deep link', async () => {
    const res = await fetch(`${BASE_URL}/api/qr/generate-upi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 350,
        payeeName: 'Modern Unisex Salon',
        bookingRef: 'SS-2026-999999'
      })
    });
    assertEqual(res.status, 200, 'Generate UPI should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assert(json.upiUrl.startsWith('upi://pay?'), 'URI must start with upi://pay?');
    assert(json.upiUrl.includes('am=350.00'), 'URI must include formatted amount 350.00');
  });

  // ==========================================
  // SUITE 4: Multi-Channel Notifications
  // ==========================================
  console.log('\n--- Suite 4: Multi-Channel Notifications (SMS, WhatsApp, Email) ---');

  await runTest('API: Notifications', 'POST /api/notifications/send-sms simulates SMS dispatch with web SMS link', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9822012345',
        clientName: 'Priya Sharma',
        templateType: 'CONFIRMATION',
        bookingRef: 'SS-2026-112233',
        serviceName: 'Cheryla Facial',
        date: '2026-10-20',
        timeSlot: '04:00 PM',
        advancePaid: 200,
        balanceDue: 1800
      })
    });
    assertEqual(res.status, 200, 'SMS dispatch should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assertEqual(json.status, 'DELIVERED', 'Status should be DELIVERED');
    assert(json.webSmsUrl.startsWith('sms:9822012345?body='), 'Web SMS link should be created');
  });

  await runTest('API: Notifications', 'POST /api/notifications/send-whatsapp generates formatted WhatsApp links for owner and client', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientPhone: '9822012345',
        clientName: 'Priya Sharma',
        serviceName: 'Cheryla Facial',
        date: '2026-10-20',
        timeSlot: '04:00 PM',
        bookingRef: 'SS-2026-112233',
        advancePaid: 200,
        balanceDue: 1800,
        totalAmount: 2000
      })
    });
    assertEqual(res.status, 200, 'WhatsApp dispatch should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assert(json.ownerWhatsappUrl.includes('api.whatsapp.com'), 'Owner WhatsApp URL must be generated');
    assert(json.clientWhatsappUrl.includes('api.whatsapp.com'), 'Client WhatsApp URL must be generated');
  });

  await runTest('API: Notifications', 'POST /api/notifications/send-email dispatches confirmation notification', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.sharma@example.com',
        clientName: 'Priya Sharma',
        bookingRef: 'SS-2026-112233',
        serviceName: 'Cheryla Facial'
      })
    });
    assertEqual(res.status, 200, 'Email dispatch should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success should be true');
    assertEqual(json.status, 'SENT', 'Status should be SENT');
  });

  // ==========================================
  // SUITE 5: Inquiries & Consultations
  // ==========================================
  console.log('\n--- Suite 5: Consultation Inquiries & CRUD Operations ---');

  let createdInquiryId = '';

  await runTest('API: Inquiries', 'POST /api/inquiries/submit records inquiry and DELETE removes it', async () => {
    // 1. Submit
    const submitRes = await fetch(`${BASE_URL}/api/inquiries/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Automated Test Client',
        phone: '9822109876',
        email: 'testinquiry@example.com',
        subject: 'Bridal Inquiry Test',
        serviceCategory: 'Bridal & Pre-Bridal',
        message: 'Testing inquiry submission and deletion flow.'
      })
    });
    assertEqual(submitRes.status, 200, 'Submit inquiry should return 200');
    const submitJson = await submitRes.json();
    assert(submitJson.success === true, 'Inquiry should be recorded successfully');
    createdInquiryId = submitJson.id;
    assert(Boolean(createdInquiryId), 'Inquiry ID must exist');

    // 2. Fetch list & verify present
    const listRes = await fetch(`${BASE_URL}/api/inquiries`);
    assertEqual(listRes.status, 200, 'List inquiries should return 200');
    const listJson = await listRes.json();
    const found = listJson.inquiries.some((i: any) => i.id === createdInquiryId);
    assert(found, `Newly created inquiry ${createdInquiryId} must be in inquiries list`);

    // 3. Delete inquiry
    const deleteRes = await fetch(`${BASE_URL}/api/inquiries/${createdInquiryId}`, {
      method: 'DELETE'
    });
    assertEqual(deleteRes.status, 200, 'Delete inquiry should return 200');
    const deleteJson = await deleteRes.json();
    assert(deleteJson.success === true, 'Delete inquiry must report success');

    // 4. Verify no longer present
    const verifyListRes = await fetch(`${BASE_URL}/api/inquiries`);
    const verifyListJson = await verifyListRes.json();
    const stillFound = verifyListJson.inquiries.some((i: any) => i.id === createdInquiryId);
    assert(!stillFound, 'Inquiry should be permanently removed after deletion');
  });

  // ==========================================
  // SUITE 6: Appointments Real-Time Store
  // ==========================================
  console.log('\n--- Suite 6: Appointments Real-Time Store ---');

  await runTest('API: Appointments', 'POST /api/appointments creates booking and GET /api/appointments retrieves it', async () => {
    const bookingRef = `SS-TEST-${Date.now().toString().slice(-6)}`;
    const createRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingRef,
        clientName: 'Rohit Umdale',
        clientPhone: '8104026257',
        clientEmail: 'rohitumdale@gmail.com',
        serviceId: 'srv-bridal-1',
        serviceName: '3D/4D HD Bridal & Grooming',
        category: 'Bridal',
        date: '2026-11-05',
        timeSlot: '11:45 AM',
        stylistName: 'Master Stylist & Founder',
        totalAmount: 5000,
        advancePaid: 500,
        balanceDue: 4500
      })
    });
    assertEqual(createRes.status, 200, 'Create appointment should return 200');
    const createJson = await createRes.json();
    assert(createJson.success === true, 'Success should be true');

    // Fetch appointments
    const getRes = await fetch(`${BASE_URL}/api/appointments`);
    assertEqual(getRes.status, 200, 'Fetch appointments should return 200');
    const getJson = await getRes.json();
    assert(Array.isArray(getJson.appointments), 'Appointments should be an array');
    const created = getJson.appointments.find((a: any) => a.bookingRef === bookingRef);
    assert(Boolean(created), `Created appointment ${bookingRef} should be found`);
    assertEqual(created.advancePaid, 500, 'Advance paid must match 500');
    assertEqual(created.balanceDue, 4500, 'Balance due must match 4500');

    // Test PUT /api/appointments/:id (reschedule / cancel updates)
    const updateRes = await fetch(`${BASE_URL}/api/appointments/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeSlot: '01:00 PM',
        notes: 'Rescheduled via test'
      })
    });
    assertEqual(updateRes.status, 200, 'Update appointment should return 200');
    const updateJson = await updateRes.json();
    assert(updateJson.success === true, 'Update should succeed');
    assertEqual(updateJson.appointment?.timeSlot, '01:00 PM', 'Time slot must be updated');
  });

  // ==========================================
  // SUITE 7: Reviews & Testimonials
  // ==========================================
  console.log('\n--- Suite 7: Reviews & Testimonials API ---');

  await runTest('API: Reviews', 'GET /api/reviews and POST /api/reviews manage customer testimonials', async () => {
    // 1. Fetch initial reviews
    const getRes = await fetch(`${BASE_URL}/api/reviews`);
    assertEqual(getRes.status, 200, 'GET /api/reviews should return 200');
    const getJson = await getRes.json();
    assert(Array.isArray(getJson), 'Reviews must be an array');

    // 2. Post a new review
    const postRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Aanya Verma',
        serviceName: 'Bridal Makeup',
        rating: 5,
        comment: 'Absolutely stunning work! Felt like royalty on my special day.',
        date: '2026-10-22'
      })
    });
    assertEqual(postRes.status, 201, 'POST /api/reviews should return 201');
    const postJson = await postRes.json();
    assert(postJson.success === true, 'Posting review should succeed');
    assert(Boolean(postJson.review?.id), 'Saved review must have an ID');

    // 3. Confirm review is returned in list
    const verifyRes = await fetch(`${BASE_URL}/api/reviews`);
    const verifyJson = await verifyRes.json();
    assert(Array.isArray(verifyJson), 'Verify response must be an array');
    const found = verifyJson.some((r: any) => r.id === postJson.review.id);
    assert(found, 'Newly posted review should be returned by GET /api/reviews');
  });

  // ==========================================
  // SUITE 8: Dynamic WhatsApp Offer Broadcasting
  // ==========================================
  console.log('\n--- Suite 8: Dynamic WhatsApp Offer Broadcasting ---');

  await runTest('API: Offers & WhatsApp Broadcast', 'GET /api/offers/clients-preview dynamically retrieves unique past & present clients', async () => {
    const res = await fetch(`${BASE_URL}/api/offers/clients-preview`);
    assertEqual(res.status, 200, 'GET /api/offers/clients-preview should return 200');
    const json = await res.json();
    assert(json.success === true, 'Success must be true');
    assert(typeof json.totalClients === 'number', 'totalClients should be a number');
    assert(json.totalClients > 0, 'Database should dynamically find existing clients');
    assert(Array.isArray(json.clients), 'clients should be an array');
    
    // Check that every recipient has sanitized phone number (10 digits)
    json.clients.forEach((c: any) => {
      assert(c.phone && c.phone.length === 10, `Client ${c.name} phone should be clean 10 digits, got: ${c.phone}`);
      assert(Boolean(c.name), 'Client must have a name');
    });
  });

  await runTest('API: Offers & WhatsApp Broadcast', 'POST /api/offers creates offer, dispatches WhatsApp broadcast with deep links, and cleans up', async () => {
    // 1. Create a new offer
    const testCode = `TESTOFFER${Date.now().toString().slice(-4)}`;
    const createRes = await fetch(`${BASE_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testCode,
        title: 'Automation Test Festive Glow Special',
        description: 'Get Flat 25% discount on all premium salon and spa services.',
        discountPercent: 25,
        minBookingAmount: 999,
        validTill: '2026-12-31',
        active: true
      })
    });

    assertEqual(createRes.status, 201, 'POST /api/offers should return 201');
    const createJson = await createRes.json();
    assert(createJson.success === true, 'Creation should be successful');
    assert(Boolean(createJson.offer?.id), 'Created offer must have an ID');
    assertEqual(createJson.offer.code, testCode, 'Offer code should match');

    // 2. Validate WhatsApp Broadcast payload
    assert(Boolean(createJson.broadcast), 'Broadcast payload must be returned');
    assert(createJson.broadcast.totalRecipients > 0, 'Broadcast must have recipients');
    assert(Boolean(createJson.broadcast.messageText), 'Broadcast must contain formatted promotional message');
    assert(createJson.broadcast.messageText.includes(testCode), 'Message must include coupon code');
    assert(createJson.broadcast.messageText.includes('25%'), 'Message must include discount');

    // 3. Validate recipient deep links
    const firstRecipient = createJson.broadcast.recipients[0];
    assert(Boolean(firstRecipient.whatsappUrl), 'Recipient must have WhatsApp direct URL');
    assert(firstRecipient.whatsappUrl.startsWith('https://api.whatsapp.com/send?phone=91'), 'URL must format Indian country code 91');
    assert(Boolean(firstRecipient.webWhatsappUrl), 'Recipient must have WhatsApp Web URL');

    // 4. Test Re-broadcast of existing offer
    const rebroadcastRes = await fetch(`${BASE_URL}/api/offers/${createJson.offer.id}/broadcast-whatsapp`, {
      method: 'POST'
    });
    assertEqual(rebroadcastRes.status, 200, 'Re-broadcast endpoint should return 200');
    const rebroadcastJson = await rebroadcastRes.json();
    assert(rebroadcastJson.success === true, 'Re-broadcast should succeed');
    assert(rebroadcastJson.broadcast.offerCode === testCode, 'Broadcast code should match');

    // 5. Test toggle offer active status
    const toggleRes = await fetch(`${BASE_URL}/api/offers/${createJson.offer.id}/toggle`, {
      method: 'PATCH'
    });
    assertEqual(toggleRes.status, 200, 'Toggle endpoint should return 200');
    const toggleJson = await toggleRes.json();
    assertEqual(toggleJson.offer.active, false, 'Offer active state should toggle to false');

    // 6. Clean up the test offer
    const deleteRes = await fetch(`${BASE_URL}/api/offers/${createJson.offer.id}`, {
      method: 'DELETE'
    });
    assertEqual(deleteRes.status, 200, 'DELETE /api/offers/:id should return 200');
  });

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n======================================================');
  console.log('  📊 TEST RESULTS SUMMARY');
  console.log('======================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Run : ${total}`);
  console.log(`Passed          : ${passed}`);
  console.log(`Failed          : ${failed}`);
  console.log(`Success Rate    : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.error('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(` - [${r.suite}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
