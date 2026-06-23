import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { couponAPI } from '../../services/api';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 10, minOrderAmount: 0, usageLimit: 100 });
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    couponAPI.adminGetAll().then(({ data }) => setCoupons(data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await couponAPI.adminCreate(form);
      toast.success('Coupon created');
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await couponAPI.adminDelete(id);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Coupon Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">+ New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card-luxury p-5 grid sm:grid-cols-2 gap-4">
          <input className="input-luxury" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <select className="input-luxury" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <input type="number" className="input-luxury" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} required />
          <input type="number" className="input-luxury" placeholder="Min order" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: +e.target.value })} />
          <input type="number" className="input-luxury" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: +e.target.value })} />
          <button type="submit" className="btn-primary sm:col-span-2">Create Coupon</button>
        </form>
      )}

      <div className="card-luxury overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            {['Code', 'Type', 'Value', 'Used', 'Min Order', 'Status', ''].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : coupons.map((c) => (
              <tr key={c._id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3 capitalize">{c.type}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-4 py-3">{c.usedCount}/{c.usageLimit || '∞'}</td>
                <td className="px-4 py-3">₹{c.minOrderAmount}</td>
                <td className="px-4 py-3">{c.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(c._id)} className="text-red-500 text-xs hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
