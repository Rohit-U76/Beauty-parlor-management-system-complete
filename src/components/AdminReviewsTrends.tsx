import React, { useState, useMemo } from 'react';
import {
  Star,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Send,
  Trash2,
  CornerDownRight,
  Share2,
  Download,
  Award,
  Heart,
  Smile,
  BarChart3,
  Check,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Review } from '../types';

export const AdminReviewsTrends: React.FC = () => {
  const { reviews, addReview, updateReview, deleteReview, services, appointments } = useSalon();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | 'CRITICAL' | 'NEEDS_REPLY' | 'FEATURED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Reply Templates
  const replyTemplates = [
    {
      label: 'Warm Thank You',
      text: 'Thank you so much for your kind words! We are thrilled you enjoyed your visit and look forward to welcoming you again at Modern Unisex Salon Mohol.'
    },
    {
      label: 'Facial / Skin Glow Praise',
      text: 'Thank you for trusting our skin specialists! We are delighted your skin feels fresh and radiant. See you for your next glow session.'
    },
    {
      label: 'Hair / Keratin Care',
      text: 'Thank you for visiting! Be sure to use the sulphate-free shampoo we recommended to maintain your smooth, silky finish.'
    },
    {
      label: 'Bridal & Occasion Makeup',
      text: 'Heartiest congratulations from the Modern Unisex Salon team! It was our absolute honor designing your signature makeover.'
    },
    {
      label: 'Service Recovery / Apology',
      text: 'Thank you for your honest feedback. We apologize for any inconvenience caused and are taking immediate steps to improve. Please visit us again for a complimentary scalp treatment.'
    }
  ];

  // Calculated Metrics
  const totalReviews = reviews.length;

  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [reviews, totalReviews]);

  const csatScore = useMemo(() => {
    if (totalReviews === 0) return 100;
    const positiveCount = reviews.filter(r => (r.rating || 5) >= 4).length;
    return Math.round((positiveCount / totalReviews) * 100);
  }, [reviews, totalReviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Sub-aspect average ratings
  const aspectAverages = useMemo(() => {
    let hygieneSum = 0, hygieneCount = 0;
    let stylistSum = 0, stylistCount = 0;
    let punctualitySum = 0, punctualityCount = 0;
    let valueSum = 0, valueCount = 0;

    reviews.forEach(r => {
      if (r.hygieneRating) { hygieneSum += r.hygieneRating; hygieneCount++; }
      if (r.stylistSkillRating) { stylistSum += r.stylistSkillRating; stylistCount++; }
      if (r.punctualityRating) { punctualitySum += r.punctualityRating; punctualityCount++; }
      if (r.valueRating) { valueSum += r.valueRating; valueCount++; }
    });

    return {
      hygiene: hygieneCount > 0 ? (hygieneSum / hygieneCount).toFixed(1) : '5.0',
      stylist: stylistCount > 0 ? (stylistSum / stylistCount).toFixed(1) : '5.0',
      punctuality: punctualityCount > 0 ? (punctualitySum / punctualityCount).toFixed(1) : '4.9',
      value: valueCount > 0 ? (valueSum / valueCount).toFixed(1) : '4.9'
    };
  }, [reviews]);

  // NPS Score
  const npsScore = useMemo(() => {
    if (totalReviews === 0) return '+95';
    let promoters = 0;
    let detractors = 0;
    reviews.forEach(r => {
      const score = r.npsScore !== undefined ? r.npsScore : r.rating === 5 ? 10 : r.rating === 4 ? 8 : 4;
      if (score >= 9) promoters++;
      else if (score <= 6) detractors++;
    });
    const nps = Math.round(((promoters - detractors) / totalReviews) * 100);
    return (nps >= 0 ? `+${nps}` : `${nps}`);
  }, [reviews, totalReviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.clientName.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.bookingRef && r.bookingRef.toLowerCase().includes(q)) ||
        (r.clientPhone && r.clientPhone.includes(q));

      let matchesRating = true;
      if (ratingFilter === '5') matchesRating = r.rating === 5;
      else if (ratingFilter === '4') matchesRating = r.rating === 4;
      else if (ratingFilter === '3') matchesRating = r.rating === 3;
      else if (ratingFilter === 'CRITICAL') matchesRating = r.rating <= 2;
      else if (ratingFilter === 'NEEDS_REPLY') matchesRating = !r.ownerReply;
      else if (ratingFilter === 'FEATURED') matchesRating = !!r.featured;

      const matchesCat =
        categoryFilter === 'ALL' ||
        (r.category && r.category.toLowerCase() === categoryFilter.toLowerCase());

      return matchesSearch && matchesRating && matchesCat;
    });
  }, [reviews, searchQuery, ratingFilter, categoryFilter]);

  // Handle Owner Reply
  const handleSaveReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    updateReview(reviewId, {
      ownerReply: replyText.trim(),
      ownerReplyDate: new Date().toISOString().split('T')[0]
    });
    setReplyingReviewId(null);
    setReplyText('');
    showToast('Owner reply published and visible on client portal!');
  };

  const handleToggleFeatured = (review: Review) => {
    updateReview(review.id, {
      featured: !review.featured
    });
    showToast(review.featured ? 'Removed from featured showcase' : 'Review pinned to featured showcase!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = 'ID,Date,Client Name,Phone,Service,Rating,Hygiene,Stylist,Punctuality,Value,Comment,Owner Reply\n';
    const rows = reviews.map(r => 
      `"${r.id}","${r.date}","${r.clientName.replace(/"/g, '""')}","${r.clientPhone || ''}","${r.serviceName.replace(/"/g, '""')}",${r.rating},${r.hygieneRating || 5},${r.stylistSkillRating || 5},${r.punctualityRating || 5},${r.valueRating || 5},"${r.comment.replace(/"/g, '""')}","${(r.ownerReply || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `modern_salon_satisfaction_trends_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSAT & Feedback report successfully.');
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-left animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Control Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[#141418] border border-zinc-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>REAL-TIME SATISFACTION TRENDS &amp; FEEDBACK ENGINE</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-100">
            Customer Satisfaction &amp; Review Management
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Live ratings submitted from customer dashboards are pushed directly here. Monitor CSAT scores, respond to clients, and track service quality trends in Mohol.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-yellow-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Client Rating</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. CSAT Percentage */}
        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              CSAT Score
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {csatScore}%
          </div>
          <p className="text-[11px] text-zinc-400">
            {reviews.filter(r => (r.rating || 5) >= 4).length} of {totalReviews} clients highly satisfied (4-5★)
          </p>
        </div>

        {/* 2. Average Overall Rating */}
        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Average Rating
            </span>
            <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-yellow-400 font-serif flex items-baseline gap-1">
            <span>{averageRating}</span>
            <span className="text-xs text-zinc-500 font-sans font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Across {totalReviews} verified salon experiences
          </p>
        </div>

        {/* 3. Net Promoter Score (NPS) */}
        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Net Promoter (NPS)
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
            {npsScore}
          </div>
          <p className="text-[11px] text-zinc-400">
            High organic customer referral velocity in Mohol
          </p>
        </div>

        {/* 4. Response Rate */}
        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Owner Reply Rate
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">
            {totalReviews > 0
              ? `${Math.round((reviews.filter(r => r.ownerReply).length / totalReviews) * 100)}%`
              : '100%'}
          </div>
          <p className="text-[11px] text-zinc-400">
            {reviews.filter(r => !r.ownerReply).length} reviews pending salon reply
          </p>
        </div>
      </div>

      {/* Satisfaction Trends Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Aspect Scores & Star Distribution */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#141418] border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="font-serif text-lg font-bold text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <span>Aspect Satisfaction Performance</span>
            </h3>
            <span className="text-xs text-zinc-500">Live aggregated scores</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aspect 1: Hygiene */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-200">🧼 Salon Hygiene &amp; Sterilization</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">{aspectAverages.hygiene} ★</div>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Number(aspectAverages.hygiene) / 5) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-400 flex justify-between">
                <span>Sanitized chairs &amp; single-use gowns</span>
                <span className="font-semibold text-emerald-400">Top Rated</span>
              </div>
            </div>

            {/* Aspect 2: Stylist Skill */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-200">✂️ Stylist Technique &amp; Precision</div>
                <div className="text-xs font-bold text-yellow-400 font-mono">{aspectAverages.stylist} ★</div>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Number(aspectAverages.stylist) / 5) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-400 flex justify-between">
                <span>Cuts, fades, facial technique &amp; styling</span>
                <span className="font-semibold text-yellow-400">Master Level</span>
              </div>
            </div>

            {/* Aspect 3: Punctuality */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-200">⏱️ On-Time Slot Commencement</div>
                <div className="text-xs font-bold text-blue-400 font-mono">{aspectAverages.punctuality} ★</div>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Number(aspectAverages.punctuality) / 5) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-400 flex justify-between">
                <span>Zero wait time with 10% advance deposit</span>
                <span className="font-semibold text-blue-400">98% Prompt</span>
              </div>
            </div>

            {/* Aspect 4: Value */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-200">💎 Value for Advance Paid</div>
                <div className="text-xs font-bold text-purple-400 font-mono">{aspectAverages.value} ★</div>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(Number(aspectAverages.value) / 5) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-zinc-400 flex justify-between">
                <span>Transparent price card in Mohol</span>
                <span className="font-semibold text-purple-400">High Value</span>
              </div>
            </div>
          </div>

          {/* Rating Distribution Progress Bars */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="text-xs font-bold text-zinc-300">
              Star Rating Distribution (Click to filter)
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(star.toString() as any)}
                    className="w-full flex items-center gap-3 text-xs hover:bg-zinc-900/60 p-1.5 rounded-lg transition text-left cursor-pointer"
                  >
                    <span className="w-8 font-bold text-zinc-300 flex items-center gap-0.5">
                      {star} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          star >= 4 ? 'bg-yellow-500' : star === 3 ? 'bg-blue-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-right font-mono text-zinc-400 text-[11px]">
                      {count} ({percent}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Top Praise Badges & Quick Action */}
        <div className="p-6 rounded-3xl bg-[#141418] border border-zinc-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="font-serif text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span>Customer Praise Highlights</span>
              </h3>
            </div>

            <p className="text-xs text-zinc-400">
              Most frequently tagged strengths by verified salon clients in Mohol:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: 'Spotless Hygiene', count: 14, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                { tag: 'Master Stylist', count: 18, color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
                { tag: 'Worth Every Rupee', count: 12, color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
                { tag: '10% Advance Easy', count: 10, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
                { tag: 'Punctual & Fast', count: 9, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
                { tag: 'Waterproof Makeup', count: 7, color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
                { tag: 'Best in Mohol', count: 16, color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
              ].map(item => (
                <span
                  key={item.tag}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${item.color} flex items-center gap-1`}
                >
                  <span>#{item.tag}</span>
                  <span className="text-[10px] opacity-75 font-mono">({item.count})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>Salon Owner Pro Tip</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Promptly replying to customer reviews within 24 hours increases repeat appointment bookings by up to 35% in local Mohol directories.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#141418] border border-zinc-800 space-y-3.5 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feedback by client name, phone, service, comments, or booking ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
            {[
              { id: 'ALL', label: `All (${reviews.length})` },
              { id: '5', label: '5★ Masterpiece' },
              { id: '4', label: '4★ Great' },
              { id: '3', label: '3★ Decent' },
              { id: 'CRITICAL', label: 'Needs Attention' },
              { id: 'NEEDS_REPLY', label: 'Awaiting Reply' },
              { id: 'FEATURED', label: 'Featured Pin' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRatingFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  ratingFilter === f.id
                    ? 'bg-yellow-500 text-black font-bold shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Feedback Feed Cards */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#141418] border border-zinc-800 space-y-3">
            <Star className="w-10 h-10 text-yellow-500/40 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">No Reviews Match Selected Filters</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try adjusting your search keywords or switching back to the "All" tab.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isReplying = replyingReviewId === rev.id;

            return (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#141418] border border-zinc-800 hover:border-zinc-700 transition-all shadow-xl space-y-4"
              >
                {/* Header: Client info, Rating & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80'}
                      alt={rev.clientName}
                      className="w-10 h-10 rounded-2xl object-cover border border-yellow-500/40 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-zinc-100">
                          {rev.clientName}
                        </span>
                        {rev.verifiedBooking && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Visit</span>
                          </span>
                        )}
                        {rev.featured && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Featured Showcase</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                        <span className="font-semibold text-yellow-400">{rev.serviceName}</span>
                        <span>•</span>
                        <span>{rev.date}</span>
                        {rev.bookingRef && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">Ref: {rev.bookingRef}</span>
                          </>
                        )}
                        {rev.clientPhone && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              {rev.clientPhone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stars & Sentiment */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            (rev.rating || 5) >= s
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-zinc-700'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-xs text-yellow-400 ml-1.5 font-mono">
                        {rev.rating || 5}.0
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(rev)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                        rev.featured
                          ? 'bg-yellow-500 text-black border-yellow-400 shadow-md shadow-yellow-500/20'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-yellow-500/50 hover:text-yellow-400'
                      }`}
                      title={rev.featured ? 'Click to unpin from featured showcase' : 'Click to pin to client portal showcase'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{rev.featured ? 'Pinned Featured' : 'Pin to Feature'}</span>
                    </button>

                    <button
                      onClick={() => deleteReview(rev.id)}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Ratings Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-400">🧼 Hygiene:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {rev.hygieneRating || 5} ★
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-400">✂️ Stylist Skill:</span>
                    <span className="font-bold text-yellow-400 font-mono">
                      {rev.stylistSkillRating || 5} ★
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-400">⏱️ Punctuality:</span>
                    <span className="font-bold text-blue-400 font-mono">
                      {rev.punctualityRating || 5} ★
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                    <span className="text-zinc-400">💎 Value:</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {rev.valueRating || 5} ★
                    </span>
                  </div>
                </div>

                {/* Client Review Comment */}
                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/80">
                  "{rev.comment}"
                </div>

                {/* Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-300 text-[10px] font-semibold border border-yellow-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Owner Reply Box or Trigger */}
                {rev.ownerReply ? (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Modern Unisex Salon (Owner Reply)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{rev.ownerReplyDate || 'Replied'}</span>
                        <button
                          onClick={() => {
                            setReplyingReviewId(rev.id);
                            setReplyText(rev.ownerReply || '');
                          }}
                          className="text-[11px] font-semibold text-yellow-400 hover:underline cursor-pointer"
                        >
                          Edit Reply
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      "{rev.ownerReply}"
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-zinc-500 italic">
                      No salon response recorded yet.
                    </span>

                    <div className="flex items-center gap-2">
                      {rev.clientPhone && (
                        <a
                          href={`https://wa.me/${rev.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${rev.clientName}! Thank you for visiting Modern Unisex Salon Mohol and sharing your ${rev.rating}-star feedback.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp Client</span>
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyText(replyTemplates[0].text);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply as Salon Owner</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply Form Modal/Inline Drawer */}
                {isReplying && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-yellow-500/50 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>Craft Owner Response for {rev.clientName}</span>
                      </div>
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="text-zinc-500 hover:text-zinc-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Template Quick Selectors */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-semibold block">Quick Response Templates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {replyTemplates.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReplyText(tpl.text)}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-yellow-500/50 hover:text-yellow-300 transition"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your professional, appreciative salon response..."
                      className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReply(rev.id)}
                        className="px-4 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Owner Response</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#141418] border border-yellow-500/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                  TEST &amp; DEMO ENGINE
                </span>
                <h3 className="font-serif text-lg font-bold text-zinc-100">
                  Simulate Live Customer Feedback
                </h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Test how new incoming ratings immediately update satisfaction averages, CSAT scores, aspect indices, and trigger admin push notifications.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  addReview({
                    clientName: 'Deepak More (Mohol)',
                    clientPhone: '+91 91234 56780',
                    clientEmail: 'deepak.more@gmail.com',
                    rating: 5,
                    serviceName: 'Advance Hair Cut & Blow Dry',
                    category: 'Hair Care',
                    comment: 'Seamless 10% advance deposit booking! Arrived at 5:00 PM and master stylist started immediately without 1 minute wait. Haircut was top tier.',
                    verifiedBooking: true,
                    bookingRef: 'MS-2026-992143',
                    hygieneRating: 5,
                    stylistSkillRating: 5,
                    punctualityRating: 5,
                    valueRating: 5,
                    recommend: true,
                    npsScore: 10,
                    tags: ['Spotless Hygiene', 'Master Stylist', 'Punctual & Fast'],
                    sentiment: 'positive',
                    status: 'published'
                  });
                  setShowSimulateModal(false);
                  showToast('Pushed simulated 5-star customer feedback to live stream!');
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-left space-y-1 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>5-Star Masterpiece: "Deepak More"</span>
                  <span className="font-mono text-[10px]">Hair Cut &amp; Styling</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Simulates a verified 5-star review highlighting spotless hygiene and zero wait time.
                </p>
              </button>

              <button
                onClick={() => {
                  addReview({
                    clientName: 'Kavita Salunkhe',
                    clientPhone: '+91 98223 44551',
                    clientEmail: 'kavita.s@yahoo.com',
                    rating: 5,
                    serviceName: 'O3 Prof. Facial',
                    category: 'Skin Services',
                    comment: 'The facial massage was very calming and removed all tan. Excellent hygiene in the Mohol branch.',
                    verifiedBooking: true,
                    bookingRef: 'MS-2026-883210',
                    hygieneRating: 5,
                    stylistSkillRating: 5,
                    punctualityRating: 4,
                    valueRating: 5,
                    recommend: true,
                    npsScore: 10,
                    tags: ['Spotless Hygiene', 'Gentle Treatment', 'Worth Every Rupee'],
                    sentiment: 'positive',
                    status: 'published'
                  });
                  setShowSimulateModal(false);
                  showToast('Pushed simulated 5-star facial review to live stream!');
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-left space-y-1 transition cursor-pointer"
              >
                <div className="text-xs font-bold text-yellow-400 flex items-center justify-between">
                  <span>5-Star Glow: "Kavita Salunkhe"</span>
                  <span className="font-mono text-[10px]">O3 Prof. Facial</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Simulates a verified 5-star review praising skin rejuvenation and massage.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
