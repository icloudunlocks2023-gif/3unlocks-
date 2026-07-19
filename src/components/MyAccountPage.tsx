import React, { useState, useEffect } from 'react';
import { User, Smartphone, ShieldCheck, CheckCircle2, Clock, AlertCircle, Eye, Search, Settings, Calendar, ShieldAlert } from 'lucide-react';
import { DeviceOrder } from '../types';

interface MyAccountPageProps {
  orders: DeviceOrder[];
  onSelectOrder: (order: DeviceOrder) => void;
  userEmail: string;
  profileData?: {
    id: string;
    username: string;
    email: string;
    country: string;
    whatsApp?: string;
    accountType: string;
    deviceOwnership: string;
    registrationDate: string;
    role: string;
    status: string;
  } | null;
  initialSubTab?: 'history' | 'profile' | 'settings';
}

export default function MyAccountPage({
  orders,
  onSelectOrder,
  userEmail,
  profileData,
  initialSubTab = 'history',
}: MyAccountPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'profile' | 'settings'>(initialSubTab);

  // Sync state if initialSubTab prop changes from parent (e.g. from header dropdown selection)
  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const filteredOrders = orders.filter(
    (o) =>
      o.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ecid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: DeviceOrder['status']) => {
    switch (status) {
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
      case 'ready_activation':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ready for Activation
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3 h-3 text-green-600" /> Completed
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

  return (
    <div id="my-account-page" className="py-8 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 font-sans text-left">
      
      {/* Profile Overview Banner */}
      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4DFF]">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-0.5 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {profileData?.username ? `${profileData.username}'s Account` : 'My Account Dashboard'}
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
            <span className="text-[#1E4DFF] block text-[10px] uppercase font-bold">Active In-Flight</span>
            <span className="text-base font-black text-[#1E4DFF]">
              {orders.filter((o) => o.status !== 'completed' && o.status !== 'checked').length}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-bold text-slate-400">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 border-b-2 transition-all cursor-pointer relative ${
            activeSubTab === 'history' ? 'border-[#1E4DFF] text-[#1E4DFF]' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Device Orders
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 border-b-2 transition-all cursor-pointer relative ${
            activeSubTab === 'profile' ? 'border-[#1E4DFF] text-[#1E4DFF]' : 'border-transparent hover:text-slate-600'
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 border-b-2 transition-all cursor-pointer relative ${
            activeSubTab === 'settings' ? 'border-[#1E4DFF] text-[#1E4DFF]' : 'border-transparent hover:text-slate-600'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Sub-tab Rendering */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          {/* Title Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Device Orders History</h4>
              <p className="text-slate-500 text-xs">Monitor status updates, invoices, and restore firmware links here.</p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search IMEI or ECID..."
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
                      <td className="p-4 text-slate-500">{order.createdAt}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
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
      )}

      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Left Details Panel */}
          <div className="md:col-span-2 bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base font-bold text-slate-900">Personal Information</h4>
              <p className="text-slate-400 text-xs">Verify your personal identifiers saved securely on your user document.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">Username / Display Name</span>
                <span className="font-bold text-slate-800 text-sm">{profileData?.username || 'N/A'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">Primary Registered Email</span>
                <span className="font-bold text-slate-800 text-sm select-all">{profileData?.email || userEmail}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">Country / Region</span>
                <span className="font-bold text-slate-800 text-sm">{profileData?.country || 'N/A'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">WhatsApp Contact Number</span>
                <span className="font-bold text-slate-800 text-sm">{profileData?.whatsApp || 'Not Provided'}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-base font-bold text-slate-900 mb-4">Partner Profile Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Account Designation</span>
                  <span className="bg-blue-50 text-[#1E4DFF] px-2.5 py-1 rounded-lg font-bold text-xs w-fit block border border-blue-100/30">
                    {profileData?.accountType || 'Personal User'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Target Devices Owned</span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-xs w-fit block border border-slate-200">
                    {profileData?.deviceOwnership || 'Personal Devices'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Status Overview Card */}
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Security & Status</h4>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Verification Badge</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active Member
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">User Role Level</span>
                  <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {profileData?.role || 'Customer'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Account State</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100/30">
                    {profileData?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Registration Timeline</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your account was generated on <strong>{formatDate(profileData?.registrationDate)}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm max-w-3xl space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-bold text-slate-900">User Interface & Notifications Settings</h4>
            <p className="text-slate-400 text-xs">Configure notifications and device automation settings here.</p>
          </div>

          <div className="space-y-5 text-xs text-slate-700">
            {/* Setting 1 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">Real-time Email Notifications</span>
                <span className="text-slate-400 text-[11px]">Send updates when device check results are verified by Admins.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#1E4DFF]" />
            </div>

            {/* Setting 2 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">Firmware Ready Audio Alerts</span>
                <span className="text-slate-400 text-[11px]">Play a sound when custom restore files are ready for activation.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#1E4DFF]" />
            </div>

            {/* Setting 3 */}
            <div className="flex items-center justify-between pb-4">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">Automated Local Diagnostics Logs</span>
                <span className="text-slate-400 text-[11px]">Save details of bypass processes in your browser's persistent session cache.</span>
              </div>
              <input type="checkbox" className="rounded border-slate-300 text-[#1E4DFF]" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 block mb-1">Durable Security Rules Enabled</span>
              <p className="leading-relaxed">
                All changes to security records, email references, and payment tracking require authenticated signatures.
                Please contact support to register changes for identity-verified accounts.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
