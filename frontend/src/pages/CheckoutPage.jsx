import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const steps = ['Address', 'Review', 'Payment'];

const FIELDS = [
  { field: 'fullName',     label: 'Full Name',              col: 1, required: true },
  { field: 'phone',        label: 'Phone Number',           col: 1, required: true },
  { field: 'addressLine1', label: 'Address Line 1',         col: 2, required: true },
  { field: 'addressLine2', label: 'Address Line 2 (Optional)', col: 2, required: false },
  { field: 'city',         label: 'City',                   col: 1, required: true },
  { field: 'state',        label: 'State',                  col: 1, required: true },
  { field: 'pincode',      label: 'Pincode',                col: 1, required: true },
  { field: 'country',      label: 'Country',                col: 1, required: false },
];

const PAYMENT_METHODS = [
  {
    value: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    badge: 'Most Popular',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    value: 'razorpay',
    label: 'Razorpay',
    desc: 'UPI, Cards, Net Banking, Wallets',
    badge: null,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    value: 'stripe',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, American Express',
    badge: null,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function CheckoutPage() {
  const { items, getSubtotal, getShipping, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');

  if (items.length === 0) {
    return (
      <div className="container-luxury py-20 text-center">
        <h2 className="font-heading text-2xl text-gray-700 mb-4">Your cart is empty</h2>
        <Link to="/collections" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const validateAddress = () => {
    const newErrors = {};
    FIELDS.forEach(({ field, required }) => {
      if (required && !address[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    if (address.phone && !/^\d{10}$/.test(address.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (address.pincode && !/^\d{6}$/.test(address.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (validateAddress()) {
      setCurrentStep(1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Please fill in all required fields');
    }
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
      toast.error(error.response?.data?.message || error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();

  return (
    <>
      <Helmet><title>Checkout | VK Jewellers</title></Helmet>

      <div className="container-luxury py-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-4">
              <button
                onClick={() => idx < currentStep && setCurrentStep(idx)}
                className={`flex items-center gap-2 ${idx <= currentStep ? 'text-primary' : 'text-gray-400'} ${idx < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  idx < currentStep ? 'bg-primary border-primary text-white' :
                  idx === currentStep ? 'border-primary text-primary' : 'border-gray-200 text-gray-400'
                }`}>
                  {idx < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`w-16 h-0.5 transition-all ${idx < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Steps */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 0: Address */}
              {currentStep === 0 && (
                <motion.form
                  key="address"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleAddressSubmit}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-6">Shipping Address</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FIELDS.map(({ field, label, col, required }) => (
                      <div key={field} className={col === 2 ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {label}
                          {required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                          type="text"
                          value={address[field]}
                          onChange={(e) => {
                            setAddress({ ...address, [field]: e.target.value });
                            if (errors[field]) setErrors({ ...errors, [field]: '' });
                          }}
                          placeholder={label}
                          className={`input-luxury transition-all ${
                            errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
                          }`}
                        />
                        {errors[field] && (
                          <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary mt-6 w-full justify-center py-3.5 text-sm">
                    Continue to Review
                    <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.form>
              )}

              {/* Step 1: Review */}
              {currentStep === 1 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-6">Review Order</h2>

                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => {
                      const price = item.product.discountedPrice ?? item.product.price;
                      return (
                        <div key={item.key} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <div className="w-16 h-16 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                            {item.product.images?.[0]?.url
                              ? <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-luxury-beige" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.product.title}</p>
                            {item.variantAttributes && (
                              <p className="text-xs text-gray-400 mt-0.5">{Object.values(item.variantAttributes).join(' · ')}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="price-tag text-sm font-semibold flex-shrink-0">{formatPrice(price * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Address Preview */}
                  <div className="bg-luxury-cream rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Address</p>
                      <button onClick={() => setCurrentStep(0)} className="text-xs text-primary hover:underline font-medium">Edit</button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {address.fullName} &bull; {address.phone}<br />
                      {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                      {address.city}, {address.state} &ndash; {address.pincode}, {address.country}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setCurrentStep(0)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button onClick={() => { setCurrentStep(2); window.scrollTo(0, 0); }} className="btn-primary flex-1 justify-center">
                      Choose Payment
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-6">Payment Method</h2>

                  <div className="space-y-3 mb-6">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                          paymentMethod === method.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
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
                        <span className={`${paymentMethod === method.value ? 'text-primary' : 'text-gray-400'}`}>
                          {method.icon}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{method.label}</p>
                            {method.badge && (
                              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {method.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{method.desc}</p>
                        </div>
                        {paymentMethod === method.value && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Code (Optional)</label>
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

                  {/* COD Info Box */}
                  {paymentMethod === 'cod' && (
                    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Pay <strong>{formatPrice(total)}</strong> in cash when your order is delivered. No advance payment needed.</p>
                    </div>
                  )}

                  {(paymentMethod === 'razorpay' || paymentMethod === 'stripe') && (
                    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Payment gateway is in demo mode. Your order will be placed and marked as <strong>pending payment</strong>.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setCurrentStep(1)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="btn-primary flex-1 justify-center py-3.5 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'cod' ? 'Place Order' : 'Confirm & Pay'}
                          &nbsp;&mdash;&nbsp;{formatPrice(total)}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-luxury p-6 sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-5">Order Summary</h3>

              {/* Item thumbnails */}
              <div className="space-y-3 mb-5">
                {items.map((item) => {
                  const price = item.product.discountedPrice ?? item.product.price;
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-luxury-cream overflow-hidden">
                          {item.product.images?.[0]?.url
                            ? <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-luxury-beige" />
                          }
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none" style={{ width: 18, height: 18 }}>
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.product.title}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 flex-shrink-0">{formatPrice(price * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                    You save ₹199 on shipping!
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="price-tag">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  '100% Secure Payments',
                  '15-Day Easy Returns',
                  'IGI / BIS Certified Jewelry',
                ].map((txt) => (
                  <div key={txt} className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {txt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
