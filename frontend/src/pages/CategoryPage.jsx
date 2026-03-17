import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, categoryAPI, attributeAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const PRICE_RANGES = [
  { label: 'Below ₹15K', min: 0, max: 15000 },
  { label: '₹15K – ₹30K', min: 15000, max: 30000 },
  { label: '₹30K – ₹50K', min: 30000, max: 50000 },
  { label: '₹50K – ₹75K', min: 50000, max: 75000 },
  { label: '₹75K – ₹1L', min: 75000, max: 100000 },
  { label: '₹1L – ₹2L', min: 100000, max: 200000 },
  { label: '₹2L – ₹5L', min: 200000, max: 500000 },
  { label: '₹5L+', min: 500000, max: null },
];

// ---- Filter Sidebar ----
const FilterSidebar = ({ attributes, filters, onChange, onReset, isMobile, onClose }) => {
  const handlePriceRange = (range) => {
    onChange({ ...filters, minPrice: range.min, maxPrice: range.max });
  };

  const handleAttributeFilter = (attrSlug, value) => {
    const key = `attr_${attrSlug}`;
    const current = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: updated.length ? updated : undefined });
  };

  const filterableAttributes = attributes.filter((a) => a.isFilterable && a.values?.length > 0);
  const activeFilterCount = Object.keys(filters).filter((k) => k !== 'sort' && k !== 'page' && filters[k]).length;

  return (
    <div className={isMobile ? 'h-full overflow-y-auto' : ''}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <h3 className="font-heading font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button onClick={onReset} className="text-xs text-primary hover:underline font-medium">
              Clear All ({activeFilterCount})
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Price Filter */}
      <FilterSection title="Price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.minPrice === range.min && (range.max ? filters.maxPrice === range.max : !filters.maxPrice);
            return (
              <button
                key={range.label}
                onClick={() => isActive ? onChange({ ...filters, minPrice: undefined, maxPrice: undefined }) : handlePriceRange(range)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Dynamic Attribute Filters */}
      {filterableAttributes.map((attr) => {
        const key = `attr_${attr.slug}`;
        const selectedValues = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];

        return (
          <FilterSection key={attr._id} title={attr.name}>
            {attr.displayType === 'swatch' ? (
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val) => (
                  <button
                    key={val._id}
                    onClick={() => handleAttributeFilter(attr.slug, val._id)}
                    title={val.value}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                      selectedValues.includes(val._id) ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: val.colorCode || '#ccc' }}
                  />
                ))}
              </div>
            ) : attr.displayType === 'button' ? (
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val) => (
                  <button
                    key={val._id}
                    onClick={() => handleAttributeFilter(attr.slug, val._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
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
              <div className="space-y-1.5">
                {attr.values.map((val) => (
                  <label key={val._id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(val._id)}
                      onChange={() => handleAttributeFilter(attr.slug, val._id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 accent-primary"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{val.value}</span>
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

const FilterSection = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  );
};

// ---- Skeleton ----
const ProductSkeleton = () => (
  <div className="rounded-luxury overflow-hidden">
    <div className="shimmer-loading aspect-jewelry rounded-t-luxury" />
    <div className="p-4 space-y-2">
      <div className="shimmer-loading h-3 w-16 rounded" />
      <div className="shimmer-loading h-4 w-full rounded" />
      <div className="shimmer-loading h-4 w-3/4 rounded" />
      <div className="shimmer-loading h-5 w-24 rounded" />
    </div>
  </div>
);

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
  });

  // Fetch category
  useEffect(() => {
    categoryAPI.getBySlug(slug).then(({ data }) => setCategory(data.data)).catch(() => {});
  }, [slug]);

  // Fetch attributes
  useEffect(() => {
    attributeAPI.getAll({ filterable: true }).then(({ data }) => setAttributes(data.data || [])).catch(() => {});
  }, []);

  // Fetch products
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

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters]);

  const handleFilterChange = (newFilters) => setFilters({ ...newFilters, page: 1 });
  const handleResetFilters = () => setFilters({ sort: 'newest', page: 1 });

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Collections'} | Luxury Jewelry</title>
        <meta name="description" content={category?.seo?.metaDescription || `Shop ${category?.name || 'jewelry'} collection`} />
      </Helmet>

      <div className="bg-luxury-gradient py-10">
        <div className="container-luxury">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            {category?.ancestors?.map((a) => (
              <span key={a._id} className="flex items-center gap-2">
                <Link to={`/collections/${a.slug}`} className="hover:text-primary">{a.name}</Link>
                <span>/</span>
              </span>
            ))}
            <span className="text-primary font-medium">{category?.name || slug}</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">
            {category?.name || 'Collections'}
          </h1>
          {category?.description && (
            <p className="text-gray-500 mt-2 max-w-2xl">{category.description}</p>
          )}
        </div>
      </div>

      <div className="container-luxury py-8">
        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              attributes={attributes}
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters
                </button>
                <span className="text-sm text-gray-500">{meta.total?.toLocaleString()} products</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 hidden sm:block">Sort by:</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13L22 9z" /></svg>
                <h3 className="font-heading text-xl text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters</p>
                <button onClick={handleResetFilters} className="btn-outline text-sm">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === page ? 'bg-primary text-white' : 'border border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= meta.pages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition-colors disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileFilterOpen(false)} className="fixed inset-0 bg-black/40 z-50 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-hidden flex flex-col shadow-luxury-lg lg:hidden">
              <div className="p-4 border-b">
                <FilterSidebar
                  attributes={attributes}
                  filters={filters}
                  onChange={(f) => { handleFilterChange(f); setMobileFilterOpen(false); }}
                  onReset={() => { handleResetFilters(); setMobileFilterOpen(false); }}
                  isMobile
                  onClose={() => setMobileFilterOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
