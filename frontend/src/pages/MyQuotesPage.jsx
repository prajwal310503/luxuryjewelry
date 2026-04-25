import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { quoteAPI } from '../services/api';

const STATUS_CONFIG = {
  pending:   { badge: 'bg-amber-100 text-amber-700',   label: 'Pending Review',  desc: 'Your request has been submitted and is awaiting admin review.' },
  reviewed:  { badge: 'bg-blue-100 text-blue-700',     label: 'Under Review',    desc: 'Admin is reviewing your request.' },
  quoted:    { badge: 'bg-purple-100 text-purple-700', label: 'Quoted',          desc: 'Admin has set a price for your request. Awaiting confirmation.' },
  confirmed: { badge: 'bg-green-100 text-green-700',   label: 'Confirmed',       desc: 'Quote confirmed — your order has been created.' },
  rejected:  { badge: 'bg-red-100 text-red-600',       label: 'Rejected',        desc: 'This quote request was rejected.' },
};

const STEPS = ['pending', 'reviewed', 'quoted', 'confirmed'];

function StatusTrack({ status }) {
  if (status === 'rejected') return null;
  const cur = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
            i <= cur ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {i < cur ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span className={`text-[10px] ml-1 mr-2 whitespace-nowrap ${i <= cur ? 'text-primary font-semibold' : 'text-gray-400'}`}>
            {STATUS_CONFIG[s]?.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 rounded ${i < cur ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyQuotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page') || '1');

  const [quotes, setQuotes]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const LIMIT = 10;

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quoteAPI.getMyQuotes({ status: statusFilter, page, limit: LIMIT });
      setQuotes(res.data.data || []);
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
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">My Quote Requests</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} request{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/quotes/request" className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Quote Request
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'pending', 'reviewed', 'quoted', 'confirmed', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s, page: 1 })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {s ? STATUS_CONFIG[s]?.label : 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-luxury p-5">
              <div className="shimmer-text h-4 w-32 rounded mb-3" />
              <div className="shimmer-text h-3 w-full rounded mb-2" />
              <div className="shimmer-text h-3 w-3/4 rounded" />
            </div>
          ))
        ) : quotes.length === 0 ? (
          <div className="card-luxury p-16 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-sm mb-4">No quote requests yet</p>
            <Link to="/quotes/request" className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
              Submit Your First Quote Request
            </Link>
          </div>
        ) : (
          quotes.map((q, i) => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
            return (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-luxury p-5"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {q.status === 'confirmed' && q.orderId && (
                    <Link
                      to={`/orders/${q.orderId._id}`}
                      className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Order #{q.orderId.orderNumber}
                    </Link>
                  )}
                </div>

                {/* Progress track */}
                <StatusTrack status={q.status} />

                {/* Items */}
                {q.items?.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {q.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="font-medium text-gray-800">{item.productName}</span>
                        {item.sku && <span className="text-gray-400 text-xs">SKU: {item.sku}</span>}
                        <span className="text-gray-500 text-xs">×{item.quantity}</span>
                        {item.unitPrice != null && (
                          <span className="text-primary font-semibold text-xs">
                            ₹{item.unitPrice.toLocaleString('en-IN')}/unit
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message */}
                {q.message && (
                  <p className="mt-3 text-sm text-gray-500 italic leading-relaxed">"{q.message}"</p>
                )}

                {/* Admin response */}
                {(q.adminResponse || q.quotedTotal != null) && (
                  <div className="mt-4 p-3.5 rounded-xl border border-blue-100 bg-blue-50">
                    <p className="text-xs font-semibold text-blue-600 mb-1.5">Response from VK Jewellers</p>
                    {q.adminResponse && <p className="text-sm text-blue-900 leading-relaxed">{q.adminResponse}</p>}
                    {q.quotedTotal != null && (
                      <p className="text-base font-bold text-blue-800 mt-2">
                        Total Quoted Price: ₹{q.quotedTotal.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection note */}
                {q.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-600">
                    This quote request has been rejected. You may submit a new request with revised details.
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setSearchParams({ status: statusFilter, page: page - 1 })}
            disabled={page <= 1}
            className="btn-outline text-sm px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setSearchParams({ status: statusFilter, page: page + 1 })}
            disabled={page >= totalPages}
            className="btn-outline text-sm px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
