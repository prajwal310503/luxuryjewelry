import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../services/api';

const EMPTY = {
  title: '',
  code: '',
  type: 'percentage',
  value: 10,
  minOrderAmount: 0,
  usageLimit: 50,
  isActive: true,
};

export default function VendorCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await vendorAPI.getCoupons();
      setCoupons(data.data?.coupons || data.data || []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await vendorAPI.createCoupon({
        ...form,
        couponKind: 'global',
        autoGenerate: !form.code.trim(),
        code: form.code.trim().toUpperCase() || undefined,
        value: Number(form.value) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
      });
      toast.success('Coupon created');
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await vendorAPI.deleteCoupon(id);
      toast.success('Coupon deleted');
      load();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Coupons</h1>
            <p className="text-sm text-gray-500 mt-0.5">Discount codes for customers buying your products</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#a07828)' }}
          >
            {showForm ? 'Cancel' : '+ New Coupon'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 space-y-4 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Title</label>
                <input className="input-luxury" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Festive 10% off" />
              </div>
              <div>
                <label className="label-luxury">Code (optional)</label>
                <input className="input-luxury uppercase" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="Auto-generate if empty" />
              </div>
              <div>
                <label className="label-luxury">Type</label>
                <select className="input-luxury" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="percentage">Percentage %</option>
                  <option value="fixed">Fixed ₹</option>
                </select>
              </div>
              <div>
                <label className="label-luxury">Value</label>
                <input type="number" min="0" className="input-luxury" value={form.value} onChange={(e) => set('value', e.target.value)} />
              </div>
              <div>
                <label className="label-luxury">Min order (₹)</label>
                <input type="number" min="0" className="input-luxury" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} />
              </div>
              <div>
                <label className="label-luxury">Usage limit</label>
                <input type="number" min="0" className="input-luxury" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60">
              {saving ? 'Saving…' : 'Create Coupon'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 shimmer-img rounded-xl" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
            <p className="text-gray-500 font-semibold">No coupons yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a code to boost sales</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 divide-y divide-gray-50">
            {coupons.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{c.title || c.code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono font-semibold text-primary">{c.code}</span>
                    {' · '}
                    {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                    {c.isActive === false ? ' · Inactive' : ''}
                  </p>
                </div>
                <button type="button" onClick={() => handleDelete(c._id)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
