import React, { useState } from 'react';
import { Shield, GraduationCap, UserCheck, Flame, Menu, X, LogIn, LogOut, Search, Settings, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import AuthModal from './AuthModal';

export default function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user, role, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="bg-[#18181B] text-white border-b border-zinc-800 sticky top-0 z-40 shrink-0">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center gap-4">
            
            {/* Mobile Menu Toggle & Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E6CA9E] via-[#C5A880] to-[#8C6D3B] text-zinc-950 flex items-center justify-center font-black text-xs shadow-[0_0_12px_rgba(197,168,128,0.3)] ring-1 ring-amber-300/40 shrink-0">
                  <Shield text-zinc-950 className="w-4 h-4 fill-zinc-950" />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-wider text-white block leading-none">CAPACITY CONNECT</span>
                  <span className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest mt-0.5 block">INSTITUTIONAL LMS & KG ENGINE</span>
                </div>
              </div>
            </div>

            {/* Middle Global Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search learners, modules, or anything..."
                  className="w-full pl-9 pr-14 py-1.5 bg-zinc-900/90 border border-zinc-700/70 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  Ctrl K
                </span>
              </div>
            </div>

            {/* Right Controls Panel */}
            <div className="flex items-center space-x-2.5 shrink-0">
              
              {/* Streak Badge (Trainee) */}
              {role === 'trainee' && user && (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-semibold rounded-full" title="Active Learning Streak">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{user.streak_days ?? 1} Day Streak</span>
                </div>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* Settings & Sun Icons */}
              <button className="hidden sm:flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="hidden sm:flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <Sun className="w-4 h-4" />
              </button>

              {/* Authenticated User Profile Chip */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-[#C5A880] flex items-center justify-center font-bold text-xs border border-zinc-700">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="hidden xl:block text-left text-xs">
                    <p className="font-bold text-white text-[11px] leading-tight truncate max-w-[130px]">
                      {user.full_name}
                    </p>
                    <p className="text-[10px] text-[#C5A880] font-semibold capitalize">{role} Portal</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1 bg-[#C5A880] text-zinc-950 text-xs font-bold rounded-lg hover:bg-[#b0926b] transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Sign In / Register</span>
                </button>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
