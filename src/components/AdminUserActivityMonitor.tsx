import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Users, 
  Globe, 
  Laptop, 
  Clock, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ArrowUpRight, 
  ChevronRight, 
  X,
  Copy,
  Check,
  MousePointer,
  LogIn,
  LogOut,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Smartphone,
  Download
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserSession, UserActivity } from '../types';

interface AdminUserActivityMonitorProps {
  userEmail?: string;
}

export default function AdminUserActivityMonitor({ userEmail }: AdminUserActivityMonitorProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);
  
  // Selected user for Slide-over detail view
  const [inspectUser, setInspectUser] = useState<UserSession | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      // Sort activities by timestamp desc
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setActivities(list);
    }, (err) => {
      console.warn("User activities subscription error:", err);
    });

    return () => unsub();
  }, []);

  // Helper: Determine if user is currently Online (< 5 mins since last active)
  const isUserOnline = (lastActiveIso: string): boolean => {
    if (!lastActiveIso) return false;
    const diffMs = Date.now() - new Date(lastActiveIso).getTime();
    return diffMs < 5 * 60 * 1000; // 5 minutes
  };

  // Helper: Format relative timestamp
  const formatTimeAgo = (isoString: string): string => {
    if (!isoString) return 'Never';
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filtered User Sessions List
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = 
        !searchQuery ||
        (s.userId && s.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.username && s.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.ipAddress && s.ipAddress.includes(searchQuery)) ||
        (s.country && s.country.toLowerCase().includes(searchQuery.toLowerCase()));

      const online = isUserOnline(s.lastActive);
      if (statusFilter === 'online' && !online) return false;
      if (statusFilter === 'offline' && online) return false;

      return matchesSearch;
    });
  }, [sessions, searchQuery, statusFilter]);

  // Filtered Activities List
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedUserFilter && act.userId !== selectedUserFilter && act.email !== selectedUserFilter) {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (act.userId && act.userId.toLowerCase().includes(q)) ||
        (act.username && act.username.toLowerCase().includes(q)) ||
        (act.email && act.email.toLowerCase().includes(q)) ||
        (act.action && act.action.toLowerCase().includes(q)) ||
        (act.page && act.page.toLowerCase().includes(q)) ||
        (act.ipAddress && act.ipAddress.includes(q))
      );
    });
  }, [activities, searchQuery, selectedUserFilter]);

  // Handle Copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action Badge Color Helper
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created account') || act.includes('register')) {
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Users };
    }
    if (act.includes('logged in') || act.includes('login')) {
      return { bg: 'bg-blue-50 text-[#1E4DFF] border-blue-200', icon: LogIn };
    }
    if (act.includes('logged out')) {
      return { bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: LogOut };
    }
    if (act.includes('payment') || act.includes('deposit')) {
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: CreditCard };
    }
    if (act.includes('check') || act.includes('device')) {
      return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Smartphone };
    }
    if (act.includes('chat') || act.includes('support')) {
      return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: MessageSquare };
    }
    if (act.includes('firmware') || act.includes('download')) {
      return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Download };
    }
    if (act.includes('order')) {
      return { bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: ShoppingBag };
    }
    return { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: MousePointer };
  };

  // Metrics
  const totalSessionsCount = sessions.length;
  const onlineCount = sessions.filter(s => isUserOnline(s.lastActive)).length;
  const totalActivitiesCount = activities.length;

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#1E4DFF] border border-blue-100">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              User Activity Monitor
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-10">
            Monitor real-time user sessions, geographic locations, active pages, and security events across the platform.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSelectedUserFilter(null);
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered / Active Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tracked Users</span>
            <Users className="w-4 h-4 text-[#1E4DFF]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalSessionsCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Registered user profiles</div>
        </div>

        {/* Online Now */}
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Currently Online</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{onlineCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium">Active in last 5 minutes</div>
        </div>

        {/* Total Activity Logs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Events Recorded</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalActivitiesCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Recorded user actions</div>
        </div>

        {/* Selected User Filter Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Stream Filter</span>
            <Filter className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-800 truncate font-mono">
            {selectedUserFilter || 'All Users Stream'}
          </div>
          {selectedUserFilter && (
            <button
              onClick={() => setSelectedUserFilter(null)}
              className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
            >
              ✕ Clear Filter
            </button>
          )}
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search User ID, username, email, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 bg-slate-50/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Online Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Users ({sessions.length})
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'online' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🟢 Online ({onlineCount})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial ${
              statusFilter === 'offline' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚪ Offline ({sessions.length - onlineCount})
          </button>
        </div>

      </div>

      {/* Main Section 1: Active Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1E4DFF]" />
            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Active User Accounts & Session Status
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredSessions.length} users
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading active user sessions from Firestore...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No matching users found.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">User ID</th>
                  <th className="px-5 py-3.5">User Profile</th>
                  <th className="px-5 py-3.5">Country</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Device / Browser</th>
                  <th className="px-5 py-3.5">Current Page</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredSessions.map((session) => {
                  const online = isUserOnline(session.lastActive);
                  const isSelectedForFilter = selectedUserFilter === session.userId;

                  return (
                    <tr 
                      key={session.uid}
                      className={`hover:bg-blue-50/20 transition-colors ${isSelectedForFilter ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Online / Offline Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {online ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Offline
                          </span>
                        )}
                      </td>

                      {/* User ID */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#1E4DFF] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                            {session.userId || `USR-${session.uid.substring(0,8).toUpperCase()}`}
                          </span>
                          <button
                            onClick={() => handleCopyId(session.userId || session.uid)}
                            title="Copy User ID"
                            className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            {copiedId === (session.userId || session.uid) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* User Profile */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-bold text-slate-900">{session.username || 'User'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{session.email}</div>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{session.country || 'United States'}</span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {session.ipAddress || '198.51.100.42'}
                      </td>

                      {/* Device / Browser */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{session.deviceBrowser || 'Chrome / macOS'}</span>
                        </div>
                      </td>

                      {/* Current Page */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200">
                          {session.currentPage || 'Homepage'}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                        {formatTimeAgo(session.lastActive)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (selectedUserFilter === session.userId) {
                                setSelectedUserFilter(null);
                              } else {
                                setSelectedUserFilter(session.userId);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              isSelectedForFilter 
                                ? 'bg-[#1E4DFF] text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isSelectedForFilter ? 'Filter Active' : 'Filter Feed'}
                          </button>

                          <button
                            onClick={() => setInspectUser(session)}
                            className="p-1.5 bg-slate-100 hover:bg-[#1E4DFF] hover:text-white rounded-lg text-slate-500 transition cursor-pointer"
                            title="Inspect User Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Main Section 2: Real-time Live Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Live Real-Time Activity Feed Log
            </h2>
            {selectedUserFilter && (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Filtered: {selectedUserFilter}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Recorded Events: {filteredActivities.length}
          </span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No activity events recorded yet.</p>
            <p className="text-[11px] text-slate-400">User interactions like logins, checks, deposits, and navigation will stream here live.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">User ID</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Action Performed</th>
                  <th className="px-5 py-3.5">Page</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Country</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredActivities.slice(0, 50).map((act) => {
                  const badge = getActionBadge(act.action);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatTimeAgo(act.timestamp)}
                        <span className="block text-[9px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                      {/* User ID */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono">
                        <span className="font-extrabold text-[#1E4DFF] text-[11px]">
                          {act.userId || 'USR-ANON'}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{act.username || 'User'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{act.email}</div>
                      </td>

                      {/* Action Performed */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${badge.bg}`}>
                          <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                          {act.action}
                        </span>
                      </td>

                      {/* Page */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {act.page || 'Homepage'}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {act.ipAddress || '198.51.100.42'}
                      </td>

                      {/* Country */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-600">
                        {act.country || 'United States'}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                        {act.details || '-'}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Inspect User Slide-over Modal Drawer */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-slate-200">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold font-mono text-[#1E4DFF] uppercase tracking-wider block">
                    User Session Profile
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {inspectUser.username}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectUser(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                <span className="text-xs font-bold text-slate-500">Session Status</span>
                {isUserOnline(inspectUser.lastActive) ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Online Now
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                    Offline
                  </span>
                )}
              </div>

              {/* User Data Fields */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">User ID:</span>
                  <span className="font-mono font-black text-[#1E4DFF]">
                    {inspectUser.userId || `USR-${inspectUser.uid.substring(0,8).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Email:</span>
                  <span className="font-mono text-slate-800 font-bold">{inspectUser.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Country:</span>
                  <span className="font-bold text-slate-800">{inspectUser.country || 'United States'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">IP Address:</span>
                  <span className="font-mono text-slate-800">{inspectUser.ipAddress || '198.51.100.42'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Device / Browser:</span>
                  <span className="text-slate-800 font-bold">{inspectUser.deviceBrowser || 'Chrome / macOS'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Current Page:</span>
                  <span className="font-bold text-slate-800">{inspectUser.currentPage || 'Homepage'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Last Active:</span>
                  <span className="font-mono text-slate-600">{formatTimeAgo(inspectUser.lastActive)}</span>
                </div>
              </div>

              {/* User History Action */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedUserFilter(inspectUser.userId);
                    setInspectUser(null);
                  }}
                  className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Filter className="w-4 h-4" /> Filter Live Activity Feed For This User
                </button>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => setInspectUser(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
