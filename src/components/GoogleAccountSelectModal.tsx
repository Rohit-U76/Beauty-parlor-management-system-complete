import React, { useState } from 'react';
import { X, User, ArrowRight, ShieldCheck, Plus, Check } from 'lucide-react';

interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface GoogleAccountSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (profile: GoogleProfile) => Promise<void>;
  isRegistering?: boolean;
}

const PRESET_GOOGLE_ACCOUNTS: GoogleProfile[] = [
  {
    name: 'Dinesh Ghodake',
    email: 'dineshghodake941@gmail.com',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    sub: 'g_user_dinesh_ghodake'
  }
];

export const GoogleAccountSelectModal: React.FC<GoogleAccountSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isRegistering = false
}) => {
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (profile: GoogleProfile) => {
    setSelectedSub(profile.sub);
    setIsLoading(true);
    try {
      await onSelectAccount(profile);
      setIsLoading(false);
      onClose();
    } catch (e) {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      alert('Please enter a valid Google email address.');
      return;
    }

    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const profile: GoogleProfile = {
      name: cleanName,
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      sub: `g_oauth_${Date.now()}`
    };

    await handleSelect(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[430px] rounded-3xl bg-white dark:bg-[#18181b] text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-left relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Google Logo */}
        <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            {/* Google Multicolor Logo */}
            <div className="flex items-center gap-2.5">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-sm tracking-tight text-zinc-700 dark:text-zinc-300">
                Sign in with Google
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">
              {isRegistering ? 'Sign up with Google' : 'Choose an account'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              to continue to <strong className="text-zinc-800 dark:text-zinc-200">Modern Unisex Salon Mohol</strong>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-3 space-y-4">
          {!showCustomInput ? (
            <>
              {/* Account List */}
              <div className="space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800">
                {PRESET_GOOGLE_ACCOUNTS.map((account) => {
                  const isSelected = selectedSub === account.sub;
                  return (
                    <button
                      key={account.sub}
                      onClick={() => handleSelect(account)}
                      disabled={isLoading}
                      className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl transition text-left cursor-pointer group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={account.picture}
                          alt={account.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {account.email}
                          </div>
                        </div>
                      </div>

                      {isSelected && isLoading ? (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-zinc-500" />
                <span>Use another Google account</span>
              </button>
            </>
          ) : (
            /* Custom Google Email Form */
            <form onSubmit={handleCustomSubmit} className="space-y-3 animate-in fade-in duration-150">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Enter your Google account details to authenticate:
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  disabled={isLoading}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ← Back to account list
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Continue with Google</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security Note */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            To continue, Google will share your name, email address, and profile picture with Modern Unisex Salon. See our Privacy Policy for details.
          </div>
        </div>
      </div>
    </div>
  );
};

