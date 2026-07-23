import React, { useState } from 'react';
import { 
  Search, 
  Check, 
  X, 
  Eye, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { PaymentHistoryItem } from '../types';

interface AdminPaymentsProps {
  paymentHistory: PaymentHistoryItem[];
  onApprovePayment: (orderId: string) => Promise<void> | void;
  onRejectPayment: (orderId: string) => Promise<void> | void;
}

export default function AdminPayments({
  paymentHistory,
  onApprovePayment,
  onRejectPayment
}: AdminPaymentsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistoryItem | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredReceipts = React.useMemo(() => {
    return paymentHistory.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.orderId.toLowerCase().includes(q) ||
        p.imei.includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q)
      );
    });
  }, [paymentHistory, searchQuery]);

  const handleAction = async (receipt: PaymentHistoryItem, type: 'approve' | 'reject') => {
    setLoadingId(receipt.id);
    setActionType(type);
    try {
      if (type === 'approve') {
        await onApprovePayment(receipt.orderId);
      } else {
        await onRejectPayment(receipt.orderId);
      }
      // Update selected modal status
      setSelectedReceipt((prev) => prev && prev.id === receipt.id ? { ...prev, status: type === 'approve' ? 'approved' : 'rejected' } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXID hash, customer email, IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 font-mono hidden sm:block">
          LEDGER SYNCHRONIZER: <span className="text-emerald-500">CONNECTED</span>
        </div>
      </div>

      {/* Grid: List Left, Drawer Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Payments Table List */}
        <div className={`${selectedReceipt ? 'lg:col-span-6' : 'lg:col-span-12'} bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-50 bg-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Cryptocurrency Inflow Receipts ({filteredReceipts.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Reference Order</th>
                  <th className="px-4 py-3">USDT Fee</th>
                  <th className="px-4 py-3">Submitted At</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                      No cryptocurrency receipts found.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((pay) => (
                    <tr 
                      key={pay.id}
                      onClick={() => setSelectedReceipt(pay)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition duration-150 ${selectedReceipt?.id === pay.id ? 'bg-blue-50/50 text-[#1E4DFF]' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 truncate max-w-[140px]">{pay.customer}</div>
                        <div className="text-[10px] text-slate-400 font-mono">IMEI: {pay.imei}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">#{pay.orderId.substring(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 font-black flex items-center gap-1.5 pt-4">
                        <Coins className="w-3.5 h-3.5 text-emerald-500" />
                        {pay.amount}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[10px] font-mono">
                        {pay.date.split('T')[0] || pay.date}
                      </td>
                      <td className="px-4 py-3.5">
                        {pay.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                            Pending
                          </span>
                        )}
                        {pay.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Approved
                          </span>
                        )}
                        {pay.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 border border-red-100">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Receipt Details Console */}
        {selectedReceipt && (
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest block">USDT TRANSACTION RECEIPT</span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Receipt Ref: #{selectedReceipt.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Stats Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-400 font-bold block">USDT Ledger Amount</span>
                  <span className="text-emerald-600 font-black text-base flex items-center gap-1 mt-0.5">
                    <Coins className="w-4.5 h-4.5" />
                    {selectedReceipt.amount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">FMI Order Link</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono text-[11px]">#{selectedReceipt.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">IMEI / Serial</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono">{selectedReceipt.imei}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">ECID Reference</span>
                  <span className="text-slate-800 font-bold block mt-1 font-mono">{selectedReceipt.ecid}</span>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block mb-1">USDT (TRC20) Blockchain TXID Hash</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono bg-white border border-slate-150 px-2.5 py-1.5 rounded-lg font-bold text-slate-700 block select-all break-all flex-1 text-left">
                    {selectedReceipt.transactionId}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedReceipt.id, selectedReceipt.transactionId)}
                    className="p-1.5 rounded-lg bg-white border border-slate-150 text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                    title="Copy Hash"
                  >
                    {copiedId === selectedReceipt.id ? 'Copied' : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`https://tronscan.org/#/transaction/${selectedReceipt.transactionId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-150 text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                    title="Audit on TronScan Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Action Row */}
            {selectedReceipt.status === 'pending' ? (
              <div className="space-y-2 text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">LEDGER DECISION CONTROL</span>
                <div className="flex gap-2">
                  <button
                    disabled={loadingId !== null}
                    onClick={() => handleAction(selectedReceipt, 'reject')}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loadingId === selectedReceipt.id && actionType === 'reject' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject & Notify
                  </button>
                  
                  <button
                    disabled={loadingId !== null}
                    onClick={() => handleAction(selectedReceipt, 'approve')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    {loadingId === selectedReceipt.id && actionType === 'approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 font-black" />
                    )}
                    Approve Ledger Hash
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono text-center">Approving payment automatically moves the unlock order state from 'Verifying' to 'Processing' with progress 5%.</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                {selectedReceipt.status === 'approved' ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <span className="text-xs font-bold text-slate-800 block">Ledger Verification Passed</span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This transaction has been permanently reconciled into database ledgers. Active queue unlocked.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <span className="text-xs font-bold text-slate-800 block">Ledger Verification Failed</span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This receipt has been marked invalid or double-spend detected. Customer notified.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
