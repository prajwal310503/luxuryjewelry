import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { productAPI, reviewAPI } from '../services/api';
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

const TRUST = [
  { label: '15 Days\nReturn',           path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Certified\nJewelry',        path: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { label: '100% Lifetime\nExchange',   path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Free & Safe\nShipping',     path: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
];

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
  const titleRef  = useRef(null);
  const thumbsRef = useRef(null);

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
  const currentMedia = mediaItems[imgIdx] || null;

  // Auto-scroll selected thumbnail into view
  useEffect(() => {
    if (!thumbsRef.current || mediaItems.length <= 1) return;
    const btns = thumbsRef.current.querySelectorAll('button');
    if (btns[imgIdx]) btns[imgIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [imgIdx]);

  const goTo = (idx) => setImgIdx(idx);

  const salePrice   = product.discountedPrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const inWishlist  = isInWishlist(product._id);
  const mc          = METAL_COLOR_MAP[product.metalColor];

  const dispatchDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

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

  const handlePincode = () => {
    if (pincode.length !== 6) return setPinMsg('Enter a valid 6-digit pincode');
    setPinMsg(`Delivery available to ${pincode} — arrives by ${dispatchDate}`);
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
            className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm"
          >
            <div className="container-luxury py-3 flex items-center gap-4">
              {product.images?.[0] && (
                <img src={product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{product.title}</p>
                <p className="text-primary font-bold text-sm">{fmt(salePrice)}</p>
              </div>
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="btn-primary text-sm px-6 py-2 flex-shrink-0 disabled:opacity-40">
                Add to Cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-luxury py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/collections/${product.category.slug}`} className="hover:text-primary transition-colors capitalize">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-[260px]">{product.title}</span>
        </nav>

        {/* ── Main Grid ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 xl:gap-16">

          {/* LEFT — Media gallery (images + videos) */}
          <div className="lg:sticky lg:top-24 self-start">

            {/* Main viewer */}
            <motion.div
              key={imgIdx}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8f5f2] group"
            >
              {currentMedia?.type === 'video' ? (
                <video src={currentMedia.url} controls autoPlay muted loop
                  className="w-full h-full object-contain bg-black" />
              ) : currentMedia?.type === 'image' ? (
                <img src={currentMedia.url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-luxury-cream">
                  <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Badges */}
              {currentMedia?.type !== 'video' && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">-{product.discount}% OFF</span>}
                  {product.isNewArrival && <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">NEW</span>}
                  {product.isBestSeller && <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">BESTSELLER</span>}
                </div>
              )}

              {/* Hover arrow nav */}
              {mediaItems.length > 1 && currentMedia?.type !== 'video' && (
                <>
                  <button onClick={() => goTo((imgIdx - 1 + mediaItems.length) % mediaItems.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/60">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => goTo((imgIdx + 1) % mediaItems.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/60">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {/* Dot indicator */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {mediaItems.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`rounded-full transition-all ${imgIdx === i ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Thumbnail strip with scroll arrows */}
            {mediaItems.length > 1 && (
              <div className="relative mt-3">
                {/* Scroll left */}
                <button
                  onClick={() => thumbsRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:border-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
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
                      className={`flex-shrink-0 w-[70px] h-[70px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        imgIdx === i
                          ? 'border-primary shadow-lg scale-105'
                          : 'border-gray-200 hover:border-primary/50 hover:scale-105'
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
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:border-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

          </div>

          {/* RIGHT — Product Info */}
          <div className="space-y-5">

            {/* Category tag */}
            {product.category && (
              <span className="inline-block text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/8 px-3 py-1 rounded-full">
                {product.category.name}
              </span>
            )}

            {/* Title */}
            <h1 ref={titleRef} className="font-heading text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
              {product.title}
            </h1>

            {/* Rating + SKU row */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.rating > 0 ? (
                <div className="flex items-center gap-2">
                  <Stars rating={product.rating} />
                  <span className="text-sm text-gray-500">{product.rating.toFixed(1)} ({product.totalReviews} reviews)</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">No reviews yet</span>
              )}
              {product.sku && (
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-auto">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap py-1">
              <span className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">{fmt(salePrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-400 line-through">{fmt(product.price)}</span>
                  <span className="text-sm bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                    Save {fmt(product.price - salePrice)}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 -mt-3">Inclusive of all taxes</p>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-primary/30 pl-3">
                {product.shortDescription}
              </p>
            )}

            {/* Detail pills — Metal Color, Color, Length, Weight */}
            {(product.metalColor || product.color || product.length || product.weight) && (
              <div className="flex flex-wrap gap-2">
                {product.metalColor && mc && (
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${mc.bg} ${mc.border} ${mc.text}`}>
                    <span className={`w-2 h-2 rounded-full ${mc.dot}`} />
                    {product.metalColor}
                  </span>
                )}
                {product.color && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10"/></svg>
                    {product.color}
                  </span>
                )}
                {product.length && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    {product.length}
                  </span>
                )}
                {product.weight && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    {product.weight} g
                  </span>
                )}
              </div>
            )}

            {/* Variant attributes */}
            {product.attributes?.filter((a) => a.attribute?.isVariant).length > 0 && (
              <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {product.attributes.filter((a) => a.attribute?.isVariant).map(({ attribute: attr, values }) => (
                  <div key={attr._id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{attr.name}</span>
                      {selectedAttrs[attr._id] && (
                        <span className="text-xs text-primary font-medium">
                          {values.find((v) => v._id === selectedAttrs[attr._id])?.value}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => (
                        <button key={val._id}
                          onClick={() => setSelectedAttrs({ ...selectedAttrs, [attr._id]: val._id })}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            selectedAttrs[attr._id] === val._id
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
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
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl font-semibold">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Hurry! Only {product.stock} left in stock
              </div>
            )}

            {/* Qty selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantity</p>
              <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-xl select-none"
                >
                  −
                </button>
                <span className="w-12 text-center text-base font-bold text-gray-900 border-x-2 border-gray-200 h-11 flex items-center justify-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-xl select-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-bold text-sm tracking-widest uppercase py-4 rounded-2xl transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {/* Wishlist + Share — always both visible */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleItem(product)}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  inWishlist
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-500'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>

            {/* Dispatch + Pincode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600">
                  Free dispatch by{' '}
                  <span className="font-bold text-green-600">{dispatchDate}</span>
                </span>
              </div>

              <div className="flex items-stretch border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                <svg className="w-4 h-4 text-gray-400 ml-3 self-center flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="text" value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinMsg(''); }}
                  placeholder="Enter pincode to check delivery"
                  className="flex-1 px-3 py-3 text-sm outline-none bg-transparent" />
                <button onClick={handlePincode}
                  className="px-4 text-xs font-bold text-primary hover:bg-primary/5 border-l border-gray-200 transition-colors whitespace-nowrap">
                  CHECK
                </button>
              </div>
              {pinMsg && <p className="text-xs text-green-600 font-medium pl-1">{pinMsg}</p>}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-4 gap-2 py-5 border-y border-gray-100">
              {TRUST.map(({ label, path }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-11 h-11 rounded-full bg-[#f5eded] flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-600 font-semibold leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>

            {/* Visit Store / Try at Home */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-[#fdf8f5] overflow-hidden flex items-stretch">
                <div className="w-16 bg-[#f0e8e2] flex-shrink-0 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1 p-3">
                  <p className="text-sm font-bold text-gray-800">Visit Our Store</p>
                  <p className="text-xs text-gray-500 mt-0.5">Explore and try designs in person</p>
                </div>
                <div className="flex items-center pr-3">
                  <button className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-xl whitespace-nowrap hover:bg-primary/90 transition-colors">
                    BOOK NOW
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-[#fdf8f5] overflow-hidden flex items-stretch">
                <div className="w-16 bg-[#f0e8e2] flex-shrink-0 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 p-3">
                  <p className="text-sm font-bold text-gray-800">Try at Home</p>
                  <p className="text-xs text-gray-500 mt-0.5">Try selected pieces from home comfort</p>
                </div>
                <div className="flex items-center pr-3">
                  <button className="px-3 py-1.5 text-xs font-bold bg-rose-gold text-white rounded-xl whitespace-nowrap hover:opacity-90 transition-opacity">
                    TRY NOW
                  </button>
                </div>
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end main grid */}

        {/* ── Full-width sections below ─────────────────────────────────────── */}

        {/* Policy strip */}
        <div className="mt-12 flex items-center justify-center gap-8 flex-wrap border-y border-gray-100 py-5">
          {[
            { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', text: '100% EXCHANGE' },
            { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: '90% BUYBACK' },
            { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', text: '15 DAYS RETURN' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {text}
            </div>
          ))}
        </div>

        {/* ── Product Description ───────────────────────────────────────────── */}
        {(product.description || product.shortDescription) && (
          <div className="mt-12">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Product Description</h2>
            <div className="w-12 h-0.5 bg-primary mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
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
              {/* Highlight cards */}
              <div className="space-y-3">
                {[
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Hallmarked', desc: 'BIS certified purity' },
                  { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', label: 'Handcrafted', desc: 'Artisan-made with care' },
                  { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', label: 'Gift Ready', desc: 'Premium packaging included' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-[#fdf8f5] border border-[#eedfd8]">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{label}</p>
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
          <div className="mt-12">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Specifications</h2>
            <div className="w-12 h-0.5 bg-primary mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 border border-gray-100 rounded-2xl overflow-hidden">
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
                <div key={label} className={`flex items-center gap-4 px-5 py-3.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100 last:border-0`}>
                  <span className="text-sm text-gray-500 w-36 flex-shrink-0 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Customer Reviews
            </h2>
            {product.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={product.rating} size="lg" />
                <span className="text-sm font-bold text-gray-800">{product.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({product.totalReviews})</span>
              </div>
            )}
          </div>
          <div className="w-12 h-0.5 bg-primary mb-6" />

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <p className="text-gray-400 font-medium">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to review this product</p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((rev) => (
                <div key={rev._id} className="flex gap-4 p-5 bg-gray-50/60 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0 uppercase">
                    {rev.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{rev.user?.name}</span>
                      <Stars rating={rev.rating} />
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Verified Purchase</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {rev.title && <p className="text-sm font-semibold text-gray-800 mb-1">{rev.title}</p>}
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
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">You May Also Like</h2>
            <div className="w-12 h-0.5 bg-primary mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

      </div>

      {/* Quality ticker */}
      <div className="bg-[#f3ede9] border-t border-[#e8d8d0] overflow-hidden py-3.5 mt-10">
        <div className="flex gap-12 animate-[marquee_25s_linear_infinite] whitespace-nowrap w-max">
          {[
            'Quality Control & Assurance', 'Bespoke Experience', 'Personalized Jewelry, Made for You',
            'Fast & Secure Shipping', 'Certified Diamonds & Metals', '100% Lifetime Exchange',
            'Quality Control & Assurance', 'Bespoke Experience', 'Personalized Jewelry, Made for You',
            'Fast & Secure Shipping', 'Certified Diamonds & Metals', '100% Lifetime Exchange',
          ].map((item, i) => (
            <span key={i} className="text-xs font-semibold text-primary/80 uppercase tracking-widest flex items-center gap-3">
              {item}
              <span className="w-1 h-1 rounded-full bg-primary/40 inline-block" />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
