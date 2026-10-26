import React from 'react';
import { AlertTriangle, X, MessageSquare, Send } from 'lucide-react';

interface WhatsAppUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveChat?: () => void;
}

export const WhatsAppUnavailableModal: React.FC<WhatsAppUnavailableModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveChat,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Note Content */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider font-mono">
            <span>Notice</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Temporarily Unavailable
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed px-2">
            WhatsApp support is temporarily unavailable. Please use Telegram Support or our Live Support Chat for immediate help.
          </p>
        </div>

        {/* Alternative Support Actions */}
        <div className="pt-2 space-y-2">
          <a
            href="https://t.me/iUnlock_Apple1"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open Telegram Support</span>
          </a>

          {onOpenLiveChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveChat();
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 hover:text-[#1E4DFF] text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition border border-slate-200/60 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#1E4DFF]" />
              <span>Use Live Chat Support</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
