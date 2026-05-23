import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { productAPI, reviewAPI, pincodeAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';

const fmt = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const Stars = ({ rating, size = 'sm' }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};


const METAL_COLOR_MAP = {
  Gold:     { bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-400' },
  Silver:   { bg: 'bg-slate-50',  border: 'border-slate-300', text: 'text-slate-600', dot: 'bg-slate-400' },
  Platinum: { bg: 'bg-gray-50',   border: 'border-gray-400',  text: 'text-gray-700',  dot: 'bg-gray-500'  },
};

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct]             = useState(null);
  const [reviews, setReviews]             = useState([]);
  const [related, setRelated]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [imgIdx, setImgIdx]               = useState(0);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [qty, setQty]                     = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [pincode, setPincode]             = useState('');
  const [pinMsg, setPinMsg]               = useState('');
  const [pinAvailable, setPinAvailable]   = useState(null);
  const [pinChecking, setPinChecking]     = useState(false);
  const [paused, setPaused]               = useState(false);
  const titleRef    = useRef(null);
  const thumbsRef   = useRef(null);
  const mediaLenRef = useRef(0);

  const { addItem }                  = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.getBySlug(slug);
        setProduct(data.data);
        setImgIdx(0);
        const [revRes, relRes] = await Promise.allSettled([
          reviewAPI.getProductReviews(data.data._id, { limit: 10 }),
          productAPI.getAll({ category: data.data.category?.slug, limit: 6 }),
        ]);
        if (revRes.status === 'fulfilled') setReviews(revRes.value.data.data || []);
        if (relRes.status === 'fulfilled')
          setRelated((relRes.value.data.data || []).filter((p) => p._id !== data.data._id).slice(0, 5));
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      if (!titleRef.current) return;
      setStickyVisible(titleRef.current.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll thumbnail strip horizontally to keep active thumb visible — never affects page scroll
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const btns = container.querySelectorAll('button');
    const btn = btns[imgIdx];
    if (!btn) return;
    const { offsetLeft, offsetWidth } = btn;
    const { scrollLeft, clientWidth } = container;
    if (offsetLeft < scrollLeft) {
      container.scrollTo({ left: offsetLeft - 8, behavior: 'smooth' });
    } else if (offsetLeft + offsetWidth > scrollLeft + clientWidth) {
      container.scrollTo({ left: offsetLeft + offsetWidth - clientWidth + 8, behavior: 'smooth' });
    }
  }, [imgIdx]);

  // Auto-advance slides every 3.5 s; pause on hover only
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setImgIdx((prev) => {
        const total = mediaLenRef.current;
        if (total <= 1) return prev;
        const next = (prev + 1) % total;
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [paused]);

  if (loading) {
    return (
      <div className="container-luxury py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="shimmer-loading aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {[0,1,2,3].map((i) => <div key={i} className="w-20 h-20 rounded-xl shimmer-loading" />)}
            </div>
          </div>
          <div className="space-y-4 pt-4">
            <div className="shimmer-loading h-8 rounded-xl w-3/4" />
            <div className="shimmer-loading h-5 rounded-xl w-1/3" />
            <div className="shimmer-loading h-10 rounded-xl w-1/2" />
            <div className="shimmer-loading h-24 rounded-xl w-full" />
            <div className="shimmer-loading h-14 rounded-xl w-full" />
            <div className="shimmer-loading h-14 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container-luxury py-24 text-center text-gray-400">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xl font-heading font-semibold mb-1">Product not found</p>
      <p className="text-sm mb-6">This product may have been removed or the link is incorrect.</p>
      <Link to="/" className="btn-primary inline-block">Back to Home</Link>
    </div>
  );

  const mediaItems = [
    ...(product.images || []).map((img) => ({ type: 'image', url: img.url })),
    ...(product.videos || []).map((vid) => ({ type: 'video', url: vid.url })),
  ];
  mediaLenRef.current = mediaItems.length;
  const currentMedia = mediaItems[imgIdx] || null;


  const goTo = (idx) => { setImgIdx(idx); setPaused(false); };

  const salePrice   = product.discountedPrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const inWishlist  = isInWishlist(product._id);
  const mc          = METAL_COLOR_MAP[product.metalColor];

  const handleAddToCart = () => {
    addItem(product, qty, Object.keys(selectedAttrs).length ? selectedAttrs : null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePincode = async () => {
    if (pincode.length !== 6) { setPinAvailable(null); return setPinMsg('Enter a valid 6-digit pincode'); }
    setPinChecking(true);
    setPinMsg('');
    try {
      const { data } = await pincodeAPI.check(pincode);
      setPinAvailable(data.available);
      setPinMsg(
        data.available
          ? `Delivery available to ${pincode} — delivered within 2 weeks`
          : `Sorry, we do not deliver to this area`
      );
    } catch {
      setPinAvailable(null);
      setPinMsg('Could not check. Please try again.');
    } finally {
      setPinChecking(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{product.title} | VK Jewellers</title>
        <meta name="description" content={product.shortDescription || product.seo?.metaDescription || product.title} />
      </Helmet>

      {/* Sticky bar */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-md"
          >
            <div className="container-luxury py-2.5 flex items-center gap-4">
              {product.images?.[0] && (
                <img src={product.images[0].url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100 shadow-sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{product.title}</p>
                <p className="text-[#C9A84C] font-bold text-sm">{fmt(salePrice)}</p>
              </div>
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="btn-primary text-xs px-5 py-2.5 flex-shrink-0 disabled:opacity-40 shadow-md shadow-primary/20">
                Add to Cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-luxury py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          {product.category && (
            <>
              <Link to={`/collections/${product.category.slug}`} className="hover:text-primary transition-colors capitalize font-medium">
                {product.category.name}
              </Link>
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </>
          )}
          <span className="text-gray-700 font-semibold truncate max-w-[260px]">{product.title}</span>
        </nav>

        {/* ── Main Grid ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 xl:gap-16">

          {/* LEFT — Media gallery (images + videos) */}
          <div className="lg:sticky lg:top-24 self-start">

            {/* Main viewer */}
            <div
              className="relative aspect-square rounded-xl overflow-hidden bg-[#f8f5f2] group"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Cross-fade media layer */}
              <AnimatePresence>
                <motion.div
                  key={imgIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {currentMedia?.type === 'video' ? (
                    <video src={currentMedia.url} controls autoPlay muted loop
                      className="w-full h-full object-contain bg-black" />
                  ) : currentMedia?.type === 'image' ? (
                    <img src={currentMedia.url} alt={product.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-luxury-cream">
                      <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Discount badge only on image — other badges shown in right column */}
              {currentMedia?.type !== 'video' && hasDiscount && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide">
                    -{product.discount}% OFF
                  </span>
                </div>
              )}

              {/* Hover arrow nav */}
              {mediaItems.length > 1 && (
                <>
                  <button onClick={() => goTo((imgIdx - 1 + mediaItems.length) % mediaItems.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/60">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => goTo((imgIdx + 1) % mediaItems.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/60">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {/* Dot indicator */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {mediaItems.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 ${imgIdx === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip with scroll arrows */}
            {mediaItems.length > 1 && (
              <div className="relative mt-3">
                {/* Scroll left */}
                <button
                  onClick={() => thumbsRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>

                {/* Scrollable thumbs */}
                <div
                  ref={thumbsRef}
                  className="flex gap-2 overflow-x-auto scroll-smooth px-8 pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {mediaItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`flex-shrink-0 w-[64px] h-[64px] rounded-md overflow-hidden border transition-colors duration-150 ${
                        imgIdx === i
                          ? 'border-primary border-2'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full bg-gray-900 relative flex items-center justify-center">
                          <video src={item.url} className="w-full h-full object-cover opacity-60" muted preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow">
                              <svg className="w-3.5 h-3.5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Scroll right */}
                <button
                  onClick={() => thumbsRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

          </div>

          {/* RIGHT — Product Info */}
          <div className="space-y-6">

            {/* Category + badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Link to={`/collections/${product.category.slug}`}
                  className="text-[11px] font-bold text-[#C9A84C] uppercase tracking-widest border border-[#C9A84C]/40 bg-[#C9A84C]/8 px-3 py-1 rounded-full hover:bg-[#C9A84C]/15 transition-colors">
                  {product.category.name}
                </Link>
              )}
              {product.isNewArrival && <span className="text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">NEW ARRIVAL</span>}
              {product.isBestSeller && <span className="text-[11px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">BESTSELLER</span>}
            </div>

            {/* Title */}
            <div>
              <h1 ref={titleRef} className="font-heading text-2xl md:text-[1.85rem] font-bold text-gray-900 leading-snug tracking-tight">
                {product.title}
              </h1>
              {/* Gold accent line */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-[2px] w-10 bg-[#C9A84C] rounded-full" />
                <div className="h-[2px] w-3 bg-[#C9A84C]/40 rounded-full" />
              </div>
            </div>

            {/* Rating + SKU */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.rating > 0 ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
                  <Stars rating={product.rating} />
                  <span className="text-xs font-bold text-amber-700">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-amber-600/70">({product.totalReviews} reviews)</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Be the first to review</span>
              )}
              {product.sku && (
                <div className="ml-auto flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <svg className="w-3 h-3 text-[#C9A84C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SKU</span>
                  <span className="text-[11px] font-bold font-mono text-gray-700">{product.sku}</span>
                </div>
              )}
            </div>

            {/* Price block */}
            <div className="bg-gradient-to-br from-[#fdf8f3] to-[#f9f2ea] border border-[#e8d5bc] rounded-2xl px-5 py-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[2.2rem] md:text-[2.5rem] font-bold font-heading text-gray-900 leading-none">
                  <span className="text-xl text-gray-500 font-medium mr-0.5">₹</span>
                  {Math.round(salePrice).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through font-medium">{fmt(product.price)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <p className="text-xs text-gray-500">Inclusive of all taxes · Free shipping</p>
                {hasDiscount && (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                    You save {fmt(product.price - salePrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border-l-4 border-primary/40">
                {product.shortDescription}
              </p>
            )}

            {/* Detail pills */}
            {(product.metalColor || product.color || product.length || product.weight) && (
              <div className="flex flex-wrap gap-2">
                {product.metalColor && mc && (
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border shadow-sm ${mc.bg} ${mc.border} ${mc.text}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${mc.dot}`} />
                    {product.metalColor}
                  </span>
                )}
                {product.color && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400" />
                    {product.color}
                  </span>
                )}
                {product.length && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    {product.length}
                  </span>
                )}
                {product.weight && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    {product.weight} g
                  </span>
                )}
              </div>
            )}

            {/* Variant attributes */}
            {product.attributes?.filter((a) => a.attribute?.isVariant).length > 0 && (
              <div className="space-y-4 bg-[#fdf8f5] rounded-2xl p-4 border border-[#eedfd8]">
                {product.attributes.filter((a) => a.attribute?.isVariant).map(({ attribute: attr, values }) => (
                  <div key={attr._id}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{attr.name}</span>
                      {selectedAttrs[attr._id] && (
                        <span className="text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                          {values.find((v) => v._id === selectedAttrs[attr._id])?.value}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => (
                        <button key={val._id}
                          onClick={() => setSelectedAttrs({ ...selectedAttrs, [attr._id]: val._id })}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                            selectedAttrs[attr._id] === val._id
                              ? 'bg-primary text-white border-primary shadow-md scale-[1.03]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary'
                          }`}
                        >
                          {val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Low stock warning */}
            {product.stock > 0 && product.stock <= 10 && (
              <div className="flex items-center gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl font-semibold">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Only <strong>{product.stock}</strong> left — order soon!</span>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex gap-3 items-stretch">
              {/* Qty stepper */}
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex-shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-lg select-none">
                  −
                </button>
                <span className="w-11 text-center text-base font-bold text-gray-900 border-x-2 border-gray-200 h-12 flex items-center justify-center">
                  {qty}
                </span>
                <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-lg select-none">
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-bold text-sm tracking-widest uppercase h-12 rounded-xl transition-all duration-150 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Wishlist + Share */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleItem(product)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                  inWishlist
                    ? 'border-red-300 bg-red-50 text-red-500 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/50 hover:text-red-500'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-all duration-150"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>

            {/* Delivery card */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              {/* Dispatch strip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border-b border-green-100">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-green-800 font-semibold">
                  Free dispatch — delivered within <strong>2 weeks</strong>
                </span>
              </div>

              {/* Pincode check */}
              <div className="px-4 py-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Check Delivery Availability</p>
                <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-gray-50">
                  <svg className="w-4 h-4 text-gray-400 ml-3 self-center flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="text" value={pincode}
                    onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinMsg(''); setPinAvailable(null); }}
                    placeholder="Enter 6-digit pincode"
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent" />
                  <button onClick={handlePincode} disabled={pinChecking}
                    className="px-4 text-[11px] font-bold text-primary hover:bg-primary/5 border-l border-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 tracking-wider">
                    {pinChecking ? (
                      <svg className="w-3.5 h-3.5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : 'CHECK'}
                  </button>
                </div>
                {pinMsg && (
                  <div className={`mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
                    pinAvailable === true ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={pinAvailable === true ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} />
                    </svg>
                    {pinMsg}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end main grid */}

        {/* ── Product Description ───────────────────────────────────────────── */}
        {(product.description || product.shortDescription) && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">Product Description</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                {product.description ? (
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed
                    prose-headings:font-heading prose-headings:text-gray-800
                    prose-p:mb-3 prose-li:mb-1 prose-ul:pl-5">
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  </div>
                ) : (
                  <p className="text-gray-600 leading-relaxed text-sm">{product.shortDescription}</p>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'BIS Hallmarked', desc: 'Certified purity & quality' },
                  { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', label: 'Handcrafted', desc: 'Artisan-made with care' },
                  { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', label: 'Gift Ready', desc: 'Premium packaging included' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-[#eedfd8] shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-[#f5eded] border border-[#e4d0c8] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Specifications ────────────────────────────────────────────────── */}
        {(product.attributes?.length > 0 || product.weight || product.length || product.color || product.metalColor) && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">Specifications</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {[
                product.metalColor && ['Metal Color', product.metalColor],
                product.color      && ['Color',       product.color],
                product.length     && ['Length',      product.length],
                product.weight     && ['Weight',      `${product.weight} g`],
                ...(product.attributes || [])
                  .filter((a) => a.attribute)
                  .map(({ attribute: attr, values, customValue }) => [
                    attr.name,
                    values?.map((v) => v.value).join(', ') || customValue || null,
                  ])
                  .filter(([, v]) => v),
              ].filter(Boolean).map(([label, value], idx) => (
                <div key={label} className={`flex items-center gap-4 px-6 py-3.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#faf6f2]'} border-b border-gray-100 last:border-0`}>
                  <span className="text-sm text-gray-400 w-40 flex-shrink-0 font-medium">{label}</span>
                  <span className="text-sm font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h2 className="font-heading text-xl font-bold text-gray-900">Customer Reviews</h2>
            {product.totalReviews > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                <Stars rating={product.rating} />
                <span className="text-xs font-bold text-amber-700">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-amber-600/60">/ 5 · {product.totalReviews} reviews</span>
              </div>
            )}
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent hidden sm:block" />
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-14 bg-[#faf6f2] rounded-2xl border border-[#eedfd8]">
              <div className="w-14 h-14 rounded-full bg-white border border-[#e4d0c8] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share your experience</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0 uppercase border border-primary/20">
                    {rev.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{rev.user?.name}</span>
                      <Stars rating={rev.rating} />
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">Verified</span>
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {rev.title && <p className="text-sm font-bold text-gray-800 mb-1">{rev.title}</p>}
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Related Products ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-heading text-xl font-bold text-gray-900">You May Also Like</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

      </div>

    </>
  );
}
