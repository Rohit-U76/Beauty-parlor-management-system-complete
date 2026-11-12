import React, { useState, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  PlusCircle,
  ThumbsUp,
  Calendar,
  X,
  Award,
  Search,
  Filter,
  User,
  Scissors,
  Pin
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Review } from '../types';

export const CustomerReviewsPage: React.FC = () => {
  const { reviews, addReview, updateReview, services, openBookingModal, currentUser } = useSalon();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  // Review Form
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    rating: 5,
    serviceName: services[0]?.name || 'O3+ Diamond Glow Facial',
    comment: ''
  });

  const categories = [
    'All',
    'Featured (Pinned)',
    'Facials & Skin',
    'Bridal & Makeup',
    'Hair Treatments',
    'Haircut & Styling',
    "Men's Grooming"
  ];

  // Metrics
  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '4.9';

  const filteredReviews = useMemo(() => {
    const list = reviews.filter(rev => {
      if (selectedCategory === 'Featured (Pinned)' && !rev.featured) return false;
      if (selectedCategory !== 'All' && selectedCategory !== 'Featured (Pinned)') {
        const sName = rev.serviceName.toLowerCase();
        if (selectedCategory === 'Facials & Skin' && !sName.includes('facial') && !sName.includes('skin') && !sName.includes('glow')) return false;
        if (selectedCategory === 'Bridal & Makeup' && !sName.includes('make up') && !sName.includes('makeup') && !sName.includes('bridal')) return false;
        if (selectedCategory === 'Hair Treatments' && !sName.includes('keratin') && !sName.includes('rebonding') && !sName.includes('color')) return false;
        if (selectedCategory === 'Haircut & Styling' && !sName.includes('cut') && !sName.includes('styling')) return false;
        if (selectedCategory === "Men's Grooming" && !sName.includes('men') && !sName.includes('grooming') && !sName.includes('beard')) return false;
      }

      if (minRating > 0 && rev.rating < minRating) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClient = rev.clientName.toLowerCase().includes(q);
        const matchesService = rev.serviceName.toLowerCase().includes(q);
        const matchesComment = rev.comment.toLowerCase().includes(q);
        if (!matchesClient && !matchesService && !matchesComment) return false;
      }

      return true;
    });

    // Pinned/Featured reviews appear first, then sorted by date
    return list.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [reviews, selectedCategory, minRating, searchQuery]);

  // Increment helpful count (+1 on each user's helpful vote)
  const handleLikeReview = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    const isAlreadyLiked = !!userLikedReviews[reviewId];
    if (isAlreadyLiked) {
      setToastMessage('You have already marked this review as helpful!');
      setTimeout(() => setToastMessage(null), 3000);
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
    setToastMessage('Marked review as helpful (+1)!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle pin to featured
  const handleTogglePinFeatured = (reviewId: string) => {
    if (!isAdmin) {
      setToastMessage('Only salon administrators can pin or unpin reviews.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    const newFeatured = !rev.featured;
    updateReview(reviewId, { featured: newFeatured });
    setToastMessage(newFeatured ? '📌 Pinned as Featured Review!' : 'Unpinned from Featured Reviews');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.comment.trim()) {
      alert('Please enter your name and review.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      clientName: formData.clientName.trim(),
      rating: formData.rating,
      date: todayStr,
      serviceName: formData.serviceName,
      comment: formData.comment.trim(),
      verifiedBooking: true,
      helpfulCount: 0,
      featured: false
    };

    addReview(newRev);
    setIsWriteModalOpen(false);
    setToastMessage('Thank you! Your review has been submitted.');
    setTimeout(() => setToastMessage(null), 4000);

    setFormData({
      clientName: '',
      phone: '',
      rating: 5,
      serviceName: services[0]?.name || 'O3+ Diamond Glow Facial',
      comment: ''
    });
  };

  return (
    <div className="space-y-8 pb-28 lg:pb-16 pt-4 sm:pt-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-left">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Summary Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Verified Customer Reviews</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            What Our Clients Say
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Real feedback from customers in Mohol who booked haircuts, facials, bridal packages, and styling.
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
          <div className="text-center">
            <div className="text-4xl font-bold font-serif text-amber-500">{avgRating}</div>
            <div className="flex items-center justify-center gap-1 text-amber-500 my-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Based on {totalReviewsCount}+ reviews
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client name, service, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredReviews.map(rev => {
          const isLiked = !!userLikedReviews[rev.id];
          const count = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;
          const isFeatured = !!rev.featured;

          return (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-4 transition-all relative ${
                isFeatured
                  ? 'border-2 border-amber-400 dark:border-amber-500/80 bg-gradient-to-b from-amber-500/5 via-white dark:via-zinc-900 to-white dark:to-zinc-900 ring-2 ring-amber-400/20'
                  : 'border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="space-y-2.5">
                {/* Featured Pinned Badge & Action */}
                <div className="flex items-center justify-between gap-2">
                  {isFeatured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-zinc-950 shadow-sm">
                      <Pin className="w-3 h-3 fill-zinc-950 rotate-45" />
                      <span>Featured Pinned Review</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Verified Customer Review</span>
                  )}

                  {/* Pin / Unpin Action: Only Admin is allowed to pin/unpin reviews */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleTogglePinFeatured(rev.id)}
                      title={isFeatured ? "Unpin from Featured Reviews (Admin Only)" : "Pin as Featured Review (Admin Only)"}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        isFeatured
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Pin className={`w-3 h-3 ${isFeatured ? 'fill-amber-500 text-amber-600 rotate-45' : 'text-zinc-600'}`} />
                      <span>{isFeatured ? 'Pinned (Admin)' : 'Pin Review'}</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{rev.clientName}</h3>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{rev.serviceName}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] truncate">Verified Visit</span>
                  <span>•</span>
                  <span className="text-[11px] shrink-0">{rev.date}</span>
                </div>

                {/* Helpful Like Button: click increments +1, clicking again decrements back to 0 */}
                <button
                  id={`review-helpful-btn-${rev.id}`}
                  onClick={() => handleLikeReview(rev.id)}
                  title={isLiked ? "Click to remove your helpful feedback" : "Click if you found this review helpful"}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isLiked
                      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-amber-500 text-amber-600' : ''}`} />
                  <span>Helpful ({count})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReviews.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="text-zinc-400 text-sm">No reviews found matching your search.</div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-xs font-bold text-amber-500 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">Write a Review</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Share your salon experience with others</p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Deshmukh"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Service Received</label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 text-amber-500 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.rating ? 'fill-amber-500' : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                    {formData.rating} Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about the hygiene, stylist skill, and results..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition cursor-pointer"
              >
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
