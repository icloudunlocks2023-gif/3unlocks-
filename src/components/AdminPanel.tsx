import React, { useState } from 'react';
import { Menu, Bell, Shield, ChevronRight, LayoutDashboard, Cpu, Zap, LogOut } from 'lucide-react';
import { DeviceOrder, NotificationItem, ActivityLog, PaymentHistoryItem, DeviceCheck } from '../types';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

// Sub-components
import AdminSidebar, { AdminTab } from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminPayments from './AdminPayments';
import AdminFirmware from './AdminFirmware';
import AdminUsers from './AdminUsers';
import AdminServices from './AdminServices';
import AdminReviews from './AdminReviews';
import AdminNotifications from './AdminNotifications';
import AdminAnalytics from './AdminAnalytics';
import AdminSettings from './AdminSettings';
import AdminDeviceChecks from './AdminDeviceChecks';

interface AdminPanelProps {
  orders: DeviceOrder[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  paymentHistory: PaymentHistoryItem[];
  deviceChecks: DeviceCheck[];
  onApprovePayment: (orderId: string) => void;
  onRejectPayment: (orderId: string) => void;
  onSendFirmwareLink: (orderId: string, link: string) => void;
  onApproveDeviceReview: (orderId: string, feedback: string) => void;
  onTriggerNotification: (title: string, desc: string, type: NotificationItem['type'], icon: string) => void;
  onUpdateDeviceCheckStatus: (requestId: string, status: DeviceCheck['currentStatus']) => Promise<void>;
  onSendDeviceCheckFeedback: (requestId: string, feedback: string, deviceDetails?: { device: string; supportStatus: string; successRate: string; registrationRequired: string }) => Promise<void>;
  onSaveDeviceCheckDraft: (requestId: string, feedback: string) => Promise<void>;
  onDeleteDeviceCheckRequest: (requestId: string) => Promise<void>;
  userEmail: string;
}

export default function AdminPanel({
  orders,
  notifications,
  activityLogs,
  paymentHistory,
  deviceChecks,
  onApprovePayment,
  onRejectPayment,
  onSendFirmwareLink,
  onApproveDeviceReview,
  onTriggerNotification,
  onUpdateDeviceCheckStatus,
  onSendDeviceCheckFeedback,
  onSaveDeviceCheckDraft,
  onDeleteDeviceCheckRequest,
  userEmail,
}: AdminPanelProps) {
  // Navigation Routing States
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Pending count calculations for sidebar badges
  const pendingCounts = React.useMemo(() => {
    return {
      deviceChecks: deviceChecks.filter(c => c.currentStatus === 'Waiting' || c.currentStatus === 'Reviewing').length,
      payments: orders.filter(o => o.status === 'verifying_payment' && o.transactionId).length,
      firmware: orders.filter(o => o.firmwareRequestStatus === 'requested').length,
    };
  }, [deviceChecks, orders]);

  // Unified Order update and delete database write utilities
  const handleUpdateOrder = async (order: DeviceOrder) => {
    try {
      await setDoc(doc(db, 'orders', order.id), order, { merge: true });
    } catch (err) {
      console.error("Failed to update order in Firestore", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error("Failed to delete order from Firestore", err);
    }
  };

  // Sign out helper
  const handleSignOutClick = () => {
    const logoutBtn = document.getElementById('header-signout-btn');
    if (logoutBtn) {
      logoutBtn.click();
    } else {
      alert('To logout securely, use the logout trigger in the top website header.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* 1. SaaS Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={sidebarCollapsed => setSidebarCollapsed(sidebarCollapsed)}
        pendingCounts={pendingCounts}
        onSignOut={handleSignOutClick}
      />

      {/* 2. Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top workspace navigation and system status header */}
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Page title and breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                Console
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[#1E4DFF] capitalize font-bold font-mono">
                {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Root Secure: <strong className="text-[#1E4DFF]">{userEmail}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1E4DFF] animate-ping absolute -top-0.5 -right-0.5" />
                <div className="w-2 h-2 rounded-full bg-[#1E4DFF] absolute top-0 right-0" />
                <span className="text-slate-400 p-2 block hover:text-slate-600 cursor-pointer">
                  <Bell className="w-4.5 h-4.5" />
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Render Routed Tabs */}
        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto pb-16">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              orders={orders}
              notifications={notifications}
              paymentHistory={paymentHistory}
              deviceChecks={deviceChecks}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'device-checks' && (
            <AdminDeviceChecks
              deviceChecks={deviceChecks}
              onUpdateStatus={onUpdateDeviceCheckStatus}
              onSendFeedback={onSendDeviceCheckFeedback}
              onSaveDraft={onSaveDeviceCheckDraft}
              onDeleteRequest={onDeleteDeviceCheckRequest}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrders
              orders={orders}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'payments' && (
            <AdminPayments
              paymentHistory={paymentHistory}
              onApprovePayment={onApprovePayment}
              onRejectPayment={onRejectPayment}
            />
          )}

          {activeTab === 'firmware' && (
            <AdminFirmware
              orders={orders}
              onSendFirmwareLink={onSendFirmwareLink}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsers
              orders={orders}
              deviceChecks={deviceChecks}
              paymentHistory={paymentHistory}
            />
          )}

          {activeTab === 'services' && (
            <AdminServices />
          )}

          {activeTab === 'reviews' && (
            <AdminReviews />
          )}

          {activeTab === 'notifications' && (
            <AdminNotifications
              notifications={notifications}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalytics />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              activityLogs={activityLogs}
            />
          )}

          {activeTab === 'security' && (
            <AdminSettings
              activityLogs={activityLogs}
            />
          )}
        </div>

      </div>

    </div>
  );
}
