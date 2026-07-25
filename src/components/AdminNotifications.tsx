import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Loader2, 
  Users, 
  User, 
  Trash2, 
  Check, 
  ExternalLink,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { NotificationItem, UserSession } from '../types';

interface AdminNotificationsProps {
  notifications: NotificationItem[];
  onBack?: () => void;
}

export default function AdminNotifications({
  notifications,
  onBack
}: AdminNotificationsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [targetType, setTargetType] = useState<'everyone' | 'single'>('everyone');
  const [targetUser, setTargetUser] = useState('');
  
  // User search suggestions
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch users for auto-complete suggestions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_sessions'), (snapshot) => {
      const list: UserSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserSession);
      });
      setUsersList(list);
    }, (err) => {
      console.warn("Could not load user sessions for autocomplete:", err);
    });
    return () => unsub();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (targetType === 'single' && !targetUser.trim()) {
      alert('Please enter or select a target User ID or Email address.');
      return;
    }

    setLoading(true);
    try {
      const id = 'notif_' + Date.now();
      
      const isEmail = targetUser.includes('@');
      const cleanTarget = targetUser.trim();

      const payload: NotificationItem = {
        id,
        title: targetType === 'single' ? 'Direct Message from Admin' : 'System Announcement',
        description: message.trim(),
        time: new Date().toISOString(),
        read: false,
        type: 'info',
        icon: 'Info',
        link: link.trim() || undefined,
        url: link.trim() || undefined,
        targetEmail: targetType === 'single' && isEmail ? cleanTarget : undefined,
        targetUserId: targetType === 'single' && !isEmail ? cleanTarget : undefined,
        userId: targetType === 'single' ? cleanTarget : undefined
      };

      await setDoc(doc(db, 'notifications', id), payload);

      // Reset
      setMessage('');
      setLink('');
      setTargetUser('');
      alert('Notification broadcast successfully dispatched!');
    } catch (err) {
      console.error(err);
      alert('Failed to send notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setLoadingActionId(id);
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Filter users for autocomplete
  const filteredSuggestions = usersList.filter(u => {
    if (!targetUser.trim()) return false;
    const q = targetUser.toLowerCase();
    return (
      (u.userId && u.userId.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  return (
    <div className="space-y-8 text-slate-800 font-sans max-w-4xl">
      
      {/* Top Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 transition cursor-pointer shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Broadcast Notifications
        </h1>
      </div>

      {/* Compose Message Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Card Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Bell className="w-6 h-6 text-[#1E4DFF] stroke-[2]" />
          <h2 className="text-xl font-bold text-slate-900">
            Compose Message
          </h2>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-6">
          
          {/* Target Audience */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-800 block">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setTargetType('everyone');
                  setShowSuggestions(false);
                }}
                className={`py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  targetType === 'everyone'
                    ? 'bg-[#1E4DFF] text-white shadow-md shadow-blue-500/15'
                    : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Users</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('single')}
                className={`py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  targetType === 'single'
                    ? 'bg-[#1E4DFF] text-white shadow-md shadow-blue-500/15'
                    : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Specific User</span>
              </button>
            </div>

            {/* Specific User Input & Autocomplete */}
            {targetType === 'single' && (
              <div className="relative pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required={targetType === 'single'}
                    value={targetUser}
                    onChange={(e) => {
                      setTargetUser(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search or enter User ID (e.g. USR-7A3F9C21) or Email address..."
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:outline-none focus:border-[#1E4DFF] focus:ring-2 focus:ring-[#1E4DFF]/20 font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  {targetUser && (
                    <button
                      type="button"
                      onClick={() => setTargetUser('')}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Matching Users
                    </div>
                    {filteredSuggestions.map((u) => (
                      <button
                        type="button"
                        key={u.uid}
                        onClick={() => {
                          setTargetUser(u.userId || u.email);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50/50 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{u.username || 'User'}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-[#1E4DFF] px-2 py-0.5 rounded">
                          {u.userId || `USR-${u.uid.substring(0,8).toUpperCase()}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Message */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 block">
              Notification Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Type your announcement here..."
              className="w-full h-40 p-4 border border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:outline-none focus:border-[#1E4DFF] focus:ring-2 focus:ring-[#1E4DFF]/20 resize-none font-medium text-slate-800 placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Link (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Link (Optional)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:outline-none focus:border-[#1E4DFF] focus:ring-2 focus:ring-[#1E4DFF]/20 font-medium text-slate-800 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400 italic mt-1.5">
              This URL will be clickable in the user's notification tray.
            </p>
          </div>

          {/* Send Broadcast Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !message.trim() || (targetType === 'single' && !targetUser.trim())}
              className="w-full py-4 bg-[#6A51D6] hover:bg-[#5C45C3] text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Broadcast</span>
            </button>
          </div>

        </form>
      </div>

      {/* Historical Alerts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Recent Sent Notifications ({notifications.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Feed</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No broadcast notifications dispatched yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="py-4 flex items-start justify-between gap-3 first:pt-0 hover:bg-slate-50/40 transition rounded-lg px-2 -mx-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 select-all">{n.title}</span>
                    {n.targetEmail || n.targetUserId || n.userId ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        Target: {n.targetEmail || n.targetUserId || n.userId}
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-[#1E4DFF] text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        All Users
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 select-all leading-normal max-w-xl">{n.description}</p>
                  {(n.link || n.url) && (
                    <a
                      href={n.link || n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E4DFF] hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{n.link || n.url}</span>
                    </a>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                    {new Date(n.time).toLocaleString()}
                  </span>
                </div>

                <button
                  disabled={loadingActionId === n.id}
                  onClick={() => handleDelete(n.id)}
                  className={`${
                    confirmDeleteId === n.id 
                      ? 'bg-red-600 text-white font-bold px-2.5 py-1 text-[10px] rounded' 
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded'
                  } transition cursor-pointer shrink-0`}
                  title="Delete notification"
                >
                  {loadingActionId === n.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confirmDeleteId === n.id ? (
                    <span>Confirm?</span>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
