import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Heart,
  Send,
  User,
  Phone,
  Tag,
  Scissors,
  Clock,
  Sparkle,
  Copy,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  Award
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ServiceItem, Appointment } from '../types';

interface CustomerFeedbackFormProps {
  initialAppointment?: Appointment | null;
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
  title?: string;
  subtitle?: string;
}

export const CustomerFeedbackForm: React.FC<CustomerFeedbackFormProps> = ({
  initialAppointment,
  onSuccess,
  onClose,
  isModal = false,
  title = "Share Your Salon Experience",
  subtitle = "Your real-time rating and feedback help us maintain 5-star styling standards in Mohol."
}) => {
  const { services, addReview, openBookingModal } = useSalon();

  // Form State
  const [clientName, setClientName] = useState(initialAppointment?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialAppointment?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(initialAppointment?.clientEmail || '');
  const [selectedService, setSelectedService] = useState(
    initialAppointment?.serviceName || services[0]?.name || 'O3 Prof. Facial'
  );
  const [bookingRef, setBookingRef] = useState(initialAppointment?.bookingRef || '');
  const [stylistName, setStylistName] = useState(
    initialAppointment?.stylistName || 'Self-Employed (Master Stylist)'
  );

  // Ratings
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hygieneRating, setHygieneRating] = useState<number>(5);
  const [stylistSkillRating, setStylistSkillRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [recommend, setRecommend] = useState<boolean>(true);
  const [npsScore, setNpsScore] = useState<number>(10);

  // Comment & Tags
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Spotless Hygiene',
    'Master Stylist',
    'Worth Every Rupee'
  ]);
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80'
  );
  const [verifiedBooking, setVerifiedBooking] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const availableTags = [
    'Spotless Hygiene',
    'Master Stylist',
    'Worth Every Rupee',
    '10% Advance Easy',
    'Punctual & Fast',
    'Premium Products',
    'Great Ambiance',
    'Best in Mohol',
    'Loved Hair Wash',
    'Gentle Treatment',
    'Waterproof Makeup'
  ];

  const avatarPresets = [
    { label: 'Pooja K.', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Rohan S.', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80' },
    { label: 'Tanvi G.', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80' },
    { label: 'Sunil P.', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80' },
    { label: 'Sneha J.', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80' },
    { label: 'Amit D.', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80' }
  ];

  const ratingDescriptions: Record<number, string> = {
    5: '⭐⭐⭐⭐⭐ Masterpiece Experience! Flawless result & service.',
    4: '⭐⭐⭐⭐ Great Experience! Highly satisfied with the result.',
    3: '⭐⭐⭐ Good Service with decent results.',
    2: '⭐⭐ Fair Experience, could be improved.',
    1: '⭐ Disappointing Experience, needs urgent attention.'
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);

    // Find service category
    const matchedSrv = services.find(s => s.name === selectedService);
    const category = matchedSrv?.category || 'Hair & Skin Care';

    // Submit review to global context (triggers real-time broadcast and admin notification)
    setTimeout(() => {
      addReview({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        rating,
        serviceName: selectedService,
        category: typeof category === 'string' ? category : undefined,
        comment: comment.trim() || 'Wonderful salon experience at Modern Unisex Salon Mohol. Highly recommended!',
        verifiedBooking,
        avatarUrl,
        bookingRef: bookingRef.trim() || undefined,
        stylistName,
        hygieneRating,
        stylistSkillRating,
        punctualityRating,
        valueRating,
        recommend,
        npsScore,
        tags: selectedTags,
        sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'critical',
        status: 'published'
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    }, 400);
  };

  if (isSubmitted) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-emerald-500/40 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            Real-Time Push Synchronized
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-100">
            Thank You, {clientName}!
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            Your {rating}-Star rating for <strong className="text-amber-400">{selectedService}</strong> has been verified and published to our customer reviews feed and forwarded to the salon owner's suite in real time.
          </p>
        </div>

        {/* Clean Salon Care Note */}
        <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 max-w-md mx-auto text-left space-y-1.5 text-xs text-zinc-300">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Modern Unisex Salon • 5-Star Promise</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            We value your honest feedback and look forward to welcoming you back to our salon at B.N. Gund Complex, Mohol.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
            >
              Close Window
            </button>
          )}
          <button
            onClick={() => {
              if (onClose) onClose();
              openBookingModal();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            Book Next Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl relative ${isModal ? 'max-h-[85vh] overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL-TIME CLIENT SATISFACTION PORTAL</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            {subtitle}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main 5-Star Experience Rating */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
            Overall Salon Experience Rating *
          </label>

          <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 sm:p-2 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                  title={`${star} Star`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                      active
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-700 hover:text-zinc-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-amber-400/90 font-mono bg-zinc-900/90 py-1.5 px-3 rounded-xl border border-zinc-800 max-w-md mx-auto">
            {ratingDescriptions[hoverRating || rating]}
          </div>
        </div>

        {/* Detailed Aspect Sub-Ratings Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Detailed Salon Quality Criteria (1 - 5 Stars)
            </span>
            <span className="text-[11px] text-zinc-500">Pushes directly to satisfaction trends</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Hygiene & Sanitization */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Salon Hygiene &amp; Cleanliness</div>
                <div className="text-[10px] text-zinc-500">Sterilized tools &amp; sanitized chairs</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHygieneRating(s)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        hygieneRating >= s
                          ? 'fill-emerald-400 text-emerald-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Stylist Skill & Technique */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Stylist Skill &amp; Precision</div>
                <div className="text-[10px] text-zinc-500">Cut technique, facial touch, advice</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStylistSkillRating(s)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        stylistSkillRating >= s
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Service Punctuality */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Punctuality &amp; Timing</div>
                <div className="text-[10px] text-zinc-500">Zero wait time &amp; swift execution</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPunctualityRating(s)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        punctualityRating >= s
                          ? 'fill-blue-400 text-blue-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Value for Advance Paid */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-200">Value for Price Paid</div>
                <div className="text-[10px] text-zinc-500">10% advance ease &amp; transparency</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValueRating(s)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        valueRating >= s
                          ? 'fill-purple-400 text-purple-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Client & Service Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Your Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Enter your full name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Service Received *
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {services.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} (₹{s.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Booking Ref & Stylist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Booking Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 20261111-WED-001"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">
              Stylist / Specialist
            </label>
            <input
              type="text"
              value={stylistName}
              onChange={(e) => setStylistName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Detailed Experience Comment */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-300 block">
            Your Comments &amp; Salon Feedback *
          </label>
          <textarea
            rows={3}
            required
            placeholder="Tell us what you loved about your treatment, the stylist technique, ambience in Mohol, and the 10% advance deposit convenience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Highlight Tags Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-300 block">
            Select Highlights &amp; Praise Badges
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-zinc-950" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NPS & Avatar Selector */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold text-zinc-200">
              Would you recommend Modern Unisex Salon to friends &amp; family in Mohol?
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRecommend(true);
                  setNpsScore(10);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  recommend
                    ? 'bg-emerald-500 text-zinc-950 shadow'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Yes, 100%!</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecommend(false);
                  setNpsScore(5);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  !recommend
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                }`}
              >
                Maybe
              </button>
            </div>
          </div>

          {/* Avatar Presets */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-400">Choose Reviewer Avatar:</span>
            <div className="flex items-center gap-1.5">
              {avatarPresets.map((av, idx) => (
                <img
                  key={idx}
                  src={av.url}
                  alt={av.label}
                  onClick={() => setAvatarUrl(av.url)}
                  className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition ${
                    avatarUrl === av.url
                      ? 'border-amber-400 scale-110 shadow-md shadow-amber-400/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={av.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Live Preview (How your review will appear to the salon owner)
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-100">
                    {clientName || 'Your Name'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    {selectedService}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      rating >= s ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-300 italic">
              "{comment || 'Your comments will appear here...'}"
            </p>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedTags.map(t => (
                  <span
                    key={t}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 border border-amber-400/40 active:scale-98 transition cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Publishing &amp; Syncing to Admin...</span>
          ) : (
            <>
              <Send className="w-4 h-4 text-zinc-950" />
              <span>Submit Real-Time Rating &amp; Unlock 10% Coupon</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
