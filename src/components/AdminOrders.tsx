import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  Sliders, 
  Clock, 
  TrendingUp, 
  Save, 
  Loader2,
  Smartphone,
  Cpu,
  RefreshCw,
  Unlock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DeviceOrder } from '../types';

interface AdminOrdersProps {
  orders: DeviceOrder[];
  onUpdateOrder: (order: DeviceOrder) => Promise<void> | void;
  onDeleteOrder: (orderId: string) => Promise<void> | void;
  onDeleteAllOrders?: () => Promise<void> | void;
}

export default function AdminOrders({
  orders,
  onUpdateOrder,
  onDeleteOrder,
  onDeleteAllOrders
}: AdminOrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<DeviceOrder | null>(null);
  
  // Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [editStage, setEditStage] = useState<DeviceOrder['processingStage']>('Preparing Registration');
  const [editStatus, setEditStatus] = useState<DeviceOrder['status']>('pending_review');
  const [editTxId, setEditTxId] = useState('');
  const [editImei, setEditImei] = useState('');
  const [editEcid, setEditEcid] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered orders list
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        o.id.toLowerCase().includes(query) ||
        o.imei.includes(query) ||
        o.ecid.toLowerCase().includes(query) ||
        (o.email && o.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return o.status === statusFilter;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleSelectOrder = (order: DeviceOrder) => {
    setSelectedOrder(order);
    setIsEditing(false);
    setEditPrice(order.price || '29.00');
    setEditProgress(order.processingProgress || 0);
    setEditStage(order.processingStage === 'Finalizing' ? 'Ready for Activation' : (order.processingStage || 'Preparing Registration'));
    setEditStatus(order.status);
    setEditTxId(order.transactionId || '');
    setEditImei(order.imei || '');
    setEditEcid(order.ecid || '');
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const updated: DeviceOrder = {
        ...selectedOrder,
        price: editPrice,
        processingProgress: Number(editProgress),
        processingStage: editStage,
        status: editStatus,
        transactionId: editTxId,
        imei: editImei,
        ecid: editEcid,
      };
      await onUpdateOrder(updated);
      setSelectedOrder(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update order", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirmDeleteId !== orderId) {
      setConfirmDeleteId(orderId);
      return;
    }
    try {
      await onDeleteOrder(orderId);
      setSelectedOrder(null);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, imei, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold w-full sm:w-auto shrink-0 justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="pending_review">Pending Review</option>
            <option value="waiting_payment">Waiting Payment</option>
            <option value="verifying_payment">Verifying Payment</option>
            <option value="processing">Processing</option>
            <option value="ready_activation">Ready For Activation</option>
            <option value="completed">Completed</option>
          </select>

          {orders.length > 0 && onDeleteAllOrders && (
            confirmDeleteAll ? (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                  onClick={async () => {
                    await onDeleteAllOrders();
                    setSelectedOrder(null);
                    setConfirmDeleteAll(false);
                  }}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete ALL?</span>
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-xs font-bold transition border border-red-200 cursor-pointer shadow-sm"
                title="Delete all unlock orders"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Orders</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Grid: List left, editor right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Orders Table */}
        <div className={`${selectedOrder ? 'lg:col-span-6' : 'lg:col-span-12'} bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Unlock Activity Ledger ({filteredOrders.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">IMEI / ECID</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr 
                      key={o.id}
                      onClick={() => handleSelectOrder(o)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition duration-150 ${selectedOrder?.id === o.id ? 'bg-blue-50/50 text-[#1E4DFF]' : ''}`}
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-950">
                        #{o.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{o.email?.split('@')[0] || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{o.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>{o.imei}</div>
                        <div className="text-[10px] text-slate-400">ECID: {o.ecid}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ${o.price || '29.00'}
                      </td>
                      <td className="px-4 py-3.5">
                        {o.status === 'pending_review' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-amber-50 text-amber-600 border border-amber-100">Review</span>
                        )}
                        {o.status === 'waiting_payment' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-200">Unpaid</span>
                        )}
                        {o.status === 'verifying_payment' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-blue-50 text-blue-600 border border-blue-100 animate-pulse">Verifying</span>
                        )}
                        {o.status === 'processing' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                            Processing ({o.processingProgress}%)
                          </span>
                        )}
                        {o.status === 'ready_activation' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Ready</span>
                        )}
                        {o.status === 'completed' && (
                          <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/10">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Order Detail Editor */}
        {selectedOrder && (
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-widest block">ORDER WORKFLOW CONTROLLER</span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Order ID: {selectedOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Readonly details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl text-left border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase block">Customer Details</span>
                <span className="text-xs font-bold text-slate-800 block truncate">{selectedOrder.email}</span>
                <span className="text-[10px] text-slate-400 block truncate">User ID: {selectedOrder.userId || 'Guest'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-left border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase block">System Registered</span>
                <span className="text-xs font-bold text-slate-800 block">{selectedOrder.createdAt.split('T')[0]}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{selectedOrder.createdAt.split('T')[1]?.substring(0, 5) || ''} UTC</span>
              </div>
            </div>

            {/* Interactive Forms */}
            <div className="space-y-4 text-left">
              {!isEditing ? (
                // View Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-slate-400 font-bold block">IMEI / Serial Number</span>
                      <span className="text-slate-800 font-bold font-mono text-[13px]">{selectedOrder.imei}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">ECID Identifier</span>
                      <span className="text-slate-800 font-bold font-mono text-[13px]">{selectedOrder.ecid}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Service Cost Price</span>
                      <span className="text-emerald-600 font-black text-sm">${selectedOrder.price || '29.00'} USDT</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Activation Status</span>
                      <span className="text-slate-800 font-bold capitalize">{selectedOrder.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {selectedOrder.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-400">Processing Stage:</span>
                        <span className="text-[#1E4DFF]">{selectedOrder.processingStage === 'Finalizing' ? 'Ready for Activation' : selectedOrder.processingStage}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#1E4DFF] h-full transition-all duration-300"
                          style={{ width: `${selectedOrder.processingProgress}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono">Progress: {selectedOrder.processingProgress}%</div>
                    </div>
                  )}

                  {selectedOrder.transactionId && (
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <span className="text-[9px] text-blue-500 font-mono font-bold block">SUBMITTED TRANSACTION TXID</span>
                      <span className="text-xs font-mono font-bold text-slate-800 break-all select-all">{selectedOrder.transactionId}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                      Configure Parameters
                    </button>
                    {confirmDeleteId === selectedOrder.id ? (
                      <button
                        onClick={() => handleDelete(selectedOrder.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        title="Click to confirm order deletion"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Confirm Delete?</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(selectedOrder.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 p-2.5 rounded-xl text-xs transition flex items-center justify-center cursor-pointer border border-red-200/50"
                        title="Delete Order Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">IMEI / SERIAL</label>
                      <input 
                        type="text" 
                        value={editImei} 
                        onChange={(e) => setEditImei(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">ECID</label>
                      <input 
                        type="text" 
                        value={editEcid} 
                        onChange={(e) => setEditEcid(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">SET PRICE ($)</label>
                      <input 
                        type="text" 
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">TXID / RECEIPT</label>
                      <input 
                        type="text" 
                        value={editTxId} 
                        onChange={(e) => setEditTxId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">WORKFLOW STAGE STATUS</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 text-slate-800 font-bold"
                    >
                      <option value="pending_review">Pending Review</option>
                      <option value="waiting_payment">Waiting Payment (Unpaid)</option>
                      <option value="verifying_payment">Verifying Payment</option>
                      <option value="processing">Processing (Active Connection)</option>
                      <option value="ready_activation">Ready For Activation</option>
                      <option value="completed">Completed Successfully</option>
                    </select>
                  </div>

                  {editStatus === 'processing' && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center font-bold text-slate-500">
                        <span>PROGRESS VALUE ({editProgress}%)</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={editProgress}
                          onChange={(e) => setEditProgress(Number(e.target.value))}
                          className="w-2/3 accent-[#1E4DFF]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">ACTIVE STAGE PHRASING</label>
                        <select
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value as any)}
                          className="w-full bg-white border border-slate-150 rounded-lg px-2.5 py-1.5 text-slate-800"
                        >
                          <option value="Preparing Registration">Preparing Registration</option>
                          <option value="Connecting To Server">Connecting To Server</option>
                          <option value="Registering Device">Registering Device</option>
                          <option value="Generating Activation">Generating Activation</option>
                          <option value="Ready for Activation">Ready for Activation</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition flex-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-[#1E4DFF] hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Apply Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
