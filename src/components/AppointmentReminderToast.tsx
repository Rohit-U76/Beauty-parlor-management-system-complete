import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  User,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Volume2,
  VolumeX,
  Eye,
  AlertCircle,
  Play,
  RotateCcw,
  Compass,
  Move,
  GripHorizontal
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment } from '../types';
import {
  getAppointmentReminderInfo,
  generateGoogleCalendarUrl,
  playLuxuryNotificationChime,
  parseAppointmentDateTime
} from '../utils/appointmentReminderUtils';
import { AppointmentPassModal } from './AppointmentPassModal';

export const AppointmentReminderToast: React.FC = () => {
  const { appointments, settings, currentUser } = useSalon();

  // State
  const [activeToastIndex, setActiveToastIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedPassAppointment, setSelectedPassAppointment] = useState<Appointment | null>(null);
  const [manualTriggerAppointmentId, setManualTriggerAppointmentId] = useState<string | null>(null);
  const [hasPlayedChime, setHasPlayedChime] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [isSimTriggerDismissed, setIsSimTriggerDismissed] = useState<boolean>(false);

  // Draggable position state (movable popup across screen on Desktop & Mobile)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('salon_notification_pos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Drag handlers for mouse & touch
  const handleStartDrag = (clientX: number, clientY: number) => {
    if (!toastRef.current) return;
    const rect = toastRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: rect.left,
      initialY: rect.top
    };
    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button:not([data-drag-handle])') || target.closest('a') || target.closest('input')) return;
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button:not([data-drag-handle])') || target.closest('a') || target.closest('input')) return;
    if (e.touches[0]) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const elemWidth = toastRef.current?.offsetWidth || 320;
      const elemHeight = toastRef.current?.offsetHeight || 80;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(8, Math.min(window.innerWidth - elemWidth - 8, dragRef.current.initialX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - elemHeight - 8, dragRef.current.initialY + deltaY));

      const newPos = { x: newX, y: newY };
      setPosition(newPos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || !e.touches[0]) return;
      if (e.cancelable) {
        e.preventDefault(); // Stop mobile screen scrolling while dragging popup
      }
      const elemWidth = toastRef.current?.offsetWidth || 320;
      const elemHeight = toastRef.current?.offsetHeight || 80;
      const deltaX = e.touches[0].clientX - dragRef.current.startX;
      const deltaY = e.touches[0].clientY - dragRef.current.startY;

      const newX = Math.max(8, Math.min(window.innerWidth - elemWidth - 8, dragRef.current.initialX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - elemHeight - 8, dragRef.current.initialY + deltaY));

      const newPos = { x: newX, y: newY };
      setPosition(newPos);
    };

    const handleEndDrag = () => {
      setIsDragging(false);
      dragRef.current = null;
      if (position) {
        try {
          localStorage.setItem('salon_notification_pos', JSON.stringify(position));
        } catch (e) {}
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEndDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEndDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [isDragging, position]);

  const handleResetPosition = () => {
    setPosition(null);
    try {
      localStorage.removeItem('salon_notification_pos');
    } catch (e) {}
  };

  // Periodically update reference time every 30s so reminders dynamically stay accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Find all upcoming appointments for the active user (today, tomorrow, or future dates)
  const upcomingReminders = useMemo(() => {
    const list = currentUser?.role === 'ADMIN'
      ? appointments
      : appointments.filter(apt => {
          if (!currentUser) return false;
          if (apt.userId) return apt.userId === currentUser.id;
          const userPhoneClean = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
          const userEmailClean = (currentUser.email || '').trim().toLowerCase();
          const userNameClean = (currentUser.name || '').trim().toLowerCase();
          if (userPhoneClean && userPhoneClean.length === 10) {
            const aptPhoneClean = (apt.clientPhone || '').replace(/\D/g, '').slice(-10);
            const aptEmailClean = (apt.clientEmail || '').trim().toLowerCase();
            const aptNameClean = (apt.clientName || '').trim().toLowerCase();
            if (aptPhoneClean === userPhoneClean) {
              if (aptEmailClean && userEmailClean && aptEmailClean === userEmailClean) return true;
              if (aptNameClean && userNameClean && aptNameClean === userNameClean) return true;
            }
          }
          return false;
        });

    const filtered = list.filter(apt => {
      if (manualTriggerAppointmentId && apt.id === manualTriggerAppointmentId) {
        return true;
      }
      const info = getAppointmentReminderInfo(apt, currentTime);
      // Include only genuinely upcoming appointments (not passed ones)
      return info.isUpcoming;
    });

    // Sort chronologically by appointment date and time
    return filtered.sort((a, b) => {
      const timeA = parseAppointmentDateTime(a.date, a.timeSlot).getTime();
      const timeB = parseAppointmentDateTime(b.date, b.timeSlot).getTime();
      return timeA - timeB;
    });
  }, [appointments, currentUser, manualTriggerAppointmentId, currentTime]);

  // Keep activeToastIndex safely within bounds
  useEffect(() => {
    if (upcomingReminders.length > 0 && activeToastIndex >= upcomingReminders.length) {
      setActiveToastIndex(0);
    }
  }, [upcomingReminders.length, activeToastIndex]);

  // Auto-switch focus to newly booked appointment
  const prevAptCountRef = React.useRef(appointments.length);
  useEffect(() => {
    if (appointments.length > prevAptCountRef.current) {
      const newestApt = appointments[0];
      if (newestApt) {
        const foundIdx = upcomingReminders.findIndex(a => a.id === newestApt.id);
        if (foundIdx !== -1) {
          setActiveToastIndex(foundIdx);
          setIsDismissed(false);
          setSnoozeUntil(null);
        }
      }
    }
    prevAptCountRef.current = appointments.length;
  }, [appointments, upcomingReminders]);

  // Active appointment to show in the toast
  const activeAppointment: Appointment | undefined =
    upcomingReminders[activeToastIndex] || upcomingReminders[0];

  const reminderInfo = useMemo(() => {
    if (!activeAppointment) return null;
    return getAppointmentReminderInfo(activeAppointment, currentTime);
  }, [activeAppointment, currentTime]);

  // Check snooze state
  const isSnoozed = snoozeUntil !== null && Date.now() < snoozeUntil;

  // Sound chime effect when reminder triggers
  useEffect(() => {
    if (upcomingReminders.length > 0 && !isDismissed && !isSnoozed && soundEnabled && !hasPlayedChime) {
      // Gentle chime on load / trigger
      const timer = setTimeout(() => {
        playLuxuryNotificationChime();
        setHasPlayedChime(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [upcomingReminders.length, isDismissed, isSnoozed, soundEnabled, hasPlayedChime]);

  // Reset dismissed state if manual trigger is clicked
  const handleTestReminder = (aptId?: string) => {
    setIsDismissed(false);
    setSnoozeUntil(null);
    setIsCollapsed(false);
    if (aptId) {
      setManualTriggerAppointmentId(aptId);
      const idx = appointments.findIndex(a => a.id === aptId);
      if (idx !== -1) setActiveToastIndex(0);
    } else if (appointments.length > 0) {
      // Pick first appointment
      setManualTriggerAppointmentId(appointments[0].id);
      setActiveToastIndex(0);
    }
    if (soundEnabled) {
      playLuxuryNotificationChime();
    }
  };

  const handleSnooze = (minutes = 60) => {
    const expireTime = Date.now() + minutes * 60 * 1000;
    setSnoozeUntil(expireTime);
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (upcomingReminders.length === 0 || !activeAppointment || !reminderInfo) {
    if (isSimTriggerDismissed) {
      return (
        <AppointmentPassModal
          appointment={selectedPassAppointment}
          isOpen={!!selectedPassAppointment}
          onClose={() => setSelectedPassAppointment(null)}
        />
      );
    }

    return (
      <>
        {/* Floating Movable Mini Simulator Trigger for Demo / Evaluation (Movable on Desktop & Mobile) */}
        <div
          ref={toastRef}
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            position: 'fixed'
          } : undefined}
          className={`fixed z-40 flex items-center gap-1.5 select-none ${
            position
              ? ''
              : isAdmin
                ? 'bottom-4 left-4 sm:bottom-6 sm:left-6 md:left-72'
                : 'bottom-20 left-4 sm:bottom-6 sm:left-6'
          }`}
        >
          <div className="flex items-center rounded-2xl bg-zinc-900/95 border border-yellow-500/40 shadow-2xl backdrop-blur-md p-1 pl-1.5 gap-1 text-[11px] font-bold text-yellow-400 group">
            {/* Dedicated Movable Touch & Mouse Grip Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="cursor-grab active:cursor-grabbing p-1.5 text-zinc-400 hover:text-yellow-400 flex items-center justify-center touch-none select-none rounded-lg hover:bg-zinc-800"
              title="Click & drag anywhere on screen (Desktop & Mobile)"
            >
              <Move className="w-3.5 h-3.5 text-yellow-500/80" />
            </div>

            <button
              id="simulate-24h-reminder-btn"
              onClick={() => handleTestReminder()}
              className="px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-yellow-400 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Test 24-hour in-app appointment reminder notification"
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <Bell className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>Test 24-Hr Reminder Alert</span>
            </button>

            {position && (
              <button
                type="button"
                onClick={handleResetPosition}
                className="p-1 text-[10px] text-zinc-500 hover:text-yellow-400 cursor-pointer"
                title="Reset position to default"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSimTriggerDismissed(true)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Close notification trigger"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Appointment Pass Modal */}
        <AppointmentPassModal
          appointment={selectedPassAppointment}
          isOpen={!!selectedPassAppointment}
          onClose={() => setSelectedPassAppointment(null)}
        />
      </>
    );
  }

  // If user dismissed or snoozed, render the subtle floating reminder badge / icon (Movable on Desktop & Mobile)
  if (isDismissed || isSnoozed) {
    return (
      <>
        <div
          ref={toastRef}
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            position: 'fixed'
          } : undefined}
          className={`fixed z-40 flex items-center gap-1.5 select-none animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            position
              ? ''
              : isAdmin
                ? 'bottom-20 left-4 sm:bottom-6 sm:left-6 md:left-72'
                : 'bottom-20 left-4 sm:bottom-6 sm:left-6'
          }`}
        >
          <div className="flex items-center rounded-2xl bg-purple-600 dark:bg-yellow-500 text-white dark:text-zinc-950 font-bold text-xs shadow-2xl border border-purple-300 dark:border-yellow-300 p-1 pl-1.5 gap-1">
            {/* Movable Touch & Mouse Grip Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="cursor-grab active:cursor-grabbing p-1.5 text-purple-200 dark:text-zinc-800 hover:text-white dark:hover:text-black flex items-center justify-center touch-none select-none rounded-lg"
              title="Click & drag anywhere on screen (Desktop & Mobile)"
            >
              <Move className="w-3.5 h-3.5" />
            </div>

            <button
              id="restore-appointment-reminder-btn"
              onClick={() => {
                setIsDismissed(false);
                setSnoozeUntil(null);
                setIsCollapsed(false);
              }}
              className="px-2 py-1.5 sm:px-2.5 flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 transition"
              title="View Upcoming Appointment Reminder"
            >
              <div className="relative">
                <Bell className="w-4 h-4 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600" />
              </div>
              <span className="text-xs">
                <span className="inline sm:hidden">Reminder</span>
                <span className="hidden sm:inline">Upcoming Appointment ({upcomingReminders.length})</span>
              </span>
            </button>

            {position && (
              <button
                type="button"
                onClick={handleResetPosition}
                className="p-1 text-purple-200 dark:text-zinc-800 hover:text-white dark:hover:text-black cursor-pointer"
                title="Reset position"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <AppointmentPassModal
          appointment={selectedPassAppointment}
          isOpen={!!selectedPassAppointment}
          onClose={() => setSelectedPassAppointment(null)}
        />
      </>
    );
  }

  const googleCalUrl = generateGoogleCalendarUrl(activeAppointment, settings.address);

  return (
    <>
      {/* IN-APP 24-HOUR TOAST NOTIFICATION CONTAINER (Movable / Draggable anywhere across screen) */}
      <div
        id="appointment-reminder-toast"
        ref={toastRef}
        style={position ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: 'fixed'
        } : undefined}
        className={`fixed z-40 max-w-[400px] w-[calc(100vw-24px)] sm:w-full transition-all duration-150 ${
          position
            ? ''
            : isAdmin
              ? 'top-20 sm:top-24 right-3 sm:right-6 lg:left-72'
              : 'top-20 sm:top-24 left-3 sm:left-6'
        }`}
      >
        {isCollapsed ? (
          /* COLLAPSED COMPACT PILL (Draggable) */
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="bg-white/95 dark:bg-[#141419]/95 backdrop-blur-md border-2 border-purple-400 dark:border-amber-500/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-left animate-in slide-in-from-top-4 duration-300 cursor-grab active:cursor-grabbing select-none touch-none"
            title="Click and drag anywhere to move"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-amber-500/20 border border-purple-300 dark:border-amber-500/40 flex items-center justify-center text-purple-700 dark:text-amber-400 shrink-0">
                <Bell className="w-4 h-4 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-zinc-900 dark:text-amber-400 truncate flex items-center gap-1.5">
                  <span>{activeAppointment.serviceName}</span>
                  <GripHorizontal className="w-3 h-3 text-zinc-400 opacity-60" />
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                  {reminderInfo.timeLabel} • {activeAppointment.timeSlot}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsCollapsed(false)}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-[11px] font-extrabold shadow-sm transition"
              >
                Expand
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* FULL LUXURY 24-HOUR REMINDER TOAST CARD */
          <div className="relative rounded-3xl bg-white/95 dark:bg-[#121217]/95 backdrop-blur-xl border-2 border-purple-400 dark:border-amber-500/50 shadow-2xl shadow-purple-500/10 dark:shadow-amber-500/10 overflow-hidden text-left animate-in slide-in-from-top-4 duration-300">
            
            {/* Top Glowing Ambient Accents */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Drag Handle Bar */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="px-4 py-1.5 bg-zinc-100/90 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between cursor-grab active:cursor-grabbing select-none touch-none text-[10px] text-zinc-500 font-semibold"
              title="Click and drag to move this alert anywhere on your screen"
            >
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <GripHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                <span className="uppercase tracking-wider font-bold text-[9px]">Movable Alert • Drag Anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                {position && (
                  <button
                    type="button"
                    onClick={handleResetPosition}
                    className="text-[9px] text-purple-600 dark:text-amber-400 hover:underline cursor-pointer"
                    title="Reset to default position"
                  >
                    Reset Pos
                  </button>
                )}
                <Move className="w-3 h-3 text-zinc-400 opacity-60" />
              </div>
            </div>

            {/* Header: Badge & Window Controls */}
            <div className="p-4 sm:p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-2xl bg-purple-100 dark:bg-amber-500/20 border border-purple-300 dark:border-amber-500/50 flex items-center justify-center text-purple-700 dark:text-amber-400 shadow-sm shrink-0">
                  <Bell className="w-4 h-4 animate-swing" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 dark:bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600 dark:bg-amber-500"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-amber-400 bg-purple-50 dark:bg-amber-500/10 border border-purple-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                      {reminderInfo.badgeLabel}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {reminderInfo.headingLabel}
                  </h4>
                </div>
              </div>

              {/* Top Controls: Sound, Collapse, Dismiss */}
              <div className="flex items-center gap-1 shrink-0 text-zinc-500 dark:text-zinc-400">
                <button
                  onClick={() => {
                    if (!soundEnabled) playLuxuryNotificationChime();
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-purple-600 dark:hover:text-amber-400 transition-colors"
                  title={soundEnabled ? 'Mute notification sound' : 'Unmute sound'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />}
                </button>

                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-xs font-mono"
                  title="Collapse to minimal pill"
                >
                  —
                </button>

                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Content Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Client Greeting & Service Info */}
              <div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Dear <strong className="text-purple-700 dark:text-yellow-400 font-semibold">{activeAppointment.clientName}</strong>, this is a friendly reminder that your salon session {reminderInfo.relativeScheduleText}.
                </p>
              </div>

              {/* Service & Time Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                  <div>
                    <div className="font-serif text-sm font-bold text-zinc-900 dark:text-yellow-400">
                      {activeAppointment.serviceName}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-600 dark:text-yellow-500" />
                      <span>{activeAppointment.stylistName}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    10% Adv Paid
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-yellow-400 shrink-0" />
                    <span className="font-medium">{reminderInfo.formattedDateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400 shrink-0" />
                    <span className="font-medium">{activeAppointment.timeSlot}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Balance Due at Studio:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">₹{activeAppointment.balanceDue}</span>
                </div>
              </div>

              {/* Multi-appointment pagination if > 1 upcoming */}
              {upcomingReminders.length > 1 && (
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                  <span>Appointment {activeToastIndex + 1} of {upcomingReminders.length}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveToastIndex(prev => (prev - 1 + upcomingReminders.length) % upcomingReminders.length)}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setActiveToastIndex(prev => (prev + 1) % upcomingReminders.length)}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Primary & Secondary Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedPassAppointment(activeAppointment)}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 dark:shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Pass &amp; Details</span>
                  </button>

                  <a
                    href={googleCalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-yellow-400" />
                    <span>Add to Cal</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">
                  <button
                    onClick={() => handleSnooze(60)}
                    className="hover:text-purple-700 dark:hover:text-yellow-400 font-medium transition-colors cursor-pointer"
                  >
                    Snooze (1 hour)
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    Dismiss reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Pass Lightbox Modal */}
      <AppointmentPassModal
        appointment={selectedPassAppointment}
        isOpen={!!selectedPassAppointment}
        onClose={() => setSelectedPassAppointment(null)}
      />
    </>
  );
};
