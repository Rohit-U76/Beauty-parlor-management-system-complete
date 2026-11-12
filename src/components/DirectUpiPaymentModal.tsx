import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  Building2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Zap,
  AlertCircle,
  HelpCircle,
  Upload,
  ArrowRight,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useSalon } from '../context/SalonContext';

export interface DirectUpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData?: {
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    serviceName: string;
    date: string;
    timeSlot: string;
  };
  advanceAmount?: number;
  totalAmount?: number;
  serviceName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  onPaymentSuccess?: (paymentId: string, utr: string, scannerUsed: string, isBankVerified?: boolean, bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE', bankName?: string, paymentScreenshotUrl?: string) => void;
  onSuccess?: (paymentId: string, utr: string, scannerUsed: string, isBankVerified?: boolean, bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE', bankName?: string, paymentScreenshotUrl?: string) => void;
}

type ScannerOption = 'scanner1' | 'scanner2' | 'bank';

// Primary confidential bank & UPI details (defined at module level to prevent re-creation on renders)
const BANK_INFO = {
  accountHolder: 'MODERN JENTS PARLOUR',
  accountNumber: '50200072074441',
  ifsc: 'HDFC0000635',
  branch: 'SOLAPUR',
  accountType: 'Current Account',
  bankName: 'HDFC Bank',
  mobile: '8104026257',
  email: 'dineshghodake941@gmail.com',
  // Bank of India details from official cheque leaf
  boi: {
    accountHolder: 'DINESH VITTHAL GHODAKE',
    accountNumber: '070116310000428',
    ifsc: 'BKID0000701',
    branch: 'SUBHASH CHOWK Branch, 142 Murarji Peth, Solapur - 413001',
    bankName: 'Bank of India',
    accountType: 'Savings Account'
  },
  scanner1: {
    id: 'scanner1',
    name: 'MODERN JENTS PARLOUR',
    subtitle: 'Primary Salon Current Account (PhonePe / UPI)',
    upiId: 'ghodakedinesh@ybl',
    posterImage: '/qr-modern-jents-parlour.jpg'
  },
  scanner2: {
    id: 'scanner2',
    name: 'DINESH VITTHAL GHODAKE',
    subtitle: 'Secondary Owner Account (PhonePe / UPI)',
    upiId: '8104026257@axl',
    posterImage: '/qr-dinesh-ghodake.jpg'
  }
};

export const DirectUpiPaymentModal: React.FC<DirectUpiPaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  advanceAmount: propAdvance,
  totalAmount: propTotal,
  serviceName: propServiceName,
  clientName: propClientName,
  clientEmail: propClientEmail,
  clientPhone: propClientPhone,
  onPaymentSuccess,
  onSuccess
}) => {
  const { settings } = useSalon();

  const [selectedOption, setSelectedOption] = useState<ScannerOption>('scanner1');
  const [selectedBankSubTab, setSelectedBankSubTab] = useState<'hdfc' | 'boi'>('hdfc');
  const [showPosterStandee, setShowPosterStandee] = useState<boolean>(false);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [uploadedScreenshotUrl, setUploadedScreenshotUrl] = useState<string>('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Real Bank SMS Webhook Polling & Verification States
  const [isPollingBankSms, setIsPollingBankSms] = useState<boolean>(false);
  const [pollAttempt, setPollAttempt] = useState<number>(1);
  const [verifiedBankName, setVerifiedBankName] = useState<string>('');
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [showManualAdminFallback, setShowManualAdminFallback] = useState<boolean>(false);
  const [isSubmittingManualHold, setIsSubmittingManualHold] = useState<boolean>(false);

  const [showDesktopScanNotice, setShowDesktopScanNotice] = useState<boolean>(false);
  const [hasLaunchedUpiApp, setHasLaunchedUpiApp] = useState<boolean>(false);
  const [showReturnedFromAppBanner, setShowReturnedFromAppBanner] = useState<boolean>(false);

  // Handler to upload PhonePe payment receipt screenshot
  const handleScreenshotFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScreenshotUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setScreenshotUploadError('Image size exceeds 8MB limit. Please choose a smaller screenshot.');
      return;
    }

    setScreenshotUploadError('');
    setIsUploadingScreenshot(true);
    setScreenshotFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/appointments/upload-screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              fileName: file.name,
              bookingRef: sessionRefCode
            })
          });
          const resData = await res.json();
          if (resData.success && resData.screenshotUrl) {
            setUploadedScreenshotUrl(resData.screenshotUrl);
          } else {
            // Fallback to direct data URL so screenshot is never lost
            setUploadedScreenshotUrl(base64Data);
          }
        } catch {
          setUploadedScreenshotUrl(base64Data);
        } finally {
          setIsUploadingScreenshot(false);
        }
      };
      reader.onerror = () => {
        setIsUploadingScreenshot(false);
        setScreenshotUploadError('Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingScreenshot(false);
      setScreenshotUploadError('Failed to process image. Please try again.');
    }
  };

  const effectiveAdvance = orderData?.advanceAmount ?? propAdvance ?? 0;
  const effectiveTotal = orderData?.totalAmount ?? propTotal ?? 0;
  const effectiveRemaining = orderData?.remainingAmount ?? (effectiveTotal - effectiveAdvance);
  const effectiveName = orderData?.customerName ?? propClientName ?? 'Valued Client';
  const effectivePhone = orderData?.customerPhone ?? propClientPhone ?? '';
  const effectiveService = orderData?.serviceName ?? propServiceName ?? 'Salon Service';
  const effectiveSuccess = onPaymentSuccess || onSuccess || (() => {});

  const currentUpiTarget = useMemo(() => {
    if (selectedOption === 'scanner2') {
      return {
        id: 'scanner2',
        name: settings.secondaryAccountHolder || 'DINESH VITTHAL GHODAKE',
        subtitle: 'Secondary Owner Account (PhonePe / UPI)',
        upiId: settings.secondaryUpiId || BANK_INFO.scanner2.upiId,
        posterImage: settings.secondaryUpiQrCodeUrl || BANK_INFO.scanner2.posterImage
      };
    }
    // Scanner 1: Primary Salon Current Account (Union Bank / PhonePe QR)
    return {
      id: 'scanner1',
      name: settings.accountHolder || settings.salonName || BANK_INFO.scanner1.name,
      subtitle: `${settings.bankName || 'Union Bank'} (PhonePe / UPI)`,
      upiId: settings.merchantUpiId || settings.upiId || '9975236976@ibl',
      posterImage: settings.upiQrCodeUrl || '/qr-union-bank-phonepe.jpg'
    };
  }, [selectedOption, settings]);

  // Stable session booking reference code (generated once per modal mount)
  const [sessionRefCode] = useState(() => `MS-${Math.floor(100000 + Math.random() * 900000)}`);

  // Stable NPCI UPI URI with exact advance amount for the chosen service
  const upiIntentUri = useMemo(() => {
    return `upi://pay?pa=${currentUpiTarget.upiId}&pn=${encodeURIComponent(currentUpiTarget.name)}&am=${effectiveAdvance}&cu=INR&tn=${encodeURIComponent('Booking Pass ' + sessionRefCode)}`;
  }, [currentUpiTarget.upiId, currentUpiTarget.name, effectiveAdvance, sessionRefCode]);

  // Generate Dynamic QR Code image safely without infinite re-render loops
  useEffect(() => {
    if (!isOpen || selectedOption === 'bank' || !upiIntentUri) return;
    let isCancelled = false;

    QRCode.toDataURL(upiIntentUri, {
      width: 280,
      margin: 1,
      color: {
        dark: '#18181b',
        light: '#ffffff'
      }
    })
      .then(url => {
        if (!isCancelled) {
          setDynamicQrDataUrl(url);
        }
      })
      .catch(err => console.error('Failed to generate dynamic UPI QR:', err));

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedOption, upiIntentUri]);

  if (!isOpen) return null;

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle mobile return callback when user switches back from PhonePe / GPay app
  useEffect(() => {
    if (!hasLaunchedUpiApp) return;

    const handleReturnToApp = () => {
      if (document.visibilityState === 'visible') {
        setShowReturnedFromAppBanner(true);
        setTimeout(() => {
          const inputEl = document.getElementById('upi-utr-input');
          if (inputEl) inputEl.focus();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleReturnToApp);
    window.addEventListener('focus', handleReturnToApp);

    return () => {
      document.removeEventListener('visibilitychange', handleReturnToApp);
      window.removeEventListener('focus', handleReturnToApp);
    };
  }, [hasLaunchedUpiApp]);

  // Trigger PhonePe payment navigation (launches PhonePe app on mobile or highlights scanner on PC)
  const handleTriggerPhonePePayment = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      setHasLaunchedUpiApp(true);
      const phonePeSpecificUri = `phonepe://pay?pa=${currentUpiTarget.upiId}&pn=${encodeURIComponent(currentUpiTarget.name)}&am=${effectiveAdvance}&cu=INR&tn=${encodeURIComponent('Booking Pass ' + sessionRefCode)}`;
      window.location.href = phonePeSpecificUri;
      setTimeout(() => {
        window.location.href = upiIntentUri;
      }, 600);
    } else {
      // On PC/Desktop: Show clear instruction notice to scan the QR code using PhonePe on mobile
      setShowDesktopScanNotice(true);
      setTimeout(() => {
        const inputEl = document.getElementById('upi-utr-input');
        if (inputEl) inputEl.focus();
      }, 300);
    }
  };

  // Submit and verify payment via UTR reference
  const handleVerifyPayment = async () => {
    setVerificationError('');
    setShowManualAdminFallback(false);
    const cleanUtr = utrNumber.trim();

    if (!cleanUtr) {
      setVerificationError('Please enter the 12-digit UPI Reference Number / UTR from your PhonePe/GPay transaction receipt.');
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      setVerificationError('Invalid UTR format. A valid Indian banking UPI UTR must contain exactly 12 numeric digits (e.g. 431056789123).');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/payment/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: cleanUtr,
          advanceAmount: effectiveAdvance,
          totalAmount: effectiveTotal,
          scannerUsed: selectedOption === 'bank' ? 'HDFC Bank Account' : currentUpiTarget.name,
          customerName: effectiveName,
          serviceName: effectiveService
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsVerifying(false);
        setVerificationError(data.error || 'Payment verification failed. Please check the UTR and try again.');
        return;
      }

      // Case 1: Authentic Bank SMS already arrived and matched in database!
      if (data.verified) {
        setIsVerifying(false);
        setVerifiedBankName(data.bankName || 'HDFC Bank');
        setVerifiedAmount(data.depositAmount || effectiveAdvance);
        setPaymentVerified(true);
        setShowSuccessScreen(true);
        triggerCelebration();

        const scannerLabel = selectedOption === 'bank' 
          ? 'HDFC Bank Direct Transfer' 
          : `UPI Scanner: ${currentUpiTarget.name}`;

        setTimeout(() => {
          effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, true, 'SMS_WEBHOOK', data.bankName, uploadedScreenshotUrl);
        }, 1800);
        return;
      }

      // Case 2: Awaiting Bank SMS from owner SIM (8104026257) -> start real-time polling listener
      setIsVerifying(false);
      setIsPollingBankSms(true);
      setPollAttempt(1);

      let attempts = 0;
      const maxAttempts = 8; // 8 attempts x 3 seconds = 24 seconds total listen window
      const pollTimer = setInterval(async () => {
        attempts++;
        setPollAttempt(attempts);

        try {
          const pollRes = await fetch(`/api/payment/check-status/${cleanUtr}`);
          const pollData = await pollRes.json();

          if (pollData.success && pollData.isVerified) {
            clearInterval(pollTimer);
            setIsPollingBankSms(false);
            setVerifiedBankName(pollData.deposit?.bankName || 'HDFC Bank');
            setVerifiedAmount(pollData.deposit?.amount || effectiveAdvance);
            setPaymentVerified(true);
            setShowSuccessScreen(true);
            triggerCelebration();

            const scannerLabel = selectedOption === 'bank' 
              ? 'HDFC Bank Direct Transfer' 
              : `UPI Scanner: ${currentUpiTarget.name}`;

            setTimeout(() => {
              effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, true, 'SMS_WEBHOOK', pollData.deposit?.bankName, uploadedScreenshotUrl);
            }, 1800);
            return;
          }
        } catch (e) {
          console.warn('Poll error checking UTR status:', e);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollTimer);
          setIsPollingBankSms(false);
          setShowManualAdminFallback(true);
        }
      }, 3000);

    } catch (err: any) {
      console.error('UPI verification network error:', err);
      setIsVerifying(false);
      setIsPollingBankSms(false);
      setVerificationError('Unable to verify UPI payment right now. Please check your network connection and try again.');
    }
  };

  // Fallback: Submit booking with a 15-minute chair hold for Owner manual confirmation
  const handleSubmitManualHold = () => {
    setIsSubmittingManualHold(true);
    const cleanUtr = utrNumber.trim();
    const scannerLabel = selectedOption === 'bank' 
      ? 'HDFC Bank Direct Transfer' 
      : `UPI Scanner: ${currentUpiTarget.name}`;

    setShowSuccessScreen(true);
    triggerCelebration();

    setTimeout(() => {
      setIsSubmittingManualHold(false);
      effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, false, 'NONE', undefined, uploadedScreenshotUrl);
    }, 1800);
  };

  const handleFinishSuccess = () => {
    const cleanUtr = utrNumber.trim();
    const scannerLabel = selectedOption === 'bank' 
      ? 'HDFC Bank Direct Transfer' 
      : `UPI Scanner: ${currentUpiTarget.name}`;
    effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, paymentVerified, paymentVerified ? 'SMS_WEBHOOK' : 'NONE', verifiedBankName, uploadedScreenshotUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#121216] border border-amber-500/30 dark:border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-amber-500/15 dark:from-amber-500/10 dark:to-zinc-900 border-b border-amber-500/20 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Direct Bank UPI &amp; QR Payment</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  0% Convenience Fee
                </span>
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                100% of your deposit goes directly to Modern Unisex Salon's official bank account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* Amount & Service Summary Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Booking Service</span>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{effectiveService}</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                Client: <strong className="text-zinc-900 dark:text-zinc-200">{effectiveName}</strong> ({effectivePhone})
              </p>
            </div>

            <div className="text-right pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                10% Advance Deposit
              </span>
              <div className="text-2xl font-black text-purple-700 dark:text-amber-400 font-mono">
                ₹{effectiveAdvance}
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Balance ₹{effectiveRemaining} at counter
              </span>
            </div>
          </div>

          {/* Scanner / Payment Mode Switcher Tabs */}
          <div>
            <label className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block mb-2">
              Select Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedOption('scanner1'); setShowPosterStandee(false); }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedOption === 'scanner1'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Scanner 1</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.accountHolder || 'MODERN JENTS'}</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedOption('scanner2'); setShowPosterStandee(false); }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedOption === 'scanner2'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  <Smartphone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">Scanner 2</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.secondaryAccountHolder || 'DINESH GHODAKE'}</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedOption('bank'); }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedOption === 'bank'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Bank Account</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.bankName || 'Union Bank'}</div>
              </button>
            </div>
          </div>

          {/* VIEW: SCANNER 1 OR 2 */}
          {selectedOption !== 'bank' && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3.5 text-center">
              
              <div className="flex items-center justify-between text-left">
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {currentUpiTarget.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    UPI VPA: <span className="text-purple-600 dark:text-amber-400 font-semibold">{currentUpiTarget.upiId}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(currentUpiTarget.upiId, 'upi')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedField === 'upi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'upi' ? 'Copied' : 'Copy UPI'}</span>
                </button>
              </div>

              {/* QR Code Container (Interactive & Clickable for Both Mobile & Desktop) */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border-2 border-dashed border-purple-500/40 shadow-inner">
                {showPosterStandee ? (
                  <div
                    onClick={handleTriggerPhonePePayment}
                    title="Scan with PhonePe / Tap on Mobile"
                    className="relative group cursor-pointer transition hover:scale-102"
                  >
                    <img
                      src={currentUpiTarget.posterImage}
                      alt={currentUpiTarget.name}
                      className="w-48 sm:w-56 h-auto rounded-xl object-contain shadow-md mx-auto"
                    />
                    <div className="text-[10px] text-zinc-700 font-bold mt-2 text-center">
                      Official PhonePe Store Standee • Scan with PhonePe App
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {dynamicQrDataUrl ? (
                      <button
                        type="button"
                        onClick={handleTriggerPhonePePayment}
                        title="Scan with PhonePe on Mobile"
                        className="group relative block p-2 bg-white rounded-xl shadow-md transition hover:scale-102 cursor-pointer border border-purple-200"
                      >
                        <img
                          src={dynamicQrDataUrl}
                          alt={`Scan to pay ₹${effectiveAdvance}`}
                          className="w-44 sm:w-48 h-44 sm:h-48 object-contain"
                        />
                      </button>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs">
                        Generating Dynamic QR...
                      </div>
                    )}
                    
                    <div className="mt-2 text-center">
                      <div className="font-extrabold text-sm text-zinc-900 font-mono">
                        Scan to Pay: ₹{effectiveAdvance}
                      </div>
                      <div className="text-[10px] text-purple-700 font-bold mt-0.5">
                        Amount is automatically locked to ₹{effectiveAdvance}.
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggle Standee View */}
                <button
                  type="button"
                  onClick={() => setShowPosterStandee(!showPosterStandee)}
                  className="mt-2 text-[10px] text-purple-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  {showPosterStandee ? '⚡ Switch to Exact Dynamic Amount QR' : '🖼️ View Original PhonePe Poster Standee'}
                </button>
              </div>

              {/* Direct PhonePe App Trigger / Scan Guide Button */}
              <button
                type="button"
                onClick={handleTriggerPhonePePayment}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5f259f] to-[#7b32c6] hover:from-[#511e8a] hover:to-[#6a29ab] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-white text-[#5f259f] flex items-center justify-center font-bold text-[10px]">
                  पे
                </div>
                <span>Pay ₹{effectiveAdvance} via PhonePe (Tap on Mobile / Scan on PC)</span>
                <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>
          )}

          {/* VIEW: DIRECT BANK TRANSFER (HDFC BANK / BANK OF INDIA) */}
          {selectedOption === 'bank' && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                  <span>Direct Bank Account Transfer</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBankSubTab('hdfc')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      selectedBankSubTab === 'hdfc'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    HDFC Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBankSubTab('boi')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      selectedBankSubTab === 'boi'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Bank of India
                  </button>
                </div>
              </div>

              {selectedBankSubTab === 'hdfc' ? (
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Holder:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.accountHolder}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.accountHolder, 'holder')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'holder' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">{BANK_INFO.accountNumber}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.accountNumber, 'acc')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">IFSC Code:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{BANK_INFO.ifsc}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.ifsc, 'ifsc')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Bank &amp; Branch:</span>
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.bankName}, {BANK_INFO.branch}</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Type:</span>
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.accountType}</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Holder:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.boi.accountHolder}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.boi.accountHolder, 'holder_boi')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'holder_boi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">{BANK_INFO.boi.accountNumber}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.boi.accountNumber, 'acc_boi')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'acc_boi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">IFSC Code:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{BANK_INFO.boi.ifsc}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_INFO.boi.ifsc, 'ifsc_boi')}
                        className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                      >
                        {copiedField === 'ifsc_boi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Bank &amp; Branch:</span>
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.boi.bankName}, {BANK_INFO.boi.branch}</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Type:</span>
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{BANK_INFO.boi.accountType}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VERIFICATION & ANTI-CHEATING SECTION */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-3">
            {showDesktopScanNotice && !paymentVerified && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2.5 animate-in fade-in duration-200">
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>📱 Paying from a Laptop or Desktop?</span>
                    <button
                      type="button"
                      onClick={() => setShowDesktopScanNotice(false)}
                      className="text-amber-700 dark:text-amber-400 hover:text-amber-900 cursor-pointer font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[10px] leading-relaxed opacity-90">
                    1. Open <strong>PhonePe</strong>, <strong>Google Pay</strong>, or <strong>Paytm</strong> on your mobile phone.<br />
                    2. Scan the QR code shown above (the exact advance amount of <strong>₹{effectiveAdvance}</strong> is pre-locked).<br />
                    3. Enter your UPI PIN inside your phone's official PhonePe app to complete the real bank transfer.<br />
                    4. Copy the authentic <strong>12-digit UPI Reference / UTR Number</strong> from your payment receipt and enter it below.
                  </div>
                </div>
              </div>
            )}

            {showReturnedFromAppBanner && !paymentVerified && (
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-2 animate-pulse">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  <strong>Welcome back from UPI App!</strong> Please enter the 12-digit UPI UTR Number from your PhonePe/GPay receipt below to confirm your slot.
                </span>
              </div>
            )}

            {/* USER REQUESTED PROMINENT VERIFICATION NOTICE */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-amber-500/20 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-start gap-2.5 shadow-sm">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span>Send the screenshot or write the UTR number to verify and get confirmed with your seat.</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Verification: Enter 12-Digit UPI Transaction ID / UTR *</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">12 Digits Only</span>
            </div>

            <div className="relative">
              <input
                id="upi-utr-input"
                type="text"
                maxLength={12}
                placeholder="e.g. 431056789012"
                value={utrNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setUtrNumber(val);
                  setVerificationError('');
                }}
                disabled={paymentVerified}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-amber-500/40 text-zinc-900 dark:text-zinc-100 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {utrNumber.length === 12 && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
              )}
            </div>

            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                After paying in PhonePe/Google Pay, look for <strong>"UTR"</strong> or <strong>"UPI Ref No"</strong> on the payment successful screen. Every booking strictly requires this authentic 12-digit reference to generate your pass.
              </span>
            </p>

            {/* UPLOAD PAYMENT SCREENSHOT SECTION */}
            <div className="pt-2 border-t border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                  <span>Upload PhonePe / UPI Payment Screenshot</span>
                </label>
                {uploadedScreenshotUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Attached
                  </span>
                )}
              </div>

              {uploadedScreenshotUrl ? (
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={uploadedScreenshotUrl}
                      alt="Payment Screenshot Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-400 shadow-xs shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200 truncate">
                        {screenshotFileName || 'phonepe_receipt.jpg'}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Screenshot attached for Admin verification
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedScreenshotUrl('');
                      setScreenshotFileName('');
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer text-xs"
                    title="Remove Screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 dark:border-zinc-700 dark:hover:border-amber-400/60 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/50 dark:bg-zinc-950/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotFile}
                    className="hidden"
                    disabled={isUploadingScreenshot}
                  />
                  {isUploadingScreenshot ? (
                    <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-amber-400 font-bold py-1">
                      <div className="w-3.5 h-3.5 border-2 border-purple-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading receipt screenshot...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-zinc-800 text-purple-600 dark:text-amber-400 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Click to select PhonePe payment screenshot
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        PNG, JPG, WEBP (Max 8MB)
                      </span>
                    </>
                  )}
                </label>
              )}

              {screenshotUploadError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{screenshotUploadError}</span>
                </div>
              )}
            </div>

            {/* Live Bank SMS Webhook Polling Card */}
            {isPollingBankSms && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2 animate-pulse">
                <div className="flex items-center gap-2 font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Checking Real-Time Bank SMS on Salon SIM (+91 81040 26257)...</span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>Listening for UTR: <strong className="font-mono text-amber-500">{utrNumber}</strong></span>
                  <span className="font-mono text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">Attempt {pollAttempt}/8</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  When you pay in PhonePe, the bank SMS typically reaches the salon SIM within 5–15 seconds. Please keep this modal open.
                </p>
              </div>
            )}

            {/* Manual Admin Review Fallback (If SMS delayed by telecom) */}
            {showManualAdminFallback && !paymentVerified && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200">
                  <AlertCircle className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>SMS Not Yet Received on Salon Terminal</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Telecom networks sometimes delay SMS by 1–2 minutes. If you have genuinely completed the transfer of <strong>₹{effectiveAdvance}</strong>, you can submit your UTR for the owner's immediate review. Your chair will be held for 15 minutes.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitManualHold}
                    disabled={isSubmittingManualHold}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {isSubmittingManualHold ? 'Submitting...' : 'Hold Chair & Submit for Owner Confirmation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualAdminFallback(false);
                      handleVerifyPayment();
                    }}
                    className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                  >
                    Retry SMS Check
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {verificationError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Success Message */}
            {paymentVerified && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-bold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-emerald-950 dark:text-emerald-200">
                    Official Bank SMS Verified! ₹{verifiedAmount || effectiveAdvance} Confirmed
                  </div>
                  <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-400">
                    Credit received at {verifiedBankName || 'HDFC Bank'}. Generating your appointment pass...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-zinc-50 dark:bg-[#0e0e11] border-t border-zinc-200 dark:border-zinc-800 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleVerifyPayment}
            disabled={isVerifying || isPollingBankSms || paymentVerified || utrNumber.length !== 12}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying UTR...</span>
              </>
            ) : isPollingBankSms ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Listening for SMS...</span>
              </>
            ) : paymentVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bank Verified</span>
              </>
            ) : (
              <>
                <span>I Have Paid ₹{effectiveAdvance} — Verify &amp; Confirm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* DEDICATED PAYMENT SUCCESSFUL SCREEN OVERLAY WHEN TRANSACTION IS COMPLETED */}
        {showSuccessScreen && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mb-3 shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2">
              Payment is Successful
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              ₹{verifiedAmount || effectiveAdvance} Advance Confirmed!
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Your 10% advance deposit has been recorded for <strong>{effectiveService}</strong>.
            </p>

            {/* Displaying UTR Number prominently as requested */}
            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-amber-500/30 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">12-Digit UTR Number:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider">
                  {utrNumber || 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Target:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200">
                  {selectedOption === 'bank' ? 'HDFC Bank Account' : currentUpiTarget.name}
                </span>
              </div>

              {uploadedScreenshotUrl && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Screenshot:</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Uploaded to Salon Admin</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prominent confirmation note */}
            <div className="mt-3.5 max-w-md p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs font-semibold">
              Send the screenshot or write the UTR number to verify and get confirmed with your seat.
            </div>

            <button
              type="button"
              onClick={handleFinishSuccess}
              className="mt-5 w-full max-w-md py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>View Appointment Pass</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

