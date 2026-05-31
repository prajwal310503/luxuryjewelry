import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { quoteAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const STEPS = ['Address', 'Payment', 'Confirm'];

const ADDR_FIELDS = [
  { key: 'fullName',     label: 'Full Name',           span: 2 },
  { key: 'phone',        label: 'Phone Number',         span: 1 },
  { key: 'addressLine1', label: 'Address Line 1',       span: 2 },
  { key: 'addressLine2', label: 'Address Line 2 (Optional)', span: 2 },
  { key: 'city',         label: 'City',                 span: 1 },
  { key: 'state',        label: 'State',                span: 1 },
  { key: 'pincode',      label: 'Pincode',              span: 1 },
];

const PAYMENT_METHODS = [
  {
    id:    'bank_transfer',
    label: 'Bank Transfer',
    desc:  'Transfer the amount directly to our bank account before delivery.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function QuotePaymentPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [quote,   setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [step,    setStep]    = useState(0);
  const [method,  setMethod]  = useState('bank_transfer');

  const [address, setAddress] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India',
  });
  const [addrErrors, setAddrErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    quoteAPI.getById(id)
      .then(({ data }) => {
        const q = data.data;
        if (q.status !== 'confirmed') {
          toast.error('This quote has not been confirmed yet.');
          navigate('/my-quotes');
          return;
        }
        if (q.orderId) {
          navigate(`/orders/${q.orderId._id || q.orderId}`);
          return;
        }
        setQuote(q);
        if (q.shippingAddress?.fullName) {
          setAddress({ country: 'India', ...q.shippingAddress });
        }
      })
      .catch(() => { toast.error('Quote not found'); navigate('/my-quotes'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    const errs = {};
    required.forEach((k) => { if (!address[k]?.trim()) errs[k] = 'Required'; });
    if (address.phone && !/^\d{10}$/.test(address.phone.trim())) errs.phone = 'Enter a valid 10-digit number';
    if (address.pincode && !/^\d{6}$/.test(address.pincode.trim())) errs.pincode = 'Enter a valid 6-digit pincode';
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateAddress()) { toast.error('Please fill all required fields'); return; }
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const { data } = await quoteAPI.placeOrder(id, { paymentMethod: method, shippingAddress: address });
      toast.success('Order placed successfully!');
      navigate(`/order-success/${data.data.order._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="container-luxury py-20 flex justify-center">
      <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
  if (!quote) return null;

  const total = quote.quotedTotal ?? quote.items.reduce(
    (s, i) => s + (i.unitPrice || i.originalPrice || 0) * i.quantity, 0
  );

  return (
    <>
      <Helmet><title>Place Order | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">

        {/* Back */}
        <Link to="/my-quotes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Quotes
        </Link>

        {/* Confirmed badge */}
        <div className="flex items-center gap-2 mb-8 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 text-sm text-green-700 font-medium">
          <svg className="w-5 h-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quote confirmed by VK Jewellers
          {quote.quotedTotal != null && (
            <span className="ml-auto font-bold text-green-800 text-base">{formatPrice(quote.quotedTotal)}</span>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => idx < step && setStep(idx)}
                className={`flex items-center gap-2 ${idx <= step ? 'text-primary' : 'text-gray-400'} ${idx < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  idx < step  ? 'bg-primary border-primary text-white' :
                  idx === step ? 'border-primary text-primary bg-white' :
                                 'border-gray-200 text-gray-400 bg-white'
                }`}>
                  {idx < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 transition-all ${idx < step ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Step content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* Step 0 — Address */}
              {step === 0 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-1">Delivery Address</h2>
                  <p className="text-sm text-gray-400 mb-6">Confirm or update your delivery address.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ADDR_FIELDS.map(({ key, label, span }) => (
                      <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {label}
                          {key !== 'addressLine2' && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input
                          type="text"
                          value={address[key]}
                          onChange={(e) => {
                            setAddress({ ...address, [key]: e.target.value });
                            if (addrErrors[key]) setAddrErrors({ ...addrErrors, [key]: '' });
                          }}
                          placeholder={label}
                          className={`input-luxury w-full transition-all ${addrErrors[key] ? 'border-red-400 focus:border-red-500' : ''}`}
                        />
                        {addrErrors[key] && <p className="text-xs text-red-500 mt-1">{addrErrors[key]}</p>}
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={goNext} className="btn-primary mt-6 w-full justify-center py-3.5 text-sm">
                    Continue
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {/* Step 1 — Payment */}
              {step === 1 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-1">Choose Payment</h2>
                  <p className="text-sm text-gray-400 mb-6">Select how you would like to pay for this order.</p>

                  <div className="space-y-3 mb-6">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          method === pm.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={method === pm.id}
                          onChange={() => setMethod(pm.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          method === pm.id ? 'border-primary' : 'border-gray-300'
                        }`}>
                          {method === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div className={method === pm.id ? 'text-primary' : 'text-gray-400'}>{pm.icon}</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{pm.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{pm.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(0)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button type="button" onClick={goNext} className="btn-primary flex-1 justify-center">
                      Review Order
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Confirm */}
              {step === 2 && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="card-luxury p-6"
                >
                  <h2 className="font-heading text-xl font-semibold mb-1">Review & Confirm</h2>
                  <p className="text-sm text-gray-400 mb-6">Please review your order details before placing.</p>

                  {/* Items */}
                  <div className="space-y-3 mb-5">
                    {quote.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-14 h-14 rounded-lg bg-luxury-cream flex-shrink-0 overflow-hidden">
                          {item.image
                            ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-luxury-beige" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800">{item.productName}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        {item.unitPrice != null && (
                          <p className="text-sm font-semibold price-tag">{formatPrice(item.unitPrice * item.quantity)}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Address recap */}
                  <div className="bg-luxury-cream rounded-xl p-4 mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Address</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {address.fullName} &bull; {address.phone}<br />
                        {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                        {address.city}, {address.state} &ndash; {address.pincode}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(0)} className="text-xs text-primary hover:underline font-medium flex-shrink-0">
                      Change
                    </button>
                  </div>

                  {/* Payment recap */}
                  <div className="bg-luxury-cream rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {PAYMENT_METHODS.find((p) => p.id === method)?.label}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-primary hover:underline font-medium">
                      Change
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="btn-primary flex-1 justify-center py-3.5 disabled:opacity-60"
                    >
                      {placing ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Place Order — {formatPrice(total)}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Order summary */}
          <div className="lg:col-span-1">
            <div className="card-luxury p-5 sticky top-24">
              <h3 className="font-heading text-base font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {quote.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-luxury-cream flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-luxury-beige" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.productName}</p>
                      <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                    </div>
                    {item.unitPrice != null && (
                      <p className="text-xs font-semibold text-gray-800 flex-shrink-0">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="price-tag">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {['Quote confirmed by admin', 'Secure checkout', 'IGI / BIS Certified'].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t}
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
