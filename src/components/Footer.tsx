import React from 'react';

interface FooterProps {
  onNavigate: (tab: 'home' | 'prices' | 'my-account' | 'terms' | 'privacy' | 'refund' | 'faq') => void;
  serverVersion: string;
  serverStatus: 'Online' | 'Maintenance' | 'Offline';
}

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer({ onNavigate, serverVersion, serverStatus }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-100 py-3.5 px-6 text-slate-500 font-sans mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => onNavigate('home')}>
          <img 
            src="https://i.postimg.cc/FFBgHf4W/new.png" 
            alt="3uUnlocks Logo" 
            className="h-12 sm:h-14 lg:h-16 w-auto object-contain transition-all" 
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Center Section: Policy Links (Above) + Support Links (Below) */}
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {/* Policy Links - Bold & Bigger */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm font-bold text-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="hover:text-[#1E4DFF] transition cursor-pointer font-bold text-slate-800 hover:underline"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-300 font-normal">•</span>
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="hover:text-[#1E4DFF] transition cursor-pointer font-bold text-slate-800 hover:underline"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 font-normal">•</span>
            <button
              type="button"
              onClick={() => onNavigate('refund')}
              className="hover:text-[#1E4DFF] transition cursor-pointer font-bold text-slate-800 hover:underline"
            >
              Refund Policy
            </button>
            <span className="text-slate-300 font-normal">•</span>
            <button
              type="button"
              onClick={() => onNavigate('faq')}
              className="hover:text-[#1E4DFF] transition cursor-pointer font-bold text-slate-800 hover:underline"
            >
              FAQ
            </button>
          </div>

          {/* Support Buttons - Pushed Below */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mr-0.5 hidden sm:inline">
              Support:
            </span>

            <a 
              href="https://t.me/Unlocks_3u" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-[11px] font-bold transition-all border border-[#0088cc]/20 shadow-sm"
            >
              <TelegramIcon className="w-3.5 h-3.5 text-[#0088cc]" />
              <span>Telegram Channel</span>
            </a>

            <a 
              href="https://t.me/Chris_Morgan057" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-[11px] font-bold transition-all border border-[#0088cc]/20 shadow-sm"
            >
              <TelegramIcon className="w-3.5 h-3.5 text-[#0088cc]" />
              <span>Telegram Support</span>
            </a>

            <a 
              href="https://wa.me/message/VAWM7QDYEPBZF1" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[11px] font-bold transition-all border border-[#25D366]/20 shadow-sm"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Server status pill */}
        <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
            <span>Server:</span>
            <span className="text-emerald-600 font-bold">{serverStatus}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans">v{serverVersion}</span>
        </div>
      </div>

      {/* Copyright Row */}
      <div className="max-w-7xl mx-auto border-t border-slate-100 mt-2.5 pt-2 text-center text-[11px] text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} 3uUnlocks. All Rights Reserved.
      </div>
    </footer>
  );
}
