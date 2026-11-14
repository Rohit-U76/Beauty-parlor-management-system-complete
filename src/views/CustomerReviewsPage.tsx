import React, { useState, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  PlusCircle,
  ThumbsUp,
  X,
  Award,
  Search,
  UserCheck,
  Pin
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Review } from '../types';

export const CustomerReviewsPage: React.FC = () => {
  const { reviews, addReview, updateReview, services, staffMembers, currentUser } = useSalon();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Filters & State
  const [reviewTab, setReviewTab] = useState<'ALL' | 'SALON' | 'STAFF'>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
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

  // Review Form (supports both Salon/Service & Separate Staff Rating)
  const [formData, setFormData] = useState({
    reviewType: 'SALON' as 'SALON' | 'STAFF',
    clientName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    rating: 5,
    staffRating: 5,
    staffId: staffMembers[0]?.id || '',
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

  // Helper to check if a review belongs to a staff member
  const matchesStaffMember = (rev: Review, staffId: string, staffName: string) => {
    if (rev.staffId && rev.staffId === staffId) return true;
    const revStaff = (rev.staffName || rev.stylistName || '').toLowerCase().trim();
    const target = staffName.toLowerCase().trim();
    if (!revStaff || !target) return false;
    return revStaff === target || revStaff.includes(target) || target.includes(revStaff);
  };

  // Staff Ratings Scorecard
  const staffRatingsSummary = useMemo(() => {
    return staffMembers.map(m => {
      const matched = reviews.filter(r => matchesStaffMember(r, m.id, m.name));
      const staffCount = matched.length;
      const avg = staffCount > 0
        ? (matched.reduce((sum, r) => sum + (r.staffRating || r.stylistSkillRating || r.rating || 5), 0) / staffCount).toFixed(1)
        : (m.rating || 4.9).toFixed(1);
      return {
        ...m,
        liveReviewCount: staffCount,
        liveAvgRating: avg
      };
    });
  }, [staffMembers, reviews]);

  // Metrics separated by Salon vs Staff
  const salonReviewsList = useMemo(
    () => reviews.filter(r => r.reviewType !== 'STAFF'),
    [reviews]
  );
  const staffReviewsList = useMemo(
    () => reviews.filter(r => r.reviewType === 'STAFF' || Boolean(r.staffId || r.staffName)),
    [reviews]
  );

  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0';
  const avgStaffOverallRating = staffReviewsList.length > 0
    ? (staffReviewsList.reduce((acc, r) => acc + (r.staffRating || r.stylistSkillRating || r.rating), 0) / staffReviewsList.length).toFixed(1)
    : staffRatingsSummary.length > 0
      ? (staffRatingsSummary.reduce((acc, s) => acc + Number(s.liveAvgRating), 0) / staffRatingsSummary.length).toFixed(1)
      : '4.9';

  const filteredReviews = useMemo(() => {
    const list = reviews.filter(rev => {
      if (reviewTab === 'SALON' && rev.reviewType === 'STAFF') return false;
      if (reviewTab === 'STAFF' && rev.reviewType !== 'STAFF' && !rev.staffId && !rev.staffName) return false;

      if (selectedStaffFilter !== 'ALL') {
        const chosenStaff = staffMembers.find(s => s.id === selectedStaffFilter);
        if (chosenStaff && !matchesStaffMember(rev, chosenStaff.id, chosenStaff.name)) {
          return false;
        }
      }

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
        const matchesStaff = (rev.staffName || rev.stylistName || '').toLowerCase().includes(q);
        const matchesComment = rev.comment.toLowerCase().includes(q);
        if (!matchesClient && !matchesService && !matchesStaff && !matchesComment) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [reviews, reviewTab, selectedStaffFilter, staffMembers, selectedCategory, minRating, searchQuery]);

  // Toggle helpful count (+1 / -1)
  const handleLikeReview = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    const isAlreadyLiked = !!userLikedReviews[reviewId];
    const currentCount = typeof rev.helpfulCount === 'number' ? rev.helpfulCount : 0;
    const newCount = isAlreadyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    const nextLiked = { ...userLikedReviews, [reviewId]: !isAlreadyLiked };
    setUserLikedReviews(nextLiked);
    try {
      localStorage.setItem('modern_salon_user_liked_reviews', JSON.stringify(nextLiked));
    } catch {}

    updateReview(reviewId, { helpfulCount: newCount });
    setToastMessage(isAlreadyLiked ? 'Removed helpful vote.' : 'Marked review as helpful (+1)!');
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
    setToastMessage(newFeatured ? 'Pinned as Featured Review!' : 'Unpinned from Featured Reviews');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenWriteModal = (defaultType: 'SALON' | 'STAFF', staffId?: string) => {
    setFormData({
      reviewType: defaultType,
      clientName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      rating: 5,
      staffRating: 5,
      staffId: staffId || staffMembers[0]?.id || '',
      serviceName: services[0]?.name || 'O3+ Diamond Glow Facial',
      comment: ''
    });
    setIsWriteModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.comment.trim()) {
      return;
    }

    const chosenStaff = staffMembers.find(s => s.id === formData.staffId);
    const isStaffMode = formData.reviewType === 'STAFF';
    const effectiveRating = isStaffMode ? formData.staffRating : formData.rating;

    const todayStr = new Date().toISOString().split('T')[0];
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      clientName: formData.clientName.trim(),
      rating: effectiveRating,
      date: todayStr,
      serviceName: formData.serviceName,
      comment: formData.comment.trim(),
      verifiedBooking: true,
      helpfulCount: 0,
      featured: false,
      reviewType: formData.reviewType,
      staffId: chosenStaff?.id || undefined,
      staffName: chosenStaff?.name || undefined,
      stylistName: chosenStaff?.name || undefined,
      staffRating: chosenStaff ? formData.staffRating : undefined,
      stylistSkillRating: chosenStaff ? formData.staffRating : effectiveRating
    };

    addReview(newRev);
    setIsWriteModalOpen(false);
    setToastMessage(
      isStaffMode && chosenStaff
        ? `Thank you! Your ${formData.staffRating}★ rating for ${chosenStaff.name} has been published.`
        : 'Thank you! Your salon review has been submitted.'
    );
    setTimeout(() => setToastMessage(null), 4000);
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
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Verified Salon &amp; Staff Ratings</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Client Reviews &amp; Specialist Ratings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Browse both overall Modern Unisex Salon reviews and dedicated ratings for individual stylists, beauticians, and skin specialists in Mohol.
          </p>
        </div>

        {/* Dual Score Cards: Salon Rating & Staff Rating */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0 w-full lg:w-auto">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Salon Rating</div>
              <div className="text-3xl font-bold font-serif text-amber-500">{avgRating}</div>
              <div className="flex items-center justify-center gap-0.5 text-amber-500 my-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-3.5 h-3.5 fill-amber-500" />
                ))}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {salonReviewsList.length} salon reviews
              </div>
            </div>

            <div className="h-14 w-px bg-zinc-200 dark:bg-zinc-700" />

            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">Staff Rating</div>
              <div className="text-3xl font-bold font-serif text-purple-600 dark:text-purple-400">{avgStaffOverallRating}</div>
              <div className="flex items-center justify-center gap-0.5 text-purple-500 my-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-3.5 h-3.5 fill-purple-500" />
                ))}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {staffReviewsList.length} staff ratings
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2">
            <button
              type="button"
              id="write-salon-review-btn"
              onClick={() => handleOpenWriteModal('SALON')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Review Salon</span>
            </button>
            <button
              type="button"
              id="write-staff-review-btn"
              onClick={() => handleOpenWriteModal('STAFF')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Rate a Staff Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEPARATE STAFF RATINGS SCORECARD STRIP */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-purple-200/80 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600 dark:text-amber-400" />
              <span>Specialist Staff Ratings &amp; Reviews</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click any stylist or specialist to filter their reviews, or rate them directly.
            </p>
          </div>
          {selectedStaffFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStaffFilter('ALL')}
              className="text-xs font-bold text-purple-600 dark:text-amber-400 hover:underline self-start sm:self-auto cursor-pointer"
            >
              Show All Staff
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {staffRatingsSummary.map(member => {
            const isSelected = selectedStaffFilter === member.id;
            return (
              <div
                key={member.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedStaffFilter('ALL');
                  } else {
                    setSelectedStaffFilter(member.id);
                    setReviewTab('STAFF');
                  }
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-purple-600 dark:border-amber-500 bg-purple-50 dark:bg-amber-500/10 ring-1 ring-purple-600/30 dark:ring-amber-500/30'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 hover:border-purple-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-11 h-11 rounded-xl object-cover border border-purple-200 dark:border-zinc-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">{member.name}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{member.role}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        {member.liveAvgRating}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        ({member.liveReviewCount > 0 ? `${member.liveReviewCount} staff review${member.liveReviewCount > 1 ? 's' : ''}` : `${member.reviewsCount} verified`})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenWriteModal('STAFF', member.id);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Rate
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEW TYPE TABS (ALL vs SALON vs STAFF) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'ALL', label: `All Reviews (${reviews.length})` },
            { id: 'SALON', label: `Salon & Service (${salonReviewsList.length})` },
            { id: 'STAFF', label: `Staff Reviews (${staffReviewsList.length})` }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              id={`reviews-tab-${t.id.toLowerCase()}`}
              onClick={() => {
                setReviewTab(t.id as any);
                if (t.id === 'SALON') setSelectedStaffFilter('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reviewTab === t.id
                  ? 'bg-purple-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Min Stars:</span>
          {[0, 5, 4, 3].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setMinRating(s)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                minRating === s
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {s === 0 ? 'Any' : `${s}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client name, staff member, service, or keyword..."
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
          const staffDisplay = rev.staffName || rev.stylistName;

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
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {isFeatured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-zinc-950 shadow-sm">
                      <Pin className="w-3 h-3 fill-zinc-950 rotate-45" />
                      <span>Featured Pinned</span>
                    </span>
                  ) : rev.reviewType === 'STAFF' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                      <UserCheck className="w-3 h-3" />
                      <span>Staff Review</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Verified Salon Review</span>
                  )}

                  {isAdmin ? (
                    <button
                      onClick={() => handleTogglePinFeatured(rev.id)}
                      title={isFeatured ? 'Unpin from Featured Reviews (Admin Only)' : 'Pin as Featured Review (Admin Only)'}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        isFeatured
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Pin className={`w-3 h-3 ${isFeatured ? 'fill-amber-500 text-amber-600 rotate-45' : 'text-zinc-600'}`} />
                      <span>{isFeatured ? 'Pinned' : 'Pin'}</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{rev.clientName}</h3>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate">{rev.serviceName}</div>
                    {staffDisplay && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/25 border border-purple-200/80 dark:border-purple-500/30 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        <UserCheck className="w-3 h-3" />
                        <span>Staff: {staffDisplay} • {rev.staffRating || rev.stylistSkillRating || rev.rating}★</span>
                      </div>
                    )}
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

                <button
                  id={`review-helpful-btn-${rev.id}`}
                  onClick={() => handleLikeReview(rev.id)}
                  title={isLiked ? 'Click to remove your helpful feedback' : 'Click if you found this review helpful'}
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
          <div className="text-zinc-400 text-sm">No reviews found matching your filters.</div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setReviewTab('ALL');
              setSelectedStaffFilter('ALL');
              setMinRating(0);
            }}
            className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* WRITE REVIEW MODAL (Salon or Staff Member) */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formData.reviewType === 'STAFF' ? 'Rate a Salon Staff Member' : 'Write a Salon Review'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formData.reviewType === 'STAFF'
                    ? 'Submit an individual star rating & review for our specialist'
                    : 'Share your salon and service experience with others'}
                </p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review Target Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reviewType: 'SALON' })}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  formData.reviewType === 'SALON'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Salon &amp; Service
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reviewType: 'STAFF' })}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  formData.reviewType === 'STAFF'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Staff Specialist
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {formData.reviewType === 'STAFF' ? 'Select Staff Member *' : 'Staff Member (Optional)'}
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500"
                >
                  {formData.reviewType === 'SALON' && <option value="">No specific staff selected</option>}
                  {staffMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
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

              {formData.reviewType === 'SALON' && (
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Salon Rating *</label>
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
              )}

              {(formData.reviewType === 'STAFF' || formData.staffId) && (
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Staff Specialist Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData({ ...formData, staffRating: star })}
                        className="p-1 text-purple-600 dark:text-purple-400 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formData.staffRating ? 'fill-purple-500 text-purple-500' : 'text-zinc-300 dark:text-zinc-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 ml-2">
                      {formData.staffRating} Stars
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    formData.reviewType === 'STAFF'
                      ? 'Share how the stylist/specialist handled your consultation and treatment...'
                      : 'Tell us about the hygiene, ambience, and treatment results...'
                  }
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                  formData.reviewType === 'STAFF'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                }`}
              >
                {formData.reviewType === 'STAFF' ? 'Submit Staff Rating & Review' : 'Submit Verified Salon Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
