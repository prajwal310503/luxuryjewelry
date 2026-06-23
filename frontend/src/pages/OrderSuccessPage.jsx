import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';

const ORDER_STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Order Placed',
    desc: 'We have received your order successfully.',
    active: true,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    label: 'Order Confirmed',
    desc: 'Our team is reviewing and confirming your order.',
    active: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    label: 'Being Crafted',
    desc: 'Your jewellery is being carefully crafted by our artisans.',
    active: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    label: 'Quality Check',
    desc: 'Every piece is inspected for quality and purity.',
    active: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    label: 'Shipped',
    desc: 'Your order is on its way to you.',
    active: false,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Delivered',
    desc: 'Your order has been delivered. Enjoy!',
    active: false,
  },
];

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(null);
  const siblingOrders = state?.orders?.filter((o) => o._id !== id) || [];
  const totalOrders = (state?.orders?.length || 0) || (order ? 1 : 0);

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => setOrder(data.data)).catch(() => { });
  }, [id]);

  return (
    <>
      <Helmet><title>Order Placed | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-16 text-center">

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">Order Placed!</h1>
          {order && (
            <p className="text-gray-500 mb-2 text-lg">Order #{order.orderNumber}</p>
          )}
          {totalOrders > 1 && (
            <div className="max-w-lg mx-auto mb-6 bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                Your checkout was split into {totalOrders} orders from different shops
              </p>
              <ul className="space-y-1.5 text-sm text-amber-700">
                {order && (
                  <li>• #{order.orderNumber} — {order.storeName || 'Shop'} (primary)</li>
                )}
                {siblingOrders.map((o) => (
                  <li key={o._id}>
                    • #{o.orderNumber || o._id?.slice(-8).toUpperCase()} — {o.storeName || 'Shop'}{' '}
                    <Link to={`/orders/${o._id}`} className="underline font-medium">View</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-10 leading-relaxed">
            Thank you for your order. Here is a summary of your order journey — we will keep you updated at every step.
          </p>
        </motion.div>

        {/* Order Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div style={{ position: 'relative' }}>
            {/* Vertical connector line */}
            <div style={{
              position: 'absolute',
              left: '27px',
              top: '28px',
              bottom: '28px',
              width: '2px',
              background: 'linear-gradient(to bottom, #d4af37, #e8d5a0)',
              zIndex: 0,
            }} />

            {ORDER_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '18px',
                  marginBottom: i < ORDER_STEPS.length - 1 ? '20px' : '0',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'left',
                }}
              >
                {/* Step Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: step.active
                    ? 'linear-gradient(135deg, #b8960c, #d4af37)'
                    : '#f3f4f6',
                  color: step.active ? '#fff' : '#9ca3af',
                  boxShadow: step.active ? '0 4px 14px rgba(212,175,55,0.4)' : 'none',
                  border: step.active ? 'none' : '2px solid #e5e7eb',
                  transition: 'all 0.3s',
                }}>
                  {step.icon}
                </div>

                {/* Step Text */}
                <div style={{ paddingTop: '10px' }}>
                  <p style={{
                    fontWeight: '700',
                    fontSize: '15px',
                    color: step.active ? '#1f2937' : '#9ca3af',
                    marginBottom: '2px',
                    fontFamily: 'inherit',
                  }}>
                    {step.label}
                    {step.active && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        background: 'linear-gradient(135deg, #b8960c, #d4af37)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: '600',
                        letterSpacing: '0.04em',
                      }}>
                        Current
                      </span>
                    )}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: step.active ? '#6b7280' : '#d1d5db',
                  }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="flex gap-4 justify-center"
        >
          <Link to="/orders" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Track Order
          </Link>
          <Link to="/collections" className="btn-outline">Continue Shopping</Link>
        </motion.div>
      </div>
    </>
  );
}
