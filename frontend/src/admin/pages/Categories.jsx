import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { categoryAPI } from '../../services/api';
import Select from '../../components/ui/Select';
import Pagination from '../components/Pagination';
import { resizeImage } from '../../utils/resizeImage';

const EMPTY = { name: '', description: '', parent: '', sortOrder: 0, isFeatured: false };
const PAGE_SIZE = 8;

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
function Tip({ label, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium text-white bg-gray-800 opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
        {label}
      </span>
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          {danger ? (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
        </div>
        <h3 className="font-heading text-base font-bold text-gray-900 text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1 justify-center text-sm py-2">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 justify-center text-sm py-2 rounded-xl font-medium text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories]     = useState([]);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [presetParent, setPresetParent] = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirm, setConfirm]           = useState({ open: false, title: '', message: '', confirmLabel: '', danger: false, onConfirm: null });
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll({ limit: 200 });
      setCategories(data.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const rootCategories = categories.filter((c) => !c.parent);
  const subsOf = (parentId) => categories.filter(
    (c) => c.parent === parentId || c.parent?._id === parentId
  );
  const pagedRoots = rootCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Confirm helper ────────────────────────────────────────────────────────
  const askConfirm = ({ title, message, confirmLabel, danger, onConfirm }) =>
    setConfirm({ open: true, title, message, confirmLabel, danger, onConfirm });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  // ── Open modals ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null); setPresetParent(null);
    setForm(EMPTY); setImageFile(null); setImagePreview(null);
    setShowModal(true);
  };

  const openAddSub = (parentCat) => {
    setEditItem(null); setPresetParent(parentCat);
    setForm({ ...EMPTY, parent: parentCat._id });
    setImageFile(null); setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat); setPresetParent(null);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parent: cat.parent?._id || cat.parent || '',
      sortOrder: cat.sortOrder || 0,
      isFeatured: cat.isFeatured || false,
    });
    setImageFile(null); setImagePreview(null);
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
      if (imageFile) fd.append('image', await resizeImage(imageFile, 600, 400));
      if (editItem) {
        await categoryAPI.adminUpdate(editItem._id, fd);
        toast.success('Category updated');
      } else {
        await categoryAPI.adminCreate(fd);
        toast.success(presetParent ? `Subcategory added to ${presetParent.name}` : 'Category created');
      }
      setShowModal(false);
      load();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (id) => {
    askConfirm({
      title: 'Deactivate Category',
      message: 'This category will be hidden from the storefront. You can reactivate it later.',
      confirmLabel: 'Deactivate',
      danger: false,
      onConfirm: async () => {
        closeConfirm();
        try {
          await categoryAPI.adminDelete(id);
          toast.success('Category deactivated');
          load();
        } catch (error) {
          toast.error(error.message || 'Failed');
        }
      },
    });
  };

  const handlePermanentDelete = (cat) => {
    askConfirm({
      title: 'Delete Permanently',
      message: `"${cat.name}" will be removed forever. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await categoryAPI.adminPermanentDelete(cat._id);
          toast.success(`"${cat.name}" deleted`);
          load();
        } catch (error) {
          toast.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const currentPreview = imagePreview || (editItem?.image || null);
  const modalTitle = editItem
    ? `Edit — ${editItem.name}`
    : presetParent
    ? `Add Subcategory to "${presetParent.name}"`
    : 'New Category';

  // ── Row (plain function, not a component, to avoid remount issues) ────────
  const renderRow = (cat, isSubcategory = false) => (
    <tr key={cat._id} className={`hover:bg-gray-50/50 ${isSubcategory ? 'bg-gray-50/30' : ''}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3" style={{ paddingLeft: isSubcategory ? '20px' : '0' }}>
          {isSubcategory && (
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <div className={`${isSubcategory ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0`}>
            {cat.image
              ? <img src={cat.image} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
              )
            }
          </div>
          <div>
            <p className={`font-medium text-gray-800 ${isSubcategory ? 'text-xs' : 'text-sm'}`}>{cat.name}</p>
            <p className="text-[11px] text-gray-400">/{cat.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{cat.level === 0 ? 'Root' : `Sub (L${cat.level})`}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{cat.sortOrder}</td>
      <td className="px-5 py-3.5">
        <span className={`badge text-xs ${cat.isFeatured ? 'badge-success' : 'bg-gray-100 text-gray-400'}`}>
          {cat.isFeatured ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className={`badge text-xs ${cat.isActive ? 'badge-success' : 'badge-danger'}`}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex gap-1.5 items-center">
          {/* Edit */}
          <Tip label="Edit">
            <button
              onClick={() => openEdit(cat)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </button>
          </Tip>
          {/* Add Subcategory */}
          {!isSubcategory && (
            <Tip label="Add Subcategory">
              <button
                onClick={() => openAddSub(cat)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </Tip>
          )}
          {/* Deactivate */}
          {cat.isActive && (
            <Tip label="Deactivate">
              <button
                onClick={() => handleDeactivate(cat._id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </Tip>
          )}
          {/* Permanent Delete */}
          <Tip label="Delete permanently">
            <button
              onClick={() => handlePermanentDelete(cat)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </Tip>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">Root categories and their subcategories. Both are available in Add Product.</p>
        </div>
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
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded" /></td>
                  ))}</tr>
                ))
              ) : rootCategories.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-300">No categories</td></tr>
              ) : pagedRoots.map((root) => [
                renderRow(root, false),
                ...subsOf(root._id).map((sub) => renderRow(sub, true)),
              ])}
            </tbody>
          </table>
        </div>
      </div>

      {rootCategories.length > PAGE_SIZE && (
        <Pagination
          page={page}
          pages={Math.ceil(rootCategories.length / PAGE_SIZE)}
          total={rootCategories.length}
          shown={pagedRoots.reduce((acc, r) => acc + 1 + subsOf(r._id).length, 0)}
          onPage={(p) => setPage(p)}
        />
      )}

      {/* ── Confirm modal ───────────────────────────────────────────────────── */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      {/* ── Edit / Create modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-lg font-bold">{modalTitle}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              <div>
                <label className="label-luxury">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                  placeholder={presetParent ? `e.g. Solitaire ${presetParent.name}` : 'Category name'}
                  className="input-luxury"
                />
              </div>

              {!presetParent && !(editItem?.parent) && (
                <>
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
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5 MB · auto-resized to 600 × 400 px</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])} />
                  </div>

                  <div>
                    <label className="label-luxury">Parent Category</label>
                    <Select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
                      <option value="">— Root Level —</option>
                      {rootCategories.filter((c) => !editItem || c._id !== editItem._id).map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="label-luxury">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-luxury resize-none" />
                  </div>

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
                </>
              )}

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
