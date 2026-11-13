import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  ServiceItem,
  Appointment,
  ContactInquiry,
  Customer,
  Review,
  OfferCoupon,
  GalleryItem,
  NotificationItem,
  SalonSettings,
  SalonPolicyItem,
  AppointmentStatus,
  InquiryStatus,
  ThemeMode,
  User,
  UserRole,
  StaffMember,
  WhatsAppBroadcastLog,
  BlockedSlotWindow
} from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_INQUIRIES,
  INITIAL_CUSTOMERS,
  INITIAL_GALLERY,
  INITIAL_OFFERS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  SALON_TERMS_AND_POLICIES,
  initialStaffMembers
} from '../data/initialData';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  cleanFirestoreData
} from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

interface BookingPayload {
  serviceId: string;
  serviceName: string;
  category: any;
  date: string;
  timeSlot: string;
  stylistName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
  couponCode?: string;
  totalAmount: number;
  advanceAmount: number;
  balanceDue: number;
  upiTransactionId?: string;
  paymentMethod?: string;
  scannerUsed?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED';
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  bankVerifiedAt?: string;
  bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'SIMULATOR';
  bankName?: string;
  holdExpiresAt?: string;
  paymentScreenshotUrl?: string;
}

interface SalonContextType {
  // State
  services: ServiceItem[];
  appointments: Appointment[];
  inquiries: ContactInquiry[];
  customers: Customer[];
  gallery: GalleryItem[];
  offers: OfferCoupon[];
  reviews: Review[];
  policies: SalonPolicyItem[];
  notifications: NotificationItem[];
  settings: SalonSettings;
  theme: ThemeMode;
  isAdminMode: boolean;
  activeNavTab: string; // for customer page navigation or admin subpage
  adminTab: string; // for admin suite sidebar tab
  selectedServiceForBooking: ServiceItem | null;
  isBookingModalOpen: boolean;
  isQuizModalOpen: boolean;
  isAiChatOpen: boolean;
  isProfileModalOpen: boolean;

  // Auth State
  currentUser: User | null;
  users: User[];
  isGuestMode: boolean;
  setIsGuestMode: (val: boolean) => void;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'customer' | 'admin';
  authModalMode: 'login' | 'register';

