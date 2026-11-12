import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Crown,
  Gift,
  Star,
  Check
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { ModernSalonLogo } from './ModernSalonLogo';
import { GoogleAccountSelectModal } from './GoogleAccountSelectModal';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalInitialTab,
    authModalMode,
    login,
    loginWithGoogle,
    registerCustomer,
    checkEmailVerification,
    resendVerificationEmail,
    resetPassword,
    settings,
    updateSettings
  } = useSalon();

  const [activeTab, setActiveTab] = useState<
    'customer_login' | 'customer_register' | 'admin_login' | 'pending_verification' | 'forgot_password' | 'admin_forgot_password'
  >('customer_login');
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);

  // Customer Form State
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regServices, setRegServices] = useState<string[]>([]);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Admin Form State
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [adminResetPin, setAdminResetPin] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const availableServicePicks = [
    '3D/4D Bridal Makeup',
    "Men's Fade & Styling",
    "Cheryla's Facial",
    "L'Oréal Hair Spa",
    'Keratin Treatment'
  ];

  useEffect(() => {
    if (isAuthModalOpen) {
      if (authModalInitialTab === 'admin') {
        setActiveTab('admin_login');
      } else if (authModalMode === 'register') {
        setActiveTab('customer_register');
      } else {
        setActiveTab('customer_login');
      }
      setErrorMsg('');
      setSuccessMsg('');
      setUnverifiedEmail('');
    }
  }, [isAuthModalOpen, authModalInitialTab, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const res = await login(customerIdentifier, customerPassword, 'CUSTOMER');
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        closeAuthModal();
      }, 500);
    } else {
      setErrorMsg(res.message);
      if (res.emailUnverified) {
        setUnverifiedEmail(res.email || customerIdentifier);
        setActiveTab('pending_verification');
      }
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const res = await registerCustomer({
      name: regName,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      preferredServices: regServices
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setUnverifiedEmail(res.email || regEmail);
      setActiveTab('pending_verification');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCheckVerification = async () => {
    const targetEmail = unverifiedEmail || regEmail || customerIdentifier;
    const targetPassword = regPassword || customerPassword;
    setIsCheckingVerification(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await checkEmailVerification(targetEmail, targetPassword);
    setIsCheckingVerification(false);

    if (res.verified) {
      setSuccessMsg(res.message);
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 70, spread: 60 });
      } catch {}
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const res = await resetPassword(forgotEmail);
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAdminForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const target = adminIdentifier.trim().toLowerCase();
    if (!target || !target.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    const cleanPin = adminResetPin.trim();
    const correctPin = (settings.adminPin || '8104').trim();
    if (!cleanPin || cleanPin !== correctPin) {
      setErrorMsg(`Invalid Owner Security PIN. Please enter your confidential salon master PIN (default: 8104) to authorize resetting the admin password.`);
      return;
    }

    if (!adminNewPassword.trim() || adminNewPassword.trim().length < 6) {
      setErrorMsg('New Admin Password must be at least 6 characters long.');
      return;
    }

    if (adminNewPassword.trim() !== adminConfirmPassword.trim()) {
      setErrorMsg('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsLoading(true);
    try {
      await updateSettings({ adminPassword: adminNewPassword.trim() });
      setIsLoading(false);
      setSuccessMsg('✅ Admin Master Password updated successfully! It has been saved into Admin Settings. You can now sign in with your new password.');
      setAdminSecret(adminNewPassword.trim());
      setAdminResetPin('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setTimeout(() => {
        setActiveTab('admin_login');
      }, 2000);
    } catch {
      setIsLoading(false);
      setErrorMsg('Failed to update admin password. Please try again.');
    }
  };

  const handleGoogleSignIn = async (role: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER') => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await loginWithGoogle({ forRole: role });
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          closeAuthModal();
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Google sign-in could not be completed.');
    }
  };

  const handleSelectGoogleAccount = async (profile: { email: string; name: string; picture: string; sub: string }) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await loginWithGoogle({ profile, forRole: activeTab === 'admin_login' ? 'ADMIN' : 'CUSTOMER' });
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          closeAuthModal();
        }, 700);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Google sign-in error occurred.');
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || regEmail || customerIdentifier;
    const targetPassword = regPassword || customerPassword;
    if (!targetEmail) {
      setErrorMsg('Please enter your email to resend verification link.');
      return;
    }
    setIsResending(true);
    const res = await resendVerificationEmail(targetEmail, targetPassword);
    setIsResending(false);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const res = await login(adminIdentifier, adminSecret, 'ADMIN');
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Owner credentials verified. Opening Admin Suite...');
      setTimeout(() => {
        closeAuthModal();
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const toggleServicePref = (cat: string) => {
    setRegServices(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div
      id="salon-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141418] border border-purple-200 dark:border-zinc-800 rounded-3xl shadow-2xl shadow-purple-500/10 dark:shadow-black/70 overflow-hidden my-6 transition-all">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-purple-100 dark:border-zinc-800 bg-purple-50/50 dark:bg-[#0e0e12]">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <ModernSalonLogo size="sm" showTagline={false} />
            <div>
              <h2 className="text-lg font-serif font-bold text-zinc-900 dark:text-white">
                Salon Portal Access
              </h2>
              <p className="text-xs text-purple-700 dark:text-amber-400 font-semibold">
                {settings.salonName} • Mohol
              </p>
            </div>
          </div>

          {/* 3 Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-purple-100/60 dark:bg-[#0a0a0d] border border-purple-200 dark:border-zinc-800 text-xs font-bold">
            <button
              type="button"
              id="modal-tab-signin"
              onClick={() => {
                setActiveTab('customer_login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'customer_login'
                  ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 dark:hover:text-zinc-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              id="modal-tab-signup"
              onClick={() => {
                setActiveTab('customer_register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'customer_register'
                  ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 dark:hover:text-zinc-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>

            <button
              type="button"
              id="modal-tab-admin"
              onClick={() => {
                setActiveTab('admin_login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin_login'
                  ? 'bg-purple-200 text-purple-900 border border-purple-300 dark:bg-zinc-800 dark:text-amber-400 dark:border-amber-500/40 font-extrabold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Notification / Error feedback */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {unverifiedEmail && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Email Confirmation Link Required</span>
              </div>
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                A verification link has been sent to <strong>{unverifiedEmail}</strong>. Please check your inbox &amp; spam folder. You must click the confirmation link before you can log in.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isResending ? 'Resending Link...' : 'Resend Verification Email'}
                </button>
                {activeTab !== 'customer_login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('customer_login');
                      setErrorMsg('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-zinc-800 text-purple-900 dark:text-zinc-200 font-semibold text-xs transition cursor-pointer"
                  >
                    Go to Sign In
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER LOGIN */}
          {/* ========================================================================= */}
          {activeTab === 'customer_login' && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                  <span>Email, Username, or Mobile Number</span>
                </label>
                <input
                  type="text"
                  required
                  id="modal-login-identifier"
                  value={customerIdentifier}
                  onChange={(e) => setCustomerIdentifier(e.target.value)}
                  placeholder="Enter your email, username, or phone"
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(customerIdentifier.includes('@') ? customerIdentifier : '');
                      setActiveTab('forgot_password');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-semibold text-purple-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCustomerPassword ? 'text' : 'password'}
                    required
                    id="modal-login-password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="modal-login-submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-200/60 dark:border-zinc-800" />
                </div>
                <div className="relative bg-white dark:bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Or continue with
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('CUSTOMER')}
                disabled={isLoading}
                id="modal-google-signin-btn"
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 hover:bg-purple-50/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition flex items-center justify-center gap-2.5 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Need a new account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer_register');
                    setErrorMsg('');
                  }}
                  className="text-xs text-purple-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CUSTOMER REGISTER */}
          {/* ========================================================================= */}
          {activeTab === 'customer_register' && (
            <form onSubmit={handleCustomerRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    id="modal-reg-name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Username (Optional)
                  </label>
                  <input
                    type="text"
                    id="modal-reg-username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Enter username (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    id="modal-reg-phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3 py-2 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    id="modal-reg-email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    id="modal-reg-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)"
                    className="w-full px-3 py-2 pr-9 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Service picks */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Interests (Optional):
                </label>
                <div className="flex flex-wrap gap-1">
                  {availableServicePicks.map((srv) => {
                    const isSel = regServices.includes(srv);
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => toggleServicePref(srv)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer ${
                          isSel
                            ? 'bg-purple-600 text-white dark:bg-amber-500 dark:text-zinc-950 font-bold'
                            : 'bg-purple-50 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-purple-400'
                        }`}
                      >
                        {isSel && <Check className="w-2.5 h-2.5" />}
                        <span>{srv}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                id="modal-reg-submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account &amp; Send Verification Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="relative my-2.5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-200/60 dark:border-zinc-800" />
                </div>
                <div className="relative bg-white dark:bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Or sign up with
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('CUSTOMER')}
                disabled={isLoading}
                id="modal-reg-google-btn"
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 hover:bg-purple-50/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition flex items-center justify-center gap-2.5 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign up with Google (+100 Pts)</span>
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Already registered?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer_login');
                    setErrorMsg('');
                  }}
                  className="text-xs text-purple-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADMIN / OWNER LOGIN */}
          {/* ========================================================================= */}
          {activeTab === 'admin_login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-100/80 dark:bg-amber-500/10 border border-purple-200 dark:border-amber-500/30 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                  Salon Administrator Access Portal
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                  <span>Admin Email or Username</span>
                </label>
                <input
                  type="text"
                  required
                  id="modal-admin-identifier"
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  placeholder="Enter admin email or username"
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                    <span>Unique Admin Password or PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin_forgot_password');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-semibold text-purple-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Forgot Password / Reset?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminSecret ? 'text' : 'password'}
                    required
                    id="modal-admin-secret"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Enter unique Admin Password or PIN"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminSecret(!showAdminSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="modal-admin-submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Suite</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PENDING EMAIL CONFIRMATION SCREEN */}
          {/* ========================================================================= */}
          {activeTab === 'pending_verification' && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20 animate-pulse">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">
                  Confirm Your Email to Activate Account
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  We sent a confirmation link to:
                </p>
                <div className="inline-block px-3 py-1 rounded-xl bg-purple-100 dark:bg-zinc-800 text-purple-900 dark:text-amber-300 font-mono text-xs font-bold border border-purple-200 dark:border-zinc-700">
                  {unverifiedEmail || regEmail || customerIdentifier}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Mandatory Account Verification</span>
                </div>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  You cannot access the salon dashboard or book appointments until your email is verified.
                  Please open your email inbox (or spam folder), click the confirmation link, and then press the button below.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={isCheckingVerification}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingVerification ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I've Confirmed My Email — Check Now &amp; Enter</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isResending ? 'Resending Link...' : 'Resend Confirmation Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer_login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-purple-700 dark:text-amber-400 font-bold hover:underline cursor-pointer pt-1"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: FORGOT PASSWORD (CUSTOMER) */}
          {/* ========================================================================= */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white">
                  Reset Account Password
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter your registered email address and we will dispatch a password reset link directly to your inbox.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-amber-500" />
                  <span>Registered Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-50/40 dark:bg-zinc-950 border border-purple-200 dark:border-zinc-700 focus:border-purple-600 dark:focus:border-amber-500 text-sm text-zinc-900 dark:text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer_login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-purple-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: ADMIN FORGOT PASSWORD */}
          {/* ========================================================================= */}
          {activeTab === 'admin_forgot_password' && (
            <form onSubmit={handleAdminForgotPassword} className="space-y-3.5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white">
                  Reset Administrator Password
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Verify your authorized administrator email and owner PIN to set a new Admin Master Password.
                </p>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Administrator Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dineshghodake941@gmail.com"
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-purple-600 dark:focus:border-amber-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Salon Owner Security PIN *</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Default: 8104</span>
                </label>
                <input
                  type="password"
                  maxLength={8}
                  required
                  placeholder="Enter 4-digit Owner PIN"
                  value={adminResetPin}
                  onChange={(e) => setAdminResetPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-zinc-700 text-sm font-mono tracking-widest focus:outline-none focus:border-purple-600 dark:focus:border-amber-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-purple-600 dark:focus:border-amber-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-purple-600 dark:focus:border-amber-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Admin Master Password</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin_login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-purple-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  ← Back to Admin Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Standard Google Account Chooser Modal */}
      <GoogleAccountSelectModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleSelectGoogleAccount}
        isRegistering={activeTab === 'customer_register'}
      />
    </div>
  );
};
