import React, { useState, useMemo } from 'react';
import {
  Award,
  Clock,
  CalendarCheck,
  Star,
  CheckCircle2,
  Scissors,
  ChevronRight,
  BadgeCheck,
  X,
  Calendar
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { initialStaffMembers } from '../data/initialData';
import {
  SALON_TIME_SLOTS,
  getCurrentSalonSlot,
  getLocalDateString,
  getStaffDynamicStatus,
  StaffDynamicAvailability
} from '../utils/availability';
import { StaffMember } from '../types';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: 'Hair Care' | 'Skin & Facial' | 'Bridal & Makeup' | 'Men Grooming' | 'Spa & Wellness';
  experience: string;
  specialties: string[];
  certifications: string[];
  rating: number;
  reviewsCount: number;
  totalClients: number;
  shiftHours: string;
  dynamicAvailability: StaffDynamicAvailability;
  liveStaffReviewCount: number;
  latestStaffComment?: string;
  bio: string;
  image: string;
  rawMember: StaffMember;
}

export const MeetTheTeam: React.FC = () => {
  const {
    openBookingModal,
    staffMembers,
    appointments,
    reviews,
    addReview,
    blockedWindows,
    isOwnerOnBreakToday,
    currentUser
  } = useSalon();

  const [activeDept, setActiveDept] = useState<string>('All');
  const [checkDate, setCheckDate] = useState<string>(getLocalDateString());
  const [checkSlot, setCheckSlot] = useState<string>(getCurrentSalonSlot());

  // Staff Review Modal State
  const [ratingMember, setRatingMember] = useState<TeamMember | null>(null);
  const [reviewerName, setReviewerName] = useState<string>(currentUser?.name || '');
  const [staffRatingVal, setStaffRatingVal] = useState<number>(5);
  const [staffComment, setStaffComment] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const team: TeamMember[] = useMemo(() => {
    const list = (staffMembers && staffMembers.length > 0) ? staffMembers : initialStaffMembers;
    return (list || []).map(m => {
      const dyn = getStaffDynamicStatus(
        m,
        appointments,
        checkDate,
        checkSlot,
        blockedWindows,
        isOwnerOnBreakToday
      );

      // Compute dynamic staff reviews & average rating from global reviews
      const matchedReviews = reviews.filter(r => {
        if (r.staffId && r.staffId === m.id) return true;
        const rStaff = (r.staffName || r.stylistName || '').toLowerCase().trim();
        const mName = m.name.toLowerCase().trim();
        return rStaff && mName && (rStaff === mName || rStaff.includes(mName) || mName.includes(rStaff));
      });

      const computedRating = matchedReviews.length > 0
        ? Number(
            (
              matchedReviews.reduce((sum, r) => sum + (r.staffRating || r.stylistSkillRating || r.rating || 5), 0) /
              matchedReviews.length
            ).toFixed(1)
          )
        : (m.rating || 4.9);

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        department: m.department,
        experience: m.experience || '5+ Years',
        specialties: m.specialties || ['Signature Styling'],
        certifications: m.certifications || ['Professional Certified'],
        rating: computedRating,
        reviewsCount: matchedReviews.length > 0 ? matchedReviews.length : (m.reviewsCount || 120),
        liveStaffReviewCount: matchedReviews.length,
        latestStaffComment: matchedReviews[0]?.comment,
        totalClients: m.totalClients || 1500,
        shiftHours: m.shiftHours || '10:00 AM - 07:30 PM',
        dynamicAvailability: dyn,
        bio: m.bio || 'Dedicated beauty and styling professional providing personalized salon care.',
        image: m.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        rawMember: m
      };
    });
  }, [staffMembers, appointments, checkDate, checkSlot, blockedWindows, isOwnerOnBreakToday, reviews]);

  const departments = ['All', 'Hair Care', 'Skin & Facial', 'Bridal & Makeup', 'Men Grooming', 'Spa & Wellness'];

  const filteredTeam = useMemo(() => {
    if (activeDept === 'All') return team;
    return team.filter((member) => member.department === activeDept);
  }, [activeDept, team]);

  const handleOpenRateModal = (member: TeamMember) => {
    setRatingMember(member);
    setReviewerName(currentUser?.name || '');
    setStaffRatingVal(5);
    setStaffComment('');
  };

  const handleSubmitStaffRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingMember || !reviewerName.trim() || !staffComment.trim()) return;

    addReview({
      clientName: reviewerName.trim(),
      rating: staffRatingVal,
      staffRating: staffRatingVal,
      stylistSkillRating: staffRatingVal,
      reviewType: 'STAFF',
      staffId: ratingMember.id,
      staffName: ratingMember.name,
      stylistName: ratingMember.name,
      serviceName: `${ratingMember.department} Session`,
      category: ratingMember.department,
      comment: staffComment.trim(),
      verifiedBooking: true,
      sentiment: staffRatingVal >= 4 ? 'positive' : staffRatingVal === 3 ? 'neutral' : 'critical',
      status: 'published'
    });

    setToastMsg(`Rated ${ratingMember.name} ${staffRatingVal}★ — thank you!`);
    setTimeout(() => setToastMsg(null), 3500);
    setRatingMember(null);
  };

  return (
    <section className="space-y-8 pt-4">
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SECTION TITLE */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>MEET THE TEAM &amp; LIVE SLOT STATUS</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Our Certified Stylists &amp; Beauty Specialists
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Check real-time Active vs Busy slot status for any date and batch, view verified specialist ratings, or rate a staff member directly.
        </p>
      </div>

      {/* LIVE SLOT CHECKER BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131317] border border-purple-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-amber-400">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Live Specialist Availability Checker:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <input
            type="date"
            aria-label="Check specialist availability date"
            value={checkDate}
            onChange={(e) => setCheckDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold [color-scheme:light] dark:[color-scheme:dark]"
          />
          <select
            aria-label="Check specialist availability time slot"
            value={checkSlot}
            onChange={(e) => setCheckSlot(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold"
          >
            {SALON_TIME_SLOTS.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setCheckDate(getLocalDateString());
              setCheckSlot(getCurrentSalonSlot());
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold cursor-pointer"
          >
            Now
          </button>
        </div>
      </div>

      {/* DEPARTMENT FILTER PILLS */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {departments.map((dept) => (
          <button
            key={dept}
            type="button"
            onClick={() => setActiveDept(dept)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeDept === dept
                ? 'bg-purple-600 dark:bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                : 'bg-white dark:bg-[#141418] border border-purple-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-purple-700 dark:hover:text-zinc-200 hover:border-purple-300 dark:hover:border-zinc-700'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* TEAM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeam.map((member) => {
          const dynStatus = member.dynamicAvailability.status;
          const isActive = dynStatus === 'Active';
          const isBusy = dynStatus === 'Busy';

          return (
            <div
              key={member.id}
              className="rounded-3xl border transition-all overflow-hidden flex flex-col justify-between group bg-white dark:bg-[#131317] border-purple-100 dark:border-zinc-800/90 hover:border-purple-300 dark:hover:border-purple-500/50 shadow-md hover:shadow-xl"
            >
              <div>
                {/* Image Header with Dynamic Busy / Active Badge */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Dynamic Slot Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md ${
                        isActive
                          ? 'bg-emerald-500/90 text-white'
                          : isBusy
                          ? 'bg-rose-600/95 text-white'
                          : 'bg-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive
                            ? 'bg-white animate-pulse'
                            : isBusy
                            ? 'bg-amber-300'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span>
                        {isActive ? 'Active' : isBusy ? member.dynamicAvailability.label : member.dynamicAvailability.label}
                      </span>
                    </span>
                  </div>

                  {/* Experience Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-purple-300 dark:text-purple-200 font-mono text-[11px] font-bold">
                      {member.experience}
                    </span>
                  </div>

                  {/* Name and Staff Rating overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white leading-snug">
                        {member.name}
                      </h3>
                      <div className="text-xs text-purple-200 font-medium">
                        {member.role}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-purple-400/30 text-amber-300 text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{member.rating}</span>
                      <span className="text-[10px] text-zinc-300 font-normal">({member.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {member.bio}
                  </p>

                  {member.latestStaffComment && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-zinc-700 dark:text-zinc-300 italic line-clamp-2">
                      "{member.latestStaffComment}"
                    </div>
                  )}

                  {/* Specializations Tags */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Key Specializations</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {member.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 text-purple-800 dark:text-zinc-300"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications & Dynamic Slot Timing Strip */}
                  <div className="p-3.5 rounded-2xl border space-y-2 text-xs bg-purple-50/60 dark:bg-[#0f0f12] border-purple-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold text-purple-900 dark:text-purple-300">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Shift Hours:</span>
                      </span>
                      <span className="font-mono font-bold text-purple-700 dark:text-purple-200 bg-purple-100/80 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/50">
                        {member.shiftHours}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-300">
                        <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{isBusy ? 'Next Free Slot:' : 'Slot Status:'}</span>
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded-lg border ${
                        isBusy
                          ? 'text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/50'
                          : isActive
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50'
                          : 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {isBusy ? member.dynamicAvailability.nextAvailableSlot : isActive ? `Active (${checkSlot})` : member.dynamicAvailability.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions: Book + Rate Staff */}
              <div className="p-4 border-t border-purple-100 dark:border-zinc-800/80 bg-purple-50/30 dark:bg-[#101014] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openBookingModal()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Book with {member.name.split(' ')[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenRateModal(member)}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-700 hover:border-amber-500 text-purple-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  title={`Rate ${member.name}`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Rate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SALON HYGIENE & CERTIFICATION GUARANTEE */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all bg-[#141418] border-zinc-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-base text-zinc-100">
              100% Certified Master Artists &amp; Sterilization Standards
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              All tools undergo hospital-grade medical autoclave sterilization between each client. Our staff completes monthly advanced training seminars in Paris, London, and Tokyo styling methodologies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => openBookingModal()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>Book Appointment Online</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RATE STAFF MEMBER MODAL */}
      {ratingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={ratingMember.image}
                  alt={ratingMember.name}
                  className="w-11 h-11 rounded-xl object-cover border border-amber-500/40"
                />
                <div>
                  <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Rate {ratingMember.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ratingMember.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingMember(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStaffRating} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Staff Specialist Star Rating *</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setStaffRatingVal(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= staffRatingVal ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-amber-500">{staffRatingVal} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Review for {ratingMember.name} *</label>
                <textarea
                  rows={3}
                  required
                  value={staffComment}
                  onChange={(e) => setStaffComment(e.target.value)}
                  placeholder="Share your experience with this stylist/specialist..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Publish Staff Rating
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
