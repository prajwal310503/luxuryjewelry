import { useState, useEffect } from 'react';
import axios from 'axios';
import VendorLayout from '../components/VendorLayout';
import { IconWarning } from '../../components/ui/Icons';

const API = import.meta.env.VITE_API_URL || '/api';

export default function VendorAnalytics() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const map = {
      sales: `${API}/reports/vendor/sales`,
      products: `${API}/reports/vendor/products`,
      customers: `${API}/reports/vendor/customers`,
    };
    axios.get(map[tab], { withCredentials: true })
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [tab]);

  const fmt = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

  return (
    <VendorLayout>
      <div className="p-6 space-y-5">
        <h1 className="text-xl font-bold">Shop Reports</h1>
        <div className="flex gap-2">
          {['sales', 'products', 'customers'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-gray-900 text-white' : 'bg-white border'}`}>{t}</button>
          ))}
        </div>
        {loading ? <div className="h-40 shimmer-img rounded-xl" /> : (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            {tab === 'sales' && (
              <div>
                <p className="text-2xl font-bold">{fmt(data?.summary?.revenue)}</p>
                <p className="text-sm text-gray-500">Revenue · {data?.summary?.orders || 0} orders · Payout {fmt(data?.summary?.payout)}</p>
              </div>
            )}
            {tab === 'products' && (
              <div className="space-y-2">
                {(data?.products || []).map((p) => (
                  <div key={p._id} className="flex justify-between text-sm py-2 border-b"><span>{p.title}</span><span>{p.totalSold} sold · Stock {p.stock}</span></div>
                ))}
                {data?.lowStock?.length > 0 && (
                  <p className="text-amber-600 text-sm mt-4 flex items-center gap-1.5">
                    <IconWarning className="w-4 h-4 flex-shrink-0" />
                    {data.lowStock.length} low-stock items
                  </p>
                )}
              </div>
            )}
            {tab === 'customers' && (
              <div className="space-y-2">
                {(data?.customers || []).map((c, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b"><span>{c.name}</span><span>{fmt(c.spent)}</span></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
