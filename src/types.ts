export type GenderTarget = 'women' | 'men' | 'unisex';

export type ServiceCategory = 
  | 'Make Up'
  | 'Skin Services'
  | 'Hair Services'
  | 'Color Services'
  | 'Hair Chemical Services'
  | 'Hair Care & Styling'
  | 'Skin & Facial Therapy'
  | 'Bridal & Pre-Bridal'
  | "Men's Executive Grooming"
  | 'Nail Art & Extensions'
  | 'Spa & Body Treatments';

export interface PriceTierVariant {
  label: string;
  price: number;
  durationMinutes?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  gender: GenderTarget;
  durationMinutes: number;
  price: number;
  priceDisplay?: string; // e.g. "₹2,000 / ₹2,500" or "₹150 / ₹300 / ₹600"
  tierOptions?: PriceTierVariant[];
  advanceDeposit: number; // 10% of base price
  description: string;
  imageUrl: string;
  popular?: boolean;
  rating: number;
  reviewsCount: number;
  benefits: string[];
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';

export interface VerifiedBankDeposit {
  id: string;
  utr: string;
  amount: number;
  sender: string;
  bankName: string;
  rawMessage: string;
  receivedAt: string;
  matchedAppointmentId?: string;
  matchedBookingRef?: string;
  status: 'UNCLAIMED' | 'MATCHED';
}

export interface Appointment {
  id: string;
  userId?: string;
  bookingRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  stylistName: string;
  totalAmount: number;
  advancePaid: number; // 10% deposit
  balanceDue: number; // 90% remaining
  paymentStatus: PaymentStatus;
  bookingStatus: AppointmentStatus;
  status?: AppointmentStatus;
  upiTransactionId?: string; // 12-digit UPI UTR Reference Number
  paymentMethod?: string; // e.g. "Direct Bank UPI / Scanner"
  scannerUsed?: string; // e.g. "MODERN JENTS PARLOUR" or "DINESH VITTHAL GHODAKE"
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  notes?: string;
  isNew?: boolean;
  whatsappUrl?: string;
  ownerWhatsappUrl?: string;
  bankVerifiedAt?: string;
  bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'SIMULATOR';
  bankName?: string;
  holdExpiresAt?: string;
  isBankVerified?: boolean;
  paymentScreenshotUrl?: string;
  verifiedBankName?: string;
  cancelReason?: string;
}

export type InquiryStatus = 'NEW' | 'IN PROGRESS' | 'RESOLVED';

export interface ContactInquiry {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  subject: string;
  serviceCategory?: string;
  message: string;
  status: InquiryStatus;
  receivedDate: string;
  ownerReply?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  favoriteService: string;
  memberSince: string;
  tier: 'Standard' | 'VIP Member' | 'New Client';
}

export interface Review {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  rating: number; // 1-5 overall
  serviceName: string;
  category?: string;
  comment: string;
  date: string;
  verifiedBooking: boolean;
  avatarUrl?: string;
  bookingRef?: string;
  stylistName?: string;
  // Detailed Satisfaction Aspect Sub-ratings (1-5)
  hygieneRating?: number;
  stylistSkillRating?: number;
  punctualityRating?: number;
  valueRating?: number;
  recommend?: boolean;
  npsScore?: number; // 0-10
  tags?: string[];
  ownerReply?: string;
  ownerReplyDate?: string;
  featured?: boolean;
  sentiment?: 'positive' | 'neutral' | 'critical';
  status?: 'published' | 'under_review' | 'resolved';
  helpfulCount?: number;
}

export interface OfferCoupon {
  id: string;
  code: string;
  title: string;
  discountPercent?: number;
  discountAmount?: number;
  minBookingAmount: number;
  validTill: string;
  description: string;
  active: boolean;
  expiryDate?: string;
}

export interface WhatsAppBroadcastRecipient {
  id: string;
  name: string;
  phone: string;
  formattedPhone: string;
  whatsappUrl: string;
  webWhatsappUrl: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  source: 'customer' | 'appointment' | 'user' | 'inquiry' | string;
}

export interface WhatsAppBroadcastLog {
  id: string;
  offerId: string;
  offerCode: string;
  offerTitle: string;
  discountPercent?: number;
  discountAmount?: number;
  dispatchedAt: string;
  totalRecipients: number;
  messageText: string;
  recipients: WhatsAppBroadcastRecipient[];
}

export type OfferItem = OfferCoupon;

export type GalleryCategory = 
  | 'All'
  | 'Bridal'
  | 'Hair Care'
  | 'Skin Care'
  | 'Salon Interior'
  | 'Nail Art'
  | 'Spa'
  | 'Men Grooming';

export type MediaFormat = 'image' | 'video';

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  category: GalleryCategory;
  tag: string;
  imageUrl: string;
  mediaType?: MediaFormat;
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'inquiry' | 'payment' | 'system' | 'review';
  timestamp: string;
  read: boolean;
}

export interface BlockedSlotWindow {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startTime?: string; // e.g. "01:30 PM"
  endTime?: string; // e.g. "06:00 PM"
  specificSlots?: string[];
  active: boolean;
  reason?: string;
  createdAt: string;
}

export interface SalonSettings {
  salonName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  advancePercentage: number; // default 10
  currencySymbol: string;
  accountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankAccountType?: string;
  merchantUpiId?: string; // Scanner 1 VPA (PhonePe / HDFC Bank: ghodakedinesh@ybl)
  upiId?: string; // Scanner 1 VPA alias
  upiQrCodeUrl?: string; // Scanner 1 QR poster image URL
  secondaryUpiId?: string; // Scanner 2 VPA (e.g. 8104026257@axl)
  secondaryAccountHolder?: string;
  secondaryUpiQrCodeUrl?: string; // Scanner 2 QR poster image URL
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  paymentGatewayMode?: 'live' | 'test';
  bookingAutoConfirm: boolean;
  instagramUrl?: string;
  mapsUrl?: string;
  gstNumber?: string;
  staffType?: string;
  adminPassword?: string;
  adminPasswordUpdatedAt?: number;
  adminPin?: string;
  adminEmails?: string[];
  blockedWindows?: BlockedSlotWindow[];
  isOwnerOnBreakToday?: boolean;
  breakNoticeMessage?: string;
}

export interface SalonPolicyItem {
  id: string;
  iconName: string;
  title: string;
  summary: string;
  points: string[];
}

export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  pin?: string;
  avatarUrl?: string;
  googleId?: string;
  emailVerified?: boolean;
  memberTier?: 'Standard' | 'VIP Member' | 'New Client' | 'Silver VIP' | 'Owner Admin';
  loyaltyPoints?: number;
  totalVisits?: number;
  memberSince?: string;
  preferredServices?: string[];
  gender?: 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say' | string;
  birthDate?: string;
  anniversaryDate?: string;
  preferredStylist?: string;
  skinOrHairType?: string;
  specialNotes?: string;
  address?: string;
  city?: string;
  emergencyContact?: string;
  allergies?: string;
  preferredSlot?: string;
  favoriteCategory?: string;
  whatsappNotifications?: boolean;
  emailNotifications?: boolean;
}

export type ThemeMode = 'dark' | 'light';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: 'Hair Care' | 'Skin & Facial' | 'Bridal & Makeup' | 'Men Grooming' | 'Spa & Wellness';
  experience: string;
  phone?: string;
  email?: string;
  specialties: string[];
  certifications?: string[];
  rating: number;
  reviewsCount: number;
  totalClients: number;
  shiftHours: string;
  status: 'Active' | 'Available Today' | 'On Leave';
  bio: string;
  image: string;
}
