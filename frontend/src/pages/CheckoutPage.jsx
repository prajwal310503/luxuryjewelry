import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const steps = ['Address', 'Review', 'Payment'];

export default function CheckoutPage() {
  const { items, getSubtotal, getShipping, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');

  if (items.length === 0) {
    return (
      <div className="container-luxury py-20 text-center">
        <h2 className="font-heading text-2xl text-gray-700 mb-4">Your cart is empty</h2>
        <Link to="/collections" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!address[field]) { toast.error(`${field} is required`); return; }
    }
    setCurrentStep(1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        variantAttributes: item.variantAttributes,
      }));

      const { data } = await orderAPI.create({
        items: orderItems,
        shippingAddress: address,
        payment: { method: paymentMethod },
        couponCode: couponCode || undefined,
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${data.data._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | Luxury Jewelry</title>
      </Helmet>

      <div className="container-luxury py-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${idx <= currentStep ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  idx < currentStep ? 'bg-primary border-primary text-white' :
                  idx === currentStep ? 'border-primary text-primary' : 'border-gray-200 text-gray-400'
                }`}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-16 h-0.5 ${idx < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left */}
          <div className="lg:col-span-2">
            {currentStep === 0 && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleAddressSubmit}
                className="card-luxury p-6"
              >
                <h2 className="font-heading text-xl font-semibold mb-6">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { field: 'fullName', label: 'Full Name', col: 1 },
                    { field: 'phone', label: 'Phone Number', col: 1 },
                    { field: 'addressLine1', label: 'Address Line 1', col: 2 },
                    { field: 'addressLine2', label: 'Address Line 2 (Optional)', col: 2 },
                    { field: 'city', label: 'City', col: 1 },
                    { field: 'state', label: 'State', col: 1 },
                    { field: 'pincode', label: 'Pincode', col: 1 },
                    { field: 'country', label: 'Country', col: 1 },
                  ].map(({ field, label, col }) => (
                    <div key={field} className={col === 2 ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={address[field]}
                        onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                        className="input-luxury"
                        placeholder={label}
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn-primary mt-6 w-full justify-center py-4">
                  Continue to Review
                </button>
              </motion.form>
            )}

            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card-luxury p-6">
                <h2 className="font-heading text-xl font-semibold mb-6">Review Order</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    const price = item.product.discountedPrice ?? item.product.price;
                    return (
                      <div key={item.key} className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                          {item.product.images?.[0]?.url && (
                            <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{item.product.title}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="price-tag text-sm">{formatPrice(price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping Address Preview */}
                <div className="bg-luxury-cream rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                  <p className="text-sm text-gray-700">
                    {address.fullName}, {address.phone}<br />
                    {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(0)} className="btn-outline flex-1 justify-center">
                    ← Back
                  </button>
                  <button onClick={() => setCurrentStep(2)} className="btn-primary flex-1 justify-center">
                    Choose Payment
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card-luxury p-6">
                <h2 className="font-heading text-xl font-semibold mb-6">Payment Method</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { value: 'razorpay', label: 'Razorpay', desc: 'UPI, Cards, Net Banking', icon: '💳' },
                    { value: 'stripe', label: 'Stripe', desc: 'International Cards', icon: '💳' },
                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when delivered', icon: '💵' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                        paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-primary"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{method.label}</p>
                        <p className="text-xs text-gray-400">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="input-luxury flex-1"
                    />
                    <button type="button" className="btn-outline px-4 text-sm">Apply</button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(1)} className="btn-outline flex-1 justify-center">← Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center py-4"
                  >
                    {loading ? 'Placing Order...' : `Place Order — ${formatPrice(getTotal())}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-luxury p-6 sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-5">Order Summary</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={getShipping() === 0 ? 'text-green-600 font-medium' : ''}>
                    {getShipping() === 0 ? 'FREE' : formatPrice(getShipping())}
                  </span>
                </div>
                {getShipping() === 0 && (
                  <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    You save ₹199 on shipping!
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="price-tag">{formatPrice(getTotal())}</span>
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-1.5">
                <p>✓ 100% Secure Payments</p>
                <p>✓ 15-Day Returns</p>
                <p>✓ IGI Certified Diamonds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
