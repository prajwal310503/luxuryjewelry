import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { vendorAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const formatPrice = (p) => `₹${Math.round(p || 0).toLocaleString('en-IN')}`;

const StatCard = ({ title, value, icon, sub, color = 'primary' }) => (
  <motion.div whileHover={{ y: -2 }} className="card-luxury p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
        <p className="font-heading text-3xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
    </div>
  </motion.div>
);

const STATUS_COLORS = {
  pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
  shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444',
};

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    vendorAPI.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 shimmer-loading rounded-xl" />
          ))}
        </div>
        <div className="h-72 shimmer-loading rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenueChart = data?.revenueChart || [];
  const recentOrders = data?.recentOrders || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const vendor = data?.vendor || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{vendor.storeName} · Commission: {vendor.commissionRate}%</p>
        </div>
        <Link to="/vendor/products/add" className="btn-primary">
          + Add Product
        </Link>
      </div>

      {/* Pending approval alert */}
      {vendor.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Account Pending Approval</p>
            <p className="text-xs text-amber-600">Your vendor account is under review by admin. You can add products but they won't be visible until approved.</p>
          </div>
        </div>
      )}

      {/* Pending products alert */}
      {stats.pendingProducts > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">{stats.pendingProducts} product(s) awaiting admin approval</p>
            <p className="text-xs text-blue-600">Products submitted for review will be visible once approved.</p>
          </div>
          <Link to="/vendor/products?status=pending" className="text-xs text-blue-600 font-medium hover:underline">
            View →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Earnings" value={formatPrice(stats.totalRevenue)} sub="All time" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Monthly Earnings" value={formatPrice(stats.monthlyRevenue)} sub={`${stats.monthlyOrders || 0} orders`} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Total Orders" value={stats.totalOrders || 0} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>} />
        <StatCard title="This Week" value={stats.weeklyOrders || 0} sub="orders" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Total Products" value={stats.totalProducts || 0} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13L22 9z" /></svg>} />
        <StatCard title="Live Products" value={stats.approvedProducts || 0} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Pending Review" value={stats.pendingProducts || 0} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Out of Stock" value={stats.outOfStock || 0} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      {/* Charts + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-luxury p-6">
          <h3 className="font-heading font-semibold text-gray-800 mb-6">Earnings — Last 30 Days</h3>
          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="vendorRevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Earnings']}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#vendorRevGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              No earnings data yet. Start selling to see your chart!
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-800">Low Stock Alert</h3>
            <Link to="/vendor/products" className="text-xs text-primary hover:underline">View All →</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-300 text-sm">All products well stocked</div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{p.title}</p>
                    <p className="text-2xs text-gray-400">{p.sku}</p>
                  </div>
                  <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-luxury">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="font-heading font-semibold text-gray-800">Recent Orders</h3>
          <Link to="/vendor/orders" className="text-xs text-primary font-medium hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-300 text-sm">
                    No orders yet. Once customers purchase your products, orders will appear here.
                  </td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-primary">#{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{order.customer?.name}</p>
                    <p className="text-xs text-gray-400">{order.customer?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="badge text-xs capitalize"
                      style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
