import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCw,
  Search,
  Receipt,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Tag,
  Eye,
  Filter,
  Copy,
  Check,
  Star,
  MessageSquare,
  Crown,
  Gift,
  LogIn,
  MapPin,
  ExternalLink,
  Edit3,
  CalendarCheck,
  Printer
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment } from '../types';
import { AppointmentPassModal } from '../components/AppointmentPassModal';
import { CustomerFeedbackForm } from '../components/CustomerFeedbackForm';
import { CustomerProfileView } from '../components/CustomerProfileView';
import { printSalonReceipt, downloadReceiptFile } from '../utils/receiptPrinter';
import { getAppointmentReminderInfo, parseAppointmentDateTime } from '../utils/appointmentReminderUtils';

export const CustomerPastAppointments: React.FC = () => {
  const {
    appointments,
    services,
    reviews,
    openBookingModal,
    setActiveNavTab,
    currentUser,
    openAuthModal,
    openProfileModal,
    cancelAppointment,
    settings
  } = useSalon();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [selectedPassAppointment, setSelectedPassAppointment] = useState<Appointment | null>(null);
  const [selectedFeedbackAppointment, setSelectedFeedbackAppointment] = useState<Appointment | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'appointments' | 'profile' | 'feedback'>('appointments');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // User-scoped appointments: For client accounts, strictly show bookings belonging to the active user!
  // If a new user creates an account, userAppointments is strictly empty [] to prevent any data leakage.
  const userAppointments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return appointments;

    const userPhoneClean = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const userId = currentUser.id;
    const userEmailClean = (currentUser.email || '').trim().toLowerCase();
    const userNameClean = (currentUser.name || '').trim().toLowerCase();

    return appointments.filter(apt => {
      // 1. Strict match by persistent userId
      if (apt.userId) {
        return apt.userId === userId;
      }
      // 2. Strict phone & identity match only if appointment was created without userId
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
    });
  }, [appointments, currentUser]);

  // Separate upcoming appointments from completed/cancelled for this user
  const upcomingAppointments = useMemo(() => {
    return userAppointments
      .filter(apt => {
        const status = apt.bookingStatus || apt.status;
        return (status === 'CONFIRMED' || status === 'PENDING') && getAppointmentReminderInfo(apt).isUpcoming;
      })
      .sort((a, b) => parseAppointmentDateTime(a.date, a.timeSlot).getTime() - parseAppointmentDateTime(b.date, b.timeSlot).getTime());
  }, [userAppointments]);

  // Filtered appointments list for this user
  const filteredAppointments = useMemo(() => {
    return userAppointments
      .filter(apt => {
        const status = apt.bookingStatus || apt.status;
        
        let matchesStatus = true;
        if (statusFilter === 'UPCOMING') {
          matchesStatus = (status === 'CONFIRMED' || status === 'PENDING') && getAppointmentReminderInfo(apt).isUpcoming;
        } else if (statusFilter === 'CONFIRMED') {
          matchesStatus = status === 'CONFIRMED';
        } else if (statusFilter === 'COMPLETED') {
          matchesStatus = status === 'COMPLETED';
        } else if (statusFilter === 'CANCELLED') {
          matchesStatus = status === 'CANCELLED';
        }
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !q ||
          apt.bookingRef.toLowerCase().includes(q) ||
          apt.clientName.toLowerCase().includes(q) ||
          apt.clientPhone.toLowerCase().includes(q) ||
          apt.serviceName.toLowerCase().includes(q) ||
          apt.category.toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userAppointments, statusFilter, searchQuery, todayStr]);

  const handleCopy = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleRebook = (apt: Appointment) => {
    const matchedService = services.find(s => s.id === apt.serviceId || s.name.toLowerCase() === apt.serviceName.toLowerCase());
    if (matchedService) {
      openBookingModal(matchedService);
    } else {
      openBookingModal();
    }
  };

  const handleOpenFeedback = (apt?: Appointment) => {
    setSelectedFeedbackAppointment(apt || null);
    setShowFeedbackModal(true);
  };

  const handlePrintReceipt = (apt: Appointment) => {
    printSalonReceipt(apt);
  };

  const handleDownloadPdf = (apt: Appointment) => {
    downloadReceiptFile(apt);
  };

  const handleWhatsAppHelp = (apt: Appointment) => {
    const text = encodeURIComponent(
      `Hello Dinesh Ghodake, I have an upcoming booking at Modern Unisex Salon Mohol.\n` +
      `*Booking Ref:* ${apt.bookingRef}\n` +
      `*Service:* ${apt.serviceName}\n` +
      `*Date & Time:* ${apt.date} at ${apt.timeSlot}\n` +
      `*Client:* ${apt.clientName}`
    );
    window.open(`https://wa.me/918104026257?text=${text}`, '_blank');
  };

  const getStatusBadge = (status?: string, aptDate?: string, aptTimeSlot?: string) => {
    const isUpcoming = aptDate
      ? getAppointmentReminderInfo({ date: aptDate, timeSlot: aptTimeSlot, bookingStatus: status } as any).isUpcoming
      : false;
    
    if (isUpcoming) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold animate-pulse">
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Upcoming Slot</span>
        </span>
      );
    }

    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed Slot</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-10 space-y-6 sm:space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Modern Unisex Salon • Mohol</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Client Appointments &amp; Profile Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Manage your upcoming and past bookings, easily reschedule slots with preserved 10% advance deposit, access digital booking passes, and keep your client styling profile updated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={openProfileModal}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-600/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Edit Profile &amp; Save</span>
          </button>

          <button
            onClick={() => openBookingModal()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm shadow-purple-600/25 transition cursor-pointer shrink-0"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Logged in User Status Banner or Login Prompt */}
      {currentUser ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">
                  {currentUser.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>{currentUser.memberTier || 'New Client'}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentUser.phone} • Preferred: {currentUser.preferredStylist || 'Master Stylist (Dinesh Ghodake)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {currentUser.loyaltyPoints !== undefined && (
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-2 font-mono">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Rewards: <strong className="text-purple-600 dark:text-purple-400 font-bold">{currentUser.loyaltyPoints} pts</strong></span>
              </div>
            )}

            <button
              onClick={openProfileModal}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile &amp; Save</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Personalize your bookings, unlock styling profile auto-fill, and manage upcoming visits seamlessly!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openProfileModal}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Setup Client Profile</span>
            </button>
            <button
              onClick={() => openAuthModal('customer', 'login')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* UPCOMING APPOINTMENTS SPOTLIGHT (Works in a modern, intuitive way) */}
      {upcomingAppointments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>⭐ Upcoming Salon Appointments</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-mono font-extrabold">
                  {upcomingAppointments.length} Confirmed
                </span>
              </h2>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              10% advance deposit confirmed • Zero reschedule fee
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={`upcoming-${apt.id}`}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md space-y-4 text-left transition-shadow"
              >
                {/* Top Details */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                        #{apt.bookingRef}
                      </span>
                      <button
                        onClick={() => handleCopy(apt.bookingRef)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                        title="Copy reference"
                      >
                        {copiedRef === apt.bookingRef ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {apt.serviceName}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Stylist: <strong className="text-zinc-900 dark:text-zinc-200">{apt.stylistName || 'Master Stylist (Dinesh Ghodake)'}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Slot Reserved</span>
                    </span>
                    <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                      ₹{apt.advancePaid} advance paid
                    </div>
                  </div>
                </div>

                {/* Timing & Date Callout */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 text-xs">
                  <div className="space-y-1">
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[11px] font-medium">Appointment Date:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-mono text-sm">
                      <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>{apt.date}</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[11px] font-medium">Reserved Time Slot:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-mono text-sm">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{apt.timeSlot}</span>
                    </span>
                  </div>
                </div>

                {/* Balance Due Notice */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Remaining balance at salon counter:</span>
                  <span className="font-bold font-mono text-amber-700 dark:text-amber-400 text-sm">
                    ₹{apt.balanceDue}
                  </span>
                </div>

                {/* Real-time UTR & Bank Deposit Verification Status */}
                {(apt.upiTransactionId || apt.razorpayPaymentId) && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    apt.isBankVerified
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {apt.isBankVerified ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                      )}
                      <span className="truncate">
                        {apt.isBankVerified
                          ? `Bank Deposit Confirmed in Union Bank A/c 4079 (UTR: ${apt.upiTransactionId || apt.razorpayPaymentId})`
                          : `UTR #${apt.upiTransactionId || 'Processing'} — Bank credit confirmation in progress`}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 shadow-sm shrink-0">
                      {apt.isBankVerified ? '✅ CREDITED' : '⏳ VERIFYING'}
                    </span>
                  </div>
                )}

                {/* Action Buttons: Pass & QR, Print Receipt, PDF Receipt, WhatsApp */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedPassAppointment(apt)}
                    className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="View Digital Pass & Details"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Pass</span>
                  </button>

                  <button
                    onClick={() => handlePrintReceipt(apt)}
                    className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Print Appointment Receipt"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-200" />
                    <span>Print Receipt</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(apt)}
                    className="py-2 px-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Download PDF Pass"
                  >
                    <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>PDF Pass</span>
                  </button>

                  <button
                    onClick={() => handleWhatsAppHelp(apt)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Contact salon desk on WhatsApp"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap">
        <button
          onClick={() => setViewMode('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'appointments'
              ? 'bg-purple-600 text-white shadow-sm font-extrabold'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All Bookings &amp; History ({userAppointments.length})</span>
        </button>

        <button
          onClick={() => setViewMode('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'profile'
              ? 'bg-purple-600 text-white shadow-sm font-extrabold'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Client Profile &amp; Preferences</span>
          {currentUser?.loyaltyPoints !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
              {currentUser.loyaltyPoints} pts
            </span>
          )}
        </button>

        <button
          onClick={() => setViewMode('feedback')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'feedback'
              ? 'bg-purple-600 text-white shadow-sm font-extrabold'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>Submit Feedback</span>
        </button>
      </div>

      {viewMode === 'profile' ? (
        <div className="animate-in fade-in duration-200">
          <CustomerProfileView
            appointments={userAppointments}
            onBookAppointment={() => openBookingModal()}
          />
        </div>
      ) : viewMode === 'feedback' ? (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
          <CustomerFeedbackForm
            onSuccess={() => {
              setTimeout(() => setViewMode('appointments'), 2500);
            }}
          />
        </div>
      ) : (
        <>
          {/* Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Total Bookings</span>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">{userAppointments.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Upcoming / Active</span>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-serif">
                {upcomingAppointments.length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Completed Visits</span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-serif">
                {userAppointments.filter(a => a.bookingStatus === 'COMPLETED' || a.status === 'COMPLETED').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Satisfaction Rate</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">4.9 ★ (CSAT 98%)</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Booking Ref, Client Name, Phone or Service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-purple-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
                {[
                  { id: 'UPCOMING', label: `Upcoming (${upcomingAppointments.length})` },
                  { id: 'ALL', label: `All (${userAppointments.length})` },
                  { id: 'CONFIRMED', label: 'Confirmed' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'CANCELLED', label: 'Cancelled' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {userAppointments.length === 0
                    ? 'No Appointments Yet'
                    : statusFilter === 'UPCOMING'
                    ? 'No Upcoming Appointments Scheduled'
                    : 'No Appointment Records Found'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  {userAppointments.length === 0
                    ? 'Welcome to Modern Unisex Salon Mohol! You have not booked any salon visits on this account yet. Reserve your slot below with our simple 10% advance deposit.'
                    : statusFilter === 'UPCOMING'
                    ? 'You do not have any active appointments due. Book your preferred slot below with our simple 10% advance deposit.'
                    : 'No bookings match your selected filter criteria. Try resetting the filters or search term.'}
                </p>
              </div>
              <button
                onClick={() => openBookingModal()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Book Your Next Appointment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filteredAppointments.map(apt => {
                const status = apt.bookingStatus || apt.status;
                const isUpcomingSlot = getAppointmentReminderInfo(apt).isUpcoming;

                return (
                  <div
                    key={apt.id}
                    className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border transition-all shadow-sm space-y-4 flex flex-col justify-between ${
                      isUpcomingSlot ? 'border-purple-500/50 hover:border-purple-500' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {/* Top Row: Ref + Status */}
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">
                            #{apt.bookingRef}
                          </span>
                          <button
                            onClick={() => handleCopy(apt.bookingRef)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                            title="Copy Reference"
                          >
                            {copiedRef === apt.bookingRef ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {apt.serviceName}
                        </h3>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(status, apt.date, apt.timeSlot)}
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-semibold">{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{apt.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{apt.clientName} ({apt.clientPhone})</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1 text-right">
                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                          <span>Total Amount:</span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">₹{apt.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> 10% Paid Online:
                          </span>
                          <span className="font-mono font-bold">₹{apt.advancePaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-1">
                          <span>Balance at Salon:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{apt.balanceDue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 italic">
                        Note: "{apt.notes}"
                      </div>
                    )}

                    {/* Real-time UTR & Bank Deposit Verification Status */}
                    {(apt.upiTransactionId || apt.razorpayPaymentId) && (
                      <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        apt.isBankVerified
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                      }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {apt.isBankVerified ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                          )}
                          <span className="truncate">
                            {apt.isBankVerified
                              ? `Bank Deposit Confirmed in Union Bank A/c 4079 (UTR: ${apt.upiTransactionId || apt.razorpayPaymentId})`
                              : `UTR #${apt.upiTransactionId || 'Processing'} — Bank credit verification pending`}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 shadow-sm shrink-0">
                          {apt.isBankVerified ? '✅ CREDITED' : '⏳ VERIFYING'}
                        </span>
                      </div>
                    )}

                    {/* Bottom Actions: Pass, Reschedule, Feedback & Rebook */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedPassAppointment(apt)}
                          className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Pass &amp; Details</span>
                        </button>

                        <button
                          onClick={() => printSalonReceipt(apt)}
                          className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>

                        <button
                          onClick={() => handleOpenFeedback(apt)}
                          className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          title="Submit rating for this visit"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Rate Visit</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleRebook(apt)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-white" />
                        <span>Rebook</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Digital Pass Modal */}
      {selectedPassAppointment && (
        <AppointmentPassModal
          isOpen={true}
          appointment={selectedPassAppointment}
          onClose={() => setSelectedPassAppointment(null)}
        />
      )}

      {/* Real-time Feedback Submission Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl">
            <CustomerFeedbackForm
              initialAppointment={selectedFeedbackAppointment}
              isModal={true}
              onClose={() => setShowFeedbackModal(false)}
              onSuccess={() => {
                // Keep open to view confirmation/coupon
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
