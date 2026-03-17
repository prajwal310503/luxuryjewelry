import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../../services/api';

// ── Position config with recommended sizes ───────────────────────────────────
const POSITIONS_CONFIG = [
  { value: 'hero',         label: 'Hero',         w: 1920, h: 720,  note: 'Full-width homepage slider' },
  { value: 'category',     label: 'Category',     w: 1200, h: 400,  note: 'Category page header' },
  { value: 'sidebar',      label: 'Sidebar',      w: 480,  h: 600,  note: 'Sidebar promo block' },
  { value: 'popup',        label: 'Popup',        w: 640,  h: 480,  note: 'Modal / popup banner' },
  { value: 'notification', label: 'Notification', w: 1920, h: 80,   note: 'Top announcement strip' },
];
const POS_MAP = Object.fromEntries(POSITIONS_CONFIG.map((p) => [p.value, p]));

const EMPTY = {
  title: '', subtitle: '', description: '',
  mediaType: 'image', videoUrl: '',
  ctaText: '', ctaLink: '', ctaStyle: 'primary',
  position: 'hero', alignment: 'center',
  textColor: '#ffffff', overlayColor: 'rgba(0,0,0,0.35)',
  sortOrder: 0, isActive: true,
};

const I = ({ d }) => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const hexFromRgba = (rgba) => {
  if (!rgba) return '#000000';
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgba.startsWith('#') ? rgba : '#000000';
  return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
};
const alphaFromRgba = (rgba) => {
  const m = rgba?.match(/rgba?\([\d\s,]+,\s*([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 0.35;
};
const toRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export default function AdminBanners() {
  const [banners, setBanners]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [overlayHex, setOverlayHex]     = useState('#000000');
  const [overlayAlpha, setOverlayAlpha] = useState(0.35);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await cmsAPI.adminGetBanners(); setBanners(data.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditItem(null); setForm(EMPTY);
    setImageFile(null); setImagePreview(null);
    setOverlayHex('#000000'); setOverlayAlpha(0.35);
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditItem(b);
    setForm({
      title: b.title || '', subtitle: b.subtitle || '', description: b.description || '',
      mediaType: b.mediaType || 'image', videoUrl: b.videoUrl || '',
      ctaText: b.ctaText || '', ctaLink: b.ctaLink || '', ctaStyle: b.ctaStyle || 'primary',
      position: b.position || 'hero', alignment: b.alignment || 'center',
      textColor: b.textColor || '#ffffff', overlayColor: b.overlayColor || 'rgba(0,0,0,0.35)',
      sortOrder: b.sortOrder ?? 0, isActive: b.isActive ?? true,
    });
    setImageFile(null); setImagePreview(null);
    setOverlayHex(hexFromRgba(b.overlayColor));
    setOverlayAlpha(alphaFromRgba(b.overlayColor));
    setShowModal(true);
  };

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const fullForm = { ...form, overlayColor: toRgba(overlayHex, overlayAlpha) };
      let payload;
      if (imageFile) {
        payload = new FormData();
        Object.entries(fullForm).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) payload.append(k, v);
        });
        payload.append('image', imageFile);
      } else {
        payload = { ...fullForm };
      }
      if (editItem) { await cmsAPI.updateBanner(editItem._id, payload); toast.success('Banner updated'); }
      else          { await cmsAPI.createBanner(payload);               toast.success('Banner created'); }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try { await cmsAPI.deleteBanner(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const posInfo = POS_MAP[form.position] || POSITIONS_CONFIG[0];
  const currentPreview = imagePreview || editItem?.image;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hero, sidebar and promotional banners</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <I d="M12 4v16m8-8H4" /> Add Banner
        </button>
      </div>

      {/* Size reference */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-blue-700 mb-2.5">Recommended image sizes</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {POSITIONS_CONFIG.map((p) => (
            <div key={p.value} className="bg-white rounded-lg px-3 py-2 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{p.label}</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{p.w} × {p.h} px</p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banner grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 shimmer-loading rounded-2xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <p className="text-sm">No banners yet. Click "Add Banner" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div key={b._id} className="card-luxury overflow-hidden group rounded-2xl">
              <div className="relative aspect-[16/7] bg-gray-100 overflow-hidden">
                {b.mediaType === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center gap-2 bg-gray-900 text-white/60 text-xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                    Video
                  </div>
                ) : b.image ? (
                  <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs gap-1.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                    No image
                  </div>
                )}
                {/* hover actions */}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)} className="bg-white text-primary text-xs px-3 py-1.5 rounded-lg font-medium">Edit</button>
                  <button onClick={() => handleDelete(b._id)} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Delete</button>
                </div>
                {/* badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="bg-black/55 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{b.position}</span>
                  {b.mediaType !== 'image' && <span className="bg-black/55 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{b.mediaType}</span>}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{b.subtitle}</p>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8" onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-lg font-bold text-gray-900">{editItem ? 'Edit Banner' : 'New Banner'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <I d="M6 18L18 6M6 6l12 12" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* Step 1: Position */}
              <div>
                <label className="label-luxury">Banner Position</label>
                <div className="grid grid-cols-5 gap-2">
                  {POSITIONS_CONFIG.map((p) => (
                    <button key={p.value} type="button" onClick={() => set('position', p.value)}
                      className={`py-2 px-1 rounded-xl border-2 text-center text-xs font-semibold transition-all ${
                        form.position === p.value ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Live size guide */}
                <div className="mt-2 flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span className="text-xs font-bold text-primary">{posInfo.w} × {posInfo.h} px</span>
                  <span className="text-xs text-gray-500">— {posInfo.note}</span>
                </div>
              </div>

              {/* Step 2: Media Type */}
              <div>
                <label className="label-luxury">Media Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'image', label: 'Image', hint: 'JPG · PNG · WebP' },
                    { value: 'gif',   label: 'GIF',   hint: 'Animated GIF' },
                    { value: 'video', label: 'Video', hint: 'MP4 · YouTube' },
                  ].map((t) => (
                    <button key={t.value} type="button" onClick={() => set('mediaType', t.value)}
                      className={`py-2.5 rounded-xl border-2 text-center text-xs font-semibold transition-all ${
                        form.mediaType === t.value ? 'border-primary bg-primary/8 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <div>{t.label}</div>
                      <div className="text-[10px] font-normal opacity-60 mt-0.5">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Upload */}
              {form.mediaType !== 'video' && (
                <div>
                  <label className="label-luxury">{form.mediaType === 'gif' ? 'Animated GIF File' : 'Banner Image'}</label>
                  {currentPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={currentPreview} alt="Preview" className="w-full aspect-[16/6] object-cover" />
                      <button type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); if (editItem) setEditItem({ ...editItem, image: null }); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                      >
                        <I d="M6 18L18 6M6 6l12 12" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                      className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50/60 transition-colors"
                    >
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-1">{form.mediaType === 'gif' ? 'GIF only — keep under 5 MB' : 'JPG, PNG, WebP — max 5 MB'}</p>
                      <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                        Best size: {posInfo.w} × {posInfo.h} px
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept={form.mediaType === 'gif' ? 'image/gif' : 'image/jpeg,image/png,image/webp'} className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])} />
                </div>
              )}

              {/* Video URL */}
              {form.mediaType === 'video' && (
                <div>
                  <label className="label-luxury">Video URL</label>
                  <input type="url" value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)}
                    placeholder="https://youtu.be/... or direct MP4 URL" className="input-luxury" />
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Content</p>
                <div>
                  <label className="label-luxury">Title *</label>
                  <input required type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className="input-luxury" placeholder="e.g. New Diamond Collection" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-luxury">Eyebrow / Tag</label>
                    <input type="text" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} className="input-luxury" placeholder="NEW 2026" />
                  </div>
                  <div>
                    <label className="label-luxury">Description</label>
                    <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} className="input-luxury" placeholder="Short line of text" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-luxury">Button Text</label>
                    <input type="text" value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} className="input-luxury" placeholder="Shop Now" />
                  </div>
                  <div>
                    <label className="label-luxury">Button Link</label>
                    <input type="text" value={form.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} className="input-luxury" placeholder="/collections/rings" />
                  </div>
                </div>
              </div>

              {/* Display */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Display</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-luxury">Alignment</label>
                    <select value={form.alignment} onChange={(e) => set('alignment', e.target.value)} className="input-luxury">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-luxury">Text Color</label>
                    <div className="flex items-center gap-2 h-10 px-3 border border-gray-200 rounded-lg bg-white">
                      <input type="color" value={form.textColor} onChange={(e) => set('textColor', e.target.value)} className="w-6 h-6 rounded border-0 bg-transparent p-0 cursor-pointer" />
                      <span className="text-xs text-gray-500 font-mono">{form.textColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="label-luxury">Sort Order</label>
                    <input type="number" min="0" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-luxury" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label-luxury mb-0">Overlay Opacity</label>
                    <span className="text-xs font-semibold text-primary">{Math.round(overlayAlpha * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={overlayAlpha} onChange={(e) => setOverlayAlpha(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>0% Transparent</span><span>100% Solid</span></div>
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {form.isActive ? 'Active — visible on site' : 'Inactive — hidden from site'}
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5 text-sm">
                  {saving ? 'Saving...' : editItem ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
