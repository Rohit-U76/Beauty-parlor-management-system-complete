import { Appointment, BlockedSlotWindow } from '../types';

/**
 * Salon 3-Hour / 4-Hour Standard Time Slots (9:00 AM to 10:00 PM)
 * Total window: 13 hours
 * Slot 1: 09:00 AM - 12:00 PM (3 hrs)
 * Slot 2: 12:00 PM - 03:00 PM (3 hrs)
 * Slot 3: 03:00 PM - 06:00 PM (3 hrs)
 * Slot 4: 06:00 PM - 10:00 PM (4 hrs)
 */
export const SALON_TIME_SLOTS = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 10:00 PM'
];

export const MAX_PARALLEL_CHAIRS = 3; // Maximum 3 bookings allowed per slot

export interface SlotMetadata {
  slot: string;
  startMinutes: number;
  endMinutes: number;
  durationHours: number;
  periodLabel: string;
  displayTitle: string;
}

export const SALON_SLOT_DETAILS: Record<string, SlotMetadata> = {
  '09:00 AM - 12:00 PM': {
    slot: '09:00 AM - 12:00 PM',
    startMinutes: 9 * 60,  // 540 min
    endMinutes: 12 * 60,   // 720 min
    durationHours: 3,
    periodLabel: 'Morning Batch',
    displayTitle: '09:00 AM - 12:00 PM (3 hrs)'
  },
  '12:00 PM - 03:00 PM': {
    slot: '12:00 PM - 03:00 PM',
    startMinutes: 12 * 60, // 720 min
    endMinutes: 15 * 60,   // 900 min
    durationHours: 3,
    periodLabel: 'Afternoon Batch',
    displayTitle: '12:00 PM - 03:00 PM (3 hrs)'
  },
  '03:00 PM - 06:00 PM': {
    slot: '03:00 PM - 06:00 PM',
    startMinutes: 15 * 60, // 900 min
    endMinutes: 18 * 60,   // 1080 min
    durationHours: 3,
    periodLabel: 'Late Afternoon Batch',
    displayTitle: '03:00 PM - 06:00 PM (3 hrs)'
  },
  '06:00 PM - 10:00 PM': {
    slot: '06:00 PM - 10:00 PM',
    startMinutes: 18 * 60, // 1080 min
    endMinutes: 22 * 60,   // 1320 min
    durationHours: 4,
    periodLabel: 'Evening & Night Batch',
    displayTitle: '06:00 PM - 10:00 PM (4 hrs)'
  }
};

export interface SlotAvailabilityInfo {
  slot: string;
  date: string;
  totalCapacity: number;
  bookedCount: number;
  pendingCount: number;
  confirmedCount: number;
  remainingSeats: number;
  occupancyPercent: number;
  status: 'AVAILABLE' | 'FILLING_FAST' | 'HIGH_DEMAND' | 'SOLD_OUT' | 'PEAK_POPULAR';
  isFillingFast: boolean;
  statusLabel: string;
  urgencyText: string;
  activeAppointments: Appointment[];
  isBlockedByAdmin?: boolean;
}

export interface DayAvailabilitySummary {
  date: string;
  isToday: boolean;
  isTomorrow: boolean;
  formattedDate: string;
  totalDailyCapacity: number;
  totalActiveBookings: number;
  totalPendingRequests: number;
  overallOccupancyPercent: number;
  fillingFastSlots: SlotAvailabilityInfo[];
  availableSlots: SlotAvailabilityInfo[];
  soldOutSlots: SlotAvailabilityInfo[];
  allSlots: SlotAvailabilityInfo[];
  isFullyBlockedByAdmin?: boolean;
  adminBlockReason?: string;
  peakPeriodAlert?: string;
  nextExpressSlot?: string;
  fastestAvailableSlot?: string;
}

/**
 * Normalized comparison for time slots (handles casing & minor whitespace)
 */
export function normalizeTimeSlot(slotStr: string): string {
  if (!slotStr) return '';
  return slotStr.trim().toUpperCase();
}

/**
 * Parse time string like "09:00 AM - 12:00 PM" or "07:30 PM" into start minutes from midnight (0 - 1439)
 */
