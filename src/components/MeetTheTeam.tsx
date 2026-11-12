import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Award,
  Clock,
  CalendarCheck,
  Star,
  CheckCircle2,
  Scissors,
  Heart,
  ChevronRight,
  Filter,
  UserCheck,
  BadgeCheck
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { initialStaffMembers } from '../data/initialData';

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
  availability: {
    status: 'Available Today' | 'Limited Slots' | 'Booked Today';
    slotsLeft: number;
    nextAvailableSlot: string;
  };
  bio: string;
  image: string;
}

export const MeetTheTeam: React.FC = () => {
  const { openBookingModal, staffMembers } = useSalon();

  const [activeDept, setActiveDept] = useState<string>('All');
  const [selectedStylistModal, setSelectedStylistModal] = useState<TeamMember | null>(null);

  const team: TeamMember[] = useMemo(() => {
    const list = (staffMembers && staffMembers.length > 0) ? staffMembers : initialStaffMembers;
    return (list || []).map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      department: m.department,
      experience: m.experience || '5+ Years',
      specialties: m.specialties || ['Signature Styling'],
      certifications: m.certifications || ['Professional Certified'],
      rating: m.rating || 4.95,
      reviewsCount: m.reviewsCount || 120,
      totalClients: m.totalClients || 1500,
      shiftHours: m.shiftHours || '10:00 AM - 07:30 PM',
      availability: {
        status: m.status === 'On Leave' ? ('Booked Today' as const) : m.status === 'Available Today' ? ('Available Today' as const) : ('Limited Slots' as const),
        slotsLeft: m.status === 'On Leave' ? 0 : 3,
        nextAvailableSlot: m.status === 'On Leave' ? 'Tomorrow, 11:00 AM' : 'Today, 02:45 PM'
      },
      bio: m.bio || 'Dedicated beauty and styling professional providing personalized salon care.',
      image: m.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    }));
  }, [staffMembers]);

  const departments = ['All', 'Hair Care', 'Skin & Facial', 'Bridal & Makeup', 'Men Grooming', 'Spa & Wellness'];

  const filteredTeam = useMemo(() => {
    if (activeDept === 'All') return team;
    return team.filter((member) => member.department === activeDept);
  }, [activeDept, team]);

  const handleBookWithMember = (member: TeamMember) => {
    openBookingModal();
  };

  return (
    <section className="space-y-8 pt-4">
      {/* SECTION TITLE */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>MEET THE TEAM</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Our Certified Stylists &amp; Beauty Specialists
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Every artist at Modern Unisex Salon holds international credentials, brings over 8+ years of dedicated craft experience, and provides one-on-one personalized consultations.
        </p>
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
          const isAvailable = member.availability.status === 'Available Today';
          const isLimited = member.availability.status === 'Limited Slots';

          return (
            <div
              key={member.id}
              className="rounded-3xl border transition-all overflow-hidden flex flex-col justify-between group bg-white dark:bg-[#131317] border-purple-100 dark:border-zinc-800/90 hover:border-purple-300 dark:hover:border-purple-500/50 shadow-md hover:shadow-xl"
            >
              <div>
                {/* Image Header with Availability Badge */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md ${
                        isAvailable
                          ? 'bg-emerald-500/90 text-white'
                          : isLimited
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvailable
                            ? 'bg-white animate-pulse'
                            : isLimited
                            ? 'bg-white'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span>{member.availability.status}</span>
                    </span>
                  </div>

                  {/* Experience Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-purple-300 dark:text-purple-200 font-mono text-[11px] font-bold">
                      {member.experience}
                    </span>
                  </div>

                  {/* Name and Rating overlay at bottom of image */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white leading-snug">
                        {member.name}
                      </h3>
                      <div className="text-xs text-purple-200 font-medium">
                        {member.role}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-purple-400/30 text-purple-300 text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{member.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  {/* Bio */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {member.bio}
                  </p>

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

                  {/* Certifications & Timing Strip */}
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
                        <span>Next Slot:</span>
                      </span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-100/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                        {member.availability.nextAvailableSlot}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-purple-100 dark:border-zinc-800/80 bg-purple-50/30 dark:bg-[#101014]">
                <button
                  type="button"
                  onClick={() => handleBookWithMember(member)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Book with {member.name.split(' ')[0]}</span>
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
    </section>
  );
};
