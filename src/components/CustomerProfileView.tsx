import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Crown,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Scissors,
  Save,
  MapPin,
  AlertTriangle,
  Edit3,
  Check,
  LogOut,
  LogIn
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Appointment, User } from '../types';

interface CustomerProfileViewProps {
  onBookAppointment: () => void;
  appointments: Appointment[];
  initialEditMode?: boolean;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onBookAppointment,
  appointments,
  initialEditMode = true
}) => {
  const { currentUser, updateCurrentUser, registerCustomer, logout, settings, staffMembers, staff, openAuthModal } = useSalon();
  const staffList = staffMembers || staff || [];

  const [isEditing, setIsEditing] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [guestSuccessMsg, setGuestSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Client profile form data
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    gender: currentUser?.gender || '',
    birthDate: currentUser?.birthDate || '',
    anniversaryDate: currentUser?.anniversaryDate || '',
    preferredStylist: currentUser?.preferredStylist || '',
    skinOrHairType: currentUser?.skinOrHairType || '',
    specialNotes: currentUser?.specialNotes || '',
    address: currentUser?.address || '',
    city: currentUser?.city || 'Mohol',
    emergencyContact: currentUser?.emergencyContact || '',
    allergies: currentUser?.allergies || '',
    preferredSlot: currentUser?.preferredSlot || 'Morning (9 AM - 12 PM)',
    favoriteCategory: currentUser?.favoriteCategory || 'Hair Services'
  });

  // Keep synced if user switches or logs in
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
        skinOrHairType: currentUser.skinOrHairType || '',
        specialNotes: currentUser.specialNotes || '',
        address: currentUser.address || '',
        city: currentUser.city || 'Mohol',
        emergencyContact: currentUser.emergencyContact || '',
        allergies: currentUser.allergies || '',
        preferredSlot: currentUser.preferredSlot || 'Morning (9 AM - 12 PM)',
        favoriteCategory: currentUser.favoriteCategory || 'Hair Services'
      });
    } else {
      // Clean empty state for new user
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: '',
        birthDate: '',
        anniversaryDate: '',
        preferredStylist: '',
        skinOrHairType: '',
        specialNotes: '',
        address: '',
        city: 'Mohol',
        emergencyContact: '',
        allergies: '',
        preferredSlot: 'Morning (9 AM - 12 PM)',
        favoriteCategory: 'Hair Services'
      });
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Please provide your name and mobile number.');
      return;
    }

    setIsSaving(true);
    try {
      if (currentUser) {
        const res = await updateCurrentUser({
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
          preferredSlot: formData.preferredSlot,
          preferredServices: formData.skinOrHairType ? [formData.skinOrHairType] : []
        });
        setIsSaving(false);
        setSavedNotice(res.message || 'Profile saved and synchronized with salon database!');
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 4000);
      } else {
        setIsSaving(false);
        setFormError('Please create an account or sign in to save your client profile.');
        openAuthModal('customer', 'signup');
      }
    } catch {
      setIsSaving(false);
      setFormError('Failed to save profile. Please check connection and try again.');
    }
  };

  const tier = currentUser?.memberTier || 'Standard Client';

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner / User Identity */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-md shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {currentUser?.name || 'New Client Profile'}
                </h2>
                <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>{currentUser?.role === 'ADMIN' ? 'Owner / Admin' : tier}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-500" />
                  <span>{formData.city || 'Mohol'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                {currentUser?.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-purple-500" />
                    <span>{currentUser.phone}</span>
                  </span>
                ) : (
                  <span>Fill in your contact info below to save your profile</span>
                )}
                {currentUser?.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{currentUser.email}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sign-in / Sign-out Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentUser ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('customer', 'login')}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Existing Client Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {profileSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{savedNotice || guestSuccessMsg || 'Client profile and styling preferences updated & synchronized successfully!'}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">✓ Saved</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Top Quick-Save Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
            <div>
              <h2 className="text-base font-serif font-bold text-zinc-900 dark:text-white">Customer Profile &amp; Preferences</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Keep personal, skin, and styling details updated for personalized salon sessions.</p>
            </div>
            <button
              id="btn-top-save-client-profile"
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer shrink-0"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Contact & Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <UserIcon className="w-4 h-4" />
              <span>1. Personal &amp; Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Unisex / Non-Binary">Unisex / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Town / City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mohol, Solapur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Salon & Styling Preferences */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Scissors className="w-4 h-4" />
              <span>2. Salon Styling &amp; Treatment Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Preferred Master Stylist
                </label>
                <select
                  value={formData.preferredStylist}
                  onChange={e => setFormData({ ...formData, preferredStylist: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Preferred Stylist (Optional)</option>
                  <option value="Dinesh Ghodake (Master Stylist & Founder)">Dinesh Ghodake (Master Stylist &amp; Founder)</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.name}>
                      {st.name} ({st.role || 'Stylist'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Preferred Appointment Time (9:00 AM - 10:00 PM)
                </label>
                <select
                  value={formData.preferredSlot}
                  onChange={e => setFormData({ ...formData, preferredSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
                  <option value="Night (7:00 PM - 10:00 PM)">Night (7:00 PM - 10:00 PM)</option>
                  <option value="Flexible / Any Open Slot">Flexible / Any Open Slot (9 AM - 10 PM)</option>
                  <option value="Weekends Only">Weekends Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Hair / Skin Type Profile
                </label>
                <input
                  type="text"
                  value={formData.skinOrHairType}
                  onChange={e => setFormData({ ...formData, skinOrHairType: e.target.value })}
                  placeholder="e.g. Dry Curls, Color-Treated, Sensitive Scalp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Specific Allergies, Product Sensitivities or Styling Notes</span>
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Ammonia-free hair color only, sensitive to harsh fragrance, skin patch test required"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Preferences automatically pre-fill when you schedule salon sessions.</span>
            </div>

            <button
              id="btn-save-client-profile"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/25 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{currentUser ? 'Save Profile Details' : 'Create Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
