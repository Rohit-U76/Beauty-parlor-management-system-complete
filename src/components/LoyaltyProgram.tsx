import React, { useState, useMemo } from 'react';
import {
  Award,
  Crown,
  Gift,
  CheckCircle2,
  Sparkles,
  Search,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  Star,
  Copy,
  Check,
  RefreshCw,
  Phone
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Customer } from '../types';

export const LoyaltyProgram: React.FC = () => {
  const { customers, appointments, openBookingModal, currentUser } = useSalon();

  // Search/Lookup State
  const [phoneNumber, setPhoneNumber] = useState<string>(() => currentUser?.phone || '');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [simulatedVisits, setSimulatedVisits] = useState<number>(0);
  const [isManualSimulation, setIsManualSimulation] = useState<boolean>(false);

  // Sync phone when currentUser logs in or changes
  React.useEffect(() => {
    if (currentUser) {
      setPhoneNumber(currentUser.phone || '');
      setIsManualSimulation(false);
    } else {
      setPhoneNumber('');
    }
  }, [currentUser]);

  // Quick Preset demo profiles
  const sampleProfiles = [
    { name: 'Pooja Kadam (5 Visits)', phone: '9822099881', visits: 5, tier: 'VIP Member' },
    { name: 'Rohan Shinde (4 Visits)', phone: '9765433445', visits: 4, tier: 'Standard' },
    { name: 'Tanvi Gaikwad (9 Visits)', phone: '9822144556', visits: 9, tier: 'VIP Member' },
    { name: 'New Client (0 Visits)', phone: '9123456789', visits: 0, tier: 'New Client' }
  ];

  // User appointments count for currentUser
  const currentUserVisits = useMemo(() => {
    if (!currentUser) return 0;
    const userId = currentUser.id;
    const userPhoneClean = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const userEmailClean = (currentUser.email || '').trim().toLowerCase();
    const userNameClean = (currentUser.name || '').trim().toLowerCase();

    return appointments.filter(apt => {
      if (apt.userId) return apt.userId === userId;
      if (userPhoneClean && userPhoneClean.length === 10) {
        const aptPhoneClean = (apt.clientPhone || '').replace(/\D/g, '').slice(-10);
        const aptEmailClean = (apt.clientEmail || '').trim().toLowerCase();
        const aptNameClean = (apt.clientName || '').trim().toLowerCase();
        if (aptPhoneClean === userPhoneClean) {
          if (aptEmailClean && userEmailClean && aptEmailClean === userEmailClean) return true;
          if (aptNameClean && userNameClean && aptNameClean === userNameClean) return true;
        }
      }
      return false;
    }).length;
  }, [appointments, currentUser]);

  // Dynamic Lookup Computation
  const activeUserData = useMemo(() => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (isManualSimulation) {
      return {
        name: currentUser?.name || 'Valued Client',
        phone: phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`,
        totalVisits: simulatedVisits,
        tier: simulatedVisits >= 5 ? 'VIP Member' : (simulatedVisits === 0 ? 'New Client' : 'Standard'),
        matchedAppointmentsCount: simulatedVisits
      };
    }

    // If currentUser is logged in: strictly prioritize currentUser's authenticated account
    if (currentUser) {
      const userCleanPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
      // If phone input is empty or matches currentUser's phone, return current user's actual visits
      if (!cleanPhone || cleanPhone === userCleanPhone) {
        const totalVisits = currentUserVisits;
        return {
          name: currentUser.name,
          phone: currentUser.phone,
          totalVisits: totalVisits,
          tier: totalVisits >= 5 ? 'VIP Member' : (totalVisits === 0 ? 'New Client' : (currentUser.memberTier || 'Standard')),
          matchedAppointmentsCount: totalVisits
        };
      }
    }

    // Phone Lookup: STRICT 10-digit match only
    if (cleanPhone && cleanPhone.length === 10) {
      const matchedApts = appointments.filter(a => {
        const aClean = (a.clientPhone || '').replace(/\D/g, '').slice(-10);
        return aClean === cleanPhone;
      });

      const matchedCustomer = customers.find(c => {
        const cClean = (c.phone || '').replace(/\D/g, '').slice(-10);
        return cClean === cleanPhone;
      });

      if (matchedCustomer) {
        const totalVisits = matchedApts.length > 0 ? matchedApts.length : (matchedCustomer.totalVisits || 0);
        return {
          name: matchedCustomer.name,
          phone: matchedCustomer.phone,
          totalVisits: totalVisits,
          tier: totalVisits >= 5 ? 'VIP Member' : (totalVisits === 0 ? 'New Client' : 'Standard'),
          matchedAppointmentsCount: matchedApts.length
        };
      }

      if (matchedApts.length > 0) {
        const totalVisits = matchedApts.length;
        return {
          name: matchedApts[0].clientName,
          phone: matchedApts[0].clientPhone,
          totalVisits: totalVisits,
          tier: totalVisits >= 5 ? 'VIP Member' : (totalVisits === 0 ? 'New Client' : 'Standard'),
          matchedAppointmentsCount: matchedApts.length
        };
      }
    }

    // Default or new phone lookup: strictly 0 visits
    return {
      name: currentUser?.name || 'New Client',
      phone: phoneNumber ? (phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber}`) : '',
      totalVisits: 0,
      tier: 'New Client',
      matchedAppointmentsCount: 0
    };
  }, [customers, appointments, phoneNumber, isManualSimulation, simulatedVisits, currentUser, currentUserVisits]);

  const handleLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsManualSimulation(false);
  };

  const handleSelectPreset = (preset: typeof sampleProfiles[0]) => {
    setIsManualSimulation(false);
    setPhoneNumber(preset.phone);
    setSimulatedVisits(preset.visits);
  };

  const incrementVisit = () => {
    setIsManualSimulation(true);
    setSimulatedVisits(prev => {
      const base = activeUserData.totalVisits;
      const next = (base % 10) + 1;
      return next;
    });
  };

  const resetVisits = () => {
    setIsManualSimulation(true);
    setSimulatedVisits(1);
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Milestone Calculations
  const currentVisits = activeUserData.totalVisits;
  const visitsInCycle = currentVisits % 10 === 0 && currentVisits > 0 ? 10 : currentVisits % 10;
  const is5thEligible = currentVisits >= 5;
  const is10thEligible = currentVisits >= 10;

  const nextMilestone = currentVisits < 5 ? 5 : 10;
  const visitsNeeded = Math.max(0, nextMilestone - visitsInCycle);
  const progressPercent = Math.min(100, Math.round((visitsInCycle / 10) * 100));

  return (
    <div id="loyalty-program-section" className="space-y-8 text-left">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
            <Crown className="w-3.5 h-3.5" />
            <span>MODERN SALON LOYALTY REWARDS</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100">
            Visit Tracking &amp; Milestone Rewards
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Every salon service in Mohol brings you closer to exclusive milestone discounts. Unlock 15% OFF on your 5th visit and a Royal Upgrade on your 10th visit!
          </p>
        </div>

        <button
          onClick={() => openBookingModal()}
          className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 shrink-0"
        >
          <Calendar className="w-4 h-4 text-zinc-950" />
          <span>Book with 10% Adv</span>
        </button>
      </div>

      {/* REWARD MILESTONE CARDS (5th & 10th Visit Highlights) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 5th Visit Milestone Card */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
          is5thEligible
            ? 'bg-gradient-to-br from-[#1c180e] via-[#141418] to-[#141418] border-yellow-500/50 shadow-xl shadow-yellow-500/5'
            : 'bg-[#141418] border-zinc-800'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-base">
                5th
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                is5thEligible
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {is5thEligible ? '🎉 Unlocked Reward' : `${Math.max(0, 5 - visitsInCycle)} visits away`}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-100">
                5th Visit: 15% OFF Milestone
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Enjoy a flat 15% instant discount (or ₹300 credit voucher) applied on any hair cut, clean-up, bridal package, or luxury facial.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f0f12] border border-zinc-800/80 space-y-1.5">
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Unlockable Promo Code:</span>
                <span className="font-mono text-yellow-400 font-bold">LOYALTY5TH</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-400">Benefit:</span>
                <span className="text-yellow-400 font-semibold">15% Instant Advance &amp; Bill Off</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => copyCoupon('LOYALTY5TH')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition cursor-pointer"
            >
              {copiedCode === 'LOYALTY5TH' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Coupon Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy 'LOYALTY5TH' Code</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-zinc-500">Auto-applies at checkout</span>
          </div>
        </div>

        {/* 10th Visit Milestone Card (VIP Royal) */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
          is10thEligible
            ? 'bg-gradient-to-br from-[#1c180e] via-[#141418] to-[#141418] border-amber-500/60 shadow-xl shadow-amber-500/10'
            : 'bg-[#141418] border-zinc-800'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base">
                10th
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                is10thEligible
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {is10thEligible ? '👑 Royal Crown Unlocked' : `${Math.max(0, 10 - visitsInCycle)} visits away`}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>10th Visit: 25% OFF or Free Hair Spa</span>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Receive 25% OFF your entire bill or enjoy a complimentary Premium L'Oréal Hair Spa / Detox Facial (worth up to ₹800) + permanent VIP Member Tier status.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f0f12] border border-zinc-800/80 space-y-1.5">
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Unlockable Promo Code:</span>
                <span className="font-mono text-amber-400 font-bold">ROYALVIP10</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-400">Benefit:</span>
                <span className="text-amber-400 font-semibold">25% OFF / Complimentary Spa</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => copyCoupon('ROYALVIP10')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              {copiedCode === 'ROYALVIP10' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Coupon Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy 'ROYALVIP10' Code</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-zinc-500">Includes permanent VIP badge</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DIGITAL PUNCH CARD & LOOKUP SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141418] border border-zinc-800 space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <span className="text-[11px] font-mono text-yellow-500 uppercase tracking-widest">
              DIGITAL LOYALTY CARD
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
              Live Visit Stamp Card for {activeUserData.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Registered Phone: <span className="text-zinc-200 font-mono">{activeUserData.phone}</span> • Current Tier:{' '}
              <span className="text-yellow-400 font-semibold">{activeUserData.tier}</span>
              {activeUserData.matchedAppointmentsCount > 0 && (
                <span className="ml-2 text-emerald-400 text-[11px] font-mono">
                  ({activeUserData.matchedAppointmentsCount} Verified Bookings in System)
                </span>
              )}
            </p>
          </div>

          {/* Quick Simulation controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={incrementVisit}
              className="px-3.5 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Simulate completing another visit at the salon"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Record 1 Visit ({simulatedVisits})</span>
            </button>

            <button
              onClick={resetVisits}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              title="Reset stamps to visit 1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 10-STAMP PUNCH CARD GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">
              Progress: <strong className="text-yellow-400">{visitsInCycle} of 10 Visits</strong> completed
            </span>
            <span className="text-zinc-400 font-mono">
              {visitsInCycle >= 10
                ? 'Cycle complete! Next booking starts new cycle'
                : `${10 - visitsInCycle} more visit(s) to 10th VIP reward`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 10 Interactive Stamp Slots */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 sm:gap-3 pt-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(slot => {
              const isStamped = slot <= visitsInCycle;
              const is5th = slot === 5;
              const is10th = slot === 10;

              return (
                <div
                  key={slot}
                  className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                    isStamped
                      ? is10th
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 scale-105'
                        : is5th
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/20 scale-105'
                        : 'bg-zinc-900 border-yellow-500/50 text-yellow-400'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
                  }`}
                >
                  {/* Badge indicator on 5 and 10 */}
                  {is5th && (
                    <span className="absolute -top-2 px-1.5 py-0.2 rounded bg-yellow-500 text-zinc-950 font-bold text-[8px]">
                      15% OFF
                    </span>
                  )}
                  {is10th && (
                    <span className="absolute -top-2 px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-bold text-[8px]">
                      VIP 25%
                    </span>
                  )}

                  <div className="w-7 h-7 rounded-full flex items-center justify-center border transition-all">
                    {isStamped ? (
                      is10th ? (
                        <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                      ) : is5th ? (
                        <Award className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      )
                    ) : (
                      <span className="text-xs font-mono font-bold text-zinc-600">{slot}</span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold leading-none">
                    Visit {slot}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOOKUP FORM & PRESETS */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleLookup} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter phone number (e.g. 8104026257)..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Visits</span>
            </button>
          </form>

          {/* Quick preset selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-zinc-500 whitespace-nowrap mr-1">Quick Demo:</span>
            {sampleProfiles.map(p => (
              <button
                key={p.phone}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition cursor-pointer ${
                  phoneNumber.includes(p.phone)
                    ? 'bg-yellow-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.name.split(' ')[0]} ({p.visits}V)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HOW THE PROGRAM WORKS (3-Step Guide) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-xs">
            1
          </div>
          <h4 className="font-serif text-sm font-bold text-zinc-100">
            Book Online with 10% Deposit
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Reserve any styling, facial, or grooming treatment online. 10% advance deposit secures your chair and starts tracking your visit history.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-xs">
            2
          </div>
          <h4 className="font-serif text-sm font-bold text-zinc-100">
            Automatic Phone Stamping
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Provide your mobile number at checkout in Mohol. Every completed appointment adds a verified stamp to your digital loyalty pass.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141418] border border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            3
          </div>
          <h4 className="font-serif text-sm font-bold text-zinc-100">
            Redeem on 5th &amp; 10th Visits
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Apply <span className="font-mono text-yellow-400">LOYALTY5TH</span> for 15% OFF on visit 5, and <span className="font-mono text-amber-400">ROYALVIP10</span> for 25% OFF or Free Hair Spa on visit 10.
          </p>
        </div>
      </div>
    </div>
  );
};
