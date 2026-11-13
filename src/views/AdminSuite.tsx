import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Star,
  Tag,
  ImageIcon,
  Mail,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  UserCheck,
  TrendingUp,
  X,
  RefreshCw,
  Sun,
  Moon,
  Palette,
  Eye,
  Check,
  Smartphone,
  Bot,
  LogOut,
  Crown,
  Menu,
  MessageSquare,
  Download,
  Copy,
  Camera,
  Award,
  Briefcase,
  FileText,
  ExternalLink,
  CreditCard,
  Building2,
  Lock,
  Zap,
  EyeOff,
  AlertCircle,
  Receipt,
  Printer,
  Compass,
  Radio,
  Send,
  Video,
  Play,
  Upload,
  Film,
  Bell
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ServiceItem, Appointment, GalleryItem, OfferCoupon, AppointmentStatus, StaffMember, WhatsAppBroadcastLog } from '../types';
import { AdminCharts } from '../components/AdminCharts';
import { AdminReviewsTrends } from '../components/AdminReviewsTrends';
import { AdminSmsEmailHubModal } from '../components/AdminSmsEmailHubModal';
import { AdminTermsPolicies } from '../components/AdminTermsPolicies';
import { ReceiptModal } from '../components/ReceiptModal';
import { AdminOfferBroadcastModal } from '../components/AdminOfferBroadcastModal';
import { AdminSlotBlackoutManager } from '../components/AdminSlotBlackoutManager';
import jsQR from 'jsqr';
import { ThemeToggle } from '../components/ThemeToggle';

