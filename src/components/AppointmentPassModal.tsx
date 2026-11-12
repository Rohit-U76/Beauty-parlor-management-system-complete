import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ShieldCheck,
  Download,
  Share2,
  Sparkles,
  Printer,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { Appointment } from '../types';
import {
  getAppointmentReminderInfo,
  generateGoogleCalendarUrl
} from '../utils/appointmentReminderUtils';
import { useSalon } from '../context/SalonContext';
import { printSalonReceipt, downloadReceiptFile } from '../utils/receiptPrinter';

interface AppointmentPassModalProps {
  appointment: Appointment | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const AppointmentPassModal: React.FC<AppointmentPassModalProps> = ({
  appointment,
  isOpen = true,
  onClose
}) => {
  const { settings } = useSalon();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const reminderInfo = getAppointmentReminderInfo(appointment);
  const googleCalUrl = generateGoogleCalendarUrl(appointment, settings.address);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(appointment.bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    const text = `Modern Unisex Salon Mohol Appointment Confirmed!\nBooking Ref: ${appointment.bookingRef}\nService: ${appointment.serviceName}\nDate & Time: ${appointment.date} at ${appointment.timeSlot}\nStylist: ${appointment.stylistName}\nVenue: ${settings.address || 'B.N. Gund Complex, Near ICICI Bank, Mohol - 413213'}`;
    if (navigator.share) {
      navigator.share({
        title: 'Modern Unisex Salon Booking Pass',
        text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Booking pass details copied to clipboard!');
    }
  };

  // Direct WhatsApp Dispatch
  const handleSendWhatsApp = () => {
    const cleanPhone = (appointment.clientPhone || '').replace(/[^0-9]/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `🌟 *MODERN UNISEX SALON APPOINTMENT CONFIRMED* 🌟\n\n📌 *Booking Ref:* ${appointment.bookingRef}\n👤 *Client:* ${appointment.clientName}\n💇 *Service:* ${appointment.serviceName}\n📅 *Date:* ${appointment.date}\n⏰ *Time Slot:* ${appointment.timeSlot}\n✂️ *Stylist:* ${appointment.stylistName}\n\n💳 *10% Advance Paid:* ₹${appointment.advancePaid} (Confirmed)\n💰 *Remaining at Salon:* ₹${appointment.balanceDue}\n📍 *Address:* ${settings.address || 'B.N. Gund Complex, Near ICICI Bank, Mohol'}\n\nPlease present this booking pass reference upon arrival. Thank you!`;
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative max-w-lg w-full bg-[#141418] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 text-left animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#0e0e11] p-5 sm:p-6 border-b border-zinc-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>DIGITAL SMART SALON PASS</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
              Appointment Boarding Pass
            </h3>
            <p className="text-xs text-zinc-400">
              Modern Unisex Salon • 10% Advance Deposit Verified
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pass Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Booking Ref & 24h Countdown Alert Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0e0e11] border border-purple-500/30">
            <div>
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Booking Reference
              </div>
              <div className="font-mono text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{appointment.bookingRef}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-purple-400 text-xs transition-colors"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{reminderInfo.timeLabel}</span>
            </div>
          </div>

          {/* Verified Reservation Pass Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-purple-950/40 via-[#13101d] to-[#0e0e11] p-4 rounded-2xl border border-purple-500/30">
            <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 shrink-0 flex flex-col items-center justify-center text-center w-24 h-24">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
              <span className="text-[10px] font-mono font-bold text-white">10% DEPOSIT</span>
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">CONFIRMED</span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Salon Booking Pass</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Provide your booking reference <strong className="text-white">#{appointment.bookingRef}</strong> or phone number at salon reception for express priority booth entry.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={handleSendWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp Pass</span>
                </button>
              </div>
            </div>
          </div>

          {/* Core Service & Stylist Info */}
          <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Treatment / Service
                </div>
                <h4 className="font-serif text-lg font-bold text-zinc-100">
                  {appointment.serviceName}
                </h4>
                <div className="text-xs text-zinc-400">{appointment.category}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmed</span>
              </span>
            </div>

            {/* Grid of Key Details */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Appointment Date:</span>
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>{reminderInfo.formattedDateStr}</span>
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Time Slot:</span>
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{appointment.timeSlot}</span>
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Assigned Specialist:</span>
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{appointment.stylistName}</span>
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Client Name:</span>
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{appointment.clientName}</span>
                </span>
              </div>
            </div>

            {/* Payment & Deposit Breakdown */}
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">10% Advance Deposit</div>
                <div className="font-mono font-bold text-sm text-emerald-400">₹{appointment.advancePaid} (Paid)</div>
              </div>

              <div className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-2.5">
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Remaining at Salon</div>
                <div className="font-mono font-bold text-sm text-zinc-100">₹{appointment.balanceDue}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Calendar */}
          <div className="pt-1">
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Add to Google Calendar</span>
            </a>
          </div>

          {/* Quick Share / Print / Close footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => printSalonReceipt(appointment)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5 text-purple-400" />
                <span>Print</span>
              </button>

              <button
                onClick={() => downloadReceiptFile(appointment)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                title="Save Receipt as HTML/PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>PDF Pass</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
