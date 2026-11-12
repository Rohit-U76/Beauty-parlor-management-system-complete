import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  ShieldCheck, 
  Bell, 
  Eye, 
  CheckCircle2, 
  Phone, 
  FileText, 
  Instagram, 
  MapPin, 
  Star, 
  LogOut, 
  Crown, 
  Gift, 
  RotateCw,
  Edit3,
  Check,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ThemeToggle } from './ThemeToggle';
import { getAppointmentReminderInfo } from '../utils/appointmentReminderUtils';
import { AppointmentPassModal } from './AppointmentPassModal';
import { Appointment } from '../types';
import { ModernSalonLogo } from './ModernSalonLogo';

export const Navbar: React.FC = () => {
  const {
    activeNavTab,
    setActiveNavTab,
    openBookingModal,
    openProfileModal,
    appointments,
    settings,
    reviews,
    currentUser,
    logout,
    userVisitsCount
  } = useSalon();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedPassAppointment, setSelectedPassAppointment] = useState<Appointment | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Compute 24-hr and upcoming reminders scoped strictly for current user
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

    return list.filter(apt => {
      const info = getAppointmentReminderInfo(apt);
      return info.isUpcoming24h;
    });
  }, [appointments, currentUser]);

  const handleNav = (tab: string) => {
    setActiveNavTab(tab);
    setNotificationsOpen(false);
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm overflow-hidden">
      {/* 1. Top Announcement Bar */}
      <div className="bg-purple-100/90 dark:bg-black text-zinc-800 dark:text-zinc-300 border-b border-purple-200 dark:border-zinc-800 px-3 sm:px-4 py-1 text-[11px] sm:text-xs font-medium transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">
              Modern Unisex Salon
            </span>
            <span className="text-zinc-600 dark:text-zinc-300 font-medium md:hidden">• Mohol</span>
            <span className="hidden md:inline truncate text-zinc-700 dark:text-zinc-300">
              • Mohol • B.N. Gund Complex • {settings.advancePercentage || 10}% Online Advance Deposit
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 lg:gap-4 text-zinc-500 dark:text-zinc-400 shrink-0">
            <a 
              href={`tel:${settings.phone}`} 
              className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-purple-700 dark:hover:text-amber-300 transition font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>+91 {settings.phone}</span>
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <a
              href={settings.instagramUrl || "https://www.instagram.com/modern_unisex_salon_mohol?utm_source=qr"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@modern_unisex_salon_mohol</span>
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Bank UPI {settings.advancePercentage || 10}% Advance
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Header Action Row: Logo on Left; Theme, Notification, Profile of client & Book appointment in the SAME ROW on Right */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
          
          {/* Logo */}
          <div 
            onClick={() => handleNav('home')}
            className="cursor-pointer group select-none shrink min-w-0"
          >
            <ModernSalonLogo size="md" showTagline={false} className="sm:hidden" />
            <ModernSalonLogo size="md" showTagline={true} className="hidden sm:inline-flex" />
          </div>

          {/* Right Action Items - ALL in the SAME ROW across desktop and mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* 1. Theme Change */}
            <div className="shrink-0" title="Toggle Light / Dark Theme">
              <ThemeToggle />
            </div>

            {/* 2. Notification (Bell with 24-hr reminder alerts) */}
            <div className="relative shrink-0">
              <button
                id="navbar-reminder-bell-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-1.5 sm:p-2 rounded-xl border transition relative flex items-center justify-center cursor-pointer ${
                  upcomingReminders.length > 0
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Upcoming appointment alerts & reminders"
                aria-label="Appointment reminders"
              >
                <Bell className="w-4 h-4" />
                {upcomingReminders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                    {upcomingReminders.length}
                  </span>
                )}
              </button>

              {/* Notification Alerts Dropdown */}
              {notificationsOpen && (
                <div 
                  id="notifications-dropdown-menu"
                  className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1.5 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Appointment Alerts
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                      {upcomingReminders.length} Due Soon
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {upcomingReminders.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                        <Clock className="w-8 h-8 text-zinc-400 mx-auto opacity-40" />
                        <p>No appointments due in next 24 hours.</p>
                        <button
                          onClick={() => {
                            setNotificationsOpen(false);
                            handleNav('appointments');
                          }}
                          className="text-purple-600 dark:text-purple-400 font-bold hover:underline text-xs"
                        >
                          View all bookings &amp; past visits &rarr;
                        </button>
                      </div>
                    ) : (
                      upcomingReminders.map((apt) => {
                        const info = getAppointmentReminderInfo(apt);
                        return (
                          <div
                            key={apt.id}
                            className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/70 space-y-2 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                  {apt.serviceName}
                                </span>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  Client: <strong>{apt.clientName}</strong>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                                {Math.round(info.hoursUntil) <= 0 ? 'Due soon' : `${Math.round(info.hoursUntil)}h away`}
                              </span>
                            </div>

                            <div className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-center justify-between font-mono">
                              <span>📅 {apt.date} at {apt.timeSlot}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{settings.advancePercentage || 10}% Paid</span>
                            </div>

                            <div className="pt-1">
                              <button
                                onClick={() => {
                                  setSelectedPassAppointment(apt);
                                  setNotificationsOpen(false);
                                }}
                                className="w-full py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Check-In Pass &amp; Details</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Profile of Client (Edit & Save Button) - in the SAME row! */}
            <button
              id="navbar-client-profile-btn"
              onClick={openProfileModal}
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-purple-500 dark:hover:border-purple-400 transition flex items-center gap-1 sm:gap-2 cursor-pointer shadow-sm shrink-0"
              title="Click to edit and save your client profile & preferences"
            >
              {currentUser ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-[10px] sm:text-[11px] shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block max-w-[80px] lg:max-w-[120px] truncate font-bold text-zinc-900 dark:text-zinc-100">
                    {currentUser.name}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 hidden sm:inline-block" />
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="font-bold text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200">
                    Profile
                  </span>
                  <span className="hidden md:inline-block text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded-full">
                    Edit &amp; Save
                  </span>
                </>
              )}
            </button>

            {/* 4. Book Appointment - in the SAME row! */}
            <button
              id="navbar-book-appointment-btn"
              onClick={() => openBookingModal()}
              className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-purple-600/20 active:scale-95 transition cursor-pointer shrink-0"
              title="Book your salon appointment with 10% advance deposit"
            >
              <Calendar className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="whitespace-nowrap font-bold">
                <span className="inline sm:hidden">Book</span>
                <span className="hidden sm:inline">Book Appointment</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Bar: Responsive Layout - Desktop shows all 9 headers, Mobile shows top 4 headers + dedicated 'More' dropdown menu */}
      <nav 
        id="navbar-all-headers-strip"
        aria-label="Main Navigation"
        className="w-full border-t border-purple-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-sm relative"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Desktop Navigation (md and up): All headers visible in single clean row */}
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs font-semibold">
            
            {/* 1. Home */}
            <button
              id="nav-link-home"
              onClick={() => handleNav('home')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'home' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <span>Home</span>
            </button>

            {/* 2. Rate Card */}
            <button
              id="nav-link-rate-card"
              onClick={() => handleNav('services')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'services' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <span>Rate Card</span>
            </button>

            {/* 3. Reviews */}
            <button
              id="nav-link-reviews"
              onClick={() => handleNav('reviews')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'reviews' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>Reviews</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeNavTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                {reviews.length}
              </span>
            </button>

            {/* 4. My Visits */}
            <button
              id="nav-link-my-visits"
              onClick={() => handleNav('appointments')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'appointments' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>My Visits</span>
              {userVisitsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeNavTab === 'appointments' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {userVisitsCount}
                </span>
              )}
            </button>

            {/* 5. Offers & Packages */}
            <button
              id="nav-link-offers"
              onClick={() => handleNav('offers')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'offers' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Offers &amp; Packages</span>
            </button>

            {/* 6. Photo Gallery */}
            <button
              id="nav-link-gallery"
              onClick={() => handleNav('gallery')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'gallery' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Photo Gallery</span>
            </button>

            {/* 7. About Modern Salon */}
            <button
              id="nav-link-about"
              onClick={() => handleNav('about')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'about' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>About Modern Salon</span>
            </button>

            {/* 8. Contact & Location */}
            <button
              id="nav-link-contact"
              onClick={() => handleNav('contact')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'contact' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Contact &amp; Location</span>
            </button>

            {/* 9. Terms & Policies */}
            <button
              id="nav-link-terms"
              onClick={() => handleNav('terms')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeNavTab === 'terms' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Terms &amp; Policies</span>
            </button>

          </div>

          {/* Mobile Navigation (under md): Clean, responsive row with Home, Rate Card, Reviews, My Visits, and 'More' Option */}
          <div className="flex md:hidden items-center justify-between gap-1 py-1.5 px-1 text-xs font-semibold">
            
            {/* Mobile 1. Home */}
            <button
              id="mobile-header-home"
              onClick={() => handleNav('home')}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                activeNavTab === 'home' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Home</span>
            </button>

            {/* Mobile 2. Rate Card */}
            <button
              id="mobile-header-rate-card"
              onClick={() => handleNav('services')}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                activeNavTab === 'services' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Rate Card</span>
            </button>

            {/* Mobile 3. Reviews */}
            <button
              id="mobile-header-reviews"
              onClick={() => handleNav('reviews')}
              className={`px-2 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                activeNavTab === 'reviews' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>Reviews</span>
            </button>

            {/* Mobile 4. My Visits */}
            <button
              id="mobile-header-visits"
              onClick={() => handleNav('appointments')}
              className={`px-2 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                activeNavTab === 'appointments' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Visits</span>
              {userVisitsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Mobile 5. 'More' Option Button */}
            <button
              id="mobile-header-more-btn"
              onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                mobileMoreOpen || ['offers', 'gallery', 'about', 'contact', 'terms'].includes(activeNavTab)
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
              title="More options and sections"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMoreOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mobile 'More' Dropdown Menu */}
          {mobileMoreOpen && (
            <div 
              id="mobile-more-menu-dropdown"
              className="md:hidden py-2 px-1 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-b-2xl shadow-xl"
            >
              <button
                onClick={() => handleNav('offers')}
                className={`p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold transition ${
                  activeNavTab === 'offers'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Offers &amp; Packages</span>
              </button>

              <button
                onClick={() => handleNav('gallery')}
                className={`p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold transition ${
                  activeNavTab === 'gallery'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Eye className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Photo Gallery</span>
              </button>

              <button
                onClick={() => handleNav('about')}
                className={`p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold transition ${
                  activeNavTab === 'about'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>About Salon</span>
              </button>

              <button
                onClick={() => handleNav('contact')}
                className={`p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold transition ${
                  activeNavTab === 'contact'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Contact &amp; Location</span>
              </button>

              <button
                onClick={() => handleNav('terms')}
                className={`p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold transition ${
                  activeNavTab === 'terms'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Terms &amp; Policies</span>
              </button>

              <button
                onClick={() => {
                  openProfileModal();
                  setMobileMoreOpen(false);
                }}
                className="p-2.5 rounded-xl flex items-center gap-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>My Profile (Edit)</span>
              </button>
            </div>
          )}

        </div>
      </nav>

      {/* Digital Check-in Pass Modal */}
      {selectedPassAppointment && (
        <AppointmentPassModal
          isOpen={true}
          appointment={selectedPassAppointment}
          onClose={() => setSelectedPassAppointment(null)}
        />
      )}
    </header>
  );
};
