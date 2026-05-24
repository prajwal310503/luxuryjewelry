import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { blogAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Tip from '../components/Tip';
import Select from '../../components/ui/Select';
import { resizeImage } from '../../utils/resizeImage';

const CATEGORIES = ['EDUCATION', 'ENGAGEMENT RING', 'GIFTING', 'TRENDS', 'BRIDAL', 'CARE & MAINTENANCE', 'DIAMONDS'];

const EMPTY_FORM = {
  title: '', slug: '', category: 'EDUCATION', excerpt: '', content: '',
  imageTitle: '', author: 'Admin', isPublished: false, isFeatured: false,
};

const slugify = (str) => str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcPlus  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IcEdit  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IcTrash = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IcClose = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IcImg   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

export default function AdminBlog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts]               = useState([]);
  const [meta, setMeta]                 = useState({});
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null); // null | 'add' | 'edit'
  const [editingPost, setEditingPost]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toggling, setToggling]         = useState(null);
  const fileRef = useRef(null);

  const page     = parseInt(searchParams.get('page')) || 1;
  const search   = searchParams.get('search') || '';
  const status   = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await blogAPI.adminGetAll({ page, limit: 10, search, status, category });
      setPosts(data.data || []);
      setMeta(data.meta || {});
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [page, search, status, category]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key, val) => setSearchParams((prev) => {
    const p = Object.fromEntries(prev);
    p[key] = val;
    p.page = 1;
    return p;
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setEditingPost(null);
    setModal('add');
  };

  const openEdit = (post) => {
    setForm({
      title: post.title || '', slug: post.slug || '', category: post.category || 'EDUCATION',
      excerpt: post.excerpt || '', content: post.content || '', imageTitle: post.imageTitle || '',
      author: post.author || 'Admin', isPublished: !!post.isPublished, isFeatured: !!post.isFeatured,
    });
    setImageFile(null);
    setImagePreview(post.image || '');
    setEditingPost(post);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditingPost(null); };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', await resizeImage(imageFile, 1200, 450));
      if (modal === 'edit') {
        await blogAPI.adminUpdate(editingPost._id, fd);
        toast.success('Post updated');
      } else {
        await blogAPI.adminCreate(fd);
        toast.success('Post created');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await blogAPI.adminDelete(deleteTarget._id);
      toast.success('Post deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handleToggle = async (post) => {
    setToggling(post._id);
    try {
      await blogAPI.adminToggle(post._id);
      load();
    } catch { toast.error('Failed to toggle'); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta.total ?? 0} posts total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <IcPlus /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} compact className="w-36">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
        <Select value={category} onChange={(e) => setParam('category', e.target.value)} compact className="w-44">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Post', 'Category', 'Author', 'Status', 'Featured', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 shimmer-loading rounded-lg flex-shrink-0" />
                        <div className="space-y-2">
                          <div className="shimmer-text h-3.5 w-36 rounded" />
                          <div className="shimmer-text h-2.5 w-48 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-16 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="flex gap-1.5"><div className="shimmer-loading w-8 h-8 rounded-lg" /><div className="shimmer-loading w-8 h-8 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-300">No posts found</td></tr>
              ) : posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Post */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {post.image
                        ? <img src={post.image} alt={post.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300"><IcImg /></div>
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{post.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">/blog/{post.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4">
                    <span className="badge text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                      {post.category}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="px-5 py-4 text-sm text-gray-600">{post.author || '—'}</td>

                  {/* Status — clickable toggle */}
                  <td className="px-5 py-4">
                    <Tip label={post.isPublished ? 'Click to Unpublish' : 'Click to Publish'}>
                      <button
                        onClick={() => handleToggle(post)}
                        disabled={toggling === post._id}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-colors disabled:opacity-60 ${
                          post.isPublished
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${post.isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {toggling === post._id ? '…' : post.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </Tip>
                  </td>

                  {/* Featured */}
                  <td className="px-5 py-4">
                    {post.isFeatured
                      ? <span className="badge text-xs" style={{ backgroundColor: 'rgba(90,65,63,0.08)', color: '#5a413f' }}>Featured</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('en-IN')}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Tip label="Edit">
                        <button
                          onClick={() => openEdit(post)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <IcEdit />
                        </button>
                      </Tip>
                      <Tip label="Delete">
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <IcTrash />
                        </button>
                      </Tip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pages={meta.pages}
          total={meta.total}
          shown={posts.length}
          onPage={(p) => setSearchParams((prev) => ({ ...Object.fromEntries(prev), page: p }))}
        />
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
              <IcTrash />
            </div>
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-gray-900">Delete Post</h3>
              <p className="text-sm text-gray-500 mt-1">
                Delete <span className="font-semibold text-gray-700">"{deleteTarget.title}"</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal} className="fixed inset-0 bg-black/40 z-40" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 top-8 bottom-8 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[720px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-heading font-bold text-gray-900">{modal === 'edit' ? 'Edit Post' : 'New Post'}</h2>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <IcClose />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Cover image */}
                <div>
                  <label className="label-luxury">Cover Image</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-primary/40 transition-colors"
                    style={{ aspectRatio: '16/6' }}
                  >
                    {imagePreview
                      ? <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
                          <IcImg />
                          <p className="text-sm">Click to upload cover image</p>
                        </div>
                    }
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                {/* Title + Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxury">Title *</label>
                    <input type="text" value={form.title} required
                      onChange={(e) => { set('title', e.target.value); if (!editingPost) set('slug', slugify(e.target.value)); }}
                      placeholder="e.g. How To Choose an Engagement Ring" className="input-luxury" />
                  </div>
                  <div>
                    <label className="label-luxury">Slug</label>
                    <input type="text" value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} className="input-luxury" />
                  </div>
                </div>

                {/* Category + Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-luxury">Category</label>
                    <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="label-luxury">Author</label>
                    <input type="text" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Admin" className="input-luxury" />
                  </div>
                </div>

                {/* Image card title */}
                <div>
                  <label className="label-luxury">Image Card Title <span className="text-gray-400 text-[11px]">(text shown on card when no image)</span></label>
                  <input type="text" value={form.imageTitle} onChange={(e) => set('imageTitle', e.target.value)} placeholder="e.g. Engagement Ring Trend in 2026" className="input-luxury" />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="label-luxury">Excerpt / Summary</label>
                  <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} placeholder="Brief summary shown in listings..." className="input-luxury resize-none" />
                </div>

                {/* Content */}
                <div>
                  <label className="label-luxury">Content <span className="text-gray-400 text-[11px]">(use blank lines between paragraphs)</span></label>
                  <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={10} placeholder="Write your blog post content here..." className="input-luxury resize-none font-mono text-sm" />
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-primary" />
                    <span className="text-sm font-medium text-gray-700">Published</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-primary" />
                    <span className="text-sm font-medium text-gray-700">Featured on Home</span>
                  </label>
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="btn-outline">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
                  {saving ? 'Saving…' : modal === 'edit' ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
