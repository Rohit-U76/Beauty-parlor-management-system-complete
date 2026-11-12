import { Appointment } from '../types';

/**
 * Parse an appointment date (YYYY-MM-DD or MM/DD/YYYY) and time slot (e.g., "02:30 PM", "11:45 AM")
 * into a valid JavaScript Date object.
 */
export function parseAppointmentDateTime(dateStr: string, timeSlotStr?: string): Date {
  if (!dateStr) return new Date();

  let hours = 11;
  let minutes = 0;

  if (timeSlotStr) {
    const cleanTime = timeSlotStr.trim();
    const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const modifier = match[3] ? match[3].toUpperCase() : 'AM';
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
    }
  }

  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        // DD-MM-YYYY
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/').map(Number);
    if (parts.length === 3) {
      if (parts[0] > 1000) {
        // YYYY/MM/DD
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else if (parts[2] > 1000) {
        // MM/DD/YYYY or DD/MM/YYYY
        if (parts[0] <= 12 && parts[1] > 12) {
          month = parts[0];
          day = parts[1];
          year = parts[2];
        } else if (parts[0] > 12 && parts[1] <= 12) {
          day = parts[0];
          month = parts[1];
          year = parts[2];
        } else {
          // Default MM/DD/YYYY (standard in browser date inputs)
          month = parts[0];
          day = parts[1];
          year = parts[2];
        }
      }
    }
  }

  if (year && month !== undefined && day !== undefined && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
    return new Date(year, month - 1, day, hours, minutes, 0);
  }

  const fallbackDate = new Date(dateStr);
  if (!isNaN(fallbackDate.getTime())) {
    fallbackDate.setHours(hours, minutes, 0, 0);
    return fallbackDate;
  }

  return new Date();
}

/**
 * Calculate the time difference and whether an appointment falls into upcoming windows.
 * Reference date defaults to current client time.
 */
