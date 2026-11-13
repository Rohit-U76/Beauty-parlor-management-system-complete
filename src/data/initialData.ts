import {
  ServiceItem,
  Appointment,
  ContactInquiry,
  Customer,
  Review,
  OfferCoupon,
  GalleryItem,
  NotificationItem,
  SalonSettings,
  StaffMember
} from '../types';

export interface SalonPolicyItem {
  id: string;
  iconName: string;
  title: string;
  summary: string;
  points: string[];
}

export const SALON_TERMS_AND_POLICIES: SalonPolicyItem[] = [
  {
    id: 'pol-1',
    iconName: 'Clock',
    title: 'Appointments & Bookings',
    summary: 'Prior appointment is recommended to avoid waiting time.',
    points: [
      'Prior appointment is recommended to avoid waiting time.',
      'Walk-ins are welcomed and strictly subject to chair/stylist availability.',
      'Please arrive at least 10–15 minutes early for your scheduled appointment to enjoy a relaxed consultation.'
    ]
  },
  {
    id: 'pol-2',
    iconName: 'XCircle',
    title: 'Cancellation & No-Show Policy',
    summary: 'Appointments must be cancelled or rescheduled at least 24 hours in advance.',
    points: [
      'Appointments must be cancelled or rescheduled at least 24 hours in advance.',
      'Late cancellations or no-shows may incur a cancellation fee against the advance deposit.',
      'Repeated no-shows may require mandatory 100% advance payment for future bookings.'
    ]
  },
  {
    id: 'pol-3',
    iconName: 'CreditCard',
    title: 'Payments & Transparent Billing',
    summary: '10% online advance deposit to secure your slot; balance payable after completion.',
    points: [
      'A 10% advance deposit secures your appointment slot instantly.',
      'All services must be paid in full immediately after service completion at the salon desk.',
      'We accept Cash, UPI (Google Pay, PhonePe, Paytm), and other digital payment methods.',
      'Prices are transparent and subject to change without prior notice for special customizations.'
    ]
  },
  {
    id: 'pol-4',
    iconName: 'ShieldAlert',
    title: 'Refund & Service Policy',
    summary: 'No refunds on services once completed. We strive for 100% customer satisfaction.',
    points: [
      'No cash or digital refunds on services once completed.',
      'If you are not fully satisfied, please inform our stylist or front desk immediately—we will promptly adjust or resolve the issue.',
      'Special packages and prepaid services are non-refundable and non-transferable.'
    ]
  },
  {
    id: 'pol-5',
    iconName: 'HeartPulse',
    title: 'Health & Safety Disclosures',
    summary: 'Clients must disclose any allergies, sensitivities, or medical conditions prior to treatment.',
    points: [
      'Clients must inform our staff about any allergies, skin sensitivities, scalp conditions, or medical issues before any chemical or skin service.',
      'The salon is not responsible for any adverse reactions if health information is undisclosed.',
      'Patch tests are readily available and recommended for chemical hair coloring and bleaching treatments.'
    ]
  },
  {
    id: 'pol-6',
    iconName: 'Timer',
    title: 'Late Arrival Policy',
    summary: 'Arrivals exceeding 15 minutes may result in reduced service time or rescheduling.',
    points: [
      'Late arrival may result in reduced service time to prevent disruption for following clients.',
      'If you are more than 15 minutes late without notice, your appointment may be rescheduled or cancelled.'
    ]
  },
  {
    id: 'pol-7',
    iconName: 'Gift',
    title: 'Packages & Special Offers',
    summary: 'Packages have a designated validity period and terms.',
    points: [
      'Promotional packages and seasonal vouchers have a specified validity period and must be utilized within that timeframe.',
      'Offers, promo codes, and discounts cannot be combined with other ongoing promotions unless explicitly stated.'
    ]
  },
  {
    id: 'pol-8',
    iconName: 'Baby',
    title: 'Children Policy',
    summary: 'Children must be supervised by parents/guardians at all times.',
    points: [
      'Children must be supervised by parents or guardians at all times for safety around hot tools and styling shears.',
      'The salon is not responsible for any accidental injury or property damage caused by unsupervised children.'
    ]
  },
  {
    id: 'pol-9',
    iconName: 'Smartphone',
    title: 'Personal Belongings',
    summary: 'Keep personal belongings in sight; salon is not liable for lost items.',
    points: [
      'Please keep your valuables, jewelry, and personal items securely with you.',
      'The salon is not responsible for lost, misplaced, or damaged personal belongings.'
    ]
  },
  {
    id: 'pol-10',
    iconName: 'Camera',
    title: 'Photography & Promotions',
    summary: 'Before/after portfolio photography is captured strictly with client consent.',
    points: [
      'The salon may request to capture before-and-after photographs or short videos for portfolio and social media showcases.',
      'All promotional photos and videos are captured strictly with explicit client consent.'
    ]
  },
  {
    id: 'pol-11',
    iconName: 'Scale',
    title: 'Right to Refuse Service',
    summary: 'We uphold a respectful, safe, and professional environment.',
    points: [
      'The salon reserves the right to refuse service to anyone behaving inappropriately, aggressively, or disrespectfully toward staff or fellow guests.'
    ]
  }
];

