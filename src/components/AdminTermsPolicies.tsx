import React, { useState } from 'react';
import { useSalon } from '../context/SalonContext';
import { SalonPolicyItem } from '../types';
import { SALON_TERMS_AND_POLICIES } from '../data/initialData';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
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
  ShieldCheck,
  Sparkles,
  RotateCcw,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const AVAILABLE_ICONS: { name: string; label: string; icon: React.ReactNode }[] = [
  { name: 'ShieldCheck', label: 'Shield / Hygiene', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
  { name: 'Clock', label: 'Clock / Hours', icon: <Clock className="w-4 h-4 text-blue-400" /> },
  { name: 'CreditCard', label: 'Credit Card / Deposit', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
  { name: 'XCircle', label: 'Cancellation / Refund', icon: <XCircle className="w-4 h-4 text-red-400" /> },
  { name: 'HeartPulse', label: 'Health & Allergies', icon: <HeartPulse className="w-4 h-4 text-rose-400" /> },
  { name: 'Timer', label: 'Grace Period / Punctuality', icon: <Timer className="w-4 h-4 text-orange-400" /> },
  { name: 'Gift', label: 'Packages & Offers', icon: <Gift className="w-4 h-4 text-purple-400" /> },
  { name: 'Baby', label: 'Children Policy', icon: <Baby className="w-4 h-4 text-cyan-400" /> },
  { name: 'Smartphone', label: 'Belongings & Tech', icon: <Smartphone className="w-4 h-4 text-indigo-400" /> },
  { name: 'Camera', label: 'Photography / Media', icon: <Camera className="w-4 h-4 text-pink-400" /> },
  { name: 'Scale', label: 'Right to Refuse / Legal', icon: <Scale className="w-4 h-4 text-zinc-400" /> },
  { name: 'ShieldAlert', label: 'Warning / Protocol', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
  { name: 'Sparkles', label: 'VIP / Special', icon: <Sparkles className="w-4 h-4 text-yellow-400" /> },
  { name: 'FileText', label: 'General Clause', icon: <FileText className="w-4 h-4 text-zinc-300" /> }
];

export const AdminTermsPolicies: React.FC = () => {
  const { policies, addPolicy, updatePolicy, deletePolicy, setActiveNavTab, setIsAdminMode } = useSalon();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SalonPolicyItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formIcon, setFormIcon] = useState('ShieldCheck');
  const [formPointsText, setFormPointsText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-zinc-300" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  const activePoliciesList = policies && policies.length > 0 ? policies : SALON_TERMS_AND_POLICIES;

  const filteredPolicies = activePoliciesList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesTitle = p.title.toLowerCase().includes(q);
    const matchesSummary = p.summary.toLowerCase().includes(q);
    const matchesPoints = p.points ? p.points.some(pt => pt.toLowerCase().includes(q)) : false;
    return matchesTitle || matchesSummary || matchesPoints;
  });

  const openAddModal = () => {
    setEditingPolicy(null);
    setFormTitle('');
    setFormSummary('');
    setFormIcon('ShieldCheck');
    setFormPointsText('');
    setModalOpen(true);
  };

  const openEditModal = (p: SalonPolicyItem) => {
    setEditingPolicy(p);
    setFormTitle(p.title);
    setFormSummary(p.summary);
    setFormIcon(p.iconName || 'ShieldCheck');
    setFormPointsText(p.points ? p.points.join('\n') : '');
    setModalOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      alert('Please provide a title for the policy.');
      return;
    }

    const cleanPoints = formPointsText
      .split('\n')
      .map(line => line.trim().replace(/^[•\-\*]\s*/, ''))
      .filter(line => line.length > 0);

    if (cleanPoints.length === 0) {
      cleanPoints.push(formSummary.trim() || formTitle.trim());
    }

    if (editingPolicy) {
      updatePolicy(editingPolicy.id, {
        title: formTitle.trim(),
        summary: formSummary.trim(),
        iconName: formIcon,
        points: cleanPoints
      });
      showToast(`Updated term "${formTitle.trim()}" successfully!`);
    } else {
      addPolicy({
        title: formTitle.trim(),
        summary: formSummary.trim() || 'Official salon policy statement.',
        iconName: formIcon,
        points: cleanPoints
      });
      showToast(`Added new term "${formTitle.trim()}" successfully!`);
    }

    setModalOpen(false);
  };

  const handleDeletePolicy = (id: string, title: string) => {
    deletePolicy(id);
    setDeleteConfirmId(null);
    showToast(`Removed "${title}" from salon terms.`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all terms and conditions to standard salon defaults? Any custom added terms will be replaced.')) {
      localStorage.removeItem('modern_salon_data_policies');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl bg-zinc-900 border border-amber-500/50 shadow-2xl text-xs font-semibold text-amber-300 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-zinc-100">
                Terms & Conditions Manager
              </h2>
              <p className="text-xs text-zinc-400">
                Edit, add, and remove salon terms, cancellation rules, hygiene protocols, and booking policies.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsAdminMode(false);
                setActiveNavTab('terms');
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Preview Customer Facing Terms Page"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>View Client Page</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Reset terms to default salon policy"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Term / Condition</span>
            </button>
          </div>
        </div>

        {/* Search and Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms (e.g. advance, refund, children, hygiene, cancellation)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
            <span className="text-zinc-400">Active Policies:</span>
            <span className="font-bold text-amber-400">
              {filteredPolicies.length} of {activePoliciesList.length} items
            </span>
          </div>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.map((policy) => {
          const isConfirmingDelete = deleteConfirmId === policy.id;

          return (
            <div
              key={policy.id}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                      {getPolicyIcon(policy.iconName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                        {policy.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: {policy.id} • Icon: {policy.iconName || 'ShieldCheck'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(policy)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-xs transition cursor-pointer"
                      title="Edit Term & Condition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(policy.id)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 text-xs transition cursor-pointer"
                      title="Remove Term & Condition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Summary */}
                {policy.summary && (
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                    {policy.summary}
                  </p>
                )}

                {/* Points list */}
                {policy.points && policy.points.length > 0 && (
                  <ul className="space-y-1.5 pt-1 text-xs text-zinc-400">
                    {policy.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                        <span className="leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Delete Confirmation Box */}
              {isConfirmingDelete && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-2 text-xs text-red-200 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Delete this policy item?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeletePolicy(policy.id, policy.title)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPolicies.length === 0 && (
        <div className="p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-zinc-300">No matching terms or conditions found</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search keyword or add a new term using the button above.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Term Now</span>
          </button>
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-zinc-100">
                    {editingPolicy ? 'Edit Term & Condition' : 'Add New Term & Condition'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {editingPolicy ? `Editing ${editingPolicy.title}` : 'Define a new policy rule for your salon clients'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePolicy} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Policy Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Appointment Rescheduling & Advance Transfer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Summary / Highlight
                </label>
                <input
                  type="text"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="e.g. Clients may reschedule up to 3 hours prior with deposit carried forward."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Icon Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Select Visual Category Icon
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_ICONS.map((ic) => {
                    const isSelected = formIcon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setFormIcon(ic.name)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-zinc-100'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="p-1 rounded-lg bg-zinc-900 shrink-0">{ic.icon}</div>
                        <span className="text-[11px] font-medium truncate">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Policy Points / Clauses */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Detailed Points & Clauses
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">One bullet point per line</span>
                </div>
                <textarea
                  rows={4}
                  value={formPointsText}
                  onChange={(e) => setFormPointsText(e.target.value)}
                  placeholder={`• Advance deposits are non-refundable for no-shows.\n• Rescheduling is complimentary when informed 3 hours in advance.\n• Balances must be settled post service via Cash or UPI.`}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  {editingPolicy ? 'Update Term' : 'Save Term & Condition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
