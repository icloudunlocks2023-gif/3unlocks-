import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  Loader2, 
  CheckCircle, 
  FileText, 
  Download, 
  Cpu, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { DeviceOrder } from '../types';

interface AdminFirmwareProps {
  orders: DeviceOrder[];
  onSendFirmwareLink: (orderId: string, link: string) => Promise<void> | void;
}

export default function AdminFirmware({
  orders,
  onSendFirmwareLink
}: AdminFirmwareProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customLinkMap, setCustomLinkMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const firmwareRequests = React.useMemo(() => {
    return orders.filter(
      (o) => o.firmwareRequestStatus === 'requested' || o.firmwareRequestStatus === 'sent'
    );
  }, [orders]);

  const filteredRequests = React.useMemo(() => {
    return firmwareRequests.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.imei.includes(q) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    });
  }, [firmwareRequests, searchQuery]);

  const handleDeliver = async (orderId: string) => {
    const link = customLinkMap[orderId] || '';
    if (!link.trim()) {
      alert('Please enter a valid restore download URL first.');
      return;
    }
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      alert('The restore download link must be a valid HTTP or HTTPS protocol URL.');
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      await onSendFirmwareLink(orderId, link);
      // clear local input
      setCustomLinkMap((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Search Header */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search custom restore requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 font-mono hidden sm:block">
          IPSW KERNEL PATCHER: <span className="text-blue-600 font-bold">READY</span>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="px-5 py-4 border-b border-slate-50">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            IPSW Restore File Dispatches ({filteredRequests.length})
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Cpu className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs font-medium">No active firmware preparation requests found.</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Customers trigger custom restore compile requests from their orders dashboard once payments settle successfully.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isSent = req.firmwareRequestStatus === 'sent';
              const isDelivering = loadingMap[req.id] || false;
              
              return (
                <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/20 transition">
                  {/* Left Specs */}
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{req.id.substring(0, 8)}...
                      </span>
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Dispatched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                          Awaiting Prepare
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 font-medium">Customer:</span>{' '}
                      <strong className="text-slate-800">{req.email}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-500 pt-1">
                      <div>IMEI: <span className="font-bold text-slate-700">{req.imei}</span></div>
                      <div>ECID: <span className="font-bold text-slate-700">{req.ecid}</span></div>
                    </div>
                  </div>

                  {/* Right Input and Deliver form */}
                  <div className="flex-1 max-w-md shrink-0">
                    {isSent ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl space-y-1.5">
                        <div className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          RESTORE IPSW DISPATCHED TO CUSTOMER VIEWPORT
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
                          <span className="truncate max-w-[280px] text-slate-400 select-all font-bold">{req.firmwareLink}</span>
                          <a 
                            href={req.firmwareLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[#1E4DFF] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                          >
                            <span>Test File</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste generated download URL (Mega, Drive, etc...)"
                          value={customLinkMap[req.id] || ''}
                          onChange={(e) => setCustomLinkMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          className="flex-1 bg-slate-50 border border-slate-100 text-xs px-3 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E4DFF]"
                        />
                        <button
                          disabled={isDelivering}
                          onClick={() => handleDeliver(req.id)}
                          className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          {isDelivering ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Deliver</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