export function getAppointmentReminderInfo(
  apt: Appointment,
  referenceDate: Date = new Date()
): {
  appointmentDate: Date;
  hoursUntil: number;
  isUpcoming: boolean;
  isUpcoming24h: boolean;
  isPast: boolean;
  timeLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
  formattedDateStr: string;
  badgeLabel: string;
  headingLabel: string;
  relativeScheduleText: string;
} {
  const appointmentDate = parseAppointmentDateTime(apt.date, apt.timeSlot);
  const diffMs = appointmentDate.getTime() - referenceDate.getTime();
  const hoursUntil = diffMs / (1000 * 60 * 60);

  // Check if date is today, tomorrow, or future relative to referenceDate
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const aptYear = appointmentDate.getFullYear();
  const aptMonth = appointmentDate.getMonth();
  const aptDay = appointmentDate.getDate();

  // Compare calendar days accurately using midnight timestamps
  const refMidnight = new Date(refYear, refMonth, refDay).getTime();
  const aptMidnight = new Date(aptYear, aptMonth, aptDay).getTime();
  const dayDifference = Math.round((aptMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  const isToday = dayDifference === 0;
  const isTomorrow = dayDifference === 1;

  // An appointment is completed or cancelled
  const isCancelledOrDone =
    apt.bookingStatus === 'CANCELLED' ||
    apt.bookingStatus === 'COMPLETED' ||
    (apt as any).status === 'CANCELLED' ||
    (apt as any).status === 'COMPLETED';

  // An appointment has passed if:
  // 1. Scheduled on a previous calendar day (dayDifference < 0)
  // 2. Scheduled for today, but its start time slot has already passed (isToday && diffMs < 0)
  // 3. Already marked completed or cancelled
  const isPast = dayDifference < 0 || (isToday && diffMs < 0) || isCancelledOrDone;

  // An appointment is truly upcoming ONLY if not done and scheduled date/time is in the future
  const isUpcoming = !isCancelledOrDone && !isPast && diffMs >= 0 && dayDifference >= 0;

  // 24-hour upcoming window (for near-term alerts/notifications)
  const isUpcoming24h = isUpcoming && (
    (hoursUntil >= 0 && hoursUntil <= 36) ||
    isTomorrow ||
    isToday
  );

  // Format date nicely (e.g. "Sat, Oct 24, 2026")
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  const formattedDateStr = appointmentDate.toLocaleDateString('en-US', options);

  let timeLabel = '';
  let badgeLabel = '⏰ Salon Reminder';
  let headingLabel = 'Upcoming Appointment';
  let relativeScheduleText = '';

  if (isPast) {
    badgeLabel = 'Past Appointment';
    if (isToday) {
      headingLabel = 'Past Appointment Earlier Today';
      timeLabel = `Earlier today at ${apt.timeSlot}`;
      relativeScheduleText = `was scheduled for earlier today at ${apt.timeSlot} (time has passed)`;
    } else {
      headingLabel = `Past Appointment on ${formattedDateStr}`;
      timeLabel = `${formattedDateStr} at ${apt.timeSlot}`;
      relativeScheduleText = `was scheduled for ${formattedDateStr} at ${apt.timeSlot}`;
    }
  } else if (isToday) {
    badgeLabel = "⏰ Today's Salon Reminder";
    headingLabel = 'Upcoming Appointment Today';
    if (hoursUntil <= 0.25) {
      const minsLeft = Math.max(1, Math.round(hoursUntil * 60));
      timeLabel = 'Starting shortly';
      relativeScheduleText = `is starting very shortly at ${apt.timeSlot} (in ~${minsLeft} mins)`;
    } else if (hoursUntil <= 1) {
      const minsLeft = Math.round(hoursUntil * 60);
      timeLabel = 'In less than 1 hour';
      relativeScheduleText = `is scheduled in less than 1 hour (Today at ${apt.timeSlot}, in ~${minsLeft} mins)`;
    } else {
      const roundedHours = Math.max(1, Math.round(hoursUntil));
      timeLabel = `Today at ${apt.timeSlot}`;
      relativeScheduleText = `is scheduled for today at ${apt.timeSlot} (in ~${roundedHours} hours)`;
    }
  } else if (isTomorrow) {
    badgeLabel = "⏰ Tomorrow's Salon Reminder";
    headingLabel = 'Upcoming Appointment Tomorrow';
    const roundedHours = Math.max(1, Math.round(hoursUntil));
    timeLabel = `Tomorrow at ${apt.timeSlot}`;
    relativeScheduleText = `is scheduled for tomorrow at ${apt.timeSlot} (in ~${roundedHours} hours)`;
  } else if (dayDifference > 1) {
    badgeLabel = '📅 Upcoming Appointment';
    headingLabel = `Upcoming Appointment on ${formattedDateStr}`;
    timeLabel = `${formattedDateStr} at ${apt.timeSlot}`;
    relativeScheduleText = `is scheduled for ${formattedDateStr} at ${apt.timeSlot} (in ${dayDifference} days)`;
  } else {
    badgeLabel = '⏰ Salon Reminder';
    headingLabel = 'Upcoming Appointment';
    timeLabel = `${formattedDateStr} at ${apt.timeSlot}`;
    relativeScheduleText = `is scheduled for ${formattedDateStr} at ${apt.timeSlot}`;
  }

  return {
    appointmentDate,
    hoursUntil,
    isUpcoming,
    isUpcoming24h,
    isPast,
    timeLabel,
    isToday,
    isTomorrow,
    formattedDateStr,
    badgeLabel,
    headingLabel,
    relativeScheduleText
  };
}

/**
 * Generate Google Calendar URL for an appointment
 */
export function generateGoogleCalendarUrl(apt: Appointment, salonAddress = 'Smart Salon & Spa, MG Road, Indiranagar, Bengaluru'): string {
  const start = parseAppointmentDateTime(apt.date, apt.timeSlot);
  // Default duration 60 mins
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const formatIsoUtc = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const title = encodeURIComponent(`Salon Appointment: ${apt.serviceName} with ${apt.stylistName}`);
  const details = encodeURIComponent(
    `Your appointment at Smart Salon is confirmed.\n\nBooking ID: ${apt.bookingRef}\nService: ${apt.serviceName}\nStylist: ${apt.stylistName}\nPayment: 10% Advance Paid (₹${apt.advancePaid}), Balance Due: ₹${apt.balanceDue}\nVenue: ${salonAddress}\n\nPlease arrive 10 minutes prior.`
  );
  const location = encodeURIComponent(salonAddress);
  const dates = `${formatIsoUtc(start)}/${formatIsoUtc(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Download .ICS file for Apple / Outlook / Mobile calendars
 */
export function downloadIcsCalendarFile(apt: Appointment, salonAddress = 'Smart Salon & Spa, MG Road, Indiranagar, Bengaluru') {
  const start = parseAppointmentDateTime(apt.date, apt.timeSlot);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Salon AI//Appointment Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${apt.bookingRef}-${apt.id}@smartsalon.ai`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Smart Salon: ${apt.serviceName} (${apt.stylistName})`,
    `DESCRIPTION:Appointment Ref: ${apt.bookingRef}\\nService: ${apt.serviceName}\\nStylist: ${apt.stylistName}\\nBalance Due at Salon: Rs.${apt.balanceDue}`,
    `LOCATION:${salonAddress}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Salon Appointment in 24 Hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Salon_Appointment_${apt.bookingRef}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Play a soothing luxury sound chime when notification appears
 */
export function playLuxuryNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone (G5 - 783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second harmonic tone (B5 - 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.8);
  } catch (e) {
    // Audio context may be restricted by browser until user gesture
  }
}
