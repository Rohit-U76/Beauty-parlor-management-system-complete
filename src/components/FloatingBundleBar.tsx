import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Calendar,
  Layers,
  X,
  ChevronUp,
  ArrowRight,
  Percent
} from 'lucide-react';
import { ServiceItem } from '../types';

interface FloatingBundleBarProps {
  selectedServices: ServiceItem[];
  discountRate: number;
  originalPrice: number;
  discountedPrice: number;
  advanceDeposit: number;
  onOpenBundleView: () => void;
  onBookBundle: () => void;
  onClearBundle: () => void;
}

export const FloatingBundleBar: React.FC<FloatingBundleBarProps> = ({
  selectedServices,
  discountRate,
  originalPrice,
  discountedPrice,
  advanceDeposit,
  onOpenBundleView,
  onBookBundle,
  onClearBundle
}) => {
  if (selectedServices.length === 0) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-zinc-950/95 text-white border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 backdrop-blur-xl pointer-events-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Info: Services count & discount status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-zinc-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black">
              {selectedServices.length}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold truncate">
                {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'} in Custom Bundle
              </span>
              {discountRate > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-extrabold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {discountRate}% Discount Active
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-medium">
                  Add 1 more for 10% OFF
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
              <span>Total: <strong className="text-white text-sm">₹{discountedPrice.toLocaleString()}</strong></span>
              {discountRate > 0 && (
                <span className="line-through text-[11px] text-zinc-500">₹{originalPrice.toLocaleString()}</span>
              )}
              <span>•</span>
              <span className="text-emerald-400 font-semibold">10% Adv: ₹{advanceDeposit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={onClearBundle}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
            title="Clear Bundle"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenBundleView}
            className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 border border-zinc-700 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Manage</span>
          </button>

          <button
            onClick={onBookBundle}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-950" />
            <span>Book Bundle (₹{advanceDeposit} Adv)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
