import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Gift,
  Zap,
  ShieldCheck,
  Layers,
  Scissors,
  X,
  ChevronRight,
  Info,
  Percent,
  ShoppingBag,
  Search,
  CheckSquare,
  Square,
  Flame
} from 'lucide-react';
import { ServiceItem } from '../types';
import { useSalon } from '../context/SalonContext';
import { getDayAvailabilitySummary } from '../utils/availability';

export interface PredefinedBundlePreset {
  id: string;
  name: string;
  badge: string;
  discountPercent: number;
  description: string;
  serviceIds: string[];
  imageUrl: string;
  gender: 'women' | 'men' | 'unisex';
}

interface ServiceBundleBuilderProps {
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
  onClearBundle: () => void;
  onApplyPreset: (serviceIds: string[]) => void;
  onBookBundle: (bundleService: ServiceItem) => void;
}

export const PREDEFINED_BUNDLES: PredefinedBundlePreset[] = [
  {
    id: 'bridal-glow-ultimate',
    name: '👑 Ultimate Bridal & Royal Glow Transformation',
    badge: 'Save 20% • Bridal Favorite',
    discountPercent: 20,
    description: 'Complete royal wedding makeover with HD bridal makeup, O3+ facial whitening glow, and hair therapy styling.',
    serviceIds: ['srv-wom-1', 'srv-sk-6', 'srv-ch-4'], // Bridal 4D Makeover, O3+ Facial, Hair Spa/Treatment
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    gender: 'women'
  },
  {
    id: 'hydra-glow-makeover',
    name: '✨ Golden Hydra & Hair Styling Glow Duo',
    badge: 'Save 15% • Trending',
    discountPercent: 15,
    description: 'Deep pore vacuum hydration with customized hair shaping and intense nutritive conditioning.',
    serviceIds: ['srv-sk-7', 'srv-hr-5'], // Hydrafacial glow + Advance Hair Cut
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    gender: 'women'
  },
  {
    id: 'men-executive-grooming',
    name: "💈 Gentleman's Head-to-Toe Executive Package",
    badge: "Save 15% • Men's Top Choice",
    discountPercent: 15,
    description: "Precision haircut, luxury beard sculpting spa, and refreshing charcoal d-tan face treatment.",
    serviceIds: ['srv-men-1', 'srv-men-2'], // Men fade & beard sculpt + Charcoal D-tan facial
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    gender: 'men'
  },
  {
    id: 'hair-transformation-combo',
    name: '🧪 Keratin Gloss & Precision Layer Sculpt',
    badge: 'Save 15% • Frizz-Free',
    discountPercent: 15,
    description: 'Professional protein botox/keratin treatment with customized face-framing layer cut and shine serum blowdry.',
    serviceIds: ['srv-ch-3', 'srv-hr-5'], // Keratin treatment + Advance Hair Cut
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
    gender: 'women'
  },
  {
    id: 'balayage-glamour-pack',
    name: '🎨 Balayage Color Radiance & Deep Mask',
    badge: 'Save 18% • Premium',
    discountPercent: 18,
    description: 'Bespoke hand-painted balayage highlights with bond-protecting mask and glam waves.',
    serviceIds: ['srv-cl-4', 'srv-ch-4'], // Balayage Color Tech + Hair Treatment Spa & Repair
    imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80',
    gender: 'women'
  },
  {
    id: 'party-ready-express',
    name: '🌸 Party Glamour & Express Skin Glow',
    badge: 'Save 12% • Event Ready',
    discountPercent: 12,
    description: '3D party makeup with light clean-up exfoliation and elegant hair curling or blowout.',
    serviceIds: ['srv-mu-2', 'srv-sk-3'], // HD Make Up + Face Clean Up
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    gender: 'women'
  }
];

