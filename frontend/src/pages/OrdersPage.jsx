import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orderAPI } from '../services/api';

const STATUS_COLORS = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  processing: 'badge-primary',
  shipped: 'badge badge-gold',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
  returned: 'badge-danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders().then(({ data }) => setOrders(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>My Orders | VK Jewellers</title></Helmet>
      <div className="container-luxury py-10">
        <h1 className="font-heading text-3xl font-bold mb-8">My Orders</h1>
        {loading ? (
          <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-24 shimmer-loading rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>
            <h2 className="font-heading text-xl text-gray-700 mb-3">No orders yet</h2>
            <Link to="/collections" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`} className="card-luxury p-5 flex items-center gap-6 hover:shadow-card-hover transition-shadow block">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="price-tag text-sm">₹{order.total?.toLocaleString('en-IN')}</p>
                  <span className={`badge mt-1 ${STATUS_COLORS[order.status] || 'badge-primary'}`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
