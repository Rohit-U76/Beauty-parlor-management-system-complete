import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  Printer,
  FileText,
  MapPin,
  Info,
  Flame,
  Zap,
  AlertCircle,
  MessageSquare,
  Receipt,
  Eye
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { DirectUpiPaymentModal } from './DirectUpiPaymentModal';
import { ServiceItem, Appointment, PriceTierVariant } from '../types';
import { ModernSalonLogo } from './ModernSalonLogo';
import { SALON_TIME_SLOTS, SALON_SLOT_DETAILS, getSlotAvailability, getDayAvailabilitySummary, isSlotAvailableForDate, getLocalDateString } from '../utils/availability';
import { printSalonReceipt, downloadReceiptFile } from '../utils/receiptPrinter';
import { ReceiptModal } from './ReceiptModal';
import { AppointmentPassModal } from './AppointmentPassModal';

export const BookingModal: React.FC = () => {
  const {
    isBookingModalOpen,
    closeBookingModal,
    services,
    selectedServiceForBooking,
    offers,
    createAppointment,
    settings,
    currentUser,
    appointments,
    isOwnerOnBreakToday,
    blockedWindows
  } = useSalon();

  // Wizard steps: 1 = Service & Tier Variant, 2 = Date & Slot, 3 = Client Details & Advance Payment, 4 = Confirmation Receipt
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<PriceTierVariant | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>('Self-Employed (Master Stylist & Founder)');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(SALON_TIME_SLOTS[0]);
  
  // Client details
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  
  // Coupon
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showPassModal, setShowPassModal] = useState<boolean>(false);

  // Stylists list - "Self Employed" default
  const stylists = [
    'Self-Employed (Master Stylist & Founder)',
    'Senior Beauty & Skin Specialist',
    'Certified Hair & Chemical Treatment Expert'
  ];

  const resetBookingForm = (targetService?: ServiceItem | null) => {
    const dateStr = getLocalDateString();
    setSelectedDate(dateStr);
    setSelectedTimeSlot(SALON_TIME_SLOTS[0]);
    setSelectedStylist('Self-Employed (Master Stylist & Founder)');
    const srv = targetService !== undefined ? targetService : (selectedServiceForBooking || services[0] || null);
    setSelectedService(srv);
    if (srv && srv.tierOptions && srv.tierOptions.length > 0) {
      setSelectedTier(srv.tierOptions[0]);
    } else {
      setSelectedTier(null);
    }
    setClientName(currentUser?.name || '');
    setClientPhone(currentUser?.phone || '');
    setClientEmail(currentUser?.email || '');
    setSpecialNotes('');
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    setConfirmedBooking(null);
    setStep(1);
  };

  // Set default date (today or tomorrow) and fresh state on modal open
  useEffect(() => {
    if (isBookingModalOpen) {
      const dateStr = getLocalDateString();
      setSelectedDate(dateStr);
      const targetService = selectedServiceForBooking || services[0] || null;
      setSelectedService(targetService);
      if (targetService && targetService.tierOptions && targetService.tierOptions.length > 0) {
        setSelectedTier(targetService.tierOptions[0]);
      } else {
        setSelectedTier(null);
      }
      if (currentUser) {
        setClientName(prev => prev || currentUser.name || '');
        setClientPhone(prev => prev || currentUser.phone || '');
        setClientEmail(prev => prev || currentUser.email || '');
      }
      setStep(1);
      setConfirmedBooking(null);
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    }
  }, [isBookingModalOpen, selectedServiceForBooking, currentUser]);

  // Enforce available slots based on time constraints & admin blackout / owner breaks
  useEffect(() => {
    if (!selectedDate) return;
    if (!isSlotAvailableForDate(selectedTimeSlot, selectedDate, blockedWindows, isOwnerOnBreakToday)) {
      const firstAvail = SALON_TIME_SLOTS.find(s => isSlotAvailableForDate(s, selectedDate, blockedWindows, isOwnerOnBreakToday));
      if (firstAvail) {
        setSelectedTimeSlot(firstAvail);
      }
    }
  }, [selectedDate, selectedTimeSlot, blockedWindows, isOwnerOnBreakToday]);

  const handleSelectService = (srv: ServiceItem) => {
    setSelectedService(srv);
    if (srv.tierOptions && srv.tierOptions.length > 0) {
      setSelectedTier(srv.tierOptions[0]);
    } else {
      setSelectedTier(null);
    }
  };

  if (!isBookingModalOpen) return null;

  // Calculate active price based on selected tier or base service price
  const activeBasePrice = selectedTier ? selectedTier.price : (selectedService ? selectedService.price : 0);
  const activeDuration = selectedTier?.durationMinutes || selectedService?.durationMinutes || 30;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const netTotal = Math.max(0, activeBasePrice - discountAmount);
  
  // 10% Advance Deposit calculation
  const advancePercentage = settings.advancePercentage || 10;
  const advanceDeposit = Math.round((netTotal * advancePercentage) / 100);
  const balanceAtSalon = netTotal - advanceDeposit;

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    const matched = offers.find(
      o => (o.code || '').toUpperCase() === couponCode.trim().toUpperCase() && o.active
    );

    if (matched) {
      if (activeBasePrice < matched.minBookingAmount) {
        setCouponError(`Minimum service amount of ₹${matched.minBookingAmount} required for this coupon.`);
        return;
      }
      let disc = 0;
      if (matched.discountPercent) {
        disc = Math.round((activeBasePrice * matched.discountPercent) / 100);
      } else if (matched.discountAmount) {
        disc = matched.discountAmount;
      }
      setAppliedCoupon({ code: matched.code, discount: disc });
      setCouponError('');
    } else {
      setCouponError('Invalid or expired promo code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProceedToPayment = () => {
    setFormError('');
    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError('Please provide your full name and 10-digit mobile number to confirm your booking pass.');
      return;
    }
    if (!isSlotAvailableForDate(selectedTimeSlot, selectedDate, blockedWindows, isOwnerOnBreakToday)) {
      setFormError('The selected time slot is currently unavailable, already passed, or the salon is closed. Please select an upcoming open slot.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (
    paymentId: string,
    utr: string,
    scannerUsed?: string,
    isBankVerified: boolean = true,
    bankVerifiedSource: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE' = 'SMS_WEBHOOK',
    bankName?: string,
    paymentScreenshotUrl?: string
  ) => {
    setShowPaymentModal(false);
    if (!selectedService) return;

    const serviceTitle = selectedTier 
      ? `${selectedService.name} (${selectedTier.label})`
      : selectedService.name;

    try {
      const created = await createAppointment({
        serviceId: selectedService.id,
        serviceName: serviceTitle,
        category: selectedService.category,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        stylistName: selectedStylist,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        notes: specialNotes,
        couponCode: appliedCoupon?.code,
        totalAmount: netTotal,
        advanceAmount: advanceDeposit,
        balanceDue: balanceAtSalon,
        upiTransactionId: utr,
        paymentMethod: 'Direct Bank UPI / Scanner',
        scannerUsed: scannerUsed || 'MODERN JENTS PARLOUR',
        razorpayPaymentId: utr,
        razorpayOrderId: paymentId,
        paymentStatus: isBankVerified ? 'PAID' : 'PENDING',
        bookingStatus: isBankVerified ? 'CONFIRMED' : 'PENDING',
        status: isBankVerified ? 'CONFIRMED' : 'PENDING',
        bankVerifiedAt: isBankVerified ? new Date().toISOString() : undefined,
        bankVerifiedSource: isBankVerified ? bankVerifiedSource : undefined,
        bankName,
        paymentScreenshotUrl,
        holdExpiresAt: !isBankVerified ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : undefined
      });

      setConfirmedBooking(created);
      setShowPassModal(true);
      setStep(4);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#141418] border border-purple-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-purple-50/60 dark:bg-[#0e0e11] border-b border-purple-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ModernSalonLogo size="sm" showTagline={false} />
            <div className="truncate border-l border-purple-200 dark:border-zinc-800 pl-3">
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                {step === 4 ? 'Appointment Confirmation Pass' : 'Schedule Appointment'}
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                {step === 4 
                  ? `${advancePercentage}% Advance Deposit Verified • Digital Pass Ready`
                  : `${advancePercentage}% Online Deposit via UPI / Razorpay • ${100 - advancePercentage}% Balance at Counter`
                }
              </p>
            </div>
          </div>

          <button
            onClick={closeBookingModal}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-zinc-800 transition shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Steps 1 to 3) */}
        {step < 4 && (
          <div className="bg-purple-50/30 dark:bg-[#101014] border-b border-purple-100 dark:border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-purple-700 dark:text-amber-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-purple-600 text-white dark:bg-amber-500/20 dark:text-amber-400 border border-purple-600 dark:border-amber-500/40 font-bold' : 'bg-purple-100 dark:bg-zinc-800 text-zinc-500'}`}>1</span>
              <span>Select Service</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">→</span>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-purple-700 dark:text-amber-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-purple-600 text-white dark:bg-amber-500/20 dark:text-amber-400 border border-purple-600 dark:border-amber-500/40 font-bold' : 'bg-purple-100 dark:bg-zinc-800 text-zinc-500'}`}>2</span>
              <span>Date &amp; Slot</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">→</span>
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-purple-700 dark:text-amber-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-purple-600 text-white dark:bg-amber-500/20 dark:text-amber-400 border border-purple-600 dark:border-amber-500/40 font-bold' : 'bg-purple-100 dark:bg-zinc-800 text-zinc-500'}`}>3</span>
              <span>{advancePercentage}% Advance Deposit</span>
            </div>
          </div>
        )}

        {/* Modal Body with smooth scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-left bg-white dark:bg-[#141418]">
          {/* STEP 1: Service & Tier Variant Selection */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Highlight if a Custom / Preset Bundle is selected */}
              {selectedService && (!services.some(s => s.id === selectedService.id) || selectedService.id.startsWith('bundle-') || selectedService.id.startsWith('preset-')) && (
                <div className="p-4 rounded-2xl border border-purple-300 dark:border-amber-500/50 bg-purple-50/70 dark:bg-amber-500/10 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-amber-500" />
                      <span>Multi-Service Selection</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 text-[10px] font-extrabold">
                      Custom Selection
                    </span>
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">{selectedService.name}</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{selectedService.description}</p>
                  
                  {selectedService.benefits && selectedService.benefits.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {selectedService.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-purple-200 dark:border-amber-500/20 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Bundle Price: <strong className="text-purple-700 dark:text-amber-400 text-sm">₹{selectedService.price}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{advancePercentage}% Advance Deposit: ₹{Math.round((selectedService.price * advancePercentage) / 100)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  1. Select Treatment / Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => handleSelectService(srv)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        selectedService?.id === srv.id
                          ? 'border-purple-600 bg-purple-50 text-purple-950 dark:border-amber-500 dark:bg-amber-500/15 shadow-sm ring-1 ring-purple-600/40 dark:ring-amber-500/40'
                          : 'border-purple-100 dark:border-zinc-800 bg-white dark:bg-[#181820]/70 hover:border-purple-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-100 dark:border-zinc-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{srv.name}</div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{srv.durationMinutes} mins • {srv.category}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-extrabold text-purple-700 dark:text-amber-400 text-xs font-mono">
                            {srv.priceDisplay || `₹${srv.price}`}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                            {advancePercentage}% Adv: ₹{Math.round((srv.price * advancePercentage) / 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Tier Variation Picker (if selected service has multiple tiers) */}
              {selectedService?.tierOptions && selectedService.tierOptions.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 space-y-2">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                    <span>Select Specific Option / Length / Tier for {selectedService.name}:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedService.tierOptions.map((tier, idx) => {
                      const isTierActive = selectedTier?.label === tier.label;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedTier(tier)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                            isTierActive
                              ? 'border-purple-600 dark:border-amber-500 bg-purple-50 dark:bg-amber-500/20 text-purple-950 dark:text-white font-bold shadow-sm ring-1 ring-purple-600 dark:ring-amber-500'
                              : 'border-purple-100 dark:border-zinc-800 bg-white dark:bg-[#181820] text-zinc-800 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="truncate pr-2">{tier.label}</span>
                          <div className="text-right shrink-0">
                            <div className="font-mono text-purple-700 dark:text-amber-400 font-bold">₹{tier.price}</div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              Adv: ₹{Math.round((tier.price * advancePercentage) / 100)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stylist Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  2. Select Master Stylist / Grooming Artist
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {stylists.map((st) => (
                    <label
                      key={st}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between text-xs font-medium ${
                        selectedStylist === st
                          ? 'border-purple-600 dark:border-amber-500 bg-purple-50 dark:bg-amber-500/15 text-purple-950 dark:text-white font-bold'
                          : 'border-purple-100 dark:border-zinc-800 bg-white dark:bg-[#181820]/70 text-zinc-800 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="stylist"
                          checked={selectedStylist === st}
                          onChange={() => setSelectedStylist(st)}
                          className="accent-purple-600 dark:accent-amber-500"
                        />
                        <span>{st}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        Available
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Date & Slot Selection */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Selected summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400">Selected Treatment</div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {selectedService?.name} {selectedTier ? `(${selectedTier.label})` : ''}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                    Duration: ~{activeDuration} mins • Price: ₹{activeBasePrice}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{advancePercentage}% Deposit</div>
                  <div className="text-sm font-bold text-purple-700 dark:text-amber-400 font-mono">
                    ₹{advanceDeposit}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-2">
                  Select Appointment Date
                </label>
                <input
                  type="date"
                  min={getLocalDateString()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200/80 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-amber-500/40 shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
                    Select Time Slot (Salon Hours: 9:00 AM - 10:00 PM)
                  </label>
                  <span className="text-[11px] text-purple-700 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Real-time chair capacity</span>
                  </span>
                </div>

                {/* Admin Owner Break / Blackout Alert Banner */}
                {(() => {
                  const daySummary = getDayAvailabilitySummary(appointments, selectedDate, blockedWindows, isOwnerOnBreakToday);
                  if (daySummary.isFullyBlockedByAdmin) {
                    return (
                      <div className="mb-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Salon Owner Break Active • Slots Unavailable</strong>
                          <span className="text-[11px] leading-relaxed">
                            {daySummary.adminBlockReason || 'The salon owner is taking a break for this date. All appointment slots are unavailable. Please select another date for booking.'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Salon Hours & Today Availability Status Banner */}
                {(() => {
                  const todayStr = getLocalDateString();
                  const isToday = selectedDate === todayStr;
                  const daySummary = getDayAvailabilitySummary(appointments, selectedDate, blockedWindows, isOwnerOnBreakToday);
                  
                  if (daySummary.isFullyBlockedByAdmin) {
                    return (
                      <div className="mb-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div>
                          <strong className="block font-bold">Studio Closed / Holiday</strong>
                          <span className="text-[11px] opacity-90">{daySummary.adminBlockReason || 'The salon is closed on this date. Please choose another date.'}</span>
                        </div>
                      </div>
                    );
                  }

                  if (isToday && daySummary.availableSlots.length === 0) {
                    return (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="block font-bold">All Slots Concluded For Today</strong>
                          <span className="text-[11px] opacity-90">All 3-hour appointment batches for today (9:00 AM - 10:00 PM) have either started or finished. Please select tomorrow to book your chair.</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mb-3 p-2.5 rounded-2xl bg-purple-50/60 dark:bg-zinc-900 border border-purple-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400 shrink-0" />
                        <span className="text-[11px]">
                          <strong>Salon Operating Hours:</strong> 9:00 AM – 10:00 PM • Max 3 clients per slot
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {daySummary.availableSlots.length} Slots Open
                      </span>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SALON_TIME_SLOTS.map((slot) => {
                    const slotInfo = getSlotAvailability(appointments, selectedDate, slot, undefined, blockedWindows, isOwnerOnBreakToday);
                    const slotMeta = SALON_SLOT_DETAILS[slot];
                    const isSoldOut = slotInfo.status === 'SOLD_OUT';
                    const isFast = slotInfo.isFillingFast && !isSoldOut;
                    const isSelected = selectedTimeSlot === slot;
                    const isBlocked = !!slotInfo.isBlockedByAdmin;
                    const isTimePassed = isSoldOut && slotInfo.statusLabel === 'Time Passed';

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                          isBlocked
                            ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 opacity-60 cursor-not-allowed text-rose-500'
                            : isTimePassed
                            ? 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-[#111115] opacity-50 cursor-not-allowed text-zinc-400'
                            : isSoldOut
                            ? 'border-purple-100 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#121216] opacity-50 cursor-not-allowed text-zinc-400'
                            : isSelected
                            ? 'border-purple-600 dark:border-amber-500 bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-md ring-2 ring-purple-600/40 dark:ring-amber-500/40 font-bold'
                            : isFast
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-500/10 text-zinc-900 dark:text-zinc-200 hover:border-amber-500'
                            : 'border-purple-100 dark:border-zinc-800 bg-white dark:bg-[#181820] text-zinc-900 dark:text-zinc-300 hover:border-purple-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold">{slot}</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 font-medium ${
                              isSelected ? 'text-white/90 dark:text-zinc-950/90' : 'text-zinc-500 dark:text-zinc-400'
                            }`}>
                              {slotMeta ? `${slotMeta.periodLabel} (${slotMeta.durationHours} hrs)` : 'Batch Slot'}
                            </div>
                          </div>

                          <div>
                            {isBlocked ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                                Holiday
                              </span>
                            ) : isTimePassed ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                Time Passed
                              </span>
                            ) : isSoldOut ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                Fully Booked
                              </span>
                            ) : isFast ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 flex items-center gap-0.5 animate-pulse">
                                <Flame className="w-2.5 h-2.5 fill-zinc-950" />
                                <span>1 Left</span>
                              </span>
                            ) : (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-white dark:bg-zinc-950/20 dark:text-zinc-950' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              }`}>
                                Open
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? 'text-white dark:text-zinc-950 font-bold' : isBlocked ? 'text-rose-500 font-medium' : isTimePassed ? 'text-zinc-400 italic' : isFast ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-zinc-600 dark:text-zinc-400 font-medium'}>
                            {slotInfo.urgencyText}
                          </span>
                          <span className={`text-[9px] font-mono ${
                            isSelected ? 'text-white/80 dark:text-zinc-950/80 font-bold' : 'text-zinc-400'
                          }`}>
                            {slotInfo.remainingSeats}/3 Chairs
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Slot Real-Time Note */}
                {selectedTimeSlot && (() => {
                  const activeSlotInfo = getSlotAvailability(appointments, selectedDate, selectedTimeSlot, undefined, blockedWindows, isOwnerOnBreakToday);
                  if (activeSlotInfo.isBlockedByAdmin) {
                    return (
                      <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <strong>Selected slot is currently unavailable:</strong> {activeSlotInfo.urgencyText}. Please choose another open slot.
                        </div>
                      </div>
                    );
                  }
                  if (activeSlotInfo.isFillingFast && activeSlotInfo.status !== 'SOLD_OUT') {
                    return (
                      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                        <span>
                          <strong>{selectedTimeSlot} is Filling Fast!</strong> {activeSlotInfo.pendingCount > 0 ? `${activeSlotInfo.pendingCount} pending customer hold(s) active.` : 'High demand slot.'} Complete {advancePercentage}% advance deposit to lock your station.
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* STEP 3: Client Details & Advance Deposit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Mobile Number (For 24h Reminder) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-amber-500/40"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email Address (Optional for Digital Pass Receipt)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Special Notes or Allergies
                </label>
                <textarea
                  rows={2}
                  placeholder="Any hair/scalp allergies, skin sensitivity, or specific style preferences..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 dark:focus:ring-amber-500/40"
                />
              </div>

              {/* Coupon Code Section */}
              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                  <span>Have a Promo / Coupon Code?</span>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs">
                    <span>Coupon <strong>{appliedCoupon.code}</strong> Applied (-₹{appliedCoupon.discount})</span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-purple-700 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. MODERN20, MOHOL10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141418] border border-purple-200/80 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white font-mono uppercase focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-amber-500 dark:to-yellow-400 dark:hover:from-amber-400 dark:hover:to-yellow-300 text-white dark:text-zinc-950 font-bold text-xs shadow-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-amber-600 dark:text-amber-400">{couponError}</p>}
              </div>

              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Billing Summary Box */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white space-y-2.5">
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Treatment Total:</span>
                  <span className="font-mono font-bold">₹{activeBasePrice}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="border-t border-purple-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm">
                  <span>Net Service Amount:</span>
                  <span className="font-mono text-purple-700 dark:text-amber-400">₹{netTotal}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-amber-500/10 border border-purple-200 dark:border-amber-500/30 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-bold text-purple-900 dark:text-amber-300">{advancePercentage}% Online Advance Deposit Payable Now</div>
                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400">Remaining {100 - advancePercentage}% (₹{balanceAtSalon}) balance payable at salon</div>
                  </div>
                  <div className="text-base font-extrabold text-purple-700 dark:text-amber-400 font-mono">
                    ₹{advanceDeposit}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation Pass (Receipt) */}
          {step === 4 && confirmedBooking && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Your slot has been secured with a {advancePercentage}% online advance deposit.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="bg-purple-50/40 dark:bg-[#0e0e11] border border-purple-200/80 dark:border-zinc-800 rounded-3xl p-5 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-zinc-800 pb-3">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase">Booking Reference</div>
                    <div className="font-mono font-bold text-sm text-purple-700 dark:text-amber-400">
                      {confirmedBooking.bookingRef}
                    </div>
                  </div>
                  {confirmedBooking.paymentStatus === 'PAID' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      BANK DEPOSIT VERIFIED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      CONFIRMED • ADVANCE RECORDED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Client Name</span>
                    <strong className="text-zinc-900 dark:text-white">{confirmedBooking.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Contact Mobile</span>
                    <strong className="text-zinc-900 dark:text-white">{confirmedBooking.clientPhone}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Date &amp; Time</span>
                    <strong className="text-zinc-900 dark:text-white">{confirmedBooking.date} at {confirmedBooking.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Stylist</span>
                    <strong className="text-zinc-900 dark:text-white">{confirmedBooking.stylistName}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#141418] border border-purple-200/80 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Advance Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{confirmedBooking.advancePaid}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-600 dark:text-zinc-400 block text-[10px]">Balance Due at Salon</span>
                    <span className="font-bold text-zinc-900 dark:text-white">₹{confirmedBooking.balanceDue}</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-700 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500 shrink-0" />
                  <span>Modern Unisex Salon, B.N. Gund Complex, Near ICICI Bank, Mohol</span>
                </div>
              </div>

              {/* WhatsApp Automated Notification Status Card */}
              <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      Automated WhatsApp Notification Enabled
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    DISPATCHED
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Booking verification pass and appointment details have been automatically queued to the salon owner WhatsApp (<strong className="text-emerald-700 dark:text-emerald-400 font-mono">+91 81040 26257</strong>). You can also click below to chat directly or save your digital pass.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={confirmedBooking.ownerWhatsappUrl || `https://api.whatsapp.com/send?phone=918104026257&text=${encodeURIComponent(`✨ Modern Unisex Salon Booking ✨\nRef: ${confirmedBooking.bookingRef}\nClient: ${confirmedBooking.clientName} (${confirmedBooking.clientPhone})\nService: ${confirmedBooking.serviceName}\nDate: ${confirmedBooking.date} at ${confirmedBooking.timeSlot}\nAdvance Paid: ₹${confirmedBooking.advancePaid}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Salon WhatsApp (+91 81040 26257)</span>
                  </a>
                  {confirmedBooking.whatsappUrl && (
                    <a
                      href={confirmedBooking.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-white dark:bg-[#18181f] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-purple-200 dark:border-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Save / Share on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  id="booking-view-pass-btn"
                  onClick={() => setShowPassModal(true)}
                  className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-purple-600/30"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Pass</span>
                </button>
                <button
                  type="button"
                  id="booking-view-receipt-btn"
                  onClick={() => setShowReceiptModal(true)}
                  className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Official Receipt</span>
                </button>
                <button
                  type="button"
                  id="booking-print-receipt-btn"
                  onClick={async () => {
                    await printSalonReceipt(confirmedBooking);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-purple-200 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  id="booking-download-receipt-btn"
                  onClick={() => downloadReceiptFile(confirmedBooking)}
                  className="py-2.5 px-3 rounded-xl border border-purple-200 dark:border-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                  <span>Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetBookingForm(null)}
                  className="py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-amber-500/15 border border-purple-200 dark:border-amber-500/40 text-purple-700 dark:text-amber-400 hover:bg-purple-100 dark:hover:bg-amber-500/25 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book Another</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetBookingForm(null);
                    closeBookingModal();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1 to 3) */}
        {step < 4 && (
          <div className="bg-purple-50/60 dark:bg-[#0e0e11] border-t border-purple-200/80 dark:border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-amber-500 dark:via-yellow-400 dark:to-amber-500 dark:hover:from-amber-400 dark:hover:to-yellow-300 text-white dark:text-zinc-950 font-extrabold text-xs inline-flex items-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-amber-500 dark:via-yellow-400 dark:to-amber-500 dark:hover:from-amber-400 dark:hover:to-yellow-300 text-white dark:text-zinc-950 font-extrabold text-xs inline-flex items-center gap-1.5 transition shadow-xl active:scale-95 cursor-pointer"
              >
                <span>Pay ₹{advanceDeposit} Advance via UPI / Scanner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Direct Bank UPI & PhonePe QR Scanner Modal */}
      {showPaymentModal && selectedService && (
        <DirectUpiPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          advanceAmount={advanceDeposit}
          totalAmount={netTotal}
          serviceName={selectedTier ? `${selectedService.name} (${selectedTier.label})` : selectedService.name}
          clientName={clientName.trim()}
          clientEmail={clientEmail.trim()}
          clientPhone={clientPhone.trim()}
        />
      )}

      {/* Official Printable Receipt Preview Modal */}
      {confirmedBooking && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          appointment={confirmedBooking}
        />
      )}

      {/* Official Appointment Pass Modal */}
      {confirmedBooking && showPassModal && (
        <AppointmentPassModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
          appointment={confirmedBooking}
        />
      )}
    </div>
  );
};
