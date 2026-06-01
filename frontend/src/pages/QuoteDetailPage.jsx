import { useState, useEffect } from 'react';
import SelectionBadges from '../components/product/SelectionBadges';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { quoteAPI } from '../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

const STATUS_CONFIG = {
  pending:   { badge: 'bg-amber-100 text-amber-700',   label: 'Pending Review',  step: 0 },
  reviewed:  { badge: 'bg-blue-100 text-blue-700',     label: 'Under Review',    step: 1 },
  quoted:    { badge: 'bg-purple-100 text-purple-700', label: 'Quoted',          step: 2 },
  confirmed: { badge: 'bg-green-100 text-green-700',   label: 'Confirmed',       step: 3 },
  rejected:  { badge: 'bg-red-100 text-red-600',       label: 'Not Accepted',    step: -1 },
};

const STEPS = [
  {
    key: 'pending',
    label: 'Submitted',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'reviewed',
    label: 'Under Review',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    key: 'quoted',
    label: 'Price Quoted',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function QuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    quoteAPI.getById(id)
      .then(({ data }) => setQuote(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container-luxury py-10">
      <div className="h-64 shimmer-loading rounded-xl" />
    </div>
  );
  if (!quote) return (
    <div className="container-luxury py-10 text-center text-gray-500">Quote not found</div>
  );

  const cfg        = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;
  const activeStep = cfg.step ?? 0;
  const isRejected = quote.status === 'rejected';
  const isConfirmedNoPay = quote.status === 'confirmed' && !quote.orderId;
  const isOrderPlaced    = quote.status === 'confirmed' && quote.orderId;
  const total = quote.quotedTotal ?? quote.items?.reduce(
    (s, i) => s + (i.originalPrice || 0) * i.quantity, 0
  ) ?? 0;

  return (
    <>
      <Helmet><title>Quote #{quote.quoteNumber || id.slice(-6).toUpperCase()} | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link to="/my-quotes" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Quotes
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Quote #{quote.quoteNumber || id.slice(-8).toUpperCase()}
          </h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Status Tracker */}
        {!isRejected ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury p-5 mb-6"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Quote Status</p>
            <div className="flex items-center">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      i < activeStep
                        ? 'bg-primary text-white'
                        : i === activeStep
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i < activeStep ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.icon}
                    </div>
                    <span className={`text-[10px] mt-2 font-medium text-center leading-tight ${
                      i <= activeStep ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-4 rounded transition-colors ${
                      i < activeStep ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="card-luxury p-5 mb-6 flex items-center gap-3 bg-red-50 border-red-100">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Quote Not Accepted</p>
              <p className="text-xs text-red-500 mt-0.5">This quote request was not accepted by VK Jewellers.</p>
            </div>
          </div>
        )}

        {/* Confirmed — CTA banner */}
        {isConfirmedNoPay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap"
          >
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm text-green-700 font-medium">
              Your quote has been confirmed by VK Jewellers! Proceed to place your order.
            </p>
            <Link to={`/quotes/${id}/pay`}
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 bg-green-600 hover:bg-green-700 flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Order Now
            </Link>
          </motion.div>
        )}

        {isOrderPlaced && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="flex-1 text-sm text-blue-700 font-medium">Order has been placed for this quote.</p>
            <Link to={`/orders/${quote.orderId?._id || quote.orderId}`}
              className="btn-outline text-xs px-4 py-2 flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0">
              Track Order
            </Link>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-gray-800">Quoted Items</h2>
            {quote.items?.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.06 }}
                className="card-luxury p-4 flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-luxury-cream overflow-hidden flex-shrink-0">
                  {item.image
                    ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-luxury-beige" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800">{item.productName}</p>
                  {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                  <SelectionBadges selections={item.selections} />
                  <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                  {item.originalPrice && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Original: ₹{item.originalPrice.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                {item.unitPrice != null ? (
                  <div className="text-right flex-shrink-0">
                    <p className="price-tag text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatPrice(item.unitPrice)} each</p>
                  </div>
                ) : item.originalPrice ? (
                  <p className="price-tag text-sm flex-shrink-0">
                    {formatPrice(item.originalPrice * item.quantity)}
                  </p>
                ) : null}
              </motion.div>
            ))}

            {/* Admin response */}
            {quote.adminResponse && (
              <div className="card-luxury p-4 bg-amber-50 border-amber-100">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Message from VK Jewellers</p>
                <p className="text-sm text-gray-700 italic">"{quote.adminResponse}"</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Pricing Summary */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-luxury p-5"
            >
              <h3 className="font-heading font-semibold text-gray-800 mb-4">Quote Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{quote.items?.reduce((s, i) => s + i.quantity, 0) || 0}</span>
                </div>
                {quote.subtotal != null && (
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(quote.subtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={quote.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {quote.shippingCost === 0 ? 'FREE' : quote.shippingCost != null ? formatPrice(quote.shippingCost) : '—'}
                  </span>
                </div>
                {quote.quotedTotal != null && (
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Quoted Total</span>
                    <span className="price-tag">{formatPrice(quote.quotedTotal)}</span>
                  </div>
                )}
                {quote.quotedTotal == null && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 italic text-center">
                      Pricing will be updated once our team reviews your request.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Delivery Address */}
            {quote.shippingAddress?.fullName && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="card-luxury p-5"
              >
                <h3 className="font-heading font-semibold text-gray-800 mb-3">Delivery Address</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-medium">{quote.shippingAddress.fullName}</span>
                  {quote.shippingAddress.phone && <> &bull; {quote.shippingAddress.phone}</>}<br />
                  {quote.shippingAddress.addressLine1}
                  {quote.shippingAddress.addressLine2 && `, ${quote.shippingAddress.addressLine2}`}<br />
                  {quote.shippingAddress.city}, {quote.shippingAddress.state} — {quote.shippingAddress.pincode}
                </p>
              </motion.div>
            )}

            {/* Date */}
            <div className="card-luxury p-5">
              <h3 className="font-heading font-semibold text-gray-800 mb-3">Quote Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted</span>
                  <span>{new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span>{new Date(quote.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
