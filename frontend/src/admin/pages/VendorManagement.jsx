import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { EmptyStateIcon, IconStore, IconWarning } from '../../components/ui/Icons';

const API = import.meta.env.VITE_API_URL || '/api';

const STATUS_STYLE = {
  pending:   { bg: 'rgba(251,191,36,0.12)', text: '#d97706',  label: 'Pending' },
  approved:  { bg: 'rgba(16,185,129,0.1)',  text: '#065f46',  label: 'Approved' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626',  label: 'Rejected' },
  suspended: { bg: 'rgba(107,114,128,0.1)', text: '#374151',  label: 'Suspended' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  );
};

const CommissionModal = ({ vendor, onClose, onSave }) => {
  const [rate, setRate] = useState(vendor?.store?.commissionRate || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/vendor/admin/${vendor._id}/commission`, { commissionRate: rate }, { withCredentials: true });
      toast.success('Commission rate updated');
      onSave();
      onClose();
    } catch { toast.error('Failed to update commission'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Set Commission Rate</h3>
        <p className="text-sm text-gray-500 mb-5">{vendor.vendorDetails?.shopName || vendor.name}</p>
        <div className="flex items-center gap-3 mb-6">
          <input
            type="number" min={0} max={100} value={rate}
            onChange={(e) => setRate(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="input-luxury w-28 text-center text-xl font-bold"
          />
          <span className="text-xl font-bold text-gray-500">%</span>
          <span className="text-sm text-gray-400">of each sale</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1a0e08,#3a2520)' }}>
            {loading ? 'Saving...' : 'Save Rate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function VendorManagement() {
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [acting, setActing]         = useState(null);
  const [rejectId, setRejectId]     = useState(null);
  const [rejectReason, setRejectR]  = useState('');
  const [commModal, setCommModal]   = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [auditVendor, setAuditVendor] = useState(null);
  const [auditData, setAuditData]   = useState(null);

  useEffect(() => {
    if (!auditVendor) return;
    Promise.all([
      axios.get(`${API}/vendor/admin/${auditVendor._id}/products`, { withCredentials: true }),
      axios.get(`${API}/vendor/admin/${auditVendor._id}/orders`, { withCredentials: true }),
    ]).then(([p, o]) => setAuditData({ products: p.data.data?.products || [], orders: o.data.data?.orders || [] }))
      .catch(() => toast.error('Failed to load shop data'));
  }, [auditVendor]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const { data } = await axios.get(`${API}/vendor/admin/list`, { params, withCredentials: true });
      setVendors(data.data.vendors || []);
      setTotal(data.data.total || 0);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [filter, page, search]);

  const doAction = async (id, action, payload = {}) => {
    setActing(id + action);
    try {
      await axios.put(`${API}/vendor/admin/${id}/${action}`, payload, { withCredentials: true });
      toast.success(`Vendor ${action}d successfully`);
      fetchVendors();
    } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await doAction(rejectId, 'reject', { reason: rejectReason });
    setRejectId(null); setRejectR('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} vendor{total !== 1 ? 's' : ''} registered</p>
        </div>
        {/* Pending count badge */}
        {vendors.filter(v => v.vendorStatus === 'pending').length > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold animate-pulse"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#d97706', border: '1px solid rgba(251,191,36,0.3)' }}>
            <IconWarning className="w-4 h-4 flex-shrink-0" />
            {vendors.filter(v => v.vendorStatus === 'pending').length} Pending Approval
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search vendors..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-luxury pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className="px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all"
              style={{
                background: filter === s ? 'linear-gradient(135deg,#1a0e08,#3a2520)' : 'white',
                color: filter === s ? 'white' : '#6b7280',
                border: filter === s ? 'none' : '1px solid #e5e7eb',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer-img" />)
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <EmptyStateIcon Icon={IconStore} />
            <p className="font-semibold text-gray-500">No vendors found</p>
          </div>
        ) : vendors.map((vendor, i) => (
          <motion.div
            key={vendor._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            {/* Main row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-lg"
                  style={{ background: 'linear-gradient(135deg,#1a0e08,#3a2520)' }}>
                  {vendor.name?.charAt(0)?.toUpperCase()}
                </div>
                {/* Info */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="text-[15px] font-bold text-gray-900">{vendor.vendorDetails?.shopName || vendor.name}</p>
                    <StatusBadge status={vendor.vendorStatus} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{vendor.name} · {vendor.email}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                    {vendor.vendorDetails?.city && <span>📍 {vendor.vendorDetails.city}, {vendor.vendorDetails.state}</span>}
                    {vendor.vendorDetails?.gstNumber && <span>GST: {vendor.vendorDetails.gstNumber}</span>}
                    {vendor.store?.commissionRate > 0 && <span>Commission: {vendor.store.commissionRate}%</span>}
                    <span>Joined {new Date(vendor.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {vendor.vendorStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => doAction(vendor._id, 'approve')}
                      disabled={acting === vendor._id + 'approve'}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60 transition-all"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      {acting === vendor._id + 'approve' ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => setRejectId(vendor._id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all">
                      ✕ Reject
                    </button>
                  </>
                )}
                {vendor.vendorStatus === 'approved' && (
                  <button
                    onClick={() => doAction(vendor._id, 'suspend')}
                    disabled={acting === vendor._id + 'suspend'}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 disabled:opacity-60 transition-all">
                    {acting === vendor._id + 'suspend' ? '...' : 'Suspend'}
                  </button>
                )}
                {vendor.vendorStatus === 'suspended' && (
                  <button
                    onClick={() => doAction(vendor._id, 'suspend')}
                    disabled={acting === vendor._id + 'suspend'}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-green-700 border border-green-200 hover:bg-green-50 disabled:opacity-60 transition-all">
                    {acting === vendor._id + 'suspend' ? '...' : 'Reactivate'}
                  </button>
                )}
                <button
                  onClick={() => setCommModal(vendor)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                  Set Commission
                </button>
                <button
                  onClick={() => setAuditVendor(vendor)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-50 transition-all">
                  View Shop
                </button>
                <button
                  onClick={() => setExpanded(expanded === vendor._id ? null : vendor._id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className={`w-4 h-4 transition-transform ${expanded === vendor._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded === vendor._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                    style={{ background: 'rgba(249,243,238,0.6)' }}>
                    {[
                      { label: 'Business Type', value: vendor.vendorDetails?.businessType || '—' },
                      { label: 'PAN Number',    value: vendor.vendorDetails?.panNumber || '—' },
                      { label: 'Address',       value: vendor.vendorDetails?.businessAddress || '—' },
                      { label: 'Total Products',value: vendor.store?.totalProducts || 0 },
                      { label: 'Total Orders',  value: vendor.store?.totalOrders || 0 },
                      { label: 'Commission',    value: `${vendor.store?.commissionRate || 0}%` },
                      { label: 'Store Status',  value: vendor.store?.status || '—' },
                      { label: 'Phone',         value: vendor.phone || '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 10)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 10)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRejectId(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Vendor</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason to help the vendor understand.</p>
            <textarea
              rows={3} value={rejectReason} onChange={(e) => setRejectR(e.target.value)}
              placeholder="e.g. GST number is missing or invalid..."
              className="input-luxury w-full resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={handleReject}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>Reject</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Commission Modal */}
      {commModal && (
        <CommissionModal vendor={commModal} onClose={() => setCommModal(null)} onSave={fetchVendors} />
      )}

      {auditVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setAuditVendor(null); setAuditData(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 z-10">
            <h3 className="text-lg font-bold mb-4">{auditVendor.vendorDetails?.shopName || auditVendor.name} — Audit</h3>
            <h4 className="font-semibold text-sm mb-2">Products ({auditData?.products?.length || 0})</h4>
            <div className="space-y-1 mb-4 max-h-40 overflow-y-auto text-sm">
              {(auditData?.products || []).map((p) => (
                <div key={p._id} className="flex justify-between py-1 border-b border-gray-50">
                  <span>{p.title}</span><span>₹{p.price} · {p.status}</span>
                </div>
              ))}
            </div>
            <h4 className="font-semibold text-sm mb-2">Recent Orders ({auditData?.orders?.length || 0})</h4>
            <div className="space-y-1 text-sm">
              {(auditData?.orders || []).slice(0, 10).map((o) => (
                <div key={o._id} className="flex justify-between py-1 border-b border-gray-50">
                  <span>{o.orderNumber}</span><span>{o.status} · ₹{o.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
