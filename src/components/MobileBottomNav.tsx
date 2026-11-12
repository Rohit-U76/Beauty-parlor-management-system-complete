import React from 'react';
import { 
  Home, 
  Scissors, 
  Calendar, 
  User, 
  Star
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeNavTab, 
    setActiveNavTab, 
    openBookingModal, 
    userVisitsCount, 
    currentUser,
    openProfileModal
  } = useSalon();

  const handleNav = (tab: string) => {
    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav 
      id="mobile-bottom-navigation-bar"
      aria-label="Mobile Quick Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200/90 dark:border-zinc-800/90 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] safe-area-pb"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        
        {/* 1. Home */}
        <button
          id="mobile-nav-tab-home"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNavTab === 'home'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${activeNavTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Rate Card */}
        <button
          id="mobile-nav-tab-services"
          onClick={() => handleNav('services')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeNavTab === 'services'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Scissors className={`w-5 h-5 mb-0.5 ${activeNavTab === 'services' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Rate Card</span>
        </button>

        {/* 3. Central Prominent Book Button */}
        <div className="relative -top-1.5 flex flex-col items-center">
          <button
            id="mobile-nav-book-action-btn"
            onClick={() => openBookingModal()}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 active:scale-90 transition-transform cursor-pointer border-2 border-white dark:border-zinc-950"
            aria-label="Book Appointment"
          >
            <Calendar className="w-5 h-5 stroke-[2.5px] text-white" />
          </button>
          <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 tracking-tight mt-0.5">
            Book
          </span>
        </div>

        {/* 4. My Visits */}
        <button
          id="mobile-nav-tab-appointments"
          onClick={() => handleNav('appointments')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeNavTab === 'appointments'
              ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 mb-0.5 ${activeNavTab === 'appointments' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            {userVisitsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-[9px]">
                {userVisitsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">My Visits</span>
        </button>

        {/* 5. Client Profile (Edit & Save directly) */}
        <button
          id="mobile-nav-tab-profile"
          onClick={openProfileModal}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
        >
          <div className="p-0.5">
            {currentUser ? (
              <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[9px] mb-0.5">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5 mb-0.5 stroke-2" />
            )}
          </div>
          <span className="text-[10px] tracking-tight font-semibold">Profile</span>
        </button>

      </div>
    </nav>
  );
};