export const ServiceBundleBuilder: React.FC<ServiceBundleBuilderProps> = ({
  selectedServiceIds,
  onToggleService,
  onClearBundle,
  onApplyPreset,
  onBookBundle
}) => {
  const { services, settings, appointments } = useSalon();
  const [filterCat, setFilterCat] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [bundleGender, setBundleGender] = useState<'all' | 'women' | 'men'>('all');

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAvailability = useMemo(() => {
    return getDayAvailabilitySummary(appointments, todayIso);
  }, [appointments, todayIso]);

  // Map selected IDs to actual service objects
  const selectedServices = useMemo(() => {
    return services.filter(s => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Calculate Tiered Discount Percentage
  // 1 item = 0%
  // 2 items = 10%
  // 3 items = 15%
  // 4+ items = 20%
  const discountRate = useMemo(() => {
    const count = selectedServices.length;
    if (count <= 1) return 0;
    if (count === 2) return 10;
    if (count === 3) return 15;
    return 20;
  }, [selectedServices.length]);

  // Pricing math
  const originalTotalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const discountAmount = useMemo(() => {
    if (discountRate === 0) return 0;
    return Math.round((originalTotalPrice * discountRate) / 100);
  }, [originalTotalPrice, discountRate]);

  const finalDiscountedPrice = Math.max(0, originalTotalPrice - discountAmount);
  
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const advancePercentage = settings.advancePercentage || 10;
  const advanceDeposit = Math.round((finalDiscountedPrice * advancePercentage) / 100);
  const balanceAtSalon = finalDiscountedPrice - advanceDeposit;

  // Next tier incentive message
  const nextTierInfo = useMemo(() => {
    const count = selectedServices.length;
    if (count === 0) return { needed: 2, nextRate: 10, text: 'Select 2 services to unlock 10% Bundle Discount!' };
    if (count === 1) return { needed: 1, nextRate: 10, text: 'Add 1 more service to unlock 10% Bundle Discount!' };
    if (count === 2) return { needed: 1, nextRate: 15, text: 'Add 1 more service to upgrade to 15% Discount!' };
    if (count === 3) return { needed: 1, nextRate: 20, text: 'Add 1 more service to unlock Maximum 20% Mega Savings!' };
    return { needed: 0, nextRate: 20, text: '🎉 Maximum 20% Mega Discount Unlocked!' };
  }, [selectedServices.length]);

  // Service categories for filtering in the picker
  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map(s => s.category)));
    return ['All', ...unique];
  }, [services]);

  const filteredPickerServices = useMemo(() => {
    return services.filter(s => {
      const matchesCat = filterCat === 'All' || s.category === filterCat;
      const matchesSearch = 
        s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.description.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesGender = 
        bundleGender === 'all' || 
        s.gender === bundleGender || 
        s.gender === 'unisex' ||
        (bundleGender === 'men' && s.category === "Men's Executive Grooming");
      return matchesCat && matchesSearch && matchesGender;
    });
  }, [services, filterCat, searchFilter, bundleGender]);

  const handleLaunchBooking = () => {
    if (selectedServices.length === 0) return;

    // Construct a composite bundle service item
    const namesList = selectedServices.map(s => s.name).join(' + ');
    const bundleService: ServiceItem = {
      id: `bundle-custom-${Date.now()}`,
      name: `✨ Discount Bundle: ${namesList} (${selectedServices.length} Services • ${discountRate}% OFF)`,
      category: selectedServices[0]?.category || 'Bridal & Pre-Bridal',
      gender: selectedServices.some(s => s.gender === 'women') ? 'women' : 'unisex',
      durationMinutes: totalDuration,
      price: finalDiscountedPrice,
      priceDisplay: `₹${finalDiscountedPrice.toLocaleString()} (MRP ₹${originalTotalPrice.toLocaleString()})`,
      advanceDeposit: advanceDeposit,
      description: `Custom bundled combo of ${selectedServices.length} salon services: ${selectedServices.map(s => `${s.name} (₹${s.price})`).join(', ')}. Includes ${discountRate}% bundle discount savings of ₹${discountAmount}.`,
      imageUrl: selectedServices[0]?.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 128,
      benefits: [
        `Bundle Savings: ₹${discountAmount.toLocaleString()} (${discountRate}% OFF applied)`,
        `10% Online Advance Deposit: ₹${advanceDeposit.toLocaleString()} locked slot`,
        `Remaining 90% Balance: ₹${balanceAtSalon.toLocaleString()} payable at salon`,
        ...selectedServices.map(s => `Included: ${s.name} (${s.durationMinutes} mins)`)
      ]
    };

    onBookBundle(bundleService);
  };

  return (
    <div className="space-y-8 text-left">
      {/* 1. HERO PROMO BANNER & DISCOUNT TIERS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-pink-500/10 to-amber-600/15 border border-amber-500/30 shadow-md relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Service Smart Bundle Engine</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Bundle Any Services &amp; Save Up To 20%
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Combine haircuts, facials, bridal makeups, and chemical treatments into one customized session. Pay only a <strong>10% advance deposit</strong> today with the remaining balance due after your pampering session!
            </p>
          </div>

          {/* Discount Tier Cards */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className={`p-3 rounded-2xl border text-center transition-all ${
              discountRate === 10
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-105 shadow-md'
                : 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}>
              <div className="text-[10px] uppercase font-bold tracking-tight">2 Services</div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">10% OFF</div>
              <div className="text-[9px] opacity-80 mt-0.5">Combo Tier</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center transition-all ${
              discountRate === 15
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-105 shadow-md'
                : 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}>
              <div className="text-[10px] uppercase font-bold tracking-tight">3 Services</div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">15% OFF</div>
              <div className="text-[9px] opacity-80 mt-0.5">Popular Tier</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center transition-all ${
              discountRate === 20
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold scale-105 shadow-md'
                : 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}>
              <div className="text-[10px] uppercase font-bold tracking-tight">4+ Services</div>
              <div className="text-base sm:text-lg font-black font-mono mt-0.5">20% OFF</div>
              <div className="text-[9px] opacity-80 mt-0.5">Mega Saver</div>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-5 pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>{nextTierInfo.text}</span>
          </div>

          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
            {selectedServices.length} Selected • {discountRate}% Discount Active
          </div>
        </div>
      </div>

      {/* 2. PRE-CURATED POPULAR BUNDLE PACKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Ready-to-Book Packages
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Popular Pre-Configured Combos
            </h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            1-Click Load into Builder or Book Directly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {PREDEFINED_BUNDLES.map(preset => {
            const presetServices = services.filter(s => preset.serviceIds.includes(s.id));
            const origPrice = presetServices.reduce((sum, s) => sum + s.price, 0);
            const discPrice = Math.round(origPrice * (1 - preset.discountPercent / 100));
            const presetAdv = Math.round(discPrice * 0.1);
            const isFullySelected = preset.serviceIds.every(id => selectedServiceIds.includes(id)) && selectedServiceIds.length === preset.serviceIds.length;

            return (
              <div
                key={preset.id}
                className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                  isFullySelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold shadow-sm">
                      {preset.badge}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    {/* Services Included in Preset */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {presetServices.length} Services Included:
                      </div>
                      {presetServices.map(srv => (
                        <div key={srv.id} className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                          <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{srv.name}</span>
                          </span>
                          <span className="font-mono text-zinc-500 text-[11px]">₹{srv.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preset Price & Actions */}
                <div className="p-4 pt-0 space-y-3">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                          ₹{discPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-400 line-through font-mono">
                          ₹{origPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        Save ₹{(origPrice - discPrice).toLocaleString()} ({preset.discountPercent}% OFF)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">10% Deposit</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{presetAdv.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onApplyPreset(preset.serviceIds)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isFullySelected
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {isFullySelected ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                      <span>{isFullySelected ? 'Loaded in Builder' : 'Load into Builder'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onApplyPreset(preset.serviceIds);
                        const namesList = presetServices.map(s => s.name).join(' + ');
                        const compositeItem: ServiceItem = {
                          id: `preset-${preset.id}-${Date.now()}`,
                          name: `${preset.name} (${preset.discountPercent}% OFF)`,
                          category: 'Bridal & Pre-Bridal',
                          gender: preset.gender,
                          durationMinutes: presetServices.reduce((sum, s) => sum + s.durationMinutes, 0),
                          price: discPrice,
                          priceDisplay: `₹${discPrice.toLocaleString()} (MRP ₹${origPrice.toLocaleString()})`,
                          advanceDeposit: presetAdv,
                          description: preset.description,
                          imageUrl: preset.imageUrl,
                          rating: 5.0,
                          reviewsCount: 150,
                          benefits: [
                            `Special Combo Package: ${preset.discountPercent}% Discount`,
                            `10% Online Advance Deposit: ₹${presetAdv.toLocaleString()}`,
                            `Balance payable at salon: ₹${(discPrice - presetAdv).toLocaleString()}`,
                            ...presetServices.map(s => `Includes: ${s.name}`)
                          ]
                        };
                        onBookBundle(compositeItem);
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Preset</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CUSTOM BUNDLE BUILDER WORKSPACE (Dual column: Picker + Live Summary Tray) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Service Selector Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-500" />
                  <span>Choose Services to Bundle</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select checkboxes on 2 or more services to build your customized combo.
                </p>
              </div>

              {/* Gender filter */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
                {(['all', 'women', 'men'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setBundleGender(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      bundleGender === g
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Category Pills */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter treatments (e.g. O3, facial, hair cut, keratin, party make up...)"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      filterCat === cat
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Services List with Checkboxes */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredPickerServices.map(srv => {
                const isSelected = selectedServiceIds.includes(srv.id);

                return (
                  <div
                    key={srv.id}
                    onClick={() => onToggleService(srv.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 text-amber-500">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-amber-500 text-zinc-950" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-200">
                        <img
                          src={srv.imageUrl}
                          alt={srv.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {srv.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span className="truncate">{srv.category}</span>
                          <span>•</span>
                          <span className="font-mono">{srv.durationMinutes} mins</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                        {srv.priceDisplay || `₹${srv.price.toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        10% Adv: ₹{Math.round(srv.price * 0.1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Bundle Cart & Pricing Breakdown */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Custom Bundle Summary
                </h4>
              </div>

              {selectedServices.length > 0 && (
                <button
                  onClick={onClearBundle}
                  className="text-xs text-rose-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Selected Items List */}
            {selectedServices.length === 0 ? (
              <div className="py-10 text-center space-y-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1 px-4">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Your Bundle Is Empty
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Select 2 or more services from the left catalog or choose one of our popular pre-configured packs above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedServices.map((srv, idx) => (
                    <div
                      key={srv.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {srv.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            ₹{srv.price} • {srv.durationMinutes}m
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleService(srv.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Remove service"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Progress bar to next tier */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{discountRate}% Discount Applied</span>
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-mono">
                      {selectedServices.length >= 4 ? 'Max Tier' : `${selectedServices.length}/4 Services`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedServices.length / 4) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {nextTierInfo.text}
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Original Price (MRP):</span>
                    <span className="font-mono font-medium line-through">₹{originalTotalPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      <span>Bundle Discount ({discountRate}%):</span>
                    </span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Total Estimated Time:</span>
                    </span>
                    <span className="font-mono font-semibold">{totalDuration} mins</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Bundled Total Price:
                    </span>
                    <span className="font-black text-base text-amber-600 dark:text-amber-400 font-mono">
                      ₹{finalDiscountedPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Advance Deposit breakdown */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span>10% Advance Deposit Due Now:</span>
                      <span className="font-mono text-sm">₹{advanceDeposit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>90% Balance Payable at Salon:</span>
                      <span className="font-mono font-semibold">₹{balanceAtSalon.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Live Slot Availability Advisor */}
                  {todayAvailability.fillingFastSlots.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                        <span>Today's Slot Advice ({totalDuration} mins)</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        {todayAvailability.fillingFastSlots[0].slot} is <strong>Filling Fast</strong> today ({todayAvailability.fillingFastSlots[0].urgencyText}). Next express chair opening is at <strong>{todayAvailability.nextExpressSlot}</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={handleLaunchBooking}
                  disabled={selectedServices.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {selectedServices.length >= 2 
                      ? `Book Discounted Bundle (₹${advanceDeposit} Adv)` 
                      : `Book ${selectedServices.length} Service (₹${advanceDeposit} Adv)`}
                  </span>
                </button>

                <p className="text-[10px] text-center text-zinc-400">
                  <ShieldCheck className="w-3 h-3 inline text-emerald-500 mr-1" />
                  Instant slot confirmation &amp; 24-hr advance reminder included.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
