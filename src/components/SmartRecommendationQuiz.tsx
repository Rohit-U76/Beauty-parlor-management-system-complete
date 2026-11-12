import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, RefreshCw, Wand2, Lightbulb, CheckSquare, Square } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ServiceItem } from '../types';

interface AiPackage {
  packageTitle: string;
  recommendedServices: string[];
  estimatedTotal: number;
  advanceDeposit: number;
  expertReason: string;
  routineTip: string;
}

export const SmartRecommendationQuiz: React.FC = () => {
  const { isQuizModalOpen, closeQuizModal, openBookingModal, services, settings } = useSalon();

  const [step, setStep] = useState<number>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Women's Salon & Haircare"]);
  const [selectedServices, setSelectedServices] = useState<string[]>(['Skin Glow & Pore Cleansing Facial']);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(['Dull skin & uneven sun tan']);
  const [occasion, setOccasion] = useState<string>("Upcoming Party / Event this week");
  const [budget, setBudget] = useState<string>("₹1,000 - ₹3,000 (Recommended)");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<AiPackage[]>([]);

  if (!isQuizModalOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter(c => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  const toggleService = (srv: string) => {
    setSelectedServices(prev => {
      if (prev.includes(srv)) {
        return prev.length > 1 ? prev.filter(s => s !== srv) : prev;
      }
      return [...prev, srv];
    });
  };

  const toggleConcern = (c: string) => {
    setSelectedConcerns(prev => {
      if (prev.includes(c)) {
        return prev.length > 1 ? prev.filter(item => item !== c) : prev;
      }
      return [...prev, c];
    });
  };

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    setStep(5);

    const advPct = settings.advancePercentage || 10;

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: selectedCategories.join(', '),
          serviceInterest: selectedServices.join(', '),
          hairOrSkinConcern: selectedConcerns.join(', '),
          occasion,
          budgetRange: budget,
          selectedCategories,
          selectedServices,
          selectedConcerns,
          advancePercentage: advPct
        })
      });
      const data = await res.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations.map((r: AiPackage) => {
          const total = Number(r.estimatedTotal) || 2000;
          return {
            ...r,
            estimatedTotal: total,
            advanceDeposit: Math.round((total * advPct) / 100)
          };
        }));
      } else if (data.recommendations && typeof data.recommendations === 'object') {
        const list = Object.values(data.recommendations) as AiPackage[];
        setRecommendations(list.map((r: AiPackage) => {
          const total = Number(r.estimatedTotal) || 2000;
          return {
            ...r,
            estimatedTotal: total,
            advanceDeposit: Math.round((total * advPct) / 100)
          };
        }));
      } else {
        throw new Error('Invalid format');
      }
    } catch (e) {
      console.error(e);
      // Smart dynamic client fallback combining all selected services:
      const priceMap: Record<string, number> = {
        'Skin Glow & Pore Cleansing Facial': 1400,
        'Hair Makeover, Cut & Keratin Therapy': 2800,
        'Executive Beard Edging & Precision Haircut': 650,
        'Bridal High-Definition Glam Makeover': 6500,
        'Nail Extensions & Hand Rejuvenation': 1200,
        'Full Body Aromatherapy Relaxation Spa': 2200
      };

      const rawSum = selectedServices.reduce((acc, s) => acc + (priceMap[s] || 1500), 0);
      const discount = selectedServices.length > 1 ? 0.85 : 1.0;
      const total = Math.max(750, Math.round((rawSum * discount) / 50) * 50);

      const generatedTitle = selectedServices.length > 1
        ? `Complete Multi-Service Synergistic Suite (${selectedServices.length} Selected)`
        : `${selectedServices[0]} Signature Transformation`;

      setRecommendations([
        {
          packageTitle: generatedTitle,
          recommendedServices: selectedServices,
          estimatedTotal: total,
          advanceDeposit: Math.round((total * advPct) / 100),
          expertReason: `Directly formulated for all ${selectedServices.length} of your chosen treatments (${selectedServices.join(' + ')}). Formulated to address ${selectedConcerns.join(' & ')} tailored to your ${occasion}.`,
          routineTip: 'Hydrate skin barrier daily, use mild sulfate-free hair cleanser, and apply SPF 50 sunscreen.'
        },
        ...(selectedServices.length > 1 ? [{
          packageTitle: `Targeted Focus Duo: ${selectedServices[0].split(' ')[0]} & Care`,
          recommendedServices: selectedServices.slice(0, 2),
          estimatedTotal: Math.round(total * 0.7),
          advanceDeposit: Math.round((total * 0.7 * advPct) / 100),
          expertReason: `Essential express duo targeting your top priority concerns with high efficiency.`,
          routineTip: 'Apply light leave-in hair serum and drink plenty of water daily.'
        }] : [])
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPackage = (pkg: AiPackage) => {
    closeQuizModal();
    const serviceList = Array.isArray(pkg.recommendedServices) ? pkg.recommendedServices : [pkg.recommendedServices];
    const advPct = settings.advancePercentage || 10;
    const deposit = Math.round((pkg.estimatedTotal * advPct) / 100);

    // Try matching an existing service or create a curated composite package item
    const matchedService = services.find(s => {
      const sName = (s.name || '').toLowerCase();
      return (serviceList[0] && sName.includes(serviceList[0].toLowerCase())) ||
        (pkg.packageTitle && pkg.packageTitle.toLowerCase().includes(sName));
    });

    const isWomen = selectedCategories.some(c => c.toLowerCase().includes('women'));
    const isMen = selectedCategories.some(c => c.toLowerCase().includes('men'));
    const genderTag = isWomen && !isMen ? 'women' : isMen && !isWomen ? 'men' : 'unisex';

    const customPackageService: ServiceItem = {
      id: matchedService?.id || `pkg-${Date.now()}`,
      name: pkg.packageTitle,
      category: matchedService?.category || 'Curated Packages',
      gender: genderTag,
      durationMinutes: Math.min(180, Math.max(60, serviceList.length * 45)),
      price: pkg.estimatedTotal,
      priceDisplay: `₹${pkg.estimatedTotal.toLocaleString()}`,
      advanceDeposit: deposit,
      description: `Includes: ${serviceList.join(' + ')}. Tailored by Salon AI for: ${selectedConcerns.join(', ')}.`,
      imageUrl: matchedService?.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 96,
      popular: true,
      benefits: [
        ...serviceList.map(s => `Included: ${s}`),
        `Expert match: ${pkg.expertReason}`,
        `Home Care Tip: ${pkg.routineTip || 'Follow salon homecare routine'}`
      ]
    };
    
    openBookingModal(customPackageService);
  };

  const handleReset = () => {
    setStep(1);
    setRecommendations([]);
  };

  const currentAdvPct = settings.advancePercentage || 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#121216] border border-purple-200 dark:border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-200">
        
        {/* Header */}
        <div className="bg-purple-50/80 dark:bg-gradient-to-r dark:from-zinc-950 dark:via-[#1a170b] dark:to-zinc-950 border-b border-purple-200 dark:border-yellow-500/20 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-purple-600/10 dark:bg-yellow-500/20 border border-purple-300 dark:border-yellow-500/40 flex items-center justify-center text-purple-600 dark:text-yellow-400 shrink-0">
              <Wand2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-yellow-400">
                  AI Smart Recommendation Quiz
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-yellow-500/20 text-purple-800 dark:text-yellow-300 uppercase tracking-wider">
                  Multi-Select
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
                Select one or multiple options for customized packages
              </p>
            </div>
          </div>

          <button
            onClick={closeQuizModal}
            className="p-1.5 sm:p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Steps */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-purple-700 dark:text-yellow-400 uppercase tracking-wider">
                  Step 1 of 4: Who are we styling today? (Select Multiple)
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedCategories.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Women's Salon & Haircare", desc: 'Facials, layered haircuts, styling & keratin' },
                  { title: "Men's Executive Grooming", desc: 'Beard trimming, taper fades & charcoal facial' },
                  { title: "HD Bridal & Pre-Bridal", desc: 'Complete wedding looks & pre-bridal therapy' },
                  { title: "Unisex Spa & Nail Art", desc: 'Aromatherapy, gel nail extensions & relaxation' }
                ].map(opt => {
                  const isSelected = selectedCategories.includes(opt.title);
                  return (
                    <button
                      key={opt.title}
                      type="button"
                      onClick={() => toggleCategory(opt.title)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 dark:border-yellow-400 bg-purple-50 dark:bg-yellow-500/10 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-purple-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
                        <span>{opt.title}</span>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-600 dark:text-yellow-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-black font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-purple-700 dark:text-yellow-400 uppercase tracking-wider">
                  Step 2 of 4: Primary beauty focus (Select Multiple)
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedServices.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Skin Glow & Pore Cleansing Facial',
                  'Hair Makeover, Cut & Keratin Therapy',
                  'Executive Beard Edging & Precision Haircut',
                  'Bridal High-Definition Glam Makeover',
                  'Nail Extensions & Hand Rejuvenation',
                  'Full Body Aromatherapy Relaxation Spa'
                ].map(item => {
                  const isSelected = selectedServices.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleService(item)}
                      className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 dark:border-yellow-400 bg-purple-50 dark:bg-yellow-500/10 text-purple-900 dark:text-yellow-300'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-purple-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item}</span>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-600 dark:text-yellow-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-black font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-purple-700 dark:text-yellow-400 uppercase tracking-wider">
                  Step 3 of 4: Specific concerns (Select Multiple)
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedConcerns.length} selected
                </span>
              </div>
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5">Select all that apply</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Dull skin & uneven sun tan',
                    'Frizzy & damaged hair texture',
                    'Beard patchiness & rough skin',
                    'Split ends & lack of volume',
                    'Dry cuticles & tired hands',
                    'Stress tension & neck tightness'
                  ].map(c => {
                    const isSelected = selectedConcerns.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleConcern(c)}
                        className={`p-2.5 rounded-lg border text-xs text-left cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-600 dark:border-yellow-400 bg-purple-50 dark:bg-yellow-500/10 text-purple-900 dark:text-yellow-300 font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span>{c}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-yellow-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5 font-medium">Upcoming Occasion / Timeline</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="Upcoming Party / Event this week">Upcoming Party / Event this week</option>
                  <option value="Wedding / Engagement in 1-2 months">Wedding / Engagement in 1-2 months</option>
                  <option value="Weekend Self-Care Refresh">Weekend Self-Care Refresh</option>
                  <option value="Regular Monthly Maintenance">Regular Monthly Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={() => setStep(2)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-black font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-purple-700 dark:text-yellow-400 uppercase tracking-wider">
                Step 4 of 4: Preferred budget range
              </div>
              <div className="space-y-2.5">
                {[
                  { range: 'Under ₹1,000', note: 'Essential cuts, basic cleanups, express grooming' },
                  { range: '₹1,000 - ₹3,000 (Recommended)', note: 'Radiance facials, layered cuts with styling & spa' },
                  { range: '₹3,000 - ₹8,000+', note: 'Full HD bridal packages, Keratin treatment & luxury combos' }
                ].map(b => (
                  <button
                    key={b.range}
                    type="button"
                    onClick={() => setBudget(b.range)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      budget === b.range
                        ? 'border-purple-600 dark:border-yellow-400 bg-purple-50 dark:bg-yellow-500/10 text-purple-950 dark:text-yellow-300'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-purple-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center justify-between">
                      <span>{b.range}</span>
                      {budget === b.range && <Check className="w-4 h-4 text-purple-600 dark:text-yellow-400" />}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{b.note}</div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={() => setStep(3)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                  Back
                </button>
                <button
                  onClick={handleGenerateRecommendations}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-gradient-to-r dark:from-yellow-500 dark:to-amber-500 dark:hover:from-yellow-400 dark:hover:to-amber-400 dark:text-black font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with AI</span>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              {loading ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-300 dark:border-yellow-500/30 border-t-purple-600 dark:border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
                  <div className="font-serif text-lg font-bold text-purple-900 dark:text-yellow-400">
                    Consulting AI Beauty Expert...
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                    Analyzing selected preferences and calculating precise {currentAdvPct}% advance deposit bundles.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Matched Profile</div>
                      <h4 className="font-serif text-lg font-bold text-zinc-900 dark:text-yellow-400">
                        Tailored Recommendations
                      </h4>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                    {recommendations.map((pkg, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#1c1a11] dark:via-[#141418] dark:to-zinc-950 border border-purple-200 dark:border-yellow-500/30 space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-yellow-500/20 text-purple-700 dark:text-yellow-300 border border-purple-200 dark:border-yellow-500/30 font-bold">
                              AI Best Match #{idx + 1}
                            </span>
                            <h5 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                              {pkg.packageTitle}
                            </h5>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">₹{pkg.estimatedTotal}</div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {currentAdvPct}% Adv: ₹{pkg.advanceDeposit}
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                          <div className="text-purple-700 dark:text-yellow-400 font-bold">Included Services:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {pkg.recommendedServices.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[11px] text-zinc-800 dark:text-zinc-200 font-medium">
                                • {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed flex items-start gap-1.5">
                          <Lightbulb className="w-4 h-4 text-purple-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                          <span>{pkg.expertReason}</span>
                        </div>

                        <div className="border-t border-zinc-200 dark:border-zinc-800/80 pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500">Pay {currentAdvPct}% online via Razorpay</span>
                          <button
                            type="button"
                            onClick={() => handleBookPackage(pkg)}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <span>Book This Package</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
