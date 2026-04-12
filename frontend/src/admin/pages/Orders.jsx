import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const STATUS_COLORS = {
  pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
  shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444',
};

const IcEdit = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IcX   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await orderAPI.adminGetAll(params);
      setOrders(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {} finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async () => {
    if (!statusUpdate.status) return;
    try {
      await orderAPI.adminUpdateStatus(selected._id, statusUpdate);
      toast.success('Order status updated');
      setSelected(null);
      fetchOrders();
    } catch (err) { toast.error(err.message); }
  };

  const setPage = (p) => setSearchParams({ status: statusFilter, search, page: p });

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Orders</h1>

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
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="shimmer-text h-3.5 w-28 rounded" />
                        <div className="shimmer-text h-2.5 w-36 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-6 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-12 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-300">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 text-sm font-medium text-primary">#{order.orderNumber}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-800">{order.customer?.name}</p>
                    <p className="text-xs text-gray-400">{order.customer?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{order.items?.length || 0}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{order.total?.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${order.payment?.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {order.payment?.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="badge text-xs capitalize"
                      style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setSelected(order); setStatusUpdate({ status: order.status, comment: '' }); }}
                      title="Update Status"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <IcEdit />
                    </button>
                  </td>
                </tr>
              ))}
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
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <IcX />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Status</label>
                <Select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                >
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment</label>
                <textarea
                  value={statusUpdate.comment}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                  className="input-luxury resize-none"
                  rows={2}
                  placeholder="Optional comment..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button onClick={handleUpdateStatus} className="btn-primary flex-1 justify-center">Update Status</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
