import React, { useState } from 'react';
import { Bell, Lock, ShieldAlert, Laptop, Home, User, Tag, LogOut, Settings, Wallet, Menu, X, HelpCircle } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { NotificationItem } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  perspective: 'customer' | 'admin';
  setPerspective: (p: 'customer' | 'admin') => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  currentUser?: any;
  userBalance?: number;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSelectDropdownItem?: (item: 'profile' | 'my-account' | 'settings') => void;
  onOpenSupport?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  perspective,
  setPerspective,
  notifications,
  onMarkRead,
  onMarkAllRead,
  currentUser,
  userBalance = 0,
  onSignIn,
  onSignOut,
  onSelectDropdownItem,
  onOpenSupport,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isUserAdmin = Boolean(
    currentUser?.email && (
      currentUser.email.toLowerCase() === 'iunlockapple01@gmail.com' ||
      currentUser.email.toLowerCase() === 'iunlockapple1427@gmail.com'
    )
  );

  return (
    <header className="relative bg-[#1341f4] text-white px-3 sm:px-6 py-1 shadow-md font-sans z-50">
      <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
        {/* Left branding logo & Title */}
        <div 
          className="flex items-center gap-2 cursor-pointer select-none shrink-0" 
          onClick={() => {
            setActiveTab('home');
            setMobileMenuOpen(false);
          }}
        >
          <img 
            src="https://i.postimg.cc/9MKkZCSz/Chat-GPT-Image-Jul-22-2026-03-25-33-PM.jpg" 
            alt="3uUnlocks Logo" 
            className="h-12 sm:h-16 lg:h-20 w-auto object-contain transition-all" 
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Center navigation tabs - Desktop */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-sm lg:text-base font-extrabold tracking-wide">
          <button
            onClick={() => { setActiveTab('home'); setPerspective('customer'); }}
            className={`pb-1 transition-all cursor-pointer relative flex items-center gap-2 min-h-[44px] ${activeTab === 'home' && perspective === 'customer' ? 'text-white font-black' : 'text-white/85 hover:text-white'}`}
          >
            <Home className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
            <span>Home</span>
            {activeTab === 'home' && perspective === 'customer' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('prices'); setPerspective('customer'); }}
            className={`pb-1 transition-all cursor-pointer relative flex items-center gap-2 min-h-[44px] ${activeTab === 'prices' && perspective === 'customer' ? 'text-white font-black' : 'text-white/85 hover:text-white'}`}
          >
            <Tag className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
            <span>Prices</span>
            {activeTab === 'prices' && perspective === 'customer' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
            )}
          </button>

          {currentUser && (
            <button
              onClick={() => { setActiveTab('my-account'); setPerspective('customer'); }}
              className={`pb-1 transition-all cursor-pointer relative flex items-center gap-2 min-h-[44px] ${activeTab === 'my-account' && perspective === 'customer' ? 'text-white font-black' : 'text-white/85 hover:text-white'}`}
            >
              <User className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
              <span>My Account</span>
              {activeTab === 'my-account' && perspective === 'customer' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
              )}
            </button>
          )}

          {isUserAdmin && (
            <button
              onClick={() => { setPerspective('admin'); setActiveTab('home'); }}
              className={`pb-1 transition-all cursor-pointer relative flex items-center gap-2 min-h-[44px] ${perspective === 'admin' ? 'text-amber-300 font-black' : 'text-amber-200 hover:text-white'}`}
            >
              <ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
              <span>Admin Panel</span>
              {perspective === 'admin' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-300 rounded-full animate-in fade-in duration-300"></span>
              )}
            </button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Wallet Balance Display (Only when logged in) */}
          {currentUser && (
            <div 
              onClick={() => { setActiveTab('my-account'); }}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/15 hover:bg-white/25 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/30 transition-all select-none shadow-sm cursor-pointer"
            >
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D2FF] shrink-0" />
              <span className="hidden sm:inline text-xs sm:text-sm font-extrabold text-white">Balance:</span>
              <span className="text-xs sm:text-sm font-black text-[#00D2FF] font-mono tracking-wide">
                {(userBalance ?? 0).toFixed(2)} <span className="text-[10px] sm:text-xs">USDT</span>
              </span>
            </div>
          )}

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/15 transition-all cursor-pointer relative flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 sm:-top-0.5 sm:-right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black text-white ring-2 ring-[#1341f4]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Render notification center dropdown */}
            <NotificationCenter
              notifications={notifications}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              onNavigate={(target) => {
                setNotifOpen(false);
                if (target === 'Home') setActiveTab('home');
                if (target === 'My Account') setActiveTab('my-account');
                if (target === 'Support' && onOpenSupport) onOpenSupport();
              }}
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
            />
          </div>

          {/* Accounts actions - Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="relative flex items-center gap-3">
                {/* Profile icon toggle */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white/40 flex items-center justify-center text-xs sm:text-sm font-black text-white uppercase shadow-md transition-all cursor-pointer select-none"
                  title={currentUser.displayName || currentUser.email || 'User Account'}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0) : (currentUser.email?.charAt(0) || '👤')}
                </button>

                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800 text-xs text-left">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 font-semibold text-slate-400 text-[9px] uppercase tracking-wider truncate">
                        {currentUser.email}
                      </div>
                      
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('profile');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('my-account');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
                      >
                        <Laptop className="w-4 h-4 text-slate-400" />
                        <span>My Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('settings');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings</span>
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSignOut?.();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 bg-white text-[#1341f4] hover:bg-white/95 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer min-h-[40px]"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-2 pb-4 border-t border-white/20 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              setActiveTab('home');
              setPerspective('customer');
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left transition-all ${
              activeTab === 'home' && perspective === 'customer'
                ? 'bg-white text-[#1341f4] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('prices');
              setPerspective('customer');
              setMobileMenuOpen(false);
            }}
            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left transition-all ${
              activeTab === 'prices' && perspective === 'customer'
                ? 'bg-white text-[#1341f4] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Tag className="w-5 h-5" />
            <span>Prices</span>
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => {
                  setActiveTab('my-account');
                  setPerspective('customer');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left transition-all ${
                  activeTab === 'my-account' && perspective === 'customer'
                    ? 'bg-white text-[#1341f4] shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <User className="w-5 h-5" />
                <span>My Account</span>
              </button>

              <button
                onClick={() => {
                  onSelectDropdownItem?.('profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left text-white hover:bg-white/10 transition-all"
              >
                <Settings className="w-5 h-5" />
                <span>Profile & Settings</span>
              </button>

              {isUserAdmin && (
                <button
                  onClick={() => {
                    setPerspective('admin');
                    setActiveTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left transition-all ${
                    perspective === 'admin'
                      ? 'bg-amber-400 text-slate-900 shadow-sm font-black'
                      : 'text-amber-200 hover:bg-white/10'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Admin Panel</span>
                </button>
              )}

              {onOpenSupport && (
                <button
                  onClick={() => {
                    onOpenSupport();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left text-white hover:bg-white/10 transition-all"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Support Center</span>
                </button>
              )}

              <div className="border-t border-white/20 my-1"></div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut?.();
                }}
                className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold text-left bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-all"
              >
                <LogOut className="w-5 h-5 text-red-200" />
                <span>Log Out ({currentUser.email?.split('@')[0]})</span>
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-white text-[#1341f4] rounded-xl text-sm font-black shadow-md transition-all text-center"
              >
                Sign In / Login
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

