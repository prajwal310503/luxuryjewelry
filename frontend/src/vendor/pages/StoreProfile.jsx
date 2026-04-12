import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { storeAPI } from '../../services/api';
import Select from '../../components/ui/Select';

const DEFAULT_SERVICES = [
  { icon: 'exchange', title: 'GOLD EXCHANGE' },
  { icon: 'vault',    title: 'VAULT OF DREAMS' },
  { icon: 'carat',    title: 'CARAT TESTER' },
  { icon: 'cleaning', title: 'JEWELRY CLEANING' },
];

export default function VendorStoreProfile() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    hoursDisplay: '10:30 am - 9:30 pm',
    mapLink: '',
    bookingLink: '',
    facilitiesText: '',
    services: DEFAULT_SERVICES,
    rating: '',
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    storeAPI.vendorGetStore()
      .then((r) => {
        const s = r.data.data;
        setStore(s);
        if (s) {
          setForm({
            name: s.name || '',
            tagline: s.tagline || '',
            description: s.description || '',
            address: s.address || '',
            city: s.city || '',
            phone: s.phone || '',
            email: s.email || '',
            hoursDisplay: s.hoursDisplay || '10:30 am - 9:30 pm',
            mapLink: s.mapLink || '',
            bookingLink: s.bookingLink || '',
            facilitiesText: (s.facilities || []).join(', '),
            services: s.services?.length ? s.services : DEFAULT_SERVICES,
            rating: s.rating || '',
          });
          setImagePreview(s.image || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleServiceChange = (idx, field, val) => {
    const svcs = [...form.services];
    svcs[idx] = { ...svcs[idx], [field]: val };
    set('services', svcs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Store name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'services') { fd.append('services', JSON.stringify(v)); }
        else if (k === 'facilitiesText') { fd.append('facilities', v); }
        else if (v !== '' && v !== null && v !== undefined) { fd.append(k, v); }
      });
      if (imageFile) fd.append('image', imageFile);
      await storeAPI.vendorUpsert(fd);
      toast.success('Store profile saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 space-y-4 animate-pulse">
      {[1,2,3,4].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-3xl">

      <div className="mb-8">
        <h1 className="font-heading text-xl font-bold text-gray-900">My Store Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          {store ? 'Update your store info visible to customers.' : 'Set up your store to appear on the home page slider.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Store image */}
        <div>
          <label className="label-luxury">Store Photo</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-primary/40 transition-colors"
            style={{ aspectRatio: '16/6' }}
          >
            {imagePreview
              ? <img src={imagePreview} alt="Store" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Click to upload store photo</p>
                </div>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-full">Change Photo</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-luxury">Store Name *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sky City Borivali Store" className="input-luxury" required />
          </div>
          <div>
            <label className="label-luxury">City</label>
            <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Mumbai" className="input-luxury" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-luxury">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. India's Best Lab Grown Diamond Store" className="input-luxury" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-luxury">Full Address</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="Mall Name, Floor, Area, City — Pincode" className="input-luxury resize-none" />
          </div>
          <div>
            <label className="label-luxury">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Store Hours</label>
            <input type="text" value={form.hoursDisplay} onChange={(e) => set('hoursDisplay', e.target.value)} placeholder="10:30 am - 9:30 pm" className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Google Maps Link</label>
            <input type="url" value={form.mapLink} onChange={(e) => set('mapLink', e.target.value)} placeholder="https://maps.google.com/..." className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Booking Link (optional)</label>
            <input type="url" value={form.bookingLink} onChange={(e) => set('bookingLink', e.target.value)} placeholder="https://calendly.com/..." className="input-luxury" />
          </div>
          <div>
            <label className="label-luxury">Rating (0–5)</label>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} placeholder="4.8" className="input-luxury" />
          </div>
        </div>

        {/* Facilities */}
        <div>
          <label className="label-luxury">Facilities at Store</label>
          <input
            type="text"
            value={form.facilitiesText}
            onChange={(e) => set('facilitiesText', e.target.value)}
            placeholder="Design Your Ring, Open Weekends, Parking Available, Exclusive Offers"
            className="input-luxury"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">Comma-separated list</p>
        </div>

        {/* Services */}
        <div>
          <label className="label-luxury mb-3 block">Services at Store</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.services.map((svc, i) => (
              <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                <Select
                  value={svc.icon}
                  onChange={(e) => handleServiceChange(i, 'icon', e.target.value)}
                  compact
                >
                  <option value="exchange">Gold Exchange</option>
                  <option value="vault">Vault of Dreams</option>
                  <option value="carat">Carat Tester</option>
                  <option value="cleaning">Jewelry Cleaning</option>
                  <option value="diamond">Diamond Testing</option>
                </Select>
                <input
                  type="text"
                  value={svc.title}
                  onChange={(e) => handleServiceChange(i, 'title', e.target.value)}
                  placeholder="Service title"
                  className="input-luxury text-xs py-1.5"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn-primary min-w-[160px]">
            {saving ? 'Saving…' : store ? 'Update Store' : 'Create Store'}
          </button>
        </div>

      </form>
    </div>
  );
}
