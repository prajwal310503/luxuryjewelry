import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderAPI } from '../../services/api';

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  processing: { bg: '#EDE9FE', text: '#5B21B6' },
  shipped: { bg: '#CFFAFE', text: '#164E63' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const formatPrice = (p) => `₹${Math.round(p || 0).toLocaleString('en-IN')}`;

export default function VendorOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await orderAPI.vendorGetAll(params);
      setOrders(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      {/* Status Filter */}
      <div className="card-luxury p-4 flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s, page: 1 })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Items', 'Earnings', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>
                      <p className="text-gray-400 text-sm">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : orders.map((order) => {
                // Filter only this vendor's items
                const myItems = order.items || [];
                const myEarnings = myItems.reduce((sum, item) => sum + (item.vendorCommission || 0), 0);

                return (
                  <>
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-primary">#{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{order.customer?.name}</p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">{myItems.length} item{myItems.length !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-800">{formatPrice(myEarnings)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                          style={{
                            backgroundColor: STATUS_COLORS[order.status]?.bg || '#F3F4F6',
                            color: STATUS_COLORS[order.status]?.text || '#374151',
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {expanded === order._id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expanded === order._id && (
                      <tr key={`${order._id}-expanded`} className="bg-luxury-cream/40">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Order Items</p>
                            {myItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                <div className="w-10 h-10 rounded-lg bg-luxury-beige overflow-hidden flex-shrink-0">
                                  {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                  <p className="text-xs text-gray-400">SKU: {item.sku} · Qty: {item.quantity}</p>
                                  {item.variantAttributes?.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                      {item.variantAttributes.map((v) => `${v.name}: ${v.value}`).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-800">{formatPrice(item.subtotal)}</p>
                                  <p className="text-xs text-green-600">Earn: {formatPrice(item.vendorCommission)}</p>
                                </div>
                              </div>
                            ))}

                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <span className="font-semibold">Shipping to:</span>{' '}
                                {order.shippingAddress
                                  ? `${order.shippingAddress.name}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
                                  : '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Showing {orders.length} of {meta.total} orders</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchParams({ status: statusFilter, page: page - 1 })}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg">{page}</span>
              <button
                onClick={() => setSearchParams({ status: statusFilter, page: page + 1 })}
                disabled={page >= meta.pages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
