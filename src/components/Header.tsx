import React, { useState } from 'react';
import { Bell, Lock, ShieldAlert, Laptop, Home, User, Tag, LogOut, Settings } from 'lucide-react';
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
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSelectDropdownItem?: (item: 'profile' | 'my-account' | 'settings') => void;
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
  onSignIn,
  onSignOut,
  onSelectDropdownItem,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="relative bg-[#1E4DFF] text-white px-6 py-4 shadow-md font-sans z-50">
      <div className="max-w-7xl mx-auto flex flex-row justify-between items-center">
        {/* Left branding logo & Title */}
        <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
          {/* Custom SVG logo matching the image exactly */}
          <div className="relative w-10 h-10 shrink-0 select-none">
            <svg viewBox="0 0 120 120" className="w-10 h-10">
              <defs>
                <linearGradient id="headerLockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              {/* Shackle */}
              <path 
                d="M55 40V28C55 16.95 63.95 8 75 8C86.05 8 95 16.95 95 28V40" 
                fill="none" 
                stroke="white" 
                strokeWidth="8" 
                strokeLinecap="round" 
              />
              {/* Lock Body */}
              <rect x="45" y="40" width="58" height="58" rx="14" fill="url(#headerLockGrad)" />
              {/* Keyhole */}
              <circle cx="74" cy="63" r="5" fill="white" />
              <polygon points="70.5,68 77.5,68 79.5,79 68.5,79" fill="white" />
              {/* Stylized '3' */}
              <text 
                x="12" 
                y="85" 
                fill="white" 
                fontSize="76" 
                fontWeight="900" 
                className="font-sans font-black" 
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900 }}
              >
                3
              </text>
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            <span className="text-[#00D2FF]">3u</span><span>Unlocks</span>
          </span>
        </div>

        {/* Center navigation tabs */}
        <nav className="flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => { setActiveTab('home'); setPerspective('customer'); }}
            className={`pb-1 transition-all cursor-pointer relative flex items-center gap-1.5 ${activeTab === 'home' && perspective === 'customer' ? 'text-white font-bold' : 'text-white/80 hover:text-white'}`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
            {activeTab === 'home' && perspective === 'customer' && (
              <span className="absolute bottom-[-6px] left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('prices'); setPerspective('customer'); }}
            className={`pb-1 transition-all cursor-pointer relative flex items-center gap-1.5 ${activeTab === 'prices' && perspective === 'customer' ? 'text-white font-bold' : 'text-white/80 hover:text-white'}`}
          >
            <Tag className="w-4 h-4" />
            <span>Prices</span>
            {activeTab === 'prices' && perspective === 'customer' && (
              <span className="absolute bottom-[-6px] left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
            )}
          </button>

          {currentUser && (
            <button
              onClick={() => { setActiveTab('my-account'); setPerspective('customer'); }}
              className={`pb-1 transition-all cursor-pointer relative flex items-center gap-1.5 ${activeTab === 'my-account' && perspective === 'customer' ? 'text-white font-bold' : 'text-white/80 hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              <span>My Account</span>
              {activeTab === 'my-account' && perspective === 'customer' && (
                <span className="absolute bottom-[-6px] left-0 right-0 h-[3px] bg-white rounded-full animate-in fade-in duration-300"></span>
              )}
            </button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-5">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer relative flex items-center justify-center"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white ring-2 ring-[#1E4DFF]">
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
              }}
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
            />
          </div>

          {/* Separation pipe */}
          <span className="w-[1px] h-5 bg-white/20"></span>

          {/* Accounts actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative flex items-center gap-3">
                
                {/* Profile icon toggle */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/25 flex items-center justify-center text-xs font-bold text-white uppercase transition-all cursor-pointer select-none"
                  title={currentUser.displayName || currentUser.email || 'User Account'}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0) : (currentUser.email?.charAt(0) || '👤')}
                </button>

                {profileDropdownOpen && (
                  <>
                    {/* Background overlay to click-close */}
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                    
                    {/* Elegant Dropdown Card */}
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800 text-xs text-left">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 font-semibold text-slate-400 text-[9px] uppercase tracking-wider">
                        {currentUser.email}
                      </div>
                      
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('profile');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('my-account');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
                      >
                        <Laptop className="w-4 h-4 text-slate-400" />
                        <span>My Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectDropdownItem?.('settings');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium transition text-slate-700 hover:text-[#1E4DFF]"
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
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-semibold transition"
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
                className="px-4 py-2 bg-white text-[#1E4DFF] hover:bg-white/95 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
