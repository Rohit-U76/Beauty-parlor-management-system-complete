import React, { useState } from 'react';
import { SALON_TERMS_AND_POLICIES } from '../data/initialData';
import { useSalon } from '../context/SalonContext';
import { 
  ShieldCheck, 
  Clock, 
  XCircle, 
  CreditCard, 
  ShieldAlert, 
  HeartPulse, 
  Timer, 
  Gift, 
  Baby, 
  Smartphone, 
  Camera, 
  Scale,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export const CustomerTerms: React.FC = () => {
  const { settings, policies, setActiveNavTab, openBookingModal } = useSalon();
  const [searchTerm, setSearchTerm] = useState('');

  const getPolicyIcon = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'XCircle':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Timer':
        return <Timer className="w-5 h-5 text-orange-400" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-purple-400" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-cyan-400" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-indigo-400" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-pink-400" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-zinc-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-red-400" />;
    }
  };

  const activePolicies = policies && policies.length > 0 ? policies : SALON_TERMS_AND_POLICIES;

  const filteredPolicies = activePolicies.filter((p) => {
    const matchesTitle = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSummary = p.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPoints = p.points ? p.points.some(pt => pt.toLowerCase().includes(searchTerm.toLowerCase())) : false;
    return matchesTitle || matchesSummary || matchesPoints;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-28 lg:pb-12 space-y-8 sm:space-y-12 text-left">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Official Salon Policies &amp; Client Code</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Terms &amp; Salon Policies
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {settings.salonName} ({settings.address}). To ensure supreme hygiene, seamless time management, and a premier salon experience for every client in Mohol, please review our transparent operational guidelines.
        </p>

        {/* Quick Policy Search Bar */}
        <div className="pt-2 max-w-md mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search policies (e.g. 24h notice, advance deposit, allergies...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* 2 Key Pillars: 24-Hour Notice & 10% Advance Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Clause 02
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                24-Hour Advance Cancellation Rule
              </h3>
            </div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Appointments can be rescheduled or cancelled at least <strong>24 hours prior</strong> to the scheduled slot with full deposit rollover. Our system sends an automated reminder 24 hours before your slot to give you ample time.
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold font-mono">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Cancellations under 24 hours forfeit the {settings.advancePercentage || 10}% slot reservation deposit.</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-500/30 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                Clause 01 &amp; 10
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {settings.advancePercentage || 10}% Deposit &amp; {100 - (settings.advancePercentage || 10)}% Counter Settlement
              </h3>
            </div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Pay only <strong>{settings.advancePercentage || 10}% online</strong> via UPI, Google Pay, PhonePe, Cards to guarantee your exclusive salon slot. The remaining <strong>{100 - (settings.advancePercentage || 10)}% balance</strong> is settled comfortably at the counter after service completion.
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Instant digital pass &amp; receipt generated upon {settings.advancePercentage || 10}% advance deposit.</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Policies Card List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>All 11 Salon Clauses &amp; Regulations</span>
          </h2>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Showing {filteredPolicies.length} of {SALON_TERMS_AND_POLICIES.length} policies
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPolicies.map((policy, index) => (
            <div
              key={policy.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 transition space-y-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                  {getPolicyIcon(policy.iconName)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Clause {index + 1}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {policy.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {policy.summary}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {policy.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help & Contact Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Modern Unisex Salon Mohol Front Desk</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
            Have questions regarding treatments or policies?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            Our master stylist and team in Mohol are always available for consultation, bridal customization, and allergy patch testing advice.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 text-zinc-600 dark:text-zinc-300 justify-center md:justify-start">
            <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 hover:text-amber-500 transition">
              <Phone className="w-3.5 h-3.5 text-amber-500" /> +91 {settings.phone}
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <a href={`mailto:${settings.email}`} className="flex items-center gap-1.5 hover:text-amber-500 transition">
              <Mail className="w-3.5 h-3.5 text-amber-500" /> {settings.email}
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-amber-500" /> Mohol - 413213
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <button
            onClick={() => setActiveNavTab('contact')}
            className="px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition cursor-pointer"
          >
            Contact Salon Desk
          </button>
          <button
            onClick={() => openBookingModal()}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <span>Book Appointment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
