import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const EmailVerificationBanner: React.FC = () => {
  const { currentUser, checkEmailVerification, resendVerificationEmail } = useSalon();
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Only show if user is logged in, has an email, and email is not verified yet
  if (!currentUser || currentUser.emailVerified || !currentUser.email) {
    return null;
  }

  const handleRefresh = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setStatusMessage('✅ Email verified successfully! Your account is active.');
      } else {
        setStatusMessage('Verification link not clicked yet. Please check your spam/inbox folder and click the link.');
      }
    } catch {
      setStatusMessage('Could not verify status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setIsSending(true);
    setStatusMessage(null);
    try {
      await resendVerificationEmail();
      setStatusMessage(`📩 Verification email resent to ${currentUser.email}. Please check your inbox.`);
    } catch (e: any) {
      setStatusMessage(e.message || 'Failed to resend verification email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Email confirmation pending:</strong> A verification link was sent to{' '}
            <span className="font-semibold underline">{currentUser.email}</span>. Please confirm your email to activate full booking privileges.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'I Confirmed (Check)'}
          </button>

          <button
            onClick={handleResend}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-amber-500/30 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            {isSending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="max-w-7xl mx-auto mt-1.5 text-center sm:text-left font-medium text-amber-600 dark:text-amber-300">
          {statusMessage}
        </div>
      )}
    </div>
  );
};
