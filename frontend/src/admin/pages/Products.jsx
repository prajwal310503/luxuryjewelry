import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger',
  draft: 'badge bg-gray-100 text-gray-600',
  archived: 'badge bg-gray-100 text-gray-400',
};

// ── SVG icons ──────────────────────────────────────────────
const IcEdit    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IcTrash   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IcCheck   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IcX       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IcArchive = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" /></svg>;
const IcRefresh = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}
  >
    {children}
  </button>
);

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [flagCounts, setFlagCounts] = useState({ featured: 0, bestseller: 0, newarrival: 0, lifestyle1: 0, lifestyle2: 0 });

  const FLAG_LIMITS = { featured: 12, bestseller: 8, newarrival: 999, lifestyle1: 4, lifestyle2: 4 };

  const fetchFlagCounts = useCallback(async () => {
    try {
      const [f, b, n, l1, l2] = await Promise.all([
        productAPI.getAll({ isFeatured: true,   limit: 1 }),
        productAPI.getAll({ isBestSeller: true,  limit: 1 }),
        productAPI.getAll({ isNewArrival: true,  limit: 1 }),
        productAPI.getAll({ isLifestyle1: true,  limit: 1 }),
        productAPI.getAll({ isLifestyle2: true,  limit: 1 }),
      ]);
      setFlagCounts({
        featured:   f.data.meta?.total  || 0,
        bestseller: b.data.meta?.total  || 0,
        newarrival: n.data.meta?.total  || 0,
        lifestyle1: l1.data.meta?.total || 0,
        lifestyle2: l2.data.meta?.total || 0,
      });
    } catch (_) {}
  }, []);

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

  useEffect(() => { fetchProducts(); fetchFlagCounts(); }, [fetchProducts, fetchFlagCounts]);

  const handleStatusUpdate = async (id, status, rejectionReason) => {
    setUpdating(id);
    try {
      await productAPI.adminUpdateStatus(id, { status, rejectionReason });
      toast.success(`Product ${status}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally { setUpdating(null); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setUpdating(deleteConfirm._id);
    try {
      await productAPI.adminDelete(deleteConfirm._id);
      toast.success('Product deleted permanently');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally { setUpdating(null); }
  };

  const handleToggle = async (id, type) => {
    setUpdating(id + type);
    try {
      if (type === 'featured')    await productAPI.adminToggleFeatured(id);
      if (type === 'bestseller')  await productAPI.adminToggleBestSeller(id);
      if (type === 'newarrival')  await productAPI.adminToggleNewArrival(id);
      if (type === 'lifestyle1')  await productAPI.adminToggleLifestyle1(id);
      if (type === 'lifestyle2')  await productAPI.adminToggleLifestyle2(id);
      toast.success('Updated');
      fetchProducts();
      fetchFlagCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed');
    } finally { setUpdating(null); }
  };

  const Toggle = ({ active, onClick, disabled, label, color, flagKey }) => {
    const count = flagCounts[flagKey] ?? 0;
    const limit = FLAG_LIMITS[flagKey] ?? 999;
    const atLimit = count >= limit && !active;
    const isDisabled = disabled || atLimit;
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onClick}
          disabled={isDisabled}
          title={atLimit ? `Limit reached (${count}/${limit}) — turn one off first` : label}
          className={`relative w-9 h-5 rounded-full transition-all duration-200
            ${active ? color : atLimit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200'}
            disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-[9px] uppercase tracking-wider ${atLimit && !active ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
          {label} {limit < 999 ? `${count}/${limit}` : ''}
        </span>
      </div>
    );
  };

  const setPage = (p) => setSearchParams({ status: statusFilter, search, page: p });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/admin/products/images')} className="btn-outline text-sm flex items-center gap-2 py-2 px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="hidden sm:inline">Manage Images</span>
            <span className="sm:hidden">Images</span>
          </button>
          <button onClick={() => navigate('/admin/products/add')} className="btn-primary text-sm flex items-center gap-2 py-2 px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>
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
          className="w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Vendor', 'Price', 'Stock', 'Status', 'Home Page Flags', 'Lifestyle Panels', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg shimmer-img flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="shimmer-text h-3.5 w-36 rounded" />
                          <div className="shimmer-text h-2.5 w-20 rounded" />
                        </div>
                      </div>
                    </td>
                    {/* Vendor */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    {/* Price */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-16 rounded" /></td>
                    {/* Stock */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-8 rounded" /></td>
                    {/* Status */}
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    {/* Flags */}
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        {[0,1,2].map((j) => <div key={j} className="shimmer-loading w-9 h-5 rounded-full" />)}
                      </div>
                    </td>
                    {/* Lifestyle */}
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        {[0,1].map((j) => <div key={j} className="shimmer-loading w-9 h-5 rounded-full" />)}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <div className="shimmer-loading w-8 h-8 rounded-lg" />
                        <div className="shimmer-loading w-8 h-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-300">No products found</td></tr>
              ) : products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Product */}
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
                  {/* Vendor */}
                  <td className="px-5 py-4 text-sm text-gray-600">{product.vendor?.storeName || '—'}</td>
                  {/* Price */}
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{product.price?.toLocaleString('en-IN')}</td>
                  {/* Stock */}
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${product.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`badge text-xs capitalize ${STATUS_BADGE[product.status] || 'badge-primary'}`}>
                      {product.status}
                    </span>
                  </td>
                  {/* Home Page Flags */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Toggle active={product.isFeatured}   onClick={() => handleToggle(product._id, 'featured')}   disabled={!!updating} label="Featured"  color="bg-[#C9A84C]" flagKey="featured" />
                      <Toggle active={product.isBestSeller} onClick={() => handleToggle(product._id, 'bestseller')} disabled={!!updating} label="Deal"      color="bg-[#B76E79]" flagKey="bestseller" />
                      <Toggle active={product.isNewArrival} onClick={() => handleToggle(product._id, 'newarrival')} disabled={!!updating} label="New"       color="bg-[#5a413f]" flagKey="newarrival" />
                    </div>
                  </td>
                  {/* Lifestyle Panels */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Toggle active={product.isLifestyle1} onClick={() => handleToggle(product._id, 'lifestyle1')} disabled={!!updating} label="Bridal"    color="bg-[#C9A84C]" flagKey="lifestyle1" />
                      <Toggle active={product.isLifestyle2} onClick={() => handleToggle(product._id, 'lifestyle2')} disabled={!!updating} label="Everyday"  color="bg-[#B76E79]" flagKey="lifestyle2" />
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <IconBtn onClick={() => navigate(`/admin/products/edit/${product._id}`)} title="Edit" color="bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <IcEdit />
                      </IconBtn>
                      <IconBtn onClick={() => setDeleteConfirm(product)} disabled={!!updating} title="Delete" color="bg-red-50 text-red-500 hover:bg-red-100">
                        <IcTrash />
                      </IconBtn>
                      {product.status === 'pending' && (
                        <>
                          <IconBtn onClick={() => handleStatusUpdate(product._id, 'approved')} disabled={updating === product._id} title="Approve" color="bg-green-50 text-green-600 hover:bg-green-100">
                            <IcCheck />
                          </IconBtn>
                          <IconBtn
                            onClick={() => { const r = prompt('Rejection reason:'); if (r) handleStatusUpdate(product._id, 'rejected', r); }}
                            disabled={updating === product._id}
                            title="Reject"
                            color="bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <IcX />
                          </IconBtn>
                        </>
                      )}
                      {product.status === 'approved' && (
                        <IconBtn onClick={() => handleStatusUpdate(product._id, 'archived')} disabled={updating === product._id} title="Archive" color="bg-gray-100 text-gray-500 hover:bg-gray-200">
                          <IcArchive />
                        </IconBtn>
                      )}
                      {(product.status === 'rejected' || product.status === 'archived') && (
                        <IconBtn onClick={() => handleStatusUpdate(product._id, 'approved')} disabled={updating === product._id} title="Re-approve" color="bg-green-50 text-green-600 hover:bg-green-100">
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

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={products.length} onPage={setPage} />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-center font-heading font-bold text-gray-900 text-lg mb-2">Delete Product?</h3>
            <p className="text-center text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-800">{deleteConfirm.title}</span>
            </p>
            <p className="text-center text-xs text-red-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={updating === deleteConfirm._id} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50">
                {updating === deleteConfirm._id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
