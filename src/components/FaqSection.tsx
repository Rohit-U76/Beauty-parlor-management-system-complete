import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Clock,
  Scissors,
  CalendarCheck,
  Search,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';

interface FaqItem {
  id: string;
  category: 'Salon Policies' | 'Service Preparations' | 'Membership & VIP' | 'Payments & Booking';
  question: string;
  answer: string;
  highlight?: string;
}

export const FaqSection: React.FC = () => {
  const { openBookingModal, toggleAiChat, settings } = useSalon();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>('faq-policy-1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Salon Policies',
    'Service Preparations',
    'Membership & VIP',
    'Payments & Booking'
  ];

  const faqs: FaqItem[] = useMemo(() => [
    // ==================== 1. SALON POLICIES ====================
    {
      id: 'faq-policy-1',
      category: 'Salon Policies',
      question: `Why does Modern Unisex Salon require a ${settings.advancePercentage || 10}% advance deposit for reservations?`,
      answer: `Our ${settings.advancePercentage || 10}% advance deposit locks your dedicated time slot with our master stylists and ensures stations are pre-sanitized before your arrival. It eliminates overlapping bookings and guarantees zero wait-time for all scheduled clients.`,
      highlight: `${settings.advancePercentage || 10}% online deposit locks your slot with zero wait-time.`
    },
    {
      id: 'faq-policy-2',
      category: 'Salon Policies',
      question: 'What is the 24-Hour Rescheduling and Cancellation Rule?',
      answer: 'Appointments can be rescheduled or cancelled up to 24 hours before your slot with 100% deposit rollover to any future date. You will receive an automated 24-hour advance reminder notification via WhatsApp/SMS to ensure ample notice.',
      highlight: 'Full deposit rollover if rescheduled at least 24 hours in advance.'
    },
    {
      id: 'faq-policy-3',
      category: 'Salon Policies',
      question: 'What is the grace period if I am running late for my appointment in Mohol?',
      answer: 'We provide a 15-minute grace window for all appointments. If you anticipate arriving later, please contact our front desk at +91 8104026257 so we can adjust the schedule or notify your assigned stylist.',
      highlight: '15-minute grace period with immediate phone support.'
    },
    {
      id: 'faq-policy-4',
      category: 'Salon Policies',
      question: 'What hygiene and sterilization protocols are followed?',
      answer: 'Every scissor, comb, trimmer blade, and facial applicator is sterilized in medical-grade UV/autoclave units between clients. We use single-use disposable capes, biodegradable towels, and fresh neck strips for every service.',
      highlight: 'Medical-grade UV sterilization & disposable single-use capes.'
    },

    // ==================== 2. SERVICE PREPARATIONS & AFTERCARE ====================
    {
      id: 'faq-prep-1',
      category: 'Service Preparations',
      question: 'How should I prepare for HD, 3D, or 4D Bridal Make Up?',
      answer: 'Arrive with a cleansed face free of makeup, heavy moisturizer, or sunscreen. Avoid harsh chemical peels, facial waxing, or new skincare experimentation within 48 hours of your event. Stay hydrated and wear a front-buttoning shirt or robe for effortless dressing.',
      highlight: 'Clean bare skin, avoid waxing 48h prior, wear front-open apparel.'
    },
    {
      id: 'faq-prep-2',
      category: 'Service Preparations',
      question: 'How should I prepare for Hair Keratin, Rebonding, or Straightening treatments?',
      answer: 'Please arrive with clean, un-oiled hair. Chemical treatments take approximately 2.5 to 3.5 hours depending on hair length. Post-treatment, do not wash, tie, or tuck hair behind ears for 48–72 hours, and use our recommended sulfate-free shampoo.',
      highlight: 'Un-oiled hair before service; 48-72h no-wash rule post-treatment.'
    },
    {
      id: 'faq-prep-3',
      category: 'Service Preparations',
      question: 'What are the preparation guidelines for Facials, O3+ Therapy, and Hydrafacials?',
      answer: 'Avoid strong sun exposure or bleaching 24 hours prior to your facial. For gentlemen receiving deep skin therapies or clean-ups, shaving 6–12 hours beforehand ensures maximum serum absorption and eliminates post-facial razor burn.',
      highlight: 'Gentlemen should shave 6-12h prior; avoid direct sunlight 24h.'
    },
    {
      id: 'faq-prep-4',
      category: 'Service Preparations',
      question: 'Do you conduct patch tests for Global Hair Colour and Balayage?',
      answer: 'Yes. For first-time color clients or those with sensitive scalps, we offer a complimentary 24-hour allergy patch test behind the ear to confirm pigment compatibility and ensure scalp safety.',
      highlight: 'Complimentary 24-hour skin allergy patch test available.'
    },

    // ==================== 3. MEMBERSHIP & VIP BENEFITS ====================
    {
      id: 'faq-member-1',
      category: 'Membership & VIP',
      question: 'How do I qualify for the Modern Salon VIP Membership Tier?',
      answer: 'Clients who complete 3 or more visits or spend over ₹5,000 automatically qualify for our VIP Member tier. VIP status includes priority weekend booking during wedding seasons, 10% complimentary addon services, and anniversary bonuses.',
      highlight: 'Automatic VIP qualification after 3 visits or ₹5,000 spending.'
    },
    {
      id: 'faq-member-2',
      category: 'Membership & VIP',
      question: 'How do promotional promo codes (MODERN20, MOHOL10, BRIDAL1000) work?',
      answer: 'Simply enter your coupon code in Step 3 of the online booking modal. The system automatically deducts the promotional discount from your total bill, and calculates the 10% advance deposit on the discounted rate.',
      highlight: 'Instant discount applied directly to total & 10% advance deposit.'
    },
    {
      id: 'faq-member-3',
      category: 'Membership & VIP',
      question: 'What is the Digital Booking Pass and Confirmation and how do I use it?',
      answer: 'Upon paying the 10% deposit, a digital booking confirmation pass with your unique reference number (e.g. SS-2026-XXXX) is generated and sent via WhatsApp. Simply give your name or booking reference upon arriving at our Mohol salon for express priority check-in.',
      highlight: 'Express priority check-in with your booking reference & digital confirmation.'
    },

    // ==================== 4. PAYMENTS & BOOKING ====================
    {
      id: 'faq-pay-1',
      category: 'Payments & Booking',
      question: 'When and how is the remaining 90% balance settled?',
      answer: 'The remaining 90% balance is payable only after your treatment is completed to your satisfaction at our salon reception desk. We accept Google Pay, PhonePe, Paytm, Debit/Credit Cards, and Cash.',
      highlight: '90% balance settled at the salon desk after service completion.'
    },
    {
      id: 'faq-pay-2',
      category: 'Payments & Booking',
      question: 'Are walk-ins accepted without an advance online reservation?',
      answer: 'Walk-ins are welcomed subject to chair availability, but clients with pre-booked 10% online deposits always receive first priority. On weekends and wedding festival dates, online booking is highly recommended.',
      highlight: 'Advance online bookings receive priority VIP seating.'
    }
  ], [settings.advancePercentage]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCat = activeCategory === 'All' || faq.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faq.highlight && faq.highlight.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section className="space-y-8 pt-6">
      {/* SECTION HEADER */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100">
          Everything You Need to Know
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Find instant answers regarding our 10% advance reservation policy, appointment procedures, salon hygiene standards, and accepted payment options.
        </p>
      </div>

      {/* SEARCH AND CATEGORY FILTER BAR */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., advance deposit, cancellation, brands, walk-ins)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 bg-[#141418] border-zinc-800 text-zinc-100 placeholder-zinc-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-yellow-500 text-black font-bold shadow-md shadow-yellow-500/10'
                  : 'bg-[#141418] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ACCORDION LIST */}
      <div className="max-w-4xl mx-auto space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border bg-[#141418] border-zinc-800">
            <HelpCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2 opacity-60" />
            <div className="font-serif font-bold text-base text-zinc-200">No matching questions found</div>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Try searching with another keyword or ask our AI Beauty Consultant for an instant personalized answer.
            </p>
            <button
              type="button"
              onClick={() => toggleAiChat()}
              className="mt-4 px-4 py-2 rounded-xl bg-yellow-500 text-black font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:bg-yellow-400 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Consultant</span>
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-purple-50/70 dark:bg-[#18181f] border-purple-400/80 dark:border-yellow-500/40 shadow-md shadow-purple-500/5'
                    : 'bg-white dark:bg-[#141418] border-purple-100 dark:border-zinc-800/90 hover:border-purple-300 dark:hover:border-zinc-700 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 select-none focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? 'bg-purple-600 dark:bg-yellow-400 ring-4 ring-purple-600/20 dark:ring-yellow-400/20' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                    <span className={`font-serif text-sm sm:text-base font-bold transition-colors ${
                      isOpen ? 'text-purple-900 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-purple-600 dark:text-yellow-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border-t border-purple-100 dark:border-zinc-800/60">
                    <p className="mt-2">{faq.answer}</p>
                    {faq.highlight && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-100/70 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-500/20 text-purple-800 dark:text-yellow-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{faq.highlight}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QUICK ASSISTANCE BANNER */}
      <div className="max-w-4xl mx-auto p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all bg-gradient-to-r from-purple-50/90 via-white to-purple-50/90 dark:from-[#141418] dark:to-[#1c1c24] border-purple-200 dark:border-yellow-500/30 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-base font-bold text-purple-700 dark:text-yellow-400 flex items-center justify-center sm:justify-start gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Still have questions about a treatment?</span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Our AI beauty concierge is online 24/7 to recommend tailored packages and styling tips.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => toggleAiChat()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold text-xs border border-purple-600 dark:border-zinc-700 transition-colors shadow-sm cursor-pointer"
          >
            Chat with AI
          </button>
        </div>
      </div>
    </section>
  );
};
