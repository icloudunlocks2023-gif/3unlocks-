import React from 'react';

interface FooterProps {
  onNavigate: (tab: 'home' | 'prices' | 'my-account') => void;
  serverVersion: string;
  serverStatus: 'Online' | 'Maintenance' | 'Offline';
}

export default function Footer({ onNavigate, serverVersion, serverStatus }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 px-6 text-slate-500 font-sans mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Col 1: Branding */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2.5">
            {/* Custom SVG logo matching the image exactly */}
            <div className="relative w-10 h-10 bg-[#1E4DFF] rounded-xl flex items-center justify-center shrink-0 select-none shadow-sm">
              <svg viewBox="0 0 120 120" className="w-8 h-8">
                <defs>
                  <linearGradient id="footerLockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                <rect x="45" y="40" width="58" height="58" rx="14" fill="url(#footerLockGrad)" />
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
            <span className="text-lg font-black tracking-tight text-slate-900">
              <span className="text-[#1E4DFF]">3u</span><span>Unlocks</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            Professional iCloud Activation Lock services for supported iPhones and iPads. Fast. Secure. Reliable.
          </p>
        </div>

        {/* Col 2: Quick Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button 
                onClick={() => onNavigate('home')} 
                className="hover:text-[#1E4DFF] transition-all cursor-pointer bg-none border-none p-0 font-medium text-slate-500"
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('prices')} 
                className="hover:text-[#1E4DFF] transition-all cursor-pointer bg-none border-none p-0 font-medium text-slate-500"
              >
                Prices
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate('my-account')} 
                className="hover:text-[#1E4DFF] transition-all cursor-pointer bg-none border-none p-0 font-medium text-slate-500"
              >
                My Account
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Support */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Support</h4>
          <ul className="space-y-2.5 text-xs font-medium text-slate-500">
            <li>
              <a href="https://t.me/" target="_blank" rel="noreferrer" className="hover:text-[#1E4DFF] transition-all">
                Telegram
              </a>
            </li>
            <li>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="hover:text-[#1E4DFF] transition-all">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="mailto:support@3uunlocks.com" className="hover:text-[#1E4DFF] transition-all">
                Email Support
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Server status (styled exactly like image) */}
        <div className="md:col-span-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 space-y-1.5 md:justify-self-end w-full max-w-[280px]">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
            <span>Server Status</span>
          </div>
          <p className="text-emerald-600 font-bold text-xs pl-4">Online</p>
          <p className="text-[11px] text-slate-400 pl-4 font-sans">Version {serverVersion}</p>
        </div>
      </div>

      {/* Copyright row */}
      <div className="max-w-7xl mx-auto border-t border-slate-100 mt-10 pt-6 text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} 3uUnlocks. All Rights Reserved.
      </div>
    </footer>
  );
}
