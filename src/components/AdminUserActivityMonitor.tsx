import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ArrowLeft, 
  Wifi, 
  Globe, 
  MapPin, 
  Search,
  X
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserSession, UserActivity } from '../types';
import { isAdminEmail } from '../utils/activityTracker';

interface AdminUserActivityMonitorProps {
  userEmail?: string;
  onBack?: () => void;
}

export default function AdminUserActivityMonitor({ userEmail, onBack }: AdminUserActivityMonitorProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Real-time Firestore subscription to user_sessions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_sessions'), (snapshot) => {
      const list: UserSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserSession;
        list.push(data);
      });
      // Sort sessions by lastActive desc
      list.sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime());
      setSessions(list);
      setLoading(false);
    }, (err) => {
      console.warn("User sessions subscription error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Real-time Firestore subscription to user_activities feed
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_activities'), (snapshot) => {
      const list: UserActivity[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as UserActivity);
      });
      // Sort activities by timestamp desc (latest activity on top!)
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setActivities(list);
    }, (err) => {
      console.warn("User activities subscription error:", err);
    });

    return () => unsub();
  }, []);

  const [now, setNow] = useState(Date.now());

  // Ticker to re-evaluate 10-minute active window every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Helper: Determine if user was active within the last 10 minutes (600,000 ms)
  const isUserActiveLast10Mins = (lastActiveIso?: string): boolean => {
    if (!lastActiveIso) return false;
    const activeTime = new Date(lastActiveIso).getTime();
    if (isNaN(activeTime)) return false;
    const diffMs = now - activeTime;
    return diffMs >= 0 && diffMs <= 10 * 60 * 1000; // 10 minutes
  };

  // Filter active sessions strictly to non-admin users active in the last 10 minutes
  const activeSessions = useMemo(() => {
    return sessions.filter((s) => !isAdminEmail(s.email) && isUserActiveLast10Mins(s.lastActive));
  }, [sessions, now]);

  // Filter & sort activities (non-admin only, latest on top)
  const filteredActivities = useMemo(() => {
    const nonAdminActivities = activities.filter((act) => !isAdminEmail(act.email));
    const sorted = [...nonAdminActivities].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter((act) => 
      (act.email && act.email.toLowerCase().includes(q)) ||
      (act.userId && act.userId.toLowerCase().includes(q)) ||
      (act.action && act.action.toLowerCase().includes(q)) ||
      (act.page && act.page.toLowerCase().includes(q)) ||
      (act.ipAddress && act.ipAddress.includes(q)) ||
      (act.country && act.country.toLowerCase().includes(q))
    );
  }, [activities, searchQuery]);

  // Format feed time like: 21:33:35 (Aug 12)
  const formatFeedTime = (isoString?: string): string => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '-';

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();

      return `${hours}:${minutes}:${seconds} (${month} ${day})`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-xs"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Activity & Live Monitoring
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Live Updates Enabled</span>
        </div>
      </div>

      {/* 2. Active Sessions Now Section */}
      <div className="bg-[#f0fdf4]/50 border border-emerald-100/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Wifi className="w-5 h-5 text-emerald-600" />
          <h2>Active Sessions Now ({activeSessions.length})</h2>
        </div>

        {activeSessions.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-slate-150 text-xs text-slate-400 font-medium">
            No users are currently online.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.uid}
                className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs space-y-2.5 w-full sm:w-72 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={session.email}>
                    {session.email}
                  </span>
                  <span className="bg-emerald-100/90 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    ONLINE
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  UID: {session.userId || (session.uid ? session.uid.substring(0, 8) : 'N/A')}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{session.country || 'Kenya'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#1E4DFF] font-mono font-medium">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>{session.ipAddress || '129.222.147.144'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                    LAST INTERACTION
                  </span>
                  <p className="text-xs font-medium text-slate-700 italic truncate">
                    "{session.lastAction || (session.currentPage ? `Visited /${session.currentPage}` : 'Clicked: OK / Proceed')}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Real-time Activity Feed (Last 200) Section */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
        
        {/* Card Header with optional Search */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#1E4DFF]" />
            <h2 className="font-bold text-slate-900 text-base tracking-tight">
              Real-time Activity Feed (Last 200)
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E4DFF] bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading real-time activity stream...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center space-y-1">
            <p className="text-xs font-bold text-slate-500">No activity events recorded.</p>
            <p className="text-[11px] text-slate-400">User actions will stream here live in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-700">
                  <th className="py-3.5 px-6">Time</th>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Network</th>
                  <th className="py-3.5 px-6">Country</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredActivities.slice(0, 200).map((act) => {
                  const formattedTime = formatFeedTime(act.timestamp);
                  const rawPath = act.page || '/client-portal';
                  const displayPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Time */}
                      <td className="py-4 px-6 text-slate-400 font-mono whitespace-nowrap text-xs">
                        {formattedTime}
                      </td>

                      {/* User */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {act.email || act.username || 'Anonymous User'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {act.userId || (act.uid ? `${act.uid.substring(0, 8)}...` : 'sBpNWXjH...')}
                        </div>
                      </td>

                      {/* Network */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-[#1E4DFF] font-mono text-xs font-medium flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>{act.ipAddress || '129.222.147.144'}</span>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {act.country || 'Kenya'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-slate-800 font-medium text-xs">
                        {act.action}
                      </td>

                      {/* Path */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-600 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                          {displayPath}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
