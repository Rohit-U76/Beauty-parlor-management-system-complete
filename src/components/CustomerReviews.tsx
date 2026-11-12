import React, { useState, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Quote,
  Sparkles,
  Filter,
  PlusCircle,
  ThumbsUp,
  Heart,
  Calendar,
  X,
  MessageSquare,
  Award,
  ArrowRight,
  User,
  MapPin,
  Search,
  Check,
  Pin
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Review, ServiceItem } from '../types';

interface CustomerReviewsProps {
  initialFilter?: string;
  limit?: number;
  showTitle?: boolean;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  initialFilter = 'All',
  limit,
  showTitle = true
}) => {
  const { reviews, addReview, updateReview, services, openBookingModal, settings, currentUser } = useSalon();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilter);
  const [minRating, setMinRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [userLikedReviews, setUserLikedReviews] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('modern_salon_user_liked_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New review form state
  const [formData, setFormData] = useState({
    clientName: '',
    rating: 5,
    serviceName: services[0]?.name || 'O3 Prof. Facial',
    comment: '',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80'
  });

  const categories = [
    'All',
    'Facials & Skin Care',
    'HD Make Up & Bridal',
    'Hair Chemical & Keratin',
    'Hair Cut & Styling',
    "Men's Grooming"
  ];

  const avatarPresets = [
    { label: 'Pooja K.', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Rohan S.', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80' },
    { label: 'Tanvi G.', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80' },
    { label: 'Sunil P.', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80' },
    { label: 'Sneha J.', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Amit D.', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80' }
  ];

  // Filtering reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      // Category filter
      if (selectedCategory !== 'All') {
        const sName = rev.serviceName.toLowerCase();
        if (selectedCategory === 'Facials & Skin Care') {
          if (!sName.includes('facial') && !sName.includes('skin') && !sName.includes('o3') && !sName.includes('glow')) return false;
        } else if (selectedCategory === 'HD Make Up & Bridal') {
          if (!sName.includes('make up') && !sName.includes('makeup') && !sName.includes('bridal') && !sName.includes('3d') && !sName.includes('4d') && !sName.includes('hd')) return false;
        } else if (selectedCategory === 'Hair Chemical & Keratin') {
          if (!sName.includes('keratin') && !sName.includes('rebonding') && !sName.includes('straightening') && !sName.includes('color') && !sName.includes('balayage')) return false;
        } else if (selectedCategory === 'Hair Cut & Styling') {
          if (!sName.includes('cut') && !sName.includes('hair') && !sName.includes('blow dry') && !sName.includes('styling')) return false;
        } else if (selectedCategory === "Men's Grooming") {
          if (!sName.includes('men') && !sName.includes('grooming') && !sName.includes('beard') && !sName.includes('fade')) return false;
        }
      }

      // Rating filter
      if (minRating > 0 && rev.rating < minRating) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = ((rev.clientName || (rev as any).userName || '')).toLowerCase().includes(q);
        const matchesService = (rev.serviceName || '').toLowerCase().includes(q);
        const matchesComment = (rev.comment || '').toLowerCase().includes(q);
        if (!matchesClient && !matchesService && !matchesComment) return false;
      }

      return true;
    });
  }, [reviews, selectedCategory, minRating, searchQuery]);

  // Sort reviews so pinned/featured reviews appear first
  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [filteredReviews]);

  const displayReviews = limit ? sortedReviews.slice(0, limit) : sortedReviews;

  // Rating Statistics calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { avg: 5.0, count5: 0, count4: 0, count3: 0, total: 0, pct5: 100, pct4: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    const count5 = reviews.filter(r => r.rating === 5).length;
    const count4 = reviews.filter(r => r.rating === 4).length;
    const count3 = reviews.filter(r => r.rating <= 3).length;
    return {
      avg,
      count5,
      count4,
      count3,
      total,
      pct5: Math.round((count5 / total) * 100),
      pct4: Math.round((count4 / total) * 100)
    };
  }, [reviews]);

  const handleHelpful = (id: string) => {
    const rev = reviews.find(r => r.id === id);
    if (!rev) return;

    const isLiked = !!userLikedReviews[id];
    const currentCount = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;
    const newCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    const nextLiked = { ...userLikedReviews, [id]: !isLiked };
    setUserLikedReviews(nextLiked);
    try {
      localStorage.setItem('modern_salon_user_liked_reviews', JSON.stringify(nextLiked));
    } catch {}

    updateReview(id, { helpfulCount: newCount });
    showToast(isLiked ? 'Removed helpful vote' : 'Marked review as helpful (+1)');
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAdmin) {
      showToast('🔒 Only salon administrators can pin reviews to the featured showcase.');
      return;
    }
    const rev = reviews.find(r => r.id === id);
    if (!rev) return;
    const newFeatured = !rev.featured;
    updateReview(id, { featured: newFeatured });
    showToast(newFeatured ? '📌 Pinned as Featured Review!' : 'Removed from Featured Reviews');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.comment.trim()) {
      alert('Please fill in your name and review details.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    addReview({
      clientName: formData.clientName.trim(),
      rating: formData.rating,
      serviceName: formData.serviceName,
      comment: formData.comment.trim(),
      date: todayStr,
      verifiedBooking: true,
      avatarUrl: formData.avatarUrl
    });

    setIsWriteModalOpen(false);
    setFormData({
      clientName: '',
      rating: 5,
      serviceName: services[0]?.name || 'O3 Prof. Facial',
      comment: '',
      verifiedBooking: true,
      avatarUrl: avatarPresets[0].url
    });

    showToast('Thank you! Your verified review has been published.');
  };

  const handleBookService = (serviceName: string) => {
    const match = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase()) || services[0];
    openBookingModal(match);
  };

  return (
    <div id="customer-reviews-section" className="space-y-8 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-zinc-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SECTION HEADER & SOCIAL PROOF METRICS */}
      {showTitle && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[11px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VERIFIED SOCIAL PROOF &amp; TESTIMONIALS</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100">
                Loved by Clients Across Mohol
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
                Read genuine ratings and verified service experiences from clients who booked with 10% advance deposit at Modern Unisex Salon.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-zinc-900 border border-purple-300 dark:border-yellow-500/40 hover:border-purple-400 dark:hover:border-yellow-400 text-purple-700 dark:text-yellow-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Write a Review</span>
              </button>
            </div>
          </div>

          {/* SOCIAL PROOF SUMMARY CARDS (Aggregates & Trust Badges) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {/* Aggregate Score Card */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col items-center justify-center text-yellow-400 shrink-0">
                <span className="font-bold text-lg leading-none">{stats.avg}</span>
                <div className="flex items-center text-[9px] mt-0.5">
                  <Star className="w-2.5 h-2.5 fill-yellow-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <span>Overall Client Score</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Based on {stats.total} verified reviews
                </div>
                <div className="text-[10px] text-yellow-500 font-mono mt-0.5">
                  {stats.pct5}% 5-Star Ratings
                </div>
              </div>
            </div>

            {/* 100% Verified Bookings */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100">
                  100% Verified Clients
                </div>
                <div className="text-[11px] text-zinc-400">
                  Validated salon visits in Mohol
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Anti-spam verified
                </div>
              </div>
            </div>

            {/* Advance Deposit Protection */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100">
                  10% Advance Guarantee
                </div>
                <div className="text-[11px] text-zinc-400">
                  Zero wait-time priority slot
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  90% balance paid at counter
                </div>
              </div>
            </div>

            {/* Google Maps Presence */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-100">
                  Mohol Prime Studio
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  B.N. Gund Complex, ICICI Bank
                </div>
                <a
                  href={settings.mapsUrl || "https://maps.app.goo.gl/CraeBa6gAjWA8o818"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium mt-0.5 inline-block"
                >
                  View Google Reviews →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#141418] border border-zinc-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0 mr-1 hidden sm:inline-block" />
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-yellow-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search & Min Rating */}
        <div className="flex items-center gap-2">
          {/* Rating filter */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 cursor-pointer"
          >
            <option value={0}>All Star Ratings</option>
            <option value={5}>⭐⭐⭐⭐⭐ (5 Stars Only)</option>
            <option value={4}>⭐⭐⭐⭐ (4+ Stars)</option>
          </select>

          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REVIEWS GRID (Social Proof Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {displayReviews.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center rounded-3xl bg-[#141418] border border-zinc-800 space-y-3">
            <Quote className="w-8 h-8 text-yellow-500 mx-auto opacity-50" />
            <div className="font-serif font-bold text-base text-zinc-200">No reviews found in this category</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Be the first to share your experience with this service at Modern Unisex Salon Mohol!
            </p>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write First Review</span>
            </button>
          </div>
        ) : (
          displayReviews.map((rev) => {
            const isLiked = !!userLikedReviews[rev.id];
            const helpfulCount = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;

            return (
              <div
                key={rev.id}
                className={`rounded-3xl bg-white dark:bg-[#131317] border p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-xl transition-all duration-300 group relative overflow-hidden ${
                  rev.featured
                    ? 'border-amber-400 dark:border-yellow-500/60 ring-1 ring-amber-400/30'
                    : 'border-purple-200/80 dark:border-zinc-800/90 hover:border-purple-300 dark:hover:border-yellow-500/40'
                }`}
              >
                {/* Decorative top quote mark */}
                <div className="absolute top-4 right-4 text-purple-100 dark:text-zinc-800 group-hover:text-purple-200 dark:group-hover:text-yellow-500/10 transition-colors pointer-events-none">
                  <Quote className="w-10 h-10" />
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Pinned Showcase Tag & Pin Action (Admin only) */}
                  <div className="flex items-center justify-between gap-2">
                    {rev.featured ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-yellow-500/20 text-amber-800 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/40 text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>Pinned to Featured</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400">Client Review</span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={(e) => handleTogglePin(rev.id, e)}
                        title={rev.featured ? "Unpin review (Admin)" : "Pin review to Featured (Admin)"}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          rev.featured
                            ? 'bg-amber-500/20 text-amber-600 dark:text-yellow-400 border border-amber-400/40'
                            : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${rev.featured ? 'fill-amber-400 text-amber-500 rotate-45' : ''}`} />
                        <span>{rev.featured ? 'Pinned (Admin)' : 'Pin'}</span>
                      </button>
                    )}
                  </div>

                  {/* Top Client info header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-300 dark:border-yellow-500/30 bg-purple-50 dark:bg-zinc-800 shrink-0">
                        <img
                          src={rev.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80'}
                          alt={rev.clientName || (rev as any).userName || 'Client'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-purple-700 dark:group-hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                          <span>{rev.clientName || (rev as any).userName || 'Valued Client'}</span>
                          {rev.verifiedBooking && (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-[10px]" title="Verified Appointment Booking">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          <span>{rev.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-amber-600 dark:text-yellow-400 text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 dark:fill-yellow-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  {/* Service Tag & Quick Book Button */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-100 dark:border-zinc-800/60">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-purple-700 dark:text-yellow-400 truncate max-w-[200px]">
                      {rev.serviceName}
                    </span>
                    <button
                      onClick={() => handleBookService(rev.serviceName)}
                      className="text-[10px] font-bold text-purple-600 dark:text-zinc-400 hover:text-purple-800 dark:hover:text-yellow-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span>Book Service</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Testimonial Quote */}
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic pt-1">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Footer with Verified badge & Helpful button */}
                <div className="pt-3 border-t border-purple-100 dark:border-zinc-800/80 flex items-center justify-between text-xs relative z-10">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified {settings.advancePercentage || 10}% Deposit Visit</span>
                  </div>

                  <button
                    onClick={() => handleHelpful(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-purple-100 dark:bg-yellow-500/20 text-purple-800 dark:text-yellow-400 border border-purple-300 dark:border-yellow-500/40 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${isLiked ? 'text-purple-700 dark:text-yellow-400 fill-purple-700 dark:fill-yellow-400' : ''}`} />
                    <span>Helpful ({helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BOTTOM SOCIAL PROOF CALLOUT */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-50/90 via-white to-purple-50/90 dark:from-[#17150d] dark:via-[#141418] dark:to-[#17150d] border border-purple-200/90 dark:border-yellow-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-purple-900 dark:text-amber-400 uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-purple-100/90 dark:bg-amber-400/10 border border-purple-300/80 dark:border-amber-400/30 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-amber-400" />
            <span>Ready for Your Transformation?</span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Certified Master Stylists &amp; 100% Genuine Branded Care
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl">
            Experience premium haircuts, Keratin therapies, luxury Hydra-facials, and signature bridal makeovers at Mohol's premier unisex destination.
          </p>
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#141418] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0e0e11] border-b border-zinc-800 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                    Write a Verified Client Review
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Modern Unisex Salon • Mohol Studio
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReview} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Your Overall Rating:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/60 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-yellow-400 ml-2">
                    {formData.rating} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Your Name (e.g. Pooja Kadam, Mohol):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Service You Received:
                </label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-yellow-500 cursor-pointer"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name} ({srv.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Preset Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Choose Profile Avatar:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                        formData.avatarUrl === preset.url
                          ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                          : 'border-zinc-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment / Review Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Your Review &amp; Experience:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about the cleanliness, stylist precision, results, or 10% advance booking ease..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-none"
                />
              </div>

              {/* Verification Info */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Your review will appear with the "Verified Client" badge.</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-yellow-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
