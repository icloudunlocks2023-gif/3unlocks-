import React from 'react';
import { 
  X, 
  MessageSquare, 
  AlertTriangle,
  ExternalLink,
  Headphones,
  Zap
} from 'lucide-react';

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .26z"/>
  </svg>
);

export interface WhatsAppUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveChat?: () => void;
}

export const WhatsAppUnavailableModal: React.FC<WhatsAppUnavailableModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveChat,
}) => {
  // Support Link (1-on-1 Admin direct assistance)
  const telegramSupportUrl = "https://t.me/Christoper_Morgan057";
  // Channel Link (Announcements & proofs)
  const telegramChannelUrl = "https://t.me/iUnlock_Apple1";

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative bg-white/95 backdrop-blur-md rounded-2xl max-w-[420px] w-full p-4 sm:p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] border border-slate-200 text-slate-800 space-y-3.5 animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top ambient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Header */}
        <div className="text-center space-y-2 pt-0.5">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#25D366]/20 via-[#25D366]/30 to-amber-100 border border-[#25D366]/40 flex items-center justify-center shadow-xs">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border-2 border-white shadow-xs">
              <AlertTriangle className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
              <span>Temporary Notice</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
              WhatsApp Support Unavailable
            </h2>
            <p className="text-[11.5px] text-slate-600 leading-relaxed max-w-sm mx-auto">
              Our WhatsApp support line is temporarily undergoing scheduled maintenance. Please use our 2 active support desks:
            </p>
          </div>
        </div>

        {/* Only 2 Alternatives: Live Web Chat Support & Telegram Support */}
        <div className="space-y-2.5 pt-1">
          {/* Alternative 1: Live Web Chat Support (Redirects directly to panel) */}
          <div className="group rounded-xl p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200 hover:border-blue-400 transition-all shadow-xs hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#1E4DFF] to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                    Live Web Chat Support
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[9px]">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Panel
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Instant in-browser support with our unlock specialists.
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-blue-100/80 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                <Headphones className="w-3 h-3 text-blue-500 shrink-0" />
                Browser Panel Chat
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLiveChat) {
                    onOpenLiveChat();
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E4DFF] hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Open Live Chat Panel</span>
                <span className="font-bold">➔</span>
              </button>
            </div>
          </div>

          {/* Alternative 2: Telegram Support */}
          <div className="group rounded-xl p-3 bg-gradient-to-r from-sky-50/90 via-cyan-50/70 to-sky-50/90 border border-sky-200 hover:border-sky-400 transition-all shadow-xs hover:shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#009be5] to-[#0072aa] text-white flex items-center justify-center shrink-0 shadow-xs">
                <TelegramIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                    Telegram Support
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-extrabold text-[9px]">
                    <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                    1-on-1 Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Message Admin directly (@Christoper_Morgan057) for fast assistance.
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-sky-100/80 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-sky-700 truncate max-w-[150px]">
                @Christoper_Morgan057
              </span>
              <a
                href={telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white font-extrabold text-[11px] shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Telegram Support</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Compact Footer Note Clarifying Channel vs Support */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10.5px]">
          <span className="text-slate-500 truncate">
            Public Channel:
          </span>
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="text-[#0088cc] hover:underline font-bold inline-flex items-center gap-1"
            title="Official Telegram Channel with 4K+ Subscribers"
          >
            <span>iUnlock Channel (4K+ Subs)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
