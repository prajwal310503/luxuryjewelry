import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { storeAPI } from '../../services/api';

const DEFAULT_SERVICES = [
  { icon: 'exchange', title: 'GOLD EXCHANGE' },
  { icon: 'vault',    title: 'VAULT OF DREAMS' },
  { icon: 'carat',    title: 'CARAT TESTER' },
  { icon: 'cleaning', title: 'JEWELRY CLEANING' },
];

const BLANK_FORM = {
  name: '', tagline: '', city: '', address: '', phone: '',
  hoursDisplay: '10:30 am - 9:30 pm', mapLink: '', bookingLink: '',
  facilitiesText: '', services: DEFAULT_SERVICES, rating: '', isFeatured: false,
};

function StoreModal({ store, onSave, onClose }) {
  const [form, setForm] = useState(store
    ? {
        name: store.name || '',
        tagline: store.tagline || '',
        city: store.city || '',
        address: store.address || '',
        phone: store.phone || '',
        hoursDisplay: store.hoursDisplay || '10:30 am - 9:30 pm',
        mapLink: store.mapLink || '',
        bookingLink: store.bookingLink || '',
        facilitiesText: (store.facilities || []).join(', '),
        services: store.services?.length ? store.services : DEFAULT_SERVICES,
        rating: store.rating || '',
        isFeatured: store.isFeatured || false,
      }
    : BLANK_FORM
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(store?.image || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSvc = (idx, field, val) => {
    const s = [...form.services];
    s[idx] = { ...s[idx], [field]: val };
    set('services', s);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'services') fd.append('services', JSON.stringify(v));
        else if (k === 'facilitiesText') fd.append('facilities', v);
        else if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);
      await onSave(fd);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-2xl my-8"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-heading text-lg font-bold text-gray-900">
            {store ? 'Edit Store' : 'Add New Store'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Image */}
          <div>
            <label className="label-luxury">Store Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-primary/40 transition-colors"
              style={{ aspectRatio: '16/6' }}
            >
              {imagePreview
                ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">Click to upload</p>
                  </div>
              }
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Change</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-luxury">Store Name *</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="input-luxury" required />
            </div>
            <div>
              <label className="label-luxury">City</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" className="input-luxury" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-luxury">Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="India's Best Lab Grown Diamond Store" className="input-luxury" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-luxury">Full Address</label>
              <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} className="input-luxury resize-none" placeholder="Mall Name, Floor, Area, City — Pincode" />
            </div>
            <div>
              <label className="label-luxury">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className="input-luxury" />
            </div>
            <div>
              <label className="label-luxury">Store Hours</label>
              <input type="text" value={form.hoursDisplay} onChange={(e) => set('hoursDisplay', e.target.value)} className="input-luxury" />
            </div>
            <div>
              <label className="label-luxury">Google Maps Link</label>
              <input type="url" value={form.mapLink} onChange={(e) => set('mapLink', e.target.value)} className="input-luxury" />
            </div>
            <div>
              <label className="label-luxury">Booking Link</label>
              <input type="url" value={form.bookingLink} onChange={(e) => set('bookingLink', e.target.value)} className="input-luxury" />
            </div>
            <div>
              <label className="label-luxury">Rating (0–5)</label>
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} className="input-luxury" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4 accent-primary" />
              <label htmlFor="featured" className="text-sm text-gray-700 cursor-pointer">Featured store (shown first in slider)</label>
            </div>
          </div>

          <div>
            <label className="label-luxury">Facilities (comma-separated)</label>
            <input
              type="text"
              value={form.facilitiesText}
              onChange={(e) => set('facilitiesText', e.target.value)}
              placeholder="Design Your Ring, Open Weekends, Parking Available"
              className="input-luxury"
            />
          </div>

          <div>
            <label className="label-luxury mb-3 block">Services (up to 4)</label>
            <div className="grid grid-cols-2 gap-3">
              {form.services.map((svc, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <select
                    value={svc.icon}
                    onChange={(e) => handleSvc(i, 'icon', e.target.value)}
                    className="input-luxury text-xs py-1.5"
                  >
                    <option value="exchange">Gold Exchange</option>
                    <option value="vault">Vault of Dreams</option>
                    <option value="carat">Carat Tester</option>
                    <option value="cleaning">Jewelry Cleaning</option>
                    <option value="diamond">Diamond Testing</option>
                  </select>
                  <input
                    type="text"
                    value={svc.title}
                    onChange={(e) => handleSvc(i, 'title', e.target.value)}
                    placeholder="Service title"
                    className="input-luxury text-xs py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary min-w-[120px]">
              {saving ? 'Saving…' : 'Save Store'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    storeAPI.adminGetAll()
      .then((r) => setStores(r.data.data || []))
      .catch(() => toast.error('Failed to load stores'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (fd) => {
    if (editing) {
      await storeAPI.adminUpdate(editing._id, fd);
      toast.success('Store updated');
    } else {
      await storeAPI.adminCreate(fd);
      toast.success('Store created');
    }
    load();
  };

  const handleToggle = async (id) => {
    try {
      await storeAPI.adminToggle(id);
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this store?')) return;
    try {
      await storeAPI.adminDelete(id);
      toast.success('Store deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="p-6 sm:p-8">

      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Store Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage physical stores shown in the home page slider</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Store
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No stores yet. Add your first store location.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <motion.div
              key={store._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card-luxury p-4 flex items-center gap-4 ${!store.isActive ? 'opacity-50' : ''}`}
            >
              {/* Image thumbnail */}
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {store.image
                  ? <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 truncate">{store.name}</p>
                  {store.isFeatured && (
                    <span className="text-[10px] bg-gold/15 text-gold font-semibold px-2 py-0.5 rounded-full">Featured</span>
                  )}
                  {store.vendor && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">Vendor</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{store.city}{store.address ? ` — ${store.address}` : ''}</p>
              </div>

              {/* Status */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {store.isActive ? 'Active' : 'Hidden'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(store._id)}
                  className={`w-8 h-5 rounded-full transition-all duration-200 ${store.isActive ? 'bg-green-400' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${store.isActive ? 'translate-x-3' : 'translate-x-0'}`} />
                </button>
                {/* Edit */}
                <button
                  onClick={() => { setEditing(store); setModalOpen(true); }}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(store._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <StoreModal
            store={editing}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
