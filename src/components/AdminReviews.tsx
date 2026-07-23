import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Star, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Globe,
  Sparkles,
  Award
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface ReviewItem {
  id: string;
  title: string;
  description: string;
  rating: number; // 1 - 5
  country: string; // e.g. US, FR, BR, GB
  completionDate: string;
  images: string[]; // up to 9 mock/url strings
  published: boolean;
}

const defaultReviews: ReviewItem[] = [
  {
    id: 'rev-1',
    title: 'iPhone 13 Pro iCloud FMI off instantly',
    description: 'Unlocked in 5 minutes! The restore tool is super clean and no network bug at all. Will use again for my reseller services.',
    rating: 5,
    country: 'US',
    completionDate: '2026-07-16',
    images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80'],
    published: true,
  },
  {
    id: 'rev-2',
    title: 'Flawless iPad Cellular Activation',
    description: 'My iPad cellular was locked for years. Approved the payment USDT, prepared the custom IPSW and immediately unlocked. Highly recommend.',
    rating: 5,
    country: 'GB',
    completionDate: '2026-07-15',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=300&q=80'],
    published: true,
  }
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Form Editor state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(5);
  const [country, setCountry] = useState('US');
  const [compDate, setCompDate] = useState(new Date().toISOString().substring(0, 10));
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [published, setPublished] = useState(true);

  // Listen to reviews from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const list: ReviewItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ReviewItem);
      });

      if (list.length > 0) {
        setReviews(list.sort((a, b) => b.completionDate.localeCompare(a.completionDate)));
        setLoading(false);
      } else {
        // Hydrate defaults
        const hydrate = async () => {
          try {
            for (const r of defaultReviews) {
              await setDoc(doc(db, 'reviews', r.id), r);
            }
          } catch (err) {
            console.error(err);
          }
        };
        hydrate();
      }
    }, (err) => {
      console.warn("Firestore reviews collection read error", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setRating(5);
    setCountry('US');
    setCompDate(new Date().toISOString().substring(0, 10));
    setImagesList([]);
    setImageUrlInput('');
    setPublished(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (rev: ReviewItem) => {
    setEditingId(rev.id);
    setTitle(rev.title);
    setDescription(rev.description);
    setRating(rev.rating);
    setCountry(rev.country);
    setCompDate(rev.completionDate);
    setImagesList(rev.images || []);
    setImageUrlInput('');
    setPublished(rev.published);
    setIsOpen(true);
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (imagesList.length >= 9) {
      alert('You can only attach up to 9 illustrated proof screenshots per review.');
      return;
    }
    setImagesList((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSampleImage = () => {
    const samples = [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    if (imagesList.length < 9) {
      setImagesList((prev) => [...prev, picked]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const id = editingId || 'rev_' + Date.now();
    const payload: ReviewItem = {
      id,
      title,
      description,
      rating,
      country,
      completionDate: compDate,
      images: imagesList,
      published,
    };

    setLoadingAction('save');
    try {
      await setDoc(doc(db, 'reviews', id), payload);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently purge this review?')) return;
    setLoadingAction('delete_' + id);
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTogglePublish = async (rev: ReviewItem) => {
    setLoadingAction('pub_' + rev.id);
    try {
      await setDoc(doc(db, 'reviews', rev.id), {
        ...rev,
        published: !rev.published,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Intro Greetings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm text-left">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-500" />
            Social Proof Reviews Gallery
          </h2>
          <p className="text-xs text-slate-400">
            Publish, edit, and moderate completion testimonials. Changes propagate automatically to the customer home.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#1E4DFF] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          Create Review Entry
        </button>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Gallery Reviews Grid Layout (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Testimonials Deck ({reviews.length})
            </h4>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E4DFF]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No custom social reviews.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className={`border rounded-2xl p-5 text-left space-y-3.5 flex flex-col justify-between transition relative bg-white ${
                    rev.published ? 'border-slate-100 shadow-sm' : 'border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Flag, Stars, Publish check */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" title={rev.country}>
                          {rev.country === 'US' && '🇺🇸'}
                          {rev.country === 'GB' && '🇬🇧'}
                          {rev.country === 'BR' && '🇧🇷'}
                          {rev.country === 'FR' && '🇫🇷'}
                          {rev.country === 'PL' && '🇵🇱'}
                          {['US', 'GB', 'BR', 'FR', 'PL'].indexOf(rev.country) === -1 && '🌐'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{rev.completionDate}</span>
                      </div>
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Description block */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight leading-tight select-all">
                        {rev.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-3 select-all leading-normal">
                        {rev.description}
                      </p>
                    </div>

                    {/* Screenshot layout */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        {rev.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt="Screenshot" 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1 text-[11px]">
                    <button
                      disabled={loadingAction === 'pub_' + rev.id}
                      onClick={() => handleTogglePublish(rev)}
                      className={`font-black font-mono tracking-tight uppercase cursor-pointer ${
                        rev.published ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {rev.published ? '● Live' : '○ Draft'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(rev)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-50 cursor-pointer"
                        title="Edit Review"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={loadingAction === 'delete_' + rev.id}
                        onClick={() => handleDelete(rev.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Form Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {isOpen ? (
            <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm text-left space-y-4 animate-in slide-in-from-right duration-200">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {editingId ? 'Edit social testimony' : 'Add social testimony'}
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">REVIEW TITLE</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., iPhone 13 FMI successfully unlocked"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">DESCRIPTION</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe client success story in details..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">COUNTRY</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 text-slate-800 font-semibold"
                    >
                      <option value="US">United States 🇺🇸</option>
                      <option value="GB">United Kingdom 🇬🇧</option>
                      <option value="BR">Brazil 🇧🇷</option>
                      <option value="FR">France 🇫🇷</option>
                      <option value="PL">Poland 🇵🇱</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">COMPLETION DATE</label>
                    <input
                      type="date"
                      required
                      value={compDate}
                      onChange={(e) => setCompDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">STARS RATING</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 hover:scale-110 transition cursor-pointer ${
                          star <= rating ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments (up to 9 images) */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold block">SCREENSHOT PROOFS (UP TO 9)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 rounded-xl font-bold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Or generate randomized preview:</span>
                    <button
                      type="button"
                      onClick={handleAddSampleImage}
                      className="text-[#1E4DFF] hover:underline font-bold cursor-pointer"
                    >
                      + Quick Image Mock
                    </button>
                  </div>

                  {imagesList.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {imagesList.map((img, idx) => (
                        <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden h-10 w-full bg-slate-100">
                          <img src={img} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 text-[10px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E4DFF]"
                  />
                  <label htmlFor="published" className="text-[11px] text-slate-600 font-bold cursor-pointer select-none">
                    Publish Immediately (Visible on homepage)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loadingAction === 'save'}
                  className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-black py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
                >
                  {loadingAction === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Social Testimony
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm text-center py-10 text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs font-semibold">Ready to curate social proofs?</p>
              <button
                onClick={handleOpenAdd}
                className="text-xs text-[#1E4DFF] font-black hover:underline cursor-pointer"
              >
                + Create New Review Item
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
