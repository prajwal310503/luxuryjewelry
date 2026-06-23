import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { categoryAPI } from '../../services/api';
import VendorLayout from '../components/VendorLayout';
import { IconWarning } from '../../components/ui/Icons';

const API = import.meta.env.VITE_API_URL || '/api';

export default function VendorAnalytics() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const map = {
      sales: `${API}/reports/vendor/sales`,
      products: `${API}/reports/vendor/products`,
      customers: `${API}/reports/vendor/customers`,
    };
    axios.get(map[tab], { withCredentials: true })
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [tab]);

  const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  return (
    <VendorLayout>
      <div className="p-6 space-y-5">
        <h1 className="text-xl font-bold">Shop Reports</h1>
        <div className="flex gap-2">
          {['sales', 'products', 'customers'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-gray-900 text-white' : 'bg-white border'}`}>{t}</button>
          ))}
        </div>
        {loading ? <div className="h-40 shimmer-img rounded-xl" /> : (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            {tab === 'sales' && (
              <div>
                <p className="text-2xl font-bold">{fmt(data?.summary?.revenue)}</p>
                <p className="text-sm text-gray-500">Revenue · {data?.summary?.orders || 0} orders · Payout {fmt(data?.summary?.payout)}</p>
              </div>
            )}
            {tab === 'products' && (
              <div className="space-y-2">
                {(data?.products || []).map((p) => (
                  <div key={p._id} className="flex justify-between text-sm py-2 border-b"><span>{p.title}</span><span>{p.totalSold} sold · Stock {p.stock}</span></div>
                ))}
                {data?.lowStock?.length > 0 && (
                  <p className="text-amber-600 text-sm mt-4 flex items-center gap-1.5">
                    <IconWarning className="w-4 h-4 flex-shrink-0" />
                    {data.lowStock.length} low-stock items
                  </p>
                )}
              </div>
            )}
            {tab === 'customers' && (
              <div className="space-y-2">
                {(data?.customers || []).map((c, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b"><span>{c.name}</span><span>{fmt(c.spent)}</span></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export function VendorAddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ title: '', description: '', price: '', stock: 10, category: '', purity: '22kt', metalWeight: 1 });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data?.categories || data.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.category) {
        toast.error('Please select a category');
        setSaving(false);
        return;
      }
      const fd = new FormData();
      Object.entries({ ...form, price: form.price, stock: form.stock, metalWeight: form.metalWeight }).forEach(([k, v]) => {
        if (v !== '' && v != null) fd.append(k, v);
      });
      images.forEach((file) => fd.append('images', file));

      if (id) {
        await axios.put(`${API}/vendor/products/${id}`, fd, { withCredentials: true });
        toast.success('Product updated');
      } else {
        await axios.post(`${API}/vendor/products`, fd, { withCredentials: true });
        toast.success('Product submitted for review');
      }
      navigate('/vendor/products');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <VendorLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold mb-6">{id ? 'Edit Product' : 'Add Product'}</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4 border border-gray-100">
          <input className="input-luxury w-full" placeholder="Product title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          <textarea className="input-luxury w-full resize-none" rows={4} placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <select className="input-luxury w-full" value={form.category} onChange={(e) => set('category', e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" className="input-luxury" placeholder="Price (₹)" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            <input type="number" className="input-luxury" placeholder="Stock" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            <input className="input-luxury" placeholder="Purity e.g. 22kt" value={form.purity} onChange={(e) => set('purity', e.target.value)} />
            <input type="number" className="input-luxury" placeholder="Weight (g)" value={form.metalWeight} onChange={(e) => set('metalWeight', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Images</label>
            <input type="file" accept="image/*" multiple className="input-luxury w-full text-sm" onChange={(e) => setImages(Array.from(e.target.files || []))} />
            {images.length > 0 && <p className="text-xs text-gray-400 mt-1">{images.length} image(s) selected</p>}
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Product'}</button>
        </form>
      </div>
    </VendorLayout>
  );
}

export function VendorCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState('');
  const [value, setValue] = useState(10);

  const load = () => axios.get(`${API}/coupons/vendor`, { withCredentials: true }).then((r) => setCoupons(r.data.data?.coupons || []));

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/coupons/vendor`, { code, type: 'percentage', value, minOrderAmount: 500 }, { withCredentials: true });
    toast.success('Coupon created');
    setCode('');
    load();
  };

  return (
    <VendorLayout>
      <div className="p-6 space-y-5 max-w-xl">
        <h1 className="text-xl font-bold">Shop Coupons</h1>
        <form onSubmit={create} className="flex gap-2">
          <input className="input-luxury flex-1" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          <input type="number" className="input-luxury w-24" value={value} onChange={(e) => setValue(+e.target.value)} />
          <button type="submit" className="btn-primary">Add</button>
        </form>
        {coupons.map((c) => (
          <div key={c._id} className="flex justify-between bg-white p-4 rounded-xl border text-sm">
            <span className="font-mono font-bold">{c.code}</span>
            <span>{c.value}% off · Used {c.usedCount}x</span>
          </div>
        ))}
      </div>
    </VendorLayout>
  );
}
