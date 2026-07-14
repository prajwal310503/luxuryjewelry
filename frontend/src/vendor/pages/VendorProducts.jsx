import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { EmptyStateIcon, IconRing } from '../../components/ui/Icons';
import Pagination from '../../admin/components/Pagination';

const API = import.meta.env.VITE_API_URL || '/api';
const PAGE_SIZE = 12;

const STATUS_COLORS = {
  pending:   { background: 'rgba(251,191,36,0.92)', color: '#92400e' },
  approved:  { background: 'rgba(16,185,129,0.92)', color: '#fff' },
  rejected:  { background: 'rgba(239,68,68,0.92)', color: '#fff' },
  archived:  { background: 'rgba(107,114,128,0.9)', color: '#fff' },
  draft:     { background: 'rgba(251,191,36,0.92)', color: '#92400e' },
  active:    { background: 'rgba(16,185,129,0.92)', color: '#fff' },
  inactive:  { background: 'rgba(156,163,175,0.9)', color: '#fff' },
};

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      const { data } = await axios.get(`${API}/vendor/products`, { params, withCredentials: true });
      setProducts(data.data?.products || []);
      setTotal(data.data?.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProducts(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`${API}/vendor/products/${id}`, { withCredentials: true });
      toast.success('Product removed');
      setConfirmId(null);
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
    finally { setDeleting(null); }
  };

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} product{total !== 1 ? 's' : ''} in your store</p>
          </div>
          <a href="/vendor/products/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #a07828)', boxShadow: '0 4px 14px rgba(201,168,76,0.3)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </a>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="input-luxury pl-10 w-full" />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="shimmer-img h-44" />
                <div className="p-4 space-y-2">
                  <div className="shimmer-text h-3.5 w-3/4 rounded" />
                  <div className="shimmer-text h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <EmptyStateIcon Icon={IconRing} />
            <p className="text-gray-500 font-semibold">No products yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Add your first product to start selling</p>
            <a href="/vendor/products/add"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg,#C9A84C,#a07828)' }}>
              + Add First Product
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <motion.div key={p._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm group"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="relative h-44 overflow-hidden bg-gray-50">
                  {p.images?.[0] ? (
                    <img src={p.images[0]?.url || p.images[0]} alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><IconRing className="w-10 h-10" /></div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold capitalize shadow-sm"
                      style={STATUS_COLORS[p.status] || STATUS_COLORS.pending}>
                      {p.status || 'pending'}
                    </span>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a href={`/vendor/products/edit/${p._id}`}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
                      title="Edit">
                      <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </a>
                    <button onClick={() => setConfirmId(p._id)}
                      className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category?.name || '—'}</p>
                  <p className="text-sm font-bold mt-2" style={{ color: '#C9A84C' }}>
                    ₹{(p.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <Pagination
            page={page}
            pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            total={total}
            shown={products.length}
            onPage={setPage}
          />
        </div>

        {/* Delete Confirm Modal */}
        <AnimatePresence>
          {confirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmId(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
                <p className="text-sm text-gray-500 mb-6">This cannot be undone. The product will be permanently removed.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(confirmId)} disabled={!!deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </VendorLayout>
  );
}
