import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  suspended: 'badge-danger',
  rejected: 'badge-danger',
};

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Vendors</h1>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, page: 1 })}
          className="input-luxury h-10 py-2 w-44"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
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
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded" /></td>)}</tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No vendors found</td></tr>
              ) : vendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {vendor.storeLogo ? <img src={vendor.storeLogo} alt="" className="w-full h-full object-cover" /> : (
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
                    <div className="flex items-center gap-2">
                      {vendor.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(vendor._id, 'approved')}
                            disabled={updating === vendor._id}
                            className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleStatusUpdate(vendor._id, 'rejected', reason);
                            }}
                            disabled={updating === vendor._id}
                            className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {vendor.status === 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(vendor._id, 'suspended')}
                          disabled={updating === vendor._id}
                          className="px-2.5 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                      {(vendor.status === 'suspended' || vendor.status === 'rejected') && (
                        <button
                          onClick={() => handleStatusUpdate(vendor._id, 'approved')}
                          disabled={updating === vendor._id}
                          className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Re-activate
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-bold">{selectedVendor.storeName}</h3>
              <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">✕</button>
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
                  {selectedVendor.businessAddress.addressLine1}, {selectedVendor.businessAddress.city}, {selectedVendor.businessAddress.state} — {selectedVendor.businessAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
