import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import useCartStore from '../store/cartStore';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getShipping, getTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <>
        <Helmet><title>My Cart | Luxury Jewelry</title></Helmet>
        <div className="container-luxury py-20 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <h2 className="font-heading text-3xl text-gray-700 mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Discover our luxury jewelry collection</p>
          <Link to="/collections/rings" className="btn-primary">Start Shopping</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>My Cart | Luxury Jewelry</title></Helmet>
      <div className="container-luxury py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold">My Cart ({items.length})</h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">Clear Cart</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.product.discountedPrice ?? item.product.price;
              return (
                <motion.div key={item.key} layout className="card-luxury p-4 flex gap-4">
                  <Link to={`/products/${item.product.slug}`} className="w-24 h-24 rounded-xl bg-luxury-cream overflow-hidden flex-shrink-0">
                    {item.product.images?.[0]?.url && <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />}
                  </Link>
                  <div className="flex-1">
                    <Link to={`/products/${item.product.slug}`} className="font-medium text-gray-800 hover:text-primary text-sm line-clamp-2">{item.product.title}</Link>
                    <p className="price-tag text-base mt-1">{formatPrice(price)}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100">−</button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100">+</button>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{formatPrice(price * item.quantity)}</span>
                      <button onClick={() => removeItem(item.key)} className="text-red-400 hover:text-red-600 text-sm ml-auto">Remove</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="lg:col-span-1">
            <div className="card-luxury p-6 sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-5">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(getSubtotal())}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span className={getShipping() === 0 ? 'text-green-600 font-medium' : ''}>{getShipping() === 0 ? 'FREE' : formatPrice(getShipping())}</span></div>
                <div className="border-t pt-3 flex justify-between font-semibold"><span>Total</span><span className="price-tag">{formatPrice(getTotal())}</span></div>
              </div>
              <Link to="/checkout" className="btn-primary w-full justify-center py-4 text-base">Proceed to Checkout</Link>
              <Link to="/collections" className="block text-center text-sm text-gray-500 hover:text-primary mt-3">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
