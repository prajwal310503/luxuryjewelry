import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, categoryAPI, attributeAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import Select from '../components/ui/Select';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'popular',    label: 'Most Popular' },
];

const PRICE_RANGES = [
  { label: 'Below ₹15K',    min: 0,      max: 15000 },
  { label: '₹15K – ₹30K',  min: 15000,  max: 30000 },
  { label: '₹30K – ₹50K',  min: 30000,  max: 50000 },
  { label: '₹50K – ₹75K',  min: 50000,  max: 75000 },
  { label: '₹75K – ₹1L',   min: 75000,  max: 100000 },
  { label: '₹1L – ₹2L',    min: 100000, max: 200000 },
  { label: '₹2L – ₹5L',    min: 200000, max: 500000 },
  { label: '₹5L+',          min: 500000, max: null },
];

/* ─── Collapsible filter section ─── */
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3.5 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-800">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Filter sidebar ─── */
const FilterSidebar = ({ attributes, filters, onChange, onReset, isMobile, onClose }) => {
  const handlePriceRange = (range) => {
    const isActive = filters.minPrice === range.min && (range.max ? filters.maxPrice === range.max : !filters.maxPrice);
    onChange({ ...filters, minPrice: isActive ? undefined : range.min, maxPrice: isActive ? undefined : range.max });
  };

  const handleAttributeFilter = (attrSlug, valueId) => {
    const key = `attr_${attrSlug}`;
    const current = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];
    const updated = current.includes(valueId) ? current.filter((v) => v !== valueId) : [...current, valueId];
    onChange({ ...filters, [key]: updated.length ? updated : undefined });
  };

  const filterableAttributes = attributes.filter((a) => a.isFilterable && a.values?.length > 0);
  const activeFilterCount = Object.keys(filters).filter((k) => k !== 'sort' && k !== 'page' && filters[k] !== undefined).length;

  return (
    <div className={isMobile ? 'h-full overflow-y-auto px-5 py-4' : ''}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="text-xs bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button onClick={onReset} className="text-sm text-primary hover:underline font-medium">
              Clear All
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Price */}
      <FilterSection title="Price">
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.minPrice === range.min && (range.max ? filters.maxPrice === range.max : !filters.maxPrice);
            return (
              <label key={range.label} className="flex items-center gap-2.5 cursor-pointer py-1 group">
                <input
                  type="radio"
                  name="priceRange"
                  checked={isActive}
                  onChange={() => handlePriceRange(range)}
                  className="w-4 h-4 accent-primary"
                />
                <span className={`text-sm transition-colors ${isActive ? 'text-primary font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Dynamic attributes */}
      {filterableAttributes.map((attr, idx) => {
        const key = `attr_${attr.slug}`;
        const selectedValues = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];

        return (
          <FilterSection key={attr._id} title={attr.name} defaultOpen={idx < 3}>
            {attr.displayType === 'swatch' ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {attr.values.map((val) => (
                  <button
                    key={val._id}
                    onClick={() => handleAttributeFilter(attr.slug, val._id)}
                    title={val.value}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
                      selectedValues.includes(val._id) ? 'border-primary scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: val.colorCode || '#ccc' }}
                  />
                ))}
              </div>
            ) : attr.displayType === 'button' ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {attr.values.map((val) => (
                  <button
                    key={val._id}
                    onClick={() => handleAttributeFilter(attr.slug, val._id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                      selectedValues.includes(val._id)
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {val.value}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5 pt-1">
                {attr.values.map((val) => (
                  <label key={val._id} className="flex items-center gap-2.5 cursor-pointer py-1 group">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(val._id)}
                      onChange={() => handleAttributeFilter(attr.slug, val._id)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className={`text-sm transition-colors ${selectedValues.includes(val._id) ? 'text-primary font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                      {val.value}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </FilterSection>
        );
      })}
    </div>
  );
};

/* ─── Product skeleton ─── */
const ProductSkeleton = () => (
  <div
    className="overflow-hidden"
    style={{
      background: 'rgba(255,255,255,0.72)',
      border: '1px solid rgba(255,255,255,0.65)',
      borderRadius: 20,
      boxShadow: '0 4px 24px rgba(90,65,63,0.07)',
    }}
  >
    {/* Image */}
    <div className="shimmer-img w-full" style={{ aspectRatio: '1/1' }} />
    {/* Info */}
    <div className="p-4 space-y-3">
      <div className="shimmer-text h-2.5 w-20 rounded" />
      <div className="shimmer-text h-3.5 w-full rounded" />
      <div className="shimmer-text h-3.5 w-2/3 rounded" />
      {/* Stars */}
      <div className="flex gap-1">
        {[0,1,2,3,4].map((s) => <div key={s} className="shimmer-loading w-3 h-3 rounded" />)}
      </div>
      {/* Swatches */}
      <div className="flex items-center gap-2 pt-1">
        <div className="shimmer-circle w-3 h-3" />
        <div className="shimmer-circle w-3 h-3" />
        <div className="shimmer-circle w-3 h-3" />
      </div>
      {/* Price */}
      <div className="pt-2 border-t border-gray-100">
        <div className="shimmer-text h-4 w-24 rounded" />
      </div>
    </div>
  </div>
);

