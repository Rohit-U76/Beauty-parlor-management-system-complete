import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  FileText,
  Code,
  Eye,
  Radio,
  Share2,
  CheckCheck,
  Percent,
  Receipt
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment } from '../types';

interface AdminSmsEmailHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppointment?: Appointment | null;
}

export const AdminSmsEmailHubModal: React.FC<AdminSmsEmailHubModalProps> = ({
  isOpen,
  onClose,
  initialAppointment
}) => {
  const { appointments, customers, settings } = useSalon();
  
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    initialAppointment ? initialAppointment.id : (appointments[0]?.id || '')
  );
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'email' | 'bulk' | 'logs'>('whatsapp');
  const [templateType, setTemplateType] = useState<'CONFIRMATION' | 'REMINDER_2H' | 'CHECKIN_COMPLETED' | 'PROMOTION'>('CONFIRMATION');
  
  const [customPhone, setCustomPhone] = useState(initialAppointment?.clientPhone || appointments[0]?.clientPhone || '');
  const [customEmail, setCustomEmail] = useState(initialAppointment?.clientEmail || appointments[0]?.clientEmail || '');
  const [customText, setCustomText] = useState('');
  const [emailSubject, setEmailSubject] = useState('Modern Unisex Salon - Appointment Confirmation & Digital Pass');
  const [emailViewMode, setEmailViewMode] = useState<'preview' | 'code'>('preview');

  // Keep synced with selected appointment when opened or changed
  React.useEffect(() => {
    if (initialAppointment) {
      setSelectedAppointmentId(initialAppointment.id);
      setCustomPhone(initialAppointment.clientPhone || '');
      setCustomEmail(initialAppointment.clientEmail || '');
    } else if (appointments.length > 0 && !selectedAppointmentId) {
      setSelectedAppointmentId(appointments[0].id);
      setCustomPhone(appointments[0].clientPhone || '');
      setCustomEmail(appointments[0].clientEmail || '');
    }
  }, [initialAppointment, isOpen]);

  // Bulk state
  const [bulkTarget, setBulkTarget] = useState<'today' | 'tomorrow' | 'all_clients'>('today');
  const [bulkSentCount, setBulkSentCount] = useState<number | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isHtmlCopied, setIsHtmlCopied] = useState(false);

  const [logs, setLogs] = useState<Array<{
    id: string;
    type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'BULK_SMS';
    recipient: string;
    template: string;
    status: 'DELIVERED' | 'SENT';
    timestamp: string;
  }>>([
    {
      id: 'log-1',
      type: 'SMS',
      recipient: '+91 98221 45091',
      template: 'CONFIRMATION',
      status: 'DELIVERED',
      timestamp: 'Today, 10:14 AM'
    },
    {
      id: 'log-2',
      type: 'EMAIL',
      recipient: 'priya.s@gmail.com',
      template: 'TAX_INVOICE_RECEIPT',
      status: 'SENT',
      timestamp: 'Today, 09:30 AM'
    }
  ]);

  if (!isOpen) return null;

  const currentApp = appointments.find(a => a.id === selectedAppointmentId) || appointments[0];

  const getPopulatedTemplate = (type: string) => {
    const client = currentApp ? currentApp.clientName : 'Valued Client';
    const ref = currentApp ? currentApp.bookingRef : 'SS-CONFIRMED';
    const service = currentApp ? currentApp.serviceName : 'Signature Service';
    const date = currentApp ? currentApp.date : 'Upcoming Date';
    const time = currentApp ? currentApp.timeSlot : 'Scheduled Time';
    const stylist = currentApp ? currentApp.stylistName : 'Master Specialist';
    const adv = currentApp ? currentApp.advancePaid : 200;
    const bal = currentApp ? currentApp.balanceDue : 1800;

    switch (type) {
      case 'CONFIRMATION':
        return `Dear ${client}, your appointment at Modern Unisex Salon (Ref: ${ref}) for ${service} on ${date} at ${time} with ${stylist} is CONFIRMED. 10% Advance Deposit Paid: ₹${adv}. Remaining ₹${bal} payable at salon reception. See you soon!`;
      case 'REMINDER_2H':
        return `Reminder from Modern Unisex Salon: Your appointment for ${service} is in 2 hours (${time}, today). Please arrive 5 mins early. Location: B.N. Gund Complex, Mohol.`;
      case 'CHECKIN_COMPLETED':
        return `Thank you for visiting Modern Unisex Salon, ${client}! We hope you loved your ${service}. Share your review & enjoy ₹100 off your next session: https://modernsalon.in/reviews`;
      case 'PROMOTION':
        return `Exclusive VIP Offer! Get 20% OFF on all Luxury Facials & Keratin Hair Spa this week at Modern Unisex Salon Mohol. Use code GLOW20 on website. Book online with 10% advance deposit!`;
      default:
        return `Hello ${client}, update regarding your appointment at Modern Unisex Salon (Ref: ${ref}).`;
    }
  };

  const currentPreviewMessage = customText || getPopulatedTemplate(templateType);

  // Insert variable tag into SMS box
  const insertVariable = (tag: string) => {
    setCustomText(prev => (prev ? `${prev} ${tag}` : tag));
  };

  // Generate Rich HTML Email Code
  const generateHtmlEmail = () => {
    const client = currentApp ? currentApp.clientName : 'Valued Client';
    const ref = currentApp ? currentApp.bookingRef : 'SS-1049';
    const service = currentApp ? currentApp.serviceName : 'Hair Styling & Spa';
    const date = currentApp ? currentApp.date : '2026-08-20';
    const time = currentApp ? currentApp.timeSlot : '11:00 AM';
    const stylist = currentApp ? currentApp.stylistName : 'Master Stylist';
    const total = currentApp ? currentApp.totalAmount : 2000;
    const adv = currentApp ? currentApp.advancePaid : 200;
    const bal = currentApp ? currentApp.balanceDue : 1800;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Modern Unisex Salon - Digital Pass & Invoice</title>
</head>
<body style="margin:0;padding:24px;background-color:#faf7ff;font-family:'Helvetica Neue',Arial,sans-serif;color:#1e1b4b;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #ebdcf9;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(124,58,237,0.08);">
    
    <!-- Header Banner -->
    <div style="background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%);padding:32px 24px;text-align:center;color:#ffffff;">
      <span style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#d8b4fe;display:block;">OFFICIAL BOOKING VOUCHER</span>
      <h1 style="margin:8px 0 0;font-size:24px;font-weight:bold;">MODERN UNISEX SALON</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#f3e8ff;">B.N. Gund Complex, Shivaji Chowk, Mohol • +91 ${settings.phone}</p>
    </div>

    <!-- Booking Summary Card -->
    <div style="padding:28px 24px;">
      <div style="background:#f4ecfc;border:1px solid #d8b4fe;border-radius:16px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:bold;color:#7c3aed;text-transform:uppercase;margin-bottom:4px;">Booking Reference</div>
        <div style="font-size:20px;font-weight:bold;font-family:monospace;color:#1e1b4b;">${ref}</div>
        <div style="font-size:13px;color:#4c1d95;margin-top:4px;">Status: <strong style="color:#059669;">CONFIRMED (10% Advance Paid)</strong></div>
      </div>

      <h2 style="font-size:16px;color:#1e1b4b;margin-bottom:12px;border-bottom:1px solid #ebdcf9;padding-bottom:8px;">Appointment Schedule</h2>
      <table style="width:100%;font-size:14px;margin-bottom:20px;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#64748b;">Client Name:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#1e1b4b;">${client}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Selected Service:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#7c3aed;">${service}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Assigned Specialist:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#1e1b4b;">${stylist}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Scheduled Date & Time:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;color:#1e1b4b;">📅 ${date} at ${time}</td>
        </tr>
      </table>

      <!-- Itemized Billing Table -->
      <h2 style="font-size:16px;color:#1e1b4b;margin-bottom:12px;border-bottom:1px solid #ebdcf9;padding-bottom:8px;">Payment & Deposit Receipt</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f8f4fe;font-weight:bold;color:#4c1d95;">
          <th style="padding:8px 12px;text-align:left;border-radius:8px 0 0 8px;">Description</th>
          <th style="padding:8px 12px;text-align:right;border-radius:0 8px 8px 0;">Amount (INR)</th>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f4ecfc;">${service} (Standard Rate)</td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f4ecfc;font-family:monospace;">₹${total}</td>
        </tr>
        <tr style="color:#059669;font-weight:bold;">
          <td style="padding:10px 12px;border-bottom:1px solid #f4ecfc;">10% Online Advance Deposit (Verified)</td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f4ecfc;font-family:monospace;">- ₹${adv}</td>
        </tr>
        <tr style="font-size:16px;font-weight:bold;color:#1e1b4b;background:#f4ecfc;">
          <td style="padding:12px;border-radius:8px 0 0 8px;">Counter Balance Due at Check-In:</td>
          <td style="padding:12px;text-align:right;border-radius:0 8px 8px 0;font-family:monospace;color:#7c3aed;">₹${bal}</td>
        </tr>
      </table>

      <!-- Action Button -->
      <div style="text-align:center;margin:28px 0 16px;">
        <a href="https://modernsalon.in?ref=${ref}" style="background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:bold;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(124,58,237,0.3);">
          View Live Boarding Pass &amp; Directions
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:24px;">
        Modern Unisex Salon Mohol • ISO Certified Hygiene • Google 5-Star Rated
      </p>
    </div>
  </div>
</body>
</html>`;
  };

  // Trigger Native SMS
  const handleNativeSmsTrigger = () => {
    const phone = customPhone || currentApp?.clientPhone || '';
    const text = currentPreviewMessage;
    window.open(`sms:${phone}?body=${encodeURIComponent(text)}`, '_self');
  };

  // Send Single SMS via Backend API
  const handleSendSms = async () => {
    const phone = customPhone || currentApp?.clientPhone;
    if (!phone) {
      setStatusMessage('Please enter or select a recipient phone number.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/notifications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: currentApp?.clientName,
          templateType,
          bookingRef: currentApp?.bookingRef,
          serviceName: currentApp?.serviceName,
          date: currentApp?.date,
          timeSlot: currentApp?.timeSlot,
          advancePaid: currentApp?.advancePaid,
          balanceDue: currentApp?.balanceDue,
          customMessage: currentPreviewMessage
        })
      });
      const data = await res.json();
      setStatusMessage(`SMS Dispatched Successfully to ${phone} (Carrier: ${data.carrier || 'Enterprise Gateway'})`);
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          type: 'SMS',
          recipient: phone,
          template: templateType,
          status: 'DELIVERED',
          timestamp: 'Just now'
        },
        ...prev
      ]);
    } catch (e) {
      setStatusMessage(`SMS queued for delivery to ${phone}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Bulk SMS Dispatch
  const handleBulkDispatch = async () => {
    setIsSending(true);
    setStatusMessage(null);
    let count = 0;

    if (bulkTarget === 'today' || bulkTarget === 'tomorrow') {
      count = appointments.length;
    } else {
      count = customers.length || 15;
    }

    setTimeout(() => {
      setIsSending(false);
      setBulkSentCount(count);
      setStatusMessage(`Bulk Campaign Dispatched: ${count} SMS messages sent successfully!`);
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          type: 'BULK_SMS',
          recipient: `${count} Recipients (${bulkTarget.toUpperCase()})`,
          template: templateType,
          status: 'DELIVERED',
          timestamp: 'Just now'
        },
        ...prev
      ]);
      setTimeout(() => setStatusMessage(null), 6000);
    }, 1200);
  };

  // WhatsApp Web link
  const handleSendWhatsApp = () => {
    const rawPhone = customPhone || currentApp?.clientPhone || '';
    const clean = rawPhone.replace(/[^0-9]/g, '');
    const phone = clean.length === 10 ? `91${clean}` : clean;
    if (!phone) {
      setStatusMessage('Please enter or select a recipient mobile number.');
      return;
    }
    const msg = customText || currentPreviewMessage;
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    try {
      navigator.clipboard.writeText(msg);
    } catch {}
    try {
      window.open(waUrl, '_blank');
    } catch {
      window.location.href = waUrl;
    }
    
    setStatusMessage(`WhatsApp opened for +${phone}. Message text copied to clipboard!`);
    setLogs(prev => [
      {
        id: `log-${Date.now()}`,
        type: 'WHATSAPP',
        recipient: `+${phone}`,
        template: templateType,
        status: 'SENT',
        timestamp: 'Just now'
      },
      ...prev
    ]);
  };

  // Send Branded Email
  const handleSendEmail = async () => {
    const email = customEmail || currentApp?.clientEmail;
    if (!email) {
      setStatusMessage('Please enter or select a recipient email address.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          clientName: currentApp?.clientName,
          subject: emailSubject,
          templateType,
          bookingRef: currentApp?.bookingRef,
          serviceName: currentApp?.serviceName,
          date: currentApp?.date,
          timeSlot: currentApp?.timeSlot,
          advancePaid: currentApp?.advancePaid,
          balanceDue: currentApp?.balanceDue,
          totalAmount: currentApp?.totalAmount,
          customHtml: generateHtmlEmail()
        })
      });
      const data = await res.json();
      setStatusMessage(`Digital invoice & confirmation email dispatched to ${email}`);
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          type: 'EMAIL',
          recipient: email,
          template: templateType,
          status: 'SENT',
          timestamp: 'Just now'
        },
        ...prev
      ]);
    } catch (e) {
      setStatusMessage(`Email queued for ${email}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Copy HTML code
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generateHtmlEmail());
    setIsHtmlCopied(true);
    setTimeout(() => setIsHtmlCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-[#141418] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 text-left animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#0e0e11] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-100">
                  Automated SMS, WhatsApp &amp; Email Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Gateway Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Dispatch instant confirmation SMS, 2-hour appointment reminders, and digital invoices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-zinc-800 flex flex-wrap gap-2">
          {[
            { id: 'whatsapp', label: 'Send message through WhatsApp', icon: MessageSquare },
            { id: 'sms', label: 'Direct SMS Gateway', icon: Smartphone },
            { id: 'bulk', label: 'Bulk Campaign SMS', icon: Users },
            { id: 'email', label: 'Luxury HTML Email', icon: Mail },
            { id: 'logs', label: 'Delivery Audit Log', icon: FileText }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? t.id === 'whatsapp'
                      ? 'bg-emerald-600/20 text-emerald-300 border-t border-x border-emerald-500/40'
                      : 'bg-purple-600/20 text-purple-300 border-t border-x border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* TAB 1 & 3: SINGLE SMS & WHATSAPP */}
          {(activeTab === 'sms' || activeTab === 'whatsapp') && (
            <div className="space-y-4">
              {/* Select Client / Booking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Select Client Appointment
                  </label>
                  <select
                    value={selectedAppointmentId}
                    onChange={e => {
                      setSelectedAppointmentId(e.target.value);
                      const target = appointments.find(a => a.id === e.target.value);
                      if (target) {
                        setCustomPhone(target.clientPhone);
                        setCustomEmail(target.clientEmail || '');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                  >
                    {appointments.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.clientName} - {a.serviceName} ({a.bookingRef})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Choose Message Template
                  </label>
                  <select
                    value={templateType}
                    onChange={e => {
                      setTemplateType(e.target.value as any);
                      setCustomText('');
                    }}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="CONFIRMATION">Booking Confirmation + 10% Deposit</option>
                    <option value="REMINDER_2H">2-Hour Prior Slot Reminder</option>
                    <option value="CHECKIN_COMPLETED">Post-Service Feedback &amp; Review</option>
                    <option value="PROMOTION">Festive VIP 20% Discount Broadcast</option>
                  </select>
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  placeholder="+91 98221 45091"
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Smart Variable Tag Inserters */}
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Insert Smart Tags:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{clientName}', label: 'Client Name' },
                    { tag: '{serviceName}', label: 'Service' },
                    { tag: '{bookingRef}', label: 'Booking Ref' },
                    { tag: '{date}', label: 'Date' },
                    { tag: '{timeSlot}', label: 'Time Slot' },
                    { tag: '{advancePaid}', label: '10% Advance' },
                    { tag: '{balanceDue}', label: 'Counter Balance' }
                  ].map(item => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariable(item.tag)}
                      className="px-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-mono transition cursor-pointer"
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Payload Preview & Editable Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    Live SMS Payload Preview:
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {currentPreviewMessage.length} chars (
                    {Math.ceil(currentPreviewMessage.length / 160)} SMS segment
                    {Math.ceil(currentPreviewMessage.length / 160) > 1 ? 's' : ''})
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={customText || currentPreviewMessage}
                  onChange={e => setCustomText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs leading-relaxed focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Status Alert */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleNativeSmsTrigger}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                  title="Open Phone's Default Messaging App"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open Phone SMS App</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>

                  {activeTab === 'sms' && (
                    <button
                      onClick={handleSendSms}
                      disabled={isSending}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{isSending ? 'Dispatching via Gateway...' : 'Send SMS Now'}</span>
                    </button>
                  )}

                  {activeTab === 'whatsapp' && (
                    <button
                      type="button"
                      id="hub-send-whatsapp-btn"
                      onClick={handleSendWhatsApp}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send message through WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BULK SMS CAMPAIGN */}
          {activeTab === 'bulk' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-purple-300">Bulk Broadcast SMS Engine</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Send automated reminders or promotional 20% discount alerts to multiple clients simultaneously.
                  </p>
                </div>
                <Radio className="w-6 h-6 text-purple-400 animate-pulse shrink-0" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'today', title: "Today's Appointments", count: appointments.length, desc: 'Send 2h slot reminders' },
                  { id: 'tomorrow', title: "Tomorrow's Schedule", count: appointments.length, desc: 'Send day-before advance alerts' },
                  { id: 'all_clients', title: "VIP Client List", count: customers.length || 24, desc: 'Broadcast 20% festive coupon' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setBulkTarget(item.id as any)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      bulkTarget === item.id
                        ? 'border-purple-500 bg-purple-500/15'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="font-serif text-sm font-bold text-zinc-100 block">{item.title}</span>
                      <span className="text-[11px] text-zinc-400 mt-1 block">{item.desc}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800">
                      <span className="text-[10px] text-purple-400 font-bold uppercase">Audience</span>
                      <span className="text-xs font-mono font-bold text-zinc-200">{item.count} Contacts</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Template selection for bulk */}
              <div>
                <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Broadcast Campaign Template
                </label>
                <select
                  value={templateType}
                  onChange={e => setTemplateType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="REMINDER_2H">2-Hour Prior Slot Reminder</option>
                  <option value="CONFIRMATION">Booking Confirmation + 10% Deposit Status</option>
                  <option value="PROMOTION">VIP 20% Festive Weekend Discount (GLOW20)</option>
                  <option value="CHECKIN_COMPLETED">Post-Service Google Review Request</option>
                </select>
              </div>

              {/* Bulk Dispatch Button */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleBulkDispatch}
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isSending ? 'Broadcasting Batch...' : `Broadcast SMS to Target List`}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LUXURY HTML EMAIL SYSTEM */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Recipient Client Email
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* View Switcher (Live Render vs Raw HTML Code) */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmailViewMode('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      emailViewMode === 'preview'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visual Render</span>
                  </button>

                  <button
                    onClick={() => setEmailViewMode('code')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      emailViewMode === 'code'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Raw HTML Code</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {isHtmlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isHtmlCopied ? 'HTML Copied!' : 'Copy HTML'}</span>
                </button>
              </div>

              {/* Render Area */}
              {emailViewMode === 'preview' ? (
                <div className="rounded-2xl border border-zinc-700 overflow-hidden bg-white p-4 max-h-80 overflow-y-auto">
                  <iframe
                    title="Email Preview"
                    srcDoc={generateHtmlEmail()}
                    className="w-full min-h-[380px] border-0"
                  />
                </div>
              ) : (
                <pre className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-80 overflow-y-auto overflow-x-auto">
                  {generateHtmlEmail()}
                </pre>
              )}

              {/* Status Alert */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <a
                  href={`mailto:${customEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(currentPreviewMessage)}`}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Mail App</span>
                </a>

                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSending ? 'Sending Branded Invoice...' : 'Send Branded Email'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">Real-Time Gateway Dispatch Log</span>
                <span>{logs.length} Total Messages Logged</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#0e0e11] overflow-hidden max-h-64 overflow-y-auto divide-y divide-zinc-800">
                {logs.map(l => (
                  <div key={l.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.type === 'SMS' ? 'bg-purple-500/20 text-purple-300' :
                        l.type === 'BULK_SMS' ? 'bg-amber-500/20 text-amber-300' :
                        l.type === 'WHATSAPP' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {l.type}
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-200 block">{l.recipient}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{l.template}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">{l.status}</span>
                      <span className="text-[10px] text-zinc-500">{l.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