export function parseSlotTimeToMinutes(slotStr: string): number {
  if (!slotStr) return 0;
  const norm = normalizeTimeSlot(slotStr);
  for (const [key, meta] of Object.entries(SALON_SLOT_DETAILS)) {
    if (normalizeTimeSlot(key) === norm) {
      return meta.startMinutes;
    }
  }
  const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Maps any legacy time string (e.g. "11:45 AM", "01:30 PM") to the canonical 3hr/4hr slot
 */
export function mapToCanonicalSlot(timeSlotStr: string): string {
  if (!timeSlotStr) return SALON_TIME_SLOTS[0];
  const norm = normalizeTimeSlot(timeSlotStr);
  const directMatch = SALON_TIME_SLOTS.find(s => normalizeTimeSlot(s) === norm);
  if (directMatch) return directMatch;

  const minutes = parseSlotTimeToMinutes(timeSlotStr);
  if (minutes < 720) return '09:00 AM - 12:00 PM';
  if (minutes < 900) return '12:00 PM - 03:00 PM';
  if (minutes < 1080) return '03:00 PM - 06:00 PM';
  return '06:00 PM - 10:00 PM';
}

/**
 * Returns current local date in YYYY-MM-DD format (avoids UTC timezone shift bug)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a slot on a specific date is blocked by the admin blackout/holiday settings.
 */
export function isSlotBlockedByAdmin(
  slotStr: string,
  dateStr: string,
  blockedWindows?: BlockedSlotWindow[],
  isOwnerOnBreakToday?: boolean
): { isBlocked: boolean; reason: string } {
  if (!slotStr || !dateStr) return { isBlocked: false, reason: '' };

  const todayStr = getLocalDateString();

  // 1. Quick Master Toggle: Owner taking break / Holiday today
  if (isOwnerOnBreakToday && dateStr === todayStr) {
    return {
      isBlocked: true,
      reason: 'Studio closed / Salon Holiday today'
    };
  }

  // 2. Custom Scheduled Blockout Windows / Holidays
  if (!blockedWindows || !Array.isArray(blockedWindows) || blockedWindows.length === 0) {
    return { isBlocked: false, reason: '' };
  }

  const normSlot = normalizeTimeSlot(slotStr);
  const canonicalSlot = mapToCanonicalSlot(slotStr);
  const slotMinutes = parseSlotTimeToMinutes(slotStr);

  for (const rule of blockedWindows) {
    // Only check active rules for the exact specified date
    if (!rule.active || rule.date !== dateStr) continue;

    // Full Day Blockout / Holiday
    if (rule.allDay) {
      return {
        isBlocked: true,
        reason: rule.reason || rule.title || 'Salon Holiday / Closed on this date'
      };
    }

    // Specific slot match
    if (rule.specificSlots && rule.specificSlots.length > 0) {
      const isMatch = rule.specificSlots.some(s => {
        const normRuleSlot = normalizeTimeSlot(s);
        return normRuleSlot === normSlot || mapToCanonicalSlot(s) === canonicalSlot;
      });
      if (isMatch) {
        return {
          isBlocked: true,
          reason: rule.reason || rule.title || 'Slot unavailable (Reserved / Holiday)'
        };
      }
    }

    // Time Range Blockout
    if (rule.startTime && rule.endTime) {
      const startMin = parseSlotTimeToMinutes(rule.startTime);
      const endMin = parseSlotTimeToMinutes(rule.endTime);

      if (startMin <= endMin) {
        if (slotMinutes >= startMin && slotMinutes <= endMin) {
          return {
            isBlocked: true,
            reason: rule.reason || rule.title || `Owner break (${rule.startTime} - ${rule.endTime})`
          };
        }
      } else {
        if (slotMinutes >= startMin || slotMinutes <= endMin) {
          return {
            isBlocked: true,
            reason: rule.reason || rule.title || `Owner break (${rule.startTime} - ${rule.endTime})`
          };
        }
      }
    }
  }

  return { isBlocked: false, reason: '' };
}

/**
 * Validates slot availability based on date, real current time constraints, and admin blackout rules.
 * Rule: For today, if current time is past or has reached the slot start time (e.g. 2 PM passes 9 AM and 12 PM),
 * that slot is marked UNAVAILABLE. Future slots are bookable.
 */
export function isSlotAvailableForDate(
  slotStr: string,
  dateStr: string,
  blockedWindows?: BlockedSlotWindow[],
  isOwnerOnBreakToday?: boolean
): boolean {
  if (!slotStr || !dateStr) return false;

  // Verify against Admin Blockout / Holiday rules
  const blockCheck = isSlotBlockedByAdmin(slotStr, dateStr, blockedWindows, isOwnerOnBreakToday);
  if (blockCheck.isBlocked) return false;

  const todayStr = getLocalDateString();
  if (dateStr < todayStr) return false;
  if (dateStr > todayStr) return true; // Future dates are fully bookable unless blocked by admin

  // For TODAY: compare current wall-clock time with slot start time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotStartMinutes = parseSlotTimeToMinutes(slotStr);

  // If current time has reached or passed the slot start time, it cannot be booked today
  return slotStartMinutes > currentMinutes;
}

/**
 * Calculates slot availability and chair occupancy metrics for a specific date and time slot.
 * Capacity is strictly MAX_PARALLEL_CHAIRS (3 bookings max per 3hr/4hr slot).
 */
export function getSlotAvailability(
  appointments: Appointment[],
  date: string,
  timeSlot: string,
  capacity: number = MAX_PARALLEL_CHAIRS,
  blockedWindows?: BlockedSlotWindow[],
  isOwnerOnBreakToday?: boolean
): SlotAvailabilityInfo {
  const normSlot = normalizeTimeSlot(timeSlot);
  const canonicalSlot = mapToCanonicalSlot(timeSlot);
  const todayStr = getLocalDateString();
  const isToday = date === todayStr;

  // Filter active appointments (Pending or Confirmed) that map to this slot
  const slotBookings = appointments.filter(apt => {
    const aptDate = (apt.date || '').split('T')[0].trim();
    const isSameDate = aptDate === date;
    const aptCanonical = mapToCanonicalSlot(apt.timeSlot);
    const isSameSlot = aptCanonical === canonicalSlot || normalizeTimeSlot(apt.timeSlot) === normSlot;
    const isActive = apt.bookingStatus === 'PENDING' || apt.bookingStatus === 'CONFIRMED' || apt.status === 'CONFIRMED';
    return isSameDate && isSameSlot && isActive;
  });

  const pendingCount = slotBookings.filter(a => a.bookingStatus === 'PENDING').length;
  const confirmedCount = slotBookings.filter(a => a.bookingStatus === 'CONFIRMED' || a.status === 'CONFIRMED').length;
  const bookedCount = slotBookings.length;
  let remainingSeats = Math.max(0, capacity - bookedCount);
  const occupancyPercent = Math.min(100, Math.round((bookedCount / capacity) * 100));

  // Check Admin Blockout / Holiday rules first
  const adminBlock = isSlotBlockedByAdmin(timeSlot, date, blockedWindows, isOwnerOnBreakToday);
  if (adminBlock.isBlocked) {
    return {
      slot: timeSlot,
      date,
      totalCapacity: capacity,
      bookedCount,
      pendingCount,
      confirmedCount,
      remainingSeats: 0,
      occupancyPercent: 100,
      status: 'SOLD_OUT',
      isFillingFast: false,
      statusLabel: 'Holiday / Closed',
      urgencyText: adminBlock.reason || 'Salon Holiday / Closed',
      activeAppointments: slotBookings,
      isBlockedByAdmin: true
    };
  }

  // Check if slot time has already passed today
  const slotTimeAllowed = isSlotAvailableForDate(timeSlot, date, blockedWindows, isOwnerOnBreakToday);

  let status: SlotAvailabilityInfo['status'] = 'AVAILABLE';
  let isFillingFast = false;
  let statusLabel = 'Available';
  let urgencyText = `${remainingSeats} chairs open`;

  if (!slotTimeAllowed && isToday) {
    status = 'SOLD_OUT';
    statusLabel = 'Time Passed';
    urgencyText = 'Slot time passed';
    remainingSeats = 0;
  } else if (remainingSeats === 0) {
    status = 'SOLD_OUT';
    statusLabel = 'Sold Out';
    urgencyText = 'Fully booked (0 chairs left)';
    isFillingFast = true;
  } else if (remainingSeats === 1) {
    status = 'FILLING_FAST';
    statusLabel = 'Filling Fast';
    urgencyText = pendingCount > 0 
      ? `🔥 Only 1 chair left (${pendingCount} pending hold)`
      : '🔥 Only 1 chair remaining!';
    isFillingFast = true;
  } else if (remainingSeats === 2) {
    status = 'AVAILABLE';
    statusLabel = '2 Chairs Left';
    urgencyText = '2 chairs open';
  } else {
    status = 'AVAILABLE';
    statusLabel = 'Available';
    urgencyText = '3 chairs open';
  }

  return {
    slot: timeSlot,
    date,
    totalCapacity: capacity,
    bookedCount,
    pendingCount,
    confirmedCount,
    remainingSeats,
    occupancyPercent,
    status,
    isFillingFast,
    statusLabel,
    urgencyText,
    activeAppointments: slotBookings,
    isBlockedByAdmin: false
  };
}

/**
 * Calculates a complete day summary for salon availability across the 4 standard slots
 */
export function getDayAvailabilitySummary(
  appointments: Appointment[],
  date: string,
  blockedWindows?: BlockedSlotWindow[],
  isOwnerOnBreakToday?: boolean
): DayAvailabilitySummary {
  const todayStr = getLocalDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const isToday = date === todayStr;
  const isTomorrow = date === tomorrowStr;

  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const allSlots: SlotAvailabilityInfo[] = SALON_TIME_SLOTS.map(slot =>
    getSlotAvailability(appointments, date, slot, MAX_PARALLEL_CHAIRS, blockedWindows, isOwnerOnBreakToday)
  );

  const fillingFastSlots = allSlots.filter(s => s.isFillingFast && s.status !== 'SOLD_OUT');
  const soldOutSlots = allSlots.filter(s => s.status === 'SOLD_OUT');
  const availableSlots = allSlots.filter(s => s.remainingSeats > 0);

  const isFullyBlockedByAdmin = allSlots.length > 0 && allSlots.every(s => s.isBlockedByAdmin);
  const adminBlockReason = allSlots.find(s => s.isBlockedByAdmin)?.urgencyText;

  const totalDailyCapacity = SALON_TIME_SLOTS.length * MAX_PARALLEL_CHAIRS; // 4 * 3 = 12 total seats
  const totalActiveBookings = allSlots.reduce((sum, s) => sum + s.bookedCount, 0);
  const totalPendingRequests = allSlots.reduce((sum, s) => sum + s.pendingCount, 0);
  const overallOccupancyPercent = Math.min(
    100,
    Math.round((totalActiveBookings / totalDailyCapacity) * 100)
  );

  // Night / evening peak alert
  const nightSlot = allSlots.find(s => s.slot.includes('06:00 PM'));
  let peakPeriodAlert: string | undefined;
  if (nightSlot && nightSlot.bookedCount >= 2 && !isFullyBlockedByAdmin) {
    peakPeriodAlert = `Evening/Night batch (06:00 PM - 10:00 PM) is ${Math.round((nightSlot.bookedCount / MAX_PARALLEL_CHAIRS) * 100)}% booked today. Book early!`;
  }

  // Next express available slot
  const nextExpressSlot = availableSlots[0]?.slot;
  const fastestAvailableSlot = availableSlots.find(s => s.remainingSeats >= 2)?.slot || nextExpressSlot;

  return {
    date,
    isToday,
    isTomorrow,
    formattedDate,
    totalDailyCapacity,
    totalActiveBookings,
    totalPendingRequests,
    overallOccupancyPercent,
    fillingFastSlots,
    availableSlots,
    soldOutSlots,
    allSlots,
    isFullyBlockedByAdmin,
    adminBlockReason,
    peakPeriodAlert,
    nextExpressSlot,
    fastestAvailableSlot
  };
}

/**
 * Gets real-time availability insight for service booking
 */
export function getServiceAvailabilityInsight(
  appointments: Appointment[],
  durationMinutes: number,
  selectedDate?: string,
  blockedWindows?: BlockedSlotWindow[],
  isOwnerOnBreakToday?: boolean
): {
  fillingFastSlotCount: number;
  highlightText: string;
  recommendedSlot?: string;
  isUrgent: boolean;
} {
  const dateToUse = selectedDate || getLocalDateString();
  const summary = getDayAvailabilitySummary(appointments, dateToUse, blockedWindows, isOwnerOnBreakToday);

  if (summary.isFullyBlockedByAdmin) {
    return {
      fillingFastSlotCount: 0,
      highlightText: `⚠️ ${summary.adminBlockReason || 'Salon Holiday / All Slots Closed'}`,
      recommendedSlot: undefined,
      isUrgent: false
    };
  }

  const fillingFastCount = summary.fillingFastSlots.length;
  
  if (fillingFastCount > 0) {
    const topFast = summary.fillingFastSlots[0];
    return {
      fillingFastSlotCount: fillingFastCount,
      highlightText: `🔥 ${topFast.slot} Filling Fast (${topFast.urgencyText})`,
      recommendedSlot: topFast.slot,
      isUrgent: true
    };
  }

  if (summary.nextExpressSlot) {
    return {
      fillingFastSlotCount: 0,
      highlightText: `🟢 Next Available Chair: ${summary.nextExpressSlot}`,
      recommendedSlot: summary.nextExpressSlot,
      isUrgent: false
    };
  }

  return {
    fillingFastSlotCount: 0,
    highlightText: '🟢 All slots open for advance booking (9 AM - 10 PM)',
    recommendedSlot: SALON_TIME_SLOTS[0],
    isUrgent: false
  };
}
