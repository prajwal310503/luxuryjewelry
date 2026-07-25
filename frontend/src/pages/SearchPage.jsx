import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productAPI, attributeAPI } from '../services/api';
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
  { label: 'Below ₹15K',   min: 0,      max: 15000 },
  { label: '₹15K – ₹30K', min: 15000,  max: 30000 },
  { label: '₹30K – ₹50K', min: 30000,  max: 50000 },
  { label: '₹50K – ₹1L',  min: 50000,  max: 100000 },
  { label: '₹1L+',         min: 100000, max: null },
];

const PAGE_SIZE = 20;

const GLASS_ASIDE = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 8px 32px rgba(90,65,63,0.10), inset 0 1px 0 rgba(255,255,255,0.90)',
};

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#5a413f]/[0.08] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left group"
      >
        <span className="text-[13px] font-semibold tracking-wide uppercase text-[#5a413f]/90 group-hover:text-primary transition-colors">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function SearchFilterPanel({
  showHeader = true,
  filters,
  activeFilterCount,
  filterableAttrs,
  onClear,
  onPriceSelect,
  onToggleAttr,
}) {
  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-1 pb-3.5 border-b border-[#5a413f]/[0.12]">
          <h3 className="font-heading text-lg font-bold text-gray-900 tracking-tight">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-primary text-white align-middle">
                {activeFilterCount}
              </span>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-primary hover:underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <FilterSection title="Price">
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const active =
              filters.minPrice === range.min &&
              (range.max != null ? filters.maxPrice === range.max : filters.maxPrice == null);
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => onPriceSelect(range, active)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-[#5a413f]/[0.04]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    active ? 'border-primary' : 'border-gray-300'
                  }`}
                >
                  {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                </span>
                <span className={`text-sm ${active ? 'text-primary font-semibold' : 'text-gray-600'}`}>
                  {range.label}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {filterableAttrs.slice(0, 6).map((attr) => {
        const key = `attr_${attr.slug}`;
        const selected = (filters[key] || []).map(String);
        const isColor = attr.displayType === 'color' || attr.slug?.includes('color') || attr.slug?.includes('colour');
        return (
          <FilterSection key={attr._id} title={attr.name}>
            {isColor ? (
              <div className="flex flex-wrap gap-2.5 pt-0.5">
                {attr.values.map((val) => {
                  const on = selected.includes(String(val._id));
                  return (
                    <button
                      key={val._id}
                      type="button"
                      title={val.value}
                      onClick={() => onToggleAttr(attr.slug, val._id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        on ? 'border-primary scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: val.colorCode || '#ccc' }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {attr.values.map((val) => {
                  const on = selected.includes(String(val._id));
                  return (
                    <button
                      key={val._id}
                      type="button"
                      onClick={() => onToggleAttr(attr.slug, val._id)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                        on
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white/80 border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {val.value}
                    </button>
                  );
                })}
              </div>
            )}
          </FilterSection>
        );
      })}
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  const range = [];
  const delta = 2;
  for (let i = Math.max(2, page - delta); i <= Math.min(total - 1, page + delta); i++) range.push(i);
  if (page - delta > 2) range.unshift('...');
  if (page + delta < total - 1) range.push('...');
  range.unshift(1);
  if (total > 1) range.push(total);

  const btn = 'min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium border transition-all';
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}
        className={`${btn} border-gray-200 text-gray-600 hover:border-primary disabled:opacity-30`}>Prev</button>
      {range.map((p, i) =>
        p === '...' ? <span key={`e-${i}`} className="px-1 text-gray-400">…</span> : (
          <button key={p} type="button" onClick={() => onChange(p)}
            className={`${btn} ${page === p ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary bg-white'}`}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= total}
        className={`${btn} border-gray-200 text-gray-600 hover:border-primary disabled:opacity-30`}>Next</button>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [mobileFilters, setMobileFilters] = useState(false);

  const [filters, setFilters] = useState(() => ({
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page'), 10) || 1,
    minPrice: searchParams.has('minPrice') ? parseInt(searchParams.get('minPrice'), 10) : undefined,
    maxPrice: searchParams.has('maxPrice') ? parseInt(searchParams.get('maxPrice'), 10) : undefined,
  }));

  // Reset filters when the search query changes
  useEffect(() => {
    setFilters({ sort: 'newest', page: 1 });
  }, [query]);

  useEffect(() => {
    attributeAPI.getAll({ filterable: true }).then(({ data }) => setAttributes(data.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      setMeta({ total: 0, pages: 1 });
      return;
    }
    setLoading(true);
    try {
      const params = { search: query, limit: PAGE_SIZE };
      Object.entries(filters).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        params[k] = Array.isArray(v) ? v.join(',') : v;
      });
      const { data } = await productAPI.getAll(params);
      const list = data.data || [];
      setProducts(list);
      setMeta(data.meta || { total: list.length, pages: 1 });
    } catch {
      setProducts([]);
      setMeta({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (!query) return;
    const params = { q: query };
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (k === 'page' && Number(v) === 1) return;
      if (k === 'sort' && v === 'newest') return;
      params[k] = Array.isArray(v) ? v.join(',') : String(v);
    });
    setSearchParams(params, { replace: true });
  }, [filters, query, setSearchParams]);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const toggleAttr = (slug, valueId) => {
    const key = `attr_${slug}`;
    const current = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];
    const id = String(valueId);
    const next = current.map(String).includes(id) ? current.filter((v) => String(v) !== id) : [...current, id];
    updateFilters({ [key]: next.length ? next : undefined });
  };

  const activeFilterCount = [
    filters.minPrice != null || filters.maxPrice != null,
    ...Object.keys(filters).filter((k) => k.startsWith('attr_') && filters[k]?.length),
  ].filter(Boolean).length;

  const filterableAttrs = attributes.filter((a) => a.isFilterable && a.values?.length > 0);

  const clearFilters = () => setFilters({ sort: filters.sort || 'newest', page: 1 });

  const handlePriceSelect = (range, active) => {
    updateFilters({
      minPrice: active ? undefined : range.min,
      maxPrice: active ? undefined : (range.max ?? undefined),
    });
  };

  const filterPanelProps = {
    filters,
    activeFilterCount,
    filterableAttrs,
    onClear: clearFilters,
    onPriceSelect: handlePriceSelect,
    onToggleAttr: toggleAttr,
  };

  return (
    <>
      <Helmet><title>{query ? `Search: ${query}` : 'Search'} | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-8">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Search</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-gray-900">
              {query ? <>Results for “{query}”</> : 'Search products'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{meta.total} product{meta.total !== 1 ? 's' : ''} found</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileFilters(true)}
              className="lg:hidden btn-outline text-sm px-3 py-2">
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <div className="w-48">
              <Select value={filters.sort || 'newest'} onChange={(e) => updateFilters({ sort: e.target.value })}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>
        </div>

        {!query.trim() ? (
          <div className="text-center py-20 text-gray-400">Type a search in the header to find products</div>
        ) : (
          <div className="flex gap-6 lg:gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 rounded-2xl overflow-hidden" style={GLASS_ASIDE}>
                <div className="px-5 py-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
                  <SearchFilterPanel {...filterPanelProps} />
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square shimmer-loading rounded-xl" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No products found for “{query}”</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-5">
                    {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                  </div>
                  <Pagination
                    page={filters.page || 1}
                    total={meta.pages || 1}
                    onChange={(page) => {
                      setFilters((f) => ({ ...f, page }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {mobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white p-5 overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-2 pb-3 border-b border-gray-100">
                <h2 className="font-heading font-bold text-lg text-gray-900">
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-primary text-white align-middle">
                      {activeFilterCount}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary">
                      Clear all
                    </button>
                  )}
                  <button type="button" onClick={() => setMobileFilters(false)} className="p-2 text-gray-500">✕</button>
                </div>
              </div>
              <SearchFilterPanel {...filterPanelProps} showHeader={false} />
              <button type="button" onClick={() => setMobileFilters(false)} className="btn-primary w-full mt-4 justify-center">Show results</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
