import React, { useEffect } from 'react';
import { ShieldAlert, X, MessageSquare, ExternalLink } from 'lucide-react';
import { notifyWhatsAppClicked } from '../utils/telegram';

interface BannedRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onOpenLiveChat?: () => void;
}

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export default function BannedRestrictedModal({
  isOpen,
  onClose,
  currentUser,
  onOpenLiveChat
}: BannedRestrictedModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleWhatsAppAppeal = () => {
    const email = currentUser?.email || 'Registered User';
    const uid = currentUser?.uid || 'USR';
    notifyWhatsAppClicked({
      userId: `USR-${uid.substring(0, 8).toUpperCase()}`,
      userEmail: email,
      username: currentUser?.displayName || email.split('@')[0],
    }).catch(() => {});

    const encodedText = encodeURIComponent(
      `Hello 3uUnlocks Support, my account (${email}) has been permanently banned. I would like to submit an appeal or request unbanning.`
    );
    window.open(`https://wa.me/16693268629?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Alert Bar */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase font-mono tracking-wider border border-red-200">
              Access Restricted
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Account Banned — Please Contact Support to Appeal or Request Unbanning.
            </h3>
          </div>

          {/* Explanation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This feature or page is locked because your account has been permanently banned for violating 3uUnlocks policies (such as repeated automated or unverified queries without active service fulfillment).
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              When banned, you are only permitted to view the homepage and access customer support contact options.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href="https://t.me/Christoper_Morgan057"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .26z"/>
              </svg>
              <span>Contact Support on Telegram (@Christoper_Morgan057)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={handleWhatsAppAppeal}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Contact Support on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {onOpenLiveChat && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveChat();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Open Live Support Chat</span>
              </button>
            )}

            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span>Official Community:</span>
              <a
                href="https://t.me/iUnlock_Apple1"
                target="_blank"
                rel="noreferrer"
                className="text-[#0088cc] hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>Telegram Channel (@iUnlock_Apple1)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 py-1 transition cursor-pointer"
            >
              Dismiss Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
