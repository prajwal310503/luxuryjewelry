import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderAPI } from '../services/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => setOrder(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container-luxury py-10"><div className="h-64 shimmer-loading rounded-xl" /></div>;
  if (!order) return <div className="container-luxury py-10 text-center text-gray-500">Order not found</div>;

  return (
    <>
      <Helmet><title>Order #{order.orderNumber} | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/orders" className="text-primary hover:underline text-sm">← My Orders</Link>
          <h1 className="font-heading text-2xl font-bold">Order #{order.orderNumber}</h1>
          <span className={`badge badge-primary`}>{order.status}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="card-luxury p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-luxury-cream overflow-hidden">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  <p className="price-tag text-sm mt-1">₹{item.subtotal?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="card-luxury p-5">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span className="price-tag">₹{order.total?.toLocaleString('en-IN')}</span></div>
              </div>
              {order.shippingAddress && (
                <div className="mt-5 pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                  <p className="text-sm text-gray-600">{order.shippingAddress.fullName}<br/>{order.shippingAddress.addressLine1}<br/>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
