import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';
import Select from '../../components/ui/Select';

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger',
  draft: 'badge bg-gray-100 text-gray-600',
  archived: 'badge bg-gray-100 text-gray-400',
};

export default function VendorProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await productAPI.getVendorProducts(params);
      setProducts(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">My Products</h1>
        <Link to="/vendor/products/add" className="btn-primary">
          + Add Product
        </Link>
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
        <Select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, search, page: 1 })}
          compact
          className="w-44"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Price', 'Stock', 'Status', 'Rejection Reason', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13L22 9z" /></svg>
                      <p className="text-gray-400 text-sm">No products found</p>
                      <Link to="/vendor/products/add" className="btn-primary text-xs py-2 px-4">
                        Add Your First Product
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url && (
                          <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{product.title}</p>
                        <p className="text-xs text-gray-400">SKU: {product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-800">₹{product.price?.toLocaleString('en-IN')}</p>
                    {product.comparePrice > product.price && (
                      <p className="text-xs text-gray-400 line-through">₹{product.comparePrice?.toLocaleString('en-IN')}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${
                      product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-amber-500' : 'text-gray-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs capitalize ${STATUS_BADGE[product.status] || 'badge-primary'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {product.status === 'rejected' && product.rejectionReason ? (
                      <p className="text-xs text-red-500 max-w-xs">{product.rejectionReason}</p>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendor/products/edit/${product._id}`}
                        className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id, product.title)}
                        disabled={deleting === product._id}
                        className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
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
