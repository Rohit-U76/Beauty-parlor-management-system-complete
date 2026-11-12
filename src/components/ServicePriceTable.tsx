import React, { useState, useMemo } from 'react';
import { ServiceItem } from '../types';
import { useSalon } from '../context/SalonContext';
import { 
  Search, 
  Sparkles, 
  Clock, 
  ArrowUpDown, 
  Calendar, 
  Info,
  Filter,
  Plus,
  Check,
  ShoppingBag,
  Flame,
  Zap
} from 'lucide-react';
import { getServiceAvailabilityInsight } from '../utils/availability';

interface ServicePriceTableProps {
  onBookService?: (service: ServiceItem, selectedTier?: any) => void;
  selectedBundleServiceIds?: string[];
  onToggleBundleService?: (serviceId: string) => void;
  standalone?: boolean;
}

export const ServicePriceTable: React.FC<ServicePriceTableProps> = ({
  onBookService,
  selectedBundleServiceIds = [],
  onToggleBundleService,
  standalone = false
}) => {
  const { services, openBookingModal, appointments, settings } = useSalon();
  const advancePct = settings.advancePercentage || 10;
  const balancePct = 100 - advancePct;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<'all' | 'women' | 'men' | 'bridal'>('all');
  const [sortBy, setSortBy] = useState<'category' | 'name' | 'priceAsc' | 'priceDesc' | 'duration'>('category');

  const categories = useMemo(() => {
    const relevantServices = services.filter(s => {
      if (selectedGender === 'all') return true;
      if (selectedGender === 'bridal') {
        return s.category === 'Bridal & Pre-Bridal' || s.name.toLowerCase().includes('bridal') || s.name.toLowerCase().includes('groom') || s.name.toLowerCase().includes('wedding');
      }
      return s.gender === selectedGender || s.gender === 'unisex';
    });
    const unique = Array.from(new Set(relevantServices.map(s => s.category)));
    return ['All', ...unique];
  }, [services, selectedGender]);

  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        let matchesSegment = true;
        if (selectedGender === 'bridal') {
          matchesSegment = s.category === 'Bridal & Pre-Bridal' || s.name.toLowerCase().includes('bridal') || s.name.toLowerCase().includes('groom') || s.name.toLowerCase().includes('wedding');
        } else if (selectedGender === 'women') {
          matchesSegment = s.gender === 'women' || s.gender === 'unisex';
        } else if (selectedGender === 'men') {
          matchesSegment = s.gender === 'men' || s.gender === 'unisex' || s.category === "Men's Executive Grooming";
        }

        const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
        const matchesSearch = 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.priceDisplay && s.priceDisplay.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSegment && matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
        return 0;
      });
  }, [services, selectedGender, selectedCategory, searchQuery, sortBy]);

  const handleBook = (service: ServiceItem, tier?: any) => {
    if (onBookService) {
      onBookService(service, tier);
    } else {
      openBookingModal(service);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Make Up':
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
      case 'Skin Services':
      case 'Skin & Facial Therapy':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Hair Services':
      case 'Hair Care & Styling':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Color Services':
      case 'Hair Chemical Services':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case "Men's Executive Grooming":
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'Bridal & Pre-Bridal':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className={`w-full ${standalone ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto' : ''}`}>
      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6 space-y-4">
        
        {/* Gender Segment Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Salon Services Menu:
            </span>
          </div>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedGender('all');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedGender === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>All ({services.length})</span>
            </button>

            <button
              onClick={() => {
                setSelectedGender('women');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedGender === 'women'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Women</span>
            </button>

            <button
              onClick={() => {
                setSelectedGender('men');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedGender === 'men'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Men</span>
            </button>

            <button
              onClick={() => {
                setSelectedGender('bridal');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedGender === 'bridal'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Bridal</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search haircut, facial, keratin, bridal makeover..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="category">By Category</option>
              <option value="name">Service Name (A-Z)</option>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
              <option value="duration">Duration (Shortest)</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Banner for Deposit */}
      <div className="mb-5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>{advancePct}% Online Advance Deposit</strong> locks your appointment slot. Balance {balancePct}% is payable at the salon counter after service.
          </span>
        </div>
        <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {filteredServices.length} services available
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3.5 px-4 font-semibold">Service &amp; Photo</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-3 font-semibold text-center">Duration</th>
                <th className="py-3.5 px-4 font-semibold text-right">{advancePct}% Advance</th>
                <th className="py-3.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    No services found matching your search.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const advanceDisplay = `₹${Math.round((service.price * advancePct) / 100)}`;

                  return (
                    <tr 
                      key={service.id} 
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
                    >
                      {/* Service Info & Photo */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={service.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80'}
                              alt={service.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {service.name}
                              </span>
                              {service.popular && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Sparkles className="w-2.5 h-2.5" /> Popular
                                </span>
                              )}
                              
                              {/* Real-time availability indicator badge */}
                              {(() => {
                                const insight = getServiceAvailabilityInsight(appointments, service.durationMinutes);
                                if (insight.isUrgent) {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                                      <Flame className="w-2.5 h-2.5 fill-amber-500" />
                                      <span>Filling Fast Today</span>
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Available Today</span>
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(service.category)}`}>
                                {service.category}
                              </span>
                              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                                {service.gender}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 max-w-md">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-zinc-900 dark:text-white font-mono text-base">
                          {service.priceDisplay || `₹${service.price.toLocaleString()}`}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-3 align-top text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{service.durationMinutes} min</span>
                        </div>
                      </td>

                      {/* Advance Deposit (dynamic) */}
                      <td className="py-4 px-4 align-top text-right font-mono">
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          {advanceDisplay}
                        </div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          ({advancePct}% Deposit)
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {onToggleBundleService && (
                            <button
                              onClick={() => onToggleBundleService(service.id)}
                              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border ${
                                selectedBundleServiceIds.includes(service.id)
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10 hover:text-amber-600 border-zinc-200 dark:border-zinc-700'
                              }`}
                              title={selectedBundleServiceIds.includes(service.id) ? "Remove from bundle" : "Add to custom discount bundle"}
                            >
                              {selectedBundleServiceIds.includes(service.id) ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-500" />
                                  <span>In Bundle</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Bundle</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => handleBook(service)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card-Based View */}
      <div className="md:hidden space-y-3">
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm">
            No services found. Try a different search keyword.
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={service.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80'}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(service.category)}`}>
                      {service.category}
                    </span>
                    {(() => {
                      const insight = getServiceAvailabilityInsight(appointments, service.durationMinutes);
                      if (insight.isUrgent) {
                        return (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                            <Flame className="w-2.5 h-2.5 fill-amber-500" />
                            <span>Filling Fast</span>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Open Today</span>
                        </span>
                      );
                    })()}
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {service.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                      {service.priceDisplay || `₹${service.price.toLocaleString()}`}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      ({advancePct}% Adv: ₹{Math.round((service.price * advancePct) / 100)})
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {service.description}
              </p>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{service.durationMinutes} mins</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onToggleBundleService && (
                    <button
                      onClick={() => onToggleBundleService(service.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border ${
                        selectedBundleServiceIds.includes(service.id)
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {selectedBundleServiceIds.includes(service.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-500" />
                          <span>In Bundle</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Bundle</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleBook(service)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
