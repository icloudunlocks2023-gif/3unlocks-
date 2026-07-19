import React, { useState, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Smartphone, 
  Trash2, 
  Check, 
  Clock, 
  Eye, 
  User, 
  Cpu, 
  Calendar, 
  X, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  FileText,
  Save,
  Send,
  Loader2,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DeviceCheck } from '../types';

interface AdminDeviceChecksProps {
  deviceChecks: DeviceCheck[];
  onUpdateStatus: (requestId: string, status: DeviceCheck['currentStatus']) => Promise<void>;
  onSendFeedback: (requestId: string, feedback: string, deviceDetails?: { device: string; supportStatus: string; successRate: string; registrationRequired: string }) => Promise<void>;
  onSaveDraft: (requestId: string, feedback: string) => Promise<void>;
  onDeleteRequest: (requestId: string) => Promise<void>;
}

export default function AdminDeviceChecks({
  deviceChecks,
  onUpdateStatus,
  onSendFeedback,
  onSaveDraft,
  onDeleteRequest,
}: AdminDeviceChecksProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Today' | 'Waiting' | 'Reviewing' | 'Completed'>('all');
  const [selectedCheck, setSelectedCheck] = useState<DeviceCheck | null>(null);
  
  // Feedback editor states
  const [editorHtml, setEditorHtml] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Device fields editor state (for results summary customization)
  const [deviceVal, setDeviceVal] = useState('iPad Pro 11"');
  const [supportVal, setSupportVal] = useState('Supported');
  const [successVal, setSuccessVal] = useState('98%');
  const [regVal, setRegVal] = useState('Yes');

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
    setEditorHtml(check.adminFeedback || '');
    setDeviceVal(check.device || 'iPad Pro 11"');
    setSupportVal(check.supportStatus || 'Supported');
    setSuccessVal(check.successRate || '98%');
    setRegVal(check.registrationRequired || 'Yes');
    
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
    if (statusFilter === 'Completed') return c.currentStatus === 'Feedback Sent';
    if (statusFilter === 'Today') {
      const todayStr = new Date().toISOString().substring(0, 10);
      return c.submittedAt.includes(todayStr);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search request ID, imei, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs pl-9 pr-4 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-[#1E4DFF]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono w-full sm:w-auto shrink-0 justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-[#1E4DFF] font-mono text-[11px]"
          >
            <option value="all">All Submissions ({deviceChecks.length})</option>
            <option value="Today">Today's Checks</option>
            <option value="Waiting">Waiting For Review</option>
            <option value="Reviewing">Reviewing</option>
            <option value="Completed">Completed (Feedback Sent)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Split panel on selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Searchable Submissions Table */}
        <div className={`${selectedCheck ? 'lg:col-span-6' : 'lg:col-span-12'} bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden`}>
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
              Device Compatibility Checks ({filteredChecks.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950 text-left">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">IMEI / ECID</th>
                  <th className="p-3">iOS</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {filteredChecks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 text-xs font-mono">
                      No device checks match your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map((check) => (
                    <tr 
                      key={check.requestId}
                      className={`hover:bg-slate-900/50 transition cursor-pointer ${selectedCheck?.requestId === check.requestId ? 'bg-[#1E4DFF]/10 text-white font-semibold' : ''}`}
                      onClick={() => handleSelectCheck(check)}
                    >
                      <td className="p-3 text-slate-400 font-bold">
                        #{check.requestId.split('-')[1] || check.requestId}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{check.username}</div>
                        <div className="text-[10px] text-slate-500">{check.email}</div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div>{check.imeiSerial}</div>
                        <div className="text-[10px] text-slate-500">ECID: {check.ecid}</div>
                      </td>
                      <td className="p-3 text-slate-400">
                        v{check.iosVersion}
                      </td>
                      <td className="p-3">
                        {check.currentStatus === 'Waiting' && (
                          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Waiting</span>
                        )}
                        {check.currentStatus === 'Reviewing' && (
                          <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded animate-pulse">Reviewing</span>
                        )}
                        {check.currentStatus === 'Feedback Sent' && (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Feedback Sent</span>
                        )}
                        {check.currentStatus === 'Expired' && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded">Expired</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          className="bg-slate-900 hover:bg-[#1E4DFF] hover:text-white text-slate-400 p-1.5 rounded-lg border border-slate-800 flex items-center justify-center inline-block"
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

        {/* Right Side: Request Details & Action Page */}
        {selectedCheck && (
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-6 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">DEVICE REVIEW CONSOLE</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Request #{selectedCheck.requestId}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCheck(null)}
                className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Device Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
              
              {/* Customer Column */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2">
                <h5 className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1E4DFF]" /> Customer Info
                </h5>
                <div className="space-y-1 text-[11px]">
                  <div>Username: <strong className="text-white">{selectedCheck.username}</strong></div>
                  <div className="truncate">Email: <span className="text-slate-400">{selectedCheck.email}</span></div>
                  <div>Account: <span className="text-slate-400">Personal User</span></div>
                </div>
              </div>

              {/* Device Column */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2">
                <h5 className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-500" /> Device Specs
                </h5>
                <div className="space-y-1 text-[11px]">
                  <div className="truncate">IMEI/SN: <strong className="text-white font-bold select-all">{selectedCheck.imeiSerial}</strong></div>
                  <div className="truncate">ECID: <span className="text-slate-400 font-semibold select-all">{selectedCheck.ecid}</span></div>
                  <div>iOS Version: <span className="text-emerald-400 font-bold">v{selectedCheck.iosVersion}</span></div>
                </div>
              </div>

            </div>

            {/* Current Status Badge & Interactive Admin Quick Actions */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono block">CURRENT WORKFLOW STATUS</span>
                <span className="font-bold text-white text-[11px] font-mono capitalize">{selectedCheck.currentStatus}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Reviewing', () => onUpdateStatus(selectedCheck.requestId, 'Reviewing'))}
                  className="bg-blue-950/80 hover:bg-blue-900 border border-blue-900 text-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition flex items-center gap-1"
                >
                  {loadingAction === 'Reviewing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  Mark Reviewing
                </button>
                <select
                  value={selectedCheck.currentStatus}
                  onChange={(e) => handleAction('StatusEdit', () => onUpdateStatus(selectedCheck.requestId, e.target.value as any))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-[#1E4DFF] cursor-pointer"
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Feedback Sent">Completed</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Custom Device Summary Customizer Form */}
            <div className="space-y-3">
              <h5 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
                Verification Summary Details (Outputs to Results Table)
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono block">DEVICE MODEL</label>
                  <input 
                    type="text" 
                    value={deviceVal} 
                    onChange={(e) => setDeviceVal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono block">SUPPORT STATUS</label>
                  <input 
                    type="text" 
                    value={supportVal} 
                    onChange={(e) => setSupportVal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono block">SUCCESS RATE</label>
                  <input 
                    type="text" 
                    value={successVal} 
                    onChange={(e) => setSuccessVal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono block">REGISTRATION REQUIRED</label>
                  <input 
                    type="text" 
                    value={regVal} 
                    onChange={(e) => setRegVal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* PREMIUM RICH TEXT EDITOR */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider font-mono block">
                Write Personalized Feedback
              </label>

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-t-xl">
                <button
                  type="button"
                  onClick={() => handleEditorCommand('bold')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('italic')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <span className="w-[1px] h-4 bg-slate-800"></span>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('insertUnorderedList')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('insertOrderedList')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <span className="w-[1px] h-4 bg-slate-800"></span>
                <button
                  type="button"
                  onClick={() => handleEditorCommand('formatBlock', 'P')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition cursor-pointer text-[10px] font-bold font-mono"
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
                className="w-full min-h-[140px] max-h-[220px] overflow-y-auto bg-slate-900/40 border-x border-b border-slate-800 rounded-b-xl p-3.5 text-xs text-slate-200 outline-none focus:border-[#1E4DFF] focus:bg-slate-900/60 transition prose prose-invert prose-xs"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <p className="text-[9px] text-slate-500 font-mono">
                Formatting tags like bold, italics, bullet lists are fully preserved during rendering on customer dashboard.
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-800">
              <button
                disabled={loadingAction !== null}
                onClick={() => handleAction('Delete', () => onDeleteRequest(selectedCheck.requestId).then(() => setSelectedCheck(null)))}
                className="w-full sm:w-auto bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-900 px-4 py-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loadingAction === 'Delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Request
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Draft', () => onSaveDraft(selectedCheck.requestId, editorHtml))}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  {loadingAction === 'Draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Draft
                </button>
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('Send', () => onSendFeedback(selectedCheck.requestId, editorHtml, {
                    device: deviceVal,
                    supportStatus: supportVal,
                    successRate: successVal,
                    registrationRequired: regVal
                  }))}
                  className="bg-[#1E4DFF] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial shadow-md shadow-blue-500/15"
                >
                  {loadingAction === 'Send' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Feedback
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
