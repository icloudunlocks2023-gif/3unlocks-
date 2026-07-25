import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ShoppingBag, 
  CreditCard, 
  Download, 
  Users, 
  Sliders, 
  Star, 
  Bell, 
  BarChart2, 
  Settings, 
  ShieldAlert, 
  X, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Activity
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard'
  | 'activity-monitor'
  | 'device-checks'
  | 'orders'
  | 'payments'
  | 'firmware'
  | 'users'
  | 'services'
  | 'reviews'
  | 'notifications'
  | 'analytics'
  | 'settings'
  | 'security'
  | 'support';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  pendingCounts: {
    deviceChecks: number;
    payments: number;
    firmware: number;
    support: number;
  };
  onSignOut: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  pendingCounts,
  onSignOut
}: AdminSidebarProps) {

  const menuItems: {
    id: AdminTab;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activity-monitor', label: 'User Activity Monitor', icon: Activity },
    { id: 'device-checks', label: 'Device Checks', icon: CheckSquare, badge: pendingCounts.deviceChecks, badgeColor: 'bg-[#1E4DFF]' },
    { id: 'orders', label: 'Unlock Orders', icon: ShoppingBag },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'support', label: 'Support Center', icon: MessageSquare, badge: pendingCounts.support, badgeColor: 'bg-amber-500' },
    { id: 'notifications', label: 'Broadcast Alerts', icon: Bell },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  const renderNavList = () => (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            id={`sidebar-item-${item.id}`}
            onClick={() => {
              setActiveTab(item.id);
              setIsOpen(false); // Close drawer on mobile click
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
              isActive 
                ? 'bg-[#1E4DFF] text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IconComponent className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white animate-pulse' : 'text-slate-400'}`} />
            
            {(!isCollapsed || isOpen) && (
              <span className="flex-1 text-left truncate">{item.label}</span>
            )}
            
            {item.badge !== undefined && item.badge > 0 && (!isCollapsed || isOpen) && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}

            {item.badge !== undefined && item.badge > 0 && isCollapsed && !isOpen && (
              <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white ${item.badgeColor}`} />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Drawer Overlay for Mobile view */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar for Desktop / Drawer for Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-300 shadow-sm
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full'} 
          lg:translate-x-0 lg:static ${sidebarWidth}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-[#1E4DFF] flex items-center justify-center shadow-md shadow-blue-500/15 shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="text-left font-black tracking-tight text-slate-900 text-sm font-sans truncate leading-none">
                iUnlock<span className="text-[#1E4DFF]">SaaS</span>
                <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-1">Admin Console</span>
              </div>
            )}
          </div>

          {/* Close drawer button (Mobile only) */}
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        {renderNavList()}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 shrink-0 space-y-1.5">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 text-red-400" />
            {(!isCollapsed || isOpen) && (
              <span className="flex-1 text-left truncate">Logout Control</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
