import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger',
  draft: 'badge bg-gray-100 text-gray-600',
  archived: 'badge bg-gray-100 text-gray-400',
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await productAPI.adminGetAll(params);
      setProducts(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleStatusUpdate = async (id, status, rejectionReason) => {
    setUpdating(id);
    try {
      await productAPI.adminUpdateStatus(id, { status, rejectionReason });
      toast.success(`Product ${status}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    setUpdating(id);
    try {
      await productAPI.adminToggleFeatured(id);
      toast.success('Updated');
      fetchProducts();
    } catch (_) {
      toast.error('Failed');
    } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={() => navigate('/admin/products/add')} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearchParams({ status: statusFilter, search: e.target.value, page: 1 })}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, search, page: 1 })}
          className="input-luxury h-10 py-2 w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Vendor', 'Price', 'Stock', 'Status', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No products found</td></tr>
              ) : products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url && <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{product.title}</p>
                        <p className="text-xs text-gray-400">{product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{product.vendor?.storeName || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{product.price?.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${product.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs capitalize ${STATUS_BADGE[product.status] || 'badge-primary'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleFeatured(product._id)}
                      disabled={updating === product._id}
                      className={`w-8 h-5 rounded-full transition-all duration-200 ${product.isFeatured ? 'bg-gold' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${product.isFeatured ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {product.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(product._id, 'approved')}
                            disabled={updating === product._id}
                            className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleStatusUpdate(product._id, 'rejected', reason);
                            }}
                            disabled={updating === product._id}
                            className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {product.status === 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(product._id, 'archived')}
                          disabled={updating === product._id}
                          className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                      {product.status === 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(product._id, 'approved')}
                          disabled={updating === product._id}
                          className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Re-approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Showing {products.length} of {meta.total} products</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchParams({ status: statusFilter, search, page: page - 1 })}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg">{page}</span>
              <button
                onClick={() => setSearchParams({ status: statusFilter, search, page: page + 1 })}
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
