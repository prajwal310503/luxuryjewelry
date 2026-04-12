import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI, adminAPI } from '../../services/api';

// ── Slot upload card for one product ─────────────────────────────────────────
function ProductImageCard({ product, onUpdated }) {
  const [images, setImages] = useState(product.images || []);
  const [uploading, setUploading] = useState(null); // slotIndex being uploaded
  const [removing, setRemoving] = useState(null);   // slotIndex being removed

  const handleUpload = async (e, slotIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    // If a saved image already occupies this slot, remove it first
    if (images[slotIndex]) {
      setRemoving(slotIndex);
      try {
        const { data } = await productAPI.adminRemoveImage(product._id, slotIndex);
        setImages(data.data || []);
      } catch { /* proceed anyway */ }
      setRemoving(null);
    }

    setUploading(slotIndex);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await adminAPI.uploadProductImages(product._id, formData);
      const updated = data.data || [];
      setImages(updated);
      onUpdated(product._id, updated);
      toast.success(slotIndex === 0 ? 'Main image saved' : 'Hover image saved');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (slotIndex) => {
    if (!images[slotIndex]) return;
    setRemoving(slotIndex);
    try {
      const { data } = await productAPI.adminRemoveImage(product._id, slotIndex);
      const updated = data.data || [];
      setImages(updated);
      onUpdated(product._id, updated);
      toast.success('Image removed');
    } catch {
      toast.error('Remove failed');
    } finally {
      setRemoving(null);
    }
  };

  const busy = uploading !== null || removing !== null;

  return (
    <div className="card-luxury p-4 flex flex-col gap-3">
      {/* Product title + SKU */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{product.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{product.sku || '—'}</p>
      </div>

      {/* Two image slots */}
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((slotIdx) => {
          const img     = images[slotIdx];
          const label   = slotIdx === 0 ? 'Main' : 'Hover';
          const isBusy  = uploading === slotIdx || removing === slotIdx;
          const inputId = `img-${product._id}-${slotIdx}`;

          return (
            <div key={slotIdx} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>

              <div className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-luxury-cream">
                {isBusy ? (
                  /* Spinner */
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : img ? (
                  <>
                    <img src={img.url} alt={label} className="w-full h-full object-cover" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      <label
                        htmlFor={inputId}
                        className="cursor-pointer flex items-center gap-1 bg-white/90 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Replace
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemove(slotIdx)}
                        disabled={busy}
                        className="flex items-center gap-1 bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label
                    htmlFor={inputId}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer text-gray-300 hover:text-primary transition-colors"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-semibold text-gray-400">Upload</span>
                  </label>
                )}

                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, slotIdx)}
                  className="hidden"
                  disabled={busy}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${images[i] ? 'bg-green-400' : 'bg-gray-200'}`}
            title={images[i] ? (i === 0 ? 'Main image set' : 'Hover image set') : (i === 0 ? 'No main image' : 'No hover image')}
          />
        ))}
        <span className="text-[10px] text-gray-400 ml-0.5">
          {images.filter(Boolean).length}/2 images
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProductImages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const page   = parseInt(searchParams.get('page'))   || 1;
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all'; // all | missing | complete

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (search) params.search = search;
      const { data } = await productAPI.adminGetAll(params);
      let list = data.data || [];

      // Client-side filter by image completeness
      if (filter === 'missing') list = list.filter((p) => !p.images?.length || !p.images[0]?.url);
      if (filter === 'complete') list = list.filter((p) => p.images?.length >= 2 && p.images[0]?.url && p.images[1]?.url);

      setProducts(list);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, search, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleProductUpdated = (productId, newImages) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, images: newImages } : p))
    );
  };

  const missingCount = products.filter((p) => !p.images?.length || !p.images[0]?.url).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Product Images</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Upload Main + Hover images for each product directly from here.
          </p>
        </div>
        {missingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="text-xs font-semibold text-amber-700">{missingCount} product{missingCount !== 1 ? 's' : ''} missing main image</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearchParams({ search: e.target.value, filter, page: 1 })}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['all', 'All'], ['missing', 'Missing Images'], ['complete', 'Both Images']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setSearchParams({ search, filter: val, page: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === val ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card-luxury p-4 space-y-3">
              <div className="h-4 shimmer-loading rounded w-3/4" />
              <div className="h-3 shimmer-loading rounded w-1/2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square shimmer-loading rounded-xl" />
                <div className="aspect-square shimmer-loading rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card-luxury py-16 text-center text-gray-300">No products found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductImageCard
              key={product._id}
              product={product}
              onUpdated={handleProductUpdated}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">Showing {products.length} of {meta.total} products</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchParams({ search, filter, page: page - 1 })}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg">{page}</span>
            <button
              onClick={() => setSearchParams({ search, filter, page: page + 1 })}
              disabled={page >= meta.pages}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
