import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI, categoryAPI, attributeAPI, adminAPI, vendorAPI } from '../../services/api';
import Select from '../../components/ui/Select';
import { resizeImage } from '../../utils/resizeImage';

const SectionTitle = ({ children }) => (
  <h3 className="font-heading font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
    {children}
  </h3>
);

function DescriptionEditor({ value, onChange }) {
  const taRef = useRef(null);

  const wrap = (openTag, closeTag) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after  = value.slice(end);
    const newVal = before + openTag + selected + closeTag + after;
    onChange(newVal);
    // restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + openTag.length + selected.length + closeTag.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  const TOOLS = [
    { label: 'B', title: 'Bold',        open: '<strong>', close: '</strong>', cls: 'font-extrabold' },
    { label: 'I', title: 'Italic',      open: '<em>',     close: '</em>',     cls: 'italic' },
    { label: 'U', title: 'Underline',   open: '<u>',      close: '</u>',      cls: 'underline' },
    { label: 'H3', title: 'Heading',    open: '<h3>',     close: '</h3>',     cls: 'font-bold text-[11px]' },
    { label: 'UL', title: 'List item',  open: '<li>',     close: '</li>',     cls: 'text-xs' },
    { label: 'P',  title: 'Paragraph',  open: '<p>',      close: '</p>',      cls: 'text-xs' },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {TOOLS.map(({ label, title, open, close, cls }) => (
          <button
            key={label}
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); wrap(open, close); }}
            className={`px-2.5 py-1 rounded text-xs text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all select-none ${cls}`}
          >
            {label}
          </button>
        ))}
        <span className="ml-2 text-[10px] text-gray-400">Select text then click a style</span>
      </div>
      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        placeholder="Detailed product description... (supports HTML)"
        className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-y focus:outline-none bg-white font-mono leading-relaxed"
      />
    </div>
  );
}

