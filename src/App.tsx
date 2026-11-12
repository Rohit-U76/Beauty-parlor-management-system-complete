import React from 'react';
import { SalonProvider, useSalon } from './context/SalonContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CustomerHome } from './views/CustomerHome';
import { CustomerServices } from './views/CustomerServices';
import { CustomerGallery } from './views/CustomerGallery';
import { CustomerOffers } from './views/CustomerOffers';
import { CustomerAbout } from './views/CustomerAbout';
import { CustomerContact } from './views/CustomerContact';
import { CustomerReviewsPage } from './views/CustomerReviewsPage';
import { CustomerPastAppointments } from './views/CustomerPastAppointments';
import { AdminSuite } from './views/AdminSuite';
import { AdminAuthGate } from './components/AdminAuthGate';
import { AuthGatewayScreen } from './components/AuthGatewayScreen';
import { AuthModal } from './components/AuthModal';
import { BookingModal } from './components/BookingModal';
import { SmartRecommendationQuiz } from './components/SmartRecommendationQuiz';
import { AiAssistantWidget } from './components/AiAssistantWidget';
import { AppointmentReminderToast } from './components/AppointmentReminderToast';
import { ClientProfileModal } from './components/ClientProfileModal';
import { CustomerTerms } from './views/CustomerTerms';
import { MobileBottomNav } from './components/MobileBottomNav';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';

function SalonAppContent() {
  const { isAdminMode, setIsAdminMode, currentUser, isGuestMode, activeNavTab } = useSalon();

  // Authorization Gate: Show auth gateway if neither logged in nor continuing as guest
  if (!currentUser && !isGuestMode) {
    return (
      <div className="min-h-screen bg-[#faf7ff] dark:bg-stone-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <AuthGatewayScreen />
        <AuthModal />
      </div>
    );
  }

  // Strict Email Verification Gate:
  // Customers MUST verify their email address before accessing the salon dashboard or taking the account
  if (currentUser && !currentUser.emailVerified && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#faf7ff] dark:bg-stone-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <AuthGatewayScreen initialTab="pending_verification" initialEmail={currentUser.email} />
        <AuthModal />
      </div>
    );
  }

  // Standard Role Authorization: Customers are strictly regular clients and never routed to admin gate
  if (currentUser && currentUser.role !== 'ADMIN' && isAdminMode) {
    setIsAdminMode(false);
  }

  const effectiveAdmin = isAdminMode && currentUser?.role === 'ADMIN';

  if (effectiveAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <AdminSuite />
        <AuthModal />
        <BookingModal />
        <AppointmentReminderToast />
      </div>
    );
  }

  // Show AdminAuthGate only if an unauthenticated user or guest explicitly requested admin view
  if (isAdminMode && !currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <AdminAuthGate />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 selection:bg-amber-500 selection:text-black">
      <EmailVerificationBanner />
      <Navbar />

      <main className="flex-1 pb-20 lg:pb-0">
        {activeNavTab === 'home' && <CustomerHome />}
        {activeNavTab === 'services' && <CustomerServices />}
        {activeNavTab === 'gallery' && <CustomerGallery />}
        {activeNavTab === 'offers' && <CustomerOffers />}
        {activeNavTab === 'reviews' && <CustomerReviewsPage />}
        {(activeNavTab === 'appointments' || activeNavTab === 'dashboard' || activeNavTab === 'visits') && <CustomerPastAppointments />}
        {activeNavTab === 'terms' && <CustomerTerms />}
        {activeNavTab === 'about' && <CustomerAbout />}
        {activeNavTab === 'contact' && <CustomerContact />}
      </main>

      <Footer />

      {/* Global Interactive Modals, AI Widgets, Auth & 24h Reminder Toast */}
      <AuthModal />
      <BookingModal />
      <ClientProfileModal />
      <SmartRecommendationQuiz />
      <AiAssistantWidget />
      <AppointmentReminderToast />
      
      {/* Mobile Bottom Navigation Bar with Three-Dots More Options */}
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <SalonProvider>
      <SalonAppContent />
    </SalonProvider>
  );
}