export const INITIAL_SERVICES: ServiceItem[] = [
  // ==================== 1. MAKE UP ====================
  {
    id: 'srv-mu-1',
    name: 'Grooming Make Up',
    category: 'Make Up',
    gender: 'unisex',
    durationMinutes: 45,
    price: 2000,
    priceDisplay: '₹2,000 / ₹2,500',
    tierOptions: [
      { label: 'Standard Grooming & Tone Evening', price: 2000, durationMinutes: 45 },
      { label: 'Premium HD Grooming & Beard Touch', price: 2500, durationMinutes: 60 }
    ],
    advanceDeposit: 200, // 10%
    description: 'Flawless skin tone evening, subtle natural contouring, eye grooming, and camera-ready matte setting for executive occasions and groom styling.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 42,
    benefits: ['Natural camera-ready matte finish', 'Conceals blemishes & dark circles', 'Long-lasting sweat resistance', 'Beard & brow grooming']
  },
  {
    id: 'srv-mu-2',
    name: 'HD Make Up',
    category: 'Make Up',
    gender: 'women',
    durationMinutes: 90,
    price: 5000,
    priceDisplay: '₹5,000 / ₹7,000',
    tierOptions: [
      { label: 'HD Party & Occasion Make Up', price: 5000, durationMinutes: 75 },
      { label: 'HD Bridal / Engagement Makeover', price: 7000, durationMinutes: 90 }
    ],
    advanceDeposit: 500, // 10%
    description: 'High-definition micro-pigment base, waterproof air-lock finish, custom lashes, and contouring designed for high-resolution studio photography.',
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 68,
    benefits: ['16-hour smudge-proof base', 'Zero flash-back in photography', 'Custom mink lashes included', 'Dupatta / hair accessory setting']
  },
  {
    id: 'srv-mu-3',
    name: 'Make Up 3D / 4D',
    category: 'Make Up',
    gender: 'women',
    durationMinutes: 120,
    price: 10000,
    priceDisplay: '₹10,000 - ₹12,000',
    tierOptions: [
      { label: '3D Luxury High-Glam Artistry', price: 10000, durationMinutes: 105 },
      { label: '4D Master Bridal Sculpt & Airbrush Base', price: 12000, durationMinutes: 120 }
    ],
    advanceDeposit: 1000, // 10%
    description: 'Master-level dimensional facial sculpting, light-reflective 3D/4D highlighting, airbrush waterproof base, customized mink lashes, and luxury bridal drape.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 54,
    benefits: ['Ultra-luxury 4D airbrush sculpt', 'Waterproof & tear-proof longevity', 'Complete bridal styling and jewelry placement', 'Complimentary touch-up kit']
  },

  // ==================== 2. SKIN SERVICES ====================
  {
    id: 'srv-sk-1',
    name: 'Face Bleaching',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 30,
    price: 300,
    priceDisplay: '₹300 / ₹400 / ₹500',
    tierOptions: [
      { label: 'Regular Gold Glow Bleach', price: 300, durationMinutes: 25 },
      { label: 'Oxy Fresh Anti-Tan Bleach', price: 400, durationMinutes: 30 },
      { label: 'Diamond Sparkle Luxury Bleach', price: 500, durationMinutes: 35 }
    ],
    advanceDeposit: 30,
    description: 'Gentle facial hair lightener and instant skin tone brightening enriched with active oxygen and herbal soothing botanicals.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.8,
    reviewsCount: 31,
    benefits: ['Instant golden radiance', 'Lightens fine facial hair seamlessly', 'Removes sun tan', 'Infused with soothing aloe']
  },
  {
    id: 'srv-sk-2',
    name: 'Body Polishing',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 90,
    price: 3000,
    priceDisplay: '₹3,000',
    tierOptions: [
      { label: 'Full Body Scrub & Glow Polish', price: 3000, durationMinutes: 90 }
    ],
    advanceDeposit: 300,
    description: 'Full body walnut and sea salt micro-exfoliation, dead cell detoxification, hydrating botanical butter wrap, and luminous glow oil infusion.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 26,
    benefits: ['Silky velvety smooth skin', 'Unclogs body pores & eliminates ingrowns', 'Deep hydration wrap', 'Relieves whole body tension']
  },
  {
    id: 'srv-sk-3',
    name: 'Face Clean Up',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 35,
    price: 150,
    priceDisplay: '₹150 / ₹300 / ₹600',
    tierOptions: [
      { label: 'Basic Refresh Clean Up', price: 150, durationMinutes: 25 },
      { label: 'Fruit Radiance Clean Up', price: 300, durationMinutes: 35 },
      { label: 'Deep Pore Herbal Anti-Acne Clean Up', price: 600, durationMinutes: 45 }
    ],
    advanceDeposit: 15,
    description: 'Pore unclogging, blackhead extraction, herbal steam, gentle scrub, and cooling botanical clay pack for fresh, oil-free skin.',
    imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f5be6e20f1a?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.8,
    reviewsCount: 52,
    benefits: ['Painless blackhead & whitehead removal', 'Removes excess oil and dead skin', 'Instant refreshing glow', 'Soothes active breakouts']
  },
  {
    id: 'srv-sk-4',
    name: 'Normal Facial',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 45,
    price: 600,
    priceDisplay: '₹600 / ₹700 / ₹800',
    tierOptions: [
      { label: 'Herbal Glow Facial', price: 600, durationMinutes: 45 },
      { label: 'Pearl Brightening Facial', price: 700, durationMinutes: 45 },
      { label: 'Diamond Shine Anti-Pollution Facial', price: 800, durationMinutes: 50 }
    ],
    advanceDeposit: 60,
    description: 'Traditional relaxing 5-step facial with cleansing milk, micro-scrub, nourishing massage cream, steam, and skin-tightening face pack.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.8,
    reviewsCount: 39,
    benefits: ['Deep facial muscle relaxation', 'Boosts natural micro-circulation', 'Hydrates tired and dull skin', 'Gentle on all skin types']
  },
  {
    id: 'srv-sk-5',
    name: 'Cheryla’s Facial',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 60,
    price: 1500,
    priceDisplay: '₹1,500 / ₹2,000',
    tierOptions: [
      { label: "Cheryla's Radiance Glow Therapy", price: 1500, durationMinutes: 60 },
      { label: "Cheryla's Luxury Anti-Tan & Whitening", price: 2000, durationMinutes: 75 }
    ],
    advanceDeposit: 150,
    description: 'Premium dermatologically formulated Cheryla brand treatment targeting hyperpigmentation, deep tanning, and cellular skin rejuvenation.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 34,
    benefits: ['Targeted dark spot lightening', 'Restores natural skin barrier', 'Advanced bio-enzymatic peel', 'Long-lasting dewy radiance']
  },
  {
    id: 'srv-sk-6',
    name: 'O3 Prof. Facial',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 60,
    price: 2500,
    priceDisplay: '₹2,500 / ₹3,000',
    tierOptions: [
      { label: 'O3+ Brightening & Whitening Luxury', price: 2500, durationMinutes: 60 },
      { label: 'O3+ Professional Bridal D-Tan & Derma Glow', price: 3000, durationMinutes: 75 }
    ],
    advanceDeposit: 250,
    description: 'Signature salon-grade O3+ professional treatment with active oxygen peel, enzyme serum infusion, cooling rubber mask, and photo-rejuvenation.',
    imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f5be6e20f1a?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 47,
    benefits: ['Clinical-grade oxygen therapy', 'Instant 3-tone brightness', 'Algae peel-off rubber mask', 'Tightens open pores']
  },
  {
    id: 'srv-sk-7',
    name: 'Hydrafacial',
    category: 'Skin Services',
    gender: 'unisex',
    durationMinutes: 60,
    price: 4500,
    priceDisplay: '₹4,500 / ₹5,000',
    tierOptions: [
      { label: 'Vortex Deep Hydro Exfoliation', price: 4500, durationMinutes: 60 },
      { label: 'Advanced Clinical Hydrafacial + LED Light Therapy', price: 5000, durationMinutes: 75 }
    ],
    advanceDeposit: 450,
    description: 'Multi-step vortex hydro-dermabrasion that vacuums out impurities, infuses hyaluronic acid and peptides, and stimulates collagen with medical LED.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 38,
    benefits: ['Painless vortex pore extraction', 'Hyaluronic acid & antioxidant infusion', 'Zero downtime with immediate glass skin', 'Red & Blue LED therapy']
  },

  // ==================== 3. HAIR SERVICES ====================
  {
    id: 'srv-hr-1',
    name: 'Blow Dry',
    category: 'Hair Services',
    gender: 'unisex',
    durationMinutes: 20,
    price: 250,
    priceDisplay: '₹250',
    tierOptions: [
      { label: 'Professional Styling Blow Dry', price: 250, durationMinutes: 20 }
    ],
    advanceDeposit: 25,
    description: 'Quick heat-protected volume blowout, bounce styling, and silky anti-humidity shine mist for party or office styling.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.7,
    reviewsCount: 22,
    benefits: ['Thermal heat shield application', 'Instant bounce & body', 'Long-lasting frizz hold', 'Lightweight shine serum']
  },
  {
    id: 'srv-hr-2',
    name: 'Formal Hair Cut',
    category: 'Hair Services',
    gender: 'men',
    durationMinutes: 30,
    price: 150,
    priceDisplay: '₹150',
    tierOptions: [
      { label: 'Classic Formal Scissor & Clipper Cut', price: 150, durationMinutes: 30 }
    ],
    advanceDeposit: 15,
    description: 'Precision formal scissor styling, clean neck taper, sideburn trim, and clean combing finish tailored to your workplace grooming.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 65,
    benefits: ['Clean sharp neck taper', 'Precision scissor texture', 'Hot styling comb finish', 'Custom hairline edge']
  },
  {
    id: 'srv-hr-3',
    name: 'Kid’s Hair Cut',
    category: 'Hair Services',
    gender: 'unisex',
    durationMinutes: 20,
    price: 150,
    priceDisplay: '₹150',
    tierOptions: [
      { label: 'Gentle Kids Precision Cut', price: 150, durationMinutes: 20 }
    ],
    advanceDeposit: 15,
    description: 'Patient, gentle, and trendy haircuts for boys and girls in a welcoming kid-friendly salon environment.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.9,
    reviewsCount: 28,
    benefits: ['Gentle patient stylist approach', 'Trendy stylish cuts', 'Hygienic sanitized tools', 'Fast & comfortable experience']
  },
  {
    id: 'srv-hr-4',
    name: 'Haircut & Style',
    category: 'Hair Services',
    gender: 'unisex',
    durationMinutes: 45,
    price: 500,
    priceDisplay: '₹500',
    tierOptions: [
      { label: 'Custom Layered Haircut & Finish', price: 500, durationMinutes: 45 }
    ],
    advanceDeposit: 50,
    description: 'Face-framing haircut customized to your hair texture, facial symmetry, and personal aesthetic with hot styling.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.8,
    reviewsCount: 45,
    benefits: ['Tailored to face structure', 'Adds movement & volume', 'Removes damaged ends', 'Styling product application']
  },
  {
    id: 'srv-hr-5',
    name: 'Advance Hair Cut & Blow Dry',
    category: 'Hair Services',
    gender: 'unisex',
    durationMinutes: 45,
    price: 550,
    priceDisplay: '₹550',
    tierOptions: [
      { label: 'Creative Advanced Cut + Volume Blowout', price: 550, durationMinutes: 45 }
    ],
    advanceDeposit: 55,
    description: 'Advanced texturizing, graduation cuts, butterfly/curtain bang styling paired with full heat-protected blowout.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 51,
    benefits: ['Butterfly / curtain bangs styling', 'Precision weight removal', 'High-volume blowout finish', 'Long-lasting salon shape']
  },

  // ==================== 4. COLOR SERVICES ====================
  {
    id: 'srv-cl-1',
    name: 'Global Hair Colour',
    category: 'Color Services',
    gender: 'unisex',
    durationMinutes: 90,
    price: 2500,
    priceDisplay: '₹2,500 / ₹3,000 / ₹3,500',
    tierOptions: [
      { label: 'Global Color (Short Hair)', price: 2500, durationMinutes: 75 },
      { label: 'Global Color (Medium Shoulder)', price: 3000, durationMinutes: 90 },
      { label: 'Global Color (Long Waist Length)', price: 3500, durationMinutes: 105 }
    ],
    advanceDeposit: 250,
    description: 'Full root-to-tip seamless ammonia-free formulation with high-gloss pigments, nourishing conditioning, and vibrant coverage.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 37,
    benefits: ['Ammonia-safe gentle formula', '100% grey coverage', 'Gloss-enhancement serum', 'Color-lock deep mask treatment']
  },
  {
    id: 'srv-cl-2',
    name: 'Normal Highlight',
    category: 'Color Services',
    gender: 'unisex',
    durationMinutes: 30,
    price: 300,
    priceDisplay: '₹300 per strip',
    tierOptions: [
      { label: 'Single Foil Accent Strip', price: 300, durationMinutes: 20 },
      { label: '3 Accent Foils Pack', price: 900, durationMinutes: 40 }
    ],
    advanceDeposit: 30,
    description: 'Custom foil streak placement for subtle peek-a-boo dimension, caramel accents, or bold vibrant pop streaks.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.8,
    reviewsCount: 19,
    benefits: ['Per-strip flexible pricing', 'Caramel / Honey / Burgundy tones', 'Protective bond-builder shield', 'Toned to perfection']
  },
  {
    id: 'srv-cl-3',
    name: 'Full Highlight',
    category: 'Color Services',
    gender: 'unisex',
    durationMinutes: 120,
    price: 5000,
    priceDisplay: '₹5,000 / ₹6,000 / ₹6,500',
    tierOptions: [
      { label: 'Full Foil Highlights (Short/Medium)', price: 5000, durationMinutes: 105 },
      { label: 'Full Foil Highlights (Long)', price: 6000, durationMinutes: 120 },
      { label: 'Full Foil Highlights (Extra Dense / Long)', price: 6500, durationMinutes: 135 }
    ],
    advanceDeposit: 500,
    description: 'Comprehensive whole-head micro-weave foiling technique creating high-contrast multi-tonal dimensional blonde, honey, or copper highlights.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 32,
    benefits: ['Multi-dimensional micro-weave foils', 'Customized gloss toner rinse', 'Plex bond re-builder included', 'Silky post-color blowout']
  },
  {
    id: 'srv-cl-4',
    name: 'Balayage Color Tech',
    category: 'Color Services',
    gender: 'unisex',
    durationMinutes: 150,
    price: 6000,
    priceDisplay: '₹6,000 / ₹7,000',
    tierOptions: [
      { label: 'Balayage Freehand (Medium Hair)', price: 6000, durationMinutes: 135 },
      { label: 'Balayage Signature Master Blend (Long)', price: 7000, durationMinutes: 150 }
    ],
    advanceDeposit: 600,
    description: 'French freehand painted gradation technique delivering seamless sun-kissed melted roots, soft shadow effects, and zero harsh regrowth lines.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 41,
    benefits: ['Zero harsh grow-out line', 'Hand-painted artistic gradation', 'Root melt shadow blending', 'Vibrant mirror shine finish']
  },
  {
    id: 'srv-cl-5',
    name: 'Root Color Touch Up',
    category: 'Color Services',
    gender: 'unisex',
    durationMinutes: 45,
    price: 1200,
    priceDisplay: '₹1,200',
    tierOptions: [
      { label: '100% Grey Coverage Root Touch-Up', price: 1200, durationMinutes: 45 }
    ],
    advanceDeposit: 120,
    description: 'Precise up to 2-inch new-growth grey coverage with gentle scalp barrier protection and color-lock rinse.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.8,
    reviewsCount: 29,
    benefits: ['100% grey coverage on roots', 'Gentle on sensitive scalps', 'Fast 45-minute processing', 'Color blend wash & dry']
  },

  // ==================== 5. HAIR CHEMICAL SERVICES ====================
  {
    id: 'srv-ch-1',
    name: 'Hair Rebonding',
    category: 'Hair Chemical Services',
    gender: 'unisex',
    durationMinutes: 180,
    price: 4000,
    priceDisplay: '₹4,000 / ₹5,000',
    tierOptions: [
      { label: 'Rebonding (Medium Length)', price: 4000, durationMinutes: 160 },
      { label: 'Rebonding (Long Length)', price: 5000, durationMinutes: 180 }
    ],
    advanceDeposit: 400,
    description: 'Permanent bond-altering thermal chemical straightening that transforms unruly curls and coarse waves into pin-straight, ultra-sleek hair.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 36,
    benefits: ['Pin-straight silky smooth hair', 'Permanent curl realignment', 'High-gloss thermal finish', 'Includes post-rebond hair spa']
  },
  {
    id: 'srv-ch-2',
    name: 'Hair Straightening',
    category: 'Hair Chemical Services',
    gender: 'unisex',
    durationMinutes: 180,
    price: 5000,
    priceDisplay: '₹5,000 / ₹6,000 / ₹7,000',
    tierOptions: [
      { label: 'Thermal Straightening (Short Hair)', price: 5000, durationMinutes: 150 },
      { label: 'Thermal Straightening (Medium)', price: 6000, durationMinutes: 180 },
      { label: 'Thermal Straightening (Long / Dense)', price: 7000, durationMinutes: 210 }
    ],
    advanceDeposit: 500,
    description: 'Intense smoothening technology infused with micro-keratin shields to eliminate waviness, reduce daily styling time, and lock in mirror shine.',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 44,
    benefits: ['Transforms thick frizzy hair', 'Locks in glass-like shine', 'Cuts daily hair prep time', 'Long-lasting sleek finish']
  },
  {
    id: 'srv-ch-3',
    name: 'Keratin Treatment',
    category: 'Hair Chemical Services',
    gender: 'unisex',
    durationMinutes: 150,
    price: 4000,
    priceDisplay: '₹4,000 / ₹5,500 / ₹6,000',
    tierOptions: [
      { label: 'Keratin Smooth Therapy (Short/Shoulder)', price: 4000, durationMinutes: 120 },
      { label: 'Keratin Smooth Therapy (Medium Waist)', price: 5500, durationMinutes: 150 },
      { label: 'Keratin Smooth Therapy (Extra Long)', price: 6000, durationMinutes: 165 }
    ],
    advanceDeposit: 400,
    description: 'Formaldehyde-free intense protein repair that eliminates 95% frizz, restores damaged hair cuticles, and leaves hair silky and manageable for up to 4 months.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 59,
    benefits: ['Eliminates 95% frizz & flyaways', 'Repairs heat & chemical damage', 'Lasts up to 4 months', 'Mirror-like healthy gloss']
  },
  {
    id: 'srv-ch-4',
    name: 'Hair Treatment (Spa & Repair)',
    category: 'Hair Chemical Services',
    gender: 'unisex',
    durationMinutes: 60,
    price: 800,
    priceDisplay: '₹800 / ₹1,200 / ₹1,500',
    tierOptions: [
      { label: 'Classic Deep Conditioning Hair Spa', price: 800, durationMinutes: 45 },
      { label: 'Intense Moisture & Damage Repair Spa', price: 1200, durationMinutes: 60 },
      { label: 'Anti-Dandruff & Scalp Purifying Spa', price: 1500, durationMinutes: 60 }
    ],
    advanceDeposit: 80,
    description: 'Multi-layer hair fiber reconstruction, steam hydration, and scalp massage with essential Moroccan argan and macadamia oils.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.8,
    reviewsCount: 35,
    benefits: ['Intense hydration for dry ends', 'Relieves scalp stress & tension', 'Restores elasticity & strength', 'Steaming hot towel wrap']
  },
  {
    id: 'srv-ch-5',
    name: 'Scalp Advance Treatment',
    category: 'Hair Chemical Services',
    gender: 'unisex',
    durationMinutes: 60,
    price: 1200,
    priceDisplay: '₹1,200 / ₹1,500 / ₹2,500',
    tierOptions: [
      { label: 'Clarifying Exfoliating Scalp Peel', price: 1200, durationMinutes: 45 },
      { label: 'Micro-Mist Scalp Detox & Follicle Unclog', price: 1500, durationMinutes: 60 },
      { label: 'Clinical Hair Fall Control & Scalp Rebirth', price: 2500, durationMinutes: 75 }
    ],
    advanceDeposit: 120,
    description: 'Advanced clinical scalp therapy addressing sebum buildup, flaky scalp, weak roots, and thinning hair with peptide stimulation and ozone therapy.',
    imageUrl: 'https://images.unsplash.com/photo-1512290900672-1f5be6e20f1a?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 27,
    benefits: ['Unclogs blocked hair follicles', 'Strengthens roots against hair fall', 'Combats stubborn dandruff & itch', 'Micro-mist ozone steam']
  },

  // ==================== 6. MEN'S EXECUTIVE GROOMING ====================
  {
    id: 'srv-men-1',
    name: "Men's Fade & Beard Sculpt",
    category: "Men's Executive Grooming",
    gender: 'men',
    durationMinutes: 45,
    price: 350,
    priceDisplay: '₹350 / ₹450',
    tierOptions: [
      { label: 'Classic Scissor Cut & Razor Edge Beard', price: 350, durationMinutes: 40 },
      { label: 'Skin Fade + Hot Oil Beard Spa & Shave', price: 450, durationMinutes: 50 }
    ],
    advanceDeposit: 35,
    description: 'Precision low/mid/high taper fade haircut paired with hot towel razor beard line shaping and cooling balm massage.',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.9,
    reviewsCount: 78,
    benefits: ['Precision clipper fade & scissor texturizing', 'Razor sharp beard edging', 'Hot towel steam prep', 'Anti-bump soothing aftershave']
  },
  {
    id: 'srv-men-2',
    name: "Men's Charcoal D-Tan & Facial",
    category: "Men's Executive Grooming",
    gender: 'men',
    durationMinutes: 45,
    price: 650,
    priceDisplay: '₹650 / ₹900',
    tierOptions: [
      { label: 'Activated Charcoal Anti-Pollution Clean-Up', price: 650, durationMinutes: 35 },
      { label: 'Executive D-Tan Glow & Steam Extraction Facial', price: 900, durationMinutes: 50 }
    ],
    advanceDeposit: 65,
    description: 'Formulated specifically for tougher male skin exposed to sun and pollution. Draws out blackheads, eliminates sun tan, and restores clear tone.',
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 4.8,
    reviewsCount: 43,
    benefits: ['Instantly lifts sun tanning & grease', 'Deep blackhead extraction', 'Cooling menthol gel mask', 'Controls excess oil for days']
  },
  {
    id: 'srv-men-3',
    name: "Men's Anti-Dandruff & Scalp Spa",
    category: "Men's Executive Grooming",
    gender: 'men',
    durationMinutes: 40,
    price: 600,
    priceDisplay: '₹600 / ₹800',
    tierOptions: [
      { label: 'Tea Tree Purifying Scalp Spa', price: 600, durationMinutes: 40 },
      { label: 'Intensive Follicle Rebirth & High Frequency Therapy', price: 800, durationMinutes: 50 }
    ],
    advanceDeposit: 60,
    description: 'Invigorating tea tree and peppermint head massage, clarifying ozone steam, and high-frequency scalp stimulation to curb flakes and hair thinning.',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    popular: false,
    rating: 4.9,
    reviewsCount: 31,
    benefits: ['Eradicates stubborn scalp flaking', 'Stimulates sluggish hair roots', 'Deeply relaxing neck & temple massage', 'Cooling menthol finish']
  },
  {
    id: 'srv-men-4',
    name: "Men's Groom Wedding Day Styling Package",
    category: "Men's Executive Grooming",
    gender: 'men',
    durationMinutes: 90,
    price: 2500,
    priceDisplay: '₹2,500',
    tierOptions: [
      { label: 'Full Groom Package (Hair + Beard + Facial + D-Tan + Setting)', price: 2500, durationMinutes: 90 }
    ],
    advanceDeposit: 250,
    description: 'Complete all-inclusive wedding makeover: customized haircut, royal hot towel beard styling, O3+ d-tan facial, and camera-ready matte grooming.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 29,
    benefits: ['Complete groom transformation', 'Photography ready matte finish', 'Hair styling with high hold pomade', 'Safa & brooch assistance']
  },

  // ==================== 7. BRIDAL & PRE-BRIDAL (WOMEN) ====================
  {
    id: 'srv-wom-1',
    name: 'Bridal 4D Makeover & Draping',
    category: 'Bridal & Pre-Bridal',
    gender: 'women',
    durationMinutes: 150,
    price: 12000,
    priceDisplay: '₹12,000',
    tierOptions: [
      { label: 'Master Airbrush Bridal Makeover + Hair Artistry + Saree Draping', price: 12000, durationMinutes: 150 }
    ],
    advanceDeposit: 1200,
    description: 'The pinnacle bridal experience. Includes 4D waterproof airbrush makeup base, traditional Maharashtrian / modern bridal hair styling, jewelry setting, and precision saree/lehenga draping.',
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 88,
    benefits: ['Full 18-hour waterproof tear-proof base', 'Artisan hair updo with real floral setting', 'Precision saree / lehenga pleating & pin-up', 'Complimentary bridal touch-up kit']
  },
  {
    id: 'srv-wom-2',
    name: 'Pre-Bridal Glow Suite',
    category: 'Bridal & Pre-Bridal',
    gender: 'women',
    durationMinutes: 180,
    price: 6500,
    priceDisplay: '₹6,500',
    tierOptions: [
      { label: 'Complete Pre-Bridal (Hydrafacial + Body Polish + Hair Spa + Waxing + Pedicure)', price: 6500, durationMinutes: 180 }
    ],
    advanceDeposit: 650,
    description: 'Designed 3-7 days prior to weddings. Full body exfoliation, O3+ Hydrafacial, intensive argan hair therapy, and luxury manicure & pedicure.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    popular: true,
    rating: 5.0,
    reviewsCount: 49,
    benefits: ['Head-to-toe bridal rejuvenation', 'Glass skin radiance for wedding lights', 'Full body silky exfoliation', 'Ultra-relaxing spa therapy']
  }
];

