import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  Zap,
  Info,
  Timer,
  ChevronDown
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { 
  getDayAvailabilitySummary, 
  SALON_TIME_SLOTS,
  SlotAvailabilityInfo 
} from '../utils/availability';
import { ServiceItem } from '../types';

interface RealTimeAvailabilityBannerProps {
  onQuickBookSlot?: (slot: string, date: string) => void;
  selectedFilterSlot?: string | null;
  onFilterBySlot?: (slot: string | null) => void;
}

export const RealTimeAvailabilityBanner: React.FC<RealTimeAvailabilityBannerProps> = ({
  onQuickBookSlot,
  selectedFilterSlot,
  onFilterBySlot
}) => {
  const { appointments, openBookingModal, services, blockedWindows, isOwnerOnBreakToday } = useSalon();

  // Selected date for availability inspection
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const dayAfterIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState<boolean>(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);

  // Compute live day summary
  const daySummary = useMemo(() => {
    return getDayAvailabilitySummary(appointments, selectedDate, blockedWindows, isOwnerOnBreakToday);
  }, [appointments, selectedDate, blockedWindows, isOwnerOnBreakToday]);

  const handleSlotClick = (slotInfo: SlotAvailabilityInfo) => {
    if (slotInfo.status === 'SOLD_OUT') return;
    
    if (onQuickBookSlot) {
      onQuickBookSlot(slotInfo.slot, selectedDate);
    } else {
      // Open booking modal
      openBookingModal();
    }
  };

  const fillingFastCount = daySummary.fillingFastSlots.length;
  const pendingCount = daySummary.totalPendingRequests;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-purple-50/90 via-white to-purple-50/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-black border border-purple-200 dark:border-amber-500/30 shadow-xl overflow-hidden text-left relative transition-all">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-purple-400/10 dark:bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-64 h-32 bg-purple-500/10 dark:bg-red-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-purple-100 dark:border-zinc-800/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Live Indicator Title */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                <span>Real-Time Chair &amp; Slot Availability</span>
              </span>

              {fillingFastCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  <span>{fillingFastCount} Slots Filling Fast</span>
                </span>
              )}

              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] font-mono">
                  <Zap className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span>{pendingCount} Active Booking Requests</span>
                </span>
              )}
            </div>

            <h2 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Real-Time Appointment Load &amp; Chair Capacity</span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Live schedule updated as clients place bookings. High-demand time slots are tagged with <span className="text-purple-700 dark:text-amber-400 font-bold">Filling Fast</span>.
            </p>
          </div>

          {/* Date Selector & Collapse Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-950/80 p-1.5 rounded-2xl border border-purple-200 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setSelectedDate(todayIso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedDate === todayIso
                    ? 'bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-md font-extrabold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-purple-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>

              <button
                onClick={() => setSelectedDate(tomorrowIso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedDate === tomorrowIso
                    ? 'bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-md font-extrabold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-purple-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Tomorrow</span>
              </button>

              <input
                type="date"
                min={todayIso}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700/60 rounded-xl text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setIsBannerCollapsed(prev => !prev)}
              className="px-3 py-2 rounded-2xl border border-purple-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title={isBannerCollapsed ? "Expand live availability" : "Collapse availability view"}
            >
              <span>{isBannerCollapsed ? "View Slots" : "Hide Slots"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBannerCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
          </div>
        </div>

        {/* Live Progress Bar & Quick Stats */}
        {!isBannerCollapsed && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Occupancy Rate Bar */}
            <div className="sm:col-span-2 p-3 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-purple-100 dark:border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                  <span>Chair Occupancy for {daySummary.formattedDate}:</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {daySummary.overallOccupancyPercent}% Booked ({daySummary.totalActiveBookings}/{daySummary.totalDailyCapacity} Chairs)
                </span>
              </div>
              
              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-purple-100 dark:bg-zinc-800 overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    daySummary.overallOccupancyPercent >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-red-500'
                      : daySummary.overallOccupancyPercent >= 40
                      ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(8, daySummary.overallOccupancyPercent)}%` }}
                />
              </div>

              {daySummary.peakPeriodAlert && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300/90 flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>{daySummary.peakPeriodAlert}</span>
                </div>
              )}
            </div>

            {/* Next Available Express Chair */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 dark:from-amber-500/10 to-transparent border border-purple-200 dark:border-amber-500/20 flex flex-col justify-between">
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-700 dark:text-amber-400 flex items-center gap-1">
                <Timer className="w-3 h-3 text-purple-600 dark:text-amber-400" />
                <span>Next Express Opening</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-white">
                  {daySummary.nextExpressSlot || 'Open Schedule'}
                </span>
                <button
                  onClick={() => {
                    if (daySummary.nextExpressSlot) {
                      handleSlotClick({
                        slot: daySummary.nextExpressSlot,
                        date: selectedDate,
                        totalCapacity: 3,
                        bookedCount: 0,
                        pendingCount: 0,
                        confirmedCount: 0,
                        remainingSeats: 2,
                        occupancyPercent: 33,
                        status: 'AVAILABLE',
                        isFillingFast: false,
                        statusLabel: 'Available',
                        urgencyText: 'Instant',
                        activeAppointments: []
                      });
                    }
                  }}
                  className="text-[11px] font-bold text-purple-700 dark:text-amber-400 hover:text-purple-600 dark:hover:text-amber-300 underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Book This Slot</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Real-Time Time Slot Grid */}
      {!isBannerCollapsed && (
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
              <span>Select a Time Slot to Lock with 10% Advance</span>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Filling Fast</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                <span>Full</span>
              </span>
            </div>
          </div>

          {/* Slots matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {daySummary.allSlots.map((slotInfo) => {
              const isSoldOut = slotInfo.status === 'SOLD_OUT';
              const isFast = slotInfo.isFillingFast && !isSoldOut;
              const isSelected = selectedFilterSlot === slotInfo.slot;

              return (
                <div
                  key={slotInfo.slot}
                  onClick={() => handleSlotClick(slotInfo)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[86px] group ${
                    isSoldOut
                      ? 'bg-zinc-100 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/50 opacity-60 cursor-not-allowed'
                      : isFast
                      ? 'bg-gradient-to-b from-purple-100/70 to-white dark:from-amber-500/15 dark:to-zinc-900/90 border-purple-300 dark:border-amber-500/50 hover:border-purple-400 dark:hover:border-amber-400 hover:shadow-md'
                      : 'bg-white dark:bg-zinc-950/70 border-purple-100 dark:border-zinc-800/80 hover:border-purple-300 dark:hover:border-zinc-700 hover:bg-purple-50/40 dark:hover:bg-zinc-900/80'
                  } ${isSelected ? 'ring-2 ring-purple-600 dark:ring-amber-400 border-purple-600 dark:border-amber-400' : ''}`}
                >
                  {/* Status chip top */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-amber-300 transition-colors">
                      {slotInfo.slot}
                    </span>

                    {isSoldOut ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        Full
                      </span>
                    ) : isFast ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-zinc-950 flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-2.5 h-2.5 fill-zinc-950" />
                        <span>Fast</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Open
                      </span>
                    )}
                  </div>

                  {/* Subtext info */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      {slotInfo.urgencyText}
                    </div>

                    {/* Visual Seat Indicators */}
                    <div className="flex items-center gap-1 pt-1">
                      {Array.from({ length: slotInfo.totalCapacity }).map((_, seatIdx) => {
                        const isOccupied = seatIdx < slotInfo.bookedCount;
                        const isPending = seatIdx < slotInfo.pendingCount;

                        return (
                          <div
                            key={seatIdx}
                            title={
                              isOccupied
                                ? isPending ? 'Pending booking hold' : 'Confirmed booking'
                                : 'Open chair'
                            }
                            className={`h-1.5 flex-1 rounded-full ${
                              isOccupied
                                ? isPending
                                  ? 'bg-amber-400'
                                  : 'bg-red-500'
                                : 'bg-emerald-500/50'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fast Action Prompt */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-purple-50/60 dark:bg-zinc-950/40 p-3 rounded-2xl border border-purple-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Info className="w-4 h-4 text-purple-600 dark:text-amber-400 shrink-0" />
              <span>
                Click any time slot above to instantly open the booking form with your selected slot.
              </span>
            </div>

            <button
              onClick={() => openBookingModal()}
              className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
