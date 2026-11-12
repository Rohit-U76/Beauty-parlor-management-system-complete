import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Info,
  FileText,
  Tag,
  Star,
  Phone,
  ShieldCheck,
  Calendar,
  User,
  LogOut,
  Crown,
  ChevronRight,
  ChevronDown,
  Wand2,
  Table,
  MapPin,
  MessageSquare,
  Gift,
  ExternalLink,
  Sun,
  Moon,
  Scissors
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ThemeToggle } from './ThemeToggle';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ isOpen, onClose }) => {
  const {
    activeNavTab,
    setActiveNavTab,
    openBookingModal,
    openQuizModal,
    openAuthModal,
    currentUser,
    logout,
    setIsAdminMode,
    reviews,
    appointments,
    settings,
    services
  } = useSalon();

  const [servicesExpanded, setServicesExpanded] = useState(true);

  if (!isOpen) return null;

  const handleNavigate = (tab: string) => {
    setActiveNavTab(tab);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const serviceCategories = [
    { name: '💄 Make Up (HD & 3D/4D Bridal)', cat: 'Make Up', count: services.filter(s => s.category.includes('Make Up') || s.category.includes('Bridal')).length },
    { name: '🌿 Skin & Hydrafacial Glow', cat: 'Skin Services', count: services.filter(s => s.category.includes('Skin')).length },
    { name: '💇‍♀️ Hair Cut & Styling', cat: 'Hair Services', count: services.filter(s => s.category.includes('Hair Services')).length },
    { name: '🎨 Hair Colour & Balayage', cat: 'Color Services', count: services.filter(s => s.category.includes('Color')).length },
    { name: '🧪 Keratin & Botox Treatment', cat: 'Hair Chemical Services', count: services.filter(s => s.category.includes('Chemical') || s.category.includes('Keratin')).length },
    { name: "💈 Men's Grooming & Beard Spa", cat: "Men's Executive Grooming", count: services.filter(s => s.gender === 'men' || s.category.includes("Men's")).length },
    { name: '👰 Bridal & Pre-Bridal Packages', cat: 'Bridal & Pre-Bridal', count: services.filter(s => s.category.includes('Bridal')).length }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Grab Handle & Header */}
        <div className="p-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Modern Salon Menu
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Explore services, gallery, policies &amp; more
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-left">
          
          {/* User Profile / Login Banner */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {currentUser.role === 'ADMIN' ? 'Owner / Admin' : (currentUser.memberTier || 'Client')} • {currentUser.loyaltyPoints ?? 0} pts
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Sign Out to Authorization"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  openAuthModal('customer', 'login');
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Client Login</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal('customer', 'register');
                }}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* ALL SERVICES SECTION (Collapsible / Expandable) */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 overflow-hidden">
            <button
              onClick={() => setServicesExpanded(!servicesExpanded)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" />
                <span>All Salon Services ({services.length})</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <span>{servicesExpanded ? 'Collapse' : 'Browse All'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {servicesExpanded && (
              <div className="p-2 pt-0 space-y-1 border-t border-zinc-100 dark:border-zinc-800/60">
                <button
                  onClick={() => handleNavigate('services')}
                  className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-amber-500" />
                    <span>Open Full Tabular Rate Card</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                </button>

                {serviceCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleNavigate('services')}
                    className="w-full px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRIMARY HIDDEN OPTIONS REQUESTED BY USER */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Salon Pages &amp; Information
            </div>

            {/* 📸 Gallery */}
            <button
              onClick={() => handleNavigate('gallery')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'gallery'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Salon Gallery &amp; Looks</div>
                  <div className="text-[10px] text-zinc-500">Bridal makeovers, hairstyles &amp; salon photos</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* ℹ️ About Us */}
            <button
              onClick={() => handleNavigate('about')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'about'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">About Modern Salon</div>
                  <div className="text-[10px] text-zinc-500">Our journey, certified team &amp; hygiene standards</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* 📜 Salon Policies & Terms */}
            <button
              onClick={() => handleNavigate('terms')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'terms'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Terms &amp; Salon Policies</div>
                  <div className="text-[10px] text-zinc-500">10% Advance deposit, rescheduling &amp; refund rules</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* 🎁 Coupons & Special Offers */}
            <button
              onClick={() => handleNavigate('offers')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'offers'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Special Offers &amp; Coupons</div>
                  <div className="text-[10px] text-zinc-500">Bridal packages &amp; seasonal promo codes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* ⭐ Customer Reviews */}
            <button
              onClick={() => handleNavigate('reviews')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'reviews'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Client Reviews &amp; Ratings</div>
                  <div className="text-[10px] text-zinc-500">4.9 ★ Rating from {reviews.length} clients in Mohol</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold">
                {reviews.length}
              </span>
            </button>

            {/* 📞 Contact & Location */}
            <button
              onClick={() => handleNavigate('contact')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                activeNavTab === 'contact'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Contact &amp; Map Location</div>
                  <div className="text-[10px] text-zinc-500">B.N. Gund Complex, Mohol • +91 {settings.phone}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Quick AI Style Quiz Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">AI Treatment &amp; Style Quiz</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Get customized haircut &amp; facial suggestions</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                openQuizModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Start
            </button>
          </div>

          {/* Quick Contact & WhatsApp Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`tel:${settings.phone}`}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Call Salon</span>
            </a>
            <a
              href={`https://wa.me/91${settings.phone}?text=Hi%20Modern%20Salon%2C%20I%20would%20like%20to%20inquire%20about%20booking%20an%20appointment.`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Sticky Bottom Action in Sheet */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <button
            onClick={() => {
              onClose();
              openBookingModal();
            }}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Book Appointment ({settings.advancePercentage || 10}% Advance Deposit)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
