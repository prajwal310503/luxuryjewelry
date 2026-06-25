import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { productAPI, reviewAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useAuthStore from '../store/authStore';
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


// ─── Review write form + list ─────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
];

function ReviewCard({ rev, idx }) {
  const gradClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const ratingColors = ['', 'bg-red-50 border-red-100', 'bg-orange-50 border-orange-100', 'bg-yellow-50 border-yellow-100', 'bg-lime-50 border-lime-100', 'bg-emerald-50 border-emerald-100'];
  const cardBg = ratingColors[rev.rating] || 'bg-white border-gray-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
      className={`rounded-2xl border p-5 ${cardBg} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradClass} flex items-center justify-center font-bold text-white text-base flex-shrink-0 shadow-sm uppercase`}>
          {rev.user?.name?.[0] || '?'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900">{rev.user?.name || 'Customer'}</span>
                {rev.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Verified
                  </span>
                )}
              </div>
              {/* Stars */}
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
              {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Title + comment */}
          {rev.title && (
            <p className="text-sm font-bold text-gray-800 mb-1">{rev.title}</p>
          )}
          <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>

          {/* Photos */}
          {rev.images?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {rev.images.map((img, i) => (
                <a key={i} href={img.url} target="_blank" rel="noreferrer"
                  className="w-18 h-18 rounded-xl overflow-hidden border-2 border-white shadow-md block hover:scale-105 transition-transform">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ReviewList({ reviews }) {
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 4;
  const visible = showAll ? reviews : reviews.slice(0, LIMIT);
  const hasMore = reviews.length > LIMIT;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((rev, idx) => (
          <ReviewCard key={rev._id} rev={rev} idx={idx} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-primary/30 text-primary text-sm font-bold rounded-full hover:bg-primary/5 hover:border-primary/60 transition-all"
          >
            {showAll ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                See All {reviews.length} Reviews
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ product, reviews, setReviews }) {
  const { isAuthenticated, user } = useAuthStore();
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoFiles, setPhotoFiles]       = useState([]);
  const [form, setForm] = useState({ rating: 0, hoverRating: 0, title: '', comment: '' });
  const fileRef = useRef(null);

  const alreadyReviewed = reviews.some((r) => r.user?._id === user?._id || r.user?.id === user?._id);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setPhotoFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (idx) => {
    setPhotoFiles((p) => p.filter((_, i) => i !== idx));
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error('Please select a star rating');
    if (!form.comment.trim()) return toast.error('Please write a review comment');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('product', product._id);
      fd.append('rating', form.rating);
      fd.append('title', form.title);
      fd.append('comment', form.comment);
      photoFiles.forEach((f) => fd.append('photos', f));
      const { data } = await reviewAPI.create(fd);
      setReviews((prev) => [data.data, ...prev]);
      setShowForm(false);
      setForm({ rating: 0, hoverRating: 0, title: '', comment: '' });
      setPhotoFiles([]); setPhotoPreviews([]);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-14">
      {/* Header */}
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
        {isAuthenticated() && !alreadyReviewed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Write a Review
          </button>
        )}
      </div>

      {/* Write review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-white border border-[#e8d5bc] rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h3 className="font-heading font-bold text-gray-900 text-base">Share Your Experience</h3>

            {/* Star picker */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Rating</p>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} type="button"
                    onMouseEnter={() => setForm((f) => ({ ...f, hoverRating: s }))}
                    onMouseLeave={() => setForm((f) => ({ ...f, hoverRating: 0 }))}
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                  >
                    <svg className={`w-8 h-8 transition-colors ${s <= (form.hoverRating || form.rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </button>
                ))}
                {form.rating > 0 && (
                  <span className="ml-2 text-sm font-semibold text-amber-600 self-center">
                    {['','Poor','Fair','Good','Very Good','Excellent'][form.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Review Title <span className="font-normal normal-case text-gray-400">(optional)</span></p>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Summarise your experience..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* Comment */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Review</p>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Tell others about the quality, design, and your overall experience..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add Photos <span className="font-normal normal-case text-gray-400">(up to 5)</span></p>
              <div className="flex flex-wrap gap-2 items-center">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                {photoPreviews.length < 5 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary/50 hover:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span className="text-[10px] font-semibold">Add Photo</span>
                  </button>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePhotos} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md shadow-primary/20">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Review list */}
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
        <ReviewList reviews={reviews} />
      )}

      {/* Prompt to log in */}
      {!isAuthenticated() && (
        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link> to write a review
        </p>
      )}
    </div>
  );
}

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
  const [paused, setPaused]               = useState(false);
  const [selectedSize, setSelectedSize]             = useState('');
  const [selectedLength, setSelectedLength]         = useState('');
  const [selectedStoneColor, setSelectedStoneColor] = useState('');
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

  const needsSize   = product.sizes?.enabled && product.sizes?.available?.length > 0;
  const needsLength = product.lengths?.enabled && product.lengths?.available?.length > 0;
  const needsColor  = product.stoneColors?.length > 0;

  const handleAddToCart = () => {
    if (needsSize && !selectedSize) return toast.error('Please select a size');
    if (needsLength && !selectedLength) return toast.error('Please select a length');
    if (needsColor && !selectedStoneColor) return toast.error('Please select a stone color');
    const selections = {};
    if (selectedSize)       selections.size        = selectedSize;
    if (selectedLength)     selections.length      = `${selectedLength}"`;
    if (selectedStoneColor) selections.stoneColor  = selectedStoneColor;
    addItem(
      product,
      qty,
      Object.keys(selectedAttrs).length ? selectedAttrs : null,
      Object.keys(selections).length ? selections : null
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <Helmet>
        <title>{product.title} | LUXURY JEWELRY</title>
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
              className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8f5f2] group shadow-md"
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
                      className="w-full h-full object-cover bg-black" />
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
                      className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                        imgIdx === i
                          ? 'border-primary shadow-md shadow-primary/20 scale-[1.04]'
                          : 'border-transparent hover:border-gray-300'
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
                        <img src={item.url} alt="" className="w-full h-full object-contain" />
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
          <div className="space-y-5">

            {/* Category + status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Link to={`/collections/${product.category.slug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A0824A] uppercase tracking-widest border border-[#C9A84C]/50 bg-gradient-to-r from-[#fdf6e3] to-[#fef9ec] px-3.5 py-1.5 rounded-full shadow-sm hover:shadow-md hover:border-[#C9A84C]/80 hover:from-[#fef3cc] hover:to-[#fdf6e3] transition-all duration-200">
                  <svg className="w-2.5 h-2.5 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                  {product.category.name}
                </Link>
              )}
              {product.isNewArrival && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3.5 py-1.5 rounded-full shadow-sm tracking-wide">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  NEW ARRIVAL
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-400 text-white px-3.5 py-1.5 rounded-full shadow-sm tracking-wide">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  BESTSELLER
                </span>
              )}
            </div>

            {product.store && (
              <Link to={`/stores/${product.store.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/80 hover:border-primary/30 transition-colors">
                {product.store.logo ? (
                  <img src={product.store.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{product.store.name?.charAt(0)}</div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sold by</p>
                  <p className="text-sm font-semibold text-gray-900">{product.store.name}</p>
                </div>
              </Link>
            )}

            {/* Title */}
            <div>
              <h1 ref={titleRef} className="font-heading text-[1.75rem] md:text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="h-[2px] w-12 bg-[#C9A84C] rounded-full" />
                <div className="h-[2px] w-4 bg-[#C9A84C]/40 rounded-full" />
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
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-mono font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm">
                  <svg className="w-3 h-3 text-[#C9A84C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="pb-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[2.4rem] font-bold font-heading text-gray-900 leading-none tracking-tight">
                  <span className="text-lg text-gray-400 font-normal mr-0.5">₹</span>{Math.round(salePrice).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through font-normal">{fmt(product.price)}</span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    Save {fmt(product.price - salePrice)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Inclusive of all taxes &nbsp;·&nbsp; Free shipping</p>
              <div className="h-px bg-gradient-to-r from-[#C9A84C]/50 via-[#C9A84C]/20 to-transparent mt-4" />
            </div>

            {/* Jewelry spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl bg-amber-50 border border-amber-100">
                <svg className="w-4 h-4 text-amber-600 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Purity</p>
                <p className="text-sm font-bold text-amber-900">{product.purity || '22kt'}</p>
              </div>
              {product.metalWeight > 0 && (
                <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl bg-gray-50 border border-gray-200">
                  <svg className="w-4 h-4 text-gray-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Metal</p>
                  <p className="text-sm font-bold text-gray-800">{product.metalWeight} g</p>
                </div>
              )}
              {product.diamondClarity && (() => {
                const label = typeof product.diamondClarity === 'string'
                  ? product.diamondClarity
                  : product.diamondClarity?.natural ? 'Natural' : product.diamondClarity?.cz ? 'CZ' : null;
                return label ? (
                  <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl bg-blue-50 border border-blue-100">
                    <svg className="w-4 h-4 text-blue-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">Diamond</p>
                    <p className="text-sm font-bold text-blue-900">{label}</p>
                  </div>
                ) : null;
              })()}
              {product.deliveryDays > 0 && (
                <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl bg-green-50 border border-green-100">
                  <svg className="w-4 h-4 text-green-600 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-[10px] text-green-600 uppercase tracking-wider font-semibold">Delivery</p>
                  <p className="text-sm font-bold text-green-900">{product.deliveryDays} days</p>
                </div>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Selectors */}
            {(product.attributes?.filter((a) => a.attribute?.isVariant).length > 0 || needsSize || needsLength || needsColor) && (
              <div className="space-y-4 bg-[#faf7f4] rounded-2xl p-4 border border-[#eedfd8]">

                {/* Variant attributes */}
                {product.attributes?.filter((a) => a.attribute?.isVariant).map(({ attribute: attr, values }) => (
                  <div key={attr._id}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{attr.name}</span>
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
                              : 'border-[#e0d0c8] bg-white text-gray-600 hover:border-primary/50 hover:text-primary'
                          }`}
                        >
                          {val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Size Selector */}
                {needsSize && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Size</span>
                      {selectedSize && <span className="text-xs font-semibold text-primary bg-white border border-primary/20 px-2 py-0.5 rounded-full">{selectedSize}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.available.sort((a, b) => a - b).map((sz) => (
                        <button key={sz} type="button" onClick={() => setSelectedSize(sz)}
                          className={`w-11 h-10 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                            selectedSize === sz
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'border-[#e0d0c8] bg-white text-gray-600 hover:border-primary/60 hover:text-primary'
                          }`}
                        >{sz}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Length Selector */}
                {needsLength && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Length (inches)</span>
                      {selectedLength && <span className="text-xs font-semibold text-primary bg-white border border-primary/20 px-2 py-0.5 rounded-full">{selectedLength}"</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.lengths.available.sort((a, b) => a - b).map((len) => (
                        <button key={len} type="button" onClick={() => setSelectedLength(len)}
                          className={`w-11 h-10 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                            selectedLength === len
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'border-[#e0d0c8] bg-white text-gray-600 hover:border-primary/60 hover:text-primary'
                          }`}
                        >{len}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stone Color Selector */}
                {needsColor && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Stone Color</span>
                      {selectedStoneColor && <span className="text-xs font-semibold text-primary bg-white border border-primary/20 px-2 py-0.5 rounded-full">{selectedStoneColor}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.stoneColors.map((color) => (
                        <button key={color} type="button" onClick={() => setSelectedStoneColor(color)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                            selectedStoneColor === color
                              ? 'bg-primary text-white border-primary shadow-md scale-[1.03]'
                              : 'border-[#e0d0c8] bg-white text-gray-600 hover:border-primary/60 hover:text-primary'
                          }`}
                        >{color}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA — Qty + Add to Cart */}
            <div className="space-y-3">
              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Only {product.stock} left in stock
                </p>
              )}
              <div className="flex gap-3 items-stretch">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex-shrink-0">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-11 h-13 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-lg select-none px-3 py-3.5">
                    −
                  </button>
                  <span className="w-11 text-center text-base font-bold text-gray-900 border-x-2 border-gray-200 h-13 flex items-center justify-center py-3.5">
                    {qty}
                  </span>
                  <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                    className="w-11 h-13 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors font-bold text-lg select-none px-3 py-3.5">
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-bold text-sm tracking-widest uppercase rounded-xl transition-all duration-150 shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none py-4"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {/* Wishlist + Share */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleItem(product)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                    inWishlist
                      ? 'border-red-300 bg-red-50 text-red-500'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/40 hover:text-red-500'
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

              {/* Trust strip */}
              <div className="flex items-center justify-center gap-5 pt-1 border-t border-gray-100">
                {[
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'BIS Certified' },
                  { icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', label: 'Free Returns' },
                  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Secure Payment' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
                    <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                  </div>
                ))}
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


        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <ReviewsSection
          product={product}
          reviews={reviews}
          setReviews={setReviews}
        />

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