export const AdminSuite: React.FC = () => {
  const {
    services,
    appointments,
    inquiries,
    deleteInquiry,
    updateInquiryStatus,
    customers,
    gallery,
    offers,
    reviews,
    settings,
    updateSettings,
    policies,
    addService,
    updateService,
    deleteService,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    addOffer,
    broadcastOfferWhatsApp,
    toggleOfferActive,
    deleteOffer,
    updateAppointmentStatus,
    deleteAppointment,
    setIsAdminMode,
    setActiveNavTab,
    theme,
    setTheme,
    adminTab,
    setAdminTab,
    openBookingModal,
    currentUser,
    logout,
    isOwnerOnBreakToday,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    fetchBroadcastLogs
  } = useSalon();

  // Search & Filter
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);

  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [broadcastOffer, setBroadcastOffer] = useState<OfferCoupon | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<WhatsAppBroadcastLog | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcastingOffer, setIsBroadcastingOffer] = useState(false);
  const [showSmsHubModal, setShowSmsHubModal] = useState(false);
  const [selectedAppForMessaging, setSelectedAppForMessaging] = useState<Appointment | null>(null);
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);
  const [showUpcomingAppointmentsModal, setShowUpcomingAppointmentsModal] = useState(false);

  // Bank & UPI Scanner Settings Draft State (prevents snap-back while typing & syncs cleanly)
  const [scannerDraft, setScannerDraft] = useState({
    accountHolder: settings.accountHolder || 'MODERN JENTS PARLOUR',
    merchantUpiId: settings.merchantUpiId || settings.upiId || 'ghodakedinesh@ybl',
    upiQrCodeUrl: settings.upiQrCodeUrl || '/assets/aistudio/image_2ca5cc29.png',
    primaryQrCustomOnly: !!settings.primaryQrCustomOnly,
    primaryUpiExtraParams: settings.primaryUpiExtraParams || '',
    secondaryAccountHolder: settings.secondaryAccountHolder || 'DINESH VITTHAL GHODAKE',
    secondaryUpiId: settings.secondaryUpiId || '8104026257@axl',
    secondaryUpiQrCodeUrl: settings.secondaryUpiQrCodeUrl || '/assets/aistudio/image_fce20bf8.png',
    secondaryQrCustomOnly: !!settings.secondaryQrCustomOnly,
    secondaryUpiExtraParams: settings.secondaryUpiExtraParams || '',
    bankName: settings.bankName || 'HDFC Bank',
    bankAccountNumber: settings.bankAccountNumber || '50200072074441',
    bankIfsc: settings.bankIfsc || 'HDFC0000635',
    bankBranch: settings.bankBranch || 'Solapur',
    bankAccountType: settings.bankAccountType || 'Current Account'
  });
  const [hasUnsavedScannerChanges, setHasUnsavedScannerChanges] = useState(false);
  const [isSavingScannerSettings, setIsSavingScannerSettings] = useState(false);
  const [scannerSaveNotice, setScannerSaveNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const scannerDraftRef = useRef(scannerDraft);
  scannerDraftRef.current = scannerDraft;
  const draftEditVersionRef = useRef(0);

  useEffect(() => {
    if (hasUnsavedScannerChanges) return;
    setScannerDraft({
      accountHolder: settings.accountHolder ?? 'MODERN JENTS PARLOUR',
      merchantUpiId: settings.merchantUpiId ?? settings.upiId ?? 'ghodakedinesh@ybl',
      upiQrCodeUrl: settings.upiQrCodeUrl || '/assets/aistudio/image_2ca5cc29.png',
      primaryQrCustomOnly: !!settings.primaryQrCustomOnly,
      primaryUpiExtraParams: settings.primaryUpiExtraParams || '',
      secondaryAccountHolder: settings.secondaryAccountHolder ?? 'DINESH VITTHAL GHODAKE',
      secondaryUpiId: settings.secondaryUpiId ?? '8104026257@axl',
      secondaryUpiQrCodeUrl: settings.secondaryUpiQrCodeUrl || '/assets/aistudio/image_fce20bf8.png',
      secondaryQrCustomOnly: !!settings.secondaryQrCustomOnly,
      secondaryUpiExtraParams: settings.secondaryUpiExtraParams || '',
      bankName: settings.bankName ?? 'HDFC Bank',
      bankAccountNumber: settings.bankAccountNumber ?? '50200072074441',
      bankIfsc: settings.bankIfsc ?? 'HDFC0000635',
      bankBranch: settings.bankBranch ?? 'Solapur',
      bankAccountType: settings.bankAccountType ?? 'Current Account'
    });
  }, [
    hasUnsavedScannerChanges,
    settings.accountHolder,
    settings.merchantUpiId,
    settings.upiId,
    settings.upiQrCodeUrl,
    settings.primaryQrCustomOnly,
    settings.primaryUpiExtraParams,
    settings.secondaryAccountHolder,
    settings.secondaryUpiId,
    settings.secondaryUpiQrCodeUrl,
    settings.secondaryQrCustomOnly,
    settings.secondaryUpiExtraParams,
    settings.bankName,
    settings.bankAccountNumber,
    settings.bankIfsc,
    settings.bankBranch,
    settings.bankAccountType,
    settings.settingsUpdatedAt
  ]);

  const persistScannerDraft = async (draftToSave: typeof scannerDraft, isAutoSave = false) => {
    const versionAtStart = draftEditVersionRef.current;
    setIsSavingScannerSettings(true);
    if (!isAutoSave) setScannerSaveNotice(null);
    try {
      const cleanPrimaryUpi = draftToSave.merchantUpiId.trim();
      const cleanSecondaryUpi = draftToSave.secondaryUpiId.trim();
      await updateSettings({
        accountHolder: draftToSave.accountHolder.trim() || 'MODERN JENTS PARLOUR',
        merchantUpiId: cleanPrimaryUpi,
        upiId: cleanPrimaryUpi,
        upiQrCodeUrl: draftToSave.upiQrCodeUrl,
        primaryQrCustomOnly: !!draftToSave.primaryQrCustomOnly,
        primaryUpiExtraParams: draftToSave.primaryUpiExtraParams || '',
        secondaryAccountHolder: draftToSave.secondaryAccountHolder.trim() || 'DINESH VITTHAL GHODAKE',
        secondaryUpiId: cleanSecondaryUpi,
        secondaryUpiQrCodeUrl: draftToSave.secondaryUpiQrCodeUrl,
        secondaryQrCustomOnly: !!draftToSave.secondaryQrCustomOnly,
        secondaryUpiExtraParams: draftToSave.secondaryUpiExtraParams || '',
        bankName: draftToSave.bankName.trim(),
        bankAccountNumber: draftToSave.bankAccountNumber.trim(),
        bankIfsc: draftToSave.bankIfsc.trim(),
        bankBranch: draftToSave.bankBranch.trim(),
        bankAccountType: draftToSave.bankAccountType.trim()
      });
      if (draftEditVersionRef.current === versionAtStart) {
        setHasUnsavedScannerChanges(false);
        setScannerSaveNotice({
          type: 'success',
          text: `Scanner & UPI details saved (${cleanPrimaryUpi || 'updated'}) and live on the client booking checkout.`
        });
      }
    } catch (err: any) {
      if (!isAutoSave) {
        setScannerSaveNotice({
          type: 'error',
          text: err?.message || 'Could not save scanner settings. Please try again.'
        });
      }
    } finally {
      setIsSavingScannerSettings(false);
    }
  };

  const handleSaveScannerSettings = async () => {
    await persistScannerDraft(scannerDraftRef.current, false);
  };

  // Auto-save UPI / Bank edits 600ms after Admin stops typing so navigating to Client Booking never drops changes
  useEffect(() => {
    if (!hasUnsavedScannerChanges) return;
    const timer = setTimeout(() => {
      persistScannerDraft(scannerDraftRef.current, true);
    }, 600);
    return () => clearTimeout(timer);
  }, [hasUnsavedScannerChanges, scannerDraft]);

  const decodeUpiPayloadFromImage = (img: HTMLImageElement): { vpa: string; payee: string; extraParams: string } => {
    const tryDecodeCanvas = (
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      tw: number,
      th: number,
      highContrast = false
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      const imgData = ctx.getImageData(0, 0, tw, th);
      if (highContrast) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const v = lum < 138 ? 0 : 255;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
      }
      const decoded = jsQR(imgData.data, tw, th, { inversionAttempts: 'attemptBoth' });
      if (decoded?.data) {
        const rawStr = decoded.data.trim();
        if (rawStr.toLowerCase().startsWith('upi://') || rawStr.includes('pa=')) {
          const queryPart = rawStr.includes('?') ? rawStr.split('?')[1] : rawStr;
          const params = new URLSearchParams(queryPart);
          const vpa = (params.get('pa') || '').trim();
          const payee = (params.get('pn') || '').trim();
          // Preserve verified merchant metadata (mc, mode, orgid, purpose, sign, mid, etc.)
          const extra = new URLSearchParams();
          params.forEach((val, key) => {
            const lk = key.toLowerCase();
            if (!['pa', 'pn', 'am', 'cu', 'tn', 'tr'].includes(lk) && val) {
              extra.set(key, val);
            }
          });
          if (vpa) return { vpa, payee, extraParams: extra.toString() };
        }
      }
      return null;
    };

    const maxDim = 1000;
    let dw = img.width;
    let dh = img.height;
    if (dw > maxDim || dh > maxDim) {
      if (dw > dh) {
        dh = Math.round((dh * maxDim) / dw);
        dw = maxDim;
      } else {
        dw = Math.round((dw * maxDim) / dh);
        dh = maxDim;
      }
    }

    // Pass 1: Full frame
    const pass1 = tryDecodeCanvas(0, 0, img.width, img.height, dw, dh, false);
    if (pass1) return pass1;

    // Pass 2: Center crop (where PhonePe / GPay / Paytm standee QR square sits)
    const cropSize = Math.round(Math.min(img.width, img.height) * 0.72);
    const cropX = Math.max(0, Math.round((img.width - cropSize) / 2));
    const cropY = Math.max(0, Math.round((img.height - cropSize) / 2));
    const pass2 = tryDecodeCanvas(cropX, cropY, cropSize, cropSize, 720, 720, false);
    if (pass2) return pass2;

    // Pass 3: High-contrast B&W threshold on center crop
    const pass3 = tryDecodeCanvas(cropX, cropY, cropSize, cropSize, 720, 720, true);
    if (pass3) return pass3;

    // Pass 4: High-contrast B&W threshold on full frame
    const pass4 = tryDecodeCanvas(0, 0, img.width, img.height, dw, dh, true);
    if (pass4) return pass4;

    return { vpa: '', payee: '', extraParams: '' };
  };

  const handleQrPhotoUpload = (file: File, targetSlot: 'scanner1' | 'scanner2') => {
    setScannerSaveNotice(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = async () => {
        try {
          // 1. Multi-pass QR decode before compression
          const { vpa: extractedVpa, payee: extractedPayee, extraParams: extractedExtra } = decodeUpiPayloadFromImage(img);

          // 2. Compress image so it fits reliably under Firestore 1MB limit & db.json
          const saveMax = 560;
          let sw = img.width;
          let sh = img.height;
          if (sw > saveMax || sh > saveMax) {
            if (sw > sh) {
              sh = Math.round((sh * saveMax) / sw);
              sw = saveMax;
            } else {
              sw = Math.round((sw * saveMax) / sh);
              sh = saveMax;
            }
          }
          const saveCanvas = document.createElement('canvas');
          saveCanvas.width = sw;
          saveCanvas.height = sh;
          const saveCtx = saveCanvas.getContext('2d');
          const compressedDataUrl = saveCtx
            ? (saveCtx.drawImage(img, 0, 0, sw, sh), saveCanvas.toDataURL('image/jpeg', 0.78))
            : rawDataUrl;

          // 3. Persist QR photo to server (/public/uploads/qr) so URL stays small & universally viewable
          let finalQrUrl = compressedDataUrl;
          try {
            const upRes = await fetch('/api/settings/upload-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: compressedDataUrl, slot: targetSlot })
            });
            if (upRes.ok) {
              const upData = await upRes.json();
              if (upData?.qrUrl || upData?.url) finalQrUrl = upData.qrUrl || upData.url;
            }
          } catch {
            // Keep compressedDataUrl fallback if offline
          }

          draftEditVersionRef.current += 1;
          const versionAtUpload = draftEditVersionRef.current;
          setIsSavingScannerSettings(true);

          if (targetSlot === 'scanner1') {
            const nextVpa = extractedVpa || scannerDraftRef.current.merchantUpiId;
            const nextName = extractedPayee || scannerDraftRef.current.accountHolder;
            const customOnly = !extractedVpa;
            const nextExtra = extractedExtra || '';
            setScannerDraft(prev => ({
              ...prev,
              upiQrCodeUrl: finalQrUrl,
              merchantUpiId: nextVpa,
              accountHolder: nextName,
              primaryQrCustomOnly: customOnly,
              primaryUpiExtraParams: nextExtra
            }));
            await updateSettings({
              upiQrCodeUrl: finalQrUrl,
              merchantUpiId: nextVpa,
              upiId: nextVpa,
              accountHolder: nextName,
              primaryQrCustomOnly: customOnly,
              primaryUpiExtraParams: nextExtra
            });
            if (draftEditVersionRef.current === versionAtUpload) {
              setHasUnsavedScannerChanges(false);
            }
            setScannerSaveNotice({
              type: 'success',
              text: extractedVpa
                ? `Scanner 1 QR uploaded & auto-detected UPI ID (${extractedVpa}${nextExtra ? ' with merchant params' : ''})! Live on client checkout.`
                : 'Scanner 1 QR image uploaded & set live on client checkout! (Tip: update the UPI ID field if it changed.)'
            });
          } else {
            const nextVpa = extractedVpa || scannerDraftRef.current.secondaryUpiId;
            const nextName = extractedPayee || scannerDraftRef.current.secondaryAccountHolder;
            const customOnly = !extractedVpa;
            const nextExtra = extractedExtra || '';
            setScannerDraft(prev => ({
              ...prev,
              secondaryUpiQrCodeUrl: finalQrUrl,
              secondaryUpiId: nextVpa,
              secondaryAccountHolder: nextName,
              secondaryQrCustomOnly: customOnly,
              secondaryUpiExtraParams: nextExtra
            }));
            await updateSettings({
              secondaryUpiQrCodeUrl: finalQrUrl,
              secondaryUpiId: nextVpa,
              secondaryAccountHolder: nextName,
              secondaryQrCustomOnly: customOnly,
              secondaryUpiExtraParams: nextExtra
            });
            if (draftEditVersionRef.current === versionAtUpload) {
              setHasUnsavedScannerChanges(false);
            }
            setScannerSaveNotice({
              type: 'success',
              text: extractedVpa
                ? `Scanner 2 QR uploaded & auto-detected UPI ID (${extractedVpa}${nextExtra ? ' with merchant params' : ''})! Live on client checkout.`
                : 'Scanner 2 QR image uploaded & set live on client checkout! (Tip: update the UPI ID field if it changed.)'
            });
          }
        } catch (err: any) {
          setScannerSaveNotice({
            type: 'error',
            text: err?.message || 'Failed to upload QR photo.'
          });
        } finally {
          setIsSavingScannerSettings(false);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Staff State & Form
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState('All');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);

  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Senior Hair Stylist');
  const [staffDepartment, setStaffDepartment] = useState<StaffMember['department']>('Hair Care');
  const [staffExperience, setStaffExperience] = useState('5 Years');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffShift, setStaffShift] = useState('9:00 AM - 7:00 PM');
  const [staffStatus, setStaffStatus] = useState<StaffMember['status']>('Available Today');
  const [staffSpecialties, setStaffSpecialties] = useState('Hair Styling, Balayage, Keratin');
  const [staffBio, setStaffBio] = useState('Dedicated salon professional passionate about precision styling and client transformation.');
  const [staffImage, setStaffImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);
  const [actionFeedbackToast, setActionFeedbackToast] = useState<string | null>(null);

  // Appointment Actions State
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [receiptAppointment, setReceiptAppointment] = useState<Appointment | null>(null);

  const handleCompleteAppointment = (app: Appointment) => {
    updateAppointmentStatus(app.id, 'COMPLETED');
    setActionFeedbackToast(`Booking #${app.bookingRef} for ${app.clientName} marked as COMPLETED.`);
    setTimeout(() => setActionFeedbackToast(null), 3500);
  };

  const handleCancelAppointment = (app: Appointment) => {
    updateAppointmentStatus(app.id, 'CANCELLED');
    setActionFeedbackToast(`Booking #${app.bookingRef} cancelled.`);
    setTimeout(() => setActionFeedbackToast(null), 3500);
  };

  const handleReopenAppointment = (app: Appointment) => {
    updateAppointmentStatus(app.id, 'CONFIRMED');
    setActionFeedbackToast(`Booking #${app.bookingRef} reopened as CONFIRMED.`);
    setTimeout(() => setActionFeedbackToast(null), 3500);
  };

  // Real-world Payment Gateway Settings state
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);

  const handleTestGatewayConnection = async () => {
    setIsTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const res = await fetch('/api/payment/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayKeyId: settings.razorpayKeyId,
          razorpayKeySecret: settings.razorpayKeySecret
        })
      });
      const data = await res.json();
      setGatewayTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Razorpay credentials verified successfully!' : 'Verification failed')
      });
    } catch (err: any) {
      setGatewayTestResult({
        success: false,
        message: 'Could not reach server to test credentials: ' + err.message
      });
    } finally {
      setIsTestingGateway(false);
    }
  };

  const openAddStaffModal = () => {
    setStaffName('');
    setStaffRole('Senior Hair Stylist');
    setStaffDepartment('Hair Care');
    setStaffExperience('4 Years');
    setStaffPhone('');
    setStaffEmail('');
    setStaffShift('9:00 AM - 7:00 PM');
    setStaffStatus('Available Today');
    setStaffSpecialties('Hair Styling, Hair Treatment');
    setStaffBio('Passionate salon expert delivering top-notch client care.');
    setStaffImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
    setEditingStaffMember(null);
    setShowAddStaffModal(true);
  };

  const openEditStaffModal = (member: StaffMember) => {
    setEditingStaffMember(member);
    setStaffName(member.name);
    setStaffRole(member.role);
    setStaffDepartment(member.department);
    setStaffExperience(member.experience);
    setStaffPhone(member.phone || '');
    setStaffEmail(member.email || '');
    setStaffShift(member.shiftHours);
    setStaffStatus(member.status);
    setStaffSpecialties(member.specialties.join(', '));
    setStaffBio(member.bio);
    setStaffImage(member.image);
    setShowAddStaffModal(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const specialtiesList = staffSpecialties
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingStaffMember) {
      updateStaffMember(editingStaffMember.id, {
        name: staffName.trim(),
        role: staffRole.trim(),
        department: staffDepartment,
        experience: staffExperience.trim(),
        phone: staffPhone.trim(),
        email: staffEmail.trim(),
        shiftHours: staffShift.trim(),
        status: staffStatus,
        specialties: specialtiesList.length > 0 ? specialtiesList : ['General Styling'],
        bio: staffBio.trim(),
        image: staffImage
      });
    } else {
      addStaffMember({
        name: staffName.trim(),
        role: staffRole.trim(),
        department: staffDepartment,
        experience: staffExperience.trim() || '3 Years',
        phone: staffPhone.trim(),
        email: staffEmail.trim(),
        specialties: specialtiesList.length > 0 ? specialtiesList : ['General Styling'],
        rating: 5.0,
        reviewsCount: 0,
        totalClients: 0,
        shiftHours: staffShift.trim() || '9:00 AM - 7:00 PM',
        status: staffStatus,
        bio: staffBio.trim() || 'Professional salon specialist.',
        image: staffImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      });
    }

    setShowAddStaffModal(false);
    setEditingStaffMember(null);
  };

  // Add Service Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Hair Care & Styling');
  const [newServicePrice, setNewServicePrice] = useState(500);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceImg, setNewServiceImg] = useState('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80');

  // Add Gallery Form
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGallerySubtitle, setNewGallerySubtitle] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<'Bridal' | 'Hair Care' | 'Skin Care' | 'Salon Interior' | 'Nail Art' | 'Spa'>('Hair Care');
  const [newGalleryTag, setNewGalleryTag] = useState('Hair Care');
  const [newGalleryImg, setNewGalleryImg] = useState('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80');
  const [newGalleryMediaType, setNewGalleryMediaType] = useState<'image' | 'video'>('image');
  const [newGalleryVideoUrl, setNewGalleryVideoUrl] = useState('');
  const [newGalleryDuration, setNewGalleryDuration] = useState('0:45 min');
  const [galleryMediaFilter, setGalleryMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [adminActiveVideoPreview, setAdminActiveVideoPreview] = useState<GalleryItem | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string | null>(null);

  const handleUploadVideoFile = async (file: File, isEditing = false) => {
    if (!file) return;
    setIsUploadingVideo(true);
    setVideoUploadStatus('Reading video file...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (typeof reader.result !== 'string') {
            setIsUploadingVideo(false);
            return;
          }
          setVideoUploadStatus('Uploading video to salon storage...');
          const res = await fetch('/api/gallery/upload-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoBase64: reader.result,
              fileName: file.name
            })
          });
          const data = await res.json();
          if (data.success && data.videoUrl) {
            if (isEditing) {
              setEditingGalleryItem(prev => prev ? { ...prev, videoUrl: data.videoUrl } : null);
            } else {
              setNewGalleryVideoUrl(data.videoUrl);
            }
            setActionFeedbackToast(`✅ Video "${file.name}" uploaded successfully!`);
            setTimeout(() => setActionFeedbackToast(null), 3500);

            // Auto-extract compact thumbnail frame from video using canvas
            try {
              const tempVid = document.createElement('video');
              tempVid.src = data.videoUrl;
              tempVid.muted = true;
              tempVid.playsInline = true;
              tempVid.preload = 'metadata';
              tempVid.crossOrigin = 'anonymous';
              tempVid.onloadedmetadata = () => {
                const targetTime = tempVid.duration && isFinite(tempVid.duration)
                  ? Math.min(0.5, tempVid.duration / 2)
                  : 0.1;
                tempVid.currentTime = targetTime;
              };
              tempVid.onseeked = () => {
                try {
                  const vw = tempVid.videoWidth || 640;
                  const vh = tempVid.videoHeight || 360;
                  const scale = Math.min(1, 480 / Math.max(vw, vh));
                  const canvas = document.createElement('canvas');
                  canvas.width = Math.max(1, Math.round(vw * scale));
                  canvas.height = Math.max(1, Math.round(vh * scale));
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(tempVid, 0, 0, canvas.width, canvas.height);
                    const thumb = canvas.toDataURL('image/jpeg', 0.65);
                    if (isEditing) {
                      setEditingGalleryItem(prev => prev && (!prev.imageUrl || prev.imageUrl.includes('unsplash')) ? { ...prev, imageUrl: thumb } : prev);
                    } else if (!newGalleryImg || newGalleryImg.includes('unsplash')) {
                      setNewGalleryImg(thumb);
                    }
                  }
                } catch {}
              };
            } catch {}
          } else {
            alert('Upload failed: ' + (data.message || 'Server error'));
          }
        } catch (err: any) {
          alert('Could not upload video: ' + err.message);
        } finally {
          setIsUploadingVideo(false);
          setVideoUploadStatus(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingVideo(false);
      alert('Could not read video file: ' + err.message);
    }
  };

  const handleConfirmBankCredit = (app: Appointment) => {
    updateAppointmentStatus(app.id, 'CONFIRMED', {
      isBankVerified: true,
      bankVerifiedSource: 'ADMIN_MANUAL',
      verifiedBankName: `${settings.bankName || 'HDFC Bank'} (A/c ${(settings.bankAccountNumber || '50200072074441').slice(-4)})`,
      paymentStatus: 'PAID'
    });
    setActionFeedbackToast(`✅ Confirmed ₹${app.advancePaid} deposit credit for ${app.clientName}! (UTR: ${app.upiTransactionId || 'Manual Verified'})`);
    setTimeout(() => setActionFeedbackToast(null), 4000);
  };

  const handleRejectUtrDeposit = (app: Appointment) => {
    if (!window.confirm(`Are you sure you want to mark UTR "${app.upiTransactionId}" as unverified/fake for ${app.clientName}? This will cancel the booking.`)) {
      return;
    }
    updateAppointmentStatus(app.id, 'CANCELLED', {
      isBankVerified: false,
      paymentStatus: 'FAILED',
      cancelReason: 'Unverified / Fake UTR number'
    });
    setActionFeedbackToast(`Booking #${app.bookingRef} cancelled due to unverified UTR.`);
    setTimeout(() => setActionFeedbackToast(null), 3500);
  };

  // Add Offer Form
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferDiscount, setNewOfferDiscount] = useState(15);
  const [newOfferMin, setNewOfferMin] = useState(1000);

  // Status helper
  const getAppStatus = (a?: { status?: string; bookingStatus?: string }): AppointmentStatus => {
    if (!a) return 'CONFIRMED';
    const val = (a.bookingStatus || a.status || 'CONFIRMED').toUpperCase();
    if (val === 'COMPLETED' || val === 'DONE') return 'COMPLETED';
    if (val === 'CANCELLED' || val === 'CANCELED') return 'CANCELLED';
    if (val === 'PENDING') return 'PENDING';
    return 'CONFIRMED';
  };

  // Metrics
  const totalRevenue = appointments.reduce((acc, a) => acc + (getAppStatus(a) !== 'CANCELLED' ? (a.totalAmount || 0) : 0), 0);
  const totalAdvanceCollected = appointments.reduce((acc, a) => acc + (getAppStatus(a) !== 'CANCELLED' ? (a.advancePaid || 0) : 0), 0);
  const confirmedCount = appointments.filter(a => getAppStatus(a) === 'CONFIRMED').length;
  const upcomingAppointments = appointments
    .filter(a => getAppStatus(a) === 'CONFIRMED' || getAppStatus(a) === 'PENDING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingCount = upcomingAppointments.length;

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    const priceNum = Number(newServicePrice);

    addService({
      name: newServiceName,
      category: newServiceCategory as any,
      price: priceNum,
      advanceDeposit: Math.round(priceNum * 0.1),
      durationMinutes: Number(newServiceDuration),
      description: newServiceDesc || 'Professional salon service.',
      imageUrl: newServiceImg,
      benefits: ['Quality products', 'Experienced stylist', 'Hygiene guaranteed'],
      rating: 4.9,
      reviewsCount: 12,
      gender: newServiceCategory.includes('Men') ? 'men' : 'women'
    });

    setShowAddServiceModal(false);
    setNewServiceName('');
    setNewServiceDesc('');
  };

  const handleUpdateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    updateService(editingService.id, {
      name: editingService.name,
      category: editingService.category,
      price: Number(editingService.price),
      durationMinutes: Number(editingService.durationMinutes),
      description: editingService.description,
      imageUrl: editingService.imageUrl
    });

    setEditingService(null);
  };

  const handleCreateGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle) return;
    if (newGalleryMediaType === 'image' && !newGalleryImg) return;
    if (newGalleryMediaType === 'video' && !newGalleryVideoUrl && !newGalleryImg) return;

    addGalleryItem({
      title: newGalleryTitle,
      subtitle: newGallerySubtitle || (newGalleryMediaType === 'video' ? 'Client styling video transformation' : 'Salon treatment results'),
      category: newGalleryCategory,
      tag: newGalleryTag,
      imageUrl: newGalleryImg || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      mediaType: newGalleryMediaType,
      videoUrl: newGalleryMediaType === 'video' ? newGalleryVideoUrl : undefined,
      duration: newGalleryMediaType === 'video' ? (newGalleryDuration || '0:30 min') : undefined
    });

    setShowAddGalleryModal(false);
    setNewGalleryTitle('');
    setNewGallerySubtitle('');
    setNewGalleryVideoUrl('');
    setNewGalleryMediaType('image');
    setNewGalleryImg('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80');
  };

  const handleUpdateGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;

    updateGalleryItem(editingGalleryItem.id, {
      title: editingGalleryItem.title,
      subtitle: editingGalleryItem.subtitle,
      category: editingGalleryItem.category,
      tag: editingGalleryItem.tag,
      imageUrl: editingGalleryItem.imageUrl,
      mediaType: editingGalleryItem.mediaType || 'image',
      videoUrl: editingGalleryItem.videoUrl,
      duration: editingGalleryItem.duration
    });

    setEditingGalleryItem(null);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferCode || !newOfferTitle) return;

    setIsBroadcastingOffer(true);
    const offerPayload = {
      code: newOfferCode.toUpperCase().trim(),
      title: newOfferTitle.trim(),
      description: newOfferDesc || 'Special promotional discount for our valued salon clients.',
      discountPercent: Number(newOfferDiscount) || 0,
      minBookingAmount: Number(newOfferMin) || 0,
      validTill: '2026-12-31',
      active: true
    };

    const res = await addOffer(offerPayload);
    setIsBroadcastingOffer(false);

    setShowAddOfferModal(false);
    setNewOfferCode('');
    setNewOfferTitle('');
    setNewOfferDesc('');

    if (res && res.broadcast) {
      setBroadcastOffer(res.offer || { id: `off-${Date.now()}`, ...offerPayload });
      setBroadcastResult(res.broadcast);
      setIsBroadcastModalOpen(true);
    }
  };

  const handleBroadcastExistingOffer = async (offer: OfferCoupon) => {
    setIsBroadcastingOffer(true);
    const res = await broadcastOfferWhatsApp(offer.id);
    setIsBroadcastingOffer(false);
    if (res && res.broadcast) {
      setBroadcastOffer(offer);
      setBroadcastResult(res.broadcast);
      setIsBroadcastModalOpen(true);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const clientName = a.clientName || '';
    const serviceName = a.serviceName || '';
    const bookingRef = a.bookingRef || '';
    const clientPhone = a.clientPhone || '';
    const query = appointmentSearch.toLowerCase().trim();

    const matchSearch = !query || 
      clientName.toLowerCase().includes(query) ||
      serviceName.toLowerCase().includes(query) ||
      bookingRef.toLowerCase().includes(query) ||
      clientPhone.includes(query);

    const aStatus = getAppStatus(a);
    let matchStatus = true;
    if (appointmentFilter === 'all') {
      matchStatus = true;
    } else if (appointmentFilter === 'upcoming') {
      matchStatus = (aStatus === 'CONFIRMED' || aStatus === 'PENDING');
    } else {
      matchStatus = aStatus.toLowerCase() === appointmentFilter.toLowerCase();
    }
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    if (appointmentFilter === 'upcoming') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: confirmedCount },
    { id: 'services', label: 'Services & Pricing', icon: Scissors },
    { id: 'staff', label: 'Staff & Team', icon: UserCheck, badge: staffMembers.length },
    { id: 'gallery', label: 'Gallery Manager', icon: ImageIcon },
    { id: 'offers', label: 'Offers & Coupons', icon: Tag },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'customers', label: 'Customers CRM', icon: Users },
    { id: 'inquiries', label: 'Consultation Inquiries', icon: Mail, badge: inquiries.length },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'policies', label: 'Terms & Policies', icon: FileText, badge: (policies || []).length },
    { id: 'themes', label: 'Theme Studio', icon: Palette },
    { id: 'settings', label: 'Salon Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#faf7ff] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row text-left transition-colors">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-zinc-900 border-r border-purple-200 dark:border-zinc-800 flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-purple-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-amber-500/20 text-purple-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Modern Salon</span>
                  {isOwnerOnBreakToday && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Owner Break Active" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400">
                  {isOwnerOnBreakToday ? <span className="text-rose-600 dark:text-rose-400 font-bold">Owner On Break (Today)</span> : 'Admin Control Panel'}
                </div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-bold'
                      : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-purple-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white dark:bg-zinc-950 dark:text-amber-400' : 'bg-purple-100 text-purple-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Profile & Sign Out Controls */}
        <div className="p-4 border-t border-purple-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Display Theme</span>
            <ThemeToggle className="!px-2.5 !py-1.5" />
          </div>

          {currentUser && (
            <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-zinc-800/60 border border-purple-200 dark:border-zinc-700/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <Crown className="w-3 h-3 text-purple-600 dark:text-amber-400 shrink-0" />
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate font-mono">
                  Administrator • Secured
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Sign Out button that returns to Authorization Page */}
          <button
            id="admin-sidebar-signout-btn"
            onClick={() => logout()}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            title="Sign out and return to Authorization Page"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out to Authorization Page</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden p-3 bg-white dark:bg-zinc-900 border-b border-purple-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-purple-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-purple-200 dark:border-zinc-700/60 focus:outline-none cursor-pointer"
            aria-label="Toggle Admin Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-700 dark:text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-amber-500/20 text-purple-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 block leading-tight">Admin Suite</span>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 capitalize">{adminTab.replace('-', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="!px-2 !py-1.5" />
          <button
            id="admin-mobile-signout-btn"
            onClick={() => logout()}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Sign out and return to Authorization Page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDABLE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-black/90 backdrop-blur-sm pt-14 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-150">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-purple-200 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Navigation Menu</span>
              <span className="text-[11px] text-purple-700 dark:text-amber-400 font-mono">13 Modules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAdminTab(tab.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-4 py-3 rounded-2xl transition cursor-pointer text-left text-sm ${
                      isActive
                        ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-bold shadow-lg shadow-purple-600/20 dark:shadow-amber-500/20'
                        : 'bg-purple-50/70 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-300 hover:bg-purple-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                        isActive ? 'bg-white/20 text-white dark:bg-zinc-950 dark:text-amber-400' : 'bg-purple-100 text-purple-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drawer Footer with Admin Details & Exit */}
          <div className="p-4 border-t border-purple-200 dark:border-zinc-800 bg-purple-50/90 dark:bg-zinc-900/90 space-y-3">
            {currentUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800/60 border border-purple-200 dark:border-zinc-700/60">
                <div className="w-9 h-9 rounded-xl bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                    Administrator • Secured
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => logout()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out to Authorization Page</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE HORIZONTAL TABS (Touch-friendly pill scroller) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto p-2.5 bg-white/95 dark:bg-zinc-900/90 border-b border-purple-200 dark:border-zinc-800 scrollbar-none text-xs sticky top-[57px] z-20 backdrop-blur-md">
        {navTabs.map(tab => {
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl whitespace-nowrap font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isActive
                  ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 shadow-md font-extrabold'
                  : 'bg-purple-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-purple-200 dark:border-zinc-700/50 hover:bg-purple-100 dark:hover:bg-zinc-700/70'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white dark:bg-zinc-950 dark:text-amber-400' : 'bg-purple-200/70 text-purple-800 dark:bg-amber-400/20 dark:text-amber-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* DASHBOARD TAB */}
          {adminTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">Salon Dashboard</h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Overview of bookings, deposits, and salon operations in Mohol.</p>
              </div>

              {/* Owner Break & Schedule Blackout Control Hub */}
              <AdminSlotBlackoutManager onShowToast={(msg) => setActionFeedbackToast(msg)} />

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Total Bookings</span>
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{appointments.length}</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{confirmedCount} active confirmed</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>{settings.advancePercentage || 10}% Advance Deposits</span>
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">₹{totalAdvanceCollected.toLocaleString()}</div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">Direct Bank UPI Verified</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Total Service Value</span>
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">₹{totalRevenue.toLocaleString()}</div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">Balance paid at salon</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Client Rating</span>
                    <Star className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-purple-700 dark:text-amber-400">
                    {reviews.length > 0
                      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : '0.0'} ★
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{reviews.length} verified reviews</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-3 shadow-sm">
                <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-200">Quick Actions</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setAdminTab('appointments')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Appointments ({confirmedCount})</span>
                  </button>
                  <button
                    onClick={openAddStaffModal}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-purple-900 dark:text-zinc-200 border border-purple-200 dark:border-transparent text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-purple-700 dark:text-amber-400" />
                    <span>Add Salon Staff</span>
                  </button>
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-purple-900 dark:text-zinc-200 border border-purple-200 dark:border-transparent text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-700 dark:text-amber-400" />
                    <span>Add New Service</span>
                  </button>
                  <button
                    onClick={() => setShowAddGalleryModal(true)}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-purple-900 dark:text-zinc-200 border border-purple-200 dark:border-transparent text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-700 dark:text-amber-400" />
                    <span>Add Gallery Photo</span>
                  </button>
                </div>
              </div>

              {/* Compact Upcoming Appointments Notification Bar */}
              <button
                type="button"
                onClick={() => setShowUpcomingAppointmentsModal(true)}
                className="w-full px-4 py-3 rounded-2xl bg-white hover:bg-purple-50/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/90 border border-purple-200 hover:border-purple-400 dark:border-amber-500/30 dark:hover:border-amber-500/60 transition flex items-center justify-between gap-3 text-left shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-amber-500/15 text-purple-700 dark:text-amber-400 flex items-center justify-center shrink-0 relative">
                    <Bell className="w-4 h-4" />
                    {upcomingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-amber-500 animate-ping opacity-75" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Upcoming Appointments</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950">
                        {upcomingCount} Scheduled
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                      {upcomingAppointments.length > 0
                        ? `Next: ${upcomingAppointments[0].clientName} • ${upcomingAppointments[0].serviceName} (${upcomingAppointments[0].date}, ${upcomingAppointments[0].timeSlot})`
                        : 'No upcoming appointments scheduled. Click to view or schedule.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span className="hidden sm:inline">View</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}


          {/* APPOINTMENTS TAB */}
          {adminTab === 'appointments' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">Appointments Management</h1>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Track client bookings and 10% advance deposit receipts.</p>
                </div>
                <button
                  onClick={() => openBookingModal()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Appointment</span>
                </button>
              </div>

              {/* Owner Break & Schedule Blackout Control Hub */}
              <AdminSlotBlackoutManager onShowToast={(msg) => setActionFeedbackToast(msg)} />

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by client name, reference ID, phone, or service..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'upcoming', 'confirmed', 'completed', 'cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => setAppointmentFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 cursor-pointer transition ${
                        appointmentFilter === st
                          ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-bold'
                          : 'bg-purple-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-purple-200 dark:border-transparent'
                      }`}
                    >
                      <span>{st === 'all' ? 'All' : st === 'upcoming' ? 'Upcoming' : st}</span>
                      {st === 'upcoming' && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          appointmentFilter === 'upcoming' ? 'bg-white/20 text-white dark:bg-zinc-950 dark:text-amber-400' : 'bg-purple-200/80 text-purple-800 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {upcomingCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-purple-50/90 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 uppercase font-semibold border-b border-purple-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Booking Ref / Date</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Total / {settings.advancePercentage || 10}% Adv</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-zinc-800">
                    {filteredAppointments.map(app => (
                      <tr key={app.id} className="hover:bg-purple-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-purple-700 dark:text-amber-400">{app.bookingRef}</div>
                          <div className="text-zinc-600 dark:text-zinc-400">{app.date} • {app.timeSlot}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200">{app.clientName}</div>
                          <div className="text-zinc-600 dark:text-zinc-400">{app.clientPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-300">{app.serviceName}</div>
                          <div className="text-zinc-500">{app.stylistName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-zinc-900 dark:text-zinc-200">₹{app.totalAmount}</div>
                          <div className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold">
                            {settings.advancePercentage || 10}% Adv: ₹{app.advancePaid}
                          </div>
                          {(app.upiTransactionId || app.razorpayPaymentId) && (
                            <div className="text-[10px] text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1 mt-0.5" title="UPI Reference / 12-digit UTR">
                              <span className="text-purple-700 dark:text-amber-400 font-bold">UTR:</span>
                              <span className="truncate max-w-[110px] font-semibold">{app.upiTransactionId || app.razorpayPaymentId}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(app.upiTransactionId || app.razorpayPaymentId || '');
                                  setActionFeedbackToast(`Copied UTR: ${app.upiTransactionId || app.razorpayPaymentId}`);
                                  setTimeout(() => setActionFeedbackToast(null), 2500);
                                }}
                                className="p-0.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                title="Copy UTR to check bank SMS or statement"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {app.isBankVerified ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Bank Credited</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>Pending Bank Credit</span>
                              </span>
                            )}
                          </div>
                          {app.paymentScreenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                              className="mt-2 inline-flex items-center gap-2 p-1 pr-2 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-500/30 transition cursor-pointer group"
                              title="Click to inspect full uploaded payment screenshot"
                            >
                              <img
                                src={app.paymentScreenshotUrl}
                                alt={`Receipt from ${app.clientName}`}
                                className="w-9 h-9 rounded object-cover border border-purple-300 dark:border-purple-500/40 shrink-0"
                              />
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 group-hover:underline">
                                View Payment Proof
                              </span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            getAppStatus(app) === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : getAppStatus(app) === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          }`}>
                            {getAppStatus(app)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Bank Credit Verification Quick Actions */}
                            {!app.isBankVerified && getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmBankCredit(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                                title={`Confirm that ₹${app.advancePaid} is credited in your ${settings.bankName || 'HDFC Bank'} account`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm Credit</span>
                              </button>
                            )}

                            {!app.isBankVerified && (app.upiTransactionId) && getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleRejectUtrDeposit(app)}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-[10px] font-semibold transition cursor-pointer"
                                title="Reject fake/invalid UTR and cancel booking"
                              >
                                <span>Reject Fake</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAppForMessaging(app);
                                setShowSmsHubModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                              title="Send message through WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {app.paymentScreenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                                title="View PhonePe Payment Receipt Screenshot uploaded by client"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Screenshot</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setReceiptAppointment(app)}
                              className="px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-transparent text-zinc-800 dark:text-zinc-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="View & Print Official Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                              <span>Receipt</span>
                            </button>

                            {getAppStatus(app) !== 'COMPLETED' ? (
                              <button
                                type="button"
                                onClick={() => handleCompleteAppointment(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Mark as Completed"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReopenAppointment(app)}
                                className="px-2 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 text-[11px] font-semibold transition cursor-pointer"
                                title="Reopen Appointment"
                              >
                                Reopen
                              </button>
                            )}

                            {getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(app)}
                                className="px-2 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 text-[11px] font-semibold transition cursor-pointer"
                                title="Cancel Appointment"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setAppointmentToDelete(app)}
                              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/15 dark:hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Delete Appointment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Appointment Cards (Clean, high-density, touch-friendly) */}
              <div className="md:hidden space-y-3">
                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl text-zinc-500 dark:text-zinc-400 text-xs">
                    No appointments match your filter criteria.
                  </div>
                ) : (
                  filteredAppointments.map(app => {
                    const status = getAppStatus(app);
                    const cleanPhone = (app.clientPhone || '').replace(/\D/g, '');
                    const whatsappDirectUrl = app.whatsappUrl || `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${app.clientName}, your appointment for ${app.serviceName} at Modern Unisex Salon Mohol is confirmed for ${app.date} at ${app.timeSlot}. Ref: ${app.bookingRef}.`)}`;
                    const utrRef = app.upiTransactionId || app.razorpayPaymentId || '';

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-3 shadow-sm"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-xs font-bold text-purple-700 dark:text-amber-400">
                                {app.bookingRef}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                              }`}>
                                {status}
                              </span>
                              {app.isBankVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Bank Credited</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                  <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  <span>Pending Bank Credit</span>
                                </span>
                              )}
                            </div>
                            <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1">
                              {app.clientName}
                            </h3>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Bill</span>
                            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">₹{app.totalAmount}</span>
                          </div>
                        </div>

                        {/* Service, Time & UTR Payment Verification details */}
                        <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-zinc-950/80 border border-purple-200 dark:border-zinc-800/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-300">
                            <span className="font-semibold text-purple-700 dark:text-amber-300/90">{app.serviceName}</span>
                            <span className="text-zinc-500">{app.stylistName}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px] pt-1 border-t border-purple-200/70 dark:border-zinc-800/60">
                            <span>📅 {app.date} • ⏰ {app.timeSlot}</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                              Adv: ₹{app.advancePaid}
                            </span>
                          </div>
                          {utrRef && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-200/60 dark:border-zinc-800/60 font-mono">
                              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 min-w-0">
                                <span className="text-purple-700 dark:text-amber-400 font-bold shrink-0">UTR:</span>
                                <span className="truncate font-semibold">{utrRef}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(utrRef);
                                  setActionFeedbackToast(`Copied UTR: ${utrRef}`);
                                  setTimeout(() => setActionFeedbackToast(null), 2500);
                                }}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 shrink-0 cursor-pointer"
                                title="Copy UTR to check bank SMS or statement"
                              >
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copy</span>
                              </button>
                            </div>
                          )}
                          {app.paymentScreenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                              className="w-full mt-1.5 flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={app.paymentScreenshotUrl}
                                  alt={`Payment proof from ${app.clientName}`}
                                  className="w-10 h-10 rounded-lg object-cover border border-purple-200 dark:border-zinc-700 shrink-0"
                                />
                                <div className="text-left min-w-0">
                                  <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Payment Screenshot Attached</div>
                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Tap to inspect full receipt photo</div>
                                </div>
                              </div>
                              <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            </button>
                          )}
                        </div>

                        {/* Mobile Bank Credit Confirmation Actions */}
                        {!app.isBankVerified && status !== 'CANCELLED' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmBankCredit(app)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer transition shadow-sm"
                              title={`Confirm that ₹${app.advancePaid} is credited in your ${settings.bankName || 'HDFC Bank'} account`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Credit (₹{app.advancePaid})</span>
                            </button>

                            {app.upiTransactionId && (
                              <button
                                type="button"
                                onClick={() => handleRejectUtrDeposit(app)}
                                className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold min-h-[42px] cursor-pointer transition"
                                title="Reject fake/invalid UTR and cancel booking"
                              >
                                Reject Fake
                              </button>
                            )}
                          </div>
                        )}

                        {/* Direct Communication & Mobile Actions */}
                        <div className="pt-1 flex items-center gap-2 flex-wrap">
                          {app.clientPhone && (
                            <a
                              href={`tel:${app.clientPhone}`}
                              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 flex-1 justify-center min-h-[40px]"
                            >
                              <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                              <span>Call</span>
                            </a>
                          )}

                          <a
                            href={whatsappDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 flex-1 justify-center min-h-[40px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppForMessaging(app);
                              setShowSmsHubModal(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-zinc-700 text-purple-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                            title="Open SMS & WhatsApp Hub"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>SMS / Hub</span>
                          </button>

                          {app.paymentScreenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                              className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                              title="View PhonePe Payment Receipt Screenshot"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Screenshot</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setReceiptAppointment(app)}
                            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                            title="View & Print Official Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                            <span>Receipt</span>
                          </button>
                        </div>

                        {/* Status Change & Delete Buttons on Mobile */}
                        <div className="flex items-center gap-2 pt-1 border-t border-purple-100 dark:border-zinc-800/80">
                          {status !== 'COMPLETED' ? (
                            <button
                              type="button"
                              onClick={() => handleCompleteAppointment(app)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReopenAppointment(app)}
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 border border-blue-300 dark:border-blue-600/40 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                            >
                              <span>Reopen</span>
                            </button>
                          )}

                          {status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleCancelAppointment(app)}
                              className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 text-xs font-semibold min-h-[40px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setAppointmentToDelete(app)}
                            className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/15 dark:hover:bg-rose-600/25 border border-rose-300 dark:border-rose-600/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 min-h-[40px] cursor-pointer"
                            title="Delete Appointment Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SERVICES & PRICING TAB WITH IMAGE EDITING */}
          {adminTab === 'services' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-100">Services &amp; Pricing</h1>
                  <p className="text-xs text-zinc-400">Add, edit service details, photos, and duration.</p>
                </div>

                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map(srv => (
                  <div
                    key={srv.id}
                    className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between shadow-sm"
                  >
                    {srv.imageUrl && (
                      <div className="h-40 w-full overflow-hidden bg-zinc-950 relative">
                        <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-medium">
                          {srv.category}
                        </span>
                      </div>
                    )}

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-base font-bold text-zinc-100">{srv.name}</h3>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingService(srv)}
                              className="p-1 rounded text-zinc-400 hover:text-amber-400"
                              title="Edit Service"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteService(srv.id)}
                              className="p-1 rounded text-zinc-400 hover:text-red-400"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{srv.description}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Duration: {srv.durationMinutes} mins</span>
                          <span className="font-bold text-zinc-100 font-mono">₹{srv.price}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-amber-500/10 p-2 rounded-lg text-amber-400 font-semibold">
                          <span>{settings.advancePercentage || 10}% Advance:</span>
                          <span className="font-mono font-bold">₹{srv.advanceDeposit || Math.round((srv.price * (settings.advancePercentage || 10)) / 100)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY & VIDEO SHOWCASE MANAGER TAB */}
          {adminTab === 'gallery' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <span>Gallery &amp; Video Manager</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono font-bold">
                      {gallery.length} items
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-400">
                    Upload transformation photos, client style videos &amp; reels, and salon ambience to show on the client website.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewGalleryMediaType('image');
                      setShowAddGalleryModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer border border-zinc-700 shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewGalleryMediaType('video');
                      setShowAddGalleryModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Upload Video / Reel</span>
                  </button>
                </div>
              </div>

              {/* Media Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <button
                  type="button"
                  onClick={() => setGalleryMediaFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    galleryMediaFilter === 'all'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  All Showcase ({gallery.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryMediaFilter('image')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    galleryMediaFilter === 'image'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photos Only ({gallery.filter(i => i.mediaType !== 'video').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryMediaFilter('video')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    galleryMediaFilter === 'video'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Videos &amp; Reels ({gallery.filter(i => i.mediaType === 'video' || Boolean(i.videoUrl)).length})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gallery
                  .filter(item => {
                    if (galleryMediaFilter === 'image') return item.mediaType !== 'video';
                    if (galleryMediaFilter === 'video') return item.mediaType === 'video' || Boolean(item.videoUrl);
                    return true;
                  })
                  .map(item => {
                    const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm flex flex-col justify-between group hover:border-zinc-700 transition"
                      >
                        <div
                          className="relative h-48 w-full overflow-hidden bg-zinc-950 cursor-pointer"
                          onClick={() => {
                            if (isVideo) setAdminActiveVideoPreview(item);
                          }}
                        >
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          
                          {/* Video Overlay Badge & Play Button */}
                          {isVideo ? (
                            <>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-11 h-11 rounded-full bg-amber-500/90 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg transition transform group-hover:scale-110">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-sm text-amber-400 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30">
                                <Video className="w-3 h-3 text-rose-500" />
                                <span>VIDEO {item.duration ? `• ${item.duration}` : ''}</span>
                              </span>
                            </>
                          ) : (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 text-amber-400 text-[10px] font-bold">
                              {item.tag}
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              {isVideo && <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <h3 className="font-serif text-sm font-bold text-zinc-100 truncate">{item.title}</h3>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{item.subtitle}</p>
                          </div>

                          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                            <span className="text-[11px] text-zinc-500">{item.category}</span>
                            <div className="flex items-center gap-1.5">
                              {isVideo && (
                                <button
                                  type="button"
                                  onClick={() => setAdminActiveVideoPreview(item)}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-amber-500/30"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Preview</span>
                                </button>
                              )}
                              <button
                                onClick={() => setEditingGalleryItem(item)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-amber-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => deleteGalleryItem(item.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* OFFERS TAB */}
          {adminTab === 'offers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-100">Promo Offers &amp; Coupons</h1>
                  <p className="text-xs text-zinc-400">Create and manage coupon codes for client discounts.</p>
                </div>

                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {offers.map(offer => (
                  <div key={offer.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3.5 hover:border-zinc-700 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-amber-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-amber-500/30">
                          {offer.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleOfferActive(offer.id)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition cursor-pointer ${
                            offer.active !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                          title="Click to toggle active status"
                        >
                          {offer.active !== false ? '● Active' : '○ Inactive'}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                        title="Delete offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <div className="font-semibold text-sm text-zinc-200">{offer.title}</div>
                      <div className="text-xs text-zinc-400 mt-1">{offer.description}</div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex justify-between">
                      <span>Discount: {offer.discountPercent ? `${offer.discountPercent}%` : `₹${offer.discountAmount}`}</span>
                      <span>Min Booking: ₹{offer.minBookingAmount}</span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => handleBroadcastExistingOffer(offer)}
                        disabled={isBroadcastingOffer}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Broadcast to All via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {adminTab === 'reviews' && (
            <AdminReviewsTrends />
          )}

          {/* CUSTOMERS CRM TAB */}
          {adminTab === 'customers' && (() => {
            const q = customerSearch.toLowerCase().trim();
            const filteredCustomers = customers.filter(c =>
              !q ||
              (c.name || '').toLowerCase().includes(q) ||
              (c.phone || '').toLowerCase().includes(q) ||
              (c.email || '').toLowerCase().includes(q) ||
              (c.favoriteService || '').toLowerCase().includes(q)
            );
            const totalClientVisits = customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
            const totalClientSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
            const vipOrRepeatCount = customers.filter(c => (c.totalVisits || 0) >= 2).length;

            return (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">Customers CRM (All Accounts)</h1>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Unified client directory synced across all registered user accounts, Google sign-ins, and appointment bookings.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search client name, phone, email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* CRM Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-1 shadow-xs">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Total CRM Clients</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{customers.length}</div>
                    <span className="text-[10px] text-purple-700 dark:text-amber-400 font-semibold">All Accounts</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-1 shadow-xs">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Repeat / VIP Clients</span>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{vipOrRepeatCount}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">2+ Bookings</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-1 shadow-xs">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Combined Visits</span>
                    <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{totalClientVisits}</div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Active Sessions</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-1 shadow-xs">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Lifetime Client Value</span>
                    <div className="text-xl font-bold font-mono text-purple-700 dark:text-amber-400">₹{totalClientSpend.toLocaleString()}</div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Total Billings</span>
                  </div>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    {customerSearch ? `No clients matched "${customerSearch}".` : 'No client accounts or bookings recorded yet.'}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-purple-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 uppercase font-semibold border-b border-purple-200 dark:border-zinc-800">
                          <tr>
                            <th className="px-5 py-3">Client Name</th>
                            <th className="px-5 py-3">Phone &amp; Email</th>
                            <th className="px-5 py-3">Favorite Service</th>
                            <th className="px-5 py-3">Visits</th>
                            <th className="px-5 py-3">Total Spent</th>
                            <th className="px-5 py-3">Last Visit</th>
                            <th className="px-5 py-3 text-right">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 dark:divide-zinc-800">
                          {filteredCustomers.map(c => {
                            const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
                            return (
                              <tr key={c.id} className="hover:bg-purple-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    c.tier === 'VIP Member'
                                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                      : 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-zinc-300'
                                  }`}>
                                    {c.tier || 'Standard'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                                  <div className="font-mono">{c.phone || '—'}</div>
                                  <div className="text-[11px] text-zinc-500">{c.email || '—'}</div>
                                </td>
                                <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                                  {c.favoriteService || 'General Styling'}
                                </td>
                                <td className="px-5 py-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                                  {c.totalVisits || 0} visits
                                </td>
                                <td className="px-5 py-4 font-bold text-purple-700 dark:text-amber-400 font-mono">
                                  ₹{(c.totalSpent || 0).toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                                  {c.lastVisit || 'Recent'}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {c.phone && (
                                      <a
                                        href={`tel:${c.phone}`}
                                        className="p-2 rounded-lg bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-amber-400 hover:bg-purple-200 dark:hover:bg-zinc-700"
                                        title="Call Client"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {cleanPhone && (
                                      <a
                                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${c.name}, greetings from Modern Unisex Salon Mohol!`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-600/30"
                                        title="WhatsApp Client"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Customers Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredCustomers.map(c => {
                        const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
                        return (
                          <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{c.name}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    c.tier === 'VIP Member'
                                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                      : 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-zinc-300'
                                  }`}>
                                    {c.tier || 'Standard'}
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-mono">{c.phone || 'No phone'}</div>
                                {c.email && <div className="text-[11px] text-zinc-500 truncate">{c.email}</div>}
                                {c.favoriteService && (
                                  <div className="text-[11px] text-purple-700 dark:text-amber-300/90 mt-1 font-medium">
                                    Prefers: {c.favoriteService}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Spent</span>
                                <span className="font-mono font-bold text-purple-700 dark:text-amber-400 text-sm">₹{(c.totalSpent || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-zinc-800/80 text-xs">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-mono font-semibold">
                                {c.totalVisits || 0} visits
                              </span>
                              <span className="text-zinc-500 text-[11px]">Last: {c.lastVisit || 'Recent'}</span>
                              <div className="flex items-center gap-1.5">
                                {c.phone && (
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="p-2 rounded-lg bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-amber-400 hover:bg-purple-200 dark:hover:bg-zinc-700"
                                    title="Call Client"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${c.name}, greetings from Modern Unisex Salon Mohol!`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-600/30"
                                    title="WhatsApp Client"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* INQUIRIES TAB */}
          {adminTab === 'inquiries' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-100">Consultation Enquiries</h1>
                  <p className="text-xs text-zinc-400">
                    Client consultation messages, bridal queries &amp; reported inquiries from the Contact form.
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 w-fit">
                  Total Enquiries: {inquiries.length}
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <Mail className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">No reported consultation enquiries</p>
                  <p className="text-xs text-zinc-500">All client messages and inquiries have been cleared or resolved.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inquiries.map(inq => (
                    <div key={inq.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-100">{inq.clientName || (inq as any).name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              inq.status === 'NEW'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : inq.status === 'RESOLVED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {inq.status || 'NEW'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono">{inq.receivedDate || (inq as any).date}</span>
                        </div>

                        {inq.subject && (
                          <div className="text-xs font-bold text-amber-400">
                            Subject: {inq.subject}
                          </div>
                        )}

                        <div className="text-xs text-zinc-400 flex flex-wrap gap-2">
                          {inq.phone && <span>📞 {inq.phone}</span>}
                          {inq.email && <span>✉️ {inq.email}</span>}
                        </div>

                        <p className="text-xs text-zinc-300 italic bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 leading-relaxed">
                          "{inq.message}"
                        </p>
                      </div>

                      {/* Action buttons: Delete Reported Enquiry & Status */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-500">ID: {inq.id}</span>
                        <div className="flex items-center gap-2">
                          {inq.status !== 'RESOLVED' && (
                            <button
                              onClick={() => updateInquiryStatus(inq.id, 'RESOLVED')}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button
                            id={`delete-inquiry-${inq.id}`}
                            onClick={() => setInquiryToDelete(inq.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="Delete Reported Enquiry from Database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Reported Enquiry</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTS & ANALYTICS TAB */}
          {adminTab === 'reports' && (
            <AdminCharts />
          )}

          {/* STAFF & TEAM MANAGEMENT TAB */}
          {adminTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-100">Staff &amp; Salon Specialists</h1>
                  <p className="text-xs text-zinc-400">
                    Manage stylists, beauticians, shift hours, and specialties for Modern Unisex Salon Mohol.
                  </p>
                </div>
                <button
                  id="add-staff-btn"
                  onClick={openAddStaffModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </div>

              {/* Staff Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400">Total Specialists</span>
                  <div className="text-xl font-bold font-mono text-zinc-100">{staffMembers.length}</div>
                  <span className="text-[10px] text-amber-400 font-medium">Verified Team</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400">Available Today</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {staffMembers.filter(s => s.status === 'Available Today').length}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">On Shift</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400">Active Staff</span>
                  <div className="text-xl font-bold font-mono text-blue-400">
                    {staffMembers.filter(s => s.status === 'Active').length}
                  </div>
                  <span className="text-[10px] text-blue-400 font-medium">Roster</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-400">Avg Client Rating</span>
                  <div className="text-xl font-bold font-mono text-amber-400">4.9 ★</div>
                  <span className="text-[10px] text-zinc-400">Top Hospitality</span>
                </div>
              </div>

              {/* Search & Department Filters */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search staff by name, role, or specialty..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    {staffSearch && (
                      <button
                        onClick={() => setStaffSearch('')}
                        className="absolute right-3 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Department Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {['All', 'Hair Care', 'Skin & Facial', 'Bridal & Makeup', 'Men Grooming', 'Spa & Wellness'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => setStaffDepartmentFilter(dept)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                        staffDepartmentFilter === dept
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Grid */}
              {(() => {
                const query = staffSearch.toLowerCase().trim();
                const filteredStaff = staffMembers.filter(m => {
                  const matchSearch = !query ||
                    m.name.toLowerCase().includes(query) ||
                    m.role.toLowerCase().includes(query) ||
                    m.specialties.some(s => s.toLowerCase().includes(query));
                  const matchDept = staffDepartmentFilter === 'All' || m.department === staffDepartmentFilter;
                  return matchSearch && matchDept;
                });

                if (filteredStaff.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                      <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                      <p className="text-sm font-semibold text-zinc-300">No staff members found</p>
                      <p className="text-xs text-zinc-500">
                        {staffSearch ? `No specialists match "${staffSearch}".` : 'Get started by adding your first salon stylist or specialist.'}
                      </p>
                      <button
                        onClick={openAddStaffModal}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Staff</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map(member => (
                      <div
                        key={member.id}
                        className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-sm"
                      >
                        <div className="space-y-3">
                          {/* Member Top Header */}
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={member.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                                alt={member.name}
                                className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 shadow-md"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                                  member.status === 'Available Today'
                                    ? 'bg-emerald-400'
                                    : member.status === 'Active'
                                    ? 'bg-blue-400'
                                    : 'bg-amber-400'
                                }`}
                                title={member.status}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="font-bold text-sm text-zinc-100 truncate">{member.name}</h3>
                                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  <span>{member.rating || 4.9}</span>
                                </div>
                              </div>
                              <p className="text-xs text-amber-400/90 font-medium truncate">{member.role}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400 font-mono">
                                <Briefcase className="w-3 h-3 text-zinc-500" />
                                <span>{member.experience || '3+ Years'} Exp</span>
                                <span>•</span>
                                <span className="text-zinc-300">{member.department}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shift & Status Bar */}
                          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="font-mono">{member.shiftHours || '9:00 AM - 7:00 PM'}</span>
                            </div>

                            {/* Status Quick Changer */}
                            <select
                              value={member.status}
                              onChange={(e) => updateStaffMember(member.id, { status: e.target.value as any })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-none ${
                                member.status === 'Available Today'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : member.status === 'Active'
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              }`}
                            >
                              <option value="Available Today" className="bg-zinc-900 text-emerald-400">Available Today</option>
                              <option value="Active" className="bg-zinc-900 text-blue-400">Active</option>
                              <option value="On Leave" className="bg-zinc-900 text-amber-400">On Leave</option>
                            </select>
                          </div>

                          {/* Specialties Tags */}
                          {member.specialties && member.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {member.specialties.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[10px] border border-zinc-700/60"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Bio */}
                          {member.bio && (
                            <p className="text-[11px] text-zinc-400 italic line-clamp-2 leading-relaxed">
                              "{member.bio}"
                            </p>
                          )}

                          {/* Phone / Email Contact info */}
                          <div className="text-[11px] text-zinc-400 flex flex-wrap gap-2 pt-1">
                            {member.phone && (
                              <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-amber-400">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <span>{member.phone}</span>
                              </a>
                            )}
                            {member.email && (
                              <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-amber-400">
                                <Mail className="w-3 h-3 text-zinc-500" />
                                <span>{member.email}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {member.totalClients || 120}+ Clients
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditStaffModal(member)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                              title="Edit Staff Member"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setStaffToDelete(member)}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs cursor-pointer transition active:scale-95"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* THEMES TAB */}
          {adminTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100">Theme Selector</h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Choose between White &amp; Lavender Light mode or Obsidian Gold Dark mode.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div
                  onClick={() => setTheme('light')}
                  className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                    theme === 'light'
                      ? 'border-purple-600 dark:border-amber-500 bg-white dark:bg-zinc-900 shadow-md'
                      : 'border-purple-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-purple-600 dark:text-amber-500" />
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">White &amp; Lavender Light</span>
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Clean, bright aesthetic for daytime salon viewing.</p>
                </div>

                <div
                  onClick={() => setTheme('dark')}
                  className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                    theme === 'dark'
                      ? 'border-purple-600 dark:border-amber-500 bg-white dark:bg-zinc-900 shadow-md'
                      : 'border-purple-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-purple-600 dark:text-amber-400" />
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Obsidian Gold Dark</span>
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Deep luxury tone with golden accents.</p>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS & REAL-WORLD PAYMENT GATEWAY TAB */}
          {adminTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                    <Settings className="w-6 h-6 text-purple-600 dark:text-amber-400" />
                    <span>Salon Settings &amp; Direct Bank UPI Payment Setup</span>
                  </h1>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Manage confidential salon bank accounts, QR scanners, 10% advance deposit rules, and operational settings with 0% platform deductions.
                  </p>
                </div>
              </div>

              {/* Status Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-amber-50/70 to-emerald-50/70 dark:from-zinc-900 dark:via-amber-950/20 dark:to-zinc-900 border border-purple-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center font-bold text-lg">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Payment Routing:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                        🟢 Direct Bank &amp; UPI Active (0% Gateway Cut)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Account: <span className="font-mono text-zinc-900 dark:text-zinc-200 font-semibold">{settings.accountHolder || 'MODERN JENTS PARLOUR'}</span> • HDFC Bank A/C: <span className="font-mono text-zinc-900 dark:text-zinc-200">{settings.bankAccountNumber || '50200072074441'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-zinc-700 text-xs font-mono text-purple-700 dark:text-amber-400 font-semibold">
                    IFSC: {settings.bankIfsc || 'HDFC0000635'}
                  </div>
                </div>
              </div>

              {/* CARD 1: DIRECT BANK UPI & QR SCANNERS SETTINGS */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-5 text-xs shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 dark:border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                      <span>1. Official Salon Bank &amp; UPI Scanners (Confidential)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Edit UPI ID, Payee Name, or upload a new QR photo, then click Save so clients see changes immediately.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasUnsavedScannerChanges && (
                      <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        Unsaved Changes
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveScannerSettings}
                      disabled={isSavingScannerSettings}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingScannerSettings ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Scanner &amp; UPI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {scannerSaveNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                      scannerSaveNotice.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {scannerSaveNotice.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{scannerSaveNotice.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScannerSaveNotice(null)}
                      className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Scanners 1 & 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scanner 1 (Primary HDFC Bank / PhonePe QR) */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                        <span>Scanner 1 (Primary Salon QR)</span>
                      </label>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-100 dark:bg-amber-500/20 text-purple-700 dark:text-amber-400 font-bold uppercase">PhonePe / HDFC Bank</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 block mb-1">Payee / Account Holder Name</label>
                      <input
                        type="text"
                        value={scannerDraft.accountHolder}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, accountHolder: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                          setScannerSaveNotice(null);
                        }}
                        placeholder="e.g. MODERN JENTS PARLOUR"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">Active Salon UPI ID (VPA)</label>
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Live on Client Side</span>
                      </div>
                      <input
                        type="text"
                        value={scannerDraft.merchantUpiId}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, merchantUpiId: e.target.value, primaryQrCustomOnly: false }));
                          setHasUnsavedScannerChanges(true);
                          setScannerSaveNotice(null);
                        }}
                        placeholder="e.g. ghodakedinesh@ybl"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-300 dark:border-amber-500/60 text-purple-700 dark:text-amber-400 font-mono text-xs font-bold focus:outline-none focus:border-purple-500 dark:focus:border-amber-400"
                      />
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Uploading a QR photo auto-detects its UPI ID, or type a new VPA (auto-saves immediately).
                      </span>
                    </div>

                    {/* QR Code Poster Image Upload & Preview */}
                    <div className="pt-2 border-t border-purple-200/80 dark:border-zinc-800 space-y-2">
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold block">Store Standee QR Poster Image</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingScreenshotUrl(scannerDraft.upiQrCodeUrl || '/assets/aistudio/image_2ca5cc29.png')}
                          className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 p-1 cursor-pointer hover:ring-2 hover:ring-purple-400 transition"
                          title="Click to preview full Scanner 1 QR"
                        >
                          <img
                            src={scannerDraft.upiQrCodeUrl || '/assets/aistudio/image_2ca5cc29.png'}
                            alt="Primary QR Standee"
                            className="w-full h-full object-contain"
                          />
                        </button>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-purple-900 dark:text-white text-[11px] font-bold cursor-pointer transition">
                              <Upload className="w-3 h-3 text-purple-700 dark:text-amber-400" />
                              <span>Upload QR Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleQrPhotoUpload(file, 'scanner1');
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(scannerDraft.upiQrCodeUrl || '/assets/aistudio/image_2ca5cc29.png')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-purple-700 dark:text-amber-300 text-[10px] font-bold cursor-pointer hover:bg-purple-50 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              draftEditVersionRef.current += 1;
                              const resetData = {
                                accountHolder: 'MODERN JENTS PARLOUR',
                                upiQrCodeUrl: '/assets/aistudio/image_2ca5cc29.png',
                                merchantUpiId: 'ghodakedinesh@ybl',
                                upiId: 'ghodakedinesh@ybl',
                                primaryQrCustomOnly: false,
                                primaryUpiExtraParams: ''
                              };
                              setScannerDraft(prev => ({ ...prev, ...resetData }));
                              setHasUnsavedScannerChanges(false);
                              await updateSettings(resetData);
                              setScannerSaveNotice({
                                type: 'success',
                                text: 'Scanner 1 reset to Official PhonePe QR (ghodakedinesh@ybl) and saved!'
                              });
                            }}
                            className="text-[10px] text-purple-700 dark:text-amber-400 hover:underline block cursor-pointer"
                          >
                            Reset to Official PhonePe QR (MODERN JENTS PARLOUR)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scanner 2 (Secondary / Personal QR) */}
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />
                        <span>Scanner 2 (Secondary Backup QR)</span>
                      </label>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-bold uppercase">PhonePe UPI</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 block mb-1">Payee Name</label>
                      <input
                        type="text"
                        value={scannerDraft.secondaryAccountHolder}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, secondaryAccountHolder: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                          setScannerSaveNotice(null);
                        }}
                        placeholder="e.g. DINESH VITTHAL GHODAKE"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Secondary UPI ID (VPA)</label>
                      <input
                        type="text"
                        value={scannerDraft.secondaryUpiId}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, secondaryUpiId: e.target.value, secondaryQrCustomOnly: false, secondaryUpiExtraParams: '' }));
                          setHasUnsavedScannerChanges(true);
                          setScannerSaveNotice(null);
                        }}
                        placeholder="e.g. 8104026257@axl"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Secondary backup UPI handle for customer scanning.
                      </span>
                    </div>

                    {/* Scanner 2 QR Poster */}
                    <div className="pt-2 border-t border-purple-200/80 dark:border-zinc-800 space-y-2">
                      <label className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold block">Scanner 2 Poster Standee</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingScreenshotUrl(scannerDraft.secondaryUpiQrCodeUrl || '/assets/aistudio/image_fce20bf8.png')}
                          className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 p-1 cursor-pointer hover:ring-2 hover:ring-purple-400 transition"
                          title="Click to preview full Scanner 2 QR"
                        >
                          <img
                            src={scannerDraft.secondaryUpiQrCodeUrl || '/assets/aistudio/image_fce20bf8.png'}
                            alt="Secondary QR Standee"
                            className="w-full h-full object-contain"
                          />
                        </button>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-purple-900 dark:text-white text-[11px] font-bold cursor-pointer transition">
                              <Upload className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                              <span>Upload QR Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleQrPhotoUpload(file, 'scanner2');
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(scannerDraft.secondaryUpiQrCodeUrl || '/assets/aistudio/image_fce20bf8.png')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-purple-700 dark:text-purple-300 text-[10px] font-bold cursor-pointer hover:bg-purple-50 transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              draftEditVersionRef.current += 1;
                              const resetData = {
                                secondaryAccountHolder: 'DINESH VITTHAL GHODAKE',
                                secondaryUpiQrCodeUrl: '/assets/aistudio/image_fce20bf8.png',
                                secondaryUpiId: '8104026257@axl',
                                secondaryQrCustomOnly: false,
                                secondaryUpiExtraParams: ''
                              };
                              setScannerDraft(prev => ({ ...prev, ...resetData }));
                              setHasUnsavedScannerChanges(false);
                              await updateSettings(resetData);
                              setScannerSaveNotice({
                                type: 'success',
                                text: 'Scanner 2 reset to Official PhonePe QR (8104026257@axl) and saved!'
                              });
                            }}
                            className="text-[10px] text-purple-700 dark:text-purple-400 hover:underline block cursor-pointer"
                          >
                            Reset to Official PhonePe QR (DINESH VITTHAL GHODAKE)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verified Merchant UPI Gateway (Razorpay) — Eliminates PhonePe Personal VPA Browser Security Blocks */}
                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-zinc-950 border border-purple-300/70 dark:border-amber-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-purple-800 dark:text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        <span>Verified Merchant UPI Gateway (PhonePe &amp; Google Pay Zero-Decline)</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        PhonePe Protect blocks browser redirects to personal <code className="font-mono">@ybl/@axl</code> IDs. Add your live Razorpay Merchant API keys (or upload a <strong>PhonePe Business Merchant QR</strong> above) so tapping PhonePe / GPay completes payment directly with zero security block.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestGatewayConnection}
                      disabled={isTestingGateway}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-[11px] font-bold shrink-0 cursor-pointer disabled:opacity-50 transition"
                    >
                      {isTestingGateway ? 'Verifying...' : 'Test Gateway Connection'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Razorpay Key ID</label>
                      <input
                        type="text"
                        value={settings.razorpayKeyId || ''}
                        onChange={(e) => updateSettings({ razorpayKeyId: e.target.value.trim() })}
                        placeholder="rzp_live_... or rzp_test_..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Razorpay Key Secret</label>
                      <div className="relative">
                        <input
                          type={showRazorpaySecret ? 'text' : 'password'}
                          value={settings.razorpayKeySecret || ''}
                          onChange={(e) => updateSettings({ razorpayKeySecret: e.target.value.trim() })}
                          placeholder="Enter Razorpay Key Secret"
                          className="w-full px-3 py-2 pr-9 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRazorpaySecret(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                          title={showRazorpaySecret ? 'Hide secret' : 'Show secret'}
                        >
                          {showRazorpaySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {gatewayTestResult && (
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                        gatewayTestResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/40 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {gatewayTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{gatewayTestResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Bank Account Details */}
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>Official Bank Account Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={scannerDraft.bankName}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, bankName: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={scannerDraft.accountHolder}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, accountHolder: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Account Number</label>
                      <input
                        type="text"
                        value={scannerDraft.bankAccountNumber}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, bankAccountNumber: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={scannerDraft.bankIfsc}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, bankIfsc: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Branch</label>
                      <input
                        type="text"
                        value={scannerDraft.bankBranch}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, bankBranch: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">Account Type</label>
                      <input
                        type="text"
                        value={scannerDraft.bankAccountType}
                        onChange={(e) => {
                          draftEditVersionRef.current += 1;
                          setScannerDraft(prev => ({ ...prev, bankAccountType: e.target.value }));
                          setHasUnsavedScannerChanges(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Save Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-purple-100 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {hasUnsavedScannerChanges
                      ? 'Saving automatically to Client Booking Checkout...'
                      : `Synced with Client Checkout (${scannerDraft.merchantUpiId || 'updated'})`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveScannerSettings}
                    disabled={isSavingScannerSettings}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSavingScannerSettings ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Scanner &amp; UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>


              {/* CARD 2: SALON PROFILE & POLICIES */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-4 shadow-sm text-xs">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-purple-100 dark:border-zinc-800 pb-3">
                  <Scissors className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                  <span>2. Salon Identity &amp; Contact Details</span>
                </h3>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Salon Name</label>
                  <input
                    type="text"
                    value={settings.salonName}
                    onChange={(e) => updateSettings({ salonName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Helpline Phone *</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Official Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Physical Address *</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={settings.openingHours || 'Mon - Sun: 09:00 AM - 09:00 PM'}
                      onChange={(e) => updateSettings({ openingHours: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={settings.gstNumber || ''}
                      onChange={(e) => updateSettings({ gstNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-zinc-950 border border-purple-200 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-amber-400">Advance Deposit Percentage:</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-amber-400 text-sm">{settings.advancePercentage}% Online Deposit</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={settings.advancePercentage}
                    onChange={(e) => updateSettings({ advancePercentage: Number(e.target.value) })}
                    className="w-full accent-purple-600 dark:accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Calculates required online reservation deposit for client appointments. Standard recommendation is 10%.
                  </p>
                </div>
              </div>

              {/* CARD 3: ADMIN MASTER SECURITY & PASSWORD */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-amber-500/40 space-y-4 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-purple-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                    <span>3. Four Admin Emails &amp; Shared Admin Master Password</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-amber-500/10 text-purple-700 dark:text-amber-400 border border-purple-200 dark:border-amber-500/20">
                    Firestore Real-time
                  </span>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Configure up to <strong>4 authorized Admin Email addresses</strong> that all share <strong>one Admin Master Password</strong>. If any email account gets frozen or locked, any of the remaining backup admin emails can immediately sign in with the same shared password or Google Sign-In.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { idx: 0, label: 'Admin Email 1 (Primary Owner) *', placeholder: 'dineshghodake941@gmail.com', defaultVal: 'dineshghodake941@gmail.com' },
                    { idx: 1, label: 'Admin Email 2 (Backup Admin)', placeholder: 'owner.backup@modernsalon.com', defaultVal: '' },
                    { idx: 2, label: 'Admin Email 3 (Backup Admin)', placeholder: 'modernsalon02@gmail.com', defaultVal: 'modernsalon02@gmail.com' },
                    { idx: 3, label: 'Admin Email 4 (Emergency Backup)', placeholder: 'admin@modernsalon.com', defaultVal: 'admin@modernsalon.com' }
                  ].map((slot) => {
                    const currentEmails = settings.adminEmails && settings.adminEmails.length > 0
                      ? settings.adminEmails
                      : ['dineshghodake941@gmail.com', '', 'modernsalon02@gmail.com', 'admin@modernsalon.com'];
                    const value = currentEmails[slot.idx] ?? '';
                    return (
                      <div key={slot.idx}>
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                          {slot.label}
                        </label>
                        <input
                          type="email"
                          value={value}
                          onChange={(e) => {
                            const next = [
                              currentEmails[0] ?? 'dineshghodake941@gmail.com',
                              currentEmails[1] ?? '',
                              currentEmails[2] ?? 'modernsalon02@gmail.com',
                              currentEmails[3] ?? 'admin@modernsalon.com'
                            ];
                            next[slot.idx] = e.target.value.trim().toLowerCase();
                            updateSettings({ adminEmails: next });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                          placeholder={slot.placeholder}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          Shared password &amp; Google Sign-In enabled for Slot {slot.idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Shared Admin Master Password (All 4 Emails) *
                    </label>
                    <input
                      type="text"
                      value={settings.adminPassword || 'Salon@Owner#2026'}
                      onChange={(e) => updateSettings({ adminPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      placeholder="e.g. UniqueOwnerPass#2026"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      One shared password for all authorized admin emails
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Admin Quick PIN
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={settings.adminPin || '8104'}
                      onChange={(e) => updateSettings({ adminPin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 dark:focus:border-amber-500"
                      placeholder="e.g. 8104"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Unique PIN for front-desk clearance
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
                      Primary Admin Owner: <strong>dineshghodake941@gmail.com</strong>. Authorized admin emails share this master password and sync to Firebase &amp; backend immediately.
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 4: UPLOADED CLIENT PAYMENT SCREENSHOTS & RECEIPT PROOFS */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 space-y-4 shadow-sm text-xs lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600 dark:text-amber-400" />
                      <span>4. Uploaded Client Payment Screenshots &amp; Receipt Proofs</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Every PhonePe / Google Pay deposit screenshot uploaded during booking appears here immediately for verification.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 shrink-0">
                    {appointments.filter(a => Boolean(a.paymentScreenshotUrl)).length} Screenshot(s) Uploaded
                  </span>
                </div>

                {appointments.filter(a => Boolean(a.paymentScreenshotUrl)).length === 0 ? (
                  <div className="p-6 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-dashed border-purple-200 dark:border-zinc-800 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                    No client payment screenshots have been uploaded yet. Whenever a client uploads a PhonePe or Google Pay receipt screenshot at checkout, it will appear here and in the Appointments tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {appointments
                      .filter(a => Boolean(a.paymentScreenshotUrl))
                      .map((app) => (
                        <div
                          key={`proof-${app.id}`}
                          className="p-3 rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                              className="w-16 h-20 rounded-xl overflow-hidden border border-purple-300 dark:border-purple-500/40 bg-white dark:bg-zinc-900 shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
                              title="Click to zoom screenshot"
                            >
                              <img
                                src={app.paymentScreenshotUrl}
                                alt={`Payment proof by ${app.clientName}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-amber-400 truncate">
                                  {app.bookingRef}
                                </span>
                                {app.isBankVerified ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{app.clientName}</div>
                              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                {app.date} • {app.timeSlot}
                              </div>
                              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                                ₹{app.advancePaid} Adv {app.upiTransactionId ? `• UTR: ${app.upiTransactionId}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-purple-200/70 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Full Image</span>
                            </button>
                            {!app.isBankVerified && getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmBankCredit(app)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                            )}
                            {!app.isBankVerified && app.upiTransactionId && getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleRejectUtrDeposit(app)}
                                className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 text-[11px] font-bold cursor-pointer transition"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TERMS & CONDITIONS TAB */}
          {adminTab === 'policies' && (
            <AdminTermsPolicies />
          )}

        </div>
      </main>

      {/* MODALS */}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-zinc-100">Add New Service</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. O3+ Bridal Glow Facial"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="Hair Care & Styling">Hair Care & Styling</option>
                    <option value="Skin & Facial Therapy">Skin &amp; Facial</option>
                    <option value="Bridal & Pre-Bridal">Bridal &amp; Makeup</option>
                    <option value="Men's Executive Grooming">Men's Grooming</option>
                    <option value="Hair Chemical Services">Hair Chemical / Keratin</option>
                    <option value="Spa & Body Treatments">Spa</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">{settings.advancePercentage || 10}% Advance</label>
                  <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-bold font-mono">
                    ₹{Math.round((newServicePrice * (settings.advancePercentage || 10)) / 100)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Service Image (Upload file or Paste URL)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newServiceImg}
                      onChange={(e) => setNewServiceImg(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                    />
                    <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setNewServiceImg(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {newServiceImg && (
                    <div className="relative h-24 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img src={newServiceImg} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Save Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-zinc-100">Edit Service</h3>
              <button onClick={() => setEditingService(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateServiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Service Image (Upload file or Paste URL)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editingService.imageUrl || ''}
                      onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                    />
                    <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setEditingService({ ...editingService, imageUrl: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingService.imageUrl && (
                    <div className="relative h-24 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img src={editingService.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Update Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Gallery & Video Modal */}
      {showAddGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {newGalleryMediaType === 'video' ? (
                  <Video className="w-5 h-5 text-amber-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="font-serif text-lg font-bold text-zinc-100">
                  {newGalleryMediaType === 'video' ? 'Upload Client Style Video / Reel' : 'Add Gallery Photo'}
                </h3>
              </div>
              <button onClick={() => setShowAddGalleryModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Type Switcher */}
            <div>
              <label className="text-zinc-300 block mb-1.5 font-semibold text-xs">Media Format *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewGalleryMediaType('image')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                    newGalleryMediaType === 'image'
                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo / Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewGalleryMediaType('video')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                    newGalleryMediaType === 'video'
                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video / Reel</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateGallery} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  {newGalleryMediaType === 'video' ? 'Video Title *' : 'Photo Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newGalleryMediaType === 'video' ? 'e.g. Bridal Reception Makeover Reel' : 'e.g. Classic Bridal Transformation'}
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 360 degree styling view, glowing skin, HD makeup finish"
                  value={newGallerySubtitle}
                  onChange={(e) => setNewGallerySubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Category</label>
                  <select
                    value={newGalleryCategory}
                    onChange={(e: any) => {
                      setNewGalleryCategory(e.target.value);
                      setNewGalleryTag(newGalleryMediaType === 'video' ? 'Video Reel' : e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="Bridal">Bridal</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Salon Interior">Salon Interior</option>
                    <option value="Nail Art">Nail Art</option>
                    <option value="Spa">Spa</option>
                    <option value="Men Grooming">Men Grooming</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Tag Badge</label>
                  <input
                    type="text"
                    value={newGalleryTag}
                    onChange={(e) => setNewGalleryTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* VIDEO SPECIFIC FIELDS */}
              {newGalleryMediaType === 'video' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" />
                      <span>Video Source (Upload File or Paste Link) *</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">MP4, WebM, YouTube, Vimeo</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste video URL (YouTube, Vimeo, MP4)..."
                        value={newGalleryVideoUrl}
                        onChange={(e) => setNewGalleryVideoUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                      />
                      <label className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1 transition disabled:opacity-50">
                        {isUploadingVideo ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingVideo ? 'Uploading...' : 'Upload Video File'}</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                          className="hidden"
                          disabled={isUploadingVideo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadVideoFile(file, false);
                          }}
                        />
                      </label>
                    </div>

                    {isUploadingVideo && (
                      <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-400" />
                        <span>{videoUploadStatus || 'Saving video to salon storage...'}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-400 block mb-1">Duration (e.g. 0:45 min)</label>
                        <input
                          type="text"
                          value={newGalleryDuration}
                          onChange={(e) => setNewGalleryDuration(e.target.value)}
                          placeholder="0:45 min"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Quick Sample Presets</label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewGalleryVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                            setNewGalleryDuration('0:15 min');
                          }}
                          className="w-full py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold text-center cursor-pointer"
                        >
                          Fill Sample Salon Reel
                        </button>
                      </div>
                    </div>

                    {/* Video Player Preview inside Modal */}
                    {newGalleryVideoUrl && (
                      <div className="pt-2">
                        <label className="text-zinc-400 block mb-1">Video Player Preview:</label>
                        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
                          <video
                            key={newGalleryVideoUrl}
                            src={newGalleryVideoUrl}
                            controls
                            playsInline
                            preload="auto"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cover / Poster Image */}
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">
                  {newGalleryMediaType === 'video' ? 'Cover / Poster Thumbnail *' : 'Image (Upload file or Paste URL) *'}
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={newGalleryImg}
                      onChange={(e) => setNewGalleryImg(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                    />
                    <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setNewGalleryImg(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {newGalleryImg && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img src={newGalleryImg} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {newGalleryMediaType === 'video' ? 'Publish Video to Salon Gallery' : 'Upload to Gallery'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Gallery Item Modal */}
      {editingGalleryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-zinc-100">
                Edit {editingGalleryItem.mediaType === 'video' ? 'Video Reel' : 'Gallery Photo'}
              </h3>
              <button onClick={() => setEditingGalleryItem(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGallerySubmit} className="space-y-3 text-xs">
              {/* Media Type Switcher */}
              <div>
                <label className="text-zinc-300 block mb-1">Media Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGalleryItem({ ...editingGalleryItem, mediaType: 'image' })}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingGalleryItem.mediaType !== 'video'
                        ? 'bg-amber-500 text-zinc-950 border-amber-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingGalleryItem({ ...editingGalleryItem, mediaType: 'video' })}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingGalleryItem.mediaType === 'video'
                        ? 'bg-amber-500 text-zinc-950 border-amber-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingGalleryItem.title}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingGalleryItem.subtitle || ''}
                  onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Category</label>
                  <select
                    value={editingGalleryItem.category}
                    onChange={(e: any) => setEditingGalleryItem({ ...editingGalleryItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="Bridal">Bridal</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Salon Interior">Salon Interior</option>
                    <option value="Nail Art">Nail Art</option>
                    <option value="Spa">Spa</option>
                    <option value="Men Grooming">Men Grooming</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Tag Badge</label>
                  <input
                    type="text"
                    value={editingGalleryItem.tag}
                    onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* If Video, show video URL and duration */}
              {editingGalleryItem.mediaType === 'video' && (
                <div className="space-y-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <label className="text-amber-400 block font-bold">Video URL / Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingGalleryItem.videoUrl || ''}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, videoUrl: e.target.value })}
                      placeholder="Paste video URL..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                    />
                    <label className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1 disabled:opacity-50">
                      {isUploadingVideo ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingVideo ? 'Uploading...' : 'Upload Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={isUploadingVideo}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadVideoFile(file, true);
                        }}
                      />
                    </label>
                  </div>
                  {isUploadingVideo && (
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-400" />
                      <span>{videoUploadStatus || 'Saving video to salon storage...'}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-zinc-400 block mb-1">Duration</label>
                    <input
                      type="text"
                      value={editingGalleryItem.duration || ''}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, duration: e.target.value })}
                      placeholder="0:45 min"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Image / Cover</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={editingGalleryItem.imageUrl}
                      onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, imageUrl: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                    />
                    <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setEditingGalleryItem({ ...editingGalleryItem, imageUrl: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingGalleryItem.imageUrl && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img src={editingGalleryItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Update Media Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Video Playback Preview Lightbox */}
      {adminActiveVideoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white truncate">
                  {adminActiveVideoPreview.title}
                </h3>
              </div>
              <button
                onClick={() => setAdminActiveVideoPreview(null)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800">
              {(() => {
                const url = (adminActiveVideoPreview.videoUrl || '').trim();
                const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                if (ytMatch) {
                  return (
                    <iframe
                      key={adminActiveVideoPreview.id}
                      src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
                      title={adminActiveVideoPreview.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                if (vimeoMatch) {
                  return (
                    <iframe
                      key={adminActiveVideoPreview.id}
                      src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
                      title={adminActiveVideoPreview.title}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    key={`${adminActiveVideoPreview.id}-${url}`}
                    src={url}
                    poster={adminActiveVideoPreview.imageUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support playing this video format.
                  </video>
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Category: <strong className="text-amber-400">{adminActiveVideoPreview.category}</strong></span>
              <span>Duration: <strong className="text-zinc-200">{adminActiveVideoPreview.duration || '0:30 min'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Add Offer Modal */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-zinc-100">Create Promo Code</h3>
              <button onClick={() => setShowAddOfferModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1">Coupon Code (e.g. GLOW20) *</label>
                <input
                  type="text"
                  required
                  value={newOfferCode}
                  onChange={(e) => setNewOfferCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-300 block mb-1">Description (Promotional Message)</label>
                <textarea
                  rows={2}
                  value={newOfferDesc}
                  onChange={(e) => setNewOfferDesc(e.target.value)}
                  placeholder="e.g. Enjoy 20% OFF on all hair styling & facial packages this week!"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={newOfferDiscount}
                    onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1">Min Booking (₹)</label>
                  <input
                    type="number"
                    value={newOfferMin}
                    onChange={(e) => setNewOfferMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* WhatsApp Broadcast Notice */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Send className="w-3.5 h-3.5" />
                  <span>Dynamic WhatsApp Broadcast</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  When published, personalized WhatsApp promo messages with 1-click booking links are dynamically prepared for all salon clients!
                </p>
              </div>

              <button
                type="submit"
                disabled={isBroadcastingOffer}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBroadcastingOffer ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing & Preparing Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish & Broadcast via WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MEMBER MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-zinc-100">
                    {editingStaffMember ? 'Edit Staff Specialist' : 'Add New Salon Specialist'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {editingStaffMember ? `Update ${editingStaffMember.name}'s details & shift schedule` : 'Add stylist, beautician, or therapist to Modern Salon team'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setEditingStaffMember(null);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              {/* Image Preview & URL */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <img
                  src={staffImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt="Staff Preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <label className="text-zinc-300 font-medium block text-[11px]">Photo URL / Avatar</label>
                  <input
                    type="url"
                    value={staffImage}
                    onChange={(e) => setStaffImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Name and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Specialist Name *</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Enter specialist full name"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    placeholder="e.g. Senior Hair Stylist & Colorist"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Department & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Department</label>
                  <select
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin & Facial">Skin & Facial</option>
                    <option value="Bridal & Makeup">Bridal & Makeup</option>
                    <option value="Men Grooming">Men Grooming</option>
                    <option value="Spa & Wellness">Spa & Wellness</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Experience</label>
                  <input
                    type="text"
                    value={staffExperience}
                    onChange={(e) => setStaffExperience(e.target.value)}
                    placeholder="e.g. 5 Years"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Shift Hours & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Daily Shift Hours</label>
                  <input
                    type="text"
                    value={staffShift}
                    onChange={(e) => setStaffShift(e.target.value)}
                    placeholder="e.g. 9:00 AM - 7:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Current Status</label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Available Today">Available Today</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 98220 12345"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="priya@modernsalon.com"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={staffSpecialties}
                  onChange={(e) => setStaffSpecialties(e.target.value)}
                  placeholder="e.g. Keratin Therapy, Balayage, Layer Cut, Bridal Glow"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Bio / Profile Highlight</label>
                <textarea
                  rows={2}
                  value={staffBio}
                  onChange={(e) => setStaffBio(e.target.value)}
                  placeholder="Brief note about the specialist's training and styling philosophy..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setEditingStaffMember(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStaffMember ? 'Update Staff Member' : 'Add to Salon Team'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Messaging Modal */}
      <AdminSmsEmailHubModal
        isOpen={showSmsHubModal}
        onClose={() => setShowSmsHubModal(false)}
        initialAppointment={selectedAppForMessaging}
      />

      {/* DELETE STAFF CONFIRMATION MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-zinc-100">Remove Staff Specialist?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-zinc-200">{staffToDelete.name}</span> ({staffToDelete.role}) from the active salon staff roster?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = staffToDelete.name;
                  deleteStaffMember(staffToDelete.id);
                  setStaffToDelete(null);
                  setActionFeedbackToast(`Removed ${name} from salon staff roster.`);
                  setTimeout(() => setActionFeedbackToast(null), 3000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE INQUIRY CONFIRMATION MODAL */}
      {inquiryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-zinc-100">Delete Reported Enquiry?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will permanently delete this client enquiry record from your dashboard database.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteInquiry(inquiryToDelete);
                  setInquiryToDelete(null);
                  setActionFeedbackToast('Enquiry record deleted successfully.');
                  setTimeout(() => setActionFeedbackToast(null), 3000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE APPOINTMENT CONFIRMATION MODAL */}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-bold text-zinc-100">Delete Appointment Record?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to permanently delete booking <span className="font-mono font-bold text-amber-400">#{appointmentToDelete.bookingRef}</span> for <span className="font-bold text-zinc-200">{appointmentToDelete.clientName}</span>?
              </p>
              <p className="text-[11px] text-zinc-500 pt-1">
                {appointmentToDelete.serviceName} • {appointmentToDelete.date} at {appointmentToDelete.timeSlot}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const ref = appointmentToDelete.bookingRef;
                  deleteAppointment(appointmentToDelete.id);
                  setAppointmentToDelete(null);
                  setActionFeedbackToast(`Appointment #${ref} was permanently deleted.`);
                  setTimeout(() => setActionFeedbackToast(null), 3500);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RECEIPT PREVIEW MODAL */}
      {receiptAppointment && (
        <ReceiptModal
          isOpen={!!receiptAppointment}
          onClose={() => setReceiptAppointment(null)}
          appointment={receiptAppointment}
        />
      )}

      {/* ADMIN WHATSAPP OFFER BROADCAST MODAL */}
      <AdminOfferBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        offer={broadcastOffer}
        broadcastResult={broadcastResult}
        onBroadcastResultUpdated={(updated) => {
          setBroadcastResult(updated);
          fetchBroadcastLogs();
        }}
        onShowToast={(msg) => {
          setActionFeedbackToast(msg);
          setTimeout(() => setActionFeedbackToast(null), 4500);
        }}
      />

      {/* ADMIN PAYMENT SCREENSHOT PREVIEW MODAL */}
      {viewingScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Client PhonePe / UPI Payment Receipt Screenshot</span>
              </h4>
              <button
                type="button"
                onClick={() => setViewingScreenshotUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center bg-black/50 rounded-2xl p-2.5 max-h-[68vh] overflow-auto border border-zinc-800">
              <img
                src={viewingScreenshotUrl}
                alt="Client Payment Receipt"
                className="max-h-[62vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <a
                href={viewingScreenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 hover:underline font-bold"
              >
                Open Original Image ↗
              </a>
              <button
                type="button"
                onClick={() => setViewingScreenshotUrl(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPCOMING APPOINTMENTS NOTIFICATION MODAL */}
      {showUpcomingAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-purple-200 dark:border-zinc-800 bg-purple-50/70 dark:bg-zinc-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-amber-500/20 text-purple-700 dark:text-amber-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Upcoming Appointments</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950">
                      {upcomingCount} Scheduled
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">Chronologically sorted upcoming client bookings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpcomingAppointmentsModal(false);
                    setAppointmentFilter('upcoming');
                    setAdminTab('appointments');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-transparent text-purple-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpcomingAppointmentsModal(false);
                    openBookingModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpcomingAppointmentsModal(false)}
                  className="p-1.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-zinc-800 cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {upcomingAppointments.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">No upcoming appointments scheduled.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpcomingAppointmentsModal(false);
                      openBookingModal();
                    }}
                    className="text-xs text-purple-700 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    + Schedule an appointment now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingAppointments.map(app => {
                    const cleanPhone = (app.clientPhone || '').replace(/\D/g, '');
                    const whatsappDirectUrl = app.whatsappUrl || `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${app.clientName}, your appointment at Modern Salon Mohol for ${app.serviceName} is scheduled for ${app.date} at ${app.timeSlot}. Ref: ${app.bookingRef}. We look forward to welcoming you!`)}`;

                    return (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-zinc-950/80 border border-purple-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-zinc-700 transition space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{app.clientName}</span>
                              <span className="font-mono text-[10px] text-purple-700 dark:text-amber-400 bg-purple-100 dark:bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
                                {app.bookingRef}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                              {app.serviceName} {app.stylistName ? `• Stylist: ${app.stylistName}` : ''}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                            {getAppStatus(app)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-purple-200/70 dark:border-zinc-800/80">
                          <span className="font-medium text-purple-700 dark:text-amber-300">
                            📅 {app.date} • ⏰ {app.timeSlot}
                          </span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                            ₹{app.advancePaid} Deposit (Paid)
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 flex-wrap">
                          <a
                            href={whatsappDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 transition"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                          <div className="flex items-center gap-1 flex-wrap">
                            {app.paymentScreenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingScreenshotUrl(app.paymentScreenshotUrl!)}
                                className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="View Payment Receipt Screenshot uploaded by client"
                              >
                                <ImageIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>Screenshot</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setReceiptAppointment(app)}
                              className="px-2 py-1 rounded-lg bg-white hover:bg-purple-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-purple-200 dark:border-transparent text-zinc-800 dark:text-zinc-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="View & Print Receipt"
                            >
                              <Receipt className="w-3 h-3 text-purple-600 dark:text-amber-400" />
                              <span>Receipt</span>
                            </button>
                            {getAppStatus(app) !== 'COMPLETED' ? (
                              <button
                                type="button"
                                onClick={() => handleCompleteAppointment(app)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Mark as completed upon salon visit"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReopenAppointment(app)}
                                className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 text-[11px] font-semibold transition cursor-pointer"
                                title="Reopen booking"
                              >
                                Reopen
                              </button>
                            )}
                            {getAppStatus(app) !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(app)}
                                className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 text-[11px] transition cursor-pointer"
                                title="Cancel appointment"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAppointmentToDelete(app)}
                              className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/15 dark:hover:bg-rose-600/25 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Delete appointment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {actionFeedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-amber-500/40 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedbackToast}</span>
        </div>
      )}
    </div>
  );
};
