import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quoteAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Tip from '../components/Tip';
import Select from '../../components/ui/Select';

const STATUS_CFG = {
  pending:   { bg: '#FEF3C7', color: '#D97706', label: 'Pending'    },
  reviewed:  { bg: '#DBEAFE', color: '#2563EB', label: 'Reviewing'  },
  quoted:    { bg: '#F3E8FF', color: '#7C3AED', label: 'Quoted'     },
  confirmed: { bg: '#D1FAE5', color: '#059669', label: 'Confirmed'  },
  rejected:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected'   },
};

const fmt = (n) => n != null ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function calcAuto(items) {
  return items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 0), 0);
}

// ── Inline Quote Editor ───────────────────────────────────────────────────────
function QuoteEditor({ quote, onSaved, onCancel }) {
  const orig = quote.items || [];
  const [items, setItems]           = useState(orig.length ? orig.map((it) => ({ ...it, unitPrice: it.unitPrice ?? '' })) : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]);
  const [adminResponse, setAdminResponse] = useState(quote.adminResponse || '');
  const [quotedTotal, setQuotedTotal]     = useState(quote.quotedTotal ?? '');
  const [status, setStatus]               = useState(quote.status || 'reviewed');
  const [saving, setSaving]               = useState(false);
  const [autoCalc, setAutoCalc]           = useState(false);

  useEffect(() => { if (autoCalc) setQuotedTotal(calcAuto(items).toFixed(2)); }, [autoCalc, items]);

  const updItem = (idx, field, val) => {
    const next = items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    setItems(next);
    if (autoCalc) setQuotedTotal(calcAuto(next).toFixed(2));
  };

  const save = async (confirm = false) => {
    for (const it of items) {
      if (!it.productName?.trim()) { toast.error('Product name required'); return; }
      if (!it.quantity || parseInt(it.quantity) < 1) { toast.error('Qty must be ≥ 1'); return; }
    }
    if (confirm && (!quotedTotal || parseFloat(quotedTotal) <= 0)) {
      toast.error('Set a quoted total before confirming'); return;
    }
    setSaving(true);
    try {
      await quoteAPI.adminUpdate(quote._id, {
        items: items.map((it) => ({
          product:       it.product?._id || it.product || null,
          productName:   it.productName.trim(),
          sku:           it.sku || '',
          quantity:      parseInt(it.quantity),
          unitPrice:     it.unitPrice !== '' ? parseFloat(it.unitPrice) : null,
          image:         it.image || '',
          originalPrice: it.originalPrice || null,
        })),
        adminResponse,
        quotedTotal: quotedTotal !== '' ? parseFloat(quotedTotal) : null,
        status: confirm ? 'confirmed' : status,
      });
      toast.success(confirm ? 'Quote confirmed!' : 'Quote saved');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const isAlreadyConfirmed = quote.status === 'confirmed' && quote.orderId;

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5 space-y-5">

      {/* Items editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Edit Quoted Items</p>
          <p className="text-xs text-gray-400">Set unit prices to update quoted amount</p>
        </div>
        <div className="hidden md:grid grid-cols-12 gap-2 mb-1.5 px-1">
          <span className="col-span-4 text-[10px] font-semibold text-gray-400 uppercase">Product</span>
          <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase">SKU</span>
          <span className="col-span-1 text-[10px] font-semibold text-gray-400 uppercase">Qty</span>
          <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase">Original ₹</span>
          <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase">Quoted ₹</span>
          <span className="col-span-1" />
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white rounded-xl px-3 py-2 border border-gray-100">
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                  {item.image
                    ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" /></svg></div>
                  }
                </div>
                <input type="text" value={item.productName} onChange={(e) => updItem(idx, 'productName', e.target.value)} placeholder="Product name *" className="input-luxury h-8 px-2 text-xs flex-1 min-w-0" />
              </div>
              <input type="text" value={item.sku} onChange={(e) => updItem(idx, 'sku', e.target.value)} placeholder="SKU" className="input-luxury h-8 px-2 text-xs col-span-2" />
              <input type="number" value={item.quantity} onChange={(e) => updItem(idx, 'quantity', e.target.value)} min={1} className="input-luxury h-8 px-2 text-xs col-span-1" />
              <div className="col-span-2">
                <div className="h-8 px-2 flex items-center text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg">{item.originalPrice ? fmt(item.originalPrice) : '—'}</div>
              </div>
              <div className="col-span-2 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input type="number" value={item.unitPrice} onChange={(e) => updItem(idx, 'unitPrice', e.target.value)} placeholder="Price" className="input-luxury h-8 pl-5 pr-2 text-xs w-full" />
              </div>
              <button onClick={() => { const next = items.filter((_, i) => i !== idx); setItems(next.length ? next : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]); if (autoCalc) setQuotedTotal(calcAuto(next).toFixed(2)); }} className="col-span-1 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors mx-auto">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setItems([...items, { productName: '', sku: '', quantity: 1, unitPrice: '' }])} className="mt-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:opacity-80">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>

      {/* Total + Status + Note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="label-luxury mb-1.5">Quoted Total (₹) <span className="ml-1 text-[10px] font-normal text-gray-400 normal-case">Auto: {fmt(calcAuto(items))}</span></label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
              <input type="number" value={quotedTotal} onChange={(e) => { setQuotedTotal(e.target.value); setAutoCalc(false); }} placeholder="Total" className="input-luxury h-10 pl-7 pr-3 text-sm w-full" />
            </div>
            <button onClick={() => { setAutoCalc(!autoCalc); setQuotedTotal(calcAuto(items).toFixed(2)); }} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${autoCalc ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'}`}>Auto</button>
          </div>
        </div>
        <div>
          <label className="label-luxury mb-1.5">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} compact className="w-full h-10" disabled={isAlreadyConfirmed}>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <div>
          <label className="label-luxury mb-1.5">Note / Response</label>
          <textarea value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} rows={2} placeholder="Message to customer..." className="input-luxury w-full px-3 py-2 text-sm resize-none h-10 leading-tight" style={{ height: 40 }} />
        </div>
      </div>

      {/* Actions */}
      {isAlreadyConfirmed ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {quote.orderId ? `Order #${quote.orderId?.orderNumber || '—'} placed` : 'Waiting for customer payment'}
          </div>
          {quote.orderId && <Link to="/admin/orders" className="btn-outline text-sm px-4 py-2">View in Orders</Link>}
          <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">Close</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => save(false)} disabled={saving} className="btn-outline text-sm px-5 py-2 flex items-center gap-2">{saving && <Spinner />} Save Draft</button>
          <button onClick={() => save(true)} disabled={saving} className="btn-primary text-sm px-5 py-2 flex items-center gap-2" style={{ backgroundColor: '#059669' }}>
            {saving ? <Spinner /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            Confirm Quote
          </button>
          <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminQuotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page') || '1');

  const [quotes,   setQuotes]   = useState([]);
  const [meta,     setMeta]     = useState({});
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 10;

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await quoteAPI.adminGetAll(params);
      setQuotes(data.data || []);
      setMeta(data.meta || {});
    } catch { toast.error('Failed to load quotes'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const setPage = (p) => setSearchParams({ status: statusFilter, page: p });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta.total ?? 0} total · review and price customer requests</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="card-luxury p-4 flex flex-wrap gap-3 items-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter:</p>
        {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'reviewed', l: 'Reviewing' },
          { v: 'quoted', l: 'Quoted' }, { v: 'confirmed', l: 'Confirmed' }, { v: 'rejected', l: 'Rejected' }
        ].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setSearchParams({ status: v, page: 1 })}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              statusFilter === v ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Quote', 'Customer', 'Items', 'Quoted Total', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="space-y-2"><div className="shimmer-text h-3.5 w-28 rounded" /><div className="shimmer-text h-2.5 w-36 rounded" /></div></td>
                    <td className="px-5 py-4"><div className="flex -space-x-2"><div className="shimmer-loading w-8 h-8 rounded-lg" /><div className="shimmer-loading w-8 h-8 rounded-lg" /></div></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : quotes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No quote requests found</td></tr>
              ) : quotes.map((q) => {
                const who     = q.customer || q.retailer;
                const cfg     = STATUS_CFG[q.status] || STATUS_CFG.pending;
                const isOpen  = expanded === q._id;
                const itemCount = q.items?.length || 0;
                const shortId = q._id?.toString().slice(-6).toUpperCase();

                return (
                  <Fragment key={q._id}>
                    <tr
                      className={`hover:bg-gray-50/60 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50/30' : ''}`}
                      onClick={() => setExpanded(isOpen ? null : q._id)}
                    >
                      {/* Quote ID */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-primary">QT-{shortId}</p>
                        {q.orderId && (
                          <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Order placed</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-800 font-medium">{who?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{who?.email}</p>
                      </td>

                      {/* Items thumbnails */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {q.items?.slice(0, 3).map((it, i) => (
                              <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white overflow-hidden flex-shrink-0">
                                {it.image
                                  ? <img src={it.image} alt={it.productName} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" /></svg></div>
                                }
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-[110px]">{q.items?.[0]?.productName}</p>
                            <p className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Quoted Total */}
                      <td className="px-5 py-4">
                        {q.quotedTotal != null
                          ? <span className="text-sm font-semibold text-gray-800">{fmt(q.quotedTotal)}</span>
                          : <span className="text-xs text-amber-500 italic">Not priced</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="badge text-xs" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tip label="Price / Edit">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : q._id); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </Tip>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail + editor */}
                    {isOpen && (
                      <tr key={`${q._id}-detail`}>
                        <td colSpan={7} className="p-0">
                          {/* Customer request recap */}
                          <div className="bg-gray-50 border-t border-gray-100 px-6 pt-5 pb-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                              {/* Items requested */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Customer Requested — {itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                                <div className="space-y-2">
                                  {q.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                      <div className="w-10 h-10 rounded-lg bg-white border border-amber-100 flex-shrink-0 overflow-hidden">
                                        {item.image
                                          ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                          : <div className="w-full h-full flex items-center justify-center"><svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" /></svg></div>
                                        }
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                                        <p className="text-xs text-gray-500">Qty: <strong>{item.quantity}</strong>{item.sku && <> · SKU: {item.sku}</>}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        {item.originalPrice != null && <p className="text-xs text-gray-400">Listed: <span className="font-medium">{fmt(item.originalPrice)}</span></p>}
                                        {item.unitPrice != null
                                          ? <p className="text-sm font-bold text-primary">Quoted: {fmt(item.unitPrice)}/unit</p>
                                          : <p className="text-xs text-amber-500 italic">Not priced yet</p>
                                        }
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {q.message && (
                                  <p className="mt-2 text-xs text-gray-500 italic bg-white border border-gray-100 rounded-xl px-3 py-2">"{q.message}"</p>
                                )}
                              </div>

                              {/* Admin response + address */}
                              <div className="space-y-3">
                                {(q.quotedTotal != null || q.adminResponse) && (
                                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Admin Response</p>
                                    {q.quotedTotal != null && <p className="text-sm font-bold text-blue-800 mb-1">Quoted Total: {fmt(q.quotedTotal)}</p>}
                                    {q.adminResponse && <p className="text-xs text-blue-700 italic">"{q.adminResponse}"</p>}
                                  </div>
                                )}
                                {q.shippingAddress?.fullName && (
                                  <div className="bg-white border border-gray-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Delivery Address</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      <span className="font-semibold">{q.shippingAddress.fullName}</span>{q.shippingAddress.phone && <> · {q.shippingAddress.phone}</>}<br />
                                      {q.shippingAddress.addressLine1}<br />
                                      {q.shippingAddress.city}, {q.shippingAddress.state} — {q.shippingAddress.pincode}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Editor */}
                          <QuoteEditor
                            quote={q}
                            onSaved={() => { setExpanded(null); fetchQuotes(); }}
                            onCancel={() => setExpanded(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={meta.pages} total={meta.total} shown={quotes.length} onPage={setPage} />
      </div>
    </div>
  );
}
