import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldAlert, 
  Save, 
  Loader2, 
  Wrench, 
  Globe, 
  MessageCircle, 
  Send, 
  Percent, 
  Coins, 
  FileText, 
  Terminal, 
  Lock, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';
import { ActivityLog } from '../types';

interface AdminSettingsProps {
  activityLogs: ActivityLog[];
}

interface SiteSettingsPayload {
  siteName: string;
  logoUrl: string;
  announcement: string;
  maintenanceMode: boolean;
  serverVersion: string;
  serverStatus: 'online' | 'offline';
  whatsApp: string;
  telegram: string;
  email: string;
  resellerDiscount: string;
  registrationFee: string;
  sessionTimeout: string;
  twoFactorEnabled: boolean;
}

const defaultSettings: SiteSettingsPayload = {
  siteName: '3uUnlocks Pro',
  logoUrl: '',
  announcement: '💥 Instant FMI Lock Off services are fully online. Setup takes less than 5 minutes!',
  maintenanceMode: false,
  serverVersion: 'v4.8.2',
  serverStatus: 'online',
  whatsApp: '+1 (555) 304-4456',
  telegram: 'https://t.me/three_u_unlocks_channel',
  email: 'support@threeuunlocks.io',
  resellerDiscount: '15',
  registrationFee: '5.00',
  sessionTimeout: '30',
  twoFactorEnabled: false
};

export default function AdminSettings({
  activityLogs
}: AdminSettingsProps) {
  const [activeSubView, setActiveSubView] = useState<'general' | 'security'>('general');
  const [settings, setSettings] = useState<SiteSettingsPayload>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Read Site Settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_configs', 'general'), (snap) => {
      if (snap.exists()) {
        setSettings({ ...defaultSettings, ...snap.data() } as SiteSettingsPayload);
      } else {
        // Hydrate default
        setDoc(doc(db, 'site_configs', 'general'), defaultSettings);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore site_configs read blocked", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_configs', 'general'), settings);
      alert('Website parameters and configurations successfully applied in database!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const updated = { ...settings, maintenanceMode: !settings.maintenanceMode };
    setSettings(updated);
    try {
      await setDoc(doc(db, 'site_configs', 'general'), { maintenanceMode: !settings.maintenanceMode }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleServerStatus = async () => {
    const newStatus = settings.serverStatus === 'online' ? 'offline' : 'online';
    const updated = { ...settings, serverStatus: newStatus };
    setSettings(updated);
    try {
      await setDoc(doc(db, 'site_configs', 'general'), { serverStatus: newStatus }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle2FA = async () => {
    const updated = { ...settings, twoFactorEnabled: !settings.twoFactorEnabled };
    setSettings(updated);
    try {
      await setDoc(doc(db, 'site_configs', 'general'), { twoFactorEnabled: !settings.twoFactorEnabled }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Tab select bar */}
      <div className="bg-white p-3.5 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubView('general')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeSubView === 'general' 
                ? 'bg-[#1E4DFF] text-white' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            General Site Parameters
          </button>
          <button
            onClick={() => setActiveSubView('security')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeSubView === 'security' 
                ? 'bg-[#1E4DFF] text-white' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Security Audits & Activity
          </button>
        </div>
        <div className="text-xs font-mono font-bold text-slate-400 hidden sm:block">
          CONFIGURATION PANEL
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[20px] p-16 text-center border border-slate-100">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E4DFF]" />
        </div>
      ) : activeSubView === 'general' ? (
        // GENERAL SETTINGS VIEW
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
          
          {/* Main settings options (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-[#1E4DFF]" />
              Branding & General Setup
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">WEBSITE TITLE NAME</label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">LOGO URL ACCS</label>
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="Defaults to standard 3uUnlocks SVG icon"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-400 font-bold block">HOMEPAGE ANNOUNCEMENT FLASH BAR</label>
              <textarea
                rows={2}
                value={settings.announcement}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            {/* Support nodes */}
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pt-3 pb-3 flex items-center gap-1.5">
              <MessageCircle className="w-4.5 h-4.5 text-indigo-500" />
              Customer Contact Links
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">WHATSAPP CHAT</label>
                <input
                  type="text"
                  value={settings.whatsApp}
                  onChange={(e) => setSettings({ ...settings, whatsApp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">TELEGRAM LINK</label>
                <input
                  type="text"
                  value={settings.telegram}
                  onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">SUPPORT EMAIL</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-slate-50 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Apply Site Configurations
              </button>
            </div>
          </div>

          {/* Right sidebar options (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* System Status Controls */}
            <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Site System Control
              </h3>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Maintenance Mode
                  </span>
                  <span className="text-[10px] text-slate-400 block max-w-[150px]">Locks client views with warning splash screen.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition ${
                    settings.maintenanceMode
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {settings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Globe className="w-4 h-4 text-[#1E4DFF]" />
                    Server Status
                  </span>
                  <span className="text-[10px] text-slate-400 block max-w-[150px]">Updates FMI status block and restricts device checks in real time.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleServerStatus}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition ${
                    settings.serverStatus === 'offline'
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {settings.serverStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-left">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-bold font-mono text-[9px]">SERVER BUILD</span>
                  <span className="text-xs font-bold text-slate-800 block">{settings.serverVersion}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-bold font-mono text-[9px]">FMI STATE</span>
                  <span className={`text-xs font-black uppercase block ${settings.serverStatus === 'offline' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {settings.serverStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Commissions configurations */}
            <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Service Commission Levels
              </h3>

              <div className="space-y-3.5 text-xs text-left">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    RESELLER DISCOUNT (%)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.resellerDiscount}
                    onChange={(e) => setSettings({ ...settings, resellerDiscount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold text-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    REGISTRATION ENTRY FEE (USDT)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.registrationFee}
                    onChange={(e) => setSettings({ ...settings, registrationFee: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold text-emerald-600"
                  />
                </div>
              </div>
            </div>

          </div>
        </form>
      ) : (
        // SECURITY & LOGS VIEW
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
          
          {/* IP Logs and system events ledger (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 bg-white">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Terminal className="w-4 h-4" />
                Security Activity logs ledger ({activityLogs.length})
              </h4>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-mono">
                    <th className="px-4 py-3">Timestamp (UTC)</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">IP Location Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium font-mono text-[11px]">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">No events log active.</td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition">
                        <td className="px-4 py-3.5 text-slate-400">
                          {log.time.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {log.user}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                            log.type === 'error' ? 'bg-red-50 text-red-700' :
                            log.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-bold truncate max-w-[180px]" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar security policy (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Session Control Policy
              </h3>
              <p className="text-[10px] text-slate-400">Lock administrative node session tokens after periods of inactivity.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block font-mono text-[9px]">SESSION TIMEOUT (MINUTES)</label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800 font-bold"
                >
                  <option value="15">15 Minutes (Stripe standard)</option>
                  <option value="30">30 Minutes (Supabase standard)</option>
                  <option value="60">60 Minutes</option>
                  <option value="never">Never Timeout</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    Administrative 2FA Setup
                  </span>
                  <span className="text-[10px] text-slate-400 block max-w-[150px]">Enforce OTP codes upon browser session restart.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition ${
                    settings.twoFactorEnabled
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {settings.twoFactorEnabled ? 'ENFORCED' : 'DISABLED'}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-[10px] font-black text-amber-800 uppercase block font-mono">Failed login counter</span>
                  <p className="text-[10px] text-amber-700/80 leading-normal mt-0.5">The security server has detected <strong className="text-red-700 font-black">0</strong> failed root logins over the past 48 hours. Node is secure.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
