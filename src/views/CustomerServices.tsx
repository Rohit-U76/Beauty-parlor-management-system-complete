import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Star,
  Search,
  CheckCircle2,
  Sparkles,
  Wand2,
  Table,
  LayoutGrid,
  Plus,
  Check,
  Flame
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ServiceItem } from '../types';
import { ServicePriceTable } from '../components/ServicePriceTable';
import { FloatingBundleBar } from '../components/FloatingBundleBar';
import { RealTimeAvailabilityBanner } from '../components/RealTimeAvailabilityBanner';
import { getServiceAvailabilityInsight } from '../utils/availability';

export const CustomerServices: React.FC = () => {
  const { services, openBookingModal, openQuizModal, settings, appointments } = useSalon();
  
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(12000);
  const [selectedBundleServiceIds, setSelectedBundleServiceIds] = useState<string[]>([]);

  // Bundle calculations
  const selectedBundleServices = useMemo(() => {
    return services.filter(s => selectedBundleServiceIds.includes(s.id));
  }, [services, selectedBundleServiceIds]);

  const discountRate = 0;

  const originalTotalPrice = useMemo(() => {
    return selectedBundleServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedBundleServices]);

  const discountAmount = 0;

  const finalDiscountedPrice = Math.max(0, originalTotalPrice - discountAmount);
  const advancePercentage = settings.advancePercentage || 10;
  const advanceDeposit = Math.round((finalDiscountedPrice * advancePercentage) / 100);
  const totalDuration = useMemo(() => {
    return selectedBundleServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedBundleServices]);

  const handleToggleBundleService = (serviceId: string) => {
    setSelectedBundleServiceIds(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleClearBundle = () => {
    setSelectedBundleServiceIds([]);
  };

  const handleApplyPreset = (serviceIds: string[]) => {
    setSelectedBundleServiceIds(serviceIds);
  };

  const handleBookBundle = (bundleService?: ServiceItem) => {
    if (bundleService) {
      openBookingModal(bundleService);
      return;
    }

    if (selectedBundleServices.length === 0) return;

    const namesList = selectedBundleServices.map(s => s.name).join(' + ');
    const compositeService: ServiceItem = {
      id: `bundle-cart-${Date.now()}`,
      name: `Multi-Service Selection: ${namesList} (${selectedBundleServices.length} ${selectedBundleServices.length === 1 ? 'Service' : 'Services'})`,
      category: selectedBundleServices[0]?.category || 'Bridal & Pre-Bridal',
      gender: selectedBundleServices.some(s => s.gender === 'women') ? 'women' : 'unisex',
      durationMinutes: totalDuration,
      price: finalDiscountedPrice,
      priceDisplay: `₹${finalDiscountedPrice.toLocaleString()}`,
      advanceDeposit: advanceDeposit,
      description: `Selected ${selectedBundleServices.length} salon services: ${selectedBundleServices.map(s => `${s.name} (₹${s.price})`).join(', ')}.`,
      imageUrl: selectedBundleServices[0]?.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 140,
      benefits: [
        `${settings.advancePercentage || 10}% Online Advance Deposit: ₹${advanceDeposit.toLocaleString()} secured`,
        `Remaining ${100 - (settings.advancePercentage || 10)}% Balance: ₹${(finalDiscountedPrice - advanceDeposit).toLocaleString()} payable at salon`,
        ...selectedBundleServices.map(s => `Included: ${s.name} (${s.durationMinutes} mins)`)
      ]
    };

    openBookingModal(compositeService);
  };

  const categories = [
    'All',
    'Make Up',
    'Skin Services',
    'Hair Services',
    'Color Services',
    'Hair Chemical Services',
    "Men's Executive Grooming",
    'Bridal & Pre-Bridal'
  ];

  const filteredServices = services.filter(srv => {
    const matchesSearch = 
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.priceDisplay && srv.priceDisplay.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || srv.category === selectedCategory;
    
    let matchesGender = true;
    if (selectedGender === 'bridal') {
      matchesGender = srv.category === 'Bridal & Pre-Bridal' || srv.name.toLowerCase().includes('bridal') || srv.name.toLowerCase().includes('groom');
    } else if (selectedGender === 'women') {
      matchesGender = srv.gender === 'women' || srv.gender === 'unisex';
    } else if (selectedGender === 'men') {
      matchesGender = srv.gender === 'men' || srv.gender === 'unisex' || srv.category === "Men's Executive Grooming";
    }

    const matchesPrice = srv.price <= maxPrice;
    return matchesSearch && matchesCat && matchesGender && matchesPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12 space-y-6 text-left relative">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Unisex Salon Mohol • Rate Card</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Service Menu &amp; Rate Card
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Transparent, fixed salon pricing with {settings.advancePercentage || 10}% advance deposit to secure your appointment slot.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 flex-wrap gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rate Card</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>

          <button
            onClick={openQuizModal}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Style Quiz</span>
          </button>
        </div>
      </div>

      {/* Real-Time Availability Indicator Widget */}
      <RealTimeAvailabilityBanner
        onQuickBookSlot={(slot, date) => {
          openBookingModal();
        }}
      />

      {/* Mode 2: Tabular Rate Card */}
      {viewMode === 'table' && (
        <ServicePriceTable
          standalone={false}
          selectedBundleServiceIds={selectedBundleServiceIds}
          onToggleBundleService={handleToggleBundleService}
          onBookService={(service) => openBookingModal(service)}
        />
      )}

      {/* Mode 3: Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Grid Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search treatments (e.g. O3 facial, Keratin, 4D Make up, Balayage...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Gender Segment Filter */}
              <div className="md:col-span-4 flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'women', label: "Women" },
                  { id: 'men', label: "Men" },
                  { id: 'bridal', label: "Bridal/Groom" }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGender(g.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition truncate cursor-pointer ${
                      selectedGender === g.id
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="md:col-span-2 flex items-center gap-2 px-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono">Max: ₹{maxPrice}</span>
                <input
                  type="range"
                  min={150}
                  max={12000}
                  step={200}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map(srv => {
              const isBundled = selectedBundleServiceIds.includes(srv.id);

              return (
                <div
                  key={srv.id}
                  className={`rounded-2xl bg-white dark:bg-zinc-900 border transition duration-300 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md group ${
                    isBundled
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50'
                  }`}
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={srv.imageUrl}
                        alt={srv.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                        {srv.category}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {srv.durationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          {srv.rating} ({srv.reviewsCount})
                        </span>
                      </div>

                      {/* Real-time availability indicator on card */}
                      {(() => {
                        const insight = getServiceAvailabilityInsight(appointments, srv.durationMinutes);
                        if (insight.isUrgent) {
                          return (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{insight.highlightText}</span>
                            </div>
                          );
                        }
                        return (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{insight.highlightText}</span>
                          </div>
                        );
                      })()}

                      <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {srv.name}
                      </h3>
                      
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {srv.description}
                      </p>

                      {/* Tier options breakdown preview */}
                      {srv.tierOptions && srv.tierOptions.length > 1 && (
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Tier Variations:
                          </div>
                          {srv.tierOptions.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300">
                              <span className="truncate max-w-[170px]">{t.label}</span>
                              <span className="font-mono font-bold text-zinc-900 dark:text-white">₹{t.price}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Benefits List */}
                      <div className="space-y-1 pt-1">
                        {srv.benefits.slice(0, 3).map((b, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price Footer & Actions */}
                  <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Price</div>
                        <div className="text-sm font-black text-zinc-900 dark:text-white font-mono">
                          {srv.priceDisplay || `₹${srv.price.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                          {settings.advancePercentage || 10}% Deposit
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{Math.round((srv.price * (settings.advancePercentage || 10)) / 100)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleToggleBundleService(srv.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isBundled
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10 hover:text-amber-600 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {isBundled ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-500" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openBookingModal(srv)}
                        className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Bundle Bar (When services are selected in Table, Grid, or anywhere) */}
      <FloatingBundleBar
        selectedServices={selectedBundleServices}
        discountRate={discountRate}
        originalPrice={originalTotalPrice}
        discountedPrice={finalDiscountedPrice}
        advanceDeposit={advanceDeposit}
        onOpenBundleView={() => {
          handleBookBundle();
        }}
        onBookBundle={() => handleBookBundle()}
        onClearBundle={handleClearBundle}
      />
    </div>
  );
};
