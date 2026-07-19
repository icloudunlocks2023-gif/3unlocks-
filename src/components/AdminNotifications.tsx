import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Loader2, 
  Clock, 
  Users, 
  User, 
  Volume2, 
  Radio, 
  Trash2, 
  Check, 
  Wrench, 
  Cpu, 
  Info,
  Layers
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { NotificationItem } from '../types';

interface AdminNotificationsProps {
  notifications: NotificationItem[];
}

export default function AdminNotifications({
  notifications
}: AdminNotificationsProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [notifType, setNotifType] = useState<NotificationItem['type']>('maintenance');
  const [targetType, setTargetType] = useState<'everyone' | 'single'>('everyone');
  const [targetEmail, setTargetEmail] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'future'>('now');
  const [futureDate, setFutureDate] = useState('');

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const id = 'notif_' + Date.now();
      
      // Map icon based on type
      let icon = 'Info';
      if (notifType === 'maintenance') icon = 'Wrench';
      if (notifType === 'server') icon = 'Cpu';
      if (notifType === 'order') icon = 'CheckCircle2';
      if (notifType === 'payment') icon = 'CreditCard';
      if (notifType === 'firmware') icon = 'Download';
      if (notifType === 'promotion') icon = 'Gift';

      const finalDesc = targetType === 'single' && targetEmail.trim()
        ? `[Direct Alert to ${targetEmail}] ${description}`
        : description;

      const payload: NotificationItem = {
        id,
        title,
        description: finalDesc,
        time: scheduleType === 'future' && futureDate ? new Date(futureDate).toISOString() : new Date().toISOString(),
        read: false,
        type: notifType,
        icon
      };

      await setDoc(doc(db, 'notifications', id), payload);

      // Reset
      setTitle('');
      setDescription('');
      setTargetEmail('');
      alert('Notification broadcast successfully dispatched to all target client feeds!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert dispatch history?')) return;
    setLoadingActionId(id);
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Intro Greetings */}
      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-1.5">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            Alerts & Announcements Broadcaster
          </h2>
          <p className="text-xs text-slate-400">
            Dispatch announcements, network maintenance bulletins, and promotional reward vouchers.
          </p>
        </div>
        <div className="text-xs font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
          BROADCAST MODE: ACTIVE
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Creation Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-4 text-left">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-slate-500" />
            Compile New Broadcast Broadcast
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">ALERT TITLE</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Node Network Server Upgrades"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">BULLETIN CONTENT BODY</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write announcement copy displayed on client dashboards..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">BULLETIN CATEGORY</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800 font-semibold"
                >
                  <option value="maintenance">Maintenance 🛠️</option>
                  <option value="server">Server Status 🖥️</option>
                  <option value="order">Order Update 📦</option>
                  <option value="payment">Payment Alert 💳</option>
                  <option value="firmware">Firmware ready 💾</option>
                  <option value="promotion">Promo / Voucher 🎁</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">TARGET AUDIENCE</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800 font-semibold"
                >
                  <option value="everyone">Everyone (All Members)</option>
                  <option value="single">Single Member</option>
                </select>
              </div>
            </div>

            {targetType === 'single' && (
              <div className="space-y-1 animate-in slide-in-from-top duration-150">
                <label className="text-slate-400 font-bold block">TARGET EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="e.g., locked_customer@gmail.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">SCHEDULING TIME</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800"
                >
                  <option value="now">Immediately (Real-Time)</option>
                  <option value="future">Schedule Future Date</option>
                </select>
              </div>

              {scheduleType === 'future' && (
                <div className="space-y-1 animate-in slide-in-from-top duration-150">
                  <label className="text-slate-400 font-bold block">SELECT RELEASE DATE</label>
                  <input
                    type="datetime-local"
                    required
                    value={futureDate}
                    onChange={(e) => setFutureDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-slate-800 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Live Broadcast
            </button>
          </form>
        </div>

        {/* Alerts Log Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-4 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Historical Alerts Queue ({notifications.length})
          </h3>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No dispatches sent yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="py-4 flex items-start justify-between gap-3 first:pt-0 hover:bg-slate-50/20 transition">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {n.type === 'maintenance' && <Wrench className="w-4 h-4 text-amber-500" />}
                      {n.type === 'server' && <Cpu className="w-4 h-4 text-[#1E4DFF]" />}
                      {n.type === 'order' && <Check className="w-4 h-4 text-emerald-500" />}
                      {n.type === 'payment' && <Bell className="w-4 h-4 text-pink-500" />}
                      {n.type === 'firmware' && <Bell className="w-4 h-4 text-indigo-500" />}
                      {n.type === 'promotion' && <Bell className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight select-all">{n.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 select-all leading-normal max-w-sm">{n.description}</p>
                      <span className="text-[9px] text-slate-400 font-mono mt-1 block">{n.time.replace('T', ' ').substring(0, 16)} UTC</span>
                    </div>
                  </div>

                  <button
                    disabled={loadingActionId === n.id}
                    onClick={() => handleDelete(n.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                    title="Purge alert dispatch"
                  >
                    {loadingActionId === n.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
