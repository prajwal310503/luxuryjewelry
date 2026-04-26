import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { quoteAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const STATUS_CONFIG = {
  pending:   { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  label: 'Pending Review' },
  reviewed:  { badge: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400',   label: 'Under Review'   },
  quoted:    { badge: 'bg-purple-100 text-purple-700 border-purple-200',dot: 'bg-purple-400', label: 'Price Quoted'   },
  confirmed: { badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500',  label: 'Confirmed'      },
  rejected:  { badge: 'bg-red-100 text-red-600 border-red-200',         dot: 'bg-red-400',    label: 'Not Accepted'   },
};

const FILTERS = [
  { value: '',          label: 'All Quotes' },
  { value: 'pending',   label: 'Pending'    },
  { value: 'reviewed',  label: 'Reviewing'  },
  { value: 'quoted',    label: 'Quoted'     },
  { value: 'confirmed', label: 'Confirmed'  },
  { value: 'rejected',  label: 'Rejected'   },
];

const LIMIT = 10;

export default function MyQuotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page') || '1');

  const [quotes,  setQuotes]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await quoteAPI.getMyQuotes(params);
      setQuotes(res.data.data || []);
      setTotal(res.data.pagination?.total ?? res.data.data?.length ?? 0);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const totalPages = Math.ceil(total / LIMIT);
  const setFilter = (val) => {
    const p = { page: 1 };
    if (val) p.status = val;
    setSearchParams(p);
  };
  const setPage = (p) => {
    const sp = { page: p };
    if (statusFilter) sp.status = statusFilter;
    setSearchParams(sp);
  };

  const start = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const end   = Math.min(page * LIMIT, total);

  return (
    <>
      <Helmet><title>My Quote Requests | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">My Quote Requests</h1>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Loading…' : `${total} request${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link to="/checkout" className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </Link>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                statusFilter === f.value
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="card-luxury overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="col-span-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Items</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Action</div>
          </div>

          {/* Rows */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0 flex items-center gap-4">
                    <div className="shimmer-text h-4 w-16 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="shimmer-text h-4 w-3/4 rounded" />
                      <div className="shimmer-text h-3 w-1/2 rounded" />
                    </div>
                    <div className="shimmer-text h-4 w-20 rounded flex-shrink-0" />
                  </div>
                ))}
              </motion.div>
            ) : quotes.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-semibold text-gray-700 mb-1">No quote requests found</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {statusFilter ? `No ${STATUS_CONFIG[statusFilter]?.label || statusFilter} quotes.` : 'Start shopping to request a quote.'}
                </p>
                <div className="flex gap-3 justify-center">
                  {statusFilter && (
                    <button onClick={() => setFilter('')} className="btn-outline text-sm px-5 py-2.5">
                      Clear Filter
                    </button>
                  )}
                  <Link to="/collections" className="btn-primary text-sm px-5 py-2.5">
                    Start Shopping
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {quotes.map((q, i) => {
                  const cfg              = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
                  const isConfirmedNoPay = q.status === 'confirmed' && !q.orderId;
                  const isOrderPlaced    = q.status === 'confirmed' && q.orderId;
                  const itemCount        = q.items?.reduce((s, it) => s + it.quantity, 0) || 0;
                  const firstItem        = q.items?.[0];

                  return (
                    <motion.div
                      key={q._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={`/quotes/${q._id}`}
                        className={`flex md:grid md:grid-cols-12 gap-6 px-6 py-4 border-b border-gray-50 last:border-0 
                          hover:bg-luxury-cream/50 transition-colors cursor-pointer items-center group
                          ${isConfirmedNoPay ? 'bg-green-50/40 hover:bg-green-50/70' : ''}`}
                      >
                        {/* Items */}
                        <div className="md:col-span-5 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            {/* Serial */}
                            <span className="hidden md:block text-xs font-mono text-gray-400 flex-shrink-0 w-5 text-right">
                              {(page - 1) * LIMIT + i + 1}.
                            </span>
                            {/* Thumbnail */}
                            <div className="w-11 h-11 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0 border border-gray-100">
                              {firstItem?.image
                                ? <img src={firstItem.image} alt={firstItem.productName} className="w-full h-full object-cover" />
                                : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                )
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                                {firstItem?.productName || 'Quote Items'}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                                {q.items?.length > 1 && ` · +${q.items.length - 1} more`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="hidden md:block col-span-2">
                          <p className="text-sm text-gray-600">
                            {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="hidden md:block col-span-2">
                          {q.quotedTotal != null ? (
                            <>
                              <p className="price-tag text-sm">{formatPrice(q.quotedTotal)}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Quoted price</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Pending</p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="md:col-span-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {/* Mobile date */}
                          <p className="md:hidden text-[11px] text-gray-400 mt-1">
                            {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Action */}
                        <div className="md:col-span-1 flex items-center justify-end gap-2 flex-shrink-0">
                          {isConfirmedNoPay && (
                            <Link
                              to={`/quotes/${q._id}/pay`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                              Order Now
                            </Link>
                          )}
                          {isOrderPlaced && (
                            <Link
                              to={`/orders/${q.orderId?._id || q.orderId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                            >
                              Track
                            </Link>
                          )}
                          {!isConfirmedNoPay && !isOrderPlaced && (
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </Link>

                      {/* Confirmed pay banner inside row */}
                      {isConfirmedNoPay && (
                        <div className="mx-6 mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Quote confirmed! Click <strong className="mx-1">Order Now</strong> to complete your purchase.
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer: count + pagination ── */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4 mt-5">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total}</span> requests
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      p === page
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