// Helper to get relative ISO date string using local date (avoids UTC timezone shift bug)
const getRelativeDate = (offsetDays: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_INQUIRIES: ContactInquiry[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'HD Bridal Makeover Transformation',
    subtitle: 'High-definition 4D bridal artistry and flawless glow.',
    category: 'Bridal',
    tag: 'Make Up',
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gal-vid-1',
    title: 'Bridal Hair & Makeup Transformation Reel',
    subtitle: 'Full 360 degree reel showing the reception hairstyle & airbrush makeover.',
    category: 'Bridal',
    tag: 'Video Reel',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '0:15 min'
  },
  {
    id: 'gal-2',
    title: 'Modern Salon Mohol Studio Ambience',
    subtitle: 'B.N. Gund Complex, Near ICICI Bank, Mohol. Hygienic styling chairs and lighting.',
    category: 'Salon Interior',
    tag: 'Interior',
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gal-vid-2',
    title: 'Precision Fade & Beard Sculpting Video',
    subtitle: 'Watch master stylist execute a sharp razor fade and hot towel styling.',
    category: 'Men Grooming',
    tag: 'Video Reel',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    duration: '0:15 min'
  },
  {
    id: 'gal-3',
    title: 'Balayage & Global Color Blends',
    subtitle: 'Dimensional honey blonde and caramel seamless gradation.',
    category: 'Hair Care',
    tag: 'Color',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gal-4',
    title: 'O3+ & Hydrafacial Skin Rejuvenation',
    subtitle: 'Deep pore detox, active oxygen glow, and vortex hydro peel.',
    category: 'Skin Care',
    tag: 'Facial',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gal-5',
    title: 'Keratin & Straightening Mirror Finish',
    subtitle: 'Frizz-free, silky straight glass hair with 4-month retention.',
    category: 'Hair Care',
    tag: 'Chemical',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gal-6',
    title: 'Executive Grooming & Sharp Fades',
    subtitle: 'Precision clipper fading, beard styling, and razor finish.',
    category: 'Men Grooming',
    tag: 'Grooming',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  }
];

