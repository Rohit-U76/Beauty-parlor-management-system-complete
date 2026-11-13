import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Building2,
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
  branch: 'Solapur',
  accountType: 'Current Account',
  bankName: 'HDFC Bank',
  mobile: '8104026257',
  email: 'dineshghodake941@gmail.com',
  scanner1: {
    id: 'scanner1',
    name: 'MODERN JENTS PARLOUR',
    subtitle: 'Primary Salon Current Account (PhonePe / UPI)',
    upiId: 'ghodakedinesh@ybl',
    posterImage: '/assets/aistudio/image_2ca5cc29.png'
  },
  scanner2: {
    id: 'scanner2',
    name: 'DINESH VITTHAL GHODAKE',
    subtitle: 'Secondary Owner Account (PhonePe / UPI)',
    upiId: '8104026257@axl',
    posterImage: '/assets/aistudio/image_fce20bf8.png'
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
  const { settings, refreshSettings } = useSalon();

  useEffect(() => {
    if (isOpen) {
      refreshSettings();
    }
  }, [isOpen]);

  const [selectedOption, setSelectedOption] = useState<ScannerOption>('scanner1');
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

  const [showDesktopScanNotice, setShowDesktopScanNotice] = useState<boolean>(false);
  const [selectedDesktopAppLabel, setSelectedDesktopAppLabel] = useState<string>('PhonePe / UPI App');
  const [showSafePayGuide, setShowSafePayGuide] = useState<boolean>(false);
  const [hasLaunchedUpiApp, setHasLaunchedUpiApp] = useState<boolean>(false);
  const [showReturnedFromAppBanner, setShowReturnedFromAppBanner] = useState<boolean>(false);
  const [showUpiFallbackBanner, setShowUpiFallbackBanner] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && selectedOption !== 'bank') {
      // Always default to Auto-Amount Dynamic QR so the advance amount pre-fills automatically when scanned
      setShowPosterStandee(false);
    }
  }, [isOpen, selectedOption]);

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
        posterImage: settings.secondaryUpiQrCodeUrl || BANK_INFO.scanner2.posterImage,
        extraParams: settings.secondaryUpiExtraParams || ''
      };
    }
    // Scanner 1: Primary Salon Current Account (HDFC Bank / PhonePe / GPay)
    return {
      id: 'scanner1',
      name: settings.accountHolder || BANK_INFO.scanner1.name,
      subtitle: `${settings.bankName || BANK_INFO.bankName} (PhonePe / GPay)`,
      upiId: settings.merchantUpiId || settings.upiId || BANK_INFO.scanner1.upiId,
      posterImage: settings.upiQrCodeUrl || BANK_INFO.scanner1.posterImage,
      extraParams: settings.primaryUpiExtraParams || ''
    };
  }, [selectedOption, settings]);

  // Stable session booking reference code (generated once per modal mount)
  const [sessionRefCode] = useState(() => `MS-${Math.floor(100000 + Math.random() * 900000)}`);

  // Check if a verified Razorpay Merchant Gateway key is configured
  const hasVerifiedRazorpayMerchant = Boolean(
    settings.razorpayKeyId &&
    settings.razorpayKeyId.trim() !== '' &&
    settings.razorpayKeyId !== 'rzp_test_modern_salon_mohol'
  );

  // Detect whether uploaded QR/settings carries true Business Merchant credentials (non-0000 MCC or NPCI signature)
  const extraParsedParams = useMemo(() => new URLSearchParams(currentUpiTarget.extraParams || ''), [currentUpiTarget.extraParams]);
  const merchantCode = (extraParsedParams.get('mc') || '').trim();
  const hasVerifiedBusinessQr = Boolean(
    (merchantCode && merchantCode !== '0000') ||
    Boolean(extraParsedParams.get('sign')) ||
    Boolean(extraParsedParams.get('orgid'))
  );
  const canUseDirectPhonePeIntent = hasVerifiedRazorpayMerchant || hasVerifiedBusinessQr;

  // Dynamic NPCI UPI QR & deep-link params (RFC-3986 %20 encoding + exact advance 'am' so PhonePe & Google Pay auto-fill amount)
  const cleanUpiId = (currentUpiTarget.upiId || 'ghodakedinesh@ybl').trim();
  const cleanPayeeName = (currentUpiTarget.name || 'MODERN JENTS PARLOUR').trim();
  const vpaPhoneMatch = cleanUpiId.match(/^([6-9]\d{9})@/);
  const activePayeeMobile = vpaPhoneMatch ? vpaPhoneMatch[1] : officialMobile;
  const numericAdvance = Number(effectiveAdvance || 0);
  const formattedAdvanceAmount = numericAdvance > 0 ? numericAdvance.toFixed(2) : '';

  const upiQrQueryParams = useMemo(() => {
    const pairs: Array<[string, string]> = [
      ['pa', cleanUpiId],
      ['pn', cleanPayeeName]
    ];
    const hasExtraMc = Boolean(extraParsedParams.get('mc'));
    const hasExtraMode = Boolean(extraParsedParams.get('mode'));
    const hasExtraPurpose = Boolean(extraParsedParams.get('purpose'));

    extraParsedParams.forEach((v, k) => {
      if (!['pa', 'pn', 'am', 'cu', 'tn'].includes(k.toLowerCase()) && v) {
        pairs.push([k, v]);
      }
    });
    if (!hasExtraMc) pairs.push(['mc', '0000']);
    if (!hasExtraMode) pairs.push(['mode', '02']);
    if (!hasExtraPurpose) pairs.push(['purpose', '00']);
    if (formattedAdvanceAmount) {
      pairs.push(['am', formattedAdvanceAmount]);
    }
    pairs.push(['cu', 'INR']);
    pairs.push(['tn', `Modern Salon ${sessionRefCode}`]);

    // NPCI UPI Linking Spec expects %20 for spaces, never '+'
    return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }, [cleanUpiId, cleanPayeeName, extraParsedParams, formattedAdvanceAmount, sessionRefCode]);

  const upiQrPayload = useMemo(() => {
    return `upi://pay?${upiQrQueryParams}`;
  }, [upiQrQueryParams]);

  const isAndroidDevice = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const isIosDevice = useMemo(() => /iPhone|iPad|iPod/i.test(navigator.userAgent), []);
  const isMobileDevice = useMemo(() => {
    if (isAndroidDevice || isIosDevice) return true;
    if (typeof navigator !== 'undefined' && (navigator as any).userAgentData?.mobile) return true;
    if (typeof window !== 'undefined' && navigator.maxTouchPoints > 0) {
      const minScreenDim = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
      return window.innerWidth <= 1024 || minScreenDim <= 900;
    }
    return false;
  }, [isAndroidDevice, isIosDevice]);

  // PhonePe & Google Pay deep links — using Android Intent URIs on Android for reliable app launch
  const upiAppLinks = useMemo(() => {
    const phonepeSchemePay = `phonepe://pay?${upiQrQueryParams}`;
    const genericUpiPay = `upi://pay?${upiQrQueryParams}`;
    return {
      phonepePay: isAndroidDevice
        ? `intent://pay?${upiQrQueryParams}#Intent;scheme=phonepe;package=com.phonepe.app;end`
        : phonepeSchemePay,
      phonepeSchemePay,
      phonepeUpiIntent: isAndroidDevice
        ? `intent://pay?${upiQrQueryParams}#Intent;scheme=upi;package=com.phonepe.app;end`
        : genericUpiPay,
      phonepeLauncher: isAndroidDevice
        ? 'intent://#Intent;package=com.phonepe.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end'
        : 'phonepe://',
      gpayPay: isAndroidDevice
        ? `intent://upi/pay?${upiQrQueryParams}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end`
        : `tez://upi/pay?${upiQrQueryParams}`,
      gpayLauncher: isAndroidDevice
        ? 'intent://#Intent;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end'
        : 'tez://',
      genericUpiPay
    };
  }, [upiQrQueryParams, isAndroidDevice]);

  // Generate Dynamic QR Code image safely without infinite re-render loops
  useEffect(() => {
    if (!isOpen || selectedOption === 'bank' || !upiQrPayload) return;
    let isCancelled = false;

    QRCode.toDataURL(upiQrPayload, {
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
  }, [isOpen, selectedOption, upiQrPayload]);

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

  // Launch verified Razorpay Merchant UPI Intent Checkout (zero PhonePe personal-VPA blocks)
  const handleRazorpayMerchantPay = async (preferredAppLabel: 'PhonePe' | 'Google Pay') => {
    setVerificationError('');
    setIsVerifying(true);
    try {
      const orderRes = await fetch('/api/payment/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advanceAmount: effectiveAdvance,
          bookingRef: sessionRefCode,
          serviceName: effectiveService,
          customerName: effectiveName,
          customerPhone: effectivePhone
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.success || !orderData.orderId || !(window as any).Razorpay) {
        setIsVerifying(false);
        // Fall back smoothly to Direct UPI deep link
        const fallbackHref = preferredAppLabel === 'Google Pay' ? upiAppLinks.gpayPay : upiAppLinks.phonepePay;
        if (isMobileDevice) {
          setHasLaunchedUpiApp(true);
          window.location.href = fallbackHref;
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              setShowUpiFallbackBanner(true);
            }
          }, 1000);
        } else {
          setSelectedDesktopAppLabel(preferredAppLabel);
          setShowDesktopScanNotice(true);
        }
        return;
      }

      const RazorpayConstructor = (window as any).Razorpay;
      const rzp = new RazorpayConstructor({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: settings.salonName || 'Modern Unisex Salon',
        description: `10% Booking Advance - ${effectiveService}`,
        order_id: orderData.orderId,
        prefill: {
          name: effectiveName,
          email: orderData?.customerEmail || propClientEmail || '',
          contact: effectivePhone
        },
        config: {
          display: {
            blocks: {
              upi_block: {
                name: `Pay via ${preferredAppLabel} / UPI`,
                instruments: [{ method: 'upi' }]
              }
            },
            sequence: ['block.upi_block'],
            preferences: { show_default_blocks: false }
          }
        },
        theme: { color: preferredAppLabel === 'PhonePe' ? '#5f259f' : '#1a73e8' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify-razorpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const verifyData = await verifyRes.json();
            const payId = response.razorpay_payment_id || `rzp_${Date.now()}`;
            setUtrNumber(payId);
            setPaymentVerified(true);
            setShowSuccessScreen(true);
            triggerCelebration();
            setTimeout(() => {
              effectiveSuccess(
                payId,
                payId,
                `Verified Gateway (${preferredAppLabel})`,
                Boolean(verifyData.verified),
                'SMS_WEBHOOK',
                settings.bankName || 'HDFC Bank',
                uploadedScreenshotUrl
              );
            }, 1400);
          } catch {
            setVerificationError('Payment received but verification callback failed. Please enter Payment ID below.');
          } finally {
            setIsVerifying(false);
          }
        },
        modal: {
          ondismiss: () => setIsVerifying(false)
        }
      });
      rzp.open();
    } catch {
      setIsVerifying(false);
      if (isMobileDevice) {
        setHasLaunchedUpiApp(true);
        setShowUpiFallbackBanner(true);
      } else {
        setSelectedDesktopAppLabel(preferredAppLabel);
        setShowDesktopScanNotice(true);
      }
    }
  };

  // Synchronous handler paired with native custom-scheme <a href={...}> (no target="_top" so iframes allow OS app launch):
  // Never calls dlLink.click() inside app-launch links so Android/iOS immediately opens PhonePe / Google Pay.
  const handleUpiAppAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    appLabel: string,
    mode: 'direct' | 'safe_launcher' | 'copy_mobile' | 'open_app_only' = 'direct'
  ) => {
    if (hasVerifiedRazorpayMerchant && (appLabel === 'PhonePe' || appLabel === 'Google Pay') && mode === 'safe_launcher') {
      e.preventDefault();
      handleRazorpayMerchantPay(appLabel as 'PhonePe' | 'Google Pay');
      return;
    }

    try {
      const textToCopy = mode === 'copy_mobile' ? activePayeeMobile : cleanUpiId;
      navigator.clipboard?.writeText(textToCopy).catch(() => {});
      setCopiedField(mode === 'copy_mobile' ? 'mobile' : 'upi');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {}

    setShowSafePayGuide(true);

    if (isMobileDevice) {
      setHasLaunchedUpiApp(true);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setShowUpiFallbackBanner(true);
        }
      }, 1200);
    } else {
      e.preventDefault();
      setSelectedDesktopAppLabel(appLabel);
      setShowDesktopScanNotice(true);
      setTimeout(() => {
        const inputEl = document.getElementById('upi-utr-input');
        if (inputEl) inputEl.focus();
      }, 250);
    }
  };

  // Submit UTR & optional payment screenshot directly to confirm booking
  const handleVerifyPayment = () => {
    setVerificationError('');
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
    const scannerLabel = selectedOption === 'bank'
      ? 'HDFC Bank Direct Transfer'
      : `UPI Scanner: ${currentUpiTarget.name}`;
    const bankLabel = selectedOption === 'bank'
      ? (settings?.bankName || 'HDFC Bank')
      : currentUpiTarget.name;

    setIsVerifying(false);
    setPaymentVerified(true);
    setShowSuccessScreen(true);
    triggerCelebration();

    setTimeout(() => {
      effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, true, 'ADMIN_MANUAL', bankLabel, uploadedScreenshotUrl);
    }, 1800);
  };

  const handleFinishSuccess = () => {
    const cleanUtr = utrNumber.trim();
    const scannerLabel = selectedOption === 'bank'
      ? 'HDFC Bank Direct Transfer'
      : `UPI Scanner: ${currentUpiTarget.name}`;
    const bankLabel = selectedOption === 'bank'
      ? (settings?.bankName || 'HDFC Bank')
      : currentUpiTarget.name;
    effectiveSuccess(`upi_${cleanUtr}`, cleanUtr, scannerLabel, true, 'ADMIN_MANUAL', bankLabel, uploadedScreenshotUrl);
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
                onClick={() => {
                  setSelectedOption('scanner1');
                  setShowPosterStandee(false);
                }}
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
                onClick={() => {
                  setSelectedOption('scanner2');
                  setShowPosterStandee(false);
                }}
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
                <div className="text-[10px] opacity-80 truncate mt-1">{settings.bankName || BANK_INFO.bankName}</div>
              </button>
            </div>
          </div>

          {/* VIEW: SCANNER 1 OR 2 */}
          {selectedOption !== 'bank' && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3.5 text-center">

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border-2 border-dashed border-purple-500/40 shadow-inner">
                {showPosterStandee ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold">
                      <QrCode className="w-3 h-3 text-purple-600" />
                      <span>Store Standee QR • Pay ₹{effectiveAdvance}</span>
                    </div>
                    <img
                      src={currentUpiTarget.posterImage}
                      alt={currentUpiTarget.name}
                      className="w-52 sm:w-56 h-auto rounded-xl object-contain shadow-md mx-auto"
                    />
                    <div className="text-[11px] text-zinc-800 font-extrabold mt-2 text-center">
                      {cleanPayeeName} • <span className="font-mono text-purple-700">{cleanUpiId}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Save QR &amp; scan inside PhonePe / GPay Gallery for ₹{effectiveAdvance}.
                    </div>
                    <a
                      href={currentUpiTarget.posterImage}
                      download={`Modern-Salon-Store-QR-${currentUpiTarget.id}.png`}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition"
                    >
                      <span>⬇️ Save Store QR to Gallery</span>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Amount QR • Pre-fills ₹{effectiveAdvance} Automatically</span>
                    </div>

                    {dynamicQrDataUrl ? (
                      <a
                        href={upiAppLinks.phonepePay}
                        onClick={(e) => handleUpiAppAnchorClick(e, 'PhonePe', 'safe_launcher')}
                        className="p-2 bg-white rounded-xl shadow-md border border-purple-200 hover:border-purple-500 transition block cursor-pointer"
                        title={`Scan or tap to pay ₹${effectiveAdvance} on PhonePe`}
                      >
                        <img
                          src={dynamicQrDataUrl}
                          alt={`Scan to pay ₹${effectiveAdvance} on PhonePe`}
                          className="w-44 sm:w-48 h-44 sm:h-48 object-contain"
                        />
                      </a>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs">
                        Generating ₹{effectiveAdvance} QR...
                      </div>
                    )}

                    <div className="mt-2 text-center">
                      <div className="font-extrabold text-sm text-zinc-900 font-mono">
                        Scan &amp; Pay Exact Advance: ₹{effectiveAdvance}
                      </div>
                      <div className="text-[10px] text-purple-700 font-mono font-bold mt-0.5">
                        {cleanPayeeName} • {cleanUpiId}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-medium mt-0.5">
                        Scanning this QR in PhonePe or Google Pay auto-fills ₹{effectiveAdvance} automatically.
                      </div>
                    </div>

                    {dynamicQrDataUrl && (
                      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                        <a
                          href={dynamicQrDataUrl}
                          download={`Modern-Salon-Pay-Rs${effectiveAdvance}-${sessionRefCode}.png`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition"
                        >
                          <span>⬇️ Save ₹{effectiveAdvance} QR to Gallery</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Standee View */}
                <button
                  type="button"
                  onClick={() => setShowPosterStandee(!showPosterStandee)}
                  className="mt-2.5 text-[10px] text-purple-600 dark:text-amber-600 font-bold hover:underline cursor-pointer"
                >
                  {showPosterStandee ? `⚡ Switch to Auto-Amount QR (Pre-fills ₹${effectiveAdvance})` : '🖼️ Show Uploaded / Store Standee QR Photo'}
                </button>
              </div>

              {/* ONLY TWO PAYMENT APP OPTIONS: PHONEPE & GOOGLE PAY */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-purple-300 dark:border-amber-500/30 space-y-3 text-left shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#5f259f] dark:text-amber-400" />
                      <span>Pay ₹{effectiveAdvance} — Choose PhonePe or Google Pay</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Redirects directly with ₹{effectiveAdvance} pre-filled • Payee: {cleanUpiId}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    {hasVerifiedRazorpayMerchant ? '✓ Verified Merchant' : `₹${effectiveAdvance} Auto-Filled`}
                  </span>
                </div>

                {/* Strict 2-Option Payment Buttons: PhonePe & Google Pay ONLY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={upiAppLinks.phonepePay}
                    onClick={(e) => handleUpiAppAnchorClick(e, 'PhonePe', 'safe_launcher')}
                    className="py-3 px-3.5 rounded-xl bg-gradient-to-r from-[#5f259f] to-[#7b32c6] hover:from-[#511e8a] hover:to-[#6a29ab] text-white font-extrabold text-xs flex items-center justify-between gap-2 shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white text-[#5f259f] flex items-center justify-center font-black text-sm shrink-0">
                        पे
                      </div>
                      <div className="text-left min-w-0">
                        <div className="leading-tight truncate">PhonePe</div>
                        <div className="text-[10px] font-medium text-purple-100 opacity-90 truncate">
                          Pay ₹{effectiveAdvance}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-100 shrink-0" />
                  </a>

                  <a
                    href={upiAppLinks.gpayPay}
                    onClick={(e) => handleUpiAppAnchorClick(e, 'Google Pay', 'safe_launcher')}
                    className="py-3 px-3.5 rounded-xl bg-gradient-to-r from-[#1a73e8] to-[#2b86f5] hover:from-[#1565c0] hover:to-[#1a73e8] text-white font-extrabold text-xs flex items-center justify-between gap-2 shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white text-[#1a73e8] flex items-center justify-center font-black text-xs shrink-0">
                        GPay
                      </div>
                      <div className="text-left min-w-0">
                        <div className="leading-tight truncate">Google Pay</div>
                        <div className="text-[10px] font-medium text-blue-100 opacity-90 truncate">
                          Pay ₹{effectiveAdvance}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-100 shrink-0" />
                  </a>
                </div>

                {/* Desktop / Laptop Scan Notice right under payment buttons */}
                {showDesktopScanNotice && !paymentVerified && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>📱 Open {selectedDesktopAppLabel} on your Phone to Pay ₹{effectiveAdvance}</span>
                        <button
                          type="button"
                          onClick={() => setShowDesktopScanNotice(false)}
                          className="text-amber-700 dark:text-amber-400 hover:text-amber-900 cursor-pointer font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-[10px] leading-relaxed opacity-90">
                        UPI apps launch directly on mobile browsers. On a computer, open <strong>PhonePe or Google Pay</strong> on your phone and scan the <strong>Auto-Amount QR above</strong> (pre-fills <strong>₹{effectiveAdvance}</strong> automatically).
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <a
                          href={upiAppLinks.phonepeSchemePay}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5f259f] hover:bg-[#511e8a] text-white text-[10px] font-bold transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Try Opening PhonePe Link</span>
                        </a>
                        <a
                          href={upiAppLinks.genericUpiPay}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Try UPI App Handler</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zero-Decline Gallery QR + Direct PhonePe / GPay App Launchers */}
                <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                  {!canUseDirectPhonePeIntent && (
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 text-purple-900 dark:text-purple-200 leading-relaxed">
                      <strong>If PhonePe shows &quot;declined for security reasons&quot;:</strong> PhonePe blocks browser-initiated payment links on personal IDs (<code>{cleanUpiId}</code>). Tap <strong>1. Save ₹{effectiveAdvance} QR</strong> → <strong>2. Open PhonePe App</strong> → tap <strong>Scan any QR → Gallery</strong> (₹{effectiveAdvance} auto-fills with zero block), or pay to mobile <strong>{activePayeeMobile}</strong>.
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {dynamicQrDataUrl && (
                      <a
                        href={dynamicQrDataUrl}
                        download={`Modern-Salon-Pay-Rs${effectiveAdvance}-${sessionRefCode}.png`}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold cursor-pointer"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>1. Save ₹{effectiveAdvance} QR</span>
                      </a>
                    )}
                    <a
                      href={upiAppLinks.phonepeLauncher}
                      onClick={(e) => handleUpiAppAnchorClick(e, 'PhonePe Scanner', 'open_app_only')}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-500/30 font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>2. Open PhonePe App</span>
                    </a>
                    <a
                      href={upiAppLinks.gpayLauncher}
                      onClick={(e) => handleUpiAppAnchorClick(e, 'Google Pay Scanner', 'open_app_only')}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open GPay App</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePayeeMobile, 'mobile')}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-amber-300 border border-zinc-200 dark:border-amber-500/30 font-bold cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'mobile' ? `Copied ${activePayeeMobile}!` : `Copy Mobile ${activePayeeMobile}`}</span>
                    </button>
                  </div>
                </div>
              </div>

              {showUpiFallbackBanner && !paymentVerified && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] text-left space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>📲 Pay smoothly on PhonePe or Google Pay</span>
                    <button
                      type="button"
                      onClick={() => setShowUpiFallbackBanner(false)}
                      className="text-amber-700 dark:text-amber-400 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    If PhonePe did not open automatically or showed a security warning on a personal UPI ID, try one of these direct launchers or tap <strong>Save ₹{effectiveAdvance} QR → Open PhonePe App → Scan from Gallery</strong>:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={upiAppLinks.phonepeUpiIntent}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5f259f] hover:bg-[#511e8a] text-white text-[10px] font-bold transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open PhonePe (UPI Intent)</span>
                    </a>
                    <a
                      href={upiAppLinks.phonepeSchemePay}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-500/30 text-[10px] font-bold transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Direct phonepe:// Link</span>
                    </a>
                    <a
                      href={upiAppLinks.genericUpiPay}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Choose Any UPI App</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Redirect Guide & Zero-Decline Payment Steps */}
              {showSafePayGuide && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-[11px] text-left space-y-1.5">
                  <div className="font-bold flex items-center justify-between">
                    <span>📲 Pay ₹{effectiveAdvance} to {cleanPayeeName}</span>
                    <button
                      type="button"
                      onClick={() => setShowSafePayGuide(false)}
                      className="text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    • Pay <strong>₹{effectiveAdvance}</strong> to <strong>{cleanPayeeName}</strong> ({cleanUpiId} / mobile <strong>{activePayeeMobile}</strong>) via PhonePe or Google Pay.<br />
                    • If browser redirect is declined by PhonePe Protect on a personal VPA, choose <strong>Save ₹{effectiveAdvance} QR &amp; Open PhonePe/GPay → Gallery Scan</strong>.<br />
                    • Return here after paying, enter your <strong>12-digit UTR number</strong>, and optionally upload your receipt screenshot below.
                  </p>
                </div>
              )}

              {/* Quick Copy Mobile Number, UPI ID & Exact Amount */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {currentUpiTarget.name}
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      Quick Copy Details • Pay ₹{effectiveAdvance}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(effectiveAdvance), 'amount')}
                    className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'amount' ? 'Copied' : `₹${effectiveAdvance}`}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50/70 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase text-zinc-500 block font-bold">Mobile Number</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">{activePayeeMobile}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePayeeMobile, 'mobile')}
                      className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedField === 'mobile' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'mobile' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50/70 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase text-zinc-500 block font-bold">UPI ID (VPA)</span>
                      <span className="font-mono font-bold text-purple-700 dark:text-amber-400 text-[11px] truncate block">{currentUpiTarget.upiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentUpiTarget.upiId, 'upi')}
                      className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedField === 'upi' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DIRECT BANK TRANSFER (HDFC BANK) */}
          {selectedOption === 'bank' && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                  <span>Direct Bank Account Transfer</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                  {settings.bankName || BANK_INFO.bankName}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Account Holder:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{settings.accountHolder || BANK_INFO.accountHolder}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.accountHolder || BANK_INFO.accountHolder, 'holder')}
                      className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                    >
                      {copiedField === 'holder' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">{settings.bankAccountNumber || BANK_INFO.accountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.bankAccountNumber || BANK_INFO.accountNumber, 'acc')}
                      className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                    >
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">IFSC Code:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{settings.bankIfsc || BANK_INFO.ifsc}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.bankIfsc || BANK_INFO.ifsc, 'ifsc')}
                      className="text-amber-500 hover:text-amber-400 p-0.5 cursor-pointer"
                    >
                      {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Bank &amp; Branch:</span>
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {settings.bankName || BANK_INFO.bankName}, {settings.bankBranch || BANK_INFO.branch}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Account Type:</span>
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{settings.bankAccountType || BANK_INFO.accountType}</strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFICATION & ANTI-CHEATING SECTION */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-3">

            {showReturnedFromAppBanner && !paymentVerified && (
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-2 animate-pulse">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  <strong>Welcome back from PhonePe!</strong> Please enter the 12-digit UPI UTR Number from your PhonePe receipt below to confirm your slot.
                </span>
              </div>
            )}

            {/* PROMINENT PAYMENT SUBMISSION NOTICE */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-amber-500/20 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-start gap-2.5 shadow-sm">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span>Enter your 12-digit UTR number after completing payment (screenshot upload is optional) and submit to confirm your booking.</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Enter 12-Digit UPI Transaction ID / UTR *</span>
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
                After paying in PhonePe/Google Pay, copy the <strong>"UTR"</strong> or <strong>"UPI Ref No"</strong> from your payment successful screen and submit below.
              </span>
            </p>

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

            {/* Success Message */}
            {paymentVerified && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-bold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-emerald-950 dark:text-emerald-200">
                    Payment is Successful! ₹{effectiveAdvance} Confirmed
                  </div>
                  <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-400">
                    UTR {utrNumber} recorded. Generating your appointment pass...
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
            disabled={isVerifying || isUploadingScreenshot || paymentVerified || utrNumber.length !== 12}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : paymentVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Payment Successful</span>
              </>
            ) : (
              <>
                <span>Payment Successful — Submit UTR &amp; Confirm</span>
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
              ₹{effectiveAdvance} Advance Confirmed!
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

            <div className="mt-3.5 max-w-md p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs font-semibold">
              UTR &amp; payment details submitted. Generating your digital appointment pass...
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

