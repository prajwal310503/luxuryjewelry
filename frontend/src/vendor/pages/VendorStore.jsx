import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { IconStore } from '../../components/ui/Icons';

const API = import.meta.env.VITE_API_URL || '/api';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

export default function VendorStore() {
  const [store, setStore]   = useState(null);
  const [form, setForm]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [logoFile, setLogoFile]     = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview]     = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    axios.get(`${API}/vendor/store`, { withCredentials: true })
      .then(({ data }) => {
        setStore(data.data);
        setForm({
          name: data.data?.name || '',
          description: data.data?.description || '',
          phone: data.data?.phone || '',
          email: data.data?.email || '',
          address: data.data?.address || '',
          city: data.data?.city || '',
          state: data.data?.state || '',
          pincode: data.data?.pincode || '',
          website: data.data?.website || '',
          instagram: data.data?.instagram || '',
        });
        setLogoPreview(data.data?.logo || null);
        setBannerPreview(data.data?.banner || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url); }
    else { setBannerFile(file); setBannerPreview(url); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile)   fd.append('logo', logoFile);
      if (bannerFile) fd.append('banner', bannerFile);
      await axios.put(`${API}/vendor/store`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Store profile updated!');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="shimmer-text h-12 rounded-xl" />)}
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store details and branding</p>
        </div>

        {/* Store Status banner */}
        {store?.status && store.status !== 'approved' && (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-700 capitalize">Store Status: {store.status}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {store.status === 'pending' ? 'Your store is under review. You can still update your profile.' :
                  store.status === 'rejected' ? `Reason: ${store.rejectedReason || 'Contact support for details.'}` :
                  'Store is suspended. Contact support.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Banner upload */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="relative h-44 bg-gray-100 overflow-hidden">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Store Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-300 text-sm">No banner uploaded</p>
                </div>
              )}
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                <div className="bg-black/50 text-white text-xs font-semibold px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Change Banner (1200×400)
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'banner')} />
              </label>
            </div>
            {/* Logo overlay */}
            <div className="px-5 py-4 flex items-end gap-4 -mt-10 relative z-10">
              <label className="cursor-pointer group flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-200">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-400"><IconStore className="w-8 h-8" /></div>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
                <p className="text-[10px] text-gray-400 mt-1 text-center group-hover:text-gray-600 transition-colors">Change Logo</p>
              </label>
              <div className="pb-1">
                <p className="font-bold text-gray-900">{form.name || store?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{store?.slug && `luxuryjewelry.com/stores/${store.slug}`}</p>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="font-bold text-gray-900 text-sm">Basic Information</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-luxury">Shop Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)}
                  required className="input-luxury w-full" placeholder="Your Jewellery Store" />
              </div>
              <div className="sm:col-span-2">
                <label className="label-luxury">Store Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                  rows={3} className="input-luxury w-full resize-none"
                  placeholder="Tell customers about your store, specialities, craftsmanship…" />
              </div>
              <div>
                <label className="label-luxury">Contact Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className="input-luxury w-full" placeholder="store@email.com" />
              </div>
              <div>
                <label className="label-luxury">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  className="input-luxury w-full" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="label-luxury">Website (optional)</label>
                <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)}
                  className="input-luxury w-full" placeholder="https://yourstore.com" />
              </div>
              <div>
                <label className="label-luxury">Instagram (optional)</label>
                <input value={form.instagram} onChange={(e) => set('instagram', e.target.value)}
                  className="input-luxury w-full" placeholder="@yourstoreig" />
              </div>
            </div>
          </motion.div>

          {/* Address */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-4" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="font-bold text-gray-900 text-sm">Store Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-luxury">Street Address</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)}
                  className="input-luxury w-full" placeholder="Street address, area, landmark" />
              </div>
              <div>
                <label className="label-luxury">City</label>
                <input value={form.city} onChange={(e) => set('city', e.target.value)}
                  className="input-luxury w-full" placeholder="Mumbai" />
              </div>
              <div>
                <label className="label-luxury">State</label>
                <select value={form.state} onChange={(e) => set('state', e.target.value)}
                  className="input-luxury w-full">
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-luxury">Pincode</label>
                <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)}
                  maxLength={6} className="input-luxury w-full" placeholder="400001" />
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg,#1a0e08,#3a2520)', boxShadow: '0 4px 16px rgba(26,14,8,0.3)' }}>
              {saving ? 'Saving…' : 'Save Store Profile'}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
