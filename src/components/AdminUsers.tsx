import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Clock, 
  Smartphone, 
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  DollarSign,
  TrendingUp,
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

  // Firestore-synced states for Deposits and Users
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [amountsToCredit, setAmountsToCredit] = useState<Record<string, string>>({});
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<Record<string, boolean>>({});

  // States for manual balance editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [manualBalanceInput, setManualBalanceInput] = useState<string>('');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState<boolean>(false);

  // 1. Listen to banned users
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

  // 2. Listen to users collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDbUsers(list);
    }, (err) => {
      console.warn("Firestore users collection read blocked", err);
    });
    return () => unsub();
  }, []);

  // 3. Listen to deposits collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deposits'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      // Filter only pending deposits
      setPendingDeposits(list.filter((d) => d.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (err) => {
      console.warn("Firestore deposits read blocked", err);
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

  const handleApproveDeposit = async (dep: any) => {
    const creditAmountStr = amountsToCredit[dep.id] || '19.00';
    const creditAmount = parseFloat(creditAmountStr);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      alert("Please enter a valid credit amount.");
      return;
    }

    setIsProcessingDeposit(prev => ({ ...prev, [dep.id]: true }));
    try {
      // 1. Update deposit status to approved
      const depositRef = doc(db, 'deposits', dep.id);
      await setDoc(depositRef, { ...dep, status: 'approved' });

      // 2. Update user balance
      const userRef = doc(db, 'users', dep.userId);
      const matchingUser = dbUsers.find((u) => u.id === dep.userId);
      const currentBalance = matchingUser?.balance ?? 0;
      const newBalance = currentBalance + creditAmount;

      await setDoc(userRef, {
        id: dep.userId,
        email: dep.email,
        balance: newBalance,
        username: matchingUser?.username || dep.email.split('@')[0],
        registrationDate: matchingUser?.registrationDate || new Date().toISOString(),
        role: matchingUser?.role || 'Customer',
        status: matchingUser?.status || 'Active'
      }, { merge: true });

      // 3. Create Notification for user
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'TrendingUp',
        title: 'Deposit Approved',
        description: `Your deposit request of ${creditAmount.toFixed(2)} USDT has been verified and credited.`,
        time: new Date().toISOString(),
        read: false,
        type: 'payment',
        userId: dep.userId
      });

      // 4. Create Activity Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Deposit Approved',
        details: `Credited ${creditAmount.toFixed(2)} USDT to ${dep.email} (TxID: ${dep.transactionId.substring(0, 12)}...)`,
        user: 'Administrator',
        time: new Date().toISOString(),
        type: 'success'
      });

    } catch (err) {
      console.error("Error approving deposit:", err);
    } finally {
      setIsProcessingDeposit(prev => ({ ...prev, [dep.id]: false }));
    }
  };

  const handleRejectDeposit = async (dep: any) => {
    setIsProcessingDeposit(prev => ({ ...prev, [dep.id]: true }));
    try {
      // 1. Update deposit status to rejected
      const depositRef = doc(db, 'deposits', dep.id);
      await setDoc(depositRef, { ...dep, status: 'rejected' });

      // 2. Create Notification for user
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'AlertCircle',
        title: 'Deposit Rejected',
        description: `Your deposit request with TxID ${dep.transactionId.substring(0, 10)}... was rejected. Please contact support.`,
        time: new Date().toISOString(),
        read: false,
        type: 'payment',
        userId: dep.userId
      });

      // 3. Create Activity Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Deposit Rejected',
        details: `Rejected deposit from ${dep.email} (TxID: ${dep.transactionId.substring(0, 12)}...)`,
        user: 'Administrator',
        time: new Date().toISOString(),
        type: 'warning'
      });

    } catch (err) {
      console.error("Error rejecting deposit:", err);
    } finally {
      setIsProcessingDeposit(prev => ({ ...prev, [dep.id]: false }));
    }
  };

  const handleSaveManualBalance = async (user: any) => {
    const parsed = parseFloat(manualBalanceInput);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid balance amount (>= 0).");
      return;
    }

    setIsUpdatingBalance(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, { balance: parsed }, { merge: true });

      // Create Activity Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Balance Adjusted',
        details: `Manually set balance of ${user.email} to ${parsed.toFixed(2)} USDT`,
        user: 'Administrator',
        time: new Date().toISOString(),
        type: 'info'
      });

      setEditingUserId(null);
    } catch (err) {
      console.error("Error adjusting balance:", err);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  // Derive unique users list from database + orders + checks + templates
  const compiledUsers = React.useMemo(() => {
    const usersMap: Record<string, {
      email: string;
      orderCount: number;
      checksCount: number;
      totalSpent: number;
      lastActive: string;
      id: string;
      username?: string;
      balance?: number;
      country?: string;
      accountType?: string;
    }> = {};

    // 1. Populate with actual Firestore registered users
    dbUsers.forEach((u) => {
      if (!u.email) return;
      const key = u.email.toLowerCase();
      usersMap[key] = {
        id: u.id,
        email: u.email,
        username: u.username || u.displayName || key.split('@')[0],
        balance: u.balance ?? 0,
        country: u.country || 'United States',
        accountType: u.accountType || 'Personal User',
        orderCount: 0,
        checksCount: 0,
        totalSpent: 0,
        lastActive: u.registrationDate || '',
      };
    });

    // 2. Overlay metrics from orders
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
          balance: 0,
          username: o.email.split('@')[0],
          country: 'N/A',
          accountType: 'Personal User'
        };
      } else {
        usersMap[key].orderCount += 1;
        usersMap[key].totalSpent += spent;
        if (o.createdAt > usersMap[key].lastActive) {
          usersMap[key].lastActive = o.createdAt;
        }
      }
    });

    // 3. Overlay metrics from checks
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
          balance: 0,
          username: c.username || c.email.split('@')[0],
          country: 'N/A',
          accountType: 'Personal User'
        };
      } else {
        usersMap[key].checksCount += 1;
        if (c.submittedAt > usersMap[key].lastActive) {
          usersMap[key].lastActive = c.submittedAt;
        }
      }
    });

    // Fallback static users for professional simulation representation
    const defaults = [
      { email: 'customer_pro@gmail.com', orderCount: 2, checksCount: 5, totalSpent: 58.00, lastActive: '2026-07-16T12:00:00Z', id: 'd1', balance: 15.00 },
      { email: 'unlocker_expert@yahoo.com', orderCount: 4, checksCount: 12, totalSpent: 116.00, lastActive: '2026-07-17T09:12:00Z', id: 'd2', balance: 0.00 },
      { email: 'reseller_asia_gsm@gmail.com', orderCount: 15, checksCount: 48, totalSpent: 435.00, lastActive: '2026-07-17T11:45:00Z', id: 'd3', balance: 250.00 },
    ];

    defaults.forEach((def) => {
      const key = def.email.toLowerCase();
      if (!usersMap[key]) {
        usersMap[key] = {
          ...def,
          username: def.email.split('@')[0],
          country: 'United States',
          accountType: 'Personal User'
        };
      }
    });

    return Object.values(usersMap);
  }, [dbUsers, orders, deviceChecks]);

  const filteredUsers = React.useMemo(() => {
    return compiledUsers.filter((u) => {
      return u.email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [compiledUsers, searchQuery]);

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* 1. PENDING DEPOSITS VERIFICATION ROW */}
      {pendingDeposits.length > 0 && (
        <div className="bg-white rounded-[24px] border border-amber-200/60 shadow-md shadow-amber-500/5 overflow-hidden text-left animate-in slide-in-from-top-3 duration-300">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Pending USDT Deposits Verification ({pendingDeposits.length})
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">Action Required</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {pendingDeposits.map((dep) => {
              const amountInput = amountsToCredit[dep.id] ?? '19.00';
              const isProcessing = isProcessingDeposit[dep.id] || false;

              return (
                <div key={dep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50/20 transition">
                  <div className="space-y-1 md:max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{dep.email}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">BEP20</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono leading-tight">
                      TxID: <span className="select-all font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{dep.transactionId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Submitted at: {new Date(dep.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {/* Input Amount to credit */}
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 font-bold text-slate-400 text-[11px]">USDT</span>
                      <input
                        type="number"
                        disabled={isProcessing}
                        value={amountInput}
                        onChange={(e) => setAmountsToCredit(prev => ({ ...prev, [dep.id]: e.target.value }))}
                        placeholder="19.00"
                        className="w-24 pl-11 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
                      />
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproveDeposit(dep)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 border border-emerald-700 shadow-sm"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </>
                      )}
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleRejectDeposit(dep)}
                      className="bg-white hover:bg-red-50 text-red-600 font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 border border-slate-200 hover:border-red-200"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          TOTAL REGISTERED USERS: <span className="text-[#1E4DFF] font-black">{compiledUsers.length}</span>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="px-5 py-4 border-b border-slate-50">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Customer Profiles & Wallet Moderation ({filteredUsers.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="px-5 py-3">Member Details</th>
                <th className="px-5 py-3">USDT Wallet Balance</th>
                <th className="px-5 py-3">Device Checks</th>
                <th className="px-5 py-3">Completed Unlocks</th>
                <th className="px-5 py-3">USDT Contributed</th>
                <th className="px-5 py-3 text-right font-mono">Moderation Actions</th>
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
                  const isEditingBalance = editingUserId === user.id;
                  
                  return (
                    <tr key={user.email} className={`hover:bg-slate-50/50 transition duration-150 ${isBanned ? 'bg-red-50/10 text-red-900/60' : ''}`}>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {user.email}
                            {isBanned && (
                              <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider">
                                Banned
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Username: <span className="font-semibold text-slate-600">{user.username || 'N/A'}</span>
                            {user.country && ` • Country: ${user.country}`}
                          </div>
                        </div>
                      </td>

                      {/* USDT Wallet Balance editing column */}
                      <td className="px-5 py-4 font-extrabold text-slate-900">
                        {isEditingBalance ? (
                          <div className="flex items-center gap-1.5 animate-in zoom-in-95 duration-150">
                            <input
                              type="number"
                              disabled={isUpdatingBalance}
                              value={manualBalanceInput}
                              onChange={(e) => setManualBalanceInput(e.target.value)}
                              className="w-16 px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 font-bold focus:outline-none"
                            />
                            <button
                              disabled={isUpdatingBalance}
                              onClick={() => handleSaveManualBalance(user)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] transition cursor-pointer"
                            >
                              {isUpdatingBalance ? '...' : 'Save'}
                            </button>
                            <button
                              disabled={isUpdatingBalance}
                              onClick={() => setEditingUserId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded text-[10px] transition cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[#1E4DFF] font-black font-mono">
                              ${(user.balance ?? 0).toFixed(2)}
                            </span>
                            {/* Edit balance pencil icon button */}
                            {user.id && user.id !== user.email && (
                              <button
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setManualBalanceInput((user.balance ?? 0).toString());
                                }}
                                className="text-[9px] text-slate-400 hover:text-[#1E4DFF] border border-slate-100 hover:border-[#1E4DFF]/30 bg-slate-50 px-1.5 py-0.5 rounded transition cursor-pointer"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
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
