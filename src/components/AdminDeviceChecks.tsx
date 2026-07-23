import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Clock, 
  Eye, 
  User, 
  Cpu, 
  X, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  FileText,
  Save,
  Send,
  Loader2,
  ChevronDown,
  AlertTriangle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { DeviceCheck } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { pricingData } from './PricesPage';

interface AdminDeviceChecksProps {
  deviceChecks: DeviceCheck[];
  onUpdateStatus: (requestId: string, status: DeviceCheck['currentStatus']) => Promise<void>;
  onSendFeedback: (requestId: string, feedback: string, deviceDetails?: { 
    device: string; 
    supportStatus: string; 
    successRate: string; 
    registrationRequired: string;
    currentStatus?: DeviceCheck['currentStatus'];
    fmiStatus?: string;
    blacklistStatus?: string;
    price?: string;
    lastUpdated?: string;
  }) => Promise<void>;
  onSaveDraft: (requestId: string, feedback: string, draftDetails?: any) => Promise<void>;
  onDeleteRequest: (requestId: string) => Promise<void>;
  onDeleteAllRequests?: () => Promise<void>;
}

export default function AdminDeviceChecks({
  deviceChecks,
  onUpdateStatus,
  onSendFeedback,
  onSaveDraft,
  onDeleteRequest,
  onDeleteAllRequests,
}: AdminDeviceChecksProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Today' | 'Waiting' | 'Reviewing' | 'Completed'>('all');
  const [selectedCheck, setSelectedCheck] = useState<DeviceCheck | null>(null);
  const [isAdminMinimized, setIsAdminMinimized] = useState(false);
  
  // Feedback editor states
  const [editorHtml, setEditorHtml] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Real-time services listener
  const [services, setServices] = useState<any[]>([]);

  // Device fields editor states (for results summary customization)
  const [deviceVal, setDeviceVal] = useState('iPhone 15 Pro Max');
  const [supportVal, setSupportVal] = useState<'Supported' | 'FMI OFF' | 'Not Supported'>('Supported');
  const [successVal, setSuccessVal] = useState('98%');
  const [regVal, setRegVal] = useState('Yes');
  const [fmiStatusVal, setFmiStatusVal] = useState('ON');
  const [blacklistStatusVal, setBlacklistStatusVal] = useState('Clean');

  // Searchable dropdown states
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Service Package object derived from the active category
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Listen to services collection for live pricing sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setServices(list);
    });
    return () => unsub();
  }, []);

  // Close searchable dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect isIphone category
  const isIphone = pricingData.find(p => p.device === deviceVal)?.type === 'iphone' || deviceVal.toLowerCase().includes('iphone');

  // Automatic Service Package Selector when device name changes
  useEffect(() => {
    if (services.length === 0) return;
    const cat = isIphone ? 'iPhone' : 'iPad';
    const available = services.filter(s => s.category === cat && s.enabled);
    if (available.length > 0) {
      let bestMatch = available[0];
      if (isIphone) {
        const isPremiumModel = deviceVal.toLowerCase().includes('pro') || 
                               deviceVal.toLowerCase().includes('max') || 
                               deviceVal.toLowerCase().includes('15') || 
                               deviceVal.toLowerCase().includes('16') || 
                               deviceVal.toLowerCase().includes('17');
        const premiumService = available.find(s => s.name.toLowerCase().includes('premium') || s.name.toLowerCase().includes('pro'));
        const standardService = available.find(s => !s.name.toLowerCase().includes('premium') && !s.name.toLowerCase().includes('pro'));
        if (isPremiumModel && premiumService) {
          bestMatch = premiumService;
        } else if (standardService) {
          bestMatch = standardService;
        }
      } else {
        const isCellularModel = deviceVal.toLowerCase().includes('cellular') || 
                                deviceVal.toLowerCase().includes('pro') || 
                                deviceVal.toLowerCase().includes('air') || 
                                deviceVal.toLowerCase().includes('lte');
        const cellularService = available.find(s => s.name.toLowerCase().includes('cellular') || s.id.includes('cellular'));
        const wifiService = available.find(s => s.name.toLowerCase().includes('wifi') || s.id.includes('wifi'));
        if (isCellularModel && cellularService) {
          bestMatch = cellularService;
        } else if (wifiService) {
          bestMatch = wifiService;
        }
      }
      setSelectedService(bestMatch);
    }
  }, [deviceVal, services, isIphone]);

  // Synchronize dynamic values when active package changes
  useEffect(() => {
    if (selectedService) {
      setSuccessVal(selectedService.successRate);
    }
  }, [selectedService]);

  // Derived Pricing Formula
  const matchedPricingItem = pricingData.find(p => p.device.toLowerCase() === deviceVal.toLowerCase());
  const cleanPriceVal = matchedPricingItem ? matchedPricingItem.price : (selectedService ? `$${selectedService.cleanPrice} USDT` : '$29.00 USDT');
  const lostPriceVal = selectedService ? `$${selectedService.lostPrice} USDT` : '$39.00 USDT';
  const currentUnlockPriceVal = matchedPricingItem ? matchedPricingItem.price : (blacklistStatusVal === 'Clean' ? cleanPriceVal : lostPriceVal);
  const successValDerived = matchedPricingItem ? matchedPricingItem.rate : successVal;

  // Custom visual Rich Text Editor Command Wrapper
  const handleEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
  };

  const handleSelectCheck = (check: DeviceCheck) => {
    setSelectedCheck(check);
    setIsAdminMinimized(false);
    setEditorHtml(check.adminFeedback || '');
    setDeviceVal(check.device || 'iPhone 15 Pro Max');
    setDeviceSearchTerm(check.device || 'iPhone 15 Pro Max');
    setUserHasTyped(false);
    setSupportVal((check.supportStatus as any) || 'Supported');
    setSuccessVal(check.successRate || '98%');
    setRegVal(check.registrationRequired || 'Yes');
    setFmiStatusVal(check.fmiStatus || 'ON');
    setBlacklistStatusVal(check.blacklistStatus || 'Clean');
    
    // Fill the editor content safely once it's rendered
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = check.adminFeedback || '';
      }
    }, 100);
  };

  const handleAction = async (actionName: string, promise: () => Promise<void>) => {
    setLoadingAction(actionName);
    try {
      await promise();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteWithConfirm = async (requestId: string) => {
    if (confirmDeleteId !== requestId) {
      setConfirmDeleteId(requestId);
      return;
    }
    await handleAction('Delete', async () => {
      await onDeleteRequest(requestId);
      setSelectedCheck(null);
      setConfirmDeleteId(null);
    });
  };

  // Filter Dropdown items based on Search
  const filteredDropdownDevices = pricingData.filter(p => {
    if (!userHasTyped || !deviceSearchTerm) {
      return true;
    }
    return p.device.toLowerCase().includes(deviceSearchTerm.toLowerCase());
  });

  // Filtering Logic
  const filteredChecks = deviceChecks.filter((c) => {
    const matchesSearch = 
      c.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.imeiSerial.includes(searchQuery) ||
      c.ecid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.iosVersion.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'Waiting') return c.currentStatus === 'Waiting';
    if (statusFilter === 'Reviewing') return c.currentStatus === 'Reviewing';
    if (statusFilter === 'Completed') return ['Feedback Sent', 'Supported', 'FMI OFF', 'Not Supported'].includes(c.currentStatus);
    if (statusFilter === 'Today') {
      const todayStr = new Date().toISOString().substring(0, 10);
      return c.submittedAt.includes(todayStr);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search request ID, imei, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-4 py-2 rounded-xl text-slate-700 focus:outline-none focus:border-[#1E4DFF] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono w-full sm:w-auto shrink-0 justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#1E4DFF] focus:bg-white font-mono text-[11px] cursor-pointer"
          >
            <option value="all">All Submissions ({deviceChecks.length})</option>
            <option value="Today">Today's Checks</option>
            <option value="Waiting">Waiting For Review</option>
            <option value="Reviewing">Reviewing</option>
            <option value="Completed">Completed / Reviewed</option>
          </select>

          {deviceChecks.length > 0 && onDeleteAllRequests && (
            confirmDeleteAll ? (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                  onClick={async () => {
                    await onDeleteAllRequests();
                    setSelectedCheck(null);
                    setConfirmDeleteAll(false);
                  }}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete ALL?</span>
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition border border-red-200 cursor-pointer shadow-sm"
                title="Delete all device check requests"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Checks</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Grid: Searchable Submissions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">
              Device Compatibility Checks ({filteredChecks.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/30 text-left">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">IMEI / ECID</th>
                  <th className="p-3">iOS</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredChecks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-mono">
                      No device checks match your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map((check) => (
                    <tr 
                      key={check.requestId}
                      className={`hover:bg-slate-50 transition cursor-pointer ${selectedCheck?.requestId === check.requestId ? 'bg-[#1E4DFF]/5 text-slate-900 font-semibold' : ''}`}
                      onClick={() => handleSelectCheck(check)}
                    >
                      <td className="p-3 text-slate-400 font-bold">
                        #{check.requestId.split('-')[1] || check.requestId}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{check.username}</div>
                        <div className="text-[10px] text-slate-400">{check.email}</div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="text-slate-700 font-medium">{check.imeiSerial}</div>
                        <div className="text-[10px] text-slate-400">ECID: {check.ecid}</div>
                      </td>
                      <td className="p-3 text-slate-500">
                        v{check.iosVersion}
                      </td>
                      <td className="p-3">
                        {check.currentStatus === 'Waiting' && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Waiting</span>
                        )}
                        {check.currentStatus === 'Reviewing' && (
                          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 animate-pulse">Reviewing</span>
                        )}
                        {(check.currentStatus === 'Feedback Sent' || check.currentStatus === 'Supported') && (
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Supported</span>
                        )}
                        {check.currentStatus === 'FMI OFF' && (
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">FMI OFF</span>
                        )}
                        {check.currentStatus === 'Not Supported' && (
                          <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Not Supported</span>
                        )}
                        {check.currentStatus === 'Expired' && (
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Expired</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          className="bg-slate-50 hover:bg-[#1E4DFF] hover:text-white text-slate-500 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center inline-block transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCheck(check);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Pop-up Overlay / Modal for Device Review Console */}
      {selectedCheck && !isAdminMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsAdminMinimized(true)} 
          />
          
          <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 sm:p-6 space-y-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">DEVICE REVIEW CONSOLE</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Request #{selectedCheck.requestId}
                  </h3>
                  <button
                    onClick={() => setIsAdminMinimized(true)}
                    className="text-[9px] uppercase font-bold tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                  >
                    Collapse
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCheck(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200 p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Device Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-600">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                <h5 className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1E4DFF]" /> Customer Info
                </h5>
                <div className="space-y-1 text-[11px]">
                  <div>Username: <strong className="text-slate-800 font-bold">{selectedCheck.username}</strong></div>
                  <div className="truncate text-slate-500">Email: <span className="select-all">{selectedCheck.email}</span></div>
                  <div>Account: <span className="text-slate-500">Personal User</span></div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                <h5 className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-500" /> Device Specs
                </h5>
                <div className="space-y-1 text-[11px]">
                  <div className="truncate text-slate-800">IMEI/SN: <strong className="font-bold select-all">{selectedCheck.imeiSerial}</strong></div>
                  <div className="truncate text-slate-500">ECID: <span className="font-semibold select-all">{selectedCheck.ecid}</span></div>
                  <div>iOS Version: <span className="text-emerald-600 font-bold">v{selectedCheck.iosVersion}</span></div>
                </div>
              </div>
            </div>

            {/* Current Status Badge & Interactive Admin Quick Actions */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono block">CURRENT WORKFLOW STATUS</span>
                <span className="font-bold text-slate-800 text-[11px] font-mono capitalize">{selectedCheck.currentStatus}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Reviewing', () => onUpdateStatus(selectedCheck.requestId, 'Reviewing'))}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1E4DFF] px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition flex items-center gap-1"
                >
                  {loadingAction === 'Reviewing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  Mark Reviewing
                </button>
                <select
                  value={selectedCheck.currentStatus}
                  onChange={(e) => handleAction('StatusEdit', () => onUpdateStatus(selectedCheck.requestId, e.target.value as any))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-[10px] focus:outline-none focus:border-[#1E4DFF] cursor-pointer"
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Feedback Sent">Feedback Sent</option>
                  <option value="Supported">Supported</option>
                  <option value="FMI OFF">FMI OFF</option>
                  <option value="Not Supported">Not Supported</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Custom Device Summary Customizer Form */}
            <div className="space-y-4">
              <h5 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
                Verification Summary Details (Outputs to Results Table)
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Device Model Searchable Dropdown */}
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-[9px] text-slate-400 font-mono block">DEVICE MODEL</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type device name..."
                      value={deviceSearchTerm} 
                      onChange={(e) => {
                        setDeviceSearchTerm(e.target.value);
                        setDeviceVal(e.target.value);
                        setUserHasTyped(true);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsDropdownOpen(true);
                        setUserHasTyped(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E4DFF] focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        if (!isDropdownOpen) {
                          setUserHasTyped(false);
                        }
                      }}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20 divide-y divide-slate-100 text-xs">
                      {filteredDropdownDevices.length === 0 ? (
                        <div className="p-2.5 text-slate-400 text-center">No devices found</div>
                      ) : (
                        filteredDropdownDevices.map((item) => (
                          <button
                            key={item.device}
                            type="button"
                            onClick={() => {
                              setDeviceVal(item.device);
                              setDeviceSearchTerm(item.device);
                              setUserHasTyped(false);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[#1E4DFF]/5 text-slate-700 hover:text-slate-900 transition-colors block font-semibold"
                          >
                            {item.device}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Support Status Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono block">SUPPORT STATUS</label>
                  <select
                    value={supportVal}
                    onChange={(e) => setSupportVal(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 font-bold focus:outline-none focus:border-[#1E4DFF] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Supported" className="text-emerald-600 font-bold">Supported</option>
                    <option value="FMI OFF" className="text-emerald-600 font-bold">FMI OFF</option>
                    <option value="Not Supported" className="text-red-500 font-bold">Not Supported</option>
                  </select>
                </div>

              </div>

              {/* Automatic Price Matrices (100% Synchronized & Read Only) */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono block">MODEL PRICE (PRICES PAGE)</span>
                  <div className="text-xs font-bold font-mono text-emerald-600">{currentUnlockPriceVal}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono block">SUCCESS RATE</span>
                  <div className="text-xs font-bold font-mono text-slate-700">{successValDerived}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono block">SOURCE STATUS</span>
                  <div className="text-xs font-black font-mono text-[#1E4DFF] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-center inline-block">
                    {matchedPricingItem ? 'Matched (Prices Page)' : 'Dynamic Default'}
                  </div>
                </div>
              </div>

            </div>

            {/* PREMIUM RICH TEXT EDITOR */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono block">
                Write Personalized Feedback
              </label>

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-t-xl">
                <button
                  type="button"
                  onClick={() => handleEditorCommand('bold')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('italic')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <span className="w-[1px] h-4 bg-slate-200"></span>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('insertUnorderedList')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('insertOrderedList')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <span className="w-[1px] h-4 bg-slate-200"></span>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('formatBlock', 'P')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition cursor-pointer text-[10px] font-bold font-mono"
                  title="Paragraph"
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" /> P
                </button>
              </div>

              {/* Rich Visual Workspace (ContentEditable) */}
              <div 
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="w-full min-h-[120px] max-h-[180px] overflow-y-auto bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-3.5 text-xs text-slate-700 outline-none focus:border-[#1E4DFF] focus:bg-white transition prose prose-xs"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <p className="text-[9px] text-slate-400 font-mono">
                Formatting tags like bold, italics, bullet lists are fully preserved during rendering on customer dashboard.
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
              <button
                disabled={loadingAction !== null}
                onClick={() => handleDeleteWithConfirm(selectedCheck.requestId)}
                className={`w-full sm:w-auto ${confirmDeleteId === selectedCheck.requestId ? 'bg-red-600 hover:bg-red-700 text-white font-bold' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'} px-4 py-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm`}
              >
                {loadingAction === 'Delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {confirmDeleteId === selectedCheck.requestId ? 'Confirm Delete?' : 'Delete Request'}
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Draft', () => onSaveDraft(selectedCheck.requestId, editorHtml, {
                    device: deviceVal,
                    supportStatus: supportVal,
                    fmiStatus: fmiStatusVal,
                    blacklistStatus: blacklistStatusVal,
                    successRate: successValDerived,
                    price: currentUnlockPriceVal,
                    registrationRequired: regVal
                  }))}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  {loadingAction === 'Draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Draft
                </button>
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Send', () => onSendFeedback(selectedCheck.requestId, editorHtml, {
                    device: deviceVal,
                    supportStatus: supportVal,
                    fmiStatus: fmiStatusVal,
                    blacklistStatus: blacklistStatusVal,
                    successRate: successValDerived,
                    price: currentUnlockPriceVal,
                    registrationRequired: regVal,
                    currentStatus: supportVal, // set currentStatus directly to Supported / FMI OFF / Not Supported
                    lastUpdated: new Date().toISOString()
                  }))}
                  className="bg-[#1E4DFF] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial shadow-md shadow-blue-500/15"
                >
                  {loadingAction === 'Send' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Feedback
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Minimize Dock for Admin Console */}
      {selectedCheck && isAdminMinimized && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-600 font-semibold">
              ✏️ Review Draft #{selectedCheck.requestId.split('-')[1] || selectedCheck.requestId}
            </span>
            <button
              onClick={() => setIsAdminMinimized(false)}
              className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Expand Console
            </button>
            <button
              onClick={() => setSelectedCheck(null)}
              className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 border border-slate-100 rounded animate-none cursor-pointer"
              title="Close Review"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
