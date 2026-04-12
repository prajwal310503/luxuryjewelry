import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';

const formatPrice = (price) => `₹${Math.round(price).toLocaleString('en-IN')}`;

// Metal finish swatches shown on every card
const METAL_SWATCHES = [
  { label: 'Yellow Gold', color: '#C9A84C' },
  { label: 'Rose Gold',   color: '#B76E79' },
  { label: 'White Gold',  color: '#d4d4d8' },
];

/* Vivid gradient placeholders per category feel */
const CARD_GRADIENTS = [
  'from-[#c9a84c]/30 via-[#f5e6c0]/60 to-[#f9f3ee]',
  'from-[#b76e79]/25 via-[#f2dde0]/60 to-[#fdf4f5]',
  'from-[#5a413f]/20 via-[#e8d8d6]/50 to-[#fdf9f6]',
  'from-[#8b6f6b]/20 via-[#eddbd8]/55 to-[#faf6f5]',
];

const DiamondIcon = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full opacity-30">
    <polygon points="60,8 108,42 90,108 30,108 12,42" fill="url(#goldGrad)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.5"/>
    <polygon points="60,8 108,42 60,30" fill="rgba(201,168,76,0.5)"/>
    <polygon points="60,30 108,42 90,108 30,108 12,42" fill="rgba(201,168,76,0.15)"/>
    <line x1="60" y1="8" x2="60" y2="30" stroke="rgba(201,168,76,0.6)" strokeWidth="1"/>
    <line x1="60" y1="30" x2="12" y2="42" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8"/>
    <line x1="60" y1="30" x2="108" y2="42" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8"/>
    <line x1="60" y1="30" x2="30" y2="108" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8"/>
    <line x1="60" y1="30" x2="90" y2="108" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8"/>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2C97E"/>
        <stop offset="100%" stopColor="#C9A84C"/>
      </linearGradient>
    </defs>
  </svg>
);

const StarRating = ({ rating, count }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
  </div>
);

export default function ProductCard({ product, className = '', index = 0 }) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [activeSwatch, setActiveSwatch] = useState(0);

  const primaryImage  = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const secondaryImage = product.images?.[1];
  const inWishlist     = isInWishlist(product._id);
  const discountedPrice = product.discountedPrice ?? product.price;
  const hasDiscount    = product.discount > 0;
  const gradient       = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const hasImage = !!primaryImage?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.05 }}
      className={`group relative flex flex-col overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(90,65,63,0.08), 0 1px 4px rgba(90,65,63,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
      }}
      whileHover={{
        y: -6,
        boxShadow: '0 18px 48px rgba(90,65,63,0.16), 0 4px 12px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      {/* ── Image ── */}
      <Link to={`/products/${product.slug}`} className="relative block overflow-hidden flex-shrink-0" style={{ aspectRatio: '1/1' }}>

        {hasImage ? (
          <>
            {/* Primary image */}
            <img src={primaryImage.url} alt={product.title}
              className={`w-full h-full object-cover transition-all duration-700 ${secondaryImage?.url ? '' : 'group-hover:scale-105'}`}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                const fb = e.target.parentNode.querySelector('.img-fallback');
                if (fb) fb.style.display = 'flex';
              }}
            />
            {/* Jewelry gradient fallback if primary image fails */}
            <div className={`img-fallback w-full h-full bg-gradient-to-br ${gradient} absolute inset-0 flex-col items-center justify-center`} style={{ display: 'none' }}>
              <div className="w-14 h-14"><DiamondIcon /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/50 mt-2 px-4 text-center">{product.category?.name || 'Jewelry'}</p>
            </div>
            {/* Secondary image — fades in on hover (product viewed from another angle) */}
            {secondaryImage?.url && (
              <img src={secondaryImage.url} alt={`${product.title} view 2`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-600 scale-105 group-hover:scale-100"
                style={{ transitionDuration: '500ms' }}
              />
            )}
          </>
        ) : (
          /* No image placeholder */
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
            <div className="absolute top-[-20%] right-[-10%] w-36 h-36 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-15%] left-[-10%] w-28 h-28 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }} />
            <div className="w-14 h-14 relative z-10"><DiamondIcon /></div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/50 mt-2 z-10 px-4 text-center">
              {product.category?.name || 'Jewelry'}
            </p>
          </div>
        )}

        {/* Gold shimmer overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.08) 60%, transparent 80%)' }} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="text-[11px] font-extrabold text-white px-2.5 py-0.5 rounded-full shadow-sm"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
              -{product.discount}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="text-[11px] font-extrabold text-white px-2.5 py-0.5 rounded-full shadow-sm"
              style={{ background: 'linear-gradient(135deg,#C9A84C,#9C7E2A)', boxShadow: '0 2px 8px rgba(201,168,76,0.5)' }}>
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="text-[11px] font-extrabold text-white px-2.5 py-0.5 rounded-full shadow-sm"
              style={{ background: 'linear-gradient(135deg,#5a413f,#3a2927)', boxShadow: '0 2px 8px rgba(90,65,63,0.45)' }}>
              New
            </span>
          )}
        </div>

        {/* Wishlist button — always visible */}
        <button
          onClick={(e) => { e.preventDefault(); toggleItem(product); }}
          aria-label="Wishlist"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <svg className={`w-4 h-4 transition-colors duration-200 ${inWishlist ? 'text-red-500' : 'text-gray-400'}`}
            fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Add to Cart slide-up */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => { e.preventDefault(); addItem(product); }}
            className="w-full text-white text-sm font-bold py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #5a413f 0%, #3a2927 100%)',
              boxShadow: '0 4px 16px rgba(90,65,63,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            Add to Cart
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {product.vendor?.storeName && (
          <p className="text-[11px] text-gold-dark uppercase tracking-[0.15em] font-semibold truncate">
            {product.vendor.storeName}
          </p>
        )}

        <Link to={`/products/${product.slug}`}>
          <h3 className="text-[14px] font-semibold text-gray-800 hover:text-primary transition-colors leading-snug line-clamp-2">
            {product.title}
          </h3>
        </Link>

        {product.rating > 0 && (
          <StarRating rating={product.rating} count={product.totalReviews} />
        )}

        {/* Metal swatches */}
        <div className="flex items-center gap-1.5 mt-1">
          {METAL_SWATCHES.map((swatch, si) => (
            <button
              key={swatch.label}
              title={swatch.label}
              onClick={(e) => { e.preventDefault(); setActiveSwatch(si); }}
              className="rounded-full transition-all duration-200 flex-shrink-0"
              style={{
                width: si === activeSwatch ? '14px' : '11px',
                height: si === activeSwatch ? '14px' : '11px',
                background: swatch.color,
                boxShadow: si === activeSwatch
                  ? `0 0 0 2px white, 0 0 0 3.5px ${swatch.color}`
                  : '0 1px 3px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            />
          ))}
          <span className="text-[9px] text-gray-400 ml-1 tracking-wide">
            {METAL_SWATCHES[activeSwatch].label}
          </span>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-100/80">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-extrabold"
              style={{ background: 'linear-gradient(135deg,#5a413f,#8b6f6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatPrice(discountedPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>
          {hasDiscount && (
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: '#e53e3e' }}>
              {product.discount}% off on making charges
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
