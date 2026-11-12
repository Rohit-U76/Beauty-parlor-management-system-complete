import React, { useState } from 'react';
import { Tag, Copy, Check, Calendar } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const CustomerOffers: React.FC = () => {
  const { offers, openBookingModal, settings } = useSalon();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12 space-y-8 text-left">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5" />
            <span>Salon Deals &amp; Discounts</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Special Offers &amp; Promo Codes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Copy any promo code below and apply it during appointment booking. Pay only {settings.advancePercentage || 10}% advance deposit to secure your slot.
          </p>
        </div>

        <button
          onClick={() => openBookingModal()}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top Tag & Expiry */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
                {offer.discountPercent ? `${offer.discountPercent}% OFF` : `₹${offer.discountAmount} OFF`}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                Valid till Dec 2026
              </span>
            </div>

            {/* Offer details */}
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {offer.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {offer.description}
              </p>
              <div className="text-[11px] text-zinc-400 font-medium pt-1">
                Min. Booking: ₹{offer.minBookingAmount}
              </div>
            </div>

            {/* Coupon Code Pill */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Promo Code</div>
                <div className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">{offer.code}</div>
              </div>

              <button
                onClick={() => handleCopy(offer.code)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Action button */}
            <button
              onClick={() => openBookingModal()}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Apply &amp; Book ({settings.advancePercentage || 10}% Deposit)</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
