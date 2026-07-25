import React from 'react';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Download, 
  Info, 
  ExternalLink,
  Check,
  MessageSquare,
  Headphones,
  Trash2,
  X
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll?: () => void;
  onDeleteNotif?: (id: string) => void;
  onNavigate: (target: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDeleteNotif,
  onNavigate,
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'RefreshCw':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'CheckCircle':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Download':
        return <Download className="w-4 h-4 text-teal-500" />;
      case 'MessageSquare':
      case 'Headphones':
        return <Headphones className="w-4 h-4 text-indigo-500" />;
      case 'Info':
        return <Info className="w-4 h-4 text-sky-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'server':
        return 'bg-blue-50';
      case 'payment':
      case 'order':
        return 'bg-green-50';
      case 'promotion':
        return 'bg-amber-50';
      case 'maintenance':
        return 'bg-red-50';
      case 'firmware':
        return 'bg-teal-50';
      case 'chat':
        return 'bg-indigo-50';
      case 'info':
        return 'bg-sky-50';
      default:
        return 'bg-slate-50';
    }
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr === 'Just now' || timeStr.includes('ago') || timeStr.includes('Minute')) return timeStr;
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return timeStr;
  };

  if (!isOpen) return null;

  return (
    <div 
      id="notification-dropdown" 
      className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden text-slate-700 animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAllRead();
              }}
              className="text-[11px] text-[#1E4DFF] hover:underline flex items-center gap-1 font-medium bg-none border-none p-0 cursor-pointer"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && onClearAll && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-[11px] text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-medium bg-none border-none p-0 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close dropdown"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No notifications available
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => {
                onMarkRead(notif.id);
                // Map the notification to a relevant target path if clicked
                if (notif.type === 'firmware') {
                  onNavigate('Home');
                } else if (notif.type === 'payment' || notif.type === 'order') {
                  onNavigate('My Account');
                } else if (notif.type === 'chat') {
                  onNavigate('Support');
                } else {
                  onClose();
                }
              }}
              className={`p-4 flex gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${!notif.read ? 'bg-blue-50/20' : ''}`}
            >
              {/* Icon Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notif.type)}`}>
                {getIcon(notif.icon)}
              </div>

              {/* Message Content */}
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-start gap-1">
                  <h4 className={`text-xs font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
                    )}
                    {onDeleteNotif && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotif(notif.id);
                        }}
                        title="Delete notification"
                        className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {notif.description}
                </p>
                {(notif.link || notif.url) && (
                  <a
                    href={notif.link || notif.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E4DFF] hover:underline mt-1 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/80 transition-all w-fit"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Link</span>
                  </a>
                )}
                <span className="text-[10px] text-slate-400 block pt-1">
                  {formatDisplayTime(notif.time)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] text-slate-400 font-medium">
          Real-time Event Logs Active
        </span>
      </div>
    </div>
  );
}
