import React, { useState, useEffect } from 'react';
import { 
  User, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Search, 
  Calendar, 
  ShieldAlert,
  CreditCard,
  Copy,
  Check,
  Loader2,
  LifeBuoy,
  X,
  ArrowUpRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { DeviceOrder } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { trackUserActivity, isAdminEmail } from '../utils/activityTracker';

interface MyAccountPageProps {
  orders: DeviceOrder[];
  onSelectOrder: (order: DeviceOrder) => void;
  userEmail: string;
  profileData?: {
    id: string;
    username: string;
    email: string;
    country: string;
    accountType: string;
    deviceOwnership: string;
    registrationDate: string;
    role: string;
    status: string;
    balance?: number;
  } | null;
}

export default function MyAccountPage({
  orders,
  onSelectOrder,
  userEmail,
  profileData,
}: MyAccountPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [txIdInput, setTxIdInput] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  const adminWallet = '0x5Dd3d764DC0d2C862F3B042C95B0e192A29be4C9';

  // Real-time listener for current user's pending deposits
  useEffect(() => {
    if (!profileData?.id) return;
    
    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', profileData.id),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      setPendingDeposits(list);
    }, (err) => {
      console.warn("MyAccountPage deposits subscription blocked:", err);
    });

    return () => unsub();
  }, [profileData?.id]);

  const filteredOrders = orders.filter(
    (o) =>
      o.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ecid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (order: DeviceOrder) => {
    if (order.status === 'ready_activation' || order.processingStage === 'Ready for Activation') {
      return (
        <span className="bg-green-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit shadow-sm shadow-green-600/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" /> Ready for Activation
        </span>
      );
    }
    if (order.status === 'completed' || order.processingStage === 'Completed') {
      return (
        <span className="bg-green-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit shadow-sm shadow-green-600/20">
          <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" /> Completed
        </span>
      );
    }
    switch (order.status) {
      case 'checked':
        return (
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Checked (Eligible)
          </span>
        );
      case 'pending_review':
        return (
          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Pending Review
          </span>
        );
      case 'waiting_payment':
        return (
          <span className="bg-blue-50 text-[#1E4DFF] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3 text-[#1E4DFF]" /> Waiting for Payment
          </span>
        );
      case 'verifying_payment':
        return (
          <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-purple-500 animate-spin" /> Verifying Payment
          </span>
        );
      case 'processing':
        return (
          <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-sky-500 animate-spin" /> Processing Unlock
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(adminWallet);
    setCopiedAddress(true);
    setShowCopyToast(true);
    setTimeout(() => setCopiedAddress(false), 2500);
    setTimeout(() => setShowCopyToast(false), 3500);

    if (userEmail && !isAdminEmail(userEmail)) {
      trackUserActivity({
        uid: profileData?.id || userEmail,
        userId: profileData?.id ? `USR-${profileData.id.substring(0, 8).toUpperCase()}` : 'USR-ACCOUNT',
        username: profileData?.username || userEmail.split('@')[0],
        email: userEmail,
        action: 'Clicked Copy Wallet Address',
        page: 'My Account / Deposit',
        details: `Copied deposit address: ${adminWallet}`,
      });
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txIdInput.trim() || !profileData?.id) return;

    setIsSubmittingDeposit(true);
    try {
      const depositId = 'dep_' + Math.random().toString(36).substring(2, 15);
      const depositDocRef = doc(db, 'deposits', depositId);
      
      const depositData = {
        id: depositId,
        userId: profileData.id,
        email: profileData.email || userEmail,
        transactionId: txIdInput.trim(),
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      await setDoc(depositDocRef, depositData);

      // Create Admin Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        icon: 'TrendingUp',
        title: 'New Deposit Submitted',
        description: `User ${profileData.email || userEmail} submitted TxID ${txIdInput.trim()} for verification.`,
        time: new Date().toISOString(),
        read: false,
        type: 'payment',
        userId: 'admin'
      });

      // Create System Activity Log
      const logId = 'log_' + Math.random().toString(36).substring(2, 15);
      await setDoc(doc(db, 'logs', logId), {
        id: logId,
        action: 'Deposit Request',
        details: `TxID: ${txIdInput.trim()} submitted by ${profileData.email || userEmail}`,
        user: profileData.email || userEmail,
        time: new Date().toISOString(),
        type: 'info'
      });

      setTxIdInput('');
      setIsDepositModalOpen(false);
    } catch (err) {
      console.error('Error submitting deposit:', err);
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdrawClick = () => {
    const balance = profileData?.balance || 0;
    if (balance === 0) {
      setWithdrawError("Insufficient balance. Please deposit funds before requesting a withdrawal.");
      setTimeout(() => setWithdrawError(null), 6000);
    } else {
      setIsWithdrawModalOpen(true);
    }
  };

  const userBalance = profileData?.balance ?? 0;
  const hasPendingDeposit = pendingDeposits.length > 0;

  return (
    <div id="my-account-page" className="py-8 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 font-sans text-left">
      
      {/* Profile Overview Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4DFF]">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-0.5 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {profileData?.username ? `${profileData.username}'s Account` : 'My Account'}
            </h3>
            <p className="text-slate-500 text-xs">
              Registered Email: <span className="font-semibold text-slate-700">{userEmail}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Orders</span>
            <span className="text-base font-black text-slate-800">{orders.length}</span>
          </div>
          <div className="bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100/30 text-center">
            <span className="text-[#1E4DFF] block text-[10px] uppercase font-bold">Active Orders</span>
            <span className="text-base font-black text-[#1E4DFF]">
              {orders.filter((o) => o.status !== 'completed' && o.status !== 'checked').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Single Page Grid: Wallet + Profile Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Grid Panel: Wallet (USDT) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[24px] p-6 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            
            {/* Background design accents */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-10 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Secure Wallet</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-wider">
                USDT (BEP20)
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] font-medium block">Current Balance</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {userBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">USDT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                Deposit
              </button>
              <button
                onClick={handleWithdrawClick}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer border border-slate-700"
              >
                Withdraw
              </button>
            </div>

            {/* Withdraw error message box */}
            {withdrawError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-200 leading-normal animate-in slide-in-from-top-1">
                {withdrawError}
              </div>
            )}

            {/* Pending deposit verification badge */}
            {hasPendingDeposit && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2 text-[11px] text-amber-300 font-semibold animate-pulse">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Deposit Pending Verification</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100 text-xs text-slate-500 space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              How Wallet Funding Works
            </h5>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
              <li>Click <strong>Deposit</strong> to copy our USDT (BEP20) address.</li>
              <li>Send the desired USDT amount via your blockchain wallet.</li>
              <li>Input the 64-character Transaction Hash (TxID) to submit.</li>
              <li>Our team verifies and credits your account balance.</li>
            </ol>
          </div>
        </div>

        {/* Right Grid Panel: Profile Information */}
        <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-bold text-slate-900">Profile Information</h4>
            <p className="text-slate-400 text-xs">Verify your registered account details and partner status metadata.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <span className="text-slate-400 font-semibold block">Username</span>
              <span className="font-bold text-slate-800 text-sm">{profileData?.username || 'N/A'}</span>
            </div>

            <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <span className="text-slate-400 font-semibold block">Email Address</span>
              <span className="font-bold text-slate-800 text-sm select-all">{profileData?.email || userEmail}</span>
            </div>

            <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <span className="text-slate-400 font-semibold block">Account Type</span>
              <span className="bg-blue-50 text-[#1E4DFF] px-2 py-0.5 rounded text-[11px] font-bold w-fit block border border-blue-100/30">
                {profileData?.accountType || 'Personal User'}
              </span>
            </div>

            <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <span className="text-slate-400 font-semibold block">Registration Date</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatDate(profileData?.registrationDate)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-500 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700">Enterprise Node Security Enforced</span>
              <p className="text-[11px] leading-relaxed">
                Wallet operations, profile changes, and order processing are secured under custom cryptographic hash chains. 
                Please contact support if you require changes to your registered account details.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Device Orders History Table Section */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Title Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-slate-900">My Device Orders</h4>
            <p className="text-slate-500 text-xs">Monitor status updates, invoices, and custom firmware download links.</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders by IMEI or ECID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20"
            />
          </div>
        </div>

        {/* Content Table */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto space-y-3">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-700">No Orders Found</h5>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'No results match your search parameters.' : 'You have not registered any device compatibility check orders yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="p-4">Device Details</th>
                  <th className="p-4">iOS / ECID</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">USDT Cost</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800">IMEI/SN:</span>
                        <span className="font-mono text-slate-600 block bg-slate-50 px-1.5 py-0.5 rounded w-fit text-[11px] border border-slate-100">
                          {order.imei}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="text-slate-500">
                          ECID: <span className="font-mono text-slate-700 font-medium">{order.ecid}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">iOS Version: v{order.iosVersion}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">{order.createdAt.split('T')[0] || order.createdAt}</td>
                    <td className="p-4">{getStatusBadge(order)}</td>
                    <td className="p-4 font-bold text-slate-800">{order.price || 'Pending review'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 bg-blue-50 hover:bg-[#1E4DFF] text-[#1E4DFF] hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DEPOSIT MODAL --- */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1E4DFF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">Submit USDT Deposit</h3>
              </div>
              <button
                disabled={isSubmittingDeposit}
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="p-6 space-y-5 text-xs text-slate-700 text-left">
              <div className="bg-blue-50 border border-blue-100/50 rounded-xl p-3.5 text-[11px] leading-relaxed text-[#1E4DFF]">
                Send USDT to the BEP20 address below, then enter your blockchain transaction hash (TxID) to submit for approval.
              </div>

              {/* Wallet Address */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">USDT BEP20 Wallet Address</span>
                <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 flex items-center justify-between gap-2 border border-slate-800 font-mono">
                  <span className="break-all select-all font-semibold text-[11px] leading-tight pr-1">
                    {adminWallet}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition shrink-0 cursor-pointer"
                  >
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedAddress && (
                  <span className="text-[10px] text-emerald-600 font-semibold block text-right">
                    ✓ Address Copied to Clipboard!
                  </span>
                )}
              </div>

              {/* Transaction ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Transaction Hash (TxID)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter 64-character transaction hash..."
                  value={txIdInput}
                  onChange={(e) => setTxIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs px-4 py-3 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingDeposit || !txIdInput.trim()}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                {isSubmittingDeposit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Deposit...
                  </>
                ) : (
                  'Submit Deposit'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- WITHDRAW CONTACT SUPPORT MODAL --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[#1E4DFF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono font-bold">Contact Support</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700 text-left">
              <p className="leading-relaxed">
                To complete your withdrawal of <strong className="text-slate-900 font-mono font-bold">{userBalance.toFixed(2)} USDT</strong>, please contact our administrative support node directly.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono space-y-2 text-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span>Support Node Email:</span>
                  <span className="font-bold text-slate-900">iunlockapple1427@gmail.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Authorized Server:</span>
                  <span className="font-bold text-emerald-600">Enterprise Node S3-Unlocks</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal">
                Please provide your Username and requested BEP20 withdrawal address. Our support team will process and dispatch your funds manually within 24 hours.
              </p>

              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pop-Up Notification Toast for Copy Action */}
      {showCopyToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3.5 min-w-[280px]">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-xs sm:text-sm">Address Copied!</p>
              <p className="text-[11px] text-slate-300 font-normal">Address has been copied to clipboard.</p>
            </div>
            <button 
              onClick={() => setShowCopyToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
