import { useState, useEffect } from 'react';
import { reportAPI } from '../../services/api';

const formatPrice = (p) => `₹${Math.round(p || 0).toLocaleString('en-IN')}`;

export default function AdminReports() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const loaders = {
      sales: () => reportAPI.sales(),
      orders: () => reportAPI.orders(),
      products: () => reportAPI.products(),
      customers: () => reportAPI.customers(),
      vendors: () => reportAPI.vendors(),
    };
    loaders[tab]?.().then(({ data: res }) => setData(res.data)).finally(() => setLoading(false));
  }, [tab]);

  const tabs = [
    { key: 'sales', label: 'Sales' },
    { key: 'orders', label: 'Orders' },
    { key: 'products', label: 'Products' },
    { key: 'customers', label: 'Customers' },
    { key: 'vendors', label: 'Vendors' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Platform Reports</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t.key ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="h-48 shimmer-loading rounded-xl" /> : (
        <div className="card-luxury p-6">
          {tab === 'sales' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Total Revenue" value={formatPrice(data.summary?.totalRevenue)} />
                <Stat label="Commission" value={formatPrice(data.summary?.totalCommission)} />
                <Stat label="Orders" value={data.summary?.orderCount || 0} />
              </div>
              <h3 className="font-semibold mt-6">By Vendor</h3>
              {(data.byVendor || []).slice(0, 10).map((v, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span>{v.storeName || 'Platform'}</span>
                  <span>{formatPrice(v.revenue)} ({v.orders} orders)</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'orders' && data && (
            <div className="space-y-2">
              {(data.byStatus || []).map((s) => (
                <div key={s._id} className="flex justify-between text-sm py-2 border-b border-gray-50 capitalize">
                  <span>{s._id}</span><span>{s.count} orders — {formatPrice(s.total)}</span>
                </div>
              ))}
              <p className="text-sm text-amber-600 mt-4">Pending cancellations: {data.pendingCancellations} | Returns: {data.pendingReturns}</p>
            </div>
          )}
          {tab === 'products' && data && (
            <div className="space-y-2">
              {(data.topProducts || []).map((p) => (
                <div key={p._id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span>{p.title}</span><span>{p.totalSold} sold</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'customers' && data && (
            <div className="space-y-4">
              <p className="text-sm">New customers (30 days): <strong>{data.newCustomersLast30Days}</strong></p>
              {(data.topBuyers || []).map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span>{c.name}</span><span>{formatPrice(c.totalSpent)}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'vendors' && data && (
            <div className="space-y-2">
              {(data.vendors || []).map((v) => (
                <div key={v._id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span>{v.name} {v.city && `(${v.city})`}</span><span>{formatPrice(v.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
