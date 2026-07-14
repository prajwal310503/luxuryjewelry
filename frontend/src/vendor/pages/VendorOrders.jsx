import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { EmptyStateIcon, IconBox } from '../../components/ui/Icons';
import { orderAPI } from '../../services/api';
import Pagination from '../../admin/components/Pagination';

const API = import.meta.env.VITE_API_URL || '/api';
const PAGE_SIZE = 15;

const STATUS_OPTS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending:    { bg: 'rgba(251,191,36,0.12)', text: '#d97706' },
  processing: { bg: 'rgba(59,130,246,0.1)',  text: '#2563eb' },
  shipped:    { bg: 'rgba(168,85,247,0.1)',  text: '#7c3aed' },
  delivered:  { bg: 'rgba(16,185,129,0.1)',  text: '#065f46' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize"
      style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
};

export default function VendorOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [updating, setUpdating]   = useState(null);
  const [selected, setSelected]   = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await axios.get(`${API}/vendor/orders`, { params, withCredentials: true });
      setOrders(data.data.orders || []);
      setTotal(data.data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    setUpdating(selected._id);
    try {
      const payload = { status: newStatus };
      if (courierName) payload.courierName = courierName;
      if (trackingNumber) payload.trackingNumber = trackingNumber;
      if (trackingUrl) payload.trackingUrl = trackingUrl;
      await axios.put(`${API}/vendor/orders/${selected._id}/status`, payload, { withCredentials: true });
      toast.success('Order status updated');
      setSelected(null);
      setNewStatus('');
      setCourierName('');
      setTrackingNumber('');
      setTrackingUrl('');
      fetchOrders();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const handleRequestAction = async (action, type) => {
    if (!selected) return;
    setUpdating(selected._id);
    try {
      const payload = type === 'cancel' ? { cancellationAction: action } : { returnAction: action };
      await axios.put(`${API}/vendor/orders/${selected._id}/status`, payload, { withCredentials: true });
      toast.success(`${type === 'cancel' ? 'Cancellation' : 'Return'} ${action}`);
      setSelected(null);
      fetchOrders();
    } catch { toast.error('Failed to process request'); }
    finally { setUpdating(null); }
  };

  const downloadInvoice = async (order) => {
    try {
      const { data } = await orderAPI.downloadInvoice(order._id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber || order._id.slice(-8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} orders found</p>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTS.map((s) => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
                style={{
                  background: statusFilter === s ? 'linear-gradient(135deg, #1a0e08, #3a2520)' : 'white',
                  color: statusFilter === s ? 'white' : '#6b7280',
                  border: statusFilter === s ? 'none' : '1px solid #e5e7eb',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="shimmer-text h-4 w-28 rounded" />
                  <div className="shimmer-text h-4 w-32 rounded" />
                  <div className="ml-auto shimmer-text h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center">
              <EmptyStateIcon Icon={IconBox} />
              <p className="text-gray-500 font-semibold">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">Orders will appear here once customers purchase</p>
            </div>
          ) : (
            <>
              {/* Desktop table header */}
              <div className="hidden sm:grid grid-cols-6 px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <span className="col-span-2">Order ID / Customer</span>
                <span>Items</span>
                <span>Amount</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-gray-50">
                {orders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-2 sm:grid-cols-6 items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.user?.name || 'Customer'}</p>
                      <p className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm text-gray-700">{order.items?.length || 0} item(s)</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">₹{(order.total || order.totalAmount || 0).toLocaleString('en-IN')}</p>
                      {order.vendorPayout != null && (
                        <p className="text-[10px] text-green-700 mt-0.5">
                          Your payout ₹{Math.round(order.vendorPayout).toLocaleString('en-IN')}
                          {order.commissionAmount > 0 ? ` (fee ₹${Math.round(order.commissionAmount).toLocaleString('en-IN')})` : ''}
                        </p>
                      )}
                    </div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <button type="button" onClick={() => downloadInvoice(order)} className="text-xs font-semibold text-gray-500 hover:text-primary hover:underline">
                        Invoice
                      </button>
                      {!['delivered', 'cancelled'].includes(order.status) && (
                        <button
                          onClick={() => {
                            setSelected(order);
                            setNewStatus(order.status);
                            setCourierName(order.courierName || '');
                            setTrackingNumber(order.trackingNumber || '');
                            setTrackingUrl(order.trackingUrl || '');
                          }}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Pagination
                page={page}
                pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                total={total}
                shown={orders.length}
                onPage={setPage}
              />
            </>
          )}
        </div>

        {/* Update Status Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Update Order Status</h3>
              <p className="text-sm text-gray-500 mb-5">Order #{selected._id.slice(-8).toUpperCase()}</p>

              <div className="space-y-2 mb-4">
                {['processing', 'shipped', 'delivered'].map((s) => (
                  <label key={s} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                    style={{ background: newStatus === s ? 'rgba(201,168,76,0.1)' : '#f9fafb', border: newStatus === s ? '1.5px solid rgba(201,168,76,0.4)' : '1.5px solid transparent' }}>
                    <input type="radio" name="status" value={s} checked={newStatus === s}
                      onChange={() => setNewStatus(s)} className="accent-primary" />
                    <span className="text-sm font-semibold capitalize text-gray-800">{s}</span>
                  </label>
                ))}
              </div>

              {newStatus === 'shipped' && (
                <div className="space-y-3 mb-4">
                  <input className="input-luxury w-full text-sm" placeholder="Courier name" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
                  <input className="input-luxury w-full text-sm" placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  <input className="input-luxury w-full text-sm" placeholder="Tracking URL (optional)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                </div>
              )}

              {selected.cancellationRequest?.status === 'pending' && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm font-semibold text-red-800 mb-2">Cancellation requested</p>
                  <p className="text-xs text-red-600 mb-3">{selected.cancellationRequest.reason}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleRequestAction('approved', 'cancel')} className="flex-1 py-2 text-xs font-bold bg-red-600 text-white rounded-lg">Approve</button>
                    <button type="button" onClick={() => handleRequestAction('rejected', 'cancel')} className="flex-1 py-2 text-xs font-bold border border-red-200 text-red-700 rounded-lg">Reject</button>
                  </div>
                </div>
              )}

              {selected.returnRequest?.status === 'pending' && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Return requested</p>
                  <p className="text-xs text-amber-600 mb-3">{selected.returnRequest.reason}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleRequestAction('approved', 'return')} className="flex-1 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg">Approve</button>
                    <button type="button" onClick={() => handleRequestAction('rejected', 'return')} className="flex-1 py-2 text-xs font-bold border border-amber-200 text-amber-700 rounded-lg">Reject</button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mb-6">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleUpdateStatus} disabled={!!updating}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1a0e08, #3a2520)' }}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </VendorLayout>
  );
}
