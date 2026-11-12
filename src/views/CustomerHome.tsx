import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  ChevronRight,
  Wand2,
  Users,
  Award,
  Phone,
  MapPin,
  Tag,
  Scissors,
  Gift,
  Percent,
  Flame,
  Video,
  Play
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ServiceItem } from '../types';
import { CustomerReviews } from '../components/CustomerReviews';
import { getDayAvailabilitySummary } from '../utils/availability';

export const CustomerHome: React.FC = () => {
  const {
    services,
    gallery,
    reviews,
    openBookingModal,
    openQuizModal,
    setActiveNavTab,
    settings,
    appointments
  } = useSalon();

  const todayIso = new Date().toISOString().split('T')[0];
  const todaySummary = getDayAvailabilitySummary(appointments, todayIso);

  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = [
    'All',
    "Women's Beauty",
    "Men's Grooming",
    'Bridal & Make Up',
    'Skin & Facial',
    'Hair Care',
    'Chemical Treatments'
  ];

  const filteredServices = services.filter(srv => {
    if (activeCategory === 'All') return true;
    if (activeCategory === "Women's Beauty") return srv.gender === 'women' || (srv.gender === 'unisex' && !srv.category.includes("Men's"));
    if (activeCategory === "Men's Grooming") return srv.gender === 'men' || srv.category.includes("Men's");
    if (activeCategory === 'Bridal & Make Up') return srv.category.includes('Make Up') || srv.category.includes('Bridal');
    if (activeCategory === 'Skin & Facial') return srv.category.includes('Skin');
    if (activeCategory === 'Hair Care') return srv.category.includes('Hair Services') || srv.category.includes('Color Services') || srv.category.includes('Hair Care');
    if (activeCategory === 'Chemical Treatments') return srv.category.includes('Chemical') || srv.category.includes('Keratin');
    return true;
  });

  return (
    <div className="space-y-10 sm:space-y-16 pb-28 lg:pb-16">
      {/* HERO SECTION */}
      <section id="section-home-hero" className="pt-2 sm:pt-6 pb-6 sm:pb-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Modern Unisex Salon • Mohol</span>
              </div>

              {todaySummary.fillingFastSlots.length > 0 && (
                <button
                  onClick={() => {
                    setActiveNavTab('services');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold animate-pulse hover:bg-amber-500/25 transition cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{todaySummary.fillingFastSlots.length} Slots Filling Fast Today</span>
                </button>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
              Hair, Skin &amp; Bridal Styling for Everyone
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Book your appointment online in 60 seconds with a {settings.advancePercentage || 10}% advance deposit. Enjoy dedicated stylist time with zero waiting.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                id="hero-schedule-btn"
                onClick={() => openBookingModal()}
                className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>Book Appointment</span>
                <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                  {settings.advancePercentage || 10}% Advance
                </span>
              </button>

              <button
                id="hero-browse-btn"
                onClick={() => {
                  setActiveNavTab('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-purple-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>View Price List</span>
                <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </button>
            </div>

            {/* Quick Benefits */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero Waiting Time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Clear, Fixed Prices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Clean &amp; Sanitized Chairs</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card with Interactive Quiz */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80"
                alt="Modern Salon interior Mohol"
                className="w-full h-[320px] sm:h-[400px] object-cover group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 via-black/20 to-transparent dark:from-black/85 dark:via-black/30 dark:to-transparent"></div>

              {/* Style Quiz Prompt Card */}
              <div className="absolute bottom-4 left-4 right-4">
                <button
                  onClick={openQuizModal}
                  className="w-full p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-purple-200/90 dark:border-zinc-700 text-left shadow-xl flex items-center justify-between group/pill transition-all cursor-pointer hover:border-purple-300 dark:hover:border-zinc-600 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-amber-500/20 border border-purple-200 dark:border-amber-500/40 flex items-center justify-center text-purple-700 dark:text-amber-400 shrink-0">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover/pill:text-purple-700 dark:group-hover/pill:text-amber-400 transition-colors">
                        Need style advice?
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Take our 30-second Style &amp; Skin Quiz
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600 dark:text-amber-400 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 SIMPLE HIGHLIGHTS */}
      <section className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">Hair Styling &amp; Colors</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Fades, layer cuts, botox treatments, keratin, and global hair color.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">Bridal &amp; Make Up</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              HD &amp; 4D bridal makeup, saree draping, and groom styling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">Skin &amp; Facials</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              O3+ glowing facials, hydra cleanups, and de-tan skin care.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">{settings.advancePercentage || 10}% Advance Booking</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pay {settings.advancePercentage || 10}% online to confirm. Pay the remaining {100 - (settings.advancePercentage || 10)}% at the salon.
            </p>
          </div>
        </div>
      </section>

      {/* ALL SERVICES CATEGORIES EXPLORER (Specially tailored for mobile browsing) */}
      <section id="section-home-categories" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 text-left pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Explore All Services
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Service Categories &amp; Pricing
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveNavTab('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Full Rate Card</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {[
            { name: '💄 Make Up & Bridal', desc: 'HD, 3D & 4D Make up', from: '₹2,000', tag: 'Make Up' },
            { name: '🌿 Skin & Hydra', desc: 'O3+ Facial & Cleanups', from: '₹600', tag: 'Skin' },
            { name: '💇‍♀️ Hair Cuts', desc: 'Fade, Layer & Kids', from: '₹150', tag: 'Hair' },
            { name: '🎨 Hair Colour', desc: 'Global & Balayage', from: '₹2,500', tag: 'Color' },
            { name: '🧪 Chemical Care', desc: 'Keratin & Botox', from: '₹4,000', tag: 'Chemical' },
            { name: "💈 Men's Grooming", desc: 'Beard, D-tan & Spa', from: '₹200', tag: "Men's" },
          ].map((catItem, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveNavTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
                  {catItem.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {catItem.desc}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">From</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{catItem.from}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MULTI-SERVICE BUNDLE & SAVE BANNER */}
      <section id="section-home-bundle" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-amber-600/15 border border-amber-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
              <Gift className="w-3.5 h-3.5" />
              <span>Multi-Service Discount Engine</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Bundle Services &amp; Save Up To 20%
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Combine haircuts, facials, party makeup, and hair treatments into a single pampering session. Lock your customized bundle with only a {settings.advancePercentage || 10}% advance deposit!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveNavTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Explore Bundle Packages</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES SECTION */}
      <section id="section-home-popular-services" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-left pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Popular Treatments
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              Our Most Requested Services
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredServices.slice(0, 6).map(service => (
            <div
              key={service.id}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {service.imageUrl && (
                <div className="relative h-44 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium">
                    {service.category}
                  </span>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {service.rating || 4.9}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {service.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 block">Total Price</span>
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        ₹{service.price}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">{settings.advancePercentage || 10}% Advance</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                        ₹{Math.round((service.price * (settings.advancePercentage || 10)) / 100)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openBookingModal(service)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Now (₹{service.advanceDeposit || Math.round(service.price * 0.1)} Adv)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setActiveNavTab('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-2 transition"
          >
            <span>View Complete Rate Card ({services.length} Services)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section id="section-home-gallery" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-left pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Client Transformations
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              Our Recent Work
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveNavTab('gallery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Photos &amp; Reels</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {gallery.slice(0, 4).map(item => {
            const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveNavTab('gallery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative rounded-2xl overflow-hidden aspect-square border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 cursor-pointer shadow-sm hover:border-amber-500/40"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {isVideo && (
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/90 text-zinc-950 flex items-center justify-center shadow-md">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <div className="flex items-center gap-1">
                    {isVideo && <Video className="w-3 h-3 text-rose-400" />}
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{item.tag}</span>
                  </div>
                  <span className="text-xs font-bold text-white leading-tight mt-0.5">{item.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="section-home-reviews" className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <CustomerReviews />
      </section>

      {/* LOCATION & HOURS BANNER */}
      <section id="section-home-location" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 text-white border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </div>
            <h3 className="font-serif text-lg font-bold">B.N. Gund Complex, Mohol</h3>
            <p className="text-xs text-zinc-400">Near Kanya Prashala &amp; ICICI Bank, Solapur-Pune Road, Mohol</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Opening Hours</span>
            </div>
            <h3 className="font-serif text-lg font-bold">9:00 AM – 9:00 PM</h3>
            <p className="text-xs text-zinc-400">Open 7 days a week for men and women</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <a
              href={`tel:${settings.phone}`}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>+91 {settings.phone}</span>
            </a>
            <button
              onClick={() => openBookingModal()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
