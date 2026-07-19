import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sliders, 
  Save, 
  Loader2, 
  ToggleLeft, 
  ToggleRight, 
  Cpu, 
  Sparkles,
  Info
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface ServiceItem {
  id: string;
  name: string;
  category: 'iPhone' | 'iPad' | 'Mac' | 'Watch';
  cleanPrice: string;
  lostPrice: string;
  successRate: string;
  enabled: boolean;
}

const defaultServices: ServiceItem[] = [
  { id: 'iphone-standard', name: 'iPhone Bypass Standard (v15 - v18)', category: 'iPhone', cleanPrice: '29.00', lostPrice: '39.00', successRate: '98%', enabled: true },
  { id: 'iphone-pro', name: 'iPhone Bypass Premium (v17 - v18.2)', category: 'iPhone', cleanPrice: '39.00', lostPrice: '49.00', successRate: '95%', enabled: true },
  { id: 'ipad-wifi', name: 'iPad WiFi Restore Bypass (All Models)', category: 'iPad', cleanPrice: '19.00', lostPrice: '29.00', successRate: '99%', enabled: true },
  { id: 'ipad-cellular', name: 'iPad Cellular LTE Bypass (A12+)', category: 'iPad', cleanPrice: '34.00', lostPrice: '44.00', successRate: '96%', enabled: true },
  { id: 'macbook-t2', name: 'MacBook T2 Chip Bypass', category: 'Mac', cleanPrice: '59.00', lostPrice: '79.00', successRate: '97%', enabled: false },
];

