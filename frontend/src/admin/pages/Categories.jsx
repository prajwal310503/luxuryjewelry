import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { categoryAPI } from '../../services/api';

const EMPTY = { name: '', description: '', parent: '', sortOrder: 0, isFeatured: false };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parent: cat.parent?._id || cat.parent || '',
      sortOrder: cat.sortOrder || 0,
      isFeatured: cat.isFeatured || false,
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);

      if (editItem) {
        await categoryAPI.adminUpdate(editItem._id, fd);
        toast.success('Category updated');
      } else {
        await categoryAPI.adminCreate(fd);
        toast.success('Category created');
      }
      setShowModal(false);
      load();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this category?')) return;
    try {
      await categoryAPI.adminDelete(id);
      toast.success('Category deactivated');
      load();
    } catch (error) {
      toast.error(error.message || 'Failed');
    }
  };

  const rootCategories = categories.filter((c) => !c.parent);
  const currentPreview = imagePreview || (editItem?.image || null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5">+ Add Category</button>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Category', 'Level', 'Sort Order', 'Featured', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded" /></td>
                  ))}</tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-300">No categories</td></tr>
              ) : categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {cat.image
                          ? <img src={cat.image} alt="" className="w-full h-full object-cover" />
                          : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                              </svg>
                            </div>
                          )
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800" style={{ paddingLeft: `${cat.level * 16}px` }}>
                          {cat.level > 0 ? '↳ ' : ''}{cat.name}
                        </p>
                        <p className="text-xs text-gray-400">/{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{cat.level === 0 ? 'Root' : `Level ${cat.level}`}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{cat.sortOrder}</td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${cat.isFeatured ? 'badge-success' : 'bg-gray-100 text-gray-400'}`}>
                      {cat.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${cat.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Edit</button>
                      {cat.isActive && (
                        <button onClick={() => handleDelete(cat._id)} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-lg font-bold">{editItem ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Category Image */}
              <div>
                <label className="label-luxury">Category Image</label>
                <p className="text-[11px] text-gray-400 mb-2">Recommended: 600 × 400 px · JPG, PNG, WebP</p>
                {currentPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={currentPreview} alt="Preview" className="w-full aspect-[3/2] object-cover" />
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); if (editItem) setEditItem({ ...editItem, image: null }); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                    className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50/60 transition-colors"
                  >
                    <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5 MB</p>
                    <p className="text-[11px] font-semibold text-primary mt-2">Best size: 600 × 400 px</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>

              {/* Name */}
              <div>
                <label className="label-luxury">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-luxury" />
              </div>

              {/* Parent */}
              <div>
                <label className="label-luxury">Parent Category</label>
                <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="input-luxury">
                  <option value="">— Root Level —</option>
                  {rootCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="label-luxury">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-luxury resize-none" />
              </div>

              {/* Sort Order + Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxury">Sort Order</label>
                  <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="input-luxury" />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary w-4 h-4" />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured</label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
