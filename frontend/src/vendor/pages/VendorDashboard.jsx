import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import VendorLayout from '../components/VendorLayout';
import { IconPlus, IconCurrency, IconBox, EmptyStateIcon, StarRating } from '../../components/ui/Icons';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, sub, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden"
    style={{ border: '1px solid rgba(0,0,0,0.06)' }}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: accent }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}16`, color: accent }}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const STATUS_COLORS = {
  pending:    { bg: 'rgba(251,191,36,0.12)', text: '#d97706', dot: '#f59e0b' },
  processing: { bg: 'rgba(59,130,246,0.1)',  text: '#2563eb', dot: '#3b82f6' },
  shipped:    { bg: 'rgba(168,85,247,0.1)',  text: '#7c3aed', dot: '#8b5cf6' },
  delivered:  { bg: 'rgba(16,185,129,0.1)',  text: '#065f46', dot: '#10b981' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626', dot: '#ef4444' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {status}
    </span>
  );
};

export default function VendorDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/vendor/dashboard`, { withCredentials: true })
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <VendorLayout>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer-img" />
          ))}
        </div>
      </VendorLayout>
    );
  }

  const { stats = {}, store = {}, recentOrders = [], lowStockProducts = [], topProducts = [], recentReviews = [] } = data || {};

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 space-y-6">

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-6 py-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #3a2520 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 translate-x-12 -translate-y-12"
            style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Welcome back</p>
              <h1 className="text-xl font-bold text-white">{store.name || 'Your Shop'}</h1>
              <p className="text-white/60 text-sm mt-1">
                {store.status === 'approved' ? 'Your store is live on the marketplace' : 'Store pending approval'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/vendor/products/add" className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-900 rounded-full"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E2C97E)' }}>
                + Add Product
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard index={0} label="Total Products" value={stats.totalProducts || 0}
            accent="#C9A84C" sub="Listed in your store"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
          />
          <StatCard index={1} label="Total Orders" value={stats.totalOrders || 0}
            accent="#B76E79" sub="All time"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          />
          <StatCard index={2} label="Pending Orders" value={stats.pendingOrders || 0}
            accent="#f59e0b" sub="Need your attention"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard index={3} label="Total Revenue" value={fmt(stats.totalRevenue)}
            accent="#10b981" sub="From paid orders"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
          />
        </div>

        {/* Recent Orders + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-[15px]">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No orders yet</p>
                <p className="text-gray-300 text-xs mt-1">Orders will appear here once customers buy</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.user?.name || 'Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm p-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-[15px] mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { to: '/vendor/products/add', label: 'Add New Product', Icon: IconPlus, accent: '#C9A84C' },
                { to: '/vendor/pricing',  label: 'Update Making Charges', Icon: IconCurrency, accent: '#5a413f' },
                { to: '/vendor/orders',   label: 'Process Pending Orders', Icon: IconBox, accent: '#f59e0b' },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.accent}16`, color: a.accent }}>
                    <a.Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{a.label}</span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Store status */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Store Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${store.status === 'approved' ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
                <span className="text-sm font-semibold capitalize"
                  style={{ color: store.status === 'approved' ? '#065f46' : '#d97706' }}>
                  {store.status || 'Pending'}
                </span>
              </div>
              {store.status !== 'approved' && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Your store is under review. Approval within 24–48 hours.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Low stock, top products, reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-[15px] mb-4">Low Stock Alert</h2>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-400">All products well stocked</p>
            ) : (
              <ul className="space-y-2">
                {lowStockProducts.map((p) => (
                  <li key={p._id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2">{p.title}</span>
                    <span className="text-amber-600 font-semibold shrink-0">{p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-[15px] mb-4">Top Products</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No sales data yet</p>
            ) : (
              <ul className="space-y-2">
                {topProducts.map((p) => (
                  <li key={p._id} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2">{p.title}</span>
                    <span className="text-gray-500 shrink-0">{p.totalSold || 0} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-[15px] mb-4">Recent Reviews</h2>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet</p>
            ) : (
              <ul className="space-y-3">
                {recentReviews.map((r) => (
                  <li key={r._id} className="text-sm border-b border-gray-50 pb-2 last:border-0">
                    <div className="mb-0.5">
                      <StarRating rating={r.rating || 5} />
                    </div>
                    <p className="text-gray-600 line-clamp-2">{r.comment || r.text}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{r.user?.name || 'Customer'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </VendorLayout>
  );
}
