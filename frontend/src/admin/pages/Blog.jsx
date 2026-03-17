import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { blogAPI } from '../../services/api';

const CATEGORIES = ['EDUCATION', 'ENGAGEMENT RING', 'GIFTING', 'TRENDS', 'BRIDAL', 'CARE & MAINTENANCE', 'DIAMONDS'];

const EMPTY_FORM = {
  title: '', slug: '', category: 'EDUCATION', excerpt: '', content: '',
  imageTitle: '', author: 'Admin', isPublished: false, isFeatured: false,
};

const slugify = (str) => str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    blogAPI.adminGetAll()
      .then((r) => setPosts(r.data.data || []))
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      title: post.title || '',
      slug: post.slug || '',
      category: post.category || 'EDUCATION',
      excerpt: post.excerpt || '',
      content: post.content || '',
      imageTitle: post.imageTitle || '',
      author: post.author || 'Admin',
      isPublished: !!post.isPublished,
      isFeatured: !!post.isFeatured,
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
      if (imageFile) fd.append('image', imageFile);
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await blogAPI.adminDelete(id);
      toast.success('Post deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      await blogAPI.adminToggle(id);
      load();
    } catch {
      toast.error('Failed to toggle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} posts total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No posts yet. Create your first post.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Post</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Author</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-center px-5 py-3 font-medium">Featured</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {post.image
                        ? <img src={post.image} alt={post.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{post.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">/blog/{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-500">{post.author}</td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleToggle(post._id)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                        post.isPublished ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${post.isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {post.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {post.isFeatured && (
                      <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Featured</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal} className="fixed inset-0 bg-black/40 z-40" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 top-8 bottom-8 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[720px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-heading font-bold text-gray-900">{modal === 'edit' ? 'Edit Post' : 'New Post'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
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
                    <input
                      type="text" value={form.title} required
                      onChange={(e) => { set('title', e.target.value); if (!editingPost) set('slug', slugify(e.target.value)); }}
                      placeholder="e.g. How To Choose an Engagement Ring" className="input-luxury"
                    />
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
                    <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-luxury">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-luxury">Author</label>
                    <input type="text" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Admin" className="input-luxury" />
                  </div>
                </div>

                {/* Image overlay title */}
                <div>
                  <label className="label-luxury">Image Card Title <span className="text-gray-400 text-[11px]">(text shown on card when no image)</span></label>
                  <input type="text" value={form.imageTitle} onChange={(e) => set('imageTitle', e.target.value)} placeholder="e.g. Engagement Ring\nTrend in 2026" className="input-luxury" />
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
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-primary" />
                    <span className="text-sm font-medium text-gray-700">Published</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-primary" />
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
