import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scissors,
  RotateCw,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment } from '../types';
import { SALON_TIME_SLOTS, getSlotAvailability, isSlotAvailableForDate } from '../utils/availability';

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { rescheduleAppointment, appointments } = useSalon();

  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(SALON_TIME_SLOTS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !appointment) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Please pick a new appointment date.');
      return;
    }

    if (selectedDate < todayStr) {
      setErrorMessage('Selected date cannot be in the past.');
      return;
    }

    if (!isSlotAvailableForDate(selectedSlot, selectedDate)) {
      setErrorMessage('The selected time slot is closed for today or has already passed. Please select an open slot.');
      return;
    }

    const slotInfo = getSlotAvailability(appointments, selectedDate, selectedSlot);
    if (slotInfo.status === 'SOLD_OUT' && slotInfo.remainingSeats === 0) {
      setErrorMessage(`The ${selectedSlot} slot on ${selectedDate} is fully booked. Please select another time slot.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await rescheduleAppointment(appointment.id, selectedDate, selectedSlot);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
          if (onSuccess) onSuccess();
        }, 1800);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Unable to reschedule. Please call salon directly at 8104026257.');
    }
  };

  return (
    <div
      id="reschedule-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="reschedule-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                Reschedule Appointment
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                Ref: {appointment.bookingRef}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirmReschedule} className="p-5 sm:p-6 space-y-4">
          {/* Current Booking Summary */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{appointment.serviceName}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                ₹{appointment.advancePaid} Deposit Paid
              </span>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>Current: <strong>{appointment.date}</strong> at <strong>{appointment.timeSlot}</strong></span>
              <span>Stylist: <strong>{appointment.stylistName || 'Master Stylist'}</strong></span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* New Date Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Select New Visit Date
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* New Time Slot Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Select Preferred Time Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {SALON_TIME_SLOTS.map(slot => {
                const slotInfo = getSlotAvailability(appointments, selectedDate, slot);
                const isSoldOut = slotInfo.status === 'SOLD_OUT';
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col justify-between text-left ${
                      isSoldOut
                        ? 'opacity-40 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-transparent'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold ring-2 ring-amber-400/50 cursor-pointer'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer border border-zinc-200/50 dark:border-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono">{slot}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        isSoldOut 
                          ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400' 
                          : isSelected
                          ? 'bg-zinc-950 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isSoldOut ? slotInfo.statusLabel : `${slotInfo.remainingSeats} Seats`}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-1 font-normal ${
                      isSelected ? 'text-zinc-950/80 font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {slotInfo.urgencyText}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advance Deposit Protection Guarantee */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Reschedule Fee:</strong> Your verified 10% advance payment of ₹{appointment.advancePaid} is completely carried forward to the new date!
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-reschedule-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              <span>Confirm New Slot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
