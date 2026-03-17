import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI, categoryAPI, attributeAPI } from '../../services/api';

const SEGMENTS = ['New Arrival', 'Best Seller', 'Trending', 'Customer Choice', 'Deal of Day', 'Deal of Week', 'Exclusive', 'Limited', 'In Stock', 'Fast Delivery'];
const OCCASIONS = ['Womens Day', 'Mothers Day', 'Valentine', 'Engagement', 'Wedding', 'Anniversary', 'Proposal', 'Birthday', 'Festival', 'Daily Wear', 'Office Wear', 'Party Wear'];
const COLLECTION_STYLES = ['Nature', 'Geometric', 'Cultural', 'Luxury', 'Minimal', 'Playful', 'Seasonal'];
const THEMES = ['Peacock', 'Spiritual', 'Traditional', 'Floral', 'Cluster', 'Heart', 'Leaf', 'Butterfly', 'Galaxy', 'Art'];
const PERSONAS = ['Minimalist', 'Classic', 'Fashionable', 'Quirky', 'Contemporary', 'Designer'];
const WEARING_TYPES = ['Daily', 'Office', 'Party'];
const GIFT_TAGS = ['Birthday', 'Wedding', 'Mother', 'Husband', 'Father', 'Friends', 'Baby'];
const MEENA_COLORS = ['Blue', 'Brown', 'Gray', 'Green', 'Maroon', 'Orange', 'Pink', 'Purple', 'Red', 'White', 'Yellow'];

