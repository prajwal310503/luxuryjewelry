import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { orderAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const STATUS_CONFIG = {
  pending:    { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  label: 'Pending'    },
  confirmed:  { badge: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400',   label: 'Confirmed'  },
  processing: { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',dot: 'bg-indigo-400', label: 'Processing' },
  shipped:    { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',dot: 'bg-yellow-500', label: 'Shipped'    },
  delivered:  { badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500',  label: 'Delivered'  },
  cancelled:  { badge: 'bg-red-100 text-red-600 border-red-200',         dot: 'bg-red-400',    label: 'Cancelled'  },
  returned:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',      dot: 'bg-gray-400',   label: 'Returned'   },
};

const FILTERS = [
  { value: '',            label: 'All Orders'  },
  { value: 'pending',     label: 'Pending'     },
  { value: 'confirmed',   label: 'Confirmed'   },
  { value: 'processing',  label: 'Processing'  },
  { value: 'shipped',     label: 'Shipped'     },
  { value: 'delivered',   label: 'Delivered'   },
  { value: 'cancelled',   label: 'Cancelled'   },
];

const LIMIT = 10;

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const page         = parseInt(searchParams.get('page') || '1');

  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await orderAPI.getMyOrders(params);
      const list = data.data || [];
      setOrders(list);
      setTotal(data.pagination?.total ?? list.length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
      <Helmet><title>My Orders | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-400 text-sm mt-1">
              {loading ? 'Loading…' : `${total} order${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link to="/" className="btn-outline text-sm px-5 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Continue Shopping
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
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order</div>
            <div className="col-span-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Items</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</div>
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
            <div className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">View</div>
          </div>

          {/* Rows */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0 flex items-center gap-4">
                    <div className="shimmer-text h-4 w-20 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="shimmer-text h-4 w-3/4 rounded" />
                      <div className="shimmer-text h-3 w-1/2 rounded" />
                    </div>
                    <div className="shimmer-text h-4 w-24 rounded flex-shrink-0" />
                  </div>
                ))}
              </motion.div>
            ) : orders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-semibold text-gray-700 mb-1">No orders found</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {statusFilter
                    ? `No ${STATUS_CONFIG[statusFilter]?.label || statusFilter} orders at the moment.`
                    : 'Browse our collection and place your first order.'}
                </p>
                <div className="flex gap-3 justify-center">
                  {statusFilter && (
                    <button onClick={() => setFilter('')} className="btn-outline text-sm px-5 py-2.5">
                      Clear Filter
                    </button>
                  )}
                  <Link to="/" className="btn-primary text-sm px-5 py-2.5">
                    Start Shopping
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {orders.map((order, i) => {
                  const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const firstItem = order.items?.[0];
                  const itemCount = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || order.items?.length || 0;

                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex md:grid md:grid-cols-12 gap-6 px-6 py-4 border-b border-gray-50 last:border-0 
                          hover:bg-luxury-cream/50 transition-colors cursor-pointer items-center group"
                      >
                        {/* Order # */}
                        <div className="hidden md:block col-span-2">
                          <p className="text-[11px] text-gray-400 font-mono mb-0.5">{(page - 1) * LIMIT + i + 1}.</p>
                          <p className="text-xs font-mono font-semibold text-gray-700 truncate">
                            #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                          </p>
                        </div>

                        {/* Items */}
                        <div className="md:col-span-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0 border border-gray-100">
                              {firstItem?.image
                                ? <img src={firstItem.image} alt={firstItem.title || firstItem.productName} className="w-full h-full object-cover" />
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
                                {firstItem?.title || firstItem?.productName || 'Order Items'}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {order.storeName && <span className="text-primary/80 font-medium">{order.storeName} · </span>}
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                                {order.items?.length > 1 && ` · +${order.items.length - 1} more`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="hidden md:block col-span-2">
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="hidden md:block col-span-2">
                          <p className="price-tag text-sm">{formatPrice(order.total || 0)}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : order.paymentMethod || '—'}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="md:col-span-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {/* Mobile: order # + date */}
                          <p className="md:hidden text-[11px] font-mono text-gray-400 mt-0.5">
                            #{order.orderNumber || order._id?.slice(-6).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="md:col-span-1 flex justify-end">
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
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
              Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{total}</span> orders
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