export const INITIAL_OFFERS: OfferCoupon[] = [
  {
    id: 'off-1',
    code: 'MODERN20',
    title: 'Modern Salon 20% Grand Discount',
    discountPercent: 20,
    minBookingAmount: 1000,
    validTill: '2026-10-31',
    description: 'Get 20% off on all luxury facials, hair chemical therapies & HD Makeup. 10% advance payable online.',
    active: true
  },
  {
    id: 'off-2',
    code: 'MOHOL10',
    title: 'Mohol Resident Special Offer',
    discountPercent: 10,
    minBookingAmount: 300,
    validTill: '2026-12-31',
    description: 'Flat 10% instant discount on any hair cut, clean up, or styling booking at Modern Salon Mohol.',
    active: true
  },
  {
    id: 'off-3',
    code: 'BRIDAL1000',
    title: '3D/4D Bridal Makeover ₹1,000 Off',
    discountAmount: 1000,
    minBookingAmount: 8000,
    validTill: '2026-11-30',
    description: 'Special ₹1,000 instant discount on 3D/4D Master Bridal Sculpting and Airbrush Makeovers.',
    active: true
  },
  {
    id: 'off-4',
    code: 'LOYALTY5TH',
    title: '5th Visit Loyalty Reward (15% OFF)',
    discountPercent: 15,
    minBookingAmount: 300,
    validTill: '2026-12-31',
    description: 'Milestone reward unlocked on your 5th visit: Flat 15% instant discount on any salon service.',
    active: true
  },
  {
    id: 'off-5',
    code: 'ROYALVIP10',
    title: '10th Visit VIP Royal Reward (25% OFF)',
    discountPercent: 25,
    minBookingAmount: 500,
    validTill: '2026-12-31',
    description: 'Milestone reward unlocked on your 10th visit: Flat 25% instant discount or free luxury spa voucher.',
    active: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    clientName: 'Pooja Kadam (Mohol)',
    clientPhone: '+91 81040 26257',
    clientEmail: 'pooja.kadam@gmail.com',
    rating: 5,
    serviceName: 'O3 Prof. Facial',
    category: 'Skin Services',
    bookingRef: 'MS-2026-891024',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'Best unisex salon in Mohol! The 10% advance booking secured my preferred evening slot without waiting. The O3+ facial gave my skin an instant bright glow. Very clean and hygienic studio in B.N. Gund complex!',
    date: '2026-08-10',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 5,
    punctualityRating: 5,
    valueRating: 5,
    recommend: true,
    npsScore: 10,
    tags: ['Spotless Hygiene', 'Master Stylist', 'Worth Every Rupee', 'Best in Mohol'],
    ownerReply: 'Thank you so much Pooja Ji! Delighted to hear your skin is glowing after the O3+ session. We look forward to pampering you again at Modern Salon Mohol.',
    ownerReplyDate: '2026-08-11',
    featured: true,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 24
  },
  {
    id: 'rev-2',
    clientName: 'Rohan Shinde',
    clientPhone: '+91 97654 33445',
    clientEmail: 'rohan.shinde@yahoo.com',
    rating: 5,
    serviceName: 'Advance Hair Cut & Blow Dry',
    category: 'Hair Care',
    bookingRef: 'MS-2026-773412',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'Precision haircut and styling! The slogan "We\'ll Style You\'ll Smile" is 100% true. Great location near ICICI Bank Mohol with easy parking and spotless chairs.',
    date: '2026-08-04',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 5,
    punctualityRating: 5,
    valueRating: 4,
    recommend: true,
    npsScore: 10,
    tags: ['Master Stylist', 'Punctual & Fast', 'Great Ambiance'],
    ownerReply: 'Cheers Rohan! Glad you loved the fresh look and hair styling.',
    ownerReplyDate: '2026-08-05',
    featured: true,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 15
  },
  {
    id: 'rev-3',
    clientName: 'Tanvi Gaikwad',
    clientPhone: '+91 98220 99881',
    clientEmail: 'tanvi.g@gmail.com',
    rating: 5,
    serviceName: 'Bridal 4D Makeover & Draping',
    category: 'Bridal & Pre-Bridal',
    bookingRef: 'MS-2026-665120',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'The HD 4D bridal makeup was completely flawless for my brother’s engagement! Sweatproof and lasted the entire night without touchups. Highly recommend Modern Unisex Salon in Mohol.',
    date: '2026-07-29',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 5,
    punctualityRating: 5,
    valueRating: 5,
    recommend: true,
    npsScore: 10,
    tags: ['Master Stylist', 'Worth Every Rupee', 'Premium Products', 'Spotless Hygiene'],
    ownerReply: 'Heartiest congratulations Tanvi! It was our pleasure designing your bridal makeover. Thank you for your warm words.',
    ownerReplyDate: '2026-07-30',
    featured: true,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 31
  },
  {
    id: 'rev-4',
    clientName: 'Sunil Patil',
    clientPhone: '+91 94231 77665',
    clientEmail: 'sunil.patil@outlook.com',
    rating: 5,
    serviceName: 'Keratin Treatment',
    category: 'Hair Chemical Services',
    bookingRef: 'MS-2026-551982',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'Transformed my rough frizzy hair into super smooth silky hair. Great attention to detail by the master stylist. Completely worth the price and advance booking was seamless.',
    date: '2026-07-20',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 5,
    punctualityRating: 4,
    valueRating: 5,
    recommend: true,
    npsScore: 9,
    tags: ['Master Stylist', 'Worth Every Rupee', 'Loved Hair Wash'],
    ownerReply: 'Thanks Sunil! Keep using the sulphate-free shampoo recommended for long-lasting keratin gloss.',
    ownerReplyDate: '2026-07-21',
    featured: true,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 19
  },
  {
    id: 'rev-5',
    clientName: 'Sneha Jadhav',
    clientPhone: '+91 98901 22334',
    clientEmail: 'sneha.jadhav@outlook.com',
    rating: 4,
    serviceName: 'Face Clean Up',
    category: 'Skin Services',
    bookingRef: 'MS-2026-448211',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'Painless blackhead extraction and herbal cooling pack. Very relaxing music and polite service. Had a 5 min wait because previous client took longer, but overall high quality!',
    date: '2026-07-12',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 4,
    punctualityRating: 4,
    valueRating: 4,
    recommend: true,
    npsScore: 8,
    tags: ['Spotless Hygiene', 'Gentle Treatment', 'Value for Money'],
    ownerReply: 'Thank you Sneha! We are streamlining our transition times to ensure zero waiting. Glad you enjoyed the herbal cooling therapy!',
    ownerReplyDate: '2026-07-13',
    featured: false,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 8
  },
  {
    id: 'rev-6',
    clientName: 'Amit Deshmukh',
    clientPhone: '+91 99701 44556',
    clientEmail: 'amit.deshmukh@gmail.com',
    rating: 5,
    serviceName: "Men's Fade & Beard Sculpt",
    category: "Men's Executive Grooming",
    bookingRef: 'MS-2026-339870',
    stylistName: 'Self-Employed (Master Stylist)',
    comment: 'Crisp razor beard lineup and skin fade. Best men’s grooming in Mohol town. The hot towel finish feels like a metro 5-star salon.',
    date: '2026-06-28',
    verifiedBooking: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    hygieneRating: 5,
    stylistSkillRating: 5,
    punctualityRating: 5,
    valueRating: 5,
    recommend: true,
    npsScore: 10,
    tags: ['Master Stylist', 'Spotless Hygiene', 'Best in Mohol'],
    ownerReply: 'Appreciate the shoutout Amit! See you for your next fade touchup.',
    ownerReplyDate: '2026-06-29',
    featured: true,
    sentiment: 'positive',
    status: 'published',
    helpfulCount: 14
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_SETTINGS: SalonSettings = {
  salonName: 'Modern Unisex Salon',
  tagline: "WE'LL STYLE YOU'LL SMILE",
  phone: '8104026257',
  email: 'dineshghodake941@gmail.com',
  address: 'B.N. GUND COMPLEX, NEAR KANYA PRASHALA AND ICICI BANK, MOHOL - 413213',
  openingHours: 'Mon - Sun: 09:00 AM - 10:00 PM',
  advancePercentage: 10,
  currencySymbol: '₹',
  accountHolder: 'MODERN JENTS PARLOUR',
  bankName: 'HDFC Bank',
  bankAccountNumber: '50200072074441',
  bankIfsc: 'HDFC0000635',
  bankBranch: 'Solapur',
  bankAccountType: 'Current Account',
  merchantUpiId: 'ghodakedinesh@ybl',
  upiId: 'ghodakedinesh@ybl',
  upiQrCodeUrl: '/assets/aistudio/image_2ca5cc29.png',
  secondaryUpiId: '8104026257@axl',
  secondaryAccountHolder: 'DINESH VITTHAL GHODAKE',
  secondaryUpiQrCodeUrl: '/assets/aistudio/image_fce20bf8.png',
  bookingAutoConfirm: false,
  instagramUrl: 'https://www.instagram.com/modern_unisex_salon_mohol',
  mapsUrl: 'https://maps.app.goo.gl/CraeBa6gAjWA8o818',
  gstNumber: '27AABCM8104M1Z2 (Available on Invoice)',
  staffType: 'Self-Employed (Master Stylist & Founder: Dinesh Ghodake)',
  adminPassword: 'Salon@Owner#2026',
  adminPin: '8104',
  adminEmails: [
    'dineshghodake941@gmail.com',
    'modernsalon02@gmail.com',
    'admin@modernsalon.com'
  ],
  blockedWindows: [],
  isOwnerOnBreakToday: false,
  breakNoticeMessage: 'The salon owner is taking a short break. Booking slots are temporarily unavailable.'
};

export const INITIAL_USERS: import('../types').User[] = [];

export const initialStaffMembers: StaffMember[] = [
  {
    id: 'stylist-1',
    name: 'Vikram Mehta',
    role: 'Creative Director & Master Hair Stylist',
    department: 'Hair Care',
    experience: '14+ Years',
    phone: '+91 98220 12345',
    email: 'vikram.mehta@modernsalon.com',
    specialties: ['French Balayage', 'Precision Razor Cuts', 'Olaplex Bond Rebuilding', 'Keratin Smoothing'],
    certifications: ['Toni & Guy Advanced London', "L'Oréal Professionnel Master Colorist"],
    rating: 4.98,
    reviewsCount: 382,
    totalClients: 4200,
    shiftHours: '10:00 AM - 07:30 PM',
    status: 'Available Today',
    bio: 'Vikram has styled runway models and high-profile clientele across Mumbai and Pune. Specializing in bespoke haircuts customized to bone structure and natural hair flow.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stylist-2',
    name: 'Kavita Patel',
    role: 'Senior Aesthetician & Skin Therapist',
    department: 'Skin & Facial',
    experience: '10+ Years',
    phone: '+91 98220 12346',
    email: 'kavita.patel@modernsalon.com',
    specialties: ['Hydra-Facial Therapy', 'Dermaplaning & Extraction', 'Korean Glass Skin Facials', 'Anti-Aging Peels'],
    certifications: ['CIDESCO International Aesthetician', 'Dermalogica Certified Expert'],
    rating: 4.96,
    reviewsCount: 410,
    totalClients: 3600,
    shiftHours: '09:30 AM - 06:30 PM',
    status: 'Available Today',
    bio: 'Kavita brings clinical expertise to holistic skincare therapies. Her customized facial protocols deliver immediate radiance while protecting the dermal barrier.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stylist-3',
    name: 'Sunita Roy',
    role: 'Bridal Makeover Director',
    department: 'Bridal & Makeup',
    experience: '12+ Years',
    phone: '+91 98220 12347',
    email: 'sunita.roy@modernsalon.com',
    specialties: ['HD Airbrush Makeup', 'Traditional Bridal Draping', 'Editorial Glam', 'Pre-Bridal Glow Rituals'],
    certifications: ['Kryolan Professional Makeup Master', 'Mario Dedivanovic Masterclass'],
    rating: 4.99,
    reviewsCount: 520,
    totalClients: 1850,
    shiftHours: '09:00 AM - 08:00 PM',
    status: 'Available Today',
    bio: 'Having directed over 1,200 bridal transformations, Sunita is celebrated for creating weightless, waterproof, and photogenic bridal looks that last all night.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stylist-4',
    name: 'Sameer Khan',
    role: 'Executive Men Grooming Specialist',
    department: 'Men Grooming',
    experience: '9+ Years',
    phone: '+91 98220 12348',
    email: 'sameer.khan@modernsalon.com',
    specialties: ['Skin Fade Tapers', 'Hot Towel Charcoal Shaves', 'Beard Contour Sculpting', 'Scalp Rejuvenation'],
    certifications: ['Wahl Master Barber Academy', 'Truefitt & Hill Certified'],
    rating: 4.94,
    reviewsCount: 310,
    totalClients: 2900,
    shiftHours: '10:30 AM - 08:30 PM',
    status: 'Available Today',
    bio: 'Sameer combines classic barber craftsmanship with contemporary sharp styling for executive haircuts, clean beard alignments, and stress-relieving head massages.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stylist-5',
    name: 'Rhea Fernandes',
    role: 'Senior Colorist & Texture Specialist',
    department: 'Hair Care',
    experience: '8+ Years',
    phone: '+91 98220 12349',
    email: 'rhea.fernandes@modernsalon.com',
    specialties: ['Ash & Honey Highlights', 'Cysteine & Botox Smoothing', 'Root Melt & Shadow Tones', 'Curly Hair Care'],
    certifications: ['Schwarzkopf Royal Colorist', 'Brazilian Blowout Certified'],
    rating: 4.92,
    reviewsCount: 245,
    totalClients: 2100,
    shiftHours: '11:00 AM - 08:00 PM',
    status: 'On Leave',
    bio: 'Passionate about custom tone mapping and damage-free color formulation that enhances individual skin undertones with high shine.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'stylist-6',
    name: 'Aarti Kulkarni',
    role: 'Holistic Spa & Body Therapist',
    department: 'Spa & Wellness',
    experience: '11+ Years',
    phone: '+91 98220 12350',
    email: 'aarti.kulkarni@modernsalon.com',
    specialties: ['Deep Tissue Massage', 'Aromatherapy Reflexology', 'Ayurvedic Herb Wraps', 'Hot Stone Therapy'],
    certifications: ['Ayush Ministry Certified Therapist', 'Thai Spa Academy Bangkok'],
    rating: 4.97,
    reviewsCount: 290,
    totalClients: 2400,
    shiftHours: '10:00 AM - 07:00 PM',
    status: 'Available Today',
    bio: 'Aarti brings deep meditative tranquility to authentic spa rituals that relieve modern posture strain and replenish vital energy.',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80'
  }
];
