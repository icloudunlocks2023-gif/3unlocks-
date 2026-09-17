import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .26z"/>
  </svg>
);

export const TelegramAnnouncementBanner: React.FC = () => {
  const telegramUrl = "https://t.me/iUnlock_Apple1";

  const bannerTextContent = (
    <div className="flex items-center gap-6 sm:gap-8 shrink-0 px-4">
      <span className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-semibold tracking-normal select-none">
        <span className="text-base leading-none animate-pulse">🔓</span>
        <span className="font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
          UNLOCKING IS EASY!
        </span>
        <span className="text-slate-200 font-medium">
          Join our Telegram channel with
        </span>
        <span className="font-black text-sky-300 bg-sky-500/25 border border-sky-400/40 px-2 py-0.5 rounded-full text-[11px] sm:text-xs shadow-[0_0_10px_rgba(56,189,248,0.25)]">
          1K+ subscribers
        </span>
        <span className="text-slate-200 font-medium">
          to learn how we work.
        </span>
        <span className="font-black text-white bg-indigo-500/30 border border-indigo-400/50 px-2 py-0.5 rounded-md shadow-sm">
          3uUnlocks supports iPhone & iPad unlocking only.
        </span>
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-200 to-sky-200">
          For MacBook & Apple Watch bypass services, join our Telegram channel and contact the Admin.
        </span>
      </span>

      <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-bold px-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]"></span>
      </span>
    </div>
  );

  return (
    <div 
      id="telegram-top-announcement-banner" 
      className="relative z-20 w-full overflow-hidden bg-gradient-to-r from-[#060a17] via-[#0c1433] to-[#060a17] border-b border-[#0088cc]/30 shadow-[0_4px_22px_-2px_rgba(0,136,204,0.25)] py-2 sm:py-2.5 transition-all"
    >
      {/* Subtle background ambient glowing accents */}
      <div className="absolute -top-12 left-1/4 w-72 h-20 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 right-1/4 w-72 h-20 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Row 1: Smooth Continuous Marquee moving Right → Left */}
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Edge Gradient Masks for Smooth In/Out Fading */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#060a17] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#060a17] to-transparent z-10 pointer-events-none" />

        {/* Marquee Track: Duplicated to ensure perfectly seamless loop */}
        <div className="animate-marquee-infinite">
          {bannerTextContent}
          {bannerTextContent}
        </div>
      </div>

      {/* Row 2: Prominent Animated CTA with Dimming & Arrow Callout */}
      <div className="flex items-center justify-center gap-2 sm:gap-3.5 pt-1.5 sm:pt-2 px-3 sm:px-4 flex-wrap">
        {/* Animated "Click to join" pointer badge with glowing bouncing arrow */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-300/40 text-amber-300 font-extrabold text-[10px] sm:text-[11px] shadow-[0_0_14px_rgba(251,191,36,0.35)] select-none animate-pulse">
          <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="tracking-wide uppercase font-black drop-shadow-sm">Click to join</span>
          <span className="animate-arrow-point font-black text-amber-200 text-xs sm:text-sm leading-none inline-block">➔</span>
        </div>

        {/* The Animated Button with Dimming Glow and Shimmer */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#0088cc] via-[#2563eb] to-[#7c3aed] hover:from-[#0099e6] hover:via-[#3b82f6] hover:to-[#8b5cf6] text-white font-black text-[11px] sm:text-xs tracking-wide border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden animate-dim-glow hover:scale-105 active:scale-95"
          title="Open official 3uUnlocks Telegram channel"
        >
          {/* Shimmer light beam sweep passing through */}
          <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none animate-shimmer-sweep" />

          {/* Pulsing live member beacon */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>

          <TelegramIcon className="w-3.5 h-3.5 text-white shrink-0 group-hover:rotate-12 transition-transform drop-shadow" />
          
          <span className="font-extrabold drop-shadow tracking-wide whitespace-nowrap">
            Join Our Telegram Channel
          </span>

          <span className="hidden xs:inline-block bg-white/20 text-sky-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-xs">
            1K+ Subscribers
          </span>

          {/* Animated Arrow inside button */}
          <ArrowRight className="w-3.5 h-3.5 text-white/95 group-hover:translate-x-1 animate-arrow-point transition-transform shrink-0" />
        </a>
      </div>
    </div>
  );
};
