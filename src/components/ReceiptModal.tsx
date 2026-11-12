import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  Phone,
  MapPin,
  Receipt,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Appointment } from '../types';
import { printSalonReceipt, downloadReceiptFile } from '../utils/receiptPrinter';
import { useSalon } from '../context/SalonContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  const { settings } = useSalon();
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !appointment) return null;

  const advancePaid = appointment.advancePaid || Math.round((appointment.totalAmount || 0) * ((settings?.advancePercentage || 10) / 100));
  const balanceDue = appointment.balanceDue !== undefined 
    ? appointment.balanceDue 
    : Math.max(0, (appointment.totalAmount || 0) - advancePaid);

  const cleanPhone = (appointment.clientPhone || '').replace(/\D/g, '');
  const salonPhone = settings?.phone || '8104026257';

  const receiptSummaryText = `*MODERN UNISEX SALON MOHOL - BOOKING RECEIPT*
━━━━━━━━━━━━━━━━━━━━━
Ref ID: #${appointment.bookingRef}
Client: ${appointment.clientName}
Service: ${appointment.serviceName}
Stylist: ${appointment.stylistName || 'Master Stylist'}
Date: ${appointment.date}
Time Slot: ${appointment.timeSlot}
─────────────────────
Total Bill: ₹${appointment.totalAmount}
10% Advance Paid: ₹${advancePaid} (VERIFIED ONLINE)
Counter Balance Due: ₹${balanceDue}
─────────────────────
Location: B.N. Gund Complex, Shivaji Chowk, Mohol
Salon Helpline: +91 ${salonPhone}
━━━━━━━━━━━━━━━━━━━━━`;

  const whatsappShareUrl = `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(receiptSummaryText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await printSalonReceipt(appointment);
    setTimeout(() => setIsPrinting(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative max-w-xl w-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-6 text-left">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-purple-50/70 dark:bg-zinc-950 border-b border-purple-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-amber-500/15 border border-purple-300 dark:border-amber-500/30 flex items-center justify-center text-purple-700 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Official Salon Tax Receipt</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Paid
                </span>
              </h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Booking Reference #{appointment.bookingRef}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Preview */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="bg-white text-zinc-900 p-5 sm:p-6 rounded-2xl shadow-inner border border-zinc-200 text-xs space-y-4 font-sans">
            
            {/* Salon Brand Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-zinc-300 space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-black text-purple-900 tracking-wide">
                MODERN UNISEX SALON
              </h2>
              <p className="text-[11px] text-zinc-600 font-medium">
                B.N. Gund Complex, Near Kanya Prashala &amp; ICICI Bank, Mohol, Solapur - 413213
              </p>
              <p className="text-[11px] text-zinc-600">
                Helpline &amp; WhatsApp: +91 {salonPhone} • Dinesh Ghodake (Master Stylist)
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] tracking-wider border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>10% ADVANCE ONLINE PAYMENT VERIFIED</span>
                </span>
              </div>
            </div>

            {/* Client & Booking Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px] py-1 border-b border-zinc-100">
              <div>
                <span className="text-zinc-500 block">Booking Reference:</span>
                <span className="font-mono font-bold text-purple-900 text-xs">#{appointment.bookingRef}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block">Client Name:</span>
                <span className="font-bold text-zinc-900">{appointment.clientName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Client Contact:</span>
                <span className="font-medium text-zinc-800">{appointment.clientPhone}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block">Service Assigned:</span>
                <span className="font-bold text-purple-900">{appointment.serviceName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Scheduled Date:</span>
                <span className="font-medium text-zinc-800">📅 {appointment.date}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block">Scheduled Time Slot:</span>
                <span className="font-medium text-zinc-800">⏰ {appointment.timeSlot}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Assigned Specialist:</span>
                <span className="font-medium text-zinc-800">{appointment.stylistName || 'Dinesh Ghodake'}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block">Payment Mode:</span>
                <span className="font-medium text-emerald-700 font-mono">
                  {appointment.paymentMethod || 'Online (UPI / Card)'}
                </span>
              </div>
              {(appointment.upiTransactionId || appointment.razorpayPaymentId) && (
                <div className="col-span-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] flex items-center justify-between">
                  <span className="text-emerald-800 font-medium">
                    UPI Transaction ID / UTR: <strong className="font-mono">{appointment.upiTransactionId || appointment.razorpayPaymentId}</strong>
                  </span>
                  <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {appointment.isBankVerified ? '✅ Bank Credited' : '⏳ Deposited (Under Verification)'}
                  </span>
                </div>
              )}
            </div>

            {/* Financials Box */}
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between text-zinc-700">
                <span>Total Service Price:</span>
                <span className="font-mono font-bold">₹{appointment.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>10% Online Advance Deposit (Paid):</span>
                <span className="font-mono">- ₹{advancePaid}</span>
              </div>
              <div className="pt-2 border-t border-purple-300 flex items-center justify-between text-purple-950 font-extrabold text-sm">
                <span>Counter Balance Due at Salon Desk:</span>
                <span className="font-mono text-amber-700">₹{balanceDue}</span>
              </div>
            </div>

            {/* Policy Notes */}
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-600 leading-relaxed">
              <strong>Salon Visit Guidelines:</strong>
              <br />• Your chair is reserved with zero wait time. Please arrive 10 mins before your slot.
              <br />• Remaining balance of ₹{balanceDue} is payable after service completion via Cash, UPI, or Card.
            </div>

            <div className="text-center text-[10px] text-zinc-400 pt-1">
              Thank you for choosing Modern Unisex Salon Mohol!
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-purple-50/70 dark:bg-zinc-950 border-t border-purple-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Printing...' : 'Print / Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadReceiptFile(appointment)}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-purple-200 dark:border-zinc-700 transition cursor-pointer"
              title="Download HTML file"
            >
              <Download className="w-4 h-4 text-purple-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-purple-200 dark:border-zinc-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
