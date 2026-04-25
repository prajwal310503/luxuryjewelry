import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI, categoryAPI, attributeAPI, adminAPI } from '../../services/api';
import Select from '../../components/ui/Select';

const SectionTitle = ({ children }) => (
  <h3 className="font-heading font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
    {children}
  </h3>
);

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [productId, setProductId] = useState(id || null);

  const [form, setForm] = useState({
    title: '',
    sku: '',
    shortDescription: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    costPrice: '',
    discount: 0,
    stock: 0,
    weight: '',
    length: '',
    color: '',
    metalColor: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    giftTags: [],
    wearingTypes: [],
    attributes: [],
    seoTitle: '',
    seoDescription: '',
    status: 'approved',
  });

  useEffect(() => {
    const fetches = [
      categoryAPI.getAll({ parent: 'null', limit: 100 }),
      attributeAPI.getAll({ limit: 100 }),
    ];
    if (isEdit) fetches.push(productAPI.adminGetById(id));

    Promise.all(fetches).then(([catRes, attrRes, prodRes]) => {
      setCategories(catRes.data.data || []);
      setAttributes(attrRes.data.data || []);

      if (isEdit && prodRes) {
        const p = prodRes.data.data;
        if (p) {
          setCurrentImages(p.images || []);
          setProductId(p._id);
          setForm({
            title: p.title || '',
            sku: p.sku || '',
            shortDescription: p.shortDescription || '',
            description: p.description || '',
            category: p.category?._id || p.category || '',
            subcategory: p.subcategory?._id || p.subcategory || '',
            price: p.price || '',
            costPrice: p.costPrice || '',
            discount: p.discount || 0,
            stock: p.stock || 0,
            weight: p.weight || '',
            length: p.length || '',
            color: p.color || '',
            metalColor: p.metalColor || '',
            isFeatured: p.isFeatured || false,
            isNewArrival: p.isNewArrival || false,
            isBestSeller: p.isBestSeller || false,
            giftTags: p.giftTags || [],
            wearingTypes: p.wearingTypes || [],
            attributes: p.attributes?.map((a) => ({ attribute: a.attribute?._id || a.attribute, customValue: a.customValue || '' })) || [],
            seoTitle: p.seo?.metaTitle || '',
            seoDescription: p.seo?.metaDescription || '',
            status: p.status || 'approved',
          });
        }
      }
    }).catch(() => {
      toast.error('Failed to load data');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (form.category) {
      categoryAPI.getAll({ parent: form.category, limit: 100 })
        .then(({ data }) => setSubcategories(data.data || []))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [form.category]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleAttributeValue = (attrId, value) => {
    setForm((prev) => {
      const existing = prev.attributes.find((a) => a.attribute === attrId);
      if (existing) {
        return { ...prev, attributes: prev.attributes.map((a) => a.attribute === attrId ? { ...a, customValue: value } : a) };
      }
      return { ...prev, attributes: [...prev.attributes, { attribute: attrId, customValue: value }] };
    });
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    sku: form.sku.trim() || undefined,
    shortDescription: form.shortDescription,
    description: form.description,
    category: form.category,
    subcategory: form.subcategory || undefined,
    price: parseFloat(form.price),
    costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
    discount: parseInt(form.discount) || 0,
    stock: parseInt(form.stock) || 0,
    weight: form.weight ? parseFloat(form.weight) : undefined,
    length: form.length || undefined,
    color: form.color || undefined,
    metalColor: form.metalColor || undefined,
    isFeatured: form.isFeatured,
    isNewArrival: form.isNewArrival,
    isBestSeller: form.isBestSeller,
    giftTags: form.giftTags,
    wearingTypes: form.wearingTypes,
    attributes: form.attributes.filter((a) => a.customValue),
    seo: { metaTitle: form.seoTitle || form.title, metaDescription: form.seoDescription },
    status: form.status,
  });

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Product title is required');
    if (!form.category) return toast.error('Category is required');
    if (!form.price) return toast.error('Price is required');

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await productAPI.adminUpdate(id, payload);
        toast.success('Product updated');
      } else {
        const { data } = await productAPI.adminCreate(payload);
        const newId = data.data._id;
        setProductId(newId);
        const slots = pendingImageFiles.filter(Boolean);
        if (slots.length > 0) {
          const formData = new FormData();
          slots.forEach(({ file }) => formData.append('images', file));
          try {
            const imgRes = await adminAPI.uploadProductImages(newId, formData);
            setCurrentImages(imgRes.data.data || []);
          } catch {
            toast.error('Product created but image upload failed');
          }
          slots.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
          setPendingImageFiles([]);
        }
        toast.success('Product published');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleSlotUpload = async (e, slotIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!productId) {
      const previewUrl = URL.createObjectURL(file);
      setPendingImageFiles((prev) => {
        const next = [...prev];
        if (next[slotIndex]?.previewUrl) URL.revokeObjectURL(next[slotIndex].previewUrl);
        next[slotIndex] = { file, previewUrl };
        return next;
      });
      e.target.value = '';
      return;
    }

    if (currentImages[slotIndex]) {
      try {
        const { data } = await productAPI.adminRemoveImage(productId, slotIndex);
        setCurrentImages(data.data || []);
      } catch { /* ignore */ }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await adminAPI.uploadProductImages(productId, formData);
      setCurrentImages(data.data || []);
      toast.success(slotIndex === 0 ? 'Main image updated' : 'Hover image updated');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (slotIndex) => {
    if (!productId) {
      setPendingImageFiles((prev) => {
        const next = [...prev];
        if (next[slotIndex]?.previewUrl) URL.revokeObjectURL(next[slotIndex].previewUrl);
        next[slotIndex] = undefined;
        return next;
      });
      return;
    }
    if (!currentImages[slotIndex]) return;
    setUpdating(true);
    try {
      const { data } = await productAPI.adminRemoveImage(productId, slotIndex);
      setCurrentImages(data.data || []);
      toast.success('Image removed');
    } catch {
      toast.error('Remove failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 shimmer-loading rounded-xl w-48" />
        <div className="h-96 shimmer-loading rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Admin — product goes live immediately on publish</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/products')} className="btn-outline text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="card-luxury p-6">
            <SectionTitle>Basic Information</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="label-luxury">Product Title *</label>
                <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 22Kt Gold Floral Necklace" className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">SKU (optional)</label>
                <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. NK-22KT-001" className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Short Description</label>
                <textarea value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} rows={2} maxLength={500} placeholder="Brief summary (max 500 chars)" className="input-luxury resize-none" />
                <p className="text-2xs text-gray-400 mt-1">{form.shortDescription.length}/500</p>
              </div>
              <div>
                <label className="label-luxury">Full Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Detailed product description..." className="input-luxury resize-none" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="card-luxury p-6">
            <SectionTitle>Category</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Category *</label>
                <Select value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Select Category">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="label-luxury">Subcategory</label>
                <Select value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="Select Subcategory" disabled={!form.category || subcategories.length === 0}>
                  <option value="">Select Subcategory</option>
                  {subcategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card-luxury p-6">
            <SectionTitle>Pricing &amp; Stock</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-luxury">Selling Price (₹) *</label><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Cost Price (₹)</label><input type="number" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Discount (%)</label><input type="number" value={form.discount} onChange={(e) => set('discount', e.target.value)} min="0" max="100" className="input-luxury" /></div>
              <div><label className="label-luxury">Stock Quantity</label><input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Weight (g)</label><input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} min="0" step="0.1" className="input-luxury" /></div>
            </div>
          </div>

          {/* Product Details */}
          <div className="card-luxury p-6">
            <SectionTitle>Product Details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Length</label>
                <input type="text" value={form.length} onChange={(e) => set('length', e.target.value)} placeholder="e.g. 18 inches" className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Color</label>
                <input type="text" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. Red, Green" className="input-luxury" />
              </div>
              <div className="col-span-2">
                <label className="label-luxury">Metal Color</label>
                <div className="flex gap-3 mt-1">
                  {['Gold', 'Silver', 'Platinum'].map((mc) => (
                    <label key={mc} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="metalColor"
                        value={mc}
                        checked={form.metalColor === mc}
                        onChange={() => set('metalColor', mc)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-gray-700">{mc}</span>
                    </label>
                  ))}
                  {form.metalColor && (
                    <button type="button" onClick={() => set('metalColor', '')} className="text-xs text-gray-400 hover:text-red-400 ml-2">Clear</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visibility flags */}
          <div className="card-luxury p-6">
            <SectionTitle>Visibility Flags</SectionTitle>
            <div className="flex flex-wrap gap-4">
              {[['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller']].map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="label-luxury">Status</label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)} className="max-w-xs">
                <option value="approved">Approved (Live)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </div>

          {/* Dynamic Attributes */}
          {(() => {
            const HIDDEN_ATTRS = ['bracelet size', 'ring size', 'gemstone', 'diamond type', 'diamond clarity', 'other metal', 'chain length', 'meena color', 'metal color'];
            const visibleAttrs = attributes.filter((a) => !HIDDEN_ATTRS.includes(a.name.toLowerCase()));
            return visibleAttrs.length > 0 ? (
              <div className="card-luxury p-6">
                <SectionTitle>Product Attributes</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  {visibleAttrs.map((attr) => (
                    <div key={attr._id}>
                      <label className="label-luxury">{attr.name}</label>
                      <input type="text" value={form.attributes.find((a) => a.attribute === attr._id)?.customValue || ''} onChange={(e) => handleAttributeValue(attr._id, e.target.value)} placeholder={`Enter ${attr.name}`} className="input-luxury" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* SEO */}
          <div className="card-luxury p-6">
            <SectionTitle>SEO</SectionTitle>
            <div className="space-y-4">
              <div><label className="label-luxury">Meta Title</label><input type="text" value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} placeholder="Leave blank to use product title" className="input-luxury" /></div>
              <div><label className="label-luxury">Meta Description</label><textarea value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} className="input-luxury resize-none" /></div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Images — exactly 2 slots */}
          <div className="card-luxury p-6">
            <SectionTitle>Product Images</SectionTitle>
            <p className="text-xs text-gray-400 mb-4 leading-snug">
              Slot 1 is shown by default. Slot 2 appears when customer hovers the product card.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((slotIdx) => {
                const saved   = currentImages[slotIdx];
                const pending = pendingImageFiles[slotIdx];
                const imgUrl  = saved?.url || pending?.previewUrl || null;
                const label   = slotIdx === 0 ? 'Main Image' : 'Hover Image';
                const hint    = slotIdx === 0 ? 'Shown always' : 'Shown on hover';
                const inputId = `img-slot-${slotIdx}`;

                return (
                  <div key={slotIdx} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      <span className="text-[10px] text-gray-400">{hint}</span>
                    </div>

                    <div className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-luxury-cream">
                      {imgUrl ? (
                        <>
                          <img src={imgUrl} alt={label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <label htmlFor={inputId} className="cursor-pointer flex items-center gap-1.5 bg-white/90 text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Replace
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slotIdx)}
                              disabled={updating}
                              className="flex items-center gap-1.5 bg-red-500/90 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Remove
                            </button>
                          </div>
                          {pending && !saved && (
                            <span className="absolute top-2 left-2 text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full">PENDING</span>
                          )}
                        </>
                      ) : (
                        <label htmlFor={inputId} className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-300 hover:text-primary hover:border-primary transition-colors">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[11px] font-semibold text-gray-400">Upload</span>
                        </label>
                      )}
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSlotUpload(e, slotIdx)}
                        className="hidden"
                        disabled={uploading || updating}
                      />
                    </div>

                    {uploading && (
                      <p className="text-[10px] text-amber-600 text-center">Uploading…</p>
                    )}
                  </div>
                );
              })}
            </div>

            {!productId && (pendingImageFiles[0] || pendingImageFiles[1]) && (
              <p className="mt-3 text-[10px] text-amber-600 text-center">
                Images will be uploaded when you save the product.
              </p>
            )}
          </div>

          {/* Price preview */}
          {form.price && (
            <div className="card-luxury p-6">
              <SectionTitle>Price Preview</SectionTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Selling Price</span>
                  <span className="font-semibold">₹{parseFloat(form.price || 0).toLocaleString('en-IN')}</span>
                </div>
                {form.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">{form.discount}% off</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-luxury p-4 flex flex-col gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Product'}
            </button>
            <button onClick={() => navigate('/admin/products')} className="btn-outline w-full">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
