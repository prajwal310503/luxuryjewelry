import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore';

const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getShipping, getTotal } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-luxury-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-heading text-xl font-semibold text-gray-900">My Cart</h2>
              <button onClick={closeCart} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
                  <div className="w-24 h-24 rounded-full bg-luxury-cream flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-lg text-gray-700">Your cart is empty</p>
                    <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
                  </div>
                  <Link to="/collections/rings" onClick={closeCart} className="btn-primary text-sm">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="px-6 space-y-4">
                  {items.map((item) => {
                    const price = item.product.discountedPrice ?? item.product.price;
                    const image = item.product.images?.[0]?.url;
                    return (
                      <div key={item.key} className="flex gap-4">
                        <Link to={`/products/${item.product.slug}`} onClick={closeCart} className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-luxury bg-luxury-cream overflow-hidden">
                            {image ? (
                              <img src={image} alt={item.product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-luxury-beige" />
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product.slug}`} onClick={closeCart}>
                            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-primary transition-colors">
                              {item.product.title}
                            </h4>
                          </Link>
                          {item.variantAttributes && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {Object.values(item.variantAttributes).join(' · ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="price-tag text-sm">{formatPrice(price)}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(item.key)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className={getShipping() === 0 ? 'text-green-600 font-medium' : ''}>
                      {getShipping() === 0 ? 'FREE' : formatPrice(getShipping())}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="price-tag">{formatPrice(getTotal())}</span>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full justify-center text-sm"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-sm text-gray-500 hover:text-primary transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
