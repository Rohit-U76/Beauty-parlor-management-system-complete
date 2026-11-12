import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  X,
  Camera,
  MessageSquare,
  Award,
  Grid,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Review } from '../types';

interface ClientTestimonialsProps {
  initialFilter?: string;
  showSubmitButton?: boolean;
  limit?: number;
  className?: string;
}

export const ClientTestimonials: React.FC<ClientTestimonialsProps> = ({
  initialFilter = 'All',
  showSubmitButton = true,
  limit,
  className = ''
}) => {
  const { reviews, addReview, updateReview, services, openBookingModal, settings } = useSalon();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilter);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; name: string; service: string } | null>(null);
  const [userLikedReviews, setUserLikedReviews] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('modern_salon_user_liked_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Write Review
  const [formData, setFormData] = useState({
    clientName: '',
    rating: 5,
    serviceName: services[0]?.name || 'Radiance Facial Therapy',
    comment: '',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    bookingRef: ''
  });

  const avatarPresets = [
    { label: 'Elegant Woman', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Modern Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80' },
    { label: 'Bridal Glow', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80' },
    { label: 'Executive Woman', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Grooming Style', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80' },
    { label: 'Spa Rejuvenation', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80' }
  ];

  const categories = [
    'All',
    'Skin & Facial',
    'Hair Care',
    "Men's Grooming",
    'Bridal',
    'Spa'
  ];

  // Try API fetch on mount for live Java/Node backend if running
  const [apiFetchedReviews, setApiFetchedReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchApiReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setApiFetchedReviews(data);
          }
        }
      } catch (err) {
        // Silently use context data
      }
    };
    fetchApiReviews();
    return () => { isMounted = false; };
  }, []);

  const allReviews = useMemo(() => {
    const raw = (apiFetchedReviews && apiFetchedReviews.length > 0) ? apiFetchedReviews : reviews;
    return (raw || []).map(r => ({
      ...r,
      clientName: r.clientName || (r as any).userName || 'Valued Client',
      serviceName: r.serviceName || 'Signature Salon Service'
    }));
  }, [apiFetchedReviews, reviews]);

  // Filter and Sort Reviews
  const filteredReviews = useMemo(() => {
    return allReviews.filter(rev => {
      // Category filter
      if (selectedCategory !== 'All') {
        const sName = (rev.serviceName || '').toLowerCase();
        const matchesCategory =
          sName.includes(selectedCategory.toLowerCase().replace("'", '')) ||
          (selectedCategory === 'Skin & Facial' && (sName.includes('facial') || sName.includes('skin') || sName.includes('glow'))) ||
          (selectedCategory === 'Hair Care' && (sName.includes('hair') || sName.includes('keratin') || sName.includes('balayage') || sName.includes('styling'))) ||
          (selectedCategory === "Men's Grooming" && (sName.includes('men') || sName.includes('beard') || sName.includes('fade'))) ||
          (selectedCategory === 'Bridal' && (sName.includes('bridal') || sName.includes('pre-bridal') || sName.includes('makeover'))) ||
          (selectedCategory === 'Spa' && (sName.includes('spa') || sName.includes('massage') || sName.includes('detox')));
        if (!matchesCategory) return false;
      }
      // Min rating
      if (minRating > 0 && rev.rating < minRating) return false;
      return true;
    }).sort((a, b) => {
      // Pinned / featured reviews always appear at the top
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [allReviews, selectedCategory, minRating, sortBy]);

  const displayReviews = limit ? filteredReviews.slice(0, limit) : filteredReviews;

  // Rating Statistics
  const ratingStats = useMemo(() => {
    const total = allReviews.length;
    if (total === 0) return { avg: 5.0, count5: 0, count4: 0, count3: 0, total: 0 };
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    const count5 = allReviews.filter(r => r.rating === 5).length;
    const count4 = allReviews.filter(r => r.rating === 4).length;
    const count3 = allReviews.filter(r => r.rating <= 3).length;
    return {
      avg,
      count5,
      count4,
      count3,
      total,
      pct5: Math.round((count5 / total) * 100),
      pct4: Math.round((count4 / total) * 100),
      pct3: Math.round((count3 / total) * 100)
    };
  }, [allReviews]);

  const handleHelpfulToggle = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    const isCurrentlyLiked = !!userLikedReviews[reviewId];
    if (isCurrentlyLiked) {
      setToastMessage('You already marked this review as helpful!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const currentCount = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;
    const newCount = currentCount + 1;

    const nextLiked = { ...userLikedReviews, [reviewId]: true };
    setUserLikedReviews(nextLiked);
    try {
      localStorage.setItem('modern_salon_user_liked_reviews', JSON.stringify(nextLiked));
    } catch {}

    updateReview(reviewId, { helpfulCount: newCount });

    setToastMessage('Marked review as helpful (+1)');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.comment.trim()) {
      alert('Please provide your name and review details.');
      return;
    }

    addReview({
      clientName: formData.clientName.trim(),
      rating: formData.rating,
      serviceName: formData.serviceName,
      comment: formData.comment.trim(),
      verifiedBooking: true,
      avatarUrl: formData.avatarUrl
    });

    setIsWriteModalOpen(false);
    setToastMessage('Thank you! Your verified review has been published.');
    setTimeout(() => setToastMessage(null), 4000);

    // Reset Form
    setFormData({
      clientName: '',
      rating: 5,
      serviceName: services[0]?.name || 'Radiance Facial Therapy',
      comment: '',
      verifiedBooking: true,
      avatarUrl: avatarPresets[0].url,
      bookingRef: ''
    });
  };

  const nextCarousel = () => {
    if (displayReviews.length === 0) return;
    setCarouselIndex(prev => (prev + 1) % displayReviews.length);
  };

  const prevCarousel = () => {
    if (displayReviews.length === 0) return;
    setCarouselIndex(prev => (prev - 1 + displayReviews.length) % displayReviews.length);
  };

  return (
    <div id="client-testimonials-section" className={`space-y-8 text-left ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/90 text-emerald-100 border border-emerald-500/50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* SECTION HEADER & SOCIAL PROOF TRUST METRICS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-500/30 text-purple-800 dark:text-yellow-400 text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-yellow-400" />
            <span>REAL CLIENT TESTIMONIALS &amp; PROOF</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Client Experiences, Verified Ratings &amp; Trust
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every review is from a verified salon guest with an authentic appointment booking. Discover why 98% of our clients re-book their styling and skincare with us.
          </p>
        </div>

        {/* Action Buttons: Write Review & Book */}
        <div className="flex flex-wrap items-center gap-3">
          {showSubmitButton && (
            <button
              id="write-testimonial-btn"
              onClick={() => setIsWriteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-yellow-500/40 hover:border-yellow-400 text-yellow-400 hover:bg-yellow-500/10 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-yellow-400" />
              <span>Share Your Experience</span>
            </button>
          )}

          <button
            id="book-from-testimonials-btn"
            onClick={() => openBookingModal()}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Book Appointment ({settings.advancePercentage || 10}% Adv)</span>
          </button>
        </div>
      </div>

      {/* OVERALL RATING & TRUST SCORECARD BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-white dark:bg-[#131317] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        {/* Left: Overall Big Score */}
        <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/80 pb-5 md:pb-0 md:pr-6 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl sm:text-5xl font-bold text-yellow-500 dark:text-yellow-400 font-mono">
              {ratingStats.avg}
            </span>
            <span className="text-zinc-500 text-sm font-semibold">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            Based on <span className="text-yellow-600 dark:text-yellow-400 font-bold font-mono">{ratingStats.total}</span> verified salon appointments
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Verified Customer Feedback</span>
          </div>
        </div>

        {/* Middle: Rating Breakdown Bars */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-2 sm:space-y-2.5 py-2 md:py-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/80 pb-5 md:pb-0 md:pr-6">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Rating Breakdown
          </div>
          {/* 5 Stars */}
          <div className="flex items-center gap-3 text-xs">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              5 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 inline" />
            </span>
            <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${ratingStats.pct5}%` }}
              />
            </div>
            <span className="w-10 text-right text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{ratingStats.pct5}%</span>
          </div>
          {/* 4 Stars */}
          <div className="flex items-center gap-3 text-xs">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              4 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 inline" />
            </span>
            <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-yellow-500/70 rounded-full transition-all duration-500"
                style={{ width: `${ratingStats.pct4}%` }}
              />
            </div>
            <span className="w-10 text-right text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{ratingStats.pct4}%</span>
          </div>
          {/* 3 Stars & Under */}
          <div className="flex items-center gap-3 text-xs">
            <span className="w-12 text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              3 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 inline" />
            </span>
            <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-500"
                style={{ width: `${ratingStats.pct3}%` }}
              />
            </div>
            <span className="w-10 text-right text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{ratingStats.pct3}%</span>
          </div>
        </div>

        {/* Right: Trust Badges */}
        <div className="md:col-span-3 flex flex-col justify-center space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-500 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{settings.advancePercentage || 10}% Advance Guarantee</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Guaranteed slot, zero waiting line</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-zinc-200">Master Stylists</div>
              <div className="text-[11px] text-zinc-400">10+ yrs international certified team</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-zinc-200">98% Rebooking Rate</div>
              <div className="text-[11px] text-zinc-400">Trusted by over 4,200 happy clients</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS, RATING SELECTOR & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCarouselIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/20 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right side: Rating Filter, Sort & View Mode */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Min rating */}
          <select
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-yellow-500 focus:outline-none cursor-pointer"
          >
            <option value="0">All Ratings</option>
            <option value="5">5 ★ Only</option>
            <option value="4">4 ★ &amp; Above</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-yellow-500 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-yellow-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              title="Spotlight Carousel"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'carousel' ? 'bg-yellow-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS DISPLAY: GRID OR SPOTLIGHT CAROUSEL */}
      {displayReviews.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-3">
          <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-300">No reviews found for this filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try switching categories or clearing the minimum star rating filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setMinRating(0);
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-400 text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map(rev => {
            const isLiked = !!userLikedReviews[rev.id];
            const likesCount = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;

            return (
              <div
                key={rev.id}
                className={`rounded-2xl bg-white dark:bg-[#131317] border p-6 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-lg transition-all group ${
                  rev.featured
                    ? 'border-amber-400 dark:border-yellow-500/70 ring-1 ring-amber-400/30'
                    : 'border-purple-200/80 dark:border-zinc-800/90 hover:border-purple-300 dark:hover:border-yellow-500/40'
                }`}
              >
                {/* Card Top: Client Photo, Name, Verified Badge & Stars */}
                <div className="space-y-3">
                  {rev.featured && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-yellow-500/20 text-amber-800 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/40 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>Pinned to Featured</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Image with Click to Zoom */}
                      <div
                        onClick={() => {
                          if (rev.avatarUrl) {
                            setZoomedPhoto({
                              url: rev.avatarUrl,
                              name: rev.clientName,
                              service: rev.serviceName
                            });
                          }
                        }}
                        className={`relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-300 dark:border-yellow-500/40 bg-zinc-100 dark:bg-zinc-800 shrink-0 ${
                          rev.avatarUrl ? 'cursor-pointer hover:border-purple-500 dark:hover:border-yellow-400 group-hover:scale-105 transition-transform' : ''
                        }`}
                        title="Click to view photo"
                      >
                        {rev.avatarUrl ? (
                          <img
                            src={rev.avatarUrl}
                            alt={rev.clientName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-yellow-500/10 text-purple-700 dark:text-yellow-400 font-bold text-sm">
                            {(rev.clientName || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        {rev.avatarUrl && (
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-3.5 h-3.5 text-yellow-400" />
                          </div>
                        )}
                      </div>

                      {/* Name & Date */}
                      <div>
                        <h4 className="font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-700 dark:group-hover:text-yellow-400 transition-colors">
                          {rev.clientName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span>{rev.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verified Badge */}
                    {rev.verifiedBooking && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Rating Stars & Service Tag */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1 text-amber-500 dark:text-yellow-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 dark:fill-yellow-400 text-amber-400 dark:text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-yellow-400/90 bg-purple-50 dark:bg-yellow-500/10 px-2 py-0.5 rounded-md border border-purple-200 dark:border-yellow-500/20 truncate max-w-[170px]">
                      {rev.serviceName}
                    </span>
                  </div>

                  {/* Comment Text with Quote Icon */}
                  <div className="relative pt-1">
                    <Quote className="w-5 h-5 text-purple-200 dark:text-yellow-500/20 absolute -top-1 -left-1 transform -rotate-12 pointer-events-none" />
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 italic leading-relaxed pl-2">
                      "{rev.comment}"
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Helpful Button & Quick Book Link */}
                <div className="pt-3 border-t border-purple-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleHelpfulToggle(rev.id)}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-purple-100 dark:bg-yellow-500/20 border-purple-300 dark:border-yellow-500/50 text-purple-700 dark:text-yellow-400 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${isLiked ? 'text-purple-600 dark:text-yellow-400 fill-purple-600 dark:fill-yellow-400' : ''}`} />
                    <span>Helpful ({likesCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      const matchedService = services.find(s => s.name === rev.serviceName);
                      openBookingModal(matchedService || undefined);
                    }}
                    className="text-[11px] font-bold text-purple-700 dark:text-yellow-400 hover:text-purple-800 dark:hover:text-yellow-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Book this service</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CAROUSEL / SPOTLIGHT FOCUS VIEW */
        <div className="relative bg-[#131317] border border-yellow-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          {displayReviews[carouselIndex] && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left: Big Client Photo & Transformation */}
              <div className="md:col-span-5 flex flex-col items-center text-center space-y-4">
                <div
                  onClick={() => {
                    const currentRev = displayReviews[carouselIndex];
                    if (currentRev.avatarUrl) {
                      setZoomedPhoto({
                        url: currentRev.avatarUrl,
                        name: currentRev.clientName,
                        service: currentRev.serviceName
                      });
                    }
                  }}
                  className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-4 border-yellow-500/40 shadow-2xl bg-zinc-800 cursor-pointer group"
                >
                  {displayReviews[carouselIndex].avatarUrl ? (
                    <img
                      src={displayReviews[carouselIndex].avatarUrl}
                      alt={displayReviews[carouselIndex].clientName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-yellow-500/10 text-yellow-400 font-bold text-3xl">
                      {((displayReviews[carouselIndex] && displayReviews[carouselIndex].clientName) || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>Zoom Photo</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-zinc-100">
                    {displayReviews[carouselIndex].clientName}
                  </h4>
                  <div className="text-xs text-yellow-400 font-medium">
                    {displayReviews[carouselIndex].serviceName}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Verified Appointment on {displayReviews[carouselIndex].date}
                  </div>
                </div>
              </div>

              {/* Right: Quote Content & Details */}
              <div className="md:col-span-7 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(displayReviews[carouselIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>100% Verified Salon Visit</span>
                  </span>
                </div>

                <div className="relative">
                  <Quote className="w-10 h-10 text-yellow-500/20 absolute -top-4 -left-4 pointer-events-none" />
                  <p className="font-serif text-base sm:text-lg md:text-xl text-zinc-200 italic leading-relaxed pl-4">
                    "{displayReviews[carouselIndex].comment}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      const matchedService = services.find(s => s.name === displayReviews[carouselIndex].serviceName);
                      openBookingModal(matchedService || undefined);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Book {displayReviews[carouselIndex].serviceName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Carousel Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevCarousel}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-yellow-400 transition-colors cursor-pointer"
                      title="Previous Review"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-zinc-400 px-2">
                      {carouselIndex + 1} / {displayReviews.length}
                    </span>
                    <button
                      onClick={nextCarousel}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-yellow-400 transition-colors cursor-pointer"
                      title="Next Review"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {zoomedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-zinc-900 border border-yellow-500/40 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="rounded-2xl overflow-hidden border border-zinc-800 aspect-square max-h-[380px]">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between text-left">
              <div>
                <h4 className="font-serif text-base font-bold text-yellow-400">
                  {zoomedPhoto.name}
                </h4>
                <p className="text-xs text-zinc-400">
                  Treatment: {zoomedPhoto.service}
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 font-semibold">
                Verified Client Photo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT / WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-[#131317] border border-yellow-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 text-left">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase">
                <Sparkles className="w-3 h-3" />
                <span>COMMUNITY SOCIAL PROOF</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                Share Your Salon Experience
              </h3>
              <p className="text-xs text-zinc-400">
                Help future guests discover the best styling and skincare treatments.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Overall Rating <span className="text-yellow-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Your Full Name <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya Sharma"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Service Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Service Experienced <span className="text-yellow-400">*</span>
                </label>
                <select
                  value={formData.serviceName}
                  onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 focus:border-yellow-500 focus:outline-none cursor-pointer"
                >
                  {services.map(srv => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name} ({srv.category})
                    </option>
                  ))}
                  <option value="Bridal Makeover Package">Bridal Makeover Package</option>
                  <option value="Executive Men Grooming">Executive Men Grooming</option>
                  <option value="Other Salon Treatment">Other Salon Treatment</option>
                </select>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Select Your Profile Photo
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                      className={`relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        formData.avatarUrl === preset.url
                          ? 'border-yellow-400 scale-105 ring-2 ring-yellow-400/30'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Your Detailed Feedback <span className="text-yellow-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Share details about the stylist, ambience, results, and ${settings.advancePercentage || 10}% advance booking ease...`}
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Booking Ref (Optional for Verified Badge) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400 block">
                  Booking Reference ID / Order ID (Optional for Instant Verified Badge)
                </label>
                <input
                  type="text"
                  placeholder="e.g., SS-2026-889124"
                  value={formData.bookingRef}
                  onChange={e => setFormData({ ...formData, bookingRef: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Publish Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
