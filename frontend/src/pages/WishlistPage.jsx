import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  return (
    <>
      <Helmet><title>My Wishlist | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">My Wishlist ({items.length})</h1>
          {items.length > 0 && <button onClick={clearWishlist} className="text-sm text-red-500 hover:underline">Clear All</button>}
        </div>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl text-gray-700 mb-3">Your wishlist is empty</h2>
            <Link to="/collections" className="btn-primary">Explore Jewelry</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {items.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </div>
    </>
  );
}
