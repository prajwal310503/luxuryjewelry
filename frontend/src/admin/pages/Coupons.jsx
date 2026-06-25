import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { couponAPI, categoryAPI } from '../../services/api';
import Tip from '../components/Tip';

const EMPTY = {
  couponKind: 'global',
  title: '',
  description: '',
  code: '',
  autoGenerate: true,
  type: 'percentage',
  value: 10,
  minOrderAmount: 0,
  usageLimit: 100,
  perUserLimit: 1,
  showOnFrontend: true,
  isActive: true,
  applicableCategories: [],
  applicableProducts: [],
};

const KIND_LABELS = {
  category: 'Type 1 — Category / Product Coupon (6 digit)',
  global: 'Type 2 — Store-wide Coupon (6 digit)',
  gift_card: 'Type 3 — Gift Card (15 digit)',
};

function scopeLabel(c) {
  if (c.couponKind === 'category') {
    const names = c.applicableCategories?.map((x) => x.name).filter(Boolean);
    return names?.length ? names.join(', ') : 'Selected products';
  }
  if (c.couponKind === 'gift_card') return 'All categories';
  return 'All categories';
}

function discountLabel(c) {
  if (c.couponKind === 'gift_card') {
    return `₹${(c.balance ?? c.value ?? 0).toLocaleString('en-IN')}`;
  }
  if (c.type === 'percentage') return `${c.value}%`;
  if (c.type === 'fixed') return `₹${c.value}`;
  return 'Free shipping';
}

function couponToForm(c) {
  return {
    couponKind: c.couponKind || 'global',
    title: c.title || '',
    description: c.description || '',
    code: c.code || '',
    autoGenerate: false,
    type: c.type || 'percentage',
    value: c.couponKind === 'gift_card' ? (c.balance ?? c.value ?? 0) : c.value,
    minOrderAmount: c.minOrderAmount ?? 0,
    usageLimit: c.usageLimit ?? 100,
    perUserLimit: c.perUserLimit ?? 1,
    showOnFrontend: c.showOnFrontend ?? true,
    isActive: c.isActive ?? true,
    applicableCategories: (c.applicableCategories || []).map((x) => (typeof x === 'object' ? x._id : x)),
    applicableProducts: (c.applicableProducts || []).map((x) => (typeof x === 'object' ? x._id : x)),
  };
}

const IcEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IcTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IcEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <Tip label={title}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}
    >
      {children}
    </button>
  </Tip>
);

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewCoupon, setViewCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      couponAPI.adminGetAll({ limit: 100 }),
      categoryAPI.getAll(),
    ])
      .then(([cRes, catRes]) => {
        setCoupons(cRes.data.data || []);
        setCategories(catRes.data.data || catRes.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCategory = (id) => {
    const ids = form.applicableCategories.includes(id)
      ? form.applicableCategories.filter((x) => x !== id)
      : [...form.applicableCategories, id];
    set('applicableCategories', ids);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm(couponToForm(c));
    setShowForm(true);
    setViewCoupon(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const buildPayload = () => {
    const payload = {
      couponKind: form.couponKind,
      title: form.title,
      description: form.description,
      type: form.couponKind === 'gift_card' ? 'fixed' : form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: Number(form.perUserLimit) || 1,
      showOnFrontend: form.couponKind !== 'gift_card' ? form.showOnFrontend : false,
      isActive: form.isActive,
      applicableCategories: form.couponKind === 'category' ? form.applicableCategories : [],
      applicableProducts: form.applicableProducts,
    };
    if (form.couponKind === 'gift_card') {
      payload.balance = Number(form.value);
    }
    if (!editingId && !form.autoGenerate && form.code.trim()) {
      payload.code = form.couponKind === 'gift_card'
        ? form.code.replace(/\D/g, '')
        : form.code.toUpperCase();
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await couponAPI.adminUpdate(editingId, payload);
        toast.success('Updated successfully');
      } else {
        const { data } = await couponAPI.adminCreate(payload);
        toast.success(`Created: ${data.data.code}`);
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err?.message || (editingId ? 'Failed to update' : 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this code?')) return;
    await couponAPI.adminDelete(id);
    toast.success('Deleted');
    load();
  };

  const kindBadge = (k) => ({
    category: 'bg-violet-100 text-violet-700',
    global: 'bg-blue-100 text-blue-700',
    gift_card: 'bg-amber-100 text-amber-800',
  }[k] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Coupons & Gift Cards</h1>
          <p className="text-sm text-gray-500 mt-1">Type 1: category · Type 2: global · Type 3: gift card</p>
        </div>
        <button type="button" onClick={() => (showForm && !editingId ? closeForm() : openCreate())} className="btn-primary text-sm">
          + Create New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-luxury p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading font-bold text-lg">{editingId ? 'Edit Coupon / Gift Card' : 'Create New'}</h2>
            <button type="button" onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Type 1 / 2 / 3 — first */}
            <div className="sm:col-span-2">
              <label className="label-luxury mb-1">Type</label>
              <select
                className="input-luxury w-full"
                value={form.couponKind}
                onChange={(e) => set('couponKind', e.target.value)}
                disabled={!!editingId}
              >
                {Object.entries(KIND_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {/* Title — second */}
            <div className="sm:col-span-2">
              <label className="label-luxury mb-1">Title (shown to customers)</label>
              <input className="input-luxury w-full" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Summer Rings 10% Off" />
            </div>

            {/* Discount Type — third */}
            <div className="sm:col-span-2">
              <label className="label-luxury mb-1">Discount Type</label>
              {form.couponKind === 'gift_card' ? (
                <input className="input-luxury w-full bg-gray-50" value="Flat Amount (₹) — Gift Card" readOnly />
              ) : (
                <select className="input-luxury w-full" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Flat Amount (₹)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              )}
            </div>

            <div>
              <label className="label-luxury mb-1">
                {form.couponKind === 'gift_card'
                  ? 'Gift Card Amount (₹)'
                  : form.type === 'percentage'
                    ? 'Percentage'
                    : 'Amount (₹)'}
              </label>
              <input type="number" className="input-luxury w-full" value={form.value} onChange={(e) => set('value', e.target.value)} min={1} required />
            </div>
            <div>
              <label className="label-luxury mb-1">Min Order (₹)</label>
              <input type="number" className="input-luxury w-full" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} min={0} />
            </div>
            <div>
              <label className="label-luxury mb-1">Usage Limit</label>
              <input type="number" className="input-luxury w-full" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} min={1} />
            </div>
          </div>

          {form.couponKind === 'category' && (
            <div>
              <label className="label-luxury mb-2">Applicable Categories</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-xl">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleCategory(cat._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      form.applicableCategories.includes(cat._id)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            {editingId ? (
              <div className="text-sm">
                <span className="text-gray-500">Code:</span>{' '}
                <span className="font-mono font-bold text-primary">{form.code}</span>
              </div>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.autoGenerate} onChange={(e) => set('autoGenerate', e.target.checked)} />
                  Auto-generate code
                </label>
                {!form.autoGenerate && (
                  <input
                    className="input-luxury flex-1 min-w-[200px]"
                    placeholder={form.couponKind === 'gift_card' ? '15 digit gift code' : '6 char coupon code'}
                    value={form.code}
                    maxLength={form.couponKind === 'gift_card' ? 15 : 6}
                    onChange={(e) => set('code', e.target.value)}
                  />
                )}
              </>
            )}
            {form.couponKind !== 'gift_card' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.showOnFrontend} onChange={(e) => set('showOnFrontend', e.target.checked)} />
                Show on checkout for customers
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
              Active
            </label>
          </div>

          <textarea className="input-luxury w-full resize-none" rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} />

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editingId ? 'Save Changes' : `Create ${form.couponKind === 'gift_card' ? 'Gift Card' : 'Coupon'}`}
          </button>
        </form>
      )}

      {viewCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900">{viewCoupon.title || 'Coupon Details'}</h3>
                <p className="font-mono text-primary font-bold mt-1">{viewCoupon.code}</p>
              </div>
              <button type="button" onClick={() => setViewCoupon(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium capitalize">{viewCoupon.couponKind?.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Discount</dt>
                <dd className="font-medium">{discountLabel(viewCoupon)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Scope</dt>
                <dd className="font-medium text-right">{scopeLabel(viewCoupon)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Min Order</dt>
                <dd className="font-medium">₹{viewCoupon.minOrderAmount?.toLocaleString('en-IN')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Usage</dt>
                <dd className="font-medium">{viewCoupon.usedCount}/{viewCoupon.usageLimit || '∞'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">{viewCoupon.isActive ? 'Active' : 'Inactive'}</dd>
              </div>
              {viewCoupon.description && (
                <div>
                  <dt className="text-gray-500 mb-1">Description</dt>
                  <dd className="text-gray-700">{viewCoupon.description}</dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => openEdit(viewCoupon)} className="btn-primary flex-1 text-sm">Edit</button>
              <button type="button" onClick={() => setViewCoupon(null)} className="btn-outline flex-1 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-luxury overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Type', 'Title', 'Discount', 'Scope', 'Used', 'Min', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-400">No coupons yet</td></tr>
            ) : coupons.map((c) => (
              <tr key={c._id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kindBadge(c.couponKind)}`}>
                    {c.couponKind === 'gift_card' ? 'Gift' : c.couponKind === 'category' ? 'Category' : 'Global'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{c.title || '—'}</td>
                <td className="px-4 py-3 font-medium">{discountLabel(c)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{scopeLabel(c)}</td>
                <td className="px-4 py-3">{c.usedCount}/{c.usageLimit || '∞'}</td>
                <td className="px-4 py-3">₹{c.minOrderAmount}</td>
                <td className="px-4 py-3">{c.isActive ? 'Active' : 'Off'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <IconBtn onClick={() => setViewCoupon(c)} title="View" color="bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <IcEye />
                    </IconBtn>
                    <IconBtn onClick={() => openEdit(c)} title="Edit" color="bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <IcEdit />
                    </IconBtn>
                    <IconBtn onClick={() => handleDelete(c._id)} title="Delete" color="bg-red-50 text-red-500 hover:bg-red-100">
                      <IcTrash />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