const MultiSelect = ({ label, options, value, onChange }) => (
  <div>
    <label className="label-luxury">{label}</label>
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            value.includes(opt)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="font-heading font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
    {children}
  </h3>
);

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);

  const [form, setForm] = useState({
    title: '', sku: '', shortDescription: '', description: '',
    category: '', subcategory: '',
    price: '', comparePrice: '', costPrice: '', discount: 0, stock: 0, weight: '',
    segments: [], occasions: [], collectionStyles: [], themes: [],
    productPersonas: [], wearingTypes: [], giftTags: [], meenaColors: [],
    attributes: [],
    seoTitle: '', seoDescription: '',
    status: 'draft',
    priceBreakup: {
      metalType: '', grossWeight: '', netWeight: '', metalRate: '', metalAmount: '',
      diamondPieces: '', diamondCarat: '', diamondClarity: '', diamondCut: '', diamondColor: '',
      diamondAmount: '', diamondOriginalAmount: '', diamondDiscountPct: '',
      makingCharges: '', makingChargesOriginal: '', makingChargesDiscountPct: '', gstPct: 3,
    },
    certifications: [],
    packageImages: '',
    promoBannerImage: '',
  });

  useEffect(() => {
    Promise.all([
      productAPI.getBySlug(id),
      categoryAPI.getAll({ parent: 'null', limit: 100 }),
      attributeAPI.getAll({ limit: 100 }),
    ]).then(([prodRes, catRes, attrRes]) => {
      const p = prodRes.data.data;
      setCurrentImages(p.images || []);
      setCategories(catRes.data.data || []);
      setAttributes(attrRes.data.data || []);

      setForm({
        title: p.title || '',
        sku: p.sku || '',
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        category: p.category?._id || p.category || '',
        subcategory: p.subcategory?._id || p.subcategory || '',
        price: p.price || '',
        comparePrice: p.comparePrice || '',
        costPrice: p.costPrice || '',
        discount: p.discount || 0,
        stock: p.stock || 0,
        weight: p.weight || '',
        segments: p.segments || [],
        occasions: p.occasions || [],
        collectionStyles: p.collectionStyles || [],
        themes: p.themes || [],
        productPersonas: p.productPersonas || [],
        wearingTypes: p.wearingTypes || [],
        giftTags: p.giftTags || [],
        meenaColors: p.meenaColors || [],
        attributes: p.attributes?.map((a) => ({
          attribute: a.attribute?._id || a.attribute,
          customValue: a.customValue || '',
        })) || [],
        seoTitle: p.seo?.metaTitle || '',
        seoDescription: p.seo?.metaDescription || '',
        status: p.status || 'draft',
        priceBreakup: {
          metalType: p.priceBreakup?.metalType || '',
          grossWeight: p.priceBreakup?.grossWeight ?? '',
          netWeight: p.priceBreakup?.netWeight ?? '',
          metalRate: p.priceBreakup?.metalRate ?? '',
          metalAmount: p.priceBreakup?.metalAmount ?? '',
          diamondPieces: p.priceBreakup?.diamondPieces ?? '',
          diamondCarat: p.priceBreakup?.diamondCarat ?? '',
          diamondClarity: p.priceBreakup?.diamondClarity || '',
          diamondCut: p.priceBreakup?.diamondCut || '',
          diamondColor: p.priceBreakup?.diamondColor || '',
          diamondAmount: p.priceBreakup?.diamondAmount ?? '',
          diamondOriginalAmount: p.priceBreakup?.diamondOriginalAmount ?? '',
          diamondDiscountPct: p.priceBreakup?.diamondDiscountPct ?? '',
          makingCharges: p.priceBreakup?.makingCharges ?? '',
          makingChargesOriginal: p.priceBreakup?.makingChargesOriginal ?? '',
          makingChargesDiscountPct: p.priceBreakup?.makingChargesDiscountPct ?? '',
          gstPct: p.priceBreakup?.gstPct ?? 3,
        },
        certifications: p.certifications || [],
        packageImages: (p.packageImages || []).join('\n'),
        promoBannerImage: p.promoBannerImage || '',
      });
    }).catch((err) => {
      toast.error('Failed to load product');
      navigate('/vendor/products');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (form.category) {
      categoryAPI.getAll({ parent: form.category, limit: 100 })
        .then(({ data }) => setSubcategories(data.data || []))
        .catch(() => setSubcategories([]));
    }
  }, [form.category]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setPb = (field, value) => setForm((prev) => ({ ...prev, priceBreakup: { ...prev.priceBreakup, [field]: value } }));
  const addCert = () => setForm((prev) => ({ ...prev, certifications: [...prev.certifications, { lab: '', certNumber: '', certImage: '' }] }));
  const setCert = (i, f, v) => setForm((prev) => ({ ...prev, certifications: prev.certifications.map((c, j) => j === i ? { ...c, [f]: v } : c) }));
  const removeCert = (i) => setForm((prev) => ({ ...prev, certifications: prev.certifications.filter((_, j) => j !== i) }));

  const handleAttributeValue = (attrId, value) => {
    setForm((prev) => {
      const existing = prev.attributes.find((a) => a.attribute === attrId);
      if (existing) {
        return {
          ...prev,
          attributes: prev.attributes.map((a) =>
            a.attribute === attrId ? { ...a, customValue: value } : a
          ),
        };
      }
      return {
        ...prev,
        attributes: [...prev.attributes, { attribute: attrId, customValue: value }],
      };
    });
  };

  const handleSave = async (submitStatus) => {
    if (!form.title.trim()) return toast.error('Product title is required');
    if (!form.category) return toast.error('Category is required');
    if (!form.price) return toast.error('Price is required');

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        sku: form.sku.trim() || undefined,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory || undefined,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        discount: parseInt(form.discount) || 0,
        stock: parseInt(form.stock) || 0,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        segments: form.segments,
        occasions: form.occasions,
        collectionStyles: form.collectionStyles,
        themes: form.themes,
        productPersonas: form.productPersonas,
        wearingTypes: form.wearingTypes,
        giftTags: form.giftTags,
        attributes: form.attributes.filter((a) => a.customValue),
        priceBreakup: {
          metalType: form.priceBreakup.metalType || undefined,
          grossWeight: form.priceBreakup.grossWeight !== '' ? parseFloat(form.priceBreakup.grossWeight) : undefined,
          netWeight: form.priceBreakup.netWeight !== '' ? parseFloat(form.priceBreakup.netWeight) : undefined,
          metalRate: form.priceBreakup.metalRate !== '' ? parseFloat(form.priceBreakup.metalRate) : undefined,
          metalAmount: form.priceBreakup.metalAmount !== '' ? parseFloat(form.priceBreakup.metalAmount) : undefined,
          diamondPieces: form.priceBreakup.diamondPieces !== '' ? parseInt(form.priceBreakup.diamondPieces) : undefined,
          diamondCarat: form.priceBreakup.diamondCarat !== '' ? parseFloat(form.priceBreakup.diamondCarat) : undefined,
          diamondClarity: form.priceBreakup.diamondClarity || undefined,
          diamondCut: form.priceBreakup.diamondCut || undefined,
          diamondColor: form.priceBreakup.diamondColor || undefined,
          diamondAmount: form.priceBreakup.diamondAmount !== '' ? parseFloat(form.priceBreakup.diamondAmount) : undefined,
          diamondOriginalAmount: form.priceBreakup.diamondOriginalAmount !== '' ? parseFloat(form.priceBreakup.diamondOriginalAmount) : undefined,
          diamondDiscountPct: form.priceBreakup.diamondDiscountPct !== '' ? parseFloat(form.priceBreakup.diamondDiscountPct) : undefined,
          makingCharges: form.priceBreakup.makingCharges !== '' ? parseFloat(form.priceBreakup.makingCharges) : undefined,
          makingChargesOriginal: form.priceBreakup.makingChargesOriginal !== '' ? parseFloat(form.priceBreakup.makingChargesOriginal) : undefined,
          makingChargesDiscountPct: form.priceBreakup.makingChargesDiscountPct !== '' ? parseFloat(form.priceBreakup.makingChargesDiscountPct) : undefined,
          gstPct: form.priceBreakup.gstPct !== '' ? parseFloat(form.priceBreakup.gstPct) : 3,
        },
        certifications: form.certifications.filter((c) => c.lab || c.certNumber),
        packageImages: form.packageImages ? form.packageImages.split('\n').map((u) => u.trim()).filter(Boolean) : [],
        promoBannerImage: form.promoBannerImage || undefined,
        seo: {
          metaTitle: form.seoTitle || form.title,
          metaDescription: form.seoDescription,
        },
        status: submitStatus || form.status,
      };

      await productAPI.update(id, payload);
      toast.success('Product updated');
      navigate('/vendor/products');
    } catch (error) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      const { data } = await productAPI.uploadImages(id, formData);
      setCurrentImages(data.data?.images || []);
      toast.success('Images updated');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
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
          <h1 className="font-heading text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Status: <span className="font-medium capitalize text-gray-600">{form.status}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/vendor/products')} className="btn-outline text-sm">Cancel</button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-outline text-sm">Save Draft</button>
          <button onClick={() => handleSave('pending')} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save & Resubmit'}
          </button>
        </div>
      </div>

      {form.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800">Product was rejected</p>
          <p className="text-xs text-red-600 mt-1">Please fix the issues and resubmit for review.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card-luxury p-6">
            <SectionTitle>Basic Information</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="label-luxury">Product Title *</label>
                <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">SKU</label>
                <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Short Description</label>
                <textarea value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} rows={2} className="input-luxury resize-none" />
              </div>
              <div>
                <label className="label-luxury">Full Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className="input-luxury resize-none" />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="card-luxury p-6">
            <SectionTitle>Category</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Category *</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-luxury">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-luxury">Subcategory</label>
                <select value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} className="input-luxury" disabled={subcategories.length === 0}>
                  <option value="">Select Subcategory</option>
                  {subcategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card-luxury p-6">
            <SectionTitle>Pricing & Stock</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-luxury">Price (₹) *</label><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Compare Price (₹)</label><input type="number" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Cost Price (₹)</label><input type="number" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Discount (%)</label><input type="number" value={form.discount} onChange={(e) => set('discount', e.target.value)} min="0" max="100" className="input-luxury" /></div>
              <div><label className="label-luxury">Stock</label><input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} min="0" className="input-luxury" /></div>
              <div><label className="label-luxury">Weight (g)</label><input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} min="0" step="0.1" className="input-luxury" /></div>
            </div>
          </div>

          {/* Dynamic Attributes */}
          {attributes.length > 0 && (
            <div className="card-luxury p-6">
              <SectionTitle>Product Attributes</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                {attributes.map((attr) => (
                  <div key={attr._id}>
                    <label className="label-luxury">{attr.name}</label>
                    <input
                      type="text"
                      value={form.attributes.find((a) => a.attribute === attr._id)?.customValue || ''}
                      onChange={(e) => handleAttributeValue(attr._id, e.target.value)}
                      placeholder={`Enter ${attr.name}`}
                      className="input-luxury"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merchandising */}
          <div className="card-luxury p-6 space-y-5">
            <SectionTitle>Merchandising Tags</SectionTitle>
            <MultiSelect label="Segments" options={SEGMENTS} value={form.segments} onChange={(v) => set('segments', v)} />
            <MultiSelect label="Occasions" options={OCCASIONS} value={form.occasions} onChange={(v) => set('occasions', v)} />
            <MultiSelect label="Collection Styles" options={COLLECTION_STYLES} value={form.collectionStyles} onChange={(v) => set('collectionStyles', v)} />
            <MultiSelect label="Themes" options={THEMES} value={form.themes} onChange={(v) => set('themes', v)} />
            <MultiSelect label="Product Persona" options={PERSONAS} value={form.productPersonas} onChange={(v) => set('productPersonas', v)} />
            <MultiSelect label="Wearing Type" options={WEARING_TYPES} value={form.wearingTypes} onChange={(v) => set('wearingTypes', v)} />
            <MultiSelect label="Gift Tags" options={GIFT_TAGS} value={form.giftTags} onChange={(v) => set('giftTags', v)} />
            <MultiSelect label="Meena Color" options={MEENA_COLORS} value={form.meenaColors} onChange={(v) => set('meenaColors', v)} />
          </div>

          {/* Price Breakup */}
          <div className="card-luxury p-6">
            <SectionTitle>Price Breakup (for product page)</SectionTitle>
            <p className="text-xs text-gray-400 mb-4">Fill metal &amp; diamond details to show a detailed price breakdown on the product page. Leave blank if not applicable.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxury">Metal Type</label>
                  <input type="text" value={form.priceBreakup.metalType} onChange={(e) => setPb('metalType', e.target.value)} placeholder="e.g. 14KT Yellow Gold" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Gross Weight (g)</label>
                  <input type="number" value={form.priceBreakup.grossWeight} onChange={(e) => setPb('grossWeight', e.target.value)} placeholder="0.00" step="0.01" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Net Weight (g)</label>
                  <input type="number" value={form.priceBreakup.netWeight} onChange={(e) => setPb('netWeight', e.target.value)} placeholder="0.00" step="0.01" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Metal Rate (₹/g)</label>
                  <input type="number" value={form.priceBreakup.metalRate} onChange={(e) => setPb('metalRate', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Metal Amount (₹)</label>
                  <input type="number" value={form.priceBreakup.metalAmount} onChange={(e) => setPb('metalAmount', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Making Charges (₹)</label>
                  <input type="number" value={form.priceBreakup.makingCharges} onChange={(e) => setPb('makingCharges', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Making Original (₹)</label>
                  <input type="number" value={form.priceBreakup.makingChargesOriginal} onChange={(e) => setPb('makingChargesOriginal', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Making Discount (%)</label>
                  <input type="number" value={form.priceBreakup.makingChargesDiscountPct} onChange={(e) => setPb('makingChargesDiscountPct', e.target.value)} placeholder="0" min="0" max="100" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">GST (%)</label>
                  <input type="number" value={form.priceBreakup.gstPct} onChange={(e) => setPb('gstPct', e.target.value)} placeholder="3" min="0" max="100" className="input-luxury" />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider pt-2 border-t border-gray-100">Diamond Details (optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxury">Diamond Pieces</label>
                  <input type="number" value={form.priceBreakup.diamondPieces} onChange={(e) => setPb('diamondPieces', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Diamond Carat (ct)</label>
                  <input type="number" value={form.priceBreakup.diamondCarat} onChange={(e) => setPb('diamondCarat', e.target.value)} placeholder="0.00" step="0.01" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Clarity</label>
                  <input type="text" value={form.priceBreakup.diamondClarity} onChange={(e) => setPb('diamondClarity', e.target.value)} placeholder="e.g. VVS-VS, EF" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Cut</label>
                  <input type="text" value={form.priceBreakup.diamondCut} onChange={(e) => setPb('diamondCut', e.target.value)} placeholder="e.g. Round" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Color</label>
                  <input type="text" value={form.priceBreakup.diamondColor} onChange={(e) => setPb('diamondColor', e.target.value)} placeholder="e.g. EF" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Diamond Amount (₹)</label>
                  <input type="number" value={form.priceBreakup.diamondAmount} onChange={(e) => setPb('diamondAmount', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Diamond Original (₹)</label>
                  <input type="number" value={form.priceBreakup.diamondOriginalAmount} onChange={(e) => setPb('diamondOriginalAmount', e.target.value)} placeholder="0" min="0" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Diamond Discount (%)</label>
                  <input type="number" value={form.priceBreakup.diamondDiscountPct} onChange={(e) => setPb('diamondDiscountPct', e.target.value)} placeholder="0" min="0" max="100" className="input-luxury" />
                </div>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="card-luxury p-6">
            <SectionTitle>Certifications</SectionTitle>
            <div className="space-y-3">
              {form.certifications.map((cert, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="label-luxury">Lab</label>
                    <input type="text" value={cert.lab} onChange={(e) => setCert(i, 'lab', e.target.value)} placeholder="IGI / GIA / SGL" className="input-luxury" />
                  </div>
                  <div>
                    <label className="label-luxury">Cert Number</label>
                    <input type="text" value={cert.certNumber} onChange={(e) => setCert(i, 'certNumber', e.target.value)} placeholder="Certificate No." className="input-luxury" />
                  </div>
                  <div>
                    <label className="label-luxury">Cert Image URL</label>
                    <div className="flex gap-1">
                      <input type="text" value={cert.certImage} onChange={(e) => setCert(i, 'certImage', e.target.value)} placeholder="https://..." className="input-luxury flex-1 text-xs" />
                      <button type="button" onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600 px-1 flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCert} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">
                + Add Certification (IGI / GIA / SGL)
              </button>
            </div>
          </div>

          {/* Package & Promo Images */}
          <div className="card-luxury p-6">
            <SectionTitle>Package &amp; Promo Images</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="label-luxury">Package Image URLs (one per line)</label>
                <textarea
                  value={form.packageImages}
                  onChange={(e) => set('packageImages', e.target.value)}
                  rows={3}
                  placeholder={"https://res.cloudinary.com/...image1.jpg\nhttps://res.cloudinary.com/...image2.jpg"}
                  className="input-luxury resize-none text-xs"
                />
                <p className="text-2xs text-gray-400 mt-1">Images showing what&apos;s in the box (packaging, certificate card, etc.)</p>
              </div>
              <div>
                <label className="label-luxury">Promo Banner Image URL</label>
                <input
                  type="text"
                  value={form.promoBannerImage}
                  onChange={(e) => set('promoBannerImage', e.target.value)}
                  placeholder="https://res.cloudinary.com/...promo-offer.jpg"
                  className="input-luxury"
                />
                <p className="text-2xs text-gray-400 mt-1">Offer strip shown on the product page (e.g. EMI / discount banner)</p>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="card-luxury p-6">
            <SectionTitle>SEO</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className="label-luxury">Meta Title</label>
                <input type="text" value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className="input-luxury" />
              </div>
              <div>
                <label className="label-luxury">Meta Description</label>
                <textarea value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} className="input-luxury resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Images */}
          <div className="card-luxury p-6">
            <SectionTitle>Product Images</SectionTitle>
            {currentImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {currentImages.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-luxury-cream">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square rounded-xl bg-luxury-cream border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300 mb-3">
                <span className="text-3xl">📷</span>
                <p className="text-xs">No images yet</p>
              </div>
            )}
            <label className="block">
              <span className="btn-outline text-xs w-full text-center cursor-pointer block py-2">
                {uploading ? 'Uploading...' : '+ Upload / Replace Images'}
              </span>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {/* Actions */}
          <div className="card-luxury p-4 flex flex-col gap-2">
            <button onClick={() => handleSave('pending')} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save & Resubmit for Review'}
            </button>
            <button onClick={() => handleSave('draft')} disabled={saving} className="btn-outline w-full">
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
