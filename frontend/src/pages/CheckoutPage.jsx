import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { quoteAPI, orderAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const steps = ['Address', 'Review', 'Payment'];

const FIELDS = [
  { field: 'fullName', label: 'Full Name', col: 1, required: true },
  { field: 'phone', label: 'Phone Number', col: 1, required: true },
  { field: 'addressLine1', label: 'Address Line 1', col: 2, required: true },
  { field: 'addressLine2', label: 'Address Line 2 (Optional)', col: 2, required: false },
  { field: 'city', label: 'City', col: 1, required: true },
  { field: 'state', label: 'State', col: 1, required: true },
  { field: 'pincode', label: 'Pincode', col: 1, required: true },
  { field: 'country', label: 'Country', col: 1, required: false },
];

const EMPTY_ADDR = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' };

export default function CheckoutPage() {
  const { items, getSubtotal, getShipping, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const ADDR_KEY = `vk_saved_addresses_${user?._id || 'guest'}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('quote');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [modalSelected, setModalSelected] = useState(0);

  const [address, setAddress] = useState({ ...EMPTY_ADDR, fullName: user?.name || '', phone: user?.phone || '' });

  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const stored = JSON.parse(localStorage.getItem(ADDR_KEY) || '[]');
      if (stored.length > 0) {
        setSavedAddresses(stored);
        setAddress(stored[0]);
      } else {
        setShowNewForm(true);
      }
    } catch { setShowNewForm(true); }
  }, []);

  const persistAddress = (addr) => {
    const deduped = savedAddresses.filter(
      (a) => !(a.addressLine1 === addr.addressLine1 && a.pincode === addr.pincode)
    );
    const updated = [addr, ...deduped].slice(0, 4);
    setSavedAddresses(updated);
    localStorage.setItem(ADDR_KEY, JSON.stringify(updated));
  };

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
      persistAddress(address);
      setShowNewForm(false);
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
        product:           item.product._id,
        title:             item.product.title,
        sku:               item.product.sku || '',
        image:             item.product.images?.[0]?.url || '',
        price:             item.product.discountedPrice ?? item.product.price,
        quantity:          item.quantity,
        variantAttributes: item.variantAttributes || undefined,
        selections:        item.selections || undefined,
      }));

      const { data } = await orderAPI.create({
        items:           orderItems,
        shippingAddress: address,
        payment:         { method: paymentMethod },
      });

      clearCart();
      toast.success(paymentMethod === 'cod' ? 'Order placed! Pay on delivery.' : 'Order placed successfully!');
      navigate(`/order-success/${data.data._id}`);
    } catch (error) {
      toast.error(error?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQuote = async () => {
    setLoading(true);
    try {
      const quoteItems = items.map((item) => ({
        product:       item.product._id,
        productName:   item.product.title,
        sku:           item.product.sku || '',
        image:         item.product.images?.[0]?.url || '',
        quantity:      item.quantity,
        originalPrice: item.product.discountedPrice ?? item.product.price,
        selections:    item.selections || undefined,
      }));

      const { data } = await quoteAPI.create({
        items:           quoteItems,
        shippingAddress: address,
      });

      clearCart();
      toast.success('Quote request submitted! We will contact you shortly.');
      navigate(`/quote-success/${data.data._id}`);
    } catch (error) {
      toast.error(error?.message || 'Failed to submit quote');
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
                type="button"
                onClick={() => idx < currentStep && setCurrentStep(idx)}
                className={`flex items-center gap-2 ${idx <= currentStep ? 'text-primary' : 'text-gray-400'} ${idx < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${idx < currentStep ? 'bg-primary border-primary text-white' :
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
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-6">Shipping Address</h2>

                  {/* Saved address selected — show card */}
                  {savedAddresses.length > 0 && !showNewForm ? (
                    <div>
                      <div className="border-2 border-primary rounded-xl p-4 mb-4 bg-primary/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{address.fullName} &bull; {address.phone}</p>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                              {address.city}, {address.state} – {address.pincode}, {address.country}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full flex-shrink-0">DEFAULT</span>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <button type="button" onClick={() => { setModalSelected(0); setAddrModalOpen(true); }}
                            className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                            Change Address
                          </button>
                          {savedAddresses.length < 4 && (
                            <button type="button" onClick={() => { setAddress({ ...EMPTY_ADDR }); setShowNewForm(true); }}
                              className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                              + Add New
                            </button>
                          )}
                        </div>
                      </div>
                      <button type="button" onClick={() => { if (validateAddress()) { setCurrentStep(1); window.scrollTo(0, 0); } else toast.error('Please select a valid address'); }}
                        className="btn-primary w-full justify-center py-3.5 text-sm">
                        Continue to Review
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    /* New address form */
                    <form onSubmit={handleAddressSubmit}>
                      {savedAddresses.length > 0 && (
                        <button type="button" onClick={() => setShowNewForm(false)}
                          className="flex items-center gap-1.5 text-xs text-primary font-medium mb-4 hover:underline">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                          Back to saved addresses
                        </button>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FIELDS.map(({ field, label, col, required }) => (
                          <div key={field} className={col === 2 ? 'sm:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            <input
                              type="text"
                              value={address[field]}
                              onChange={(e) => { setAddress({ ...address, [field]: e.target.value }); if (errors[field]) setErrors({ ...errors, [field]: '' }); }}
                              placeholder={label}
                              className={`input-luxury transition-all ${errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                            />
                            {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
                          </div>
                        ))}
                      </div>
                      <button type="submit" className="btn-primary mt-6 w-full justify-center py-3.5 text-sm">
                        Save & Continue
                        <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </form>
                  )}
                </motion.div>
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
                            {item.selections && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(item.selections).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-luxury-cream border border-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                                    {k === 'size' ? `Size ${v}` : k === 'length' ? `Length ${v}` : k === 'stoneColor' ? `Stone: ${v}` : k === 'paymentMode' ? `Pay: ${v}` : `${k}: ${v}`}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="price-tag text-sm font-semibold flex-shrink-0">{formatPrice(price * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-luxury-cream rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Address</p>
                      <button type="button" onClick={() => setCurrentStep(0)} className="text-xs text-primary hover:underline font-medium">Edit</button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {address.fullName} &bull; {address.phone}<br />
                      {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                      {address.city}, {address.state} &ndash; {address.pincode}, {address.country}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCurrentStep(0)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button type="button" onClick={() => { setCurrentStep(2); window.scrollTo(0, 0); }} className="btn-primary flex-1 justify-center">
                      Continue
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
                  <h2 className="font-heading text-xl font-semibold mb-2">Choose Payment</h2>
                  <p className="text-sm text-gray-500 mb-6">Select how you'd like to pay for your order.</p>

                  {/* Payment options */}
                  <div className="space-y-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('quote')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'quote' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === 'quote' ? 'border-primary' : 'border-gray-300'}`}>
                        {paymentMethod === 'quote' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Request a Quote</p>
                        <p className="text-xs text-gray-400 mt-0.5">Our team will contact you with the best price — no payment now</p>
                      </div>
                      <svg className="w-8 h-8 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </button>
                  </div>

                  {/* Order summary recap */}
                  <div className="bg-[#faf6f2] border border-[#eedfd8] rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Items</span>
                      <span>{items.reduce((t, i) => t + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                    </div>
                    <div className="border-t border-[#eedfd8] pt-3 flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="price-tag">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCurrentStep(1)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={paymentMethod === 'cod' ? handlePlaceOrder : handleRequestQuote}
                      disabled={loading}
                      className="btn-primary flex-1 justify-center py-3.5 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {paymentMethod === 'cod' ? 'Placing Order...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {paymentMethod === 'cod' ? 'Place Order' : 'Request Quote'}
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
                        <span className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none" style={{ width: 18, height: 18 }}>
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
                  '100% Secure Process',
                  'Free Shipping above ₹5,000',
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

      {/* ── Address selection modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {addrModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setAddrModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-lg font-semibold">Select Address</h3>
                <button type="button" onClick={() => setAddrModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-5">
                {savedAddresses.map((addr, idx) => (
                  <button key={idx} type="button"
                    onClick={() => setModalSelected(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${modalSelected === idx ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${modalSelected === idx ? 'border-primary' : 'border-gray-300'}`}>
                        {modalSelected === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{addr.fullName} &bull; {addr.phone}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        {idx === 0 && <span className="text-[10px] font-bold text-primary mt-1 inline-block">DEFAULT</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                {savedAddresses.length < 4 && (
                  <button type="button"
                    onClick={() => { setAddrModalOpen(false); setAddress({ ...EMPTY_ADDR }); setShowNewForm(true); }}
                    className="btn-outline flex-1 justify-center text-sm">
                    + Add New
                  </button>
                )}
                <button type="button"
                  onClick={() => { setAddress(savedAddresses[modalSelected]); setAddrModalOpen(false); }}
                  className="btn-primary flex-1 justify-center text-sm">
                  Use This Address
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
