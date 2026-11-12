import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Crown,
  Gift,
  Heart,
  Save,
  CheckCircle2,
  Scissors,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  LogOut,
  MapPin,
  Bell
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const ClientProfileModal: React.FC = () => {
  const {
    currentUser,
    updateCurrentUser,
    isProfileModalOpen,
    closeProfileModal,
    logout,
    registerCustomer,
    openAuthModal,
    staffMembers
  } = useSalon();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    birthDate: '',
    anniversaryDate: '',
    preferredStylist: '',
    skinOrHairType: 'Normal Hair & Skin',
    specialNotes: '',
    address: '',
    city: 'Mohol',
    emergencyContact: '',
    allergies: '',
    preferredSlot: 'Morning (9 AM - 12 PM)'
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        gender: currentUser.gender || '',
        birthDate: currentUser.birthDate || '',
        anniversaryDate: currentUser.anniversaryDate || '',
        preferredStylist: currentUser.preferredStylist || '',
        skinOrHairType: currentUser.skinOrHairType || 'Normal Hair & Skin',
        specialNotes: currentUser.specialNotes || '',
        address: currentUser.address || '',
        city: currentUser.city || 'Mohol',
        emergencyContact: currentUser.emergencyContact || '',
        allergies: currentUser.allergies || '',
        preferredSlot: currentUser.preferredSlot || 'Morning (9 AM - 12 PM)'
      });
      setErrorMessage('');
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: '',
        birthDate: '',
        anniversaryDate: '',
        preferredStylist: '',
        skinOrHairType: 'Normal Hair & Skin',
        specialNotes: '',
        address: '',
        city: 'Mohol',
        emergencyContact: '',
        allergies: '',
        preferredSlot: 'Morning (9 AM - 12 PM)'
      });
    }
  }, [currentUser, isProfileModalOpen, staffMembers]);

  if (!isProfileModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);

    try {
      if (currentUser) {
        // Save updates to current user
        updateCurrentUser({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          gender: formData.gender,
          birthDate: formData.birthDate,
          anniversaryDate: formData.anniversaryDate,
          preferredStylist: formData.preferredStylist,
          skinOrHairType: formData.skinOrHairType,
          specialNotes: formData.specialNotes,
          address: formData.address,
          city: formData.city,
          emergencyContact: formData.emergencyContact,
          allergies: formData.allergies,
          preferredSlot: formData.preferredSlot
        });
      } else {
        // Guest user creating their client profile directly
        await registerCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          preferredServices: [formData.skinOrHairType]
        });
      }

      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        closeProfileModal();
      }, 1500);
    } catch {
      setIsSaving(false);
      setErrorMessage('Failed to save profile. Please check details and try again.');
    }
  };

  return (
    <div
      id="client-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="client-profile-modal-container"
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  {currentUser ? 'Client Profile & Preferences' : 'Create & Save Client Profile'}
                </h3>
                {currentUser && (
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] flex items-center gap-1 ${
                    (currentUser.totalVisits || 0) >= 10
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  }`}>
                    {(currentUser.totalVisits || 0) >= 10 ? <Crown className="w-3 h-3 text-amber-500" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                    <span>{(currentUser.totalVisits || 0) >= 10 ? 'VIP Member' : ((currentUser.totalVisits || 0) > 0 ? 'Valued Client' : 'New Client')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentUser
                  ? `Keep your styling preferences & appointment details updated • ${currentUser.loyaltyPoints || 100} Reward Pts`
                  : 'Enter your details below to save your personalized salon preferences'}
              </p>
            </div>
          </div>

          <button
            id="close-client-profile-modal-btn"
            onClick={closeProfileModal}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile details and preferences saved successfully!</span>
            </div>
          )}

          {/* Section 1: Basic Contact Details */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Personal Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Mobile Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Celebration Dates */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                <span>Special Occasion Perks</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-semibold">
                Get 15% discount on special days (available only if coupon is applied/available)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Anniversary Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.anniversaryDate}
                  onChange={e => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Salon & Styling Preferences */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              <span>Hair &amp; Beauty Customization</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Preferred Stylist / Specialist
                </label>
                <select
                  value={formData.preferredStylist}
                  onChange={e => setFormData({ ...formData, preferredStylist: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Preferred Stylist (Optional)</option>
                  <option value="Dinesh Ghodake (Master Stylist)">Dinesh Ghodake (Master Stylist &amp; Founder - Mohol)</option>
                  <option value="Pooja (Senior Hairdresser)">Pooja (Senior Hairdresser)</option>
                  <option value="Amit (Creative Colorist)">Amit (Creative Colorist)</option>
                  <option value="Sneha (Skin & Bridal Expert)">Sneha (Skin &amp; Bridal Expert)</option>
                  {staffMembers && staffMembers.length > 0 && staffMembers.map(st => (
                    <option key={st.id} value={`${st.name} (${st.role})`}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                  <option value="Any Available Expert">Any Available Expert Stylist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Hair &amp; Skin Characteristics
                </label>
                <select
                  value={formData.skinOrHairType}
                  onChange={e => setFormData({ ...formData, skinOrHairType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Normal Hair & Skin">Normal Hair &amp; Skin</option>
                  <option value="Dry / Frizzy Hair">Dry / Frizzy Hair</option>
                  <option value="Curly / Textured Hair">Curly / Textured Hair</option>
                  <option value="Color-Treated / Bleached Hair">Color-Treated / Bleached Hair</option>
                  <option value="Oily Scalp / Dandruff Prone">Oily Scalp / Dandruff Prone</option>
                  <option value="Sensitive / Acne-Prone Skin">Sensitive / Acne-Prone Skin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Preferred Appointment Time
                </label>
                <select
                  value={formData.preferredSlot}
                  onChange={e => setFormData({ ...formData, preferredSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 9 PM)">Evening (4 PM - 9 PM)</option>
                  <option value="Weekends Only">Weekends Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  City / Local Area
                </label>
                <input
                  type="text"
                  placeholder="Mohol, Solapur"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Allergies or Product Sensitivities (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ammonia sensitivity, sensitive to strong fragrance, latex"
                value={formData.allergies}
                onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeProfileModal();
                }}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer w-full sm:w-auto justify-center"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({currentUser.name})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeProfileModal();
                  openAuthModal('customer', 'login');
                }}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Already registered? Sign In instead
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={closeProfileModal}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="save-client-profile-submit-btn"
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{currentUser ? 'Save Changes' : 'Save & Join (100 pts)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