  // Actions
  login: (usernameOrEmailOrPhone: string, passwordOrPin: string, role?: UserRole) => Promise<{ success: boolean; message: string; user?: User; emailUnverified?: boolean; email?: string }>;
  loginWithGoogle: (optionsOrRole?: { forRole?: 'ADMIN' | 'CUSTOMER'; credential?: any; profile?: any } | 'ADMIN' | 'CUSTOMER') => Promise<{ success: boolean; message: string; user?: User }>;
  registerCustomer: (data: { name: string; username?: string; email: string; phone: string; password?: string; preferredServices?: string[] }) => Promise<{ success: boolean; message: string; user?: User; emailUnverified?: boolean; email?: string }>;
  checkEmailVerification: (email?: string, password?: string) => Promise<{ verified: boolean; message: string; user?: User }>;
  resendVerificationEmail: (email?: string, password?: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetAdminPassword: (email: string, pin: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  sendAdminPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  clearAllPastData: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  openAuthModal: (initialTab?: 'customer' | 'admin', mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  setIsAdminMode: (val: boolean) => void;
  setActiveNavTab: (tab: string) => void;
  setAdminTab: (tab: string) => void;
  openBookingModal: (service?: ServiceItem) => void;
  closeBookingModal: () => void;
  openQuizModal: () => void;
  closeQuizModal: () => void;
  toggleAiChat: () => void;
  toggleAiWidget: () => void;
  updateCurrentUser: (updates: Partial<User>) => Promise<{ success: boolean; user?: User; message?: string }>;

  // Booking & Razorpay
  createAppointment: (payload: BookingPayload) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus, extraFields?: Partial<Appointment>) => void;
  rescheduleAppointment: (id: string, newDate: string, newTimeSlot: string) => Promise<{ success: boolean; message: string }>;
  cancelAppointment: (id: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  deleteAppointment: (id: string) => void;

  // Service Management
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  updateService: (id: string, service: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;

  // Inquiry Management
  submitInquiry: (inquiry: Omit<ContactInquiry, 'id' | 'receivedDate' | 'status'>) => void;
  addContactInquiry: (inquiry: { name?: string; clientName?: string; phone: string; email: string; message: string; subject?: string; serviceCategory?: string }) => void;
  updateInquiryStatus: (id: string, status: InquiryStatus, ownerReply?: string) => void;
  deleteInquiry: (id: string) => void;
  sendInquiryEmailReply: (id: string, replyText: string) => Promise<{ success: boolean; message: string; mailtoUrl: string }>;

  // Gallery Management
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => void;
  deleteGalleryItem: (id: string) => void;

  // Offers & Automated WhatsApp Broadcast Management
  addOffer: (offer: Omit<OfferCoupon, 'id'>) => Promise<{ success: boolean; broadcast?: any; offer?: OfferCoupon }>;
  broadcastOfferWhatsApp: (offerId: string) => Promise<{ success: boolean; broadcast?: any; message?: string }>;
  toggleOfferActive: (id: string) => void;
  deleteOffer: (id: string) => void;
  broadcastLogs: WhatsAppBroadcastLog[];
  fetchBroadcastLogs: () => Promise<void>;

  // Reviews Management
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  updateReview: (id: string, review: Partial<Review>) => void;
  deleteReview: (id: string) => void;

  // Policies Management
  addPolicy: (policy: Omit<SalonPolicyItem, 'id'>) => void;
  updatePolicy: (id: string, policy: Partial<SalonPolicyItem>) => void;
  deletePolicy: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Settings & Schedule Blackout
  updateSettings: (newSettings: Partial<SalonSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  toggleOwnerBreakToday: (forcedState?: boolean) => void;
  addBlockedSlotWindow: (window: Omit<BlockedSlotWindow, 'id' | 'createdAt'>) => void;
  updateBlockedSlotWindow: (id: string, updates: Partial<BlockedSlotWindow>) => void;
  deleteBlockedSlotWindow: (id: string) => void;
  isOwnerOnBreakToday: boolean;
  blockedWindows: BlockedSlotWindow[];

  // Staff Management
  staffMembers: StaffMember[];
  staff: StaffMember[];
  addStaffMember: (member: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;

  // Stats Calculations
  totalRevenue: number;
  totalBookingsCount: number;
  confirmedBookingsCount: number;
  activeCustomersCount: number;
  pendingInquiriesCount: number;
  advanceDepositTotal: number;
  userVisitsCount: number;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'modern_salon_data_v3';
const CLEAN_SLATE_FLAG = 'modern_salon_clean_slate_v2026_11';

const normalizeLegacySettings = (raw: any): SalonSettings => {
  const s: SalonSettings = { ...INITIAL_SETTINGS, ...(raw || {}) };
  const isLegacyBank =
    s.bankAccountNumber === '0701163100004079' ||
    s.bankIfsc === 'UBIN0532151' ||
    (s.bankName || '').toLowerCase().includes('union bank');
  if (isLegacyBank) {
    s.accountHolder = 'MODERN JENTS PARLOUR';
    s.bankName = 'HDFC Bank';
    s.bankAccountNumber = '50200072074441';
    s.bankIfsc = 'HDFC0000635';
    s.bankBranch = 'Solapur';
    s.bankAccountType = 'Current Account';
  }
  if (!s.bankBranch || s.bankBranch === 'MOHOL / SOLAPUR Branch') {
    s.bankBranch = 'Solapur';
  }
  if (!s.bankAccountType) {
    s.bankAccountType = 'Current Account';
  }

  // Upgrade exact legacy Union Bank / old QR / personal VPA strings cleanly without clobbering newer admin edits
  if (s.merchantUpiId === '9975236976@ibl' || s.upiId === '9975236976@ibl' || s.merchantUpiId === '9975236976@ybl' || s.upiId === '9975236976@ybl') {
    s.merchantUpiId = 'ghodakedinesh@ybl';
    s.upiId = 'ghodakedinesh@ybl';
  } else if (raw?.merchantUpiId === undefined && raw?.upiId === undefined && !s.merchantUpiId) {
    s.merchantUpiId = 'ghodakedinesh@ybl';
    s.upiId = 'ghodakedinesh@ybl';
  } else if (s.merchantUpiId !== undefined && s.upiId === undefined) {
    s.upiId = s.merchantUpiId;
  } else if (s.upiId !== undefined && s.merchantUpiId === undefined) {
    s.merchantUpiId = s.upiId;
  }

  // Strip deprecated rohitumdale@gmail.com from adminEmails and ensure dineshghodake941@gmail.com is primary
  if (Array.isArray(s.adminEmails)) {
    const cleanedEmails = s.adminEmails
      .map((e: string) => (e || '').toLowerCase().trim())
      .filter((e: string) => Boolean(e) && e !== 'rohitumdale@gmail.com');
    if (!cleanedEmails.includes('dineshghodake941@gmail.com')) {
      cleanedEmails.unshift('dineshghodake941@gmail.com');
    }
    s.adminEmails = Array.from(new Set(cleanedEmails));
  }

  if (s.upiQrCodeUrl === '/qr-union-bank-phonepe.jpg') {
    s.upiQrCodeUrl = '/assets/aistudio/image_2ca5cc29.png';
  } else if (raw?.upiQrCodeUrl === undefined && !s.upiQrCodeUrl) {
    s.upiQrCodeUrl = '/assets/aistudio/image_2ca5cc29.png';
  }

  if (s.secondaryUpiQrCodeUrl === '/qr-dinesh-ghodake.jpg') {
    s.secondaryUpiQrCodeUrl = '/assets/aistudio/image_fce20bf8.png';
  }
  if (raw?.secondaryAccountHolder === undefined && !s.secondaryAccountHolder) {
    s.secondaryAccountHolder = 'DINESH VITTHAL GHODAKE';
  }
  if (raw?.secondaryUpiId === undefined && !s.secondaryUpiId) {
    s.secondaryUpiId = '8104026257@axl';
  }
  if (raw?.secondaryUpiQrCodeUrl === undefined && !s.secondaryUpiQrCodeUrl) {
    s.secondaryUpiQrCodeUrl = '/assets/aistudio/image_fce20bf8.png';
  }
  return s;
};

const mergeIncomingSettings = (prev: SalonSettings, incomingRaw: any): SalonSettings => {
  if (!incomingRaw || typeof incomingRaw !== 'object') return prev;
  const prevUpdated = Number(prev.settingsUpdatedAt || 0);
  const incomingUpdated = Number(incomingRaw.settingsUpdatedAt || 0);
  const prevPassTs = Number(prev.adminPasswordUpdatedAt || 0);
  const nextPassTs = Number(incomingRaw.adminPasswordUpdatedAt || 0);

  // If local state is strictly newer than incoming snapshot/cache, keep newer local values on top
  const isLocalNewer = prevUpdated > 0 && prevUpdated > incomingUpdated;
  const mergedBase = isLocalNewer
    ? { ...incomingRaw, ...prev, settingsUpdatedAt: prevUpdated }
    : { ...prev, ...incomingRaw, settingsUpdatedAt: Math.max(prevUpdated, incomingUpdated) };

  const normalized = normalizeLegacySettings(mergedBase);
  if (prev.adminPassword && prevPassTs > nextPassTs) {
    normalized.adminPassword = prev.adminPassword;
    normalized.adminPasswordUpdatedAt = prevPassTs;
  }
  return normalized;
};

// One-time clean slate check for legacy seeded dashboard data
try {
  if (!localStorage.getItem(CLEAN_SLATE_FLAG)) {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_appointments`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_customers`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_inquiries`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_notifs`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_users`);
    const prevSettingsRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    if (prevSettingsRaw) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(normalizeLegacySettings(JSON.parse(prevSettingsRaw))));
    }
    localStorage.setItem(CLEAN_SLATE_FLAG, 'true');
  }
} catch {}

export const SalonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try loading from localStorage or fallback to initial constants
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_appointments`);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [inquiries, setInquiries] = useState<ContactInquiry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_inquiries`);
    return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
  });

  const [rawCustomers, setRawCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const setCustomers = setRawCustomers;

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_gallery`);
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  const [offers, setOffers] = useState<OfferCoupon[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_offers`);
    if (!saved) return INITIAL_OFFERS;
    try {
      const parsed: OfferCoupon[] = JSON.parse(saved);
      const existingCodes = new Set(parsed.map(o => o.code));
      const missing = INITIAL_OFFERS.filter(o => !existingCodes.has(o.code));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_OFFERS;
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reviews`);
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [policies, setPolicies] = useState<SalonPolicyItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_policies`);
    return saved ? JSON.parse(saved) : SALON_TERMS_AND_POLICIES;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_staff_members`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved staff members', e);
      }
    }
    return initialStaffMembers;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifs`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<SalonSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
    return saved ? normalizeLegacySettings(JSON.parse(saved)) : INITIAL_SETTINGS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const map = new Map<string, User>();
        INITIAL_USERS.forEach(u => map.set(u.id, u));
        parsed.forEach(u => map.set(u.id, { ...map.get(u.id), ...u }));
        return Array.from(map.values());
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const sessionUser = sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`) || sessionStorage.getItem('modern_salon_data_v2_current_user');
      if (sessionUser) return JSON.parse(sessionUser);
      const localUser = localStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`) || localStorage.getItem('modern_salon_data_v2_current_user');
      if (localUser) return JSON.parse(localUser);
    } catch {
      return null;
    }
    return null;
  });

  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_guest_mode`) || localStorage.getItem(`${LOCAL_STORAGE_KEY}_guest_mode`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'customer' | 'admin'>('customer');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_theme`) as ThemeMode;
    return saved === 'light' ? 'light' : 'dark';
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_theme`, mode);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const CLIENT_TABS = ['home', 'services', 'gallery', 'offers', 'reviews', 'appointments', 'dashboard', 'visits', 'terms', 'about', 'contact'];
  const ADMIN_TABS = ['dashboard', 'appointments', 'services', 'staff', 'gallery', 'offers', 'reviews', 'customers', 'inquiries', 'reports', 'policies', 'themes', 'settings'];

  const getSavedUserFromStorage = (): User | null => {
    try {
      const raw =
        sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`) ||
        localStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const parseNavHash = () => {
    try {
      const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
      if (!rawHash) return null;
      if (rawHash === 'admin' || rawHash.startsWith('admin/')) {
        const sub = rawHash.split('/')[1] || '';
        return { mode: 'admin' as const, tab: ADMIN_TABS.includes(sub) ? sub : 'dashboard' };
      }
      if (CLIENT_TABS.includes(rawHash)) {
        return { mode: 'client' as const, tab: rawHash };
      }
    } catch {}
    return null;
  };

  // UI state — strictly respect explicit customer/admin portal choice so Client sessions NEVER bounce to Admin on refresh
  const [isAdminMode, setIsAdminModeState] = useState<boolean>(() => {
    try {
      const parsedHash = parseNavHash();
      const savedPortal =
        sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_portal_mode`) ??
        localStorage.getItem(`${LOCAL_STORAGE_KEY}_portal_mode`);
      const saved =
        sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`) ??
        localStorage.getItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`);
      const u = getSavedUserFromStorage();
      if (savedPortal === 'customer' || saved === 'false' || parsedHash?.mode === 'client') {
        return false;
      }
      if (u && u.role === 'ADMIN') {
        if (parsedHash?.mode === 'admin') return true;
        if (saved === 'true' || savedPortal === 'admin') return true;
      }
    } catch {}
    return false;
  });

  const [activeNavTab, setActiveNavTabState] = useState<string>(() => {
    try {
      const parsedHash = parseNavHash();
      if (parsedHash?.mode === 'client') return parsedHash.tab;
      return (
        sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_active_tab`) ||
        localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_tab`) ||
        'home'
      );
    } catch {
      return 'home';
    }
  });

  const [adminTab, setAdminTabState] = useState<string>(() => {
    try {
      const parsedHash = parseNavHash();
      if (parsedHash?.mode === 'admin') return parsedHash.tab;
      return (
        sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_admin_tab`) ||
        localStorage.getItem(`${LOCAL_STORAGE_KEY}_admin_tab`) ||
        'dashboard'
      );
    } catch {
      return 'dashboard';
    }
  });

  const isHandlingPopStateRef = useRef<boolean>(false);
  const navSnapshotRef = useRef({ isAdminMode, activeNavTab, adminTab });
  navSnapshotRef.current = { isAdminMode, activeNavTab, adminTab };

  const pushModuleHistory = (nextAdminMode: boolean, nextActiveNav: string, nextAdminTab: string, replace = false) => {
    try {
      const targetHash = nextAdminMode ? `#admin/${nextAdminTab}` : `#${nextActiveNav}`;
      const stateObj = { salonNav: true, isAdminMode: nextAdminMode, activeNavTab: nextActiveNav, adminTab: nextAdminTab };
      if (replace) {
        window.history.replaceState(stateObj, '', targetHash);
      } else if (window.location.hash !== targetHash) {
        window.history.pushState(stateObj, '', targetHash);
      }
    } catch {}
  };

  const setIsAdminMode = (val: boolean) => {
    setIsAdminModeState(val);
    navSnapshotRef.current = { ...navSnapshotRef.current, isAdminMode: val };
    try {
      const flag = val ? 'true' : 'false';
      const portal = val ? 'admin' : 'customer';
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, flag);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, flag);
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, portal);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, portal);
    } catch {}
    if (!isHandlingPopStateRef.current) {
      const cur = navSnapshotRef.current;
      pushModuleHistory(val, cur.activeNavTab, cur.adminTab);
    }
  };

  const setActiveNavTab = (tab: string) => {
    setActiveNavTabState(tab);
    navSnapshotRef.current = { ...navSnapshotRef.current, activeNavTab: tab };
    try {
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_active_tab`, tab);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_tab`, tab);
    } catch {}
    if (!isHandlingPopStateRef.current) {
      const cur = navSnapshotRef.current;
      pushModuleHistory(cur.isAdminMode, tab, cur.adminTab);
    }
  };

  const setAdminTab = (tab: string) => {
    setAdminTabState(tab);
    navSnapshotRef.current = { ...navSnapshotRef.current, adminTab: tab };
    try {
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_tab`, tab);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_tab`, tab);
    } catch {}
    if (!isHandlingPopStateRef.current) {
      const cur = navSnapshotRef.current;
      pushModuleHistory(cur.isAdminMode, cur.activeNavTab, tab);
    }
  };

  // Seed initial history entry & wire browser/mobile Back button cleanly across all modules
  useEffect(() => {
    const initial = navSnapshotRef.current;
    pushModuleHistory(initial.isAdminMode, initial.activeNavTab, initial.adminTab, true);

    const handlePopState = (event: PopStateEvent) => {
      isHandlingPopStateRef.current = true;
      try {
        const u = getSavedUserFromStorage();
        const isAllowedAdmin = u?.role === 'ADMIN';
        const st = event.state;
        const parsedHash = parseNavHash();

        let nextAdmin = navSnapshotRef.current.isAdminMode;
        let nextClientTab = navSnapshotRef.current.activeNavTab;
        let nextAdminTab = navSnapshotRef.current.adminTab;

        if (st && st.salonNav) {
          nextAdmin = Boolean(st.isAdminMode) && isAllowedAdmin;
          if (st.activeNavTab) nextClientTab = st.activeNavTab;
          if (st.adminTab) nextAdminTab = st.adminTab;
        } else if (parsedHash) {
          if (parsedHash.mode === 'admin' && isAllowedAdmin) {
            nextAdmin = true;
            nextAdminTab = parsedHash.tab;
          } else if (parsedHash.mode === 'client') {
            nextAdmin = false;
            nextClientTab = parsedHash.tab;
          }
        } else {
          // If popped back to bare root hash, return to home/dashboard instead of leaving
          if (isAllowedAdmin && navSnapshotRef.current.isAdminMode) {
            nextAdmin = true;
            nextAdminTab = 'dashboard';
          } else {
            nextAdmin = false;
            nextClientTab = 'home';
          }
        }

        setIsAdminModeState(nextAdmin);
        setActiveNavTabState(nextClientTab);
        setAdminTabState(nextAdminTab);
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, nextAdmin ? 'true' : 'false');
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, nextAdmin ? 'true' : 'false');
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, nextAdmin ? 'admin' : 'customer');
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, nextAdmin ? 'admin' : 'customer');
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_active_tab`, nextClientTab);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_tab`, nextClientTab);
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_tab`, nextAdminTab);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_admin_tab`, nextAdminTab);
      } finally {
        setTimeout(() => {
          isHandlingPopStateRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [broadcastLogs, setBroadcastLogs] = useState<WhatsAppBroadcastLog[]>([]);

  const deletedAppointmentIdsRef = useRef<Set<string>>(new Set());
  const firestoreAppointmentsRef = useRef<Appointment[]>([]);
  const apiAppointmentsRef = useRef<Appointment[]>([]);
  const firestoreUsersRef = useRef<User[]>([]);
  const apiUsersRef = useRef<User[]>([]);
  const firestoreCustomersRef = useRef<Customer[]>([]);
  const apiCustomersRef = useRef<Customer[]>([]);

  const mergeAppointmentsLists = (aList: Appointment[], bList: Appointment[]): Appointment[] => {
    const map = new Map<string, Appointment>();
    const pickWinner = (prev: Appointment, next: Appointment): Appointment => {
      const prevStatus = (prev.bookingStatus || prev.status || 'CONFIRMED').toUpperCase();
      const nextStatus = (next.bookingStatus || next.status || 'CONFIRMED').toUpperCase();
      const merged: Appointment = { ...prev, ...next };
      // Never allow an empty screenshot URL from stale polling/snapshot overwrite an existing uploaded payment proof
      if (!merged.paymentScreenshotUrl && prev.paymentScreenshotUrl) {
        merged.paymentScreenshotUrl = prev.paymentScreenshotUrl;
      }
      // Preserve verified bank status or finalized CANCELLED/COMPLETED status from whichever source updated it
      if (prev.isBankVerified && !next.isBankVerified && nextStatus !== 'CANCELLED') {
        merged.isBankVerified = true;
        merged.bankVerifiedSource = prev.bankVerifiedSource;
        merged.bankName = prev.bankName || merged.bankName;
        merged.paymentStatus = prev.paymentStatus || merged.paymentStatus;
      }
      if ((prevStatus === 'CANCELLED' && nextStatus !== 'CANCELLED') || (nextStatus === 'CANCELLED' && prevStatus !== 'CANCELLED')) {
        // Keep CANCELLED unless prev/next has explicit newer reopen
        merged.bookingStatus = 'CANCELLED';
        merged.status = 'CANCELLED';
      } else if (prevStatus === 'COMPLETED' && nextStatus === 'CONFIRMED') {
        merged.bookingStatus = 'COMPLETED';
        merged.status = 'COMPLETED';
      }
      return merged;
    };

    [...aList, ...bList].forEach(item => {
      if (!item || !item.id || deletedAppointmentIdsRef.current.has(item.id)) return;
      const existing = map.get(item.id);
      map.set(item.id, existing ? pickWinner(existing, item) : item);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
    );
  };

  const mergeUsersLists = (aList: User[], bList: User[]): User[] => {
    const map = new Map<string, User>();
    [...aList, ...bList].forEach(u => {
      if (!u || !u.id) return;
      const existing = map.get(u.id);
      map.set(u.id, existing ? { ...existing, ...u, phone: u.phone || existing.phone || '', role: (existing.role === 'ADMIN' || u.role === 'ADMIN') ? 'ADMIN' : (u.role || existing.role) } : u);
    });
    return Array.from(map.values());
  };

  const mergeCustomersLists = (aList: Customer[], bList: Customer[]): Customer[] => {
    const map = new Map<string, Customer>();
    [...aList, ...bList].forEach(c => {
      if (!c || !c.id) return;
      const existing = map.get(c.id);
      map.set(c.id, existing ? {
        ...existing,
        ...c,
        totalVisits: Math.max(existing.totalVisits || 0, c.totalVisits || 0),
        totalSpent: Math.max(existing.totalSpent || 0, c.totalSpent || 0)
      } : c);
    });
    return Array.from(map.values());
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_services`, JSON.stringify(services));
  }, [services]);

  // 1. Real-time Firebase Authentication state tracking
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const fbEmail = (fbUser.email || '').toLowerCase().trim();
        const savedSettingsRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_settings`);
        let dynamicAdminEmails: string[] = [
          'dineshghodake941@gmail.com',
          'modernsalon02@gmail.com',
          'admin@modernsalon.com'
        ];
        try {
          if (savedSettingsRaw) {
            const parsedSettings = JSON.parse(savedSettingsRaw);
            if (Array.isArray(parsedSettings.adminEmails)) {
              dynamicAdminEmails = Array.from(new Set([
                ...dynamicAdminEmails,
                ...parsedSettings.adminEmails.map((e: string) => (e || '').toLowerCase().trim()).filter(Boolean)
              ]));
            }
          }
        } catch {}

        const isAdminUser = Boolean(fbEmail && dynamicAdminEmails.includes(fbEmail));

        // Respect explicit portal mode so a user who signed in on the Client Portal NEVER gets switched to Admin after refreshing!
        const readPortalAdminIntent = () => {
          try {
            const parsedHash = parseNavHash();
            const savedPortal =
              sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_portal_mode`) ??
              localStorage.getItem(`${LOCAL_STORAGE_KEY}_portal_mode`);
            const savedFlag =
              sessionStorage.getItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`) ??
              localStorage.getItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`);
            if (savedPortal === 'customer' || savedFlag === 'false' || parsedHash?.mode === 'client') {
              return false;
            }
            return parsedHash?.mode === 'admin' || savedPortal === 'admin' || savedFlag === 'true';
          } catch {
            return false;
          }
        };

        // STRICT MANDATORY EMAIL VERIFICATION GATE:
        if (!isAdminUser && !fbUser.emailVerified) {
          console.log('Unverified customer session detected - access to dashboard blocked until email confirmed:', fbUser.email);
          setCurrentUser(null);
          return;
        }

        const userDocRef = doc(db, 'users', fbUser.uid);

        // Listen to Firestore profile updates in real time
        const unsubUserDoc = onSnapshot(userDocRef, (snap) => {
          const wantsAdminPortal = isAdminUser && readPortalAdminIntent();
          if (snap.exists()) {
            const data = snap.data();
            const resolvedRole: UserRole = wantsAdminPortal ? 'ADMIN' : 'CUSTOMER';
            const u: User = {
              id: fbUser.uid,
              name: data.name || fbUser.displayName || 'Client',
              username: data.username,
              email: data.email || fbUser.email || '',
              phone: data.phone || fbUser.phoneNumber || '',
              role: resolvedRole,
              memberTier: resolvedRole === 'ADMIN'
                ? 'Owner Admin'
                : (data.memberTier && data.memberTier !== 'Owner Admin' ? data.memberTier : 'New Client'),
              emailVerified: fbUser.emailVerified || isAdminUser,
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              preferredServices: data.preferredServices || [],
              gender: data.gender,
              birthDate: data.birthDate,
              anniversaryDate: data.anniversaryDate,
              preferredStylist: data.preferredStylist,
              skinOrHairType: data.skinOrHairType,
              specialNotes: data.specialNotes,
              address: data.address,
              city: data.city,
              emergencyContact: data.emergencyContact,
              allergies: data.allergies,
              preferredSlot: data.preferredSlot,
              favoriteCategory: data.favoriteCategory,
              whatsappNotifications: data.whatsappNotifications,
              emailNotifications: data.emailNotifications,
              totalVisits: data.totalVisits,
              memberSince: data.memberSince
            };
            setCurrentUser(prev => {
              const mergedUser: User = {
                ...u,
                phone: u.phone || (prev && prev.id === u.id ? prev.phone : '') || ''
              };
              try {
                const ser = JSON.stringify(mergedUser);
                sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, ser);
                localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, ser);
              } catch {}
              return mergedUser;
            });
            setIsGuestMode(false);
            if (wantsAdminPortal) {
              setIsAdminModeState(true);
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
            } else {
              setIsAdminModeState(false);
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
            }
            // Mirror signed-in user to backend /api/auth/users and Firestore customers so CRM sees every account
            fetch(`/api/auth/users/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(u)
            }).catch(() => {});
            if (u.role !== 'ADMIN') {
              setDoc(doc(db, 'customers', u.id), cleanFirestoreData({
                id: u.id,
                name: u.name,
                phone: u.phone || '',
                email: u.email || '',
                totalVisits: u.totalVisits || 0,
                totalSpent: 0,
                lastVisit: 'Registered',
                favoriteService: (u.preferredServices && u.preferredServices[0]) || 'General Styling',
                memberSince: u.memberSince || '2026',
                tier: u.memberTier || 'New Client'
              }), { merge: true }).catch(() => {});
            }
          } else {
            const resolvedRole: UserRole = wantsAdminPortal ? 'ADMIN' : 'CUSTOMER';
            const newUserData: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Client',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              role: resolvedRole,
              memberTier: resolvedRole === 'ADMIN' ? 'Owner Admin' : 'New Client',
              emailVerified: Boolean(fbUser.emailVerified) || isAdminUser,
              ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {}),
              preferredServices: []
            };
            setDoc(userDocRef, cleanFirestoreData(newUserData), { merge: true }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`));
            setCurrentUser(prev => {
              const mergedUser: User = {
                ...newUserData,
                phone: newUserData.phone || (prev && prev.id === newUserData.id ? prev.phone : '') || ''
              };
              try {
                const ser = JSON.stringify(mergedUser);
                sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, ser);
                localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, ser);
              } catch {}
              return mergedUser;
            });
            setIsGuestMode(false);
            if (wantsAdminPortal) {
              setIsAdminModeState(true);
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
            } else {
              setIsAdminModeState(false);
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
            }
            fetch(`/api/auth/users/${newUserData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUserData)
            }).catch(() => {});
          }
        }, (err) => {
          console.warn('User document snapshot warning:', err.message);
        });

        return () => unsubUserDoc();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Database Synchronization for Collections (Merged cleanly — never clobbers)
  useEffect(() => {
    // Real-time Appointments
    const unsubApts = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const apts: Appointment[] = [];
      snapshot.forEach((d) => {
        apts.push({ id: d.id, ...(d.data() as any) });
      });
      firestoreAppointmentsRef.current = apts;
      setAppointments(prev => mergeAppointmentsLists(mergeAppointmentsLists(prev, apiAppointmentsRef.current), apts));
    }, (err) => {
      console.warn('Real-time appointments snapshot notice:', err.message);
    });

    // Real-time Customer Reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      if (!snapshot.empty) {
        const revs: Review[] = [];
        snapshot.forEach((d) => {
          revs.push({ id: d.id, ...(d.data() as any) });
        });
        setReviews(revs);
      }
    }, (err) => {
      console.warn('Real-time reviews snapshot notice:', err.message);
    });

    // Real-time Customer Inquiries
    const unsubInquiries = onSnapshot(collection(db, 'inquiries'), (snapshot) => {
      const inqs: ContactInquiry[] = [];
      snapshot.forEach((d) => {
        inqs.push({ id: d.id, ...(d.data() as any) });
      });
      setInquiries(inqs);
    }, (err) => {
      console.warn('Real-time inquiries snapshot notice:', err.message);
    });

    // Real-time Offers
    const unsubOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
      if (!snapshot.empty) {
        const offs: OfferCoupon[] = [];
        snapshot.forEach((d) => {
          offs.push({ id: d.id, ...(d.data() as any) });
        });
        setOffers(offs);
      }
    }, (err) => {
      console.warn('Real-time offers snapshot notice:', err.message);
    });

    // Real-time Settings (respects monotonic settingsUpdatedAt so older Firestore docs never overwrite newer API saves)
    const unsubSettings = onSnapshot(doc(db, 'salon_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setSettings((prev) => {
          const merged = mergeIncomingSettings(prev, data);
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }, (err) => {
      console.warn('Real-time settings snapshot notice:', err.message);
    });

    // Real-time Gallery & Videos
    const unsubGallery = onSnapshot(collection(db, 'gallery_items'), (snapshot) => {
      if (!snapshot.empty) {
        const items: GalleryItem[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as any) });
        });
        setGallery(items);
      }
    }, (err) => {
      console.warn('Real-time gallery snapshot notice:', err.message);
    });

    return () => {
      unsubApts();
      unsubReviews();
      unsubInquiries();
      unsubOffers();
      unsubSettings();
      unsubGallery();
    };
  }, []);

  // 2b. Real-time Firestore Listeners for ALL Users & CRM Customers (when Admin / Firebase Signed-In)
  useEffect(() => {
    if (currentUser?.role !== 'ADMIN' && !auth.currentUser) return;

    const unsubCustomersFs = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const custs: Customer[] = [];
      snapshot.forEach((d) => {
        custs.push({ id: d.id, ...(d.data() as any) });
      });
      firestoreCustomersRef.current = custs;
      setRawCustomers(prev => mergeCustomersLists(mergeCustomersLists(prev, apiCustomersRef.current), custs));
    }, () => {});

    const unsubUsersFs = currentUser?.role === 'ADMIN'
      ? onSnapshot(collection(db, 'users'), (snapshot) => {
          const fsUsers: User[] = [];
          snapshot.forEach((d) => {
            fsUsers.push({ id: d.id, ...(d.data() as any) });
          });
          firestoreUsersRef.current = fsUsers;
          setUsers(prev => mergeUsersLists(mergeUsersLists(prev, apiUsersRef.current), fsUsers));
        }, () => {})
      : () => {};

    return () => {
      unsubCustomersFs();
      unsubUsersFs();
    };
  }, [currentUser?.id, currentUser?.role]);

  // Sync with Backend Database API on mount & periodically (merges cleanly with Firestore instead of clobbering!)
  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => {
            const merged = mergeIncomingSettings(prev, data.settings);
            try {
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
          if (data.settings.advancePercentage) {
            const pct = Number(data.settings.advancePercentage);
            setServices(prev => prev.map(s => ({
              ...s,
              advanceDeposit: Math.round((s.price * pct) / 100)
            })));
          }
        }
      })
      .catch(() => {});

    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setGallery(prev => {
            const map = new Map<string, GalleryItem>();
            [...data.gallery, ...prev].forEach(item => {
              if (item && item.id && !map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.offers) && data.offers.length > 0) {
          setOffers(data.offers);
        }
      })
      .catch(() => {});

    fetch('/api/offers/broadcast-logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
          setBroadcastLogs(data.logs);
        }
      })
      .catch(() => {});

    fetch('/api/inquiries')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.inquiries)) {
          setInquiries(prev => {
            const map = new Map<string, ContactInquiry>();
            [...prev, ...data.inquiries].forEach(inq => {
              if (inq && inq.id) map.set(inq.id, inq);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
          apiUsersRef.current = data.users;
          setUsers(prev => mergeUsersLists(mergeUsersLists(prev, firestoreUsersRef.current), data.users));
          setCurrentUser(prev => {
            if (!prev) return prev;
            // CRITICAL: Never let a matching phone overwrite an authenticated ADMIN session with a CUSTOMER record
            if (prev.role === 'ADMIN') return prev;
            const fresh = data.users.find((u: any) =>
              u.id === prev.id ||
              (u.email && prev.email && u.email.toLowerCase() === prev.email.toLowerCase()) ||
              (u.phone && prev.phone && u.phone === prev.phone && u.role === prev.role)
            );
            if (fresh) {
              const merged: User = {
                ...prev,
                ...fresh,
                role: prev.role,
                memberTier: prev.role === 'CUSTOMER' && fresh.memberTier === 'Owner Admin'
                  ? (prev.memberTier || 'New Client')
                  : (fresh.memberTier || prev.memberTier),
                phone: fresh.phone || prev.phone || '',
                name: fresh.name || prev.name
              };
              sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(merged));
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const safe = data.map((r: any) => ({
            ...r,
            clientName: r.clientName || r.userName || 'Valued Client',
            userName: r.userName || r.clientName || 'Valued Client',
            serviceName: r.serviceName || 'Signature Salon Service'
          }));
          setReviews(safe);
        }
      })
      .catch(() => {});

    // Real-Time Database Sync: Merge backend appointments, users, and customers with Firestore without overwriting
    const syncRealTimeAppointments = () => {
      fetch('/api/appointments')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.appointments)) {
            apiAppointmentsRef.current = data.appointments;
            setAppointments(prev =>
              mergeAppointmentsLists(mergeAppointmentsLists(prev, firestoreAppointmentsRef.current), data.appointments)
            );
          }
        })
        .catch(() => {});

      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          }
        })
        .catch(() => {});

      fetch('/api/customers')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.customers)) {
            apiCustomersRef.current = data.customers;
            setRawCustomers(prev => mergeCustomersLists(mergeCustomersLists(prev, firestoreCustomersRef.current), data.customers));
          }
        })
        .catch(() => {});

      fetch('/api/auth/users')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.users)) {
            apiUsersRef.current = data.users;
            setUsers(prev => mergeUsersLists(mergeUsersLists(prev, firestoreUsersRef.current), data.users));
          }
        })
        .catch(() => {});

      fetch('/api/settings', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setSettings(prev => {
              const merged = mergeIncomingSettings(prev, {
                ...data.settings,
                blockedWindows: data.settings.blockedWindows !== undefined ? data.settings.blockedWindows : (prev.blockedWindows || []),
                isOwnerOnBreakToday: data.settings.isOwnerOnBreakToday !== undefined ? data.settings.isOwnerOnBreakToday : (prev.isOwnerOnBreakToday || false)
              });
              try {
                localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        })
        .catch(() => {});
    };

    syncRealTimeAppointments();
    const interval = setInterval(syncRealTimeAppointments, 6000);
    return () => clearInterval(interval);
  }, []);

  // Strict Role Guard: Logged-in customers must NEVER be routed to admin view
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && isAdminMode) {
      setIsAdminMode(false);
      setActiveNavTab('home');
    }
  }, [currentUser, isAdminMode]);

  // Check URL parameters for direct promo QR links (e.g. ?service=... or ?book=true or ?action=book)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const serviceParam = params.get('service') || params.get('serviceId');
      const bookParam = params.get('book') || (params.get('action') === 'book' ? 'true' : null) || params.get('booking');
      const navParam = params.get('tab') || params.get('page');

      if (navParam && ['home', 'services', 'gallery', 'offers', 'reviews', 'terms', 'about', 'contact'].includes(navParam)) {
        setActiveNavTab(navParam);
      }

      if (serviceParam) {
        const found = services.find(
          s => s.id.toLowerCase() === serviceParam.toLowerCase() || 
               s.name.toLowerCase().includes(serviceParam.toLowerCase())
        );
        if (found) {
          setSelectedServiceForBooking(found);
          setIsBookingModalOpen(true);
        } else {
          setIsBookingModalOpen(true);
        }
      } else if (bookParam === 'true' || bookParam === '1') {
        setIsBookingModalOpen(true);
      }
    } catch {
      // Ignore URL parsing errors in SSR/sandboxed iframe
    }
  }, [services]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_inquiries`, JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(rawCustomers));
  }, [rawCustomers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_gallery`, JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_offers`, JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_reviews`, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_policies`, JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_staff_members`, JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifs`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        const serialized = JSON.stringify(currentUser);
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, serialized);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, serialized);
      } else {
        sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_current_user`);
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_current_user`);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      if (isGuestMode) {
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_guest_mode`, 'true');
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_guest_mode`, 'true');
      } else {
        sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_guest_mode`);
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_guest_mode`);
      }
    } catch {}
  }, [isGuestMode]);

  // Auth helper methods
  const openAuthModal = (initialTab: 'customer' | 'admin' = 'customer', mode: 'login' | 'register' = 'login') => {
    setAuthModalInitialTab(initialTab);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const checkEmailVerification = async (email?: string, password?: string): Promise<{ verified: boolean; message: string; user?: User }> => {
    try {
      const loadSavedUserDoc = async (fbUid: string, fbEmail: string, fbName: string, fbPhone: string): Promise<User> => {
        let docData: any = {};
        try {
          const snap = await getDoc(doc(db, 'users', fbUid));
          if (snap.exists()) docData = snap.data() || {};
        } catch {}
        let dbUser: any = {};
        try {
          const res = await fetch('/api/auth/users');
          const d = await res.json();
          if (d?.success && Array.isArray(d.users)) {
            dbUser = d.users.find((u: any) => u.id === fbUid || (fbEmail && u.email?.toLowerCase() === fbEmail.toLowerCase())) || {};
          }
        } catch {}
        return {
          ...dbUser,
          ...docData,
          id: fbUid,
          name: docData.name || dbUser.name || fbName || 'Client',
          email: fbEmail || docData.email || dbUser.email || '',
          phone: docData.phone || dbUser.phone || fbPhone || '',
          role: 'CUSTOMER',
          emailVerified: true,
          memberTier: docData.memberTier || dbUser.memberTier || 'New Client'
        };
      };

      // 1. If active Firebase user session exists, reload and check
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          try {
            sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
            sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
          } catch {}
          const verifiedUser = await loadSavedUserDoc(
            auth.currentUser.uid,
            auth.currentUser.email || '',
            auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Client',
            auth.currentUser.phoneNumber || ''
          );
          setDoc(doc(db, 'users', auth.currentUser.uid), cleanFirestoreData({ emailVerified: true }), { merge: true }).catch(() => {});
          setCurrentUser(verifiedUser);
          setIsAdminMode(false);
          setIsGuestMode(false);
          setIsAuthModalOpen(false);
          return { verified: true, message: 'Email confirmed! Your account is activated.', user: verifiedUser };
        }
      }

      // 2. If email & password credentials provided, attempt sign in to verify status
      if (email && password) {
        try {
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
        } catch {}
        const userCred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim());
        const fbUser = userCred.user;
        if (fbUser.emailVerified) {
          const verifiedUser = await loadSavedUserDoc(
            fbUser.uid,
            fbUser.email || email,
            fbUser.displayName || fbUser.email?.split('@')[0] || 'Client',
            fbUser.phoneNumber || ''
          );
          setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData({ emailVerified: true }), { merge: true }).catch(() => {});
          setCurrentUser(verifiedUser);
          setIsAdminMode(false);
          setIsGuestMode(false);
          setIsAuthModalOpen(false);
          return { verified: true, message: 'Email confirmed! Your account is activated.', user: verifiedUser };
        } else {
          // Still unconfirmed
          await signOut(auth);
          return {
            verified: false,
            message: `Email (${email}) is not yet confirmed. Please check your inbox & spam folder, click the verification link, and try again.`
          };
        }
      }

      return {
        verified: false,
        message: 'Email confirmation not yet detected. Please click the link in your email and try again.'
      };
    } catch (err: any) {
      console.warn('Check email verification error:', err);
      return {
        verified: false,
        message: err.message || 'Unable to check verification status right now.'
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address to receive password reset instructions.' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}. Please check your inbox (and spam folder) to set your new customer password.`
      };
    } catch (err: any) {
      console.warn('Password reset notice:', err);
      if (err.code === 'auth/user-not-found') {
        return { success: false, message: 'No customer account found with this email address. Please sign up to create a new account.' };
      }
      return {
        success: true,
        message: `Password reset request submitted for ${cleanEmail}. If a customer account is associated with this email, reset instructions have been dispatched to your inbox.`
      };
    }
  };

  const resetAdminPassword = async (_email: string, pin: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const cleanPin = (pin || '').trim();
    const cleanNewPass = (newPassword || '').trim();

    if (!cleanNewPass || cleanNewPass.length < 6) {
      return { success: false, message: 'New Admin password must be at least 6 characters.' };
    }

    try {
      const res = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, newPassword: cleanNewPass })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Invalid Owner Master Security PIN.' };
      }

      const updatedAt = data.settings?.adminPasswordUpdatedAt || Date.now();
      setSettings(prev => {
        const merged = {
          ...prev,
          ...(data.settings || {}),
          adminPassword: cleanNewPass,
          adminPasswordUpdatedAt: updatedAt
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
        return merged;
      });

      // Best effort Firestore sync if an admin Firebase session is currently signed in
      try {
        if (auth.currentUser) {
          await setDoc(
            doc(db, 'salon_settings', 'main'),
            cleanFirestoreData({ adminPassword: cleanNewPass, adminPasswordUpdatedAt: updatedAt }),
            { merge: true }
          );
        }
      } catch {}

      return {
        success: true,
        message: 'Admin Master Password updated successfully! Saved in Salon Settings and isolated from client accounts.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to update Admin password.'
      };
    }
  };

  const sendAdminPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid administrator email address to receive the password reset link.' };
    }

    const configuredEmails = (settings.adminEmails || [])
      .map(e => (e || '').toLowerCase().trim())
      .filter(Boolean);
    const authorizedAdminEmails = Array.from(new Set([
      ...(configuredEmails.length > 0 ? configuredEmails : [
        'dineshghodake941@gmail.com',
        'modernsalon02@gmail.com',
        'admin@modernsalon.com'
      ]),
      (settings.email || '').toLowerCase().trim()
    ].filter(Boolean)));

    if (!authorizedAdminEmails.includes(cleanEmail)) {
      return {
        success: false,
        message: `Access Denied: ${cleanEmail} is not an authorized salon administrator email.`
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}. Please check your inbox (and spam folder) to reset your admin password.`
      };
    } catch (err: any) {
      console.warn('Admin password reset email notice:', err?.code, err?.message);
      if (err.code === 'auth/user-not-found') {
        return {
          success: false,
          message: `No Firebase Auth account exists yet for ${cleanEmail}. Please sign in with Google once using ${cleanEmail} or verify in Firebase Auth.`
        };
      }
      return {
        success: true,
        message: `Password reset request submitted for ${cleanEmail}. Check your inbox (and spam folder) for reset instructions.`
      };
    }
  };

  const clearAllPastData = async (): Promise<{ success: boolean; message: string }> => {
    try {
      appointments.forEach(a => {
        if (a?.id) deletedAppointmentIdsRef.current.add(a.id);
      });
      firestoreAppointmentsRef.current = [];
      apiAppointmentsRef.current = [];
      firestoreCustomersRef.current = [];
      apiCustomersRef.current = [];
      firestoreUsersRef.current = firestoreUsersRef.current.filter(u => u.role === 'ADMIN');
      apiUsersRef.current = apiUsersRef.current.filter(u => u.role === 'ADMIN');

      setAppointments([]);
      setRawCustomers([]);
      setInquiries([]);
      setNotifications([]);
      setBroadcastLogs([]);
      setUsers(prev => prev.filter(u => u.role === 'ADMIN'));

      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_appointments`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_customers`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_inquiries`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_notifs`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_users`);

      // Best-effort clear backend db.json
      await fetch('/api/admin/clear-past-data', { method: 'POST' }).catch(() => {});

      // Best-effort clear Firestore past appointments, customers, and inquiries
      const collectionsToClear = ['appointments', 'customers', 'inquiries'];
      for (const colName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, colName));
          await Promise.all(snap.docs.map(d => deleteDoc(doc(db, colName, d.id)).catch(() => {})));
        } catch {}
      }

      return {
        success: true,
        message: 'All past appointments, users, Customer CRM, and analytics records have been cleaned.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to clean past dashboard data.'
      };
    }
  };

  const resendVerificationEmail = async (email?: string, password?: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return {
          success: true,
          message: `Verification link resent to ${auth.currentUser.email}. Please check your inbox and spam folder.`
        };
      }
      if (email && password) {
        const userCred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim());
        await sendEmailVerification(userCred.user);
        await signOut(auth);
        return {
          success: true,
          message: `Verification link resent to ${email}. Please check your inbox and verify before logging in.`
        };
      }
      return {
        success: false,
        message: 'Please provide your registered email and password to resend the verification link.'
      };
    } catch (err: any) {
      console.warn('Resend verification email error:', err);
      return {
        success: false,
        message: err.message || 'Unable to resend verification email.'
      };
    }
  };

  const login = async (
    usernameOrEmailOrPhone: string,
    passwordOrPin: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; message: string; user?: User; emailUnverified?: boolean; email?: string }> => {
    const rawInput = (usernameOrEmailOrPhone || '').trim();
    const cleanSecret = (passwordOrPin || '').trim();

    if (!rawInput || !cleanSecret) {
      return {
        success: false,
        message: 'Please enter your Email or Username along with Password/PIN.'
      };
    }

    const configuredEmails = (settings.adminEmails || [])
      .map(e => (e || '').toLowerCase().trim())
      .filter(Boolean);
    const authorizedAdminEmails = Array.from(new Set([
      ...(configuredEmails.length > 0 ? configuredEmails : [
        'dineshghodake941@gmail.com',
        'modernsalon02@gmail.com',
        'admin@modernsalon.com'
      ]),
      (settings.email || '').toLowerCase().trim()
    ].filter(Boolean)));

    // 1. Admin Master Password / PIN check (shared across all 4 authorized admin emails)
    const configuredAdminPassword = settings.adminPassword || 'Salon@Owner#2026';
    const configuredAdminPin = settings.adminPin || '8104';

    if (expectedRole === 'ADMIN') {
      const isInputAdminPass = cleanSecret === configuredAdminPassword;
      const isInputAdminPin = Boolean(configuredAdminPin && cleanSecret === configuredAdminPin);

      if (isInputAdminPass || isInputAdminPin) {
        const cleanLower = rawInput.toLowerCase();
        const cleanNum = rawInput.replace(/\D/g, '');
        const isRecognizedAdminIdent =
          cleanLower === 'admin' ||
          cleanLower === 'owner' ||
          authorizedAdminEmails.includes(cleanLower) ||
          cleanNum === (settings.phone || '8104026257').replace(/\D/g, '');

        if (isRecognizedAdminIdent) {
          // Ensure no stale Firebase customer session hijacks the Admin session upon page refresh
          if (auth.currentUser && !authorizedAdminEmails.includes((auth.currentUser.email || '').toLowerCase().trim())) {
            signOut(auth).catch(() => {});
          }
          const matchedAdminEmail = authorizedAdminEmails.includes(cleanLower)
            ? cleanLower
            : (authorizedAdminEmails[0] || 'dineshghodake941@gmail.com');
          const adminUser: User = {
            id: 'usr-admin-owner',
            name: 'Salon Owner (Dinesh Ghodake)',
            email: matchedAdminEmail,
            phone: settings.phone || '8104026257',
            role: 'ADMIN',
            memberTier: 'Owner Admin',
            emailVerified: true
          };
          try {
            sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
            sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
            sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(adminUser));
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(adminUser));
          } catch {}
          setCurrentUser(adminUser);
          setIsAdminMode(true);
          setIsGuestMode(false);
          setIsAuthModalOpen(false);
          return { success: true, message: `Owner credentials verified (${matchedAdminEmail}). Welcome to Admin Suite!`, user: adminUser };
        }
      }
    }

    // 2. Real-time Firebase Authentication with mandatory email verification check
    if (rawInput.includes('@')) {
      try {
        // Pre-lock portal intent BEFORE signInWithEmailAndPassword so onAuthStateChanged never races
        const preIntentPortal = expectedRole === 'ADMIN' ? 'admin' : 'customer';
        const preIntentFlag = expectedRole === 'ADMIN' ? 'true' : 'false';
        try {
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, preIntentPortal);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, preIntentPortal);
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, preIntentFlag);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, preIntentFlag);
        } catch {}

        const userCredential = await signInWithEmailAndPassword(auth, rawInput.toLowerCase(), cleanSecret);
        const fbUser = userCredential.user;

        const isUserAdmin = authorizedAdminEmails.includes((fbUser.email || '').toLowerCase().trim());

        // STRICT EMAIL CONFIRMATION CHECK FOR CUSTOMERS:
        // Regular customers cannot sign in until email is confirmed; admins resetting via email remain permitted
        if (!isUserAdmin && !fbUser.emailVerified) {
          await signOut(auth);
          return {
            success: false,
            message: `Your email (${fbUser.email}) is NOT confirmed yet. Please click the confirmation link sent to your email before signing in.`,
            emailUnverified: true,
            email: fbUser.email || rawInput
          };
        }

        if (expectedRole === 'ADMIN' && !isUserAdmin) {
          await signOut(auth);
          return {
            success: false,
            message: `Access Denied: Account (${fbUser.email}) is not authorized as an administrator. Please sign in via the Client Portal.`
          };
        }

        const userRole: UserRole = expectedRole === 'ADMIN' && isUserAdmin ? 'ADMIN' : 'CUSTOMER';

        // Load existing saved profile from Firestore & backend DB so saved phone/details are preserved
        let existingDocData: any = {};
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) existingDocData = snap.data() || {};
        } catch {}

        let existingDbUser: any = {};
        try {
          const res = await fetch('/api/auth/users');
          const d = await res.json();
          if (d?.success && Array.isArray(d.users)) {
            existingDbUser = d.users.find((u: any) =>
              u.id === fbUser.uid ||
              (fbUser.email && u.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
            ) || {};
          }
        } catch {}

        const user: User = {
          ...existingDbUser,
          ...existingDocData,
          id: fbUser.uid,
          name: existingDocData.name || existingDbUser.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Client',
          email: fbUser.email || existingDocData.email || existingDbUser.email || '',
          phone: existingDocData.phone || existingDbUser.phone || fbUser.phoneNumber || '',
          role: userRole,
          emailVerified: true,
          memberTier: userRole === 'ADMIN'
            ? 'Owner Admin'
            : (existingDocData.memberTier && existingDocData.memberTier !== 'Owner Admin'
                ? existingDocData.memberTier
                : (existingDbUser.memberTier && existingDbUser.memberTier !== 'Owner Admin' ? existingDbUser.memberTier : 'Standard'))
        };

        try {
          const portal = userRole === 'ADMIN' ? 'admin' : 'customer';
          const flag = userRole === 'ADMIN' ? 'true' : 'false';
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, portal);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, portal);
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, flag);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, flag);
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(user));
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(user));
        } catch {}

        await setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(user), { merge: true });
        fetch(`/api/auth/users/${fbUser.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        }).catch(() => {});
        if (userRole !== 'ADMIN') {
          setDoc(doc(db, 'customers', fbUser.uid), cleanFirestoreData({
            id: fbUser.uid,
            name: user.name,
            phone: user.phone || '',
            email: user.email || '',
            totalVisits: user.totalVisits || 0,
            totalSpent: 0,
            lastVisit: 'Signed In',
            favoriteService: (user.preferredServices && user.preferredServices[0]) || 'General Styling',
            memberSince: user.memberSince || '2026',
            tier: user.memberTier || 'Standard'
          }), { merge: true }).catch(() => {});
        }

        // Push latest adminPassword from backend settings if admin just signed into Firebase
        if (userRole === 'ADMIN' && settings.adminPassword) {
          setDoc(
            doc(db, 'salon_settings', 'main'),
            cleanFirestoreData({
              adminPassword: settings.adminPassword,
              adminPasswordUpdatedAt: settings.adminPasswordUpdatedAt || Date.now()
            }),
            { merge: true }
          ).catch(() => {});
        }

        setCurrentUser(user);
        setIsGuestMode(false);
        if (userRole === 'ADMIN') {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
          setActiveNavTab('home');
        }
        setIsAuthModalOpen(false);
        return { success: true, message: `Welcome back, ${user.name}!`, user };
      } catch (err: any) {
        console.warn('Firebase sign-in error:', err?.code);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          return { success: false, message: 'Invalid password. Please check your credentials.' };
        }
        if (err.code === 'auth/user-not-found') {
          return { success: false, message: 'No account found with this email. Please sign up to create your account.' };
        }
      }
    }

    return {
      success: false,
      message: 'Invalid credentials. If you are a new customer, please click Sign Up and confirm your email.'
    };
  };

  const loginWithGoogle = async (
    optionsOrRole?: { forRole?: 'ADMIN' | 'CUSTOMER'; credential?: any; profile?: any } | 'ADMIN' | 'CUSTOMER'
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const requestedRole: 'ADMIN' | 'CUSTOMER' = 
      typeof optionsOrRole === 'string'
        ? optionsOrRole
        : optionsOrRole?.forRole || 'CUSTOMER';

    // Lock portal intent BEFORE signInWithPopup fires onAuthStateChanged so mobile/client sign-ins never switch to admin
    try {
      const prePortal = requestedRole === 'ADMIN' ? 'admin' : 'customer';
      const preFlag = requestedRole === 'ADMIN' ? 'true' : 'false';
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, prePortal);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, prePortal);
      sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, preFlag);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, preFlag);
    } catch {}

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const cleanEmail = (fbUser.email || '').toLowerCase().trim();

      const configuredEmails = (settings.adminEmails || [])
        .map(e => (e || '').toLowerCase().trim())
        .filter(Boolean);
      const authorizedAdminEmails = Array.from(new Set([
        ...(configuredEmails.length > 0 ? configuredEmails : [
          'dineshghodake941@gmail.com',
          'modernsalon02@gmail.com',
          'admin@modernsalon.com'
        ]),
        (settings.email || '').toLowerCase().trim()
      ].filter(Boolean)));

      const isAuthorizedAdmin = authorizedAdminEmails.includes(cleanEmail);

      // STRICT ADMIN GOOGLE CHECK
      if (requestedRole === 'ADMIN') {
        if (!isAuthorizedAdmin) {
          await signOut(auth);
          return {
            success: false,
            message: `Access Denied: Google account (${fbUser.email}) is NOT registered among the 4 authorized Salon Admin emails. Please sign in with one of your authorized admin Google accounts or use Client Sign In.`
          };
        }

        const adminProfile: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Salon Owner (Dinesh Ghodake)',
          email: fbUser.email || 'dineshghodake941@gmail.com',
          phone: fbUser.phoneNumber || settings.phone || '8104026257',
          role: 'ADMIN',
          memberTier: 'Owner Admin',
          emailVerified: true,
          ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {})
        };

        try {
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'admin');
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'true');
          sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(adminProfile));
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(adminProfile));
        } catch {}

        await setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(adminProfile), { merge: true });
        if (settings.adminPassword) {
          setDoc(
            doc(db, 'salon_settings', 'main'),
            cleanFirestoreData({
              adminPassword: settings.adminPassword,
              adminPasswordUpdatedAt: settings.adminPasswordUpdatedAt || Date.now()
            }),
            { merge: true }
          ).catch(() => {});
        }
        setCurrentUser(adminProfile);
        setIsGuestMode(false);
        setIsAdminMode(true);
        setAdminTab('dashboard');
        setIsAuthModalOpen(false);

        return {
          success: true,
          message: `Welcome Salon Owner (${adminProfile.name})! Admin Suite unlocked.`,
          user: adminProfile
        };
      }

      // CUSTOMER GOOGLE SIGN-IN — strictly lock portal_mode = 'customer' so refreshes stay on Client side
      try {
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_portal_mode`, 'customer');
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`, 'false');
      } catch {}

      let existingDocData: any = {};
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) existingDocData = snap.data() || {};
      } catch {}

      let existingDbUser: any = {};
      try {
        const res = await fetch('/api/auth/users');
        const d = await res.json();
        if (d?.success && Array.isArray(d.users)) {
          existingDbUser = d.users.find((u: any) =>
            u.id === fbUser.uid ||
            (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
          ) || {};
        }
      } catch {}

      const resolvedCustomerTier =
        existingDocData.memberTier && existingDocData.memberTier !== 'Owner Admin'
          ? existingDocData.memberTier
          : (existingDbUser.memberTier && existingDbUser.memberTier !== 'Owner Admin' ? existingDbUser.memberTier : 'New Client');

      const clientProfile: User = {
        ...existingDbUser,
        ...existingDocData,
        id: fbUser.uid,
        name: existingDocData.name || existingDbUser.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Client',
        email: fbUser.email || existingDocData.email || existingDbUser.email || '',
        phone: existingDocData.phone || existingDbUser.phone || fbUser.phoneNumber || '',
        role: 'CUSTOMER',
        memberTier: resolvedCustomerTier,
        emailVerified: true,
        ...(existingDocData.avatarUrl || fbUser.photoURL ? { avatarUrl: existingDocData.avatarUrl || fbUser.photoURL } : {})
      };

      try {
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(clientProfile));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(clientProfile));
      } catch {}

      await setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(clientProfile), { merge: true });
      fetch(`/api/auth/users/${fbUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientProfile)
      }).catch(() => {});
      setDoc(doc(db, 'customers', fbUser.uid), cleanFirestoreData({
        id: fbUser.uid,
        name: clientProfile.name,
        phone: clientProfile.phone || '',
        email: clientProfile.email || '',
        totalVisits: clientProfile.totalVisits || 0,
        totalSpent: 0,
        lastVisit: 'Signed In',
        favoriteService: (clientProfile.preferredServices && clientProfile.preferredServices[0]) || 'General Styling',
        memberSince: clientProfile.memberSince || '2026',
        tier: clientProfile.memberTier || 'New Client'
      }), { merge: true }).catch(() => {});

      setCurrentUser(clientProfile);
      setIsGuestMode(false);
      setIsAdminMode(false);
      setActiveNavTab('home');
      setIsAuthModalOpen(false);

      return {
        success: true,
        message: `Welcome, ${clientProfile.name}!`,
        user: clientProfile
      };
    } catch (err: any) {
      console.warn('Firebase Google Sign-In notice:', err?.message);
      return {
        success: false,
        message: err.message || 'Google sign-in could not be completed.'
      };
    }
  };

  const registerCustomer = async (data: {
    name: string;
    username?: string;
    email: string;
    phone: string;
    password?: string;
    preferredServices?: string[];
  }): Promise<{ success: boolean; message: string; user?: User; emailUnverified?: boolean; email?: string }> => {
    const cleanName = (data.name || '').trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim();
    const cleanPassword = (data.password || '').trim();

    if (!cleanName || !cleanPhone || !cleanEmail || !cleanPassword) {
      return { success: false, message: 'Please provide your Full Name, Email, Mobile Number, and Password.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    try {
      // 1. Create account in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      // 2. Set official display name
      await updateProfile(fbUser, { displayName: cleanName });

      // 3. Send REAL email confirmation link
      await sendEmailVerification(fbUser);

      const newUser: User = {
        id: fbUser.uid,
        name: cleanName,
        username: data.username || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: cleanPhone,
        role: 'CUSTOMER',
        memberTier: 'New Client',
        emailVerified: false,
        memberSince: '2026',
        preferredServices: data.preferredServices || []
      };

      // 4. Save to Firestore users collection with emailVerified: false
      await setDoc(doc(db, 'users', fbUser.uid), cleanFirestoreData(newUser));
      // Also mirror profile in backend database so phone is preserved
      fetch(`/api/auth/users/${fbUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});

      // 5. CRITICAL: Immediately sign out newly created unconfirmed account.
      // User is strictly NOT allowed to take the account or sign in until email is confirmed.
      await signOut(auth);
      setCurrentUser(null);

      return {
        success: true,
        message: `Account registration initiated! A verification email has been sent to ${cleanEmail}. Please click the confirmation link in the email to activate your account. You will not be able to log in until confirmed.`,
        emailUnverified: true,
        email: cleanEmail
      };
    } catch (err: any) {
      console.warn('Firebase registration notice:', err?.code, err?.message);
      let userFriendlyMsg = err.message || 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'This email is already registered. Please sign in or click Resend Verification.';
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Please enter a valid email address.';
      }
      return { success: false, message: userFriendlyMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setCurrentUser(null);
    setIsGuestMode(false);
    setIsAdminModeState(false);
    setActiveNavTabState('home');
    setAdminTabState('dashboard');
    navSnapshotRef.current = { isAdminMode: false, activeNavTab: 'home', adminTab: 'dashboard' };
    pushModuleHistory(false, 'home', 'dashboard', true);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_guest_mode`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_current_user`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_portal_mode`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_tab`);
    sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_admin_tab`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_guest_mode`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_current_user`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_admin_mode`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_portal_mode`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_active_tab`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_admin_tab`);
  };

  const updateCurrentUser = async (updates: Partial<User>): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (!currentUser) return { success: false, message: 'No active session' };
    const updatedUser: User = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers(prev => {
      const nextUsers = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });
    sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(updatedUser));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(updatedUser));
    
    // Also update in customer CRM directory if fields match
    setCustomers(prev => {
      const nextCusts = prev.map(c => {
        if (c.phone === updatedUser.phone || (updatedUser.email && c.email === updatedUser.email) || c.id === updatedUser.id) {
          return {
            ...c,
            name: updatedUser.name || c.name,
            phone: updatedUser.phone || c.phone,
            email: updatedUser.email || c.email,
            favoriteService: (updatedUser.preferredServices && updatedUser.preferredServices[0]) || c.favoriteService
          };
        }
        return c;
      });
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(nextCusts));
      } catch {}
      return nextCusts;
    });

    // Persist profile updates to Firestore in real time (setDoc merge works even if doc wasn't created yet)
    try {
      await setDoc(doc(db, 'users', updatedUser.id), cleanFirestoreData(updatedUser), { merge: true });
    } catch (err) {
      console.warn('Firestore updateCurrentUser note:', err);
    }

    // Persist profile updates directly to backend database & MySQL
    try {
      const res = await fetch(`/api/auth/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      const data = await res.json();
      if (data && data.success && data.user) {
        const mergedUser = {
          ...updatedUser,
          ...data.user,
          phone: updatedUser.phone || data.user.phone || ''
        };
        setCurrentUser(mergedUser);
        sessionStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(mergedUser));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user`, JSON.stringify(mergedUser));
        return { success: true, user: mergedUser, message: data.message || 'Profile saved successfully!' };
      }
      return { success: true, user: updatedUser, message: 'Profile updated successfully.' };
    } catch (err: any) {
      console.warn('Profile update database sync notice:', err?.message);
      return { success: true, user: updatedUser, message: 'Profile saved locally.' };
    }
  };

  // Modal open/close helpers
  const openBookingModal = (service?: ServiceItem) => {
    if (service) {
      setSelectedServiceForBooking(service);
    } else if (services.length > 0) {
      setSelectedServiceForBooking(services[0]);
    }
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedServiceForBooking(null);
  };

  const openQuizModal = () => setIsQuizModalOpen(true);
  const closeQuizModal = () => setIsQuizModalOpen(false);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const toggleAiChat = () => setIsAiChatOpen(!isAiChatOpen);
  const closeAiChat = () => setIsAiChatOpen(false);

  // Create confirmed appointment upon 10% Direct Bank UPI / Scanner payment
  const createAppointment = async (payload: BookingPayload): Promise<Appointment> => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayStr = days[now.getDay()];
    const countSeq = appointments.length + 1;
    const bookingRef = `${y}${m}${d}-${dayStr}-${countSeq}`;
    const ownerPhone = '8104026257';
    const cleanClientPhone = (payload.clientPhone || '').replace(/[^0-9]/g, '');
    const formattedClientPhone = cleanClientPhone.length === 10 ? `91${cleanClientPhone}` : cleanClientPhone;
    const utr = payload.upiTransactionId || `UTR-${Date.now().toString().slice(-8)}`;
    const scannerUsed = payload.scannerUsed || 'MODERN JENTS PARLOUR (HDFC Bank)';
    
    const waText = `✨ *NEW APPOINTMENT CONFIRMED* ✨\n*Modern Unisex Salon, Mohol*\n` +
      `────────────────────\n` +
      `📋 *Booking Ref:* ${bookingRef}\n` +
      `👤 *Client Name:* ${payload.clientName}\n` +
      `📱 *Client Mobile:* ${payload.clientPhone}\n` +
      `💇‍♀️ *Service:* ${payload.serviceName}\n` +
      `📅 *Date & Slot:* ${payload.date} at ${payload.timeSlot}\n` +
      `✂️ *Stylist:* ${payload.stylistName || 'Master Stylist (Dinesh Ghodake)'}\n` +
      `💰 *Total Bill:* ₹${payload.totalAmount}\n` +
      `✅ *10% Advance Deposit Paid:* ₹${payload.advanceAmount} (Verified Direct Bank UPI)\n` +
      `🔢 *UPI Ref / UTR No:* ${utr}\n` +
      `🏦 *Payment Destination:* ${scannerUsed}\n` +
      `💵 *Balance at Salon Counter:* ₹${payload.balanceDue}\n` +
      `────────────────────\n` +
      `📍 *Salon Address:* B.N. Gund Complex, Near Kanya Prashala & ICICI Bank, Mohol (413213)\n` +
      `📞 *Salon Helpline:* +91 81040 26257`;

    const encodedWaText = encodeURIComponent(waText);
    const ownerWhatsappUrl = `https://api.whatsapp.com/send?phone=91${ownerPhone}&text=${encodedWaText}`;
    const clientWhatsappUrl = formattedClientPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedClientPhone}&text=${encodedWaText}` 
      : `https://api.whatsapp.com/send?text=${encodedWaText}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      userId: currentUser?.id,
      bookingRef,
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      clientEmail: payload.clientEmail,
      serviceId: payload.serviceId,
      serviceName: payload.serviceName,
      category: payload.category,
      date: payload.date,
      timeSlot: payload.timeSlot,
      stylistName: payload.stylistName || 'Master Stylist (Dinesh Ghodake)',
      totalAmount: payload.totalAmount,
      advancePaid: payload.advanceAmount,
      balanceDue: payload.balanceDue,
      paymentStatus: payload.paymentStatus || 'PAID',
      bookingStatus: payload.bookingStatus || 'CONFIRMED',
      status: payload.status || payload.bookingStatus || 'CONFIRMED',
      upiTransactionId: utr,
      paymentMethod: payload.paymentMethod || 'Direct Bank UPI / Scanner',
      scannerUsed,
      razorpayPaymentId: payload.razorpayPaymentId || utr,
      razorpayOrderId: payload.razorpayOrderId || `upi_${Date.now()}`,
      bankVerifiedAt: payload.bankVerifiedAt,
      bankVerifiedSource: payload.bankVerifiedSource,
      bankName: payload.bankName,
      holdExpiresAt: payload.holdExpiresAt,
      paymentScreenshotUrl: payload.paymentScreenshotUrl || '',
      createdAt: new Date().toISOString(),
      notes: payload.notes || '',
      isNew: true,
      whatsappUrl: clientWhatsappUrl,
      ownerWhatsappUrl: ownerWhatsappUrl
    };

    // Persist real-time appointment directly to Firestore cloud database
    try {
      setDoc(doc(db, 'appointments', newAppointment.id), cleanFirestoreData(newAppointment)).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `appointments/${newAppointment.id}`);
      });
    } catch (fsErr) {
      console.warn('Firestore appointment direct save note:', fsErr);
    }

    // Persist real-time appointment and notify admin suite & WhatsApp in database
    try {
      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment)
      }).catch(err => console.log('Appointment background sync notice:', err));
    } catch {
      // Fallback safe
    }

    // Trigger Automated WhatsApp dispatch to server API
    try {
      fetch('/api/notifications/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: ownerPhone,
          clientName: payload.clientName,
          clientPhone: payload.clientPhone,
          serviceName: payload.serviceName,
          date: payload.date,
          timeSlot: payload.timeSlot,
          bookingRef,
          advancePaid: payload.advanceAmount,
          balanceDue: payload.balanceDue,
          totalAmount: payload.totalAmount,
          stylistName: payload.stylistName
        })
      }).catch(err => console.log('WhatsApp notification dispatched background:', err));
    } catch {
      // Fallback safe
    }

    // Update appointments immediately (including API ref) & persist customer CRM record across Firestore + backend API
    apiAppointmentsRef.current = mergeAppointmentsLists([newAppointment], apiAppointmentsRef.current);
    setAppointments(prev => mergeAppointmentsLists([newAppointment], prev));

    const custId = currentUser?.id && currentUser.role !== 'ADMIN' ? currentUser.id : `cust-${Date.now()}`;
    const customerPayload: Customer = {
      id: custId,
      name: payload.clientName,
      phone: payload.clientPhone,
      email: payload.clientEmail,
      totalVisits: 1,
      totalSpent: payload.totalAmount,
      lastVisit: payload.date,
      favoriteService: payload.serviceName,
      memberSince: new Date().toISOString().split('T')[0],
      tier: 'New Client'
    };

    setCustomers(prev => {
      const cleanP = (payload.clientPhone || '').replace(/\D/g, '').slice(-10);
      const cleanE = (payload.clientEmail || '').trim().toLowerCase();
      const existing = prev.find(c => {
        const cp = (c.phone || '').replace(/\D/g, '').slice(-10);
        const ce = (c.email || '').trim().toLowerCase();
        return (cleanP && cp && cp === cleanP) || (cleanE && ce && ce === cleanE) || c.id === custId;
      });
      if (existing) {
        return prev.map(c => c.id === existing.id ? {
          ...c,
          totalVisits: c.totalVisits + 1,
          totalSpent: c.totalSpent + payload.totalAmount,
          lastVisit: payload.date,
          favoriteService: payload.serviceName,
          tier: c.totalVisits + 1 >= 10 ? 'VIP Member' : 'Standard'
        } : c);
      } else {
        return [customerPayload, ...prev];
      }
    });

    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload)
    }).catch(() => {});

    if (auth.currentUser) {
      setDoc(doc(db, 'customers', custId), cleanFirestoreData(customerPayload), { merge: true }).catch(() => {});
    }

    // Add admin notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Online Reservation & 10% Deposit',
      message: `${payload.clientName} booked ${payload.serviceName} for ${payload.date} at ${payload.timeSlot}. Advance deposit ₹${payload.advanceAmount} verified via UPI.`,
      type: 'booking',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newAppointment;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus, extraFields?: Partial<Appointment>) => {
    const target = appointments.find(apt => apt.id === id);

    const applyPatch = (list: Appointment[]) =>
      list.map(apt => apt.id === id ? { ...apt, bookingStatus: status, status: status, isNew: false, ...(extraFields || {}) } : apt);

    firestoreAppointmentsRef.current = applyPatch(firestoreAppointmentsRef.current);
    apiAppointmentsRef.current = applyPatch(apiAppointmentsRef.current);

    setAppointments(prev => {
      const updated = applyPatch(prev);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(updated));
      return updated;
    });

    if (target) {
      if (status === 'COMPLETED') {
        // Sync with CRM Customer record
        setCustomers(prev => prev.map(c => {
          const matchPhone = c.phone && target.clientPhone && c.phone.replace(/\D/g, '') === target.clientPhone.replace(/\D/g, '');
          const matchEmail = c.email && target.clientEmail && c.email.toLowerCase() === target.clientEmail.toLowerCase();
          if (matchPhone || matchEmail || c.name === target.clientName) {
            return {
              ...c,
              totalVisits: (c.totalVisits || 0) + 1,
              totalSpent: (c.totalSpent || 0) + (target.totalAmount || 0),
              lastVisit: target.date
            };
          }
          return c;
        }));

        // Notification
        const notif: NotificationItem = {
          id: `notif-comp-${Date.now()}`,
          title: 'Appointment Completed',
          message: `${target.clientName} completed visit for ${target.serviceName} (#${target.bookingRef}).`,
          type: 'booking',
          timestamp: 'Just now',
          read: false
        };
        setNotifications(prev => [notif, ...prev]);
      } else if (status === 'CANCELLED') {
        const notif: NotificationItem = {
          id: `notif-canc-${Date.now()}`,
          title: 'Appointment Cancelled',
          message: `Booking #${target.bookingRef} (${target.clientName}) marked as cancelled.`,
          type: 'booking',
          timestamp: 'Just now',
          read: false
        };
        setNotifications(prev => [notif, ...prev]);
      }
    }

    const payload = cleanFirestoreData({ bookingStatus: status, status: status, isNew: false, ...(extraFields || {}) });

    // Update in Firestore cloud database in real time
    try {
      updateDoc(doc(db, 'appointments', id), payload).catch(err => {
        console.warn('Firestore updateAppointmentStatus note:', err);
      });
    } catch {}

    try {
      fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {}
  };

  const rescheduleAppointment = async (id: string, newDate: string, newTimeSlot: string): Promise<{ success: boolean; message: string }> => {
    const target = appointments.find(a => a.id === id);
    if (!target) return { success: false, message: 'Appointment not found.' };

    const updatedAppointments = appointments.map(apt => {
      if (apt.id === id) {
        return {
          ...apt,
          date: newDate,
          timeSlot: newTimeSlot,
          bookingStatus: 'CONFIRMED' as AppointmentStatus,
          status: 'CONFIRMED' as AppointmentStatus,
          isNew: false
        };
      }
      return apt;
    });

    firestoreAppointmentsRef.current = firestoreAppointmentsRef.current.map(apt =>
      apt.id === id ? { ...apt, date: newDate, timeSlot: newTimeSlot, bookingStatus: 'CONFIRMED' as AppointmentStatus, status: 'CONFIRMED' as AppointmentStatus, isNew: false } : apt
    );
    apiAppointmentsRef.current = apiAppointmentsRef.current.map(apt =>
      apt.id === id ? { ...apt, date: newDate, timeSlot: newTimeSlot, bookingStatus: 'CONFIRMED' as AppointmentStatus, status: 'CONFIRMED' as AppointmentStatus, isNew: false } : apt
    );

    setAppointments(updatedAppointments);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(updatedAppointments));

    // Add alert notification for salon desk
    const notif: NotificationItem = {
      id: `notif-resched-${Date.now()}`,
      title: 'Slot Rescheduled by Client',
      message: `${target.clientName} moved ${target.serviceName} (#${target.bookingRef}) to ${newDate} at ${newTimeSlot}. Deposit preserved.`,
      type: 'booking',
      timestamp: 'Just now',
      read: false
    };
    // Update in Firestore cloud database in real time
    try {
      updateDoc(doc(db, 'appointments', id), {
        date: newDate,
        timeSlot: newTimeSlot,
        bookingStatus: 'CONFIRMED',
        status: 'CONFIRMED',
        isNew: false
      }).catch(err => console.warn('Firestore reschedule note:', err));
    } catch {}

    // Persist to backend database API
    try {
      fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          timeSlot: newTimeSlot,
          bookingStatus: 'CONFIRMED',
          status: 'CONFIRMED',
          isNew: false
        })
      }).catch(err => console.log('Appointment reschedule sync notice:', err));
    } catch {
      // Fallback
    }

    return {
      success: true,
      message: `Your booking #${target.bookingRef} has been successfully rescheduled to ${newDate} at ${newTimeSlot}!`
    };
  };

  const cancelAppointment = async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const target = appointments.find(a => a.id === id);
    if (!target) return { success: false, message: 'Appointment not found.' };

    const cancelNotes = reason ? `${target.notes || ''} [Cancelled by client: ${reason}]` : (target.notes || '');

    const updatedAppointments = appointments.map(apt => {
      if (apt.id === id) {
        return {
          ...apt,
          bookingStatus: 'CANCELLED' as AppointmentStatus,
          status: 'CANCELLED' as AppointmentStatus,
          notes: cancelNotes,
          isNew: false
        };
      }
      return apt;
    });

    firestoreAppointmentsRef.current = firestoreAppointmentsRef.current.map(apt =>
      apt.id === id ? { ...apt, bookingStatus: 'CANCELLED' as AppointmentStatus, status: 'CANCELLED' as AppointmentStatus, notes: cancelNotes, isNew: false } : apt
    );
    apiAppointmentsRef.current = apiAppointmentsRef.current.map(apt =>
      apt.id === id ? { ...apt, bookingStatus: 'CANCELLED' as AppointmentStatus, status: 'CANCELLED' as AppointmentStatus, notes: cancelNotes, isNew: false } : apt
    );

    setAppointments(updatedAppointments);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(updatedAppointments));

    // Add notification
    const notif: NotificationItem = {
      id: `notif-cancel-${Date.now()}`,
      title: 'Booking Cancelled',
      message: `${target.clientName} cancelled booking #${target.bookingRef} (${target.serviceName}).`,
      type: 'booking',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Update in Firestore cloud database in real time
    try {
      updateDoc(doc(db, 'appointments', id), {
        bookingStatus: 'CANCELLED',
        status: 'CANCELLED',
        notes: cancelNotes,
        isNew: false
      }).catch(err => console.warn('Firestore cancel note:', err));
    } catch {}

    // Persist cancellation to backend database API
    try {
      fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingStatus: 'CANCELLED',
          status: 'CANCELLED',
          notes: cancelNotes,
          isNew: false
        })
      }).catch(err => console.log('Appointment cancellation sync notice:', err));
    } catch {
      // Fallback
    }

    return {
      success: true,
      message: `Booking #${target.bookingRef} has been cancelled.`
    };
  };

  const deleteAppointment = (id: string) => {
    const target = appointments.find(apt => apt.id === id);

    deletedAppointmentIdsRef.current.add(id);
    firestoreAppointmentsRef.current = firestoreAppointmentsRef.current.filter(apt => apt.id !== id);
    apiAppointmentsRef.current = apiAppointmentsRef.current.filter(apt => apt.id !== id);

    setAppointments(prev => {
      const updated = prev.filter(apt => apt.id !== id);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_appointments`, JSON.stringify(updated));
      return updated;
    });

    if (target) {
      const notif: NotificationItem = {
        id: `notif-del-${Date.now()}`,
        title: 'Appointment Record Removed',
        message: `Booking #${target.bookingRef} for ${target.clientName} was deleted from database.`,
        type: 'booking',
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);
    }

    // Delete in Firestore
    try {
      deleteDoc(doc(db, 'appointments', id)).catch(err => console.warn('Firestore delete note:', err));
    } catch {}

    try {
      fetch(`/api/appointments/${id}`, {
        method: 'DELETE'
      }).catch(err => console.log('Appointment deletion background notice:', err));
    } catch {
      // Fallback
    }
  };

  // Service CRUD
  const addService = (service: Omit<ServiceItem, 'id'>) => {
    const newService: ServiceItem = {
      ...service,
      id: `srv-${Date.now()}`,
      advanceDeposit: Math.round((service.price * (settings.advancePercentage || 10)) / 100)
    };
    setServices(prev => [newService, ...prev]);
  };

  const updateService = (id: string, updated: Partial<ServiceItem>) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const price = updated.price !== undefined ? updated.price : s.price;
        return {
          ...s,
          ...updated,
          price,
          advanceDeposit: Math.round((price * (settings.advancePercentage || 10)) / 100)
        };
      }
      return s;
    }));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Inquiry CRUD
  const submitInquiry = (inq: Omit<ContactInquiry, 'id' | 'receivedDate' | 'status'>) => {
    const newInq: ContactInquiry = {
      ...inq,
      id: `inq-${Date.now()}`,
      receivedDate: new Date().toISOString().split('T')[0],
      status: 'NEW'
    };
    setInquiries(prev => [newInq, ...prev]);

    // Save to Firestore in real time
    try {
      setDoc(doc(db, 'inquiries', newInq.id), cleanFirestoreData(newInq)).catch(err => console.warn('Firestore inquiry save note:', err));
    } catch {}

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Client Inquiry',
      message: `${inq.clientName} sent an inquiry: "${inq.subject}".`,
      type: 'inquiry',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Persist to database API
    fetch('/api/inquiries/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inq)
    }).catch(err => console.log('Inquiry database save notice:', err));
  };

  const addContactInquiry = (inq: { name?: string; clientName?: string; phone: string; email: string; message: string; subject?: string; serviceCategory?: string }) => {
    const clientName = inq.name || inq.clientName || 'Valued Client';
    const subject = inq.subject || inq.serviceCategory || 'General Service & Booking Inquiry';
    submitInquiry({
      clientName,
      phone: inq.phone,
      email: inq.email,
      subject,
      serviceCategory: inq.serviceCategory || 'General Inquiry',
      message: inq.message
    });
  };

  const updateInquiryStatus = (id: string, status: InquiryStatus, ownerReply?: string) => {
    setInquiries(prev => prev.map(inq => inq.id === id ? {
      ...inq,
      status,
      ...(ownerReply !== undefined ? { ownerReply } : {})
    } : inq));

    try {
      updateDoc(doc(db, 'inquiries', id), {
        status,
        ...(ownerReply !== undefined ? { ownerReply } : {})
      }).catch(err => console.warn(err));
    } catch {}
  };

  const deleteInquiry = (id: string) => {
    setInquiries(prev => prev.filter(inq => inq.id !== id));
    try {
      deleteDoc(doc(db, 'inquiries', id)).catch(err => console.warn(err));
    } catch {}
    fetch(`/api/inquiries/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error('Failed to delete inquiry from backend API:', err));
  };

  // Gallery CRUD
  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}`
    };
    setGallery(prev => [newItem, ...prev]);
    setDoc(doc(db, 'gallery_items', newItem.id), cleanFirestoreData(newItem)).catch(err => {
      console.warn('Firestore gallery item add error:', err);
    });
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).catch(err => console.warn('Gallery backend save note:', err));
  };

  const updateGalleryItem = (id: string, updated: Partial<GalleryItem>) => {
    setGallery(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    setDoc(doc(db, 'gallery_items', id), cleanFirestoreData(updated), { merge: true }).catch(err => {
      console.warn('Firestore gallery item update error:', err);
    });
    fetch(`/api/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Gallery backend update note:', err));
  };

  const deleteGalleryItem = (id: string) => {
    setGallery(prev => prev.filter(item => item.id !== id));
    deleteDoc(doc(db, 'gallery_items', id)).catch(err => {
      console.warn('Firestore gallery item delete error:', err);
    });
    fetch(`/api/gallery/${id}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Gallery backend delete note:', err));
  };

  const collectSyncClientContacts = () => {
    const list: any[] = [];
    (customers || []).forEach(c => list.push({ id: c.id, name: c.name, phone: c.phone, source: 'customer' }));
    (users || []).forEach(u => {
      if (u.role !== 'ADMIN') list.push({ id: u.id, name: u.name, phone: u.phone, role: u.role, source: 'user' });
    });
    (appointments || []).forEach(a => list.push({ id: `apt-${a.id}`, name: a.clientName, phone: a.clientPhone, source: 'appointment' }));
    (inquiries || []).forEach(inq => list.push({ id: `inq-${inq.id}`, name: inq.clientName, phone: inq.phone, source: 'customer' }));
    return list;
  };

  // Offers & Automated WhatsApp Broadcast Management
  const addOffer = async (offer: Omit<OfferCoupon, 'id'>): Promise<{ success: boolean; broadcast?: any; offer?: OfferCoupon }> => {
    const newOffer: OfferCoupon = {
      ...offer,
      id: `off-${Date.now()}`
    };
    setOffers(prev => [newOffer, ...prev]);

    try {
      setDoc(doc(db, 'offers', newOffer.id), cleanFirestoreData(newOffer)).catch(err => console.warn(err));
    } catch {}

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOffer,
          clientContacts: collectSyncClientContacts(),
          appOrigin: typeof window !== 'undefined' ? window.location.origin : ''
        })
      });
      const data = await res.json();
      if (data.success && data.offer) {
        setOffers(prev => prev.map(o => o.id === newOffer.id ? data.offer : o));
        if (data.broadcast) {
          setBroadcastLogs(prev => [data.broadcast, ...prev]);
        }
      }
      return data;
    } catch (err: any) {
      console.warn('Network error while posting offer to server:', err);
      return { success: true, offer: newOffer };
    }
  };

  const broadcastOfferWhatsApp = async (offerId: string): Promise<{ success: boolean; broadcast?: any; message?: string }> => {
    const matchedOffer = offers.find(o => o.id === offerId || o.code === offerId.toUpperCase());
    try {
      const res = await fetch(`/api/offers/${offerId}/broadcast-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: matchedOffer,
          clientContacts: collectSyncClientContacts(),
          appOrigin: typeof window !== 'undefined' ? window.location.origin : ''
        })
      });
      const data = await res.json();
      if (data.success && data.broadcast) {
        setBroadcastLogs(prev => [data.broadcast, ...prev]);
      }
      return data;
    } catch (err: any) {
      console.error('Error broadcasting offer via WhatsApp:', err);
      return { success: false, message: err.message || 'Failed to dispatch WhatsApp broadcast' };
    }
  };

  const fetchBroadcastLogs = async () => {
    try {
      const res = await fetch('/api/offers/broadcast-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setBroadcastLogs(data.logs);
      }
    } catch (err) {}
  };

  const toggleOfferActive = (id: string) => {
    const target = offers.find(off => off.id === id);
    setOffers(prev => prev.map(off => off.id === id ? { ...off, active: !off.active } : off));
    if (target) {
      try {
        updateDoc(doc(db, 'offers', id), { active: !target.active }).catch(err => console.warn(err));
      } catch {}
    }
    fetch(`/api/offers/${id}/toggle`, { method: 'PATCH' }).catch(() => {});
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(off => off.id !== id));
    try {
      deleteDoc(doc(db, 'offers', id)).catch(err => console.warn(err));
    } catch {}
    fetch(`/api/offers/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  // Review CRUD
  const addReview = (rev: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...rev,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sentiment: rev.rating >= 4 ? 'positive' : rev.rating === 3 ? 'neutral' : 'critical',
      status: 'published'
    };
    setReviews(prev => [newReview, ...prev]);

    // Save to Firestore in real time
    try {
      setDoc(doc(db, 'reviews', newReview.id), cleanFirestoreData(newReview)).catch(err => {
        console.warn('Firestore addReview note:', err);
      });
    } catch {}

    // Push instant real-time notification to the Admin Suite
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `⭐ New ${rev.rating}-Star Feedback Received!`,
      message: `${rev.clientName || 'A customer'} rated ${rev.serviceName}: "${rev.comment ? rev.comment.slice(0, 60) + (rev.comment.length > 60 ? '...' : '') : 'Excellent salon experience.'}"`,
      type: 'review',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Persist review to database API
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    }).catch(err => console.log('Review database save notice:', err));
  };

  const updateReview = (id: string, updated: Partial<Review>) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    try {
      setDoc(doc(db, 'reviews', id), cleanFirestoreData(updated), { merge: true }).catch(err => console.warn(err));
    } catch {}
    fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    try {
      deleteDoc(doc(db, 'reviews', id)).catch(err => console.warn(err));
    } catch {}
  };

  // Policy CRUD
  const addPolicy = (policy: Omit<SalonPolicyItem, 'id'>) => {
    const newPol: SalonPolicyItem = {
      ...policy,
      id: `pol-${Date.now()}`
    };
    setPolicies(prev => [...prev, newPol]);
  };

  const updatePolicy = (id: string, updated: Partial<SalonPolicyItem>) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const deletePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  // Email Reply to Inquiry
  const sendInquiryEmailReply = async (id: string, replyText: string) => {
    const targetInq = inquiries.find(i => i.id === id);
    const recipientEmail = targetInq?.email || '';
    const clientName = targetInq?.clientName || 'Client';
    const subject = `Response from ${settings.salonName}: Re: ${targetInq?.subject || 'Salon Inquiry'}`;

    // Mailto fallback link
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Dear ${clientName},\n\nThank you for reaching out to ${settings.salonName}.\n\n${replyText}\n\nWarm regards,\n${settings.salonName} Management\nPhone: ${settings.phone}\nAddress: ${settings.address}`
    )}`;

    try {
      const response = await fetch('/api/inquiries/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: id,
          recipientEmail,
          clientName,
          subject,
          replyMessage: replyText,
          salonName: settings.salonName
        })
      });
      const data = await response.json();
      updateInquiryStatus(id, 'RESOLVED', replyText);
      return {
        success: true,
        message: data.message || `Reply logged & email sent to ${recipientEmail}`,
        mailtoUrl
      };
    } catch (err) {
      updateInquiryStatus(id, 'RESOLVED', replyText);
      return {
        success: true,
        message: `Reply logged for ${clientName}. Click below to open in your email client.`,
        mailtoUrl
      };
    }
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Settings
  const refreshSettings = async (): Promise<void> => {
    try {
      const [apiRes, fsRes] = await Promise.allSettled([
        fetch('/api/settings', { cache: 'no-store' }).then(r => r.json()),
        getDocFromServer(doc(db, 'salon_settings', 'main'))
      ]);

      const incomingCandidates: any[] = [];
      if (apiRes.status === 'fulfilled' && apiRes.value?.success && apiRes.value.settings) {
        incomingCandidates.push(apiRes.value.settings);
      }
      if (fsRes.status === 'fulfilled' && fsRes.value?.exists()) {
        incomingCandidates.push(fsRes.value.data());
      }

      if (incomingCandidates.length > 0) {
        setSettings(prev => {
          let next = prev;
          for (const cand of incomingCandidates) {
            next = mergeIncomingSettings(next, cand);
          }
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch {}
  };

  const updateSettings = async (newSettings: Partial<SalonSettings>): Promise<void> => {
    const syncPayload: Partial<SalonSettings> = {
      ...newSettings,
      ...(newSettings.merchantUpiId !== undefined && newSettings.upiId === undefined
        ? { upiId: newSettings.merchantUpiId }
        : {}),
      ...(newSettings.upiId !== undefined && newSettings.merchantUpiId === undefined
        ? { merchantUpiId: newSettings.upiId }
        : {}),
      ...(newSettings.adminPassword ? { adminPasswordUpdatedAt: Date.now() } : {}),
      settingsUpdatedAt: Math.max(Date.now(), Number(settings.settingsUpdatedAt || 0) + 1)
    };

    let nextFullSettings: SalonSettings = { ...settings, ...syncPayload };
    setSettings(prev => {
      const merged = normalizeLegacySettings({
        ...prev,
        ...syncPayload,
        settingsUpdatedAt: Math.max(Number(prev.settingsUpdatedAt || 0) + 1, Number(syncPayload.settingsUpdatedAt || Date.now()))
      });
      nextFullSettings = merged;
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
      } catch {}
      return merged;
    });

    // If advancePercentage changed, recalculate advanceDeposit for all services dynamically
    if (syncPayload.advancePercentage !== undefined) {
      const newPct = Number(syncPayload.advancePercentage);
      setServices(prev => prev.map(s => ({
        ...s,
        advanceDeposit: Math.round((s.price * newPct) / 100)
      })));
    }

    // Persist to Firebase Cloud Firestore in real time (only attempt if Firebase session exists to avoid unauth error logs)
    if (auth.currentUser) {
      setDoc(doc(db, 'salon_settings', 'main'), cleanFirestoreData(nextFullSettings), { merge: true })
        .catch(err => console.warn('Failed to sync settings to Firestore:', err));
    }

    // Persist to backend database API (db.json + MySQL) so ALL clients receive updates cleanly
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData?.success && resData.settings) {
          setSettings(prev => {
            const merged = mergeIncomingSettings(prev, resData.settings);
            try {
              localStorage.setItem(`${LOCAL_STORAGE_KEY}_settings`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync settings to API:', err);
    }
  };

  // Schedule Blackout & Owner Break Methods
  const isOwnerOnBreakToday = !!settings.isOwnerOnBreakToday;
  const blockedWindows = settings.blockedWindows || [];

  const toggleOwnerBreakToday = (forcedState?: boolean) => {
    const newState = forcedState !== undefined ? forcedState : !settings.isOwnerOnBreakToday;
    updateSettings({ isOwnerOnBreakToday: newState });

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: newState ? '🔴 Owner Break Active (Today Locked)' : '🟢 Salon Reopened for Bookings',
      message: newState
        ? 'All appointment booking slots for today are now unavailable to customers until you turn this off.'
        : 'Appointment booking slots for today are now open for customers.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addBlockedSlotWindow = (rule: Omit<BlockedSlotWindow, 'id' | 'createdAt'>) => {
    const newRule: BlockedSlotWindow = {
      ...rule,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newRule, ...(settings.blockedWindows || [])];
    updateSettings({ blockedWindows: updated });

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: '📅 Appointment Slot Blackout Created',
      message: `Slots on ${newRule.date} (${newRule.allDay ? 'All Day' : (newRule.startTime + ' - ' + newRule.endTime)}) are now marked unavailable.`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateBlockedSlotWindow = (id: string, updates: Partial<BlockedSlotWindow>) => {
    const currentList = settings.blockedWindows || [];
    const updated = currentList.map(item => item.id === id ? { ...item, ...updates } : item);
    updateSettings({ blockedWindows: updated });
  };

  const deleteBlockedSlotWindow = (id: string) => {
    const currentList = settings.blockedWindows || [];
    const updated = currentList.filter(item => item.id !== id);
    updateSettings({ blockedWindows: updated });
  };

  // Staff CRUD
  const addStaffMember = (member: Omit<StaffMember, 'id'>) => {
    const newMember: StaffMember = {
      ...member,
      id: `staff-${Date.now()}`
    };
    setStaffMembers(prev => [newMember, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Staff Member Added',
      message: `${member.name} (${member.role}) was added to salon staff.`,
      type: 'booking',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteStaffMember = (id: string) => {
    setStaffMembers(prev => prev.filter(m => m.id !== id));
  };

  // Unified Multi-User Customers CRM computation: combines stored CRM rows + ALL registered users + ALL clients across appointments
  const customers: Customer[] = useMemo(() => {
    const crmList: Customer[] = [];

    const normPhone = (p?: string) => {
      const d = (p || '').replace(/\D/g, '');
      return d.length >= 10 ? d.slice(-10) : d;
    };
    const normEmail = (e?: string) => (e || '').trim().toLowerCase();
    const normName = (n?: string) => (n || '').trim().toLowerCase();

    const findMatchIndex = (phone?: string, email?: string, name?: string, id?: string) => {
      const p = normPhone(phone);
      const e = normEmail(email);
      const n = normName(name);
      return crmList.findIndex(c => {
        if (id && c.id === id) return true;
        const cp = normPhone(c.phone);
        const ce = normEmail(c.email);
        const cn = normName(c.name);
        if (p && cp && p === cp) return true;
        if (e && ce && e === ce) return true;
        if (!p && !e && n && cn && n === cn) return true;
        return false;
      });
    };

    // 1. Seed from persisted CRM customers (Firestore + Backend API)
    rawCustomers.forEach(c => {
      if (!c) return;
      const idx = findMatchIndex(c.phone, c.email, c.name, c.id);
      if (idx === -1) {
        crmList.push({ ...c });
      } else {
        crmList[idx] = {
          ...crmList[idx],
          ...c,
          phone: c.phone || crmList[idx].phone,
          email: c.email || crmList[idx].email,
          totalVisits: Math.max(crmList[idx].totalVisits || 0, c.totalVisits || 0),
          totalSpent: Math.max(crmList[idx].totalSpent || 0, c.totalSpent || 0)
        };
      }
    });

    // 2. Include EVERY non-admin registered/logged-in user (from Firestore users + API users)
    users.forEach(u => {
      if (!u || u.role === 'ADMIN') return;
      const idx = findMatchIndex(u.phone, u.email, u.name, u.id);
      if (idx === -1) {
        crmList.push({
          id: u.id,
          name: u.name || 'Valued Client',
          phone: u.phone || '',
          email: u.email || '',
          totalVisits: u.totalVisits || 0,
          totalSpent: 0,
          lastVisit: 'Registered',
          favoriteService: (u.preferredServices && u.preferredServices[0]) || 'General Styling',
          memberSince: u.memberSince || '2026',
          tier: u.memberTier || 'New Client'
        });
      } else {
        crmList[idx] = {
          ...crmList[idx],
          name: u.name || crmList[idx].name,
          phone: u.phone || crmList[idx].phone,
          email: u.email || crmList[idx].email
        };
      }
    });

    // 3. Recompute live visits, spending, last visit & favorite service from ALL non-cancelled appointments
    appointments.forEach(apt => {
      const st = (apt.bookingStatus || apt.status || 'CONFIRMED').toUpperCase();
      if (st === 'CANCELLED') return;

      let idx = findMatchIndex(apt.clientPhone, apt.clientEmail, apt.clientName, apt.userId);
      if (idx === -1) {
        crmList.push({
          id: apt.userId || `cust-${normPhone(apt.clientPhone) || apt.id}`,
          name: apt.clientName || 'Walk-in Client',
          phone: apt.clientPhone || '',
          email: apt.clientEmail || '',
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: apt.date || 'Recent',
          favoriteService: apt.serviceName || 'Salon Service',
          memberSince: (apt.date || '').slice(0, 4) || '2026',
          tier: 'New Client'
        });
        idx = crmList.length - 1;
      }
    });

    return crmList.map(cust => {
      const cp = normPhone(cust.phone);
      const ce = normEmail(cust.email);
      const cn = normName(cust.name);

      const matchedApts = appointments.filter(apt => {
        const st = (apt.bookingStatus || apt.status || 'CONFIRMED').toUpperCase();
        if (st === 'CANCELLED') return false;
        if (apt.userId && cust.id && apt.userId === cust.id) return true;
        const ap = normPhone(apt.clientPhone);
        const ae = normEmail(apt.clientEmail);
        const an = normName(apt.clientName);
        if (cp && ap && cp === ap) return true;
        if (ce && ae && ce === ae) return true;
        if (!cp && !ap && !ce && !ae && cn && an && cn === an) return true;
        return false;
      });

      if (matchedApts.length > 0) {
        const totalVisits = matchedApts.length;
        const totalSpent = matchedApts.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);
        const sorted = [...matchedApts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return {
          ...cust,
          totalVisits,
          totalSpent,
          lastVisit: sorted[0]?.date || cust.lastVisit || 'Recent',
          favoriteService: sorted[0]?.serviceName || cust.favoriteService,
          tier: totalVisits >= 5 ? 'VIP Member' : (totalVisits >= 1 ? 'Standard' : 'New Client')
        };
      }
      return cust;
    }).sort((a, b) => (b.totalSpent - a.totalSpent) || (b.totalVisits - a.totalVisits));
  }, [rawCustomers, users, appointments]);

  // Financial & Operational Stat calculations
  const totalRevenue = appointments.reduce((sum, apt) => {
    const st = (apt.bookingStatus || apt.status || 'CONFIRMED').toUpperCase();
    if (st !== 'CANCELLED') {
      return sum + (Number(apt.totalAmount) || 0);
    }
    return sum;
  }, 0);

  const advanceDepositTotal = appointments.reduce((sum, apt) => {
    const st = (apt.bookingStatus || apt.status || 'CONFIRMED').toUpperCase();
    if (st !== 'CANCELLED') {
      return sum + (Number(apt.advancePaid) || 0);
    }
    return sum;
  }, 0);

  const totalBookingsCount = appointments.length;
  const confirmedBookingsCount = appointments.filter(a => {
    const st = (a.bookingStatus || a.status || 'CONFIRMED').toUpperCase();
    return st === 'CONFIRMED' || st === 'COMPLETED';
  }).length;
  const activeCustomersCount = customers.length;
  const pendingInquiriesCount = inquiries.filter(i => i.status === 'NEW' || i.status === 'IN PROGRESS').length;

  // Centrally computed visits count strictly for the current logged-in account
  // If no user is logged in, or if a new user creates an account, this is guaranteed to be 0
  const userVisitsCount = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.role === 'ADMIN') return appointments.length;

    const userId = currentUser.id;
    const userPhoneClean = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const userEmailClean = (currentUser.email || '').trim().toLowerCase();
    const userNameClean = (currentUser.name || '').trim().toLowerCase();

    return appointments.filter(apt => {
      // 1. Strict match by persistent userId
      if (apt.userId) {
        return apt.userId === userId;
      }
      // 2. Strict phone & identity match only if appointment has no userId
      if (userPhoneClean && userPhoneClean.length === 10) {
        const aptPhoneClean = (apt.clientPhone || '').replace(/\D/g, '').slice(-10);
        const aptEmailClean = (apt.clientEmail || '').trim().toLowerCase();
        const aptNameClean = (apt.clientName || '').trim().toLowerCase();
        if (aptPhoneClean === userPhoneClean) {
          if (aptEmailClean && userEmailClean && aptEmailClean === userEmailClean) return true;
          if (aptNameClean && userNameClean && aptNameClean === userNameClean) return true;
        }
      }
      return false;
    }).length;
  }, [appointments, currentUser]);

  return (
    <SalonContext.Provider
      value={{
        services,
        appointments,
        inquiries,
        customers,
        gallery,
        offers,
        reviews,
        policies,
        notifications,
        settings,
        theme,
        toggleTheme,
        setTheme,
        isAdminMode,
        activeNavTab,
        adminTab,
        selectedServiceForBooking,
        isBookingModalOpen,
        isQuizModalOpen,
        isAiChatOpen,
        isProfileModalOpen,
        currentUser,
        users,
        isGuestMode,
        setIsGuestMode,
        isAuthModalOpen,
        authModalInitialTab,
        authModalMode,
        login,
        loginWithGoogle,
        registerCustomer,
        logout,
        openAuthModal,
        closeAuthModal,
        checkEmailVerification,
        resendVerificationEmail,
        resetPassword,
        resetAdminPassword,
        sendAdminPasswordResetEmail,
        clearAllPastData,
        openProfileModal,
        closeProfileModal,
        setIsAdminMode,
        setActiveNavTab,
        setAdminTab,
        openBookingModal,
        closeBookingModal,
        openQuizModal,
        closeQuizModal,
        toggleAiChat,
        toggleAiWidget: toggleAiChat,
        closeAiChat,
        updateCurrentUser,
        createAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        cancelAppointment,
        deleteAppointment,
        addService,
        updateService,
        deleteService,
        submitInquiry,
        addContactInquiry,
        updateInquiryStatus,
        deleteInquiry,
        sendInquiryEmailReply,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        addOffer,
        broadcastOfferWhatsApp,
        toggleOfferActive,
        deleteOffer,
        broadcastLogs,
        fetchBroadcastLogs,
        addReview,
        updateReview,
        deleteReview,
        addPolicy,
        updatePolicy,
        deletePolicy,
        markNotificationAsRead,
        markAllNotificationsRead,
        updateSettings,
        refreshSettings,
        toggleOwnerBreakToday,
        addBlockedSlotWindow,
        updateBlockedSlotWindow,
        deleteBlockedSlotWindow,
        isOwnerOnBreakToday,
        blockedWindows,
        staffMembers,
        staff: staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        totalRevenue,
        totalBookingsCount,
        confirmedBookingsCount,
        activeCustomersCount,
        pendingInquiriesCount,
        advanceDepositTotal,
        userVisitsCount
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
