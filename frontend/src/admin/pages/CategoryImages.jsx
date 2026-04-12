import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { categoryAPI } from '../../services/api';

function CategoryImageCard({ category, onUpdated }) {
  const [imgPreview, setImgPreview] = useState(category.image || null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const fd = new FormData();
      // carry over required fields
      fd.append('name', category.name);
      if (category.parent?._id || category.parent) fd.append('parent', category.parent?._id || category.parent);
      fd.append('sortOrder', category.sortOrder ?? 0);
      fd.append('isFeatured', category.isFeatured ?? false);
      fd.append('image', file);

      await categoryAPI.adminUpdate(category._id, fd);
      const preview = URL.createObjectURL(file);
      setImgPreview(preview);
      onUpdated(category._id);
      toast.success(`${category.name} image saved`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inputId = `cat-img-${category._id}`;

  return (
    <div className="card-luxury p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800 truncate">{category.name}</p>
      <p className="text-[11px] text-gray-400">/{category.slug}</p>

      <div className="relative group aspect-[3/2] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-luxury-cream">
        {uploading ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : imgPreview ? (
          <>
            <img src={imgPreview} alt={category.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label
                htmlFor={inputId}
                className="cursor-pointer flex items-center gap-1.5 bg-white/90 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Replace
              </label>
            </div>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-300 hover:text-primary transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-400">Upload Image</span>
          </label>
        )}
        <input id={inputId} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${imgPreview ? 'bg-green-400' : 'bg-gray-200'}`} />
        <span className="text-[10px] text-gray-400">{imgPreview ? 'Image set' : 'No image'}</span>
      </div>
    </div>
  );
}

export default function AdminCategoryImages() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll({ limit: 100 });
      setCategories(data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const missingCount = categories.filter((c) => !c.image).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Category Images</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upload images for each jewelry category shown on the home page.</p>
        </div>
        {missingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="text-xs font-semibold text-amber-700">{missingCount} categor{missingCount !== 1 ? 'ies' : 'y'} missing image</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card-luxury p-4 space-y-3">
              <div className="h-4 shimmer-loading rounded w-3/4" />
              <div className="aspect-[3/2] shimmer-loading rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <CategoryImageCard
              key={cat._id}
              category={cat}
              onUpdated={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