/* ─── Pagination ─── */
const Pagination = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  const pages = [];
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(total - 1, page + delta); i++) {
    range.push(i);
  }
  if (page - delta > 2) range.unshift('...');
  if (page + delta < total - 1) range.push('...');
  range.unshift(1);
  if (total > 1) range.push(total);

  const btnBase = 'min-w-[40px] h-10 px-3 rounded-lg text-[15px] font-medium transition-all duration-150 border';
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Prev
      </button>

      {range.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="text-gray-400 px-1 text-[15px]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btnBase} ${
              page === p
                ? 'bg-primary text-white border-primary shadow-luxury'
                : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary bg-white'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= total}
        className={`${btnBase} border-gray-200 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1`}
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

/* ─── Main Page ─── */
export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : undefined,
    page: parseInt(searchParams.get('page')) || 1,
    collectionStyles: searchParams.get('collectionStyles') || undefined,
    themes: searchParams.get('themes') || undefined,
    segments: searchParams.get('segments') || undefined,
    occasions: searchParams.get('occasions') || undefined,
  });

  useEffect(() => {
    categoryAPI.getBySlug(slug).then(({ data }) => setCategory(data.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    attributeAPI.getAll({ filterable: true }).then(({ data }) => setAttributes(data.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { category: slug, ...filters };
      const { data } = await productAPI.getAll(params);
      setProducts(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [slug, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters]);

  const handleFilterChange = (newFilters) => setFilters({ ...newFilters, page: 1 });
  const handleResetFilters = () => setFilters({ sort: 'newest', page: 1, collectionStyles: undefined, themes: undefined, segments: undefined, occasions: undefined });
  const handlePageChange = (page) => {
    setFilters((f) => ({ ...f, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount = Object.keys(filters).filter(
    (k) => k !== 'sort' && k !== 'page' && filters[k] !== undefined
  ).length;

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Collections'} | VK Jewellers</title>
        <meta name="description" content={category?.seo?.metaDescription || `Shop ${category?.name || 'jewelry'} collection`} />
      </Helmet>

      {/* ── Rich header with glassmorphism ── */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #3a2927 0%, #5a413f 40%, #7a5a57 70%, #4e3735 100%)',
      }}>
        {/* Decorative orbs */}
        <div className="absolute top-[-30%] right-[-5%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 65%)' }} />
        <div className="absolute bottom-[-40%] left-[10%] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(183,110,121,0.2) 0%, transparent 65%)' }} />
        <div className="absolute top-[10%] left-[-5%] w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 65%)' }} />

        <div className="container-luxury py-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] mb-4">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">Home</Link>
            <span className="text-white/30">/</span>
            <Link to="/collections" className="text-white/60 hover:text-white transition-colors">Collections</Link>
            {category?.ancestors?.map((a) => (
              <span key={a._id} className="flex items-center gap-2">
                <span className="text-white/30">/</span>
                <Link to={`/collections/${a.slug}`} className="text-white/60 hover:text-white transition-colors">{a.name}</Link>
              </span>
            ))}
            <span className="text-white/30">/</span>
            <span className="text-white/90 font-medium">{category?.name || slug}</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              {/* Gold eyebrow */}
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2 block"
                style={{ color: '#C9A84C' }}>
                Our Collection
              </span>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-wide">
                {category?.name || 'Collections'}
              </h1>
              {category?.description && (
                <p className="text-white/60 mt-2 text-[15px] max-w-xl">{category.description}</p>
              )}
            </div>
            {!loading && meta.total > 0 && (
              <div className="flex-shrink-0 text-right">
                <p className="text-3xl font-bold text-white">{meta.total}</p>
                <p className="text-white/50 text-sm">products</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-luxury py-7">
        <div className="flex gap-6">

          {/* ── Glass Sidebar ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 8px 32px rgba(90,65,63,0.10), inset 0 1px 0 rgba(255,255,255,0.90)',
            }}>
              <div className="px-5 py-5">
                <FilterSidebar
                  attributes={attributes}
                  filters={filters}
                  onChange={handleFilterChange}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
          </aside>

          {/* ── Products Area ── */}
          <div className="flex-1 min-w-0">

            {/* Glass Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap px-4 py-3 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 4px 20px rgba(90,65,63,0.07)',
            }}>
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-[15px] text-white font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg,#5a413f,#3a2927)', boxShadow: '0 4px 12px rgba(90,65,63,0.3)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="text-xs font-bold bg-white text-primary px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                  )}
                </button>

                {!loading && (
                  <p className="text-[15px] text-gray-500">
                    Showing <span className="font-bold text-gray-800">{products.length}</span>
                    {meta.total > products.length && <> of <span className="font-bold text-gray-800">{meta.total}</span></>} results
                  </p>
                )}

                {/* Active filter pills */}
                {filters.minPrice !== undefined && (
                  <button
                    onClick={() => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined })}
                    className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-semibold transition-all"
                    style={{ background: 'rgba(90,65,63,0.1)', color: '#5a413f' }}
                  >
                    Price filter
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[14px] text-gray-500 hidden sm:block font-medium">Sort:</span>
                <Select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
                  compact
                  className="w-48"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6">
                {Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 mt-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.15),rgba(183,110,121,0.1))' }}>
                  <svg className="w-12 h-12 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13L22 9z" />
                  </svg>
                </div>
                <h3 className="font-heading text-2xl font-bold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-400 text-[15px] mb-8">Try adjusting your filters to discover more beautiful pieces</p>
                <button onClick={handleResetFilters} className="btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6">
                  {products.map((product, idx) => (
                    <ProductCard key={product._id} product={product} index={idx} />
                  ))}
                </div>
                <Pagination
                  page={filters.page}
                  total={meta.pages}
                  onChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 overflow-hidden flex flex-col lg:hidden"
              style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '4px 0 40px rgba(90,65,63,0.18)',
              }}
            >
              <FilterSidebar
                attributes={attributes}
                filters={filters}
                onChange={(f) => { handleFilterChange(f); setMobileFilterOpen(false); }}
                onReset={() => { handleResetFilters(); setMobileFilterOpen(false); }}
                isMobile
                onClose={() => setMobileFilterOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