export default function AdminAddProduct({ mode = 'admin' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const isVendor = mode === 'vendor';
  const listPath = isVendor ? '/vendor/products' : '/admin/products';

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [currentVideos, setCurrentVideos] = useState([]);
  const [pendingVideoFiles, setPendingVideoFiles] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    giftTags: [],
    wearingTypes: [],
    attributes: [],
    seoTitle: '',
    seoDescription: '',
    status: isVendor ? 'pending' : 'approved',
    // Jewelry details
    purity: '22kt',
    metalWeight: '',
    deliveryDays: '',
    sizesEnabled: false,
    sizesAvailable: [],
    lengthEnabled: false,
    lengthAvailable: [],
    stoneColors: [],
    diamondClarity: '',
  });

  // Separate category refresh so it can re-run when window regains focus
  const refreshCategories = () =>
    categoryAPI.getAll({ parent: 'null', limit: 200 })
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});

  useEffect(() => {
    window.addEventListener('focus', refreshCategories);
    return () => window.removeEventListener('focus', refreshCategories);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetches = [
      categoryAPI.getAll({ parent: 'null', limit: 200 }),
      attributeAPI.getAll({ limit: 100 }),
    ];
    if (isEdit) fetches.push(isVendor ? vendorAPI.getProduct(id) : productAPI.adminGetById(id));

    Promise.all(fetches).then(([catRes, attrRes, prodRes]) => {
      setCategories(catRes.data.data || []);
      setAttributes(attrRes.data.data || []);

      if (isEdit && prodRes) {
        const p = prodRes.data.data;
        if (p) {
          setCurrentImages(p.images || []);
          setCurrentVideos(p.videos || []);
          setProductId(p._id);
          setForm({
            title: p.title || '',
            sku: p.sku || '',
            shortDescription: p.shortDescription || '',
            description: p.description || '',
            category: p.category?._id || p.category || '',
            subcategory: p.subcategory?._id || p.subcategory || '',
            price: p.price ?? '',
            costPrice: p.costPrice ?? '',
            discount: p.discount || 0,
            stock: p.stock || 0,
            lengthEnabled: p.lengths?.enabled || false,
            lengthAvailable: p.lengths?.available || [],
            isFeatured: p.isFeatured || false,
            isNewArrival: p.isNewArrival || false,
            isBestSeller: p.isBestSeller || false,
            giftTags: p.giftTags || [],
            wearingTypes: p.wearingTypes || [],
            attributes: p.attributes?.map((a) => ({ attribute: a.attribute?._id || a.attribute, customValue: a.customValue || '' })) || [],
            seoTitle: p.seo?.metaTitle || '',
            seoDescription: p.seo?.metaDescription || '',
            status: isVendor ? (p.status === 'draft' ? 'draft' : 'pending') : (p.status || 'approved'),
            purity: p.purity || '22kt',
            metalWeight: p.metalWeight || '',
            deliveryDays: p.deliveryDays || '',
            sizesEnabled: p.sizes?.enabled || false,
            sizesAvailable: p.sizes?.available || [],
            stoneColors: p.stoneColors || [],
            diamondClarity: typeof p.diamondClarity === 'string' ? p.diamondClarity : '',
          });
        }
      }
    }).catch(() => {
      toast.error('Failed to load data');
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    isFeatured: isVendor ? false : form.isFeatured,
    isNewArrival: form.isNewArrival,
    isBestSeller: isVendor ? false : form.isBestSeller,
    giftTags: form.giftTags,
    wearingTypes: form.wearingTypes,
    attributes: form.attributes.filter((a) => a.customValue),
    seo: { metaTitle: form.seoTitle || form.title, metaDescription: form.seoDescription },
    status: isVendor ? (form.status === 'draft' ? 'draft' : 'pending') : form.status,
    purity: form.purity || '22kt',
    metalWeight: form.metalWeight ? parseFloat(form.metalWeight) : undefined,
    deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays) : undefined,
    sizes: { enabled: form.sizesEnabled, available: form.sizesAvailable },
    lengths: { enabled: form.lengthEnabled, available: form.lengthAvailable },
    stoneColors: form.stoneColors,
    diamondClarity: form.diamondClarity || undefined,
  });

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Product title is required');
    if (!form.category) return toast.error('Category is required');
    if (form.price === '' || form.price === null || form.price === undefined) return toast.error('Price is required');

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isVendor) {
        if (isEdit) {
          await vendorAPI.updateProduct(id, payload);
          toast.success('Product updated — pending admin review');
        } else {
          const { data } = await vendorAPI.createProduct(payload);
          const newId = data.data._id;
          setProductId(newId);
          const slots = pendingImageFiles.filter(Boolean);
          if (slots.length > 0) {
            const formData = new FormData();
            slots.forEach(({ file }) => formData.append('images', file));
            try {
              const imgRes = await vendorAPI.uploadProductImages(newId, formData);
              setCurrentImages(imgRes.data.data || []);
            } catch {
              toast.error('Product created but image upload failed');
            }
            slots.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
            setPendingImageFiles([]);
          }
          if (pendingVideoFiles.length > 0) {
            const formData = new FormData();
            pendingVideoFiles.forEach(({ file }) => formData.append('videos', file));
            try {
              const vidRes = await vendorAPI.uploadProductVideos(newId, formData);
              setCurrentVideos(vidRes.data.data || []);
            } catch {
              toast.error('Product created but video upload failed');
            }
            pendingVideoFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
            setPendingVideoFiles([]);
          }
          toast.success('Product submitted for admin review');
        }
        navigate(listPath);
        return;
      }

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
        if (pendingVideoFiles.length > 0) {
          const formData = new FormData();
          pendingVideoFiles.forEach(({ file }) => formData.append('videos', file));
          try {
            const vidRes = await adminAPI.uploadProductVideos(newId, formData);
            setCurrentVideos(vidRes.data.data || []);
          } catch {
            toast.error('Product created but video upload failed');
          }
          pendingVideoFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
          setPendingVideoFiles([]);
        }
        toast.success('Product published');
      }
      navigate(listPath);
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleSlotUpload = async (e, slotIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    const resized = await resizeImage(file, 800, 800);

    if (!productId) {
      const previewUrl = URL.createObjectURL(resized);
      setPendingImageFiles((prev) => {
        const next = [...prev];
        if (next[slotIndex]?.previewUrl) URL.revokeObjectURL(next[slotIndex].previewUrl);
        next[slotIndex] = { file: resized, previewUrl };
        return next;
      });
      e.target.value = '';
      return;
    }

    if (currentImages[slotIndex]) {
      try {
        const removeApi = isVendor ? vendorAPI.removeProductImage : productAPI.adminRemoveImage;
        const { data } = await removeApi(productId, slotIndex);
        setCurrentImages(data.data || []);
      } catch { /* ignore */ }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', resized);
      const uploadApi = isVendor ? vendorAPI.uploadProductImages : adminAPI.uploadProductImages;
      const { data } = await uploadApi(productId, formData);
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
      const removeApi = isVendor ? vendorAPI.removeProductImage : productAPI.adminRemoveImage;
      const { data } = await removeApi(productId, slotIndex);
      setCurrentImages(data.data || []);
      toast.success('Image removed');
    } catch {
      toast.error('Remove failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!productId) {
      const previews = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setPendingVideoFiles((prev) => [...prev, ...previews]);
      e.target.value = '';
      return;
    }
    setUploadingVideo(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('videos', f));
    const uploadApi = isVendor ? vendorAPI.uploadProductVideos : adminAPI.uploadProductVideos;
    uploadApi(productId, formData)
      .then(({ data }) => { setCurrentVideos(data.data || []); toast.success('Video uploaded'); })
      .catch(() => toast.error('Video upload failed'))
      .finally(() => { setUploadingVideo(false); e.target.value = ''; });
  };

  const handleRemoveVideo = async (idx) => {
    if (!productId) {
      setPendingVideoFiles((prev) => {
        const next = [...prev];
        if (next[idx]?.previewUrl) URL.revokeObjectURL(next[idx].previewUrl);
        return next.filter((_, i) => i !== idx);
      });
      return;
    }
    setUpdating(true);
    try {
      const removeApi = isVendor ? vendorAPI.removeProductVideo : adminAPI.removeProductVideo;
      const { data } = await removeApi(productId, idx);
      setCurrentVideos(data.data || []);
      toast.success('Video removed');
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
          <p className="text-sm text-gray-400 mt-0.5">
            {isVendor
              ? 'Vendor — product is submitted for admin approval before going live'
              : 'Admin — product goes live immediately on publish'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(listPath)} className="btn-outline text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : (isVendor ? 'Submit for Review' : 'Publish Product')}
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
                <DescriptionEditor value={form.description} onChange={(v) => set('description', v)} />
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
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{isVendor && Number(c.commissionRate) > 0 ? ` (${c.commissionRate}% fee)` : ''}
                    </option>
                  ))}
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
            </div>
            {isVendor && form.category && (() => {
              const selectedCat = categories.find((c) => c._id === form.category);
              const commissionRate = Number(selectedCat?.commissionRate) || 0;
              const priceNum = Number(form.price) || 0;
              const estimatedCut = Math.round((priceNum * commissionRate) / 100);
              const estimatedPayout = Math.max(0, priceNum - estimatedCut);
              return (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 space-y-1">
                  <p className="font-bold text-amber-900">Platform fee on sale (not added to customer price)</p>
                  <p>
                    Category <strong>{selectedCat?.name || '—'}</strong> — commission{' '}
                    <strong>{commissionRate}%</strong> will be deducted from your payout when this product sells.
                  </p>
                  {priceNum > 0 && (
                    <p className="text-xs text-amber-800/90 pt-1">
                      Example on ₹{priceNum.toLocaleString('en-IN')}: customer pays ₹{priceNum.toLocaleString('en-IN')} ·
                      platform cuts ₹{estimatedCut.toLocaleString('en-IN')} · you receive ≈ ₹{estimatedPayout.toLocaleString('en-IN')}
                    </p>
                  )}
                  <p className="text-[11px] text-amber-700/80">GST &amp; delivery (if any) are separate from this fee.</p>
                </div>
              );
            })()}
          </div>

          {/* Visibility flags */}
          <div className="card-luxury p-6">
            <SectionTitle>Visibility Flags</SectionTitle>
            <div className="flex flex-wrap gap-4">
              {(isVendor
                ? [['isNewArrival', 'New Arrival']]
                : [['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller']]
              ).map(([field, label]) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="label-luxury">Status</label>
              {isVendor ? (
                <Select value={form.status === 'draft' ? 'draft' : 'pending'} onChange={(e) => set('status', e.target.value)} className="max-w-xs">
                  <option value="pending">Submit for Review</option>
                  <option value="draft">Draft (Hidden)</option>
                </Select>
              ) : (
                <Select value={form.status} onChange={(e) => set('status', e.target.value)} className="max-w-xs">
                  <option value="approved">Approved (Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </Select>
              )}
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

          {/* Jewelry Details */}
          <div className="card-luxury p-6">
            <SectionTitle>Jewelry Details</SectionTitle>
            <div className="space-y-5">

              {/* Purity + Metal Weight + Delivery Days */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-luxury">Purity</label>
                  <input type="text" value={form.purity} disabled className="input-luxury bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="label-luxury">Metal Weight (g)</label>
                  <input type="number" value={form.metalWeight} onChange={(e) => set('metalWeight', e.target.value)} min="0" step="0.01" placeholder="e.g. 5.2" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Delivery Days</label>
                  <input type="number" value={form.deliveryDays} onChange={(e) => set('deliveryDays', e.target.value)} min="0" placeholder="e.g. 7" className="input-luxury" />
                </div>
              </div>

              {/* Diamond Clarity */}
              <div>
                <label className="label-luxury mb-2">Diamond Clarity</label>
                <Select value={form.diamondClarity} onChange={(e) => set('diamondClarity', e.target.value)} compact className="w-48">
                  <option value="">Not applicable</option>
                  <option value="Natural">Natural</option>
                  <option value="CZ">CZ</option>
                </Select>
              </div>

              {/* Stone Colors */}
              <div>
                <label className="label-luxury mb-2">Stone Colors <span className="text-gray-400 font-normal">(customer selects on product page)</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['White', 'Yellow', 'Pink', 'Red', 'Blue', 'Green', 'Purple', 'Black', 'Orange', 'Brown', 'Champagne', 'Rose', 'Teal', 'Multi-color'].map((color) => {
                    const active = form.stoneColors.includes(color);
                    return (
                      <button key={color} type="button"
                        onClick={() => set('stoneColors', active ? form.stoneColors.filter((c) => c !== color) : [...form.stoneColors, color])}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'}`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                {form.stoneColors.length > 0 && (
                  <p className="text-[11px] text-primary mt-1.5 font-medium">{form.stoneColors.length} color{form.stoneColors.length > 1 ? 's' : ''} selected</p>
                )}
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label-luxury mb-0">Sizes (5–25)</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">{form.sizesEnabled ? 'Enabled — shown on website' : 'Disabled — hidden'}</span>
                    <button type="button" onClick={() => setForm((prev) => ({
                      ...prev,
                      sizesEnabled: !prev.sizesEnabled,
                      sizesAvailable: !prev.sizesEnabled ? Array.from({ length: 41 }, (_, i) => 5 + i * 0.5) : [],
                    }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${form.sizesEnabled ? 'bg-primary' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sizesEnabled ? 'translate-x-4' : ''}`} />
                    </button>
                  </label>
                </div>
              </div>

              {/* Length */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label-luxury mb-0">Length (inches)</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">{form.lengthEnabled ? 'Enabled — shown on website' : 'Disabled — hidden'}</span>
                    <button type="button" onClick={() => setForm((prev) => ({
                      ...prev,
                      lengthEnabled: !prev.lengthEnabled,
                      lengthAvailable: !prev.lengthEnabled ? Array.from({ length: 41 }, (_, i) => 5 + i) : [],
                    }))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${form.lengthEnabled ? 'bg-primary' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.lengthEnabled ? 'translate-x-4' : ''}`} />
                    </button>
                  </label>
                </div>
              </div>

            </div>
          </div>

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
          {/* Images — 4 slots */}
          <div className="card-luxury p-6">
            <SectionTitle>Product Images</SectionTitle>
            <p className="text-xs text-gray-400 mb-2 leading-snug">
              Up to 4 images. Image 1 is the main photo; Image 2 shows on card hover.
            </p>
            <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="text-[11px] text-gray-500"><strong className="text-gray-700">800 × 800 px</strong> &nbsp;·&nbsp; Square 1:1 &nbsp;·&nbsp; JPG, PNG, WEBP &nbsp;·&nbsp; Max 5 MB</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const saved   = currentImages[slotIdx];
                const pending = pendingImageFiles[slotIdx];
                const imgUrl  = saved?.url || pending?.previewUrl || null;
                const label   = slotIdx === 0 ? 'Main Image' : `Image ${slotIdx + 1}`;
                const hint    = slotIdx === 0 ? 'Always shown' : slotIdx === 1 ? 'Hover image' : '';
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
                        <label htmlFor={inputId} className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer text-gray-300 hover:text-primary hover:border-primary transition-colors px-1 text-center">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[11px] font-semibold text-gray-400">Upload</span>
                          <span className="text-[9px] text-gray-300 font-mono">800 × 800 px</span>
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

            {!productId && pendingImageFiles.some(Boolean) && (
              <p className="mt-3 text-[10px] text-amber-600 text-center">
                Images will be uploaded when you save the product.
              </p>
            )}
          </div>

          {/* Videos — unlimited */}
          <div className="card-luxury p-6">
            <SectionTitle>Product Videos</SectionTitle>
            <p className="text-xs text-gray-400 mb-2 leading-snug">
              Add as many videos as needed. Shown in the product gallery after images.
            </p>
            <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span className="text-[11px] text-gray-500"><strong className="text-gray-700">1280 × 720 px</strong> &nbsp;·&nbsp; 16:9 &nbsp;·&nbsp; MP4, MOV, WEBM &nbsp;·&nbsp; Max 100 MB per file</span>
            </div>

            <div className="space-y-2">
              {/* Existing / pending videos */}
              {[...currentVideos, ...pendingVideoFiles].map((item, idx) => {
                const isPending = idx >= currentVideos.length;
                const url = isPending ? item.previewUrl : item.url;
                const realIdx = isPending ? null : idx;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <video src={url} className="w-full h-full object-cover" muted />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {isPending ? (item.file?.name || 'Pending') : `Video ${idx + 1}`}
                      </p>
                      {isPending && <span className="text-[10px] text-amber-600 font-semibold">PENDING UPLOAD</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(isPending ? idx - currentVideos.length : realIdx)}
                      disabled={updating}
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {/* Add video button */}
              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer text-sm font-semibold transition-colors ${uploadingVideo ? 'opacity-50 pointer-events-none' : 'hover:border-primary hover:text-primary text-gray-400'}`}>
                {uploadingVideo ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span className="flex flex-col items-center leading-tight">
                      <span>Add Video</span>
                      <span className="text-[10px] font-normal font-mono text-gray-400">1280 × 720 px</span>
                    </span>
                  </>
                )}
                <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} disabled={uploadingVideo} />
              </label>

              {!productId && pendingVideoFiles.length > 0 && (
                <p className="text-[10px] text-amber-600 text-center">
                  Videos will be uploaded when you save the product.
                </p>
              )}
            </div>
          </div>

          {/* Price preview */}
          {form.price !== '' && (
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
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : (isVendor ? 'Submit for Review' : 'Publish Product')}
            </button>
            <button onClick={() => navigate(listPath)} className="btn-outline w-full">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
