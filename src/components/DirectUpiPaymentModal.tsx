import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Zap,
  AlertCircle,
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
  serviceId?: string;
  couponCode?: string;
  serviceName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  onPaymentSuccess?: (paymentId: string, utr: string, scannerUsed: string, isBankVerified?: boolean, bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE', bankName?: string, paymentScreenshotUrl?: string) => void;
  onSuccess?: (paymentId: string, utr: string, scannerUsed: string, isBankVerified?: boolean, bankVerifiedSource?: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE', bankName?: string, paymentScreenshotUrl?: string) => void;
}

type ScannerOption = 'scanner1' | 'scanner2';

// Primary confidential bank & UPI details (defined at module level to prevent re-creation on renders)
const BANK_INFO = {
  accountHolder: 'MODERN JENTS PARLOUR',
  accountNumber: '50200072074441',
  ifsc: 'HDFC0000635',
  branch: 'Solapur',
  accountType: 'Current Account',
  bankName: 'HDFC Bank',
  mobile: '8104026257',
  email: 'dineshghodake941@gmail.com',
  scanner1: {
    id: 'scanner1',
    name: 'MODERN JENTS PARLOUR',
    subtitle: 'Primary Salon Account (Direct UPI)',
    upiId: 'ghodakedinesh@ybl',
    posterImage: ''
  },
  scanner2: {
    id: 'scanner2',
    name: 'DINESH VITTHAL GHODAKE',
    subtitle: 'Secondary Owner Account (Direct UPI)',
    upiId: '8104026257@axl',
    posterImage: '/assets/aistudio/image_0e674b10.png'
  }
};

export const DirectUpiPaymentModal: React.FC<DirectUpiPaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  advanceAmount: propAdvance,
  totalAmount: propTotal,
  serviceId: propServiceId,
  couponCode: propCouponCode,
  serviceName: propServiceName,
  clientName: propClientName,
  clientEmail: propClientEmail,
  clientPhone: propClientPhone,
  onPaymentSuccess,
  onSuccess
}) => {
  const { settings, refreshSettings } = useSalon();

  useEffect(() => {
    if (isOpen) {
      refreshSettings();
    }
  }, [isOpen]);

  const [selectedOption, setSelectedOption] = useState<ScannerOption>('scanner1');
  const [showPosterStandee, setShowPosterStandee] = useState<boolean>(false);
  const [showMobileQrFallback, setShowMobileQrFallback] = useState<boolean>(false);
  const [hasConfirmedPaymentStep, setHasConfirmedPaymentStep] = useState<boolean>(false);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [uploadedScreenshotUrl, setUploadedScreenshotUrl] = useState<string>('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [screenshotUploadError, setScreenshotUploadError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [paymentSubmitted, setPaymentSubmitted] = useState<boolean>(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    isBankVerified: boolean;
    source: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE';
    bankName?: string;
    ref: string;
    scannerLabel: string;
  } | null>(null);
  const [showStatusScreen, setShowStatusScreen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [hasLaunchedUpiApp, setHasLaunchedUpiApp] = useState<boolean>(false);
  const [showReturnedFromAppBanner, setShowReturnedFromAppBanner] = useState<boolean>(false);

  const isUploadedQrAsset = (url?: string) =>
    Boolean(
      url &&
        (url.startsWith('data:image/') ||
          url.startsWith('/uploads/qr/') ||
          url === '/assets/aistudio/image_0e674b10.png')
    );

  const shouldDefaultToUploadedQr = (opt: ScannerOption) => {
    if (opt === 'scanner2') {
      const posterUrl = settings.secondaryUpiQrCodeUrl ?? BANK_INFO.scanner2.posterImage;
      if (!posterUrl) return false;
      return Boolean(settings.secondaryQrCustomOnly);
    }
    if (opt === 'scanner1') {
      const posterUrl = settings.upiQrCodeUrl ?? '';
      if (!posterUrl) return false;
      return Boolean(settings.primaryQrCustomOnly);
    }
    return false;
  };

  useEffect(() => {
    if (isOpen) {
      // Default to dynamic exact-amount QR unless custom-only QR without VPA was explicitly configured
      setShowPosterStandee(shouldDefaultToUploadedQr(selectedOption));
      setHasConfirmedPaymentStep(false);
      setShowMobileQrFallback(false);
      setShowReturnedFromAppBanner(false);
    }
  }, [
    isOpen,
    selectedOption,
    settings.primaryQrCustomOnly,
    settings.secondaryQrCustomOnly,
    settings.upiQrCodeUrl,
    settings.secondaryUpiQrCodeUrl
  ]);

  // Compress image via canvas so Firestore fallback never exceeds 1MB doc limit
  const compressImageDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Handler to upload payment receipt screenshot (Optional)
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
        const rawBase64 = reader.result as string;
        const compressedBase64 = await compressImageDataUrl(rawBase64);
        try {
          const res = await fetch('/api/appointments/upload-screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: compressedBase64,
              fileName: file.name,
              bookingRef: sessionRefCode
            })
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.success && resData.screenshotUrl) {
              setUploadedScreenshotUrl(resData.screenshotUrl);
              setIsUploadingScreenshot(false);
              return;
            }
          }
          // Compressed fallback so screenshot persists cleanly across Firestore & backend
          setUploadedScreenshotUrl(compressedBase64);
        } catch {
          setUploadedScreenshotUrl(compressedBase64);
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
  const officialMobile = (settings.phone || BANK_INFO.mobile).replace(/\D/g, '').slice(-10) || '8104026257';

  const currentUpiTarget = useMemo(() => {
    if (selectedOption === 'scanner2') {
      return {
        id: 'scanner2',
        name: settings.secondaryAccountHolder || BANK_INFO.scanner2.name,
        subtitle: 'Secondary Owner Account (PhonePe / GPay)',
        upiId: settings.secondaryUpiId || BANK_INFO.scanner2.upiId,
        posterImage: settings.secondaryUpiQrCodeUrl ?? BANK_INFO.scanner2.posterImage,
        extraParams: settings.secondaryUpiExtraParams || '',
        customOnly: Boolean(settings.secondaryQrCustomOnly && (settings.secondaryUpiQrCodeUrl ?? BANK_INFO.scanner2.posterImage))
      };
    }
    // Scanner 1: Primary Salon Current Account (HDFC Bank / PhonePe / GPay)
    return {
      id: 'scanner1',
      name: settings.accountHolder || BANK_INFO.scanner1.name,
      subtitle: `${settings.bankName || BANK_INFO.bankName} (PhonePe / GPay)`,
      upiId: settings.merchantUpiId || settings.upiId || BANK_INFO.scanner1.upiId,
      posterImage: settings.upiQrCodeUrl ?? '',
      extraParams: settings.primaryUpiExtraParams || '',
      customOnly: Boolean(settings.primaryQrCustomOnly && settings.upiQrCodeUrl)
    };
  }, [selectedOption, settings]);

  // Stable session booking reference code (for QR download filename only)
  const [sessionRefCode] = useState(() => `MS-${Math.floor(100000 + Math.random() * 900000)}`);

  // Standard NPCI UPI payment parameters (strictly required params only: pa, pn, am, cu; NO unnecessary tn)
  const cleanUpiId = (currentUpiTarget.upiId || 'ghodakedinesh@ybl').trim();
  const cleanPayeeName = (currentUpiTarget.name || 'MODERN JENTS PARLOUR').trim();
  const numericAdvance = Math.max(0, Number(effectiveAdvance || 0));
  const formattedAdvanceAmount = numericAdvance > 0
    ? (Number.isInteger(numericAdvance) ? String(numericAdvance) : numericAdvance.toFixed(2))
    : '0';

  // Exact single standard UPI URI shared identically across both mobile deep-link and dynamic QR code
  const standardUpiUri = useMemo(() => {
    const query = [
      `pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}`,
      `pn=${encodeURIComponent(cleanPayeeName)}`,
      `am=${encodeURIComponent(formattedAdvanceAmount)}`,
      `cu=${encodeURIComponent('INR')}`
    ].join('&');
    return `upi://pay?${query}`;
  }, [cleanUpiId, cleanPayeeName, formattedAdvanceAmount]);

  const isAndroidDevice = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const isIosDevice = useMemo(() => /iPhone|iPad|iPod/i.test(navigator.userAgent), []);
  const isMobileDevice = useMemo(() => {
    if (isAndroidDevice || isIosDevice) return true;
    if (/Mobi|Mobile/i.test(navigator.userAgent)) return true;
    if (typeof navigator !== 'undefined' && (navigator as any).userAgentData?.mobile) return true;
    if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches) return true;
    if (typeof window !== 'undefined' && navigator.maxTouchPoints > 0) {
      const minScreenDim = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
      return window.innerWidth <= 1024 || minScreenDim <= 900;
    }
    return false;
  }, [isAndroidDevice, isIosDevice]);

  // Generate Dynamic QR Code from the EXACT same standardUpiUri
  useEffect(() => {
    if (!isOpen || !standardUpiUri) return;
    let isCancelled = false;

    QRCode.toDataURL(standardUpiUri, {
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
  }, [isOpen, selectedOption, standardUpiUri]);

  // Notice when user returns from UPI app: ONLY prompt them to confirm & enter UTR (NEVER mark as paid!)
  useEffect(() => {
    if (!hasLaunchedUpiApp) return;

    const handleReturnToApp = () => {
      if (document.visibilityState === 'visible') {
        setShowReturnedFromAppBanner(true);
      }
    };

    document.addEventListener('visibilitychange', handleReturnToApp);
    window.addEventListener('focus', handleReturnToApp);

    return () => {
      document.removeEventListener('visibilitychange', handleReturnToApp);
      window.removeEventListener('focus', handleReturnToApp);
    };
  }, [hasLaunchedUpiApp]);

  if (!isOpen) return null;

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpiIntentClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobileDevice) {
      // Allow native <a href="upi://pay?..."> to trigger OS app chooser (PhonePe / GPay / Paytm / BHIM)
      setHasLaunchedUpiApp(true);
    } else {
      // Desktop browsers do not handle upi:// schemes natively; reveal QR & copy fallback cleanly
      e.preventDefault();
      setShowMobileQrFallback(true);
    }
  };

  const handleOpenUtrForm = () => {
    setHasConfirmedPaymentStep(true);
    setTimeout(() => {
      const inputEl = document.getElementById('upi-utr-input');
      if (inputEl) inputEl.focus();
    }, 150);
  };

  // Submit UTR / Transaction ID -> ALWAYS defaults to PAYMENT_VERIFICATION_PENDING unless verified by real Bank SMS webhook
  const handleVerifyPayment = async () => {
    setVerificationError('');
    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');

    if (!cleanUtr && !uploadedScreenshotUrl) {
      setVerificationError('Please enter your 12-digit UTR / UPI Transaction ID, or attach your payment screenshot.');
      return;
    }

    if (cleanUtr && !/^[A-Za-z0-9\-_]{6,40}$/.test(cleanUtr)) {
      setVerificationError('Please enter a valid UTR / UPI Transaction ID (at least 6 letters or digits).');
      return;
    }

    const finalRef = cleanUtr || `SCR-${Date.now().toString().slice(-8)}`;
    setIsVerifying(true);

    const scannerLabel = `${currentUpiTarget.name} (${cleanUpiId})`;
    const bankLabel = currentUpiTarget.name;
    let isBankVerified = false;
    let verifiedSource: 'SMS_WEBHOOK' | 'ADMIN_MANUAL' | 'NONE' = 'NONE';

    try {
      const res = await fetch('/api/payment/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: finalRef,
          advanceAmount: effectiveAdvance,
          totalAmount: effectiveTotal,
          serviceId: propServiceId,
          couponCode: propCouponCode,
          scannerUsed: scannerLabel,
          customerName: effectiveName,
          serviceName: effectiveService,
          paymentScreenshotUrl: uploadedScreenshotUrl || undefined
        })
      });
      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.error) {
        setIsVerifying(false);
        setVerificationError(data.error);
        return;
      }
      if (data && data.verified === true && data.status === 'SUCCESS') {
        isBankVerified = true;
        verifiedSource = 'SMS_WEBHOOK';
      }
    } catch {
      // Offline fallback still stays unverified (PAYMENT_VERIFICATION_PENDING) until Admin confirms
      isBankVerified = false;
      verifiedSource = 'NONE';
    }

    setUtrNumber(finalRef);
    setIsVerifying(false);
    setPaymentSubmitted(true);
    setVerifiedResult({
      isBankVerified,
      source: verifiedSource,
      bankName: bankLabel,
      ref: finalRef,
      scannerLabel
    });
    setShowStatusScreen(true);
    if (isBankVerified) {
      triggerCelebration();
    }
  };

  const handleFinishSuccess = () => {
    const finalRef = verifiedResult?.ref || utrNumber.trim() || `SCR-${Date.now().toString().slice(-8)}`;
    const scannerLabel = verifiedResult?.scannerLabel || `${currentUpiTarget.name} (${cleanUpiId})`;
    const bankLabel = verifiedResult?.bankName || currentUpiTarget.name;
    const isVerified = Boolean(verifiedResult?.isBankVerified);
    const source = verifiedResult?.source || 'NONE';
    effectiveSuccess(`upi_${finalRef}`, finalRef, scannerLabel, isVerified, source, bankLabel, uploadedScreenshotUrl);
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

          {/* Scanner Switcher Tabs (PhonePe & Google Pay ONLY) */}
          <div>
            <label className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block mb-2">
              Select PhonePe / Google Pay Scanner:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedOption('scanner1');
                  setShowPosterStandee(shouldDefaultToUploadedQr('scanner1'));
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedOption === 'scanner1'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  <Smartphone className="w-3.5 h-3.5 text-[#5f259f] dark:text-amber-400 shrink-0" />
                  <span className="truncate">Scanner 1 (PhonePe / GPay)</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.accountHolder || 'MODERN JENTS PARLOUR'}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedOption('scanner2');
                  setShowPosterStandee(shouldDefaultToUploadedQr('scanner2'));
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  selectedOption === 'scanner2'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm ring-1 ring-amber-500/50'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  <Smartphone className="w-3.5 h-3.5 text-[#1a73e8] dark:text-blue-400 shrink-0" />
                  <span className="truncate">Scanner 2 (PhonePe / GPay)</span>
                </div>
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.secondaryAccountHolder || 'DINESH VITTHAL GHODAKE'}</div>
              </button>
            </div>
          </div>

            {/* VIEW: DIRECT UPI PAYMENT (Optional Quick UPI Intent + Prominent Dynamic QR Code + Copy UPI ID Fallback) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3.5 text-center">

              {/* PROMINENT RELIABLE FALLBACK HEADER + MOBILE [Show QR Code] CARD */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-purple-500/10 dark:from-amber-500/10 dark:via-emerald-500/5 dark:to-zinc-950 border-2 border-amber-500/40 dark:border-amber-500/40 space-y-2.5 text-left shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      <QrCode className="w-3 h-3" />
                      <span>Reliable Payment Method</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      Pay using QR Code
                    </h4>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      <strong>Having trouble with UPI Intent?</strong> Scan the QR code using PhonePe / Google Pay / Paytm.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-purple-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                    ₹{formattedAdvanceAmount}
                  </span>
                </div>

                {isMobileDevice && (
                  <button
                    type="button"
                    onClick={() => setShowMobileQrFallback(prev => !prev)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>{showMobileQrFallback ? 'Hide QR Code' : 'Show QR Code'}</span>
                  </button>
                )}
              </div>

              {/* DYNAMIC UPI QR CODE: Always shown on Desktop; shown on Mobile when [Show QR Code] is clicked */}
              {(!isMobileDevice || showMobileQrFallback) && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-amber-500/60 shadow-inner">
                  {Boolean(currentUpiTarget.posterImage) && (showPosterStandee || currentUpiTarget.customOnly) ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold">
                        <QrCode className="w-3 h-3 text-purple-600" />
                        <span>Store QR • Pay ₹{formattedAdvanceAmount}</span>
                      </div>
                      <img
                        src={currentUpiTarget.posterImage}
                        alt={currentUpiTarget.name}
                        className="w-52 sm:w-56 h-auto rounded-xl object-contain shadow-md mx-auto"
                      />
                      <div className="text-[11px] text-zinc-800 font-extrabold mt-2 text-center">
                        {cleanPayeeName} • <span className="font-mono text-purple-700">{cleanUpiId}</span>
                      </div>
                      <a
                        href={currentUpiTarget.posterImage}
                        download={`Modern-Salon-Store-QR-${currentUpiTarget.id}.png`}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition"
                      >
                        <span>Save Store QR</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <h4 className="font-black text-sm text-zinc-900 mb-2">Scan to Pay with PhonePe / GPay / Paytm</h4>

                      {dynamicQrDataUrl ? (
                        <div
                          className="p-2.5 bg-white rounded-xl shadow-md border border-purple-200 inline-block"
                          title={`Scan to pay ₹${formattedAdvanceAmount} to ${cleanPayeeName}`}
                        >
                          <img
                            src={dynamicQrDataUrl}
                            alt={`Scan to pay ₹${formattedAdvanceAmount}`}
                            className="w-44 sm:w-48 h-44 sm:h-48 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs">
                          Generating ₹{formattedAdvanceAmount} QR...
                        </div>
                      )}

                      <div className="mt-2.5 text-center space-y-1">
                        <div className="font-extrabold text-sm text-zinc-900 font-mono">
                          Amount: ₹{formattedAdvanceAmount}
                        </div>
                        <div className="text-[11px] text-purple-700 font-mono font-bold">
                          {cleanPayeeName} • {cleanUpiId}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-medium max-w-xs mx-auto leading-relaxed">
                          Open PhonePe, Google Pay, Paytm, or BHIM manually and scan this QR code (or save QR and scan from Gallery).
                        </div>
                      </div>

                      {dynamicQrDataUrl && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                          <a
                            href={dynamicQrDataUrl}
                            download={`Modern-Salon-Pay-Rs${formattedAdvanceAmount}-${sessionRefCode}.png`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition"
                          >
                            <span>Save QR Code</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {!currentUpiTarget.customOnly && Boolean(currentUpiTarget.posterImage) && (
                    <button
                      type="button"
                      onClick={() => setShowPosterStandee(!showPosterStandee)}
                      className="mt-2.5 text-[10px] text-purple-600 font-bold hover:underline cursor-pointer"
                    >
                      {showPosterStandee
                        ? `Switch to Dynamic ₹${formattedAdvanceAmount} QR`
                        : 'Show Uploaded Store QR Photo'}
                    </button>
                  )}
                </div>
              )}

              {/* VISIBLE MANUAL FALLBACK: UPI ID + [Copy UPI ID] */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 space-y-2 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase text-zinc-500 block font-bold">
                      Payee: {cleanPayeeName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">UPI ID:</span>
                      <span className="font-mono font-bold text-purple-700 dark:text-amber-400 text-xs truncate">
                        {cleanUpiId}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(cleanUpiId, 'upi')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'upi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'upi' ? 'Copied!' : 'Copy UPI ID'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  You can also copy <strong>{cleanUpiId}</strong>, open PhonePe manually, enter this UPI ID, and pay ₹{formattedAdvanceAmount}.
                </p>
              </div>

              {/* OPTIONAL QUICK PAYMENT: [Pay via UPI] (kept intact for mobile UPI intent) */}
              {isMobileDevice && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#5f259f] dark:text-purple-400" />
                      <span>Quick UPI App Launch (Optional)</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">upi://pay</span>
                  </div>

                  <a
                    href={standardUpiUri}
                    onClick={handleUpiIntentClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5f259f]/90 hover:bg-[#5f259f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Pay ₹{formattedAdvanceAmount} via UPI</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" />
                  </a>

                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Opens your installed UPI app with {cleanPayeeName} &amp; ₹{formattedAdvanceAmount} pre-filled. Note: Some apps (such as PhonePe) may enforce security/risk checks on browser-launched UPI links—if declined, use <strong>Show QR Code</strong> or <strong>Copy UPI ID</strong> above.
                  </p>
                </div>
              )}
            </div>

          {/* STEP 2: EXPLICIT POST-PAYMENT CONFIRMATION -> ENTER UTR -> SUBMIT PAYMENT */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-3">

            {showReturnedFromAppBanner && !paymentSubmitted && (
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  Returned from UPI app. Once your ₹{formattedAdvanceAmount} transfer completes, click <strong>I Have Completed Payment</strong> below and submit your UTR.
                </span>
              </div>
            )}

            {!hasConfirmedPaymentStep && !paymentSubmitted ? (
              <div className="space-y-2.5">
                <div className="text-[11px] text-amber-950 dark:text-amber-200 font-semibold flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    After completing the ₹{formattedAdvanceAmount} payment in PhonePe or your UPI app, click below to enter your UTR / Transaction Reference Number.
                  </span>
                </div>
                <button
                  type="button"
                  id="upi-completed-payment-btn"
                  onClick={handleOpenUtrForm}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Completed Payment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Enter UPI Transaction ID / UTR *</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">12-Digit UTR / Ref No</span>
                </div>

                <div className="relative">
                  <input
                    id="upi-utr-input"
                    type="text"
                    maxLength={40}
                    placeholder="e.g. 431056789012 or T260324..."
                    value={utrNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9\-_]/g, '').slice(0, 40);
                      setUtrNumber(val);
                      setVerificationError('');
                    }}
                    disabled={paymentSubmitted}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-amber-500/40 text-zinc-900 dark:text-zinc-100 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  {utrNumber.trim().length >= 6 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                  )}
                </div>

                {/* UPLOAD PAYMENT SCREENSHOT SECTION (OPTIONAL) */}
                <div className="pt-2 border-t border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                      <span>Upload Payment Screenshot (Optional)</span>
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
                            {screenshotFileName || 'upi_receipt.jpg'}
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
                            Click to upload payment screenshot (Optional)
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            PNG, JPG, WEBP (Max 8MB • Optional)
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

                {/* Error Message */}
                {verificationError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}
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
            id="upi-submit-payment-btn"
            onClick={handleVerifyPayment}
            disabled={!hasConfirmedPaymentStep || isVerifying || isUploadingScreenshot || paymentSubmitted || (utrNumber.trim().length < 6 && !uploadedScreenshotUrl)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : paymentSubmitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submitted</span>
              </>
            ) : (
              <>
                <span>Submit Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* POST-SUBMISSION STATUS OVERLAY (Pending Admin Verification unless verified by SMS webhook) */}
        {showStatusScreen && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-lg ${
              verifiedResult?.isBankVerified
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                : 'bg-amber-500/20 border-amber-500 text-amber-500'
            }`}>
              {verifiedResult?.isBankVerified ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : (
                <ShieldCheck className="w-9 h-9" />
              )}
            </div>

            <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider mb-2 ${
              verifiedResult?.isBankVerified
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}>
              {verifiedResult?.isBankVerified ? 'Payment Verified' : 'Payment Verification Pending'}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {verifiedResult?.isBankVerified
                ? `₹${formattedAdvanceAmount} Advance Verified!`
                : `₹${formattedAdvanceAmount} UTR Submitted`}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              {verifiedResult?.isBankVerified
                ? `Your advance deposit has been verified for ${effectiveService}.`
                : `Your UTR reference for ${effectiveService} has been submitted and is awaiting Admin verification.`}
            </p>

            <div className="mt-4 w-full max-w-md p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-amber-500/30 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Transaction Ref / UTR:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-wider">
                  {verifiedResult?.ref || utrNumber || 'Screenshot Attached'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Status:</span>
                <span className={`font-mono font-bold ${verifiedResult?.isBankVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {verifiedResult?.isBankVerified ? 'SUCCESS' : 'PAYMENT_VERIFICATION_PENDING'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Target:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200">
                  {cleanPayeeName} ({cleanUpiId})
                </span>
              </div>

              {uploadedScreenshotUrl && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Screenshot:</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Attached for Admin Review</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleFinishSuccess}
              className="mt-5 w-full max-w-md py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Continue to Booking Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

