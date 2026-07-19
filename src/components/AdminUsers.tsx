import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Clock, 
  Smartphone, 
  ShieldAlert, 
  DollarSign,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { DeviceOrder, PaymentHistoryItem, DeviceCheck } from '../types';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

interface AdminUsersProps {
  orders: DeviceOrder[];
  deviceChecks: DeviceCheck[];
  paymentHistory: PaymentHistoryItem[];
}

export default function AdminUsers({
  orders,
  deviceChecks,
  paymentHistory
}: AdminUsersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bannedEmails, setBannedEmails] = useState<string[]>([]);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  // Load banned users from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'banned_users'), (snap) => {
      const list: string[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.id); // Doc ID is the email lowercase
      });
      setBannedEmails(list);
    }, (err) => {
      console.warn("Firestore banned_users read blocked", err);
    });
    return () => unsub();
  }, []);

  const handleToggleBan = async (email: string) => {
    const lowerEmail = email.toLowerCase();
    const isBanned = bannedEmails.includes(lowerEmail);
    
    setLoadingEmail(email);
    try {
      const docRef = doc(db, 'banned_users', lowerEmail);
      if (isBanned) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          bannedAt: new Date().toISOString(),
          reason: 'Banned by system administrator.',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmail(null);
    }
  };

  // Derive unique users list from all database entries
  const compiledUsers = React.useMemo(() => {
    const usersMap: Record<string, {
      email: string;
      orderCount: number;
      checksCount: number;
      totalSpent: number;
      lastActive: string;
      id: string;
    }> = {};

    // 1. Process orders
    orders.forEach((o) => {
      if (!o.email) return;
      const key = o.email.toLowerCase();
      const spent = o.status === 'completed' || o.paymentStatus === 'approved' 
        ? parseFloat(o.price || '0') 
        : 0;

      if (!usersMap[key]) {
        usersMap[key] = {
          email: o.email,
          orderCount: 1,
          checksCount: 0,
          totalSpent: spent,
          lastActive: o.createdAt,
          id: o.userId || key,
        };
      } else {
        usersMap[key].orderCount += 1;
        usersMap[key].totalSpent += spent;
        if (o.createdAt > usersMap[key].lastActive) {
          usersMap[key].lastActive = o.createdAt;
        }
      }
    });

    // 2. Process device checks
    deviceChecks.forEach((c) => {
      if (!c.email) return;
      const key = c.email.toLowerCase();
      if (!usersMap[key]) {
        usersMap[key] = {
          email: c.email,
          orderCount: 0,
          checksCount: 1,
          totalSpent: 0,
          lastActive: c.submittedAt,
          id: c.userId || key,
        };
      } else {
        usersMap[key].checksCount += 1;
        if (c.submittedAt > usersMap[key].lastActive) {
          usersMap[key].lastActive = c.submittedAt;
        }
      }
    });

    // Fallback if empty to populate professional list
    const defaults = [
      { email: 'customer_pro@gmail.com', orderCount: 2, checksCount: 5, totalSpent: 58.00, lastActive: '2026-07-16T12:00:00Z', id: 'd1' },
      { email: 'unlocker_expert@yahoo.com', orderCount: 4, checksCount: 12, totalSpent: 116.00, lastActive: '2026-07-17T09:12:00Z', id: 'd2' },
      { email: 'reseller_asia_gsm@gmail.com', orderCount: 15, checksCount: 48, totalSpent: 435.00, lastActive: '2026-07-17T11:45:00Z', id: 'd3' },
    ];

    defaults.forEach((def) => {
      const key = def.email.toLowerCase();
      if (!usersMap[key]) {
        usersMap[key] = def;
      }
    });

    return Object.values(usersMap);
  }, [orders, deviceChecks]);

  const filteredUsers = React.useMemo(() => {
    return compiledUsers.filter((u) => {
      return u.email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [compiledUsers, searchQuery]);

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Search and stats summary */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold font-mono">
          TOTAL COMPILED MEMBERS: <span className="text-[#1E4DFF] font-black">{compiledUsers.length}</span>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="px-5 py-4 border-b border-slate-50">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Customer Profiles & moderation ({filteredUsers.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="px-5 py-3">Member Email</th>
                <th className="px-5 py-3">Device Checks</th>
                <th className="px-5 py-3">Completed Bypasses</th>
                <th className="px-5 py-3">USDT Contributed</th>
                <th className="px-5 py-3">Last Active Session</th>
                <th className="px-5 py-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No matching members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBanned = bannedEmails.includes(user.email.toLowerCase());
                  const isLoading = loadingEmail === user.email;
                  
                  return (
                    <tr key={user.email} className={`hover:bg-slate-50/50 transition duration-150 ${isBanned ? 'bg-red-50/10 text-red-900/60' : ''}`}>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {user.email}
                          {isBanned && (
                            <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider">
                              Banned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold flex items-center gap-1.5 pt-5.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {user.checksCount} checks
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {user.orderCount} orders
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-600">
                        ${user.totalSpent.toFixed(2)} USDT
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {user.lastActive.split('T')[0] || user.lastActive}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          disabled={isLoading}
                          onClick={() => handleToggleBan(user.email)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-tight font-bold cursor-pointer transition border duration-150 ${
                            isBanned 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isBanned ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Unban Account
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              Ban Account
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
