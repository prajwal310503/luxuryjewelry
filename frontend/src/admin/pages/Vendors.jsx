import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  suspended: 'badge-danger',
  rejected: 'badge-danger',
};

const IcCheck   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IcX       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IcPause   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcRefresh = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IcEye     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}>
    {children}
  </button>
);

export default function AdminVendors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminAPI.getVendors(params);
      setVendors(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleStatusUpdate = async (id, status, rejectionReason) => {
    setUpdating(id);
    try {
      await adminAPI.updateVendorStatus(id, { status, rejectionReason });
      toast.success(`Vendor ${status}`);
      fetchVendors();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally { setUpdating(null); }
  };

  const setPage = (p) => setSearchParams({ status: statusFilter, page: p });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Vendors</h1>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, page: 1 })}
          compact
          className="w-44"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Store', 'Owner', 'Contact', 'GST', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg shimmer-img flex-shrink-0" />
                        <div className="space-y-2">
                          <div className="shimmer-text h-3.5 w-28 rounded" />
                          <div className="shimmer-text h-2.5 w-20 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="shimmer-text h-3.5 w-24 rounded" />
                        <div className="shimmer-text h-2.5 w-32 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="flex gap-1.5">
                      <div className="shimmer-loading w-8 h-8 rounded-lg" />
                      <div className="shimmer-loading w-8 h-8 rounded-lg" />
                    </div></td>
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No vendors found</td></tr>
              ) : vendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {vendor.storeLogo ? (
                          <img src={vendor.storeLogo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                            {vendor.storeName?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{vendor.storeName}</p>
                        <p className="text-xs text-gray-400">/{vendor.storeSlug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-800">{vendor.user?.name}</p>
                    <p className="text-xs text-gray-400">{vendor.user?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{vendor.businessPhone || vendor.user?.phone || '—'}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">{vendor.gstNumber || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs capitalize ${STATUS_BADGE[vendor.status] || 'badge-primary'}`}>{vendor.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(vendor.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <IconBtn onClick={() => setSelectedVendor(vendor)} title="View Details" color="bg-gray-100 text-gray-500 hover:bg-gray-200">
                        <IcEye />
                      </IconBtn>
                      {vendor.status === 'pending' && (
                        <>
                          <IconBtn onClick={() => handleStatusUpdate(vendor._id, 'approved')} disabled={updating === vendor._id} title="Approve" color="bg-green-50 text-green-600 hover:bg-green-100">
                            <IcCheck />
                          </IconBtn>
                          <IconBtn
                            onClick={() => { const r = prompt('Rejection reason:'); if (r) handleStatusUpdate(vendor._id, 'rejected', r); }}
                            disabled={updating === vendor._id}
                            title="Reject"
                            color="bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <IcX />
                          </IconBtn>
                        </>
                      )}
                      {vendor.status === 'approved' && (
                        <IconBtn onClick={() => handleStatusUpdate(vendor._id, 'suspended')} disabled={updating === vendor._id} title="Suspend" color="bg-amber-50 text-amber-600 hover:bg-amber-100">
                          <IcPause />
                        </IconBtn>
                      )}
                      {(vendor.status === 'suspended' || vendor.status === 'rejected') && (
                        <IconBtn onClick={() => handleStatusUpdate(vendor._id, 'approved')} disabled={updating === vendor._id} title="Re-activate" color="bg-green-50 text-green-600 hover:bg-green-100">
                          <IcRefresh />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={vendors.length} onPage={setPage} />
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-bold">{selectedVendor.storeName}</h3>
              <button onClick={() => setSelectedVendor(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <IcX />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Owner', selectedVendor.user?.name],
                ['Email', selectedVendor.user?.email],
                ['Phone', selectedVendor.businessPhone || selectedVendor.user?.phone],
                ['GST', selectedVendor.gstNumber || '—'],
                ['PAN', selectedVendor.panNumber || '—'],
                ['Commission', `${selectedVendor.commissionRate}%`],
                ['Status', selectedVendor.status],
                ['Verified', selectedVendor.isVerified ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-medium text-gray-800">{value || '—'}</p>
                </div>
              ))}
            </div>
            {selectedVendor.businessAddress?.city && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-400 mb-1">Business Address</p>
                <p className="text-sm text-gray-700">
                  {selectedVendor.businessAddress.addressLine1}, {selectedVendor.businessAddress.city},{' '}
                  {selectedVendor.businessAddress.state} — {selectedVendor.businessAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
