import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../services/api';
import { IconStore } from '../../components/ui/Icons';

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
    vendorAPI.getStore()
      .then(({ data }) => {
        const s = data.data?.store || data.data;
        setStore(s);
        setForm({
          name: s?.name || '',
          description: s?.description || '',
          phone: s?.phone || '',
          email: s?.email || '',
          address: s?.address || '',
          city: s?.city || '',
          state: s?.state || '',
          pincode: s?.pincode || '',
          website: s?.website || '',
          instagram: s?.instagram || '',
        });
        setLogoPreview(s?.logo || null);
        setBannerPreview(s?.banner || null);
      })
      .catch(() => toast.error('Failed to load store'))
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
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (logoFile)   fd.append('logo', logoFile);
      if (bannerFile) fd.append('banner', bannerFile);
      const { data } = await vendorAPI.updateStore(fd);
      const s = data.data?.store || data.data;
      setStore(s);
      toast.success('Store profile updated!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store details and branding</p>
        </div>

        {store?.status && store.status !== 'approved' && (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <IconStore className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 capitalize">Store Status: {store.status}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {store.status === 'pending' ? 'Your store is under review. You can still update your profile.' :
                  store.status === 'rejected' ? `Reason: ${store.rejectedReason || 'Contact support for details.'}` :
                  'Contact support if you need help.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-6 space-y-5 border border-gray-100">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
              {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <IconStore className="w-6 h-6 text-gray-300" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.name || store?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{store?.slug && `/stores/${store.slug}`}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-luxury">Store Name</label>
              <input className="input-luxury w-full" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label-luxury">Description</label>
              <textarea rows={3} className="input-luxury w-full" value={form.description || ''} onChange={(e) => set('description', e.target.value)}
                placeholder="Tell customers about your store, specialities, craftsmanship…" />
            </div>
            <div>
              <label className="label-luxury">Phone</label>
              <input className="input-luxury w-full" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label-luxury">Email</label>
              <input className="input-luxury w-full" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="store@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-luxury">Address</label>
              <input className="input-luxury w-full" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label-luxury">City</label>
              <input className="input-luxury w-full" value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label className="label-luxury">State</label>
              <select className="input-luxury w-full" value={form.state || ''} onChange={(e) => set('state', e.target.value)}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-luxury">Pincode</label>
              <input className="input-luxury w-full" value={form.pincode || ''} onChange={(e) => set('pincode', e.target.value)} />
            </div>
            <div>
              <label className="label-luxury">Website</label>
              <input className="input-luxury w-full" value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://yourstore.com" />
            </div>
            <div>
              <label className="label-luxury">Instagram</label>
              <input className="input-luxury w-full" value={form.instagram || ''} onChange={(e) => set('instagram', e.target.value)} placeholder="@yourstoreig" />
            </div>
            <div>
              <label className="label-luxury">Logo</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="text-sm" />
            </div>
            <div>
              <label className="label-luxury">Banner</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} className="text-sm" />
              {bannerPreview && <img src={bannerPreview} alt="" className="mt-2 h-20 w-full object-cover rounded-lg" />}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#1a0e08,#3a2520)' }}>
              {saving ? 'Saving…' : 'Save Store Profile'}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
