import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quoteAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const STATUS_CFG = {
  pending:   { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   label: 'Pending'      },
  reviewed:  { badge: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400',    label: 'Under Review' },
  quoted:    { badge: 'bg-purple-100 text-purple-700 border-purple-200',dot: 'bg-purple-400',  label: 'Price Quoted' },
  confirmed: { badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500',   label: 'Confirmed'    },
  rejected:  { badge: 'bg-red-100 text-red-600 border-red-200',         dot: 'bg-red-400',     label: 'Rejected'     },
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
  const [items, setItems]       = useState(
    orig.length
      ? orig.map((it) => ({ ...it, unitPrice: it.unitPrice ?? '' }))
      : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]
  );
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
          product:     it.product?._id || it.product || null,
          productName: it.productName.trim(),
          sku:         it.sku || '',
          quantity:    parseInt(it.quantity),
          unitPrice:   it.unitPrice !== '' ? parseFloat(it.unitPrice) : null,
          image:       it.image || '',
          originalPrice: it.originalPrice || null,
        })),
        adminResponse,
        quotedTotal:   quotedTotal !== '' ? parseFloat(quotedTotal) : null,
        status: confirm ? 'confirmed' : status,
      });
      toast.success(confirm ? 'Quote confirmed successfully!' : 'Quote saved');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const isAlreadyConfirmed = quote.status === 'confirmed' && quote.orderId;

  return (
    <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">

      {/* Items editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit Quoted Items</p>
          <p className="text-xs text-gray-400">Set unit prices to update quoted amount</p>
        </div>

        {/* Column headers */}
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
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl px-3 py-2">
              {/* Thumbnail */}
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                  {item.image
                    ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                  }
                </div>
                <input
                  type="text"
                  value={item.productName}
                  onChange={(e) => updItem(idx, 'productName', e.target.value)}
                  placeholder="Product name *"
                  className="input-luxury h-8 px-2 text-xs flex-1 min-w-0"
                />
              </div>
              <input
                type="text"
                value={item.sku}
                onChange={(e) => updItem(idx, 'sku', e.target.value)}
                placeholder="SKU"
                className="input-luxury h-8 px-2 text-xs col-span-2"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updItem(idx, 'quantity', e.target.value)}
                min={1}
                className="input-luxury h-8 px-2 text-xs col-span-1"
              />
              {/* Original price — read-only */}
              <div className="col-span-2">
                <div className="h-8 px-2 flex items-center text-xs text-gray-400 bg-white border border-gray-100 rounded-lg">
                  {item.originalPrice ? fmt(item.originalPrice) : '—'}
                </div>
              </div>
              {/* Quoted unit price — editable */}
              <div className="col-span-2 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updItem(idx, 'unitPrice', e.target.value)}
                  placeholder="Unit price"
                  className="input-luxury h-8 pl-5 pr-2 text-xs w-full"
                />
              </div>
              <button
                onClick={() => {
                  const next = items.filter((_, i) => i !== idx);
                  setItems(next.length ? next : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]);
                  if (autoCalc) setQuotedTotal(calcAuto(next).toFixed(2));
                }}
                className="col-span-1 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors mx-auto"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setItems([...items, { productName: '', sku: '', quantity: 1, unitPrice: '' }])}
          className="mt-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>

      {/* Total + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxury mb-1.5">Quoted Total (₹)
            <span className="ml-2 text-[10px] font-normal text-gray-400 normal-case">
              Auto: {fmt(calcAuto(items))}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
              <input
                type="number"
                value={quotedTotal}
                onChange={(e) => { setQuotedTotal(e.target.value); setAutoCalc(false); }}
                placeholder="Total"
                className="input-luxury h-10 pl-7 pr-3 text-sm w-full"
              />
            </div>
            <button
              onClick={() => { setAutoCalc(!autoCalc); setQuotedTotal(calcAuto(items).toFixed(2)); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                autoCalc ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              Auto
            </button>
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
      </div>

      {/* Admin note */}
      <div>
        <label className="label-luxury mb-1.5">Note / Response to Customer</label>
        <textarea
          value={adminResponse}
          onChange={(e) => setAdminResponse(e.target.value)}
          rows={3}
          placeholder="Write a message visible to the customer..."
          className="input-luxury w-full px-3 py-2.5 text-sm resize-none"
        />
      </div>

      {/* Actions */}
      {isAlreadyConfirmed ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {quote.orderId ? `Order #${quote.orderId?.orderNumber} placed` : 'Waiting for customer payment'}
          </div>
          {quote.orderId && <Link to="/admin/orders" className="btn-outline text-sm px-4 py-2">View in Orders</Link>}
          <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">Close</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => save(false)} disabled={saving} className="btn-outline text-sm px-5 py-2 flex items-center gap-2">
            {saving && <Spinner />} Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving} className="btn-primary text-sm px-5 py-2 flex items-center gap-2 bg-green-600 hover:bg-green-700">
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

  const [quotes,  setQuotes]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const LIMIT = 20;

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await quoteAPI.adminGetAll(params);
      setQuotes(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load quotes'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total · review and price customer requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3 items-center">
        <p className="text-sm font-medium text-gray-500">Filter by status:</p>
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

      {/* Quote cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-luxury p-5 space-y-3">
              <div className="shimmer-text h-4 w-48 rounded" />
              <div className="shimmer-text h-3 w-full rounded" />
              <div className="shimmer-text h-3 w-2/3 rounded" />
            </div>
          ))
        ) : quotes.length === 0 ? (
          <div className="card-luxury p-16 text-center text-gray-400 text-sm">No quote requests found</div>
        ) : quotes.map((q) => {
          const cfg       = STATUS_CFG[q.status] || STATUS_CFG.pending;
          const isEditing = editing === q._id;
          const who       = q.customer || q.retailer;
          const itemCount = q.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0;

          return (
            <div key={q._id} className={`card-luxury p-5 ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>

              {/* Top row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">

                  {/* Status + date + order badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {q.orderId && (
                      <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                        Order #{q.orderId.orderNumber || '—'} placed
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Customer */}
                  {who && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{who.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{who.name}</p>
                        <p className="text-xs text-gray-400">{who.email}{who.phone && ` · ${who.phone}`}</p>
                      </div>
                    </div>
                  )}

                  {/* ── CUSTOMER'S ORIGINAL REQUEST ── */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                      Customer Requested — {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {q.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-lg bg-white border border-amber-100 flex-shrink-0 overflow-hidden">
                            {item.image
                              ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              Qty: <strong>{item.quantity}</strong>
                              {item.sku && <> · SKU: {item.sku}</>}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.originalPrice != null && (
                              <p className="text-xs text-gray-400">Listed: <span className="font-medium">{fmt(item.originalPrice)}</span></p>
                            )}
                            {item.unitPrice != null ? (
                              <p className="text-sm font-bold text-primary">Quoted: {fmt(item.unitPrice)}/unit</p>
                            ) : (
                              <p className="text-xs text-amber-500 italic">Not priced yet</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer message */}
                    {q.message && (
                      <p className="mt-2 text-xs text-gray-600 italic border-t border-amber-100 pt-2">
                        "{q.message}"
                      </p>
                    )}
                  </div>

                  {/* Quoted total + Admin note (if set) */}
                  {(q.quotedTotal != null || q.adminResponse) && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Admin Response</p>
                      {q.quotedTotal != null && (
                        <p className="text-sm font-bold text-blue-800 mb-1">
                          Quoted Total: {fmt(q.quotedTotal)}
                        </p>
                      )}
                      {q.adminResponse && (
                        <p className="text-xs text-blue-700 italic">"{q.adminResponse}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditing(isEditing ? null : q._id)}
                  className={`btn-outline text-xs px-3.5 py-2 flex-shrink-0 flex items-center gap-1.5 ${isEditing ? 'border-primary text-primary' : ''}`}
                >
                  {isEditing ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Close</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Price / Edit</>
                  )}
                </button>
              </div>

              {/* Inline editor */}
              {isEditing && (
                <QuoteEditor
                  quote={q}
                  onSaved={() => { setEditing(null); fetchQuotes(); }}
                  onCancel={() => setEditing(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / LIMIT)}
        total={total}
        limit={LIMIT}
        setPage={(p) => setSearchParams({ status: statusFilter, page: p })}
      />
    </div>
  );
}
