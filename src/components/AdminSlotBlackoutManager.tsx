import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Power,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CalendarDays,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { SALON_TIME_SLOTS } from '../utils/availability';
import { BlockedSlotWindow } from '../types';

interface AdminSlotBlackoutManagerProps {
  onShowToast?: (msg: string) => void;
  variant?: 'compact_bar' | 'full_card' | 'modal';
}

export const AdminSlotBlackoutManager: React.FC<AdminSlotBlackoutManagerProps> = ({
  onShowToast,
  variant = 'full_card'
}) => {
  const {
    isOwnerOnBreakToday,
    toggleOwnerBreakToday,
    blockedWindows = [],
    addBlockedSlotWindow,
    updateBlockedSlotWindow,
    deleteBlockedSlotWindow,
    appointments
  } = useSalon();

  // Selected date helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const dayAfterStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  // UI state
  const [isManagerExpanded, setIsManagerExpanded] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form State
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [blockScope, setBlockScope] = useState<'ALL_DAY' | 'TIME_RANGE' | 'SPECIFIC_SLOTS'>('ALL_DAY');
  const [rangeStartSlot, setRangeStartSlot] = useState<string>(SALON_TIME_SLOTS[0]);
  const [rangeEndSlot, setRangeEndSlot] = useState<string>(SALON_TIME_SLOTS[SALON_TIME_SLOTS.length - 1]);
  const [chosenSpecificSlots, setChosenSpecificSlots] = useState<string[]>([SALON_TIME_SLOTS[0]]);
  const [blockTitle, setBlockTitle] = useState<string>('Owner Break / Salon Closed');
  const [blockReason, setBlockReason] = useState<string>('Owner taking a break. No appointments can be booked.');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Quick One-Click Toggle Handler
  const handleToggleTodayBreak = () => {
    const nextState = !isOwnerOnBreakToday;
    toggleOwnerBreakToday(nextState);
    showNotification(
      nextState
        ? '🔴 Owner Break Activated: All appointment slots for today are now unavailable to customers.'
        : '🟢 Salon Reopened: Today’s appointment slots are now open for customer bookings.'
    );
  };

  // Handle slot checkbox toggle for specific slots mode
  const handleToggleSpecificSlot = (slot: string) => {
    setChosenSpecificSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  // Submit new blackout rule
  const handleCreateBlockout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetDate) {
      alert('Please choose a valid date for this schedule freeze.');
      return;
    }

    if (blockScope === 'SPECIFIC_SLOTS' && chosenSpecificSlots.length === 0) {
      alert('Please select at least one time slot to block.');
      return;
    }

    const newRule: Omit<BlockedSlotWindow, 'id' | 'createdAt'> = {
      title: blockTitle.trim() || 'Owner Break',
      date: targetDate,
      allDay: blockScope === 'ALL_DAY',
      startTime: blockScope === 'TIME_RANGE' ? rangeStartSlot : undefined,
      endTime: blockScope === 'TIME_RANGE' ? rangeEndSlot : undefined,
      specificSlots: blockScope === 'SPECIFIC_SLOTS' ? chosenSpecificSlots : undefined,
      active: true,
      reason: blockReason.trim() || 'Owner taking a personal break / slots unavailable.'
    };

    addBlockedSlotWindow(newRule);
    setShowAddForm(false);
    showNotification(`✅ Appointment blackout scheduled for ${targetDate}!`);
  };

  // Toggle active status of a scheduled rule
  const handleToggleRuleActive = (rule: BlockedSlotWindow) => {
    const nextActive = !rule.active;
    updateBlockedSlotWindow(rule.id, { active: nextActive });
    showNotification(
      nextActive
        ? `Slots for ${rule.date} are now blocked.`
        : `Blackout for ${rule.date} paused. Slots are bookable again.`
    );
  };

  // Delete a rule
  const handleDeleteRule = (id: string, date: string) => {
    if (window.confirm(`Are you sure you want to remove the slot blackout for ${date}?`)) {
      deleteBlockedSlotWindow(id);
      showNotification(`Removed blackout rule for ${date}.`);
    }
  };

  // Active rules count
  const activeRules = useMemo(() => {
    return (blockedWindows || []).filter(r => r.active);
  }, [blockedWindows]);

  const isTodayBlocked = isOwnerOnBreakToday || activeRules.some(r => r.date === todayStr && r.allDay);

  return (
    <div className="rounded-3xl bg-zinc-900 border-2 border-amber-500/30 shadow-2xl overflow-hidden text-left transition-all">
      {/* Top Banner / Quick Master Controls Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-colors ${
              isTodayBlocked
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
            }`}
          >
            {isTodayBlocked ? (
              <Lock className="w-5 h-5 animate-pulse" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Owner Break &amp; Slot Availability</span>
              </h3>
              {isTodayBlocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  Today Unavailable
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Salon Open for Bookings
                </span>
              )}
              {activeRules.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activeRules.length} Blackout Window{activeRules.length > 1 ? 's' : ''} Configured
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isTodayBlocked
                ? 'Customers currently see all today’s booking slots as unavailable / owner on break.'
                : 'Customers can book available slots. Click below whenever you want to take a break or schedule off-hours.'}
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick One-Click Toggle Button (Requested by User) */}
          <button
            type="button"
            id="admin-quick-break-toggle-btn"
            onClick={handleToggleTodayBreak}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-95 ${
              isOwnerOnBreakToday
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 ring-2 ring-rose-500/40'
            }`}
            title="Instantly make all slots for today unavailable until you turn it off"
          >
            <Power className="w-4 h-4" />
            <span>
              {isOwnerOnBreakToday
                ? 'Turn Break OFF (Reopen Today)'
                : 'Take Break Today (Freeze All Slots)'}
            </span>
          </button>

          {/* Expand / Collapse Custom Day & Time Manager */}
          <button
            type="button"
            id="admin-manage-blackouts-btn"
            onClick={() => setIsManagerExpanded(!isManagerExpanded)}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>{isManagerExpanded ? 'Hide Schedule Settings' : 'Schedule Specific Day & Time Off'}</span>
            {isManagerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccess && (
        <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Expanded Scheduler & Blackout Controls */}
      {isManagerExpanded && (
        <div className="p-4 sm:p-6 space-y-6 bg-zinc-950/40">
          
          {/* Top Bar inside expansion: Subtitle & "+ Add Leave Window" button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h4 className="font-serif text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Manage Leaves, Holidays &amp; Time-Slot Blackouts</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Choose any specific day (e.g. tomorrow, next week) and either block the entire day or only specific hours (e.g. 02:00 PM to 06:00 PM).
              </p>
            </div>

            <button
              type="button"
              id="admin-add-blackout-rule-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancel Form' : 'Block Specific Date / Time'}</span>
            </button>
          </div>

          {/* Form to Add New Blackout Window */}
          {showAddForm && (
            <form
              onSubmit={handleCreateBlockout}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Configure New Slot Blackout / Owner Leave</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Real-time synced to client portal</span>
              </div>

              {/* 1. Date Selection with Quick Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Select Date for Leave / Blackout *
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDate(todayStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      targetDate === todayStr
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Today ({todayStr})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(tomorrowStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      targetDate === tomorrowStr
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Tomorrow ({tomorrowStr})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(dayAfterStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      targetDate === dayAfterStr
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Day After ({dayAfterStr})
                  </button>

                  <div className="relative flex-1 min-w-[160px]">
                    <input
                      type="date"
                      min={todayStr}
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Block Scope: All Day vs Time Range vs Specific Slots */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Select Time Scope to Make Unavailable *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                      blockScope === 'ALL_DAY'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockScope"
                      checked={blockScope === 'ALL_DAY'}
                      onChange={() => setBlockScope('ALL_DAY')}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold">Full Day Off</div>
                      <div className="text-[10px] text-zinc-400">All 10 daily slots unavailable</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                      blockScope === 'TIME_RANGE'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockScope"
                      checked={blockScope === 'TIME_RANGE'}
                      onChange={() => setBlockScope('TIME_RANGE')}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold">Specific Time Range</div>
                      <div className="text-[10px] text-zinc-400">Between start and end time</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                      blockScope === 'SPECIFIC_SLOTS'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="blockScope"
                      checked={blockScope === 'SPECIFIC_SLOTS'}
                      onChange={() => setBlockScope('SPECIFIC_SLOTS')}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold">Pick Specific Slots</div>
                      <div className="text-[10px] text-zinc-400">Select individual slot buttons</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Inputs based on Block Scope */}
              {blockScope === 'TIME_RANGE' && (
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choose Unavailable Time Range (From - To)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Start Time (From):</span>
                      <select
                        value={rangeStartSlot}
                        onChange={e => setRangeStartSlot(e.target.value)}
                        className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:border-amber-400 focus:outline-none"
                      >
                        {SALON_TIME_SLOTS.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">End Time (Until):</span>
                      <select
                        value={rangeEndSlot}
                        onChange={e => setRangeEndSlot(e.target.value)}
                        className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:border-amber-400 focus:outline-none"
                      >
                        {SALON_TIME_SLOTS.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    All appointment slots occurring between {rangeStartSlot} and {rangeEndSlot} will show as Unavailable.
                  </p>
                </div>
              )}

              {blockScope === 'SPECIFIC_SLOTS' && (
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Click the slots you want to freeze:</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {chosenSpecificSlots.length} slot(s) selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SALON_TIME_SLOTS.map(slot => {
                      const isChosen = chosenSpecificSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleSpecificSlot(slot)}
                          className={`p-2 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-between cursor-pointer ${
                            isChosen
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                          }`}
                        >
                          <span>{slot}</span>
                          {isChosen ? (
                            <span className="text-[9px] text-rose-400 font-black">LOCKED</span>
                          ) : (
                            <span className="text-[9px] text-zinc-500">Open</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Reason & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Label / Title (For Admin Reference)
                  </label>
                  <input
                    type="text"
                    value={blockTitle}
                    onChange={e => setBlockTitle(e.target.value)}
                    placeholder="e.g. Personal Break, Half-Day Off, Renovation"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Client Notification Reason
                  </label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Shown to clients if they inspect this date"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="admin-submit-blackout-rule-btn"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Apply &amp; Block Slots Now
                </button>
              </div>
            </form>
          )}

          {/* List of Configured Blackout Windows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">
                Active &amp; Scheduled Blackout Rules ({blockedWindows.length})
              </span>
              <span className="text-[11px]">
                {blockedWindows.length === 0 ? 'No future blackouts scheduled' : 'Toggle switch to pause / resume anytime'}
              </span>
            </div>

            {/* Quick Today's Status Card if Today is active */}
            {isOwnerOnBreakToday && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-rose-300">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <strong className="block font-bold">Quick Break (Active Today: {todayStr})</strong>
                    <span className="text-[11px] text-rose-400/80">
                      Master toggle is ON: All remaining slots for today are locked for customer bookings.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTodayBreak}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition cursor-pointer shrink-0"
                >
                  Reopen Today
                </button>
              </div>
            )}

            {blockedWindows.length === 0 && !isOwnerOnBreakToday ? (
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-dashed border-zinc-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <Calendar className="w-5 h-5 text-amber-400/70" />
                </div>
                <div className="text-xs font-bold text-zinc-300">All Appointment Slots Currently Open</div>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                  No date or time-slot blackout rules are active. When you need time off tomorrow or on any future date, click "Block Specific Date / Time" above to freeze appointments for that period.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockedWindows.map((rule) => {
                  const isForToday = rule.date === todayStr;
                  const isForTomorrow = rule.date === tomorrowStr;
                  const dateLabel = isForToday
                    ? `Today (${rule.date})`
                    : isForTomorrow
                    ? `Tomorrow (${rule.date})`
                    : rule.date;

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        rule.active
                          ? 'bg-zinc-900 border-zinc-700/80 shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {dateLabel}
                            </span>
                            <h5 className="font-bold text-xs text-zinc-100 mt-1">
                              {rule.title || 'Owner Break'}
                            </h5>
                          </div>

                          {/* Rule Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rule.active
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {rule.active ? 'Active (Slots Blocked)' : 'Paused (Open)'}
                          </span>
                        </div>

                        {/* Scope Description */}
                        <div className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {rule.allDay
                              ? 'Full Day Off (All 10 Slots Unavailable)'
                              : rule.specificSlots && rule.specificSlots.length > 0
                              ? `Specific Slots: ${rule.specificSlots.join(', ')}`
                              : `${rule.startTime} to ${rule.endTime}`}
                          </span>
                        </div>

                        {rule.reason && (
                          <div className="text-[10px] text-zinc-400 italic">
                            "{rule.reason}"
                          </div>
                        )}
                      </div>

                      {/* Rule Actions: Toggle Active and Delete */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleActive(rule)}
                          className={`font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs ${
                            rule.active
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {rule.active ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>Pause Blackout</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-zinc-500" />
                              <span>Reactivate Blackout</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id, rule.date)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete blackout rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

