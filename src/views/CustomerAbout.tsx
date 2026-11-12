import React from 'react';
import { Sparkles, Award, ShieldCheck, Clock, MapPin, Phone } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { MeetTheTeam } from '../components/MeetTheTeam';
import { FaqSection } from '../components/FaqSection';
import { ClientTestimonials } from '../components/ClientTestimonials';

export const CustomerAbout: React.FC = () => {
  const { openBookingModal, settings } = useSalon();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 lg:pb-12 space-y-12 text-left">
      {/* Intro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Unisex Salon • Mohol</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            "We'll Style, You'll Smile"
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Located at B.N. Gund Complex near Kanya Prashala and ICICI Bank in Mohol, Modern Unisex Salon provides professional hair styling, bridal makeup, glowing facials, and men's grooming. Book online with an easy {settings.advancePercentage || 10}% advance deposit to guarantee your slot with no waiting time.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-serif">15,000+</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Happy Clients in Mohol</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-serif">{settings.advancePercentage || 10}% Deposit</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Instant Slot Booking</div>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80"
            alt="Modern Unisex Salon Ambience"
            className="w-full h-80 sm:h-96 object-cover"
          />
        </div>
      </div>

      {/* Meet the Team Section */}
      <MeetTheTeam />

      {/* Verified Client Testimonials */}
      <ClientTestimonials />

      {/* 3 Core Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">
            {settings.advancePercentage || 10}% Advance Booking
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Paying {settings.advancePercentage || 10}% advance via UPI or Card locks your sanitized salon chair so you can walk in with zero waiting time.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">
            Certified Stylists
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Our stylists are trained in modern international hair techniques, L'Oreal colors, O3+ facials, and bridal makeovers.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">
            Hygiene &amp; Safety
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            We use sterilized tools, disposable capes, and authentic branded products for all treatments.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <FaqSection />
    </div>
  );
};
