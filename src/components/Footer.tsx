import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Clock, ShieldCheck, CreditCard, ChevronRight, Instagram, FileText, ArrowUpRight } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ModernSalonLogo } from './ModernSalonLogo';

export const Footer: React.FC = () => {
  const { setActiveNavTab, setIsAdminMode, settings, openBookingModal } = useSalon();

  const handleNav = (tab: string) => {
    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-purple-50/70 dark:bg-zinc-950 border-t border-purple-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 text-sm transition-colors">
      {/* 10% Advance Guarantee Banner */}
      <div className="border-b border-purple-200/80 dark:border-zinc-800/80 bg-purple-100/50 dark:bg-zinc-900/40 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-purple-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-amber-500/10 border border-purple-300 dark:border-amber-500/30 flex items-center justify-center text-purple-700 dark:text-amber-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">10% Advance Deposit System</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-xs">Reserve slots with just 10% online; pay remaining balance at the salon counter.</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-purple-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">UPI &amp; Digital Payments</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-xs">Instant confirmation via Google Pay, PhonePe, Paytm, and NetBanking.</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-purple-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-amber-500/10 border border-purple-300 dark:border-amber-500/30 flex items-center justify-center text-purple-700 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">24-Hour Reminder Alert</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-xs">Automatic notification with digital appointment pass sent 24h prior to appointment.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => handleNav('home')}>
              <ModernSalonLogo size="md" showTagline={true} />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Modern Unisex Salon in Mohol. Specialized in HD Bridal Makeup, Hydrafacials, Hair Chemical Straightening/Keratin, and Executive Grooming.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href={settings.instagramUrl || "https://www.instagram.com/modern_unisex_salon_mohol?utm_source=qr"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 hover:border-pink-500/50 text-zinc-800 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-400 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Col 2: Services Categories */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase font-mono mb-4 text-purple-700 dark:text-amber-500">
              Service Price List
            </h4>
            <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-400">
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  💄 Make Up (HD, 3D/4D Bridal)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  🌿 Skin Services &amp; Hydrafacial
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  🌿 O3 Prof. &amp; Cheryla’s Facial
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  💇‍♀️ Advance Hair Cut &amp; Blow Dry
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  🎨 Global Hair Colour &amp; Balayage
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  🧪 Keratin Treatment &amp; Rebonding
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation & Terms */}
          <div>
            <h4 className="font-bold text-xs tracking-wider uppercase font-mono mb-4 text-purple-700 dark:text-amber-500">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-400">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors font-semibold text-zinc-900 dark:text-zinc-200 cursor-pointer">
                  Tabular Rate Card (Price List)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('terms')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Terms &amp; 11 Salon Policies</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('offers')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  Coupons &amp; Offers (MODERN20)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('gallery')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  Before / After Gallery
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-purple-700 dark:hover:text-amber-400 transition-colors cursor-pointer">
                  About Master Stylist
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Salon Hours & Exact Location */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs tracking-wider uppercase font-mono mb-4 text-purple-700 dark:text-amber-500">
              Modern Salon Mohol
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Phone className="w-4 h-4 text-purple-600 dark:text-amber-500 shrink-0" />
              <a href={`tel:${settings.phone}`} className="hover:text-zinc-950 dark:hover:text-white transition font-mono">
                +91 {settings.phone}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Mail className="w-4 h-4 text-purple-600 dark:text-amber-500 shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-zinc-950 dark:hover:text-white transition">
                {settings.email}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Clock className="w-4 h-4 text-purple-600 dark:text-amber-500 shrink-0" />
              <span>{settings.openingHours}</span>
            </div>

            <div className="pt-1">
              <a
                href={settings.mapsUrl || "https://maps.app.goo.gl/CraeBa6gAjWA8o818"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-700 dark:text-amber-400 hover:text-purple-800 dark:hover:text-amber-300 underline font-medium"
              >
                <span>View Google Maps Directions</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-purple-200/80 dark:border-zinc-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-500">
          <div>
            © {new Date().getFullYear()} Modern Unisex Salon, Mohol. All rights reserved. • "WE'LL STYLE YOU'LL SMILE"
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => handleNav('terms')} className="hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer">
              Terms &amp; Conditions
            </button>
            <span>•</span>
            <span>24h Cancellation Notice</span>
            <span>•</span>
            <span>{settings.advancePercentage || 10}% Advance Deposit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
