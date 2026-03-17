import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { productAPI, reviewAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';

const fmt = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

// ─── Star Rating ──────────────────────────────────────────────────────────────
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

// ─── Trust Badges ─────────────────────────────────────────────────────────────
const TRUST = [
  { label: '15 Days\nReturn',       path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Certified\nJewelry',    path: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { label: '100% Lifetime\nExchange', path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Free & Safe\nShipping',  path: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
];

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct]               = useState(null);
  const [reviews, setReviews]               = useState([]);
  const [related, setRelated]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [imgIdx, setImgIdx]                 = useState(0);
  const [selectedAttrs, setSelectedAttrs]   = useState({});
  const [qty, setQty]                       = useState(1);
  const [descExpanded, setDescExpanded]     = useState(false);
  const [priceTab, setPriceTab]             = useState('breakup');
  const [stickyVisible, setStickyVisible]   = useState(false);
  const [pincode, setPincode]               = useState('');
  const titleRef = useRef(null);

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
  }, [slug]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!titleRef.current) return;
      setStickyVisible(titleRef.current.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container-luxury py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="shimmer-loading aspect-square rounded-xl" />
            <div className="flex gap-2">
              {[0,1,2,3].map((i) => <div key={i} className="w-20 h-20 rounded-lg shimmer-loading" />)}
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {[80,50,30,100,60].map((w, i) => (
              <div key={i} className={`shimmer-loading h-5 rounded w-${w === 100 ? 'full' : `${w}%`}`} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container-luxury py-24 text-center text-gray-400">
      <p className="text-xl">Product not found</p>
      <Link to="/" className="btn-primary mt-6 inline-block">Back to Home</Link>
    </div>
  );

  const salePrice  = product.discountedPrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const inWishlist  = isInWishlist(product._id);
  const pb          = product.priceBreakup;
  const hasPb       = pb && (pb.metalAmount || pb.diamondAmount || pb.makingCharges);

  const handleAddToCart = () => addItem(product, qty, Object.keys(selectedAttrs).length ? selectedAttrs : null);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Compute price total from breakup
  const pbSub         = hasPb ? (pb.metalAmount || 0) + (pb.diamondAmount || 0) + (pb.makingCharges || 0) : 0;
  const pbGst         = hasPb ? Math.round(pbSub * ((pb.gstPct || 3) / 100)) : 0;
  const computedTotal = hasPb ? pbSub + pbGst : null;
  // Auto-calculate savings: discount on diamond + making charges
  const autoSavings   = hasPb
    ? ((pb.diamondOriginalAmount || 0) - (pb.diamondAmount || 0)) + ((pb.makingChargesOriginal || 0) - (pb.makingCharges || 0))
    : 0;
  const totalSavings  = pb?.totalSavings > 0 ? pb.totalSavings : autoSavings > 0 ? Math.round(autoSavings) : 0;
  // Estimated dispatch date (2 days from now)
  const dispatchDate  = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <Helmet>
        <title>{product.title} | Luxury Jewelry</title>
        <meta name="description" content={product.shortDescription || product.seo?.metaDescription || product.title} />
      </Helmet>

      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
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
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-primary text-sm px-6 py-2 flex-shrink-0 disabled:opacity-40"
              >
                Add to Cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-luxury py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/collections/${product.category.slug}`} className="hover:text-primary capitalize">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-xs">{product.title}</span>
        </nav>

        {/* ── Main Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">

          {/* ── LEFT: Image Gallery ─────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 self-start">
            <motion.div
              key={imgIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8f5f2]"
            >
              {product.images?.[imgIdx] ? (
                <img src={product.images[imgIdx].url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-luxury-beige" />
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  -{product.discount}% OFF
                </span>
              )}
            </motion.div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all ${
                      imgIdx === i ? 'border-primary shadow-sm' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Details ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Vendor */}
            {product.vendor && (
              <Link to={`/vendors/${product.vendor.storeSlug}`}
                className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
                {product.vendor.storeName}
              </Link>
            )}

            {/* Title */}
            <h1 ref={titleRef} className="font-heading text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <Stars rating={product.rating} />
                <span className="text-sm text-gray-500">{product.rating} ({product.totalReviews} reviews)</span>
              </div>
            )}

            {/* Price Block */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">{fmt(salePrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">{fmt(product.price)}</span>
                  <span className="text-sm bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                    Save {fmt(product.price - salePrice)}
                  </span>
                </>
              )}
            </div>

            {/* Promo Banner Image */}
            {product.promoBannerImage && (
              <img src={product.promoBannerImage} alt="Offer" className="w-full rounded-xl object-cover max-h-24" />
            )}

            {/* Attributes / SIZE & CUSTOMIZATION */}
            {product.attributes?.filter((a) => a.attribute?.isVariant).length > 0 && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Size & Customization</p>
                {product.attributes.filter((a) => a.attribute?.isVariant).map(({ attribute: attr, values }) => (
                  <div key={attr._id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{attr.name}</span>
                      {selectedAttrs[attr._id] && (
                        <span className="text-xs text-gray-400">
                          {values.find((v) => v._id === selectedAttrs[attr._id])?.value}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => (
                        <button
                          key={val._id}
                          onClick={() => setSelectedAttrs({ ...selectedAttrs, [attr._id]: val._id })}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            selectedAttrs[attr._id] === val._id
                              ? 'bg-primary text-white border-primary'
                              : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
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

            {/* ADD TO CART */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full btn-primary py-4 text-base font-semibold disabled:opacity-40"
            >
              {product.stock === 0 ? 'Out of Stock' : 'ADD TO CART'}
            </button>

            {/* Wishlist + Share + Stock row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleItem(product)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
                }`}
              >
                <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              {product.stock > 0 && product.stock <= 10 && (
                <span className="text-xs text-amber-600 font-medium px-2">Only {product.stock} left</span>
              )}
            </div>

            {/* Estimated Dispatch */}
            <p className="text-sm text-gray-600">
              Estimated Free Dispatch by{' '}
              <span className="font-bold text-green-600">{dispatchDate}</span>
            </p>

            {/* Pincode */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <svg className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter Pincode"
                className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
              />
              <button className="px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors border-l border-gray-200 flex items-center gap-1 whitespace-nowrap">
                LOCATE ME
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-4 gap-2 py-4 border-y border-gray-100">
              {TRUST.map(({ label, path }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-11 h-11 rounded-full bg-[#f5eded] flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-600 font-medium leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>

            {/* Visit Our Store + Try at Home */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden flex items-stretch">
                <div className="w-20 bg-[#f3ede9] flex-shrink-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1 p-3">
                  <p className="text-sm font-bold text-gray-800">Visit Our Store</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">Explore and try your favourite designs live</p>
                </div>
                <div className="flex items-center pr-3">
                  <button className="px-3 py-1.5 text-xs font-bold bg-[#6b48c8] text-white rounded-lg whitespace-nowrap hover:bg-[#5a3ab3] transition-colors">
                    BOOK APPOINTMENT
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden flex items-stretch">
                <div className="w-20 bg-[#f3ede9] flex-shrink-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 p-3">
                  <p className="text-sm font-bold text-gray-800">Try at Home</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">Try selected pieces from the comfort of your home</p>
                </div>
                <div className="flex items-center pr-3">
                  <button className="px-3 py-1.5 text-xs font-bold bg-rose-gold text-white rounded-lg whitespace-nowrap hover:opacity-90 transition-opacity">
                    TRY AT HOME
                  </button>
                </div>
              </div>
            </div>

            {/* PRODUCT DETAILS */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Product Details</p>
              </div>
              <div className="p-4 space-y-3">
                {product.sku && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">SKU:</span>
                    <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
                  </div>
                )}
                {(product.description || product.shortDescription) && (
                  <div>
                    <div
                      className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 overflow-hidden ${descExpanded ? '' : 'line-clamp-4'}`}
                      style={{ maxHeight: descExpanded ? 'none' : '5.5rem' }}
                    >
                      {product.shortDescription || (
                        <div dangerouslySetInnerHTML={{ __html: product.description }} />
                      )}
                    </div>
                    {(product.description?.length > 200 || product.shortDescription?.length > 180) && (
                      <button onClick={() => setDescExpanded(!descExpanded)}
                        className="text-xs font-semibold text-primary hover:underline mt-1.5">
                        {descExpanded ? 'SHOW LESS' : 'READ MORE'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metal + Dimension Cards */}
            {(pb?.metalType || product.weight || product.dimensions) && (
              <div className="grid grid-cols-2 gap-3">
                {(pb?.metalType || pb?.netWeight) && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Metal</p>
                    </div>
                    {pb?.metalType && <p className="text-sm font-semibold text-gray-800">{pb.metalType}</p>}
                    {pb?.netWeight && <p className="text-xs text-gray-500 mt-1">Net Wt: {pb.netWeight} g</p>}
                    {pb?.grossWeight && <p className="text-xs text-gray-500">Gross Wt: {pb.grossWeight} g</p>}
                  </div>
                )}
                {(product.weight || product.dimensions) && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Dimension</p>
                    </div>
                    {product.weight && <p className="text-xs text-gray-500">Gross Wt: {product.weight} g</p>}
                    {product.dimensions?.length && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Diamond Section */}
            {(pb?.diamondCarat || pb?.diamondClarity) && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
                  </svg>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Diamond</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Clarity',  pb.diamondClarity],
                    ['Cut',      pb.diamondCut],
                    ['Color',    pb.diamondColor],
                    ['Carat',    pb.diamondCarat ? `${pb.diamondCarat} ct` : null],
                    ['Pieces',   pb.diamondPieces],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{k}</p>
                      <p className="text-sm font-semibold text-gray-800">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakup / Price Comparison Tabs */}
            {hasPb && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex">
                  {['breakup', 'comparison'].map((t) => (
                    <button key={t} onClick={() => setPriceTab(t)}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                        priceTab === t ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}>
                      {t === 'breakup' ? 'Price Breakup' : 'Price Comparison'}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {priceTab === 'breakup' && (
                    <div className="space-y-2">
                      {[
                        ['metalType' in pb && pb.metalRate ? `${pb.metalType} (₹${pb.metalRate}/g)` : pb?.metalType, pb?.metalAmount],
                        ['Diamond', pb?.diamondAmount, pb?.diamondOriginalAmount, pb?.diamondDiscountPct],
                        ['Making Charges', pb?.makingCharges, pb?.makingChargesOriginal, pb?.makingChargesDiscountPct],
                      ].filter(([l, v]) => l && v).map(([label, amount, orig, disc]) => (
                        <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            {label}
                            {disc > 0 && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">{disc}% OFF</span>}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900">{fmt(amount)}</span>
                            {orig > 0 && orig > amount && <span className="text-xs text-gray-400 line-through ml-2">{fmt(orig)}</span>}
                          </div>
                        </div>
                      ))}
                      {/* GST */}
                      {computedTotal && (() => {
                        const sub = (pb.metalAmount || 0) + (pb.diamondAmount || 0) + (pb.makingCharges || 0);
                        const gst = Math.round(sub * ((pb.gstPct || 3) / 100));
                        return (
                          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                            <span className="text-sm text-gray-600">GST ({pb.gstPct || 3}%)</span>
                            <span className="text-sm font-semibold text-gray-900">{fmt(gst)}</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-gray-900">{fmt(computedTotal)}</span>
                      </div>
                      {totalSavings > 0 && (
                        <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 mt-1">
                          <span className="text-sm text-green-700 font-semibold">Save on this jewelry</span>
                          <span className="text-sm font-bold text-green-700 bg-green-600 text-white px-2.5 py-1 rounded-full">{fmt(totalSavings)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {priceTab === 'comparison' && pb?.diamondCarat && (
                    <div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div />
                        <div className="text-center font-bold text-primary">Lab-Grown Diamond</div>
                        <div className="text-center font-bold text-gray-500">Mined Diamond</div>
                        {[
                          ['Price',   pb.diamondAmount ? fmt(pb.diamondAmount) : '—',   pb.diamondOriginalAmount ? fmt(pb.diamondOriginalAmount * 2.5) : '—'],
                          ['Carat',   pb.diamondCarat ? `${pb.diamondCarat} CT` : '—',  pb.diamondCarat ? `${pb.diamondCarat} CT` : '—'],
                          ['Clarity', pb.diamondClarity || '—',                          'SI'],
                          ['Color',   pb.diamondColor  || '—',                          'IJ'],
                        ].map(([row, a, b]) => (
                          <>
                            <div key={`${row}-label`} className="font-medium text-gray-600 py-1.5 border-b border-gray-50">{row}</div>
                            <div key={`${row}-a`} className="text-center py-1.5 border-b border-gray-50 text-primary font-semibold">{a}</div>
                            <div key={`${row}-b`} className="text-center py-1.5 border-b border-gray-50 text-gray-500">{b}</div>
                          </>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {(product.certifications?.length > 0 || product.certificate?.type) && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product is Certified</p>
                  {product.certifications?.[0]?.certImage && (
                    <a href={product.certifications[0].certImage} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                      Check Sample Certificate
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {product.certifications?.map((cert, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      {cert.certImage ? (
                        <a href={cert.certImage} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
                          <img src={cert.certImage} alt={cert.lab} className="h-12 w-12 object-contain rounded-full border border-gray-100 p-1" />
                        </a>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-[9px] font-bold text-primary text-center leading-tight px-1">{cert.lab}</span>
                        </div>
                      )}
                      {cert.certNumber && <span className="text-[10px] text-gray-400">{cert.certNumber}</span>}
                    </div>
                  ))}
                  {product.certificate?.type && (
                    <div className="flex flex-col items-center gap-1">
                      {product.certificate.certImage ? (
                        <img src={product.certificate.certImage} alt={product.certificate.type} className="h-12 w-12 object-contain rounded-full border border-gray-100 p-1" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-[9px] font-bold text-primary text-center leading-tight px-1">{product.certificate.type}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                  Note: Our Products Are Handcrafted And Personalized For You, Hence Weight Variance May Occur.
                </p>
              </div>
            )}

          </div>{/* end right */}
        </div>{/* end main grid */}

        {/* ── Exchange / Return Policy Strip ────────────────────────────────── */}
        <div className="mt-10 flex items-center justify-center gap-8 flex-wrap border-y border-gray-100 py-5">
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

        {/* ── What's in the Package ─────────────────────────────────────────── */}
        {(() => {
          const pkgImgs = product.packageImages?.length
            ? product.packageImages
            : product.images?.slice(-3).map((i) => i.url).filter(Boolean) || [];
          if (pkgImgs.length < 2) return null;
          return (
            <div className="mt-12">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-5">What's in the Package</h2>
              <div className={`grid gap-4 ${pkgImgs.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {pkgImgs.slice(0, 3).map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square bg-luxury-cream">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Full Description (if HTML) ────────────────────────────────────── */}
        {product.description && product.shortDescription && (
          <div className="mt-12 border-t border-gray-100 pt-10">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-5">Product Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          </div>
        )}

        {/* ── Specifications ────────────────────────────────────────────────── */}
        {product.attributes?.length > 0 && (
          <div className="mt-12 border-t border-gray-100 pt-10">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-5">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {product.attributes.map(({ attribute: attr, values, customValue }) => (
                attr && (
                  <div key={attr._id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 w-36 flex-shrink-0">{attr.name}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {values?.map((v) => v.value).join(', ') || customValue || '—'}
                    </span>
                  </div>
                )
              ))}
              {product.weight && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500 w-36 flex-shrink-0">Weight</span>
                  <span className="text-sm font-medium text-gray-800">{product.weight} g</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <div className="mt-12 border-t border-gray-100 pt-10">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-6">
            Customer Reviews ({product.totalReviews})
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <p>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="flex gap-4 pb-6 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-luxury-cream flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {rev.user?.name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{rev.user?.name}</span>
                      <Stars rating={rev.rating} />
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                    {rev.title && <p className="text-sm font-semibold text-gray-800 mb-1">{rev.title}</p>}
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Related Products ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-14 border-t border-gray-100 pt-10">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

      </div>

      {/* ── Scrolling Quality Ticker ───────────────────────────────────────── */}
      <div className="bg-[#f3ede9] border-t border-[#e8d8d0] overflow-hidden py-3.5 mt-8">
        <div className="flex gap-12 animate-[marquee_25s_linear_infinite] whitespace-nowrap w-max">
          {[
            'Quality Control & Assurance',
            'Bespoke Experience',
            'Personalized Jewelry, Made for You',
            'Fast & Secure Shipping',
            'Certified Diamonds & Metals',
            '100% Lifetime Exchange',
            'Quality Control & Assurance',
            'Bespoke Experience',
            'Personalized Jewelry, Made for You',
            'Fast & Secure Shipping',
            'Certified Diamonds & Metals',
            '100% Lifetime Exchange',
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
