import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderAPI } from '../services/api';

const STATUS_COLORS = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-primary/10 text-primary',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-yellow-100 text-yellow-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  returned:   'bg-red-100 text-red-600',
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    orderAPI.getById(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container-luxury py-10">
      <div className="h-64 shimmer-loading rounded-xl" />
    </div>
  );
  if (!order) return (
    <div className="container-luxury py-10 text-center text-gray-500">Order not found</div>
  );

  const isCancelled = ['cancelled', 'returned'].includes(order.status);
  const activeStep  = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <>
      <Helmet><title>Order #{order.orderNumber} | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">

        {/* Breadcrumb + title */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link to="/orders" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Orders
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <span className={`badge text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </div>

        {/* Status tracker */}
        {!isCancelled && (
          <div className="card-luxury p-5 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Order Status</p>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      i <= activeStep ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i < activeStep ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1.5 capitalize font-medium ${i <= activeStep ? 'text-primary' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-4 rounded transition-colors ${i < activeStep ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-gray-800">Order Items</h2>
            {order.items?.map((item, idx) => (
              <div key={idx} className="card-luxury p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                  {item.image
                    ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-luxury-beige" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.title}</p>
                  {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                  {item.selections && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(item.selections).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-luxury-cream border border-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                          {k === 'size' ? `Size ${v}` : k === 'length' ? `Length ${v}` : k === 'stoneColor' ? `Stone: ${v}` : k === 'paymentMode' ? `Pay: ${v}` : `${k}: ${v}`}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  <p className="price-tag text-sm mt-1">₹{item.subtotal?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="card-luxury p-5">
              <h3 className="font-heading font-semibold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={order.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-3 border-t border-gray-100 text-base">
                  <span>Total</span>
                  <span className="price-tag">₹{order.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {order.shippingAddress?.fullName && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivery Address</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {order.source === 'quote' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    This order was placed from a quote confirmed by VK Jewellers.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