export default function AdminServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Editor states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'iPhone' | 'iPad' | 'Mac' | 'Watch'>('iPhone');
  const [formCleanPrice, setFormCleanPrice] = useState('');
  const [formLostPrice, setFormLostPrice] = useState('');
  const [formSuccess, setFormSuccess] = useState('98%');
  const [formEnabled, setFormEnabled] = useState(true);

  // Bulk Edit state
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkCategory, setBulkCategory] = useState<'all' | 'iPhone' | 'iPad'>('all');

  // Listen to Services collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const list: ServiceItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ServiceItem);
      });
      
      if (list.length > 0) {
        setServices(list);
        setLoading(false);
      } else {
        // Initialize with default items if collection is empty
        const initDefaults = async () => {
          try {
            for (const item of defaultServices) {
              await setDoc(doc(db, 'services', item.id), item);
            }
          } catch (err) {
            console.error(err);
          }
        };
        initDefaults();
      }
    }, (err) => {
      console.warn("Firestore services read error", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory('iPhone');
    setFormCleanPrice('29.00');
    setFormLostPrice('39.00');
    setFormSuccess('98%');
    setFormEnabled(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: ServiceItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormCleanPrice(item.cleanPrice);
    setFormLostPrice(item.lostPrice);
    setFormSuccess(item.successRate);
    setFormEnabled(item.enabled);
    setIsFormOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const id = editingId || 'srv_' + Date.now();
    const payload: ServiceItem = {
      id,
      name: formName,
      category: formCategory,
      cleanPrice: formCleanPrice,
      lostPrice: formLostPrice,
      successRate: formSuccess,
      enabled: formEnabled
    };

    setLoadingAction('save');
    try {
      await setDoc(doc(db, 'services', id), payload);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service fee config?')) return;
    setLoadingAction('delete_' + id);
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleEnabled = async (item: ServiceItem) => {
    setLoadingAction('toggle_' + item.id);
    try {
      await setDoc(doc(db, 'services', item.id), {
        ...item,
        enabled: !item.enabled
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBulkAdjust = async () => {
    const adjustment = parseFloat(bulkPercent);
    if (isNaN(adjustment)) {
      alert('Please enter a valid number (e.g., 5 or -10 for percent, or flat values).');
      return;
    }

    if (!confirm(`Apply a ${adjustment}% price modification to all matching services?`)) return;
    setLoadingAction('bulk');
    
    try {
      const batch = writeBatch(db);
      services.forEach((s) => {
        if (bulkCategory === 'all' || s.category === bulkCategory) {
          const cleanFloat = parseFloat(s.cleanPrice) || 0;
          const lostFloat = parseFloat(s.lostPrice) || 0;
          
          const newClean = (cleanFloat * (1 + adjustment / 100)).toFixed(2);
          const newLost = (lostFloat * (1 + adjustment / 100)).toFixed(2);
          
          batch.update(doc(db, 'services', s.id), {
            cleanPrice: newClean,
            lostPrice: newLost,
          });
        }
      });
      await batch.commit();
      setBulkPercent('');
      alert('Prices adjusted successfully in bulk!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Intro and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm text-left">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-1.5">
            <Sliders className="w-5 h-5 text-[#1E4DFF]" />
            Device Services & Fee Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Control the unlock prices shown on the user check page. Dynamic database sync.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-[#1E4DFF] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Service Config
        </button>
      </div>

      {/* Main split dashboard: List left, Bulk adjust right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Services List Table */}
        <div className="lg:col-span-8 bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="px-5 py-4 border-b border-slate-50 bg-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Live Price Packages ({services.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Package Name</th>
                  <th className="px-4 py-3 text-right">Clean Fee</th>
                  <th className="px-4 py-3 text-right">Lost Fee</th>
                  <th className="px-4 py-3 text-center">FMI Success</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E4DFF]" />
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No service configurations active.
                    </td>
                  </tr>
                ) : (
                  services.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-50/30 transition duration-150 ${!item.enabled ? 'opacity-50 bg-slate-50/10' : ''}`}>
                      <td className="px-4 py-4">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">
                        ${item.cleanPrice}
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-red-500">
                        ${item.lostPrice}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700">
                        {item.successRate}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          disabled={loadingAction?.startsWith('toggle_')}
                          onClick={() => handleToggleEnabled(item)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {item.enabled ? (
                            <ToggleRight className="w-7 h-7 text-[#1E4DFF]" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="bg-slate-50 hover:bg-[#1E4DFF] hover:text-white border border-slate-100 p-1.5 rounded-lg text-slate-400 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={loadingAction === 'delete_' + item.id}
                            onClick={() => handleDeleteService(item.id)}
                            className="bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 p-1.5 rounded-lg text-red-400 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Modifier & Form Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Form container */}
          {isFormOpen && (
            <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm space-y-4 text-left animate-in slide-in-from-top duration-200">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {editingId ? 'Edit Package Config' : 'Add Price Package'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">SERVICE TITLE</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., iPhone 15 Pro Max Clean"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">CATEGORY</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800"
                    >
                      <option value="iPhone">iPhone</option>
                      <option value="iPad">iPad</option>
                      <option value="Mac">Mac</option>
                      <option value="Watch">Watch</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">FMI SUCCESS RATE</label>
                    <input
                      type="text"
                      required
                      value={formSuccess}
                      onChange={(e) => setFormSuccess(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">CLEAN PRICE ($)</label>
                    <input
                      type="text"
                      required
                      value={formCleanPrice}
                      onChange={(e) => setFormCleanPrice(e.target.value)}
                      placeholder="29.00"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold text-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">LOST PRICE ($)</label>
                    <input
                      type="text"
                      required
                      value={formLostPrice}
                      onChange={(e) => setFormLostPrice(e.target.value)}
                      placeholder="39.00"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold text-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="formEnabled"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E4DFF] focus:ring-[#1E4DFF]"
                  />
                  <label htmlFor="formEnabled" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                    Enable Packages on Website immediately
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loadingAction === 'save'}
                  className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loadingAction === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Package Config
                </button>
              </form>
            </div>
          )}

          {/* Bulk Modifier */}
          <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1 text-[#1E4DFF]">
                <Sparkles className="w-4 h-4 animate-bounce" />
                Bulk Price Adjustment
              </h3>
              <p className="text-[10px] text-slate-400">Modify multiple package pricing formulas instantly in percentage.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">TARGET CATEGORY</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800 font-semibold"
                >
                  <option value="all">All Packages</option>
                  <option value="iPhone">iPhone Packages Only</option>
                  <option value="iPad">iPad Packages Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">ADJUSTMENT PERCENTAGE (%)</label>
                <input
                  type="text"
                  required
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  placeholder="e.g., 10 (increase) or -10 (decrease)"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 font-bold"
                />
              </div>

              <button
                onClick={handleBulkAdjust}
                disabled={loadingAction === 'bulk'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loadingAction === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Recalculate Bulk Matrix
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
