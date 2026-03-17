import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../../services/api';

const formatPrice = (p) => `₹${Math.round(p || 0).toLocaleString('en-IN')}`;
const formatNum = (n) => (n || 0).toLocaleString('en-IN');

const StatCard = ({ title, value, icon, change, color = 'primary', to }) => (
  <motion.div whileHover={{ y: -2 }} className="card-luxury p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</p>
        <p className="font-heading text-3xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={`text-xs font-medium mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% this month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0`}>
        {icon}
      </div>
    </div>
    {to && (
      <Link to={to} className="block mt-4 text-xs text-primary font-medium hover:underline">
        View Details →
      </Link>
    )}
  </motion.div>
);

const STATUS_COLORS = { pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6', shipped: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444' };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(({ data: res }) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 shimmer-loading rounded-xl" />)}
        </div>
        <div className="h-72 shimmer-loading rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenueChart = data?.revenueChart || [];
  const ordersByStatus = data?.ordersByStatus || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back, Admin</p>
        </div>
        <div className="text-xs text-gray-400 bg-white rounded-lg px-3 py-2 border border-gray-100">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Alert for pending approvals */}
      {(stats.pendingProducts > 0 || stats.pendingVendors > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Pending Approvals</p>
            <p className="text-xs text-amber-600">
              {stats.pendingProducts > 0 && `${stats.pendingProducts} products`}
              {stats.pendingProducts > 0 && stats.pendingVendors > 0 && ' and '}
              {stats.pendingVendors > 0 && `${stats.pendingVendors} vendors`} awaiting approval.
            </p>
          </div>
          <div className="flex gap-2">
            {stats.pendingProducts > 0 && <Link to="/admin/products?status=pending" className="btn-primary text-xs py-2 px-3">Review Products</Link>}
            {stats.pendingVendors > 0 && <Link to="/admin/vendors?status=pending" className="btn-outline text-xs py-2 px-3">Review Vendors</Link>}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} to="/admin/orders" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Monthly Revenue" value={formatPrice(stats.monthlyRevenue)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        <StatCard title="Total Orders" value={formatNum(stats.totalOrders)} to="/admin/orders" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>} />
        <StatCard title="Weekly Orders" value={formatNum(stats.weeklyOrders)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Total Customers" value={formatNum(stats.totalUsers)} to="/admin/customers" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard title="Active Vendors" value={formatNum(stats.totalVendors)} to="/admin/vendors" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard title="Total Products" value={formatNum(stats.totalProducts)} to="/admin/products" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 9l10 13L22 9z" /></svg>} />
        <StatCard title="Pending Products" value={formatNum(stats.pendingProducts)} to="/admin/products?status=pending" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-luxury p-6">
          <h3 className="font-heading font-semibold text-gray-800 mb-6">Revenue — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a413f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5a413f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#5a413f" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="card-luxury p-6">
          <h3 className="font-heading font-semibold text-gray-800 mb-6">Orders by Status</h3>
          {ordersByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={65} strokeWidth={2}>
                    {ordersByStatus.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry._id] || '#C9A84C'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {ordersByStatus.map((item) => (
                  <div key={item._id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[item._id] || '#C9A84C' }} />
                    <span className="text-xs text-gray-500 capitalize">{item._id}</span>
                    <span className="text-xs font-semibold text-gray-700 ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-300 text-sm">No order data</div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-luxury">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h3 className="font-heading font-semibold text-gray-800">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-primary font-medium hover:underline">View All →</Link>
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
                <tr><td colSpan={5} className="text-center py-8 text-gray-300 text-sm">No recent orders</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/orders`} className="text-sm font-medium text-primary hover:underline">#{order.orderNumber}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{order.customer?.name}</p>
                      <p className="text-xs text-gray-400">{order.customer?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs capitalize`} style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
