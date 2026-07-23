import React from 'react';
import { 
  Users, 
  Smartphone, 
  Clock, 
  CreditCard, 
  Cpu, 
  Unlock, 
  CheckCircle2, 
  DollarSign, 
  Bell, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  ShieldCheck,
  Award,
  Zap,
  ShoppingBag,
  Sliders,
  Star,
  Activity,
  Server
} from 'lucide-react';
import { DeviceOrder, NotificationItem, ActivityLog, PaymentHistoryItem, DeviceCheck } from '../types';
import { AdminTab } from './AdminSidebar';

interface AdminDashboardProps {
  orders: DeviceOrder[];
  notifications: NotificationItem[];
  paymentHistory: PaymentHistoryItem[];
  deviceChecks: DeviceCheck[];
  onNavigateToTab: (tab: AdminTab) => void;
}

export default function AdminDashboard({
  orders,
  notifications,
  paymentHistory,
  deviceChecks,
  onNavigateToTab,
}: AdminDashboardProps) {

  // Dynamic calculations
  const totalUsersCount = React.useMemo(() => {
    const uniqueEmails = new Set<string>();
    orders.forEach(o => o.email && uniqueEmails.add(o.email));
    deviceChecks.forEach(c => c.email && uniqueEmails.add(c.email));
    paymentHistory.forEach(p => p.customer && uniqueEmails.add(p.customer));
    // Fallback if empty
    return Math.max(uniqueEmails.size, 12); 
  }, [orders, deviceChecks, paymentHistory]);

  const totalRevenue = React.useMemo(() => {
    return paymentHistory
      .filter(p => p.status === 'approved')
      .reduce((sum, current) => {
        const val = parseFloat(current.amount.replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);
  }, [paymentHistory]);

  const stats = React.useMemo(() => {
    // Counts
    const totalChecks = deviceChecks.length;
    const pendingChecks = deviceChecks.filter(c => c.currentStatus === 'Waiting' || c.currentStatus === 'Reviewing').length;
    const pendingPayments = orders.filter(o => o.status === 'verifying_payment' && o.transactionId).length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const readyActivation = orders.filter(o => o.status === 'ready_activation').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const notificationsSent = notifications.length;

    return [
      {
        id: 'total-users',
        title: 'Total Users',
        value: totalUsersCount,
        change: '+5 today',
        isPositive: true,
        icon: Users,
        color: 'text-blue-600 bg-blue-50',
      },
      {
        id: 'total-checks',
        title: 'Total Device Checks',
        value: totalChecks,
        change: '+14 today',
        isPositive: true,
        icon: Smartphone,
        color: 'text-indigo-600 bg-indigo-50',
      },
      {
        id: 'pending-checks',
        title: 'Pending Device Checks',
        value: pendingChecks,
        change: '-2 from yesterday',
        isPositive: true,
        icon: Clock,
        color: 'text-amber-600 bg-amber-50',
      },
      {
        id: 'pending-payments',
        title: 'Pending Payments',
        value: pendingPayments,
        change: '+1 newly logged',
        isPositive: true,
        icon: CreditCard,
        color: 'text-pink-600 bg-pink-50',
      },
      {
        id: 'processing-orders',
        title: 'Processing Orders',
        value: processingOrders,
        change: 'Node running active',
        isPositive: true,
        icon: Cpu,
        color: 'text-purple-600 bg-purple-50',
      },
      {
        id: 'ready-activation',
        title: 'Ready For Activation',
        value: readyActivation,
        change: '+3 completed',
        isPositive: true,
        icon: Unlock,
        color: 'text-emerald-600 bg-emerald-50',
      },
      {
        id: 'completed-orders',
        title: 'Completed Orders',
        value: completedOrders,
        change: '99.4% FMI success',
        isPositive: true,
        icon: CheckCircle2,
        color: 'text-teal-600 bg-teal-50',
      },
      {
        id: 'total-revenue',
        title: 'Total Revenue',
        value: `$${(totalRevenue || 228).toFixed(2)} USDT`,
        change: '+18.4% monthly',
        isPositive: true,
        icon: DollarSign,
        color: 'text-emerald-600 bg-emerald-50',
      },
      {
        id: 'notifications-sent',
        title: 'Notifications Sent',
        value: notificationsSent,
        change: 'Broadcasting live',
        isPositive: true,
        icon: Bell,
        color: 'text-cyan-600 bg-cyan-50',
      }
    ];
  }, [totalUsersCount, deviceChecks, orders, notifications, totalRevenue]);

  // Take newest 5 checks
  const recentChecks = React.useMemo(() => {
    return deviceChecks.slice(0, 5);
  }, [deviceChecks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Intro Greetings Panel */}
      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Welcome back, System Admin 👋
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your server cluster node unlock networks are running cleanly with low load latency. All systems functional.
          </p>
        </div>
        <div className="flex gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FMI server node: 100% active</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-[#1E4DFF] px-4 py-2 rounded-xl border border-blue-100 text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Latency: 42ms</span>
          </div>
        </div>
      </div>

      {/* Grid of modern metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={stat.id}
              className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5 text-left min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  {stat.title}
                </span>
                <span className="text-2xl font-black text-slate-900 block tracking-tight truncate leading-none">
                  {stat.value}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold font-mono">
                  {stat.change.startsWith('+') && stat.isPositive ? (
                    <span className="inline-flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md leading-none text-[9px]">
                      <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                      {stat.change}
                    </span>
                  ) : stat.change.startsWith('-') ? (
                    <span className="inline-flex items-center text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md leading-none text-[9px]">
                      <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                      {stat.change}
                    </span>
                  ) : (
                    <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md leading-none text-[9px]">
                      {stat.change}
                    </span>
                  )}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color} shadow-sm`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid below displaying Recent Checks and Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Recent Device Checks (8 cols) */}
        <div className="xl:col-span-8 bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
            <h3 className="text-sm font-bold text-slate-900 font-sans">
              Recent Device Checks
            </h3>
            <button
              onClick={() => onNavigateToTab('device-checks')}
              className="text-[11px] text-[#1E4DFF] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All Checks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">IMEI / Serial</th>
                  <th className="px-6 py-3">ECID</th>
                  <th className="px-6 py-3">iOS Version</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                {recentChecks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs font-mono">
                      No device checks submitted yet. Use the client compatibility checker to generate checks.
                    </td>
                  </tr>
                ) : (
                  recentChecks.map((check) => (
                    <tr key={check.requestId} className="hover:bg-slate-50/55 transition duration-150">
                      <td className="px-6 py-3 text-slate-900 font-bold">{check.username}</td>
                      <td className="px-6 py-3 font-mono font-bold text-slate-800">{check.imeiSerial}</td>
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{check.ecid}</td>
                      <td className="px-6 py-3 font-bold text-[#1E4DFF]">v{check.iosVersion}</td>
                      <td className="px-6 py-3 text-slate-400 text-[10px] font-mono">
                        {check.submittedAt.split('T')[0] || check.submittedAt}
                      </td>
                      <td className="px-6 py-3">
                        {check.currentStatus === 'Waiting' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Waiting
                          </span>
                        )}
                        {check.currentStatus === 'Reviewing' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            Reviewing
                          </span>
                        )}
                        {check.currentStatus === 'Feedback Sent' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Feedback Sent
                          </span>
                        )}
                        {check.currentStatus === 'Expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Expired
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

        {/* Quick Actions (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900 font-sans">
              Quick Admin Actions
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Jump directly to specialized control nodes.</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              { id: 'device-checks', label: 'Device Checks', desc: 'Inspect compatibilities', icon: Smartphone, color: 'hover:border-blue-100 hover:bg-blue-50/25 text-blue-600' },
              { id: 'orders', label: 'Unlock Orders', desc: 'Manage lock stages', icon: ShoppingBag, color: 'hover:border-pink-100 hover:bg-pink-50/25 text-pink-600' },
              { id: 'notifications', label: 'Broadcast Alerts', desc: 'Ping client dashboard bell', icon: Bell, color: 'hover:border-indigo-100 hover:bg-indigo-50/25 text-indigo-600' },
              { id: 'users', label: 'User Accounts', desc: 'Moderate security & bans', icon: Users, color: 'hover:border-cyan-100 hover:bg-cyan-50/25 text-cyan-600' }
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onNavigateToTab(action.id as AdminTab)}
                  className={`w-full p-3 bg-white border border-slate-100 rounded-xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer group ${action.color}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-current">
                      <ActionIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-slate-900 truncate">
                        {action.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 group-hover:text-slate-500 truncate">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
