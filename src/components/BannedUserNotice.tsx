import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  MessageSquare, 
  ExternalLink, 
  Mail, 
  User, 
  FileText, 
  Clock, 
  HelpCircle,
  Smartphone,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { notifyWhatsAppClicked } from '../utils/telegram';

interface BannedUserNoticeProps {
  currentUser?: any;
  profileData?: any;
  onOpenSupportChat?: () => void;
  onRestrictedAction?: (e?: React.SyntheticEvent) => void;
}

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function BannedUserNotice({
  currentUser,
  profileData,
  onOpenSupportChat,
  onRestrictedAction
}: BannedUserNoticeProps) {
  const userEmail = currentUser?.email || 'Registered User';
  const displayId = currentUser?.uid ? `USR-${currentUser.uid.substring(0, 8).toUpperCase()}` : 'USR-BANNED';
  const username = profileData?.username || currentUser?.displayName || userEmail.split('@')[0];

  const handleWhatsAppAppeal = () => {
    notifyWhatsAppClicked({
      userId: displayId,
      userEmail: userEmail,
      username: username,
    }).catch(() => {});

    const encodedText = encodeURIComponent(
      `Hello 3uUnlocks Support Team,\n\nMy account (${userEmail}, ID: ${displayId}) has been permanently banned. I am requesting an appeal and review for unbanning.`
    );
    window.open(`https://wa.me/16693268629?text=${encodedText}`, '_blank');
  };

  return (
    <div className="w-full bg-slate-50/50 py-8 sm:py-14 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Main Clean White Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-300">
          
          {/* Subtle Top Accent Ribbon */}
          <div className="h-2.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

          <div className="p-6 sm:p-12 space-y-8">
            
            {/* Header with Icon and Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase font-mono tracking-wider border border-red-200">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Permanent Ban Enforced
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {displayId}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                    Account Permanently Banned
                  </h1>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Access Status</span>
                <span className="text-xs font-black text-red-600 font-mono">RESTRICTED TO HOMEPAGE</span>
              </div>
            </div>

            {/* Policy Violation Explanation */}
            <div className="bg-red-50/60 border border-red-200/70 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Policy Violation & Suspension Notice</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
                Your account (<strong className="text-slate-900">{userEmail}</strong>) has been permanently banned from 3uUnlocks for violating our Terms of Service and Acceptable Use Policies, such as repeatedly checking multiple devices without placing an unlock order, or attempting unauthorized automated queries.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                As a result, all account features—including device checking, order processing, firmware downloads, and wallet transactions—have been permanently revoked. You may only view this homepage and use the support contact options below to communicate with our moderation team.
              </p>
            </div>

            {/* Account Details Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Account User
                </span>
                <p className="text-xs font-extrabold text-slate-900 truncate">{username}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{userEmail}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-500" /> Current Status
                </span>
                <p className="text-xs font-black text-red-600 font-mono">PERMANENTLY BANNED</p>
                <p className="text-[11px] text-slate-500">All features locked</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Permitted Access
                </span>
                <p className="text-xs font-bold text-slate-800">Homepage & Support</p>
                <p className="text-[11px] text-slate-500">Appeals via Support Only</p>
              </div>
            </div>

            {/* Clear Support Contact Action Area */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-black">
                  Official Appeal Channel
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Need to Appeal or Request Unbanning?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  If you believe this ban was placed in error, or if you would like to submit an official appeal to restore your account privileges, contact our dedicated support administrators below.
                </p>
              </div>

              {/* Main Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppAppeal}
                  className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer text-center"
                >
                  <WhatsAppIcon className="w-5 h-5 shrink-0" />
                  <span>Contact Support to Appeal or Request Unbanning</span>
                  <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
                </button>

                {onOpenSupportChat && (
                  <button
                    type="button"
                    onClick={onOpenSupportChat}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-white/15"
                  >
                    <MessageSquare className="w-4 h-4 text-sky-300" />
                    <span>Live Support Chat</span>
                  </button>
                )}
              </div>

              {/* Telegram Contact Options */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <TelegramIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram Contact:</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href="https://t.me/Christoper_Morgan057"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold transition hover:underline"
                  >
                    <span>Telegram Support (@Christoper_Morgan057)</span>
                  </a>
                  <span className="text-white/20">|</span>
                  <a
                    href="https://t.me/iUnlock_Apple1"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium transition hover:underline"
                  >
                    <span>Telegram Channel (@iUnlock_Apple1)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Restricted Features Notice & Warning on Interactive Clicks */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Restricted Features on This Account
                </span>
                <span className="text-[11px] text-slate-400">Clicking any locked tool triggers support appeal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={(e) => onRestrictedAction?.(e)}
                  className="bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 hover:border-red-200 rounded-xl p-3 text-left transition cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-red-700">Check Device Compatibility</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
                  </div>
                  <p className="text-[10px] text-slate-400">Locked — Click to request unban</p>
                </button>

                <button
                  type="button"
                  onClick={(e) => onRestrictedAction?.(e)}
                  className="bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 hover:border-red-200 rounded-xl p-3 text-left transition cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-red-700">Orders & Unlocks</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
                  </div>
                  <p className="text-[10px] text-slate-400">Locked — Click to request unban</p>
                </button>

                <button
                  type="button"
                  onClick={(e) => onRestrictedAction?.(e)}
                  className="bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 hover:border-red-200 rounded-xl p-3 text-left transition cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-red-700">Wallet & Deposits</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
                  </div>
                  <p className="text-[10px] text-slate-400">Locked — Click to request unban</p>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
