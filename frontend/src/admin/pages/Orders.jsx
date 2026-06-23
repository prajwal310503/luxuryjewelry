import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import SelectionBadges from '../../components/product/SelectionBadges';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI, adminAPI, productAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Tip from '../components/Tip';
import Select from '../../components/ui/Select';

const STATUS_COLORS = {
  pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
  shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444',
};

const IcEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IcX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IcPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

// ── Customer search dropdown ──────────────────────────────────────────────────
function CustomerSearch({ value, onChange }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce                = useRef(null);

  const search = (q) => {
    clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getUsers({ search: q, limit: 8 });
        setResults(data.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-800">{value.name}</p>
            <p className="text-xs text-gray-400">{value.email}</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <IcX />
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); setOpen(true); }}
            placeholder="Search by name or email..."
            className="input-luxury w-full h-10 px-3 text-sm"
          />
          {open && (query || results.length > 0) && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-luxury-lg border border-gray-100 max-h-52 overflow-y-auto">
              {loading && <p className="text-xs text-gray-400 px-4 py-3">Searching...</p>}
              {!loading && results.length === 0 && query && <p className="text-xs text-gray-400 px-4 py-3">No users found</p>}
              {results.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onMouseDown={() => { onChange(u); setQuery(''); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Product search dropdown ───────────────────────────────────────────────────
function ProductSearch({ onSelect }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce                = useRef(null);

  const search = (q) => {
    clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.adminGetAll({ search: q, limit: 8, status: 'approved' });
        setResults(data.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  const pick = (p) => {
    onSelect(p);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); setOpen(true); }}
          placeholder="Search product by name..."
          className="input-luxury flex-1 h-9 px-3 text-sm"
        />
      </div>
      {open && (query || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-luxury-lg border border-gray-100 max-h-52 overflow-y-auto">
          {loading && <p className="text-xs text-gray-400 px-4 py-3">Searching...</p>}
          {!loading && results.length === 0 && query && <p className="text-xs text-gray-400 px-4 py-3">No products found</p>}
          {results.map((p) => (
            <button
              key={p._id}
              type="button"
              onMouseDown={() => pick(p)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                <p className="text-xs text-gray-400">SKU: {p.sku} · ₹{(p.discountedPrice || p.price)?.toLocaleString('en-IN')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Order Modal ────────────────────────────────────────────────────────
function CreateOrderModal({ onClose, onCreated }) {
  const [customer, setCustomer]   = useState(null);
  const [items, setItems]         = useState([{ title: '', sku: '', quantity: 1, price: '', product: null, image: '' }]);
  const [address, setAddress]     = useState({ fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', country: 'India' });
  const [payMethod, setPayMethod] = useState('cod');
  const [saving, setSaving]       = useState(false);

  const addProduct = (p) => {
    setItems((prev) => [
      ...prev,
      { product: p._id, title: p.title, sku: p.sku || '', quantity: 1, price: p.discountedPrice || p.price || 0, image: p.images?.[0]?.url || '' },
    ]);
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0), 0);
  const shipping = subtotal >= 5000 ? 0 : 199;
  const total    = subtotal + shipping;

  const handleCreate = async () => {
    if (!customer) { toast.error('Please select a customer'); return; }
    if (items.some((it) => !it.title?.trim())) { toast.error('Product name is required for each item'); return; }
    if (items.some((it) => !it.price || parseFloat(it.price) <= 0)) { toast.error('Price is required for each item'); return; }

    setSaving(true);
    try {
      await orderAPI.adminCreate({
        customerId:      customer._id,
        items:           items.map((it) => ({
          product:  it.product || undefined,
          title:    it.title.trim(),
          sku:      it.sku || '',
          image:    it.image || '',
          quantity: parseInt(it.quantity) || 1,
          price:    parseFloat(it.price) || 0,
        })),
        shippingAddress: address,
        paymentMethod:   payMethod,
      });
      toast.success('Order created successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-heading text-lg font-bold text-gray-900">Create New Order</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <IcX />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer */}
          <div>
            <label className="label-luxury mb-2">Customer *</label>
            <CustomerSearch value={customer} onChange={setCustomer} />
          </div>

          {/* Products */}
          <div>
            <label className="label-luxury mb-2">Add Products</label>
            <ProductSearch onSelect={addProduct} />

            {items.length > 0 && (
              <div className="mt-3 space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 px-1">
                  <span className="col-span-4">Product</span>
                  <span className="col-span-2">SKU</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-3">Price (₹)</span>
                  <span className="col-span-1" />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(idx, 'title', e.target.value)}
                      placeholder="Product name *"
                      className="input-luxury h-9 px-2.5 text-sm col-span-4"
                    />
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="input-luxury h-9 px-2.5 text-sm col-span-2"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="input-luxury h-9 px-2.5 text-sm col-span-2"
                    />
                    <input
                      type="number"
                      value={item.price}
                      min={0}
                      onChange={(e) => updateItem(idx, 'price', e.target.value)}
                      placeholder="0"
                      className="input-luxury h-9 px-2.5 text-sm col-span-3"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="col-span-1 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors mx-auto"
                    >
                      <IcX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { title: '', sku: '', quantity: 1, price: '', product: null, image: '' }])}
              className="mt-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:text-primary/80 transition-colors"
            >
              <IcPlus /> Add Item Manually
            </button>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="label-luxury mb-2">Delivery Address</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'fullName',     label: 'Full Name',    span: 1 },
                { key: 'phone',        label: 'Phone',        span: 1 },
                { key: 'addressLine1', label: 'Address',      span: 2 },
                { key: 'city',         label: 'City',         span: 1 },
                { key: 'state',        label: 'State',        span: 1 },
                { key: 'pincode',      label: 'Pincode',      span: 1 },
                { key: 'country',      label: 'Country',      span: 1 },
              ].map(({ key, label, span }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                  <input
                    type="text"
                    value={address[key]}
                    onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                    placeholder={label}
                    className="input-luxury h-9 px-3 text-sm w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-luxury mb-2">Payment Method</label>
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} compact className="w-full h-10">
                <option value="cod">Cash on Delivery</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Payment</option>
                <option value="quote">Quote</option>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-200"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary flex-1 justify-center disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expandable Order Detail ──────────────────────────────────────────────────
function OrderDetail({ order, onUpdateStatus }) {
  const fmt = (n) => n != null ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Items */}
      <div className="lg:col-span-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</p>
        <div className="space-y-2">
          {order.items?.map((it, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {it.image
                  ? <img src={it.image} alt={it.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{it.title || it.productName}</p>
                <p className="text-xs text-gray-400">{it.sku && `SKU: ${it.sku} · `}Qty: {it.quantity}</p>
                <SelectionBadges selections={it.selections} />
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-800">{fmt((it.price || 0) * it.quantity)}</p>
                <p className="text-xs text-gray-400">{fmt(it.price)} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Summary</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={order.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>{order.shippingCost === 0 ? 'FREE' : fmt(order.shippingCost)}</span></div>
            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-2"><span>Total</span><span>{fmt(order.total)}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Payment method: <span className="font-medium text-gray-700 uppercase">{order.payment?.method || '—'}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Payment status: <span className={`font-semibold ${order.payment?.status === 'paid' ? 'text-green-600' : order.payment?.status === 'failed' ? 'text-red-500' : 'text-amber-600'}`}>{order.payment?.status || 'pending'}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Source: <span className="font-medium text-gray-700 capitalize">{order.source || 'direct'}</span></p>
          </div>
        </div>
        {/* Address */}
        {order.shippingAddress?.fullName && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">{order.shippingAddress.fullName}</span>{order.shippingAddress.phone && <> · {order.shippingAddress.phone}</>}<br />
              {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
            </p>
          </div>
        )}
        <button onClick={onUpdateStatus} className="w-full btn-primary text-sm py-2.5 justify-center">
          Update Order Status
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders,    setOrders]    = useState([]);
  const [meta,      setMeta]      = useState({});
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [statusSaving,  setStatusSaving]  = useState(false);
  const [statusUpdate,  setStatusUpdate]  = useState({ status: '', comment: '' });
  const [showCreate, setShowCreate] = useState(false);

  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page')) || 1;
  const search       = searchParams.get('search') || '';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await orderAPI.adminGetAll(params);
      setOrders(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {} finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openStatus = (order) => {
    setSelected(order);
    setStatusUpdate({ status: order.status, paymentStatus: order.payment?.status || 'pending', comment: '' });
  };

  const handleUpdateStatus = async () => {
    setStatusSaving(true);
    try {
      await orderAPI.adminUpdateStatus(selected._id, {
        status: statusUpdate.status,
        paymentStatus: statusUpdate.paymentStatus,
        comment: statusUpdate.comment,
      });
      toast.success('Order updated successfully');
      setSelected(null);
      fetchOrders();
    } catch (err) {
      console.error('[handleUpdateStatus]', err);
      toast.error(err?.message || 'Failed to update order');
    } finally { setStatusSaving(false); }
  };

  const setPage = (p) => setSearchParams({ status: statusFilter, search, page: p });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Orders</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <IcPlus />
          Create Order
        </button>
      </div>

      <div className="card-luxury p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search order #..."
          value={search}
          onChange={(e) => setSearchParams({ status: statusFilter, search: e.target.value, page: 1 })}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, search, page: 1 })}
          compact
          className="w-44"
        >
          <option value="">All Status</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </Select>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Method', 'Pay Status', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="space-y-2"><div className="shimmer-text h-3.5 w-28 rounded" /><div className="shimmer-text h-2.5 w-36 rounded" /></div></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-6 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-14 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-300">No orders found</td></tr>
              ) : orders.map((order) => {
                const firstItem = order.items?.[0];
                const isOpen    = expanded === order._id;
                return (
                  <Fragment key={order._id}>
                    <tr
                      className={`hover:bg-gray-50/60 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpanded(isOpen ? null : order._id)}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-primary">#{order.orderNumber}</p>
                        {order.source === 'quote' && (
                          <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">From Quote</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800 font-medium">{order.customer?.name}</p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* Item thumbnails stack */}
                          <div className="flex -space-x-2">
                            {order.items?.slice(0, 3).map((it, i) => (
                              <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white overflow-hidden flex-shrink-0">
                                {it.image
                                  ? <img src={it.image} alt={it.title} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" /></svg></div>
                                }
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{firstItem?.title || firstItem?.productName}</p>
                            <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{order.total?.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <span className="badge text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                          {({ cod: 'COD', stripe: 'Online', razorpay: 'Online', wallet: 'Wallet', bank_transfer: 'Bank', quote: 'Quote' })[order.payment?.method] || order.payment?.method || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const s = order.payment?.status;
                          if (s === 'paid')     return <span className="badge text-xs" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>Paid</span>;
                          if (s === 'failed')   return <span className="badge text-xs" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>Failed</span>;
                          if (s === 'refunded') return <span className="badge text-xs" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>Refunded</span>;
                          return <span className="badge text-xs" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>Pending</span>;
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge text-xs capitalize" style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tip label="Update Status">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openStatus(order); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <IcEdit />
                            </button>
                          </Tip>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${order._id}-detail`}>
                        <td colSpan={9} className="p-0">
                          <OrderDetail order={order} onUpdateStatus={() => openStatus(order)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={meta.pages} total={meta.total} shown={orders.length} onPage={setPage} />
      </div>

      {/* Update Status Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-bold">Update Order #{selected.orderNumber}</h3>
              <button type="button" onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <IcX />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Status</label>
                  <Select value={statusUpdate.status} onChange={(e) => { const v = e.target.value; setStatusUpdate((p) => ({ ...p, status: v })); }}>
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                  <Select value={statusUpdate.paymentStatus} onChange={(e) => { const v = e.target.value; setStatusUpdate((p) => ({ ...p, paymentStatus: v })); }}>
                    {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment</label>
                <textarea
                  value={statusUpdate.comment}
                  onChange={(e) => { const v = e.target.value; setStatusUpdate((p) => ({ ...p, comment: v })); }}
                  className="input-luxury resize-none"
                  rows={2}
                  placeholder="Optional comment..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelected(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="button" onClick={handleUpdateStatus} disabled={statusSaving} className="btn-primary flex-1 justify-center disabled:opacity-60">{statusSaving ? 'Updating...' : 'Update'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchOrders}
        />
      )}
    </div>
  );
}
