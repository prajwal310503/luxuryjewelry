import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quoteAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const STATUS_BADGE = {
  pending:   'badge bg-amber-100 text-amber-700',
  reviewed:  'badge bg-blue-100 text-blue-700',
  quoted:    'badge bg-purple-100 text-purple-700',
  confirmed: 'badge bg-green-100 text-green-700',
  rejected:  'badge bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  pending:   'Pending',
  reviewed:  'Reviewed',
  quoted:    'Quoted',
  confirmed: 'Confirmed',
  rejected:  'Rejected',
};

function Spinner({ sm }) {
  return (
    <svg className={`${sm ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function calcAutoTotal(items) {
  return items.reduce((sum, i) => sum + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 0), 0);
}

// ── Inline editor for a single quote ─────────────────────────────────────────
function QuoteEditor({ quote, onSaved, onCancel }) {
  const [items, setItems]             = useState(
    quote.items?.length
      ? quote.items.map((it) => ({ ...it, unitPrice: it.unitPrice ?? '' }))
      : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]
  );
  const [adminResponse, setAdminResponse] = useState(quote.adminResponse || '');
  const [quotedTotal, setQuotedTotal]     = useState(quote.quotedTotal ?? '');
  const [status, setStatus]               = useState(quote.status || 'reviewed');
  const [saving, setSaving]               = useState(false);
  const [autoTotal, setAutoTotal]         = useState(false);

  // Keep quotedTotal in sync when auto-total toggled
  useEffect(() => {
    if (autoTotal) setQuotedTotal(calcAutoTotal(items).toFixed(2));
  }, [autoTotal, items]);

  const updateItem = (idx, field, value) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it));
    setItems(next);
    if (autoTotal) setQuotedTotal(calcAutoTotal(next).toFixed(2));
  };

  const addItem = () => setItems([...items, { productName: '', sku: '', quantity: 1, unitPrice: '' }]);

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next.length ? next : [{ productName: '', sku: '', quantity: 1, unitPrice: '' }]);
    if (autoTotal) setQuotedTotal(calcAutoTotal(next).toFixed(2));
  };

  const save = async (confirmOverride = false) => {
    for (const it of items) {
      if (!it.productName?.trim()) { toast.error('Product name is required for each item'); return; }
      if (!it.quantity || parseInt(it.quantity) < 1) { toast.error('Quantity must be ≥ 1'); return; }
    }
    const payload = {
      items: items.map((it) => ({
        product:     it.product?._id || it.product || null,
        productName: it.productName.trim(),
        sku:         it.sku || '',
        quantity:    parseInt(it.quantity),
        unitPrice:   it.unitPrice !== '' ? parseFloat(it.unitPrice) : null,
      })),
      adminResponse,
      quotedTotal:   quotedTotal !== '' ? quotedTotal : null,
      status: confirmOverride ? 'confirmed' : status,
    };
    setSaving(true);
    try {
      await quoteAPI.adminUpdate(quote._id, payload);
      toast.success(confirmOverride ? 'Quote confirmed — order created!' : 'Quote saved');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isAlreadyConfirmed = quote.status === 'confirmed' && quote.orderId;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
      {/* Items table */}
      <div>
        <p className="label-luxury mb-2">Items</p>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={item.productName}
                onChange={(e) => updateItem(idx, 'productName', e.target.value)}
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
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                min={1}
                placeholder="Qty"
                className="input-luxury h-9 px-2.5 text-sm col-span-2"
              />
              <div className="col-span-3 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  placeholder="Unit price"
                  className="input-luxury h-9 pl-6 pr-2.5 text-sm w-full"
                />
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="col-span-1 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="mt-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:text-primary/80 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>

      {/* Quoted Total */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-luxury mb-1">Quoted Total (₹)</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
              <input
                type="number"
                value={quotedTotal}
                onChange={(e) => { setQuotedTotal(e.target.value); setAutoTotal(false); }}
                placeholder="Total amount"
                className="input-luxury h-10 pl-7 pr-3 text-sm w-full"
              />
            </div>
            <button
              onClick={() => { setAutoTotal(!autoTotal); if (!autoTotal) setQuotedTotal(calcAutoTotal(items).toFixed(2)); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                autoTotal ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              Auto-calc
            </button>
          </div>
        </div>
        <div>
          <label className="label-luxury mb-1">Status</label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            compact
            className="w-full h-10"
            disabled={isAlreadyConfirmed}
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Admin Response */}
      <div>
        <label className="label-luxury mb-1">Response / Note to Retailer</label>
        <textarea
          value={adminResponse}
          onChange={(e) => setAdminResponse(e.target.value)}
          rows={3}
          placeholder="Write a response visible to the retailer..."
          className="input-luxury w-full px-3 py-2 text-sm resize-none"
        />
      </div>

      {/* Actions */}
      {isAlreadyConfirmed ? (
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/orders`}
            className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            View Order #{quote.orderId?.orderNumber}
          </Link>
          <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">Close</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="btn-outline text-sm px-5 py-2 flex items-center gap-2"
          >
            {saving ? <Spinner sm /> : null}
            Save Changes
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-green-200"
          >
            {saving ? <Spinner sm /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Confirm &amp; Create Order
          </button>
          <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminQuotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page') || '1');

  const [quotes, setQuotes]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // quote._id being edited
  const LIMIT = 20;

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quoteAPI.adminGetAll({ status: statusFilter, page, limit: LIMIT });
      setQuotes(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total quotes</p>
        </div>
      </div>

      <div className="card-luxury p-4 flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, page: 1 })}
          compact
          className="w-44"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="quoted">Quoted</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-luxury p-5">
              <div className="shimmer-text h-4 w-48 rounded mb-3" />
              <div className="shimmer-text h-3 w-full rounded mb-2" />
              <div className="shimmer-text h-3 w-2/3 rounded" />
            </div>
          ))
        ) : quotes.length === 0 ? (
          <div className="card-luxury p-16 text-center text-gray-400 text-sm">No quote requests found</div>
        ) : (
          quotes.map((q) => {
            const isEditing = editing === q._id;
            return (
              <div key={q._id} className="card-luxury p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={STATUS_BADGE[q.status]}>{STATUS_LABEL[q.status]}</span>
                      {q.orderId && (
                        <span className="badge bg-green-50 text-green-600 border border-green-100">
                          Order #{q.orderId.orderNumber}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Retailer */}
                    <p className="font-medium text-gray-900 text-sm">
                      {q.retailer?.name}
                      <span className="text-gray-400 font-normal"> — {q.retailer?.email}</span>
                      {q.retailer?.phone && <span className="text-gray-400 font-normal"> · {q.retailer?.phone}</span>}
                    </p>

                    {/* Items */}
                    {q.items?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                            <span className="font-medium text-gray-700">{item.productName}</span>
                            {item.sku && <span className="text-gray-400">SKU: {item.sku}</span>}
                            <span>Qty: {item.quantity}</span>
                            {item.unitPrice != null && (
                              <span className="text-primary font-semibold">₹{item.unitPrice.toLocaleString('en-IN')}/unit</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message */}
                    {q.message && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed italic">"{q.message}"</p>
                    )}

                    {/* Admin response + quoted total */}
                    {(q.adminResponse || q.quotedTotal) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        {q.adminResponse && (
                          <>
                            <p className="text-xs font-semibold text-blue-700 mb-1">Admin Response</p>
                            <p className="text-sm text-blue-800">{q.adminResponse}</p>
                          </>
                        )}
                        {q.quotedTotal != null && (
                          <p className="text-sm font-bold text-blue-700 mt-1">
                            Quoted Total: ₹{q.quotedTotal.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEditing(isEditing ? null : q._id)}
                    className="btn-outline text-xs px-3 py-1.5 flex-shrink-0 flex items-center gap-1.5"
                  >
                    {isEditing ? (
                      'Close'
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit / Respond
                      </>
                    )}
                  </button>
                </div>

                {isEditing && (
                  <QuoteEditor
                    quote={q}
                    onSaved={() => { setEditing(null); fetchQuotes(); }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        setPage={(p) => setSearchParams({ status: statusFilter, page: p })}
      />
    </div>
  );
}
