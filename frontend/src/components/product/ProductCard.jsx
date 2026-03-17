import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';

const formatPrice = (price) => `₹${Math.round(price).toLocaleString('en-IN')}`;

const StarRating = ({ rating, count }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
  </div>
);

export default function ProductCard({ product, className = '' }) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const secondaryImage = product.images?.[1];
  const inWishlist = isInWishlist(product._id);
  const discountedPrice = product.discountedPrice ?? product.price;
  const hasDiscount = product.discount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group relative card-luxury overflow-hidden ${className}`}
    >
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden aspect-jewelry bg-luxury-cream">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-luxury-beige" />
        )}
        {secondaryImage && (
          <img
            src={secondaryImage.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="badge bg-red-500 text-white font-semibold text-2xs px-2 py-0.5">
              -{product.discount}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="badge bg-primary text-white font-semibold text-2xs px-2 py-0.5">New</span>
          )}
          {product.isBestSeller && (
            <span className="badge bg-gold text-white font-semibold text-2xs px-2 py-0.5">Best Seller</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggleItem(product); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          style={{ background:'rgba(255,255,255,0.80)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.75)', boxShadow:'0 2px 8px rgba(0,0,0,0.10)' }}
        >
          <svg
            className={`w-4 h-4 transition-colors ${inWishlist ? 'text-red-500 fill-current' : 'text-gray-500'}`}
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick Add to Cart */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => { e.preventDefault(); addItem(product); }}
            className="w-full text-white text-xs font-semibold py-2.5 transition-all duration-200 hover:opacity-90"
            style={{ background:'rgba(90,65,63,0.88)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderRadius:'999px', border:'1px solid rgba(255,255,255,0.18)', boxShadow:'0 4px 14px rgba(90,65,63,0.25)' }}
          >
            Add to Cart
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {product.vendor && (
          <p className="text-2xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
            {product.vendor.storeName}
          </p>
        )}
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-primary transition-colors leading-snug mb-2">
            {product.title}
          </h3>
        </Link>
        {product.rating > 0 && (
          <StarRating rating={product.rating} count={product.totalReviews} />
        )}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="price-tag text-sm">{formatPrice(discountedPrice)}</span>
          {hasDiscount && (
            <span className="price-compare text-xs">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
