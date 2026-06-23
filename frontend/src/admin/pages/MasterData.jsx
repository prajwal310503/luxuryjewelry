import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { masterDataAPI } from '../../services/api';

const METALS = [
  { key: 'gold', name: 'Gold', purities: [{ label: '24K (999)', key: 'p999' }, { label: '22K (916)', key: 'p916' }, { label: '18K (750)', key: 'p750' }, { label: '14K (585)', key: 'p585' }] },
  { key: 'silver', name: 'Silver', purities: [{ label: '999', key: 'p999' }, { label: '925', key: 'p925' }, { label: '800', key: 'p800' }] },
  { key: 'roseGold', name: 'Rose Gold', purities: [{ label: '18K', key: 'p750' }, { label: '14K', key: 'p585' }] },
  { key: 'platinum', name: 'Platinum', purities: [{ label: '950', key: 'p950' }, { label: '900', key: 'p900' }] },
];

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('metals');
  const [metalRates, setMetalRates] = useState({});
  const [gst, setGst] = useState('3');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);

  useEffect(() => {
    masterDataAPI.get().then(({ data }) => {
      const d = data.data || {};
      setMetalRates(d.metalRates || {});
      setGst(String(d.priceFormula?.gstPct ?? 3));
    }).catch(() => {});
    masterDataAPI.getSyncLogs({ limit: 5 }).then(({ data }) => {
      setSyncLogs(data.data?.logs || []);
      if (data.data?.logs?.[0]) setLastSync(new Date(data.data.logs[0].createdAt));
    }).catch(() => {});
  }, []);

  const setRate = (metalKey, purityKey, val) => {
    setMetalRates((r) => ({ ...r, [metalKey]: { ...(r[metalKey] || {}), [purityKey]: val } }));
  };

  const handleSaveMetal = async () => {
    setSaving(true);
    try {
      await masterDataAPI.update({ metalRates, priceFormula: { gstPct: parseFloat(gst) || 3 } });
      toast.success('Metal rates saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await masterDataAPI.sync();
      setLastSync(new Date());
      toast.success(`Synced ${data.data?.updated || 0} products`);
      const logs = await masterDataAPI.getSyncLogs({ limit: 5 });
      setSyncLogs(logs.data.data?.logs || []);
    } catch { toast.error('Sync failed'); }
    finally { setSyncing(false); }
  };

  const tabs = [
    { key: 'metals', label: 'Metal Rates' },
    { key: 'formula', label: 'Price Formula' },
    { key: 'logs', label: 'Sync Log' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Master Data & Price Sync</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update rates and sync all vendor product prices.</p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #a07828)' }}>
          {syncing ? 'Syncing...' : 'Sync All Prices'}
        </button>
      </div>

      {lastSync && (
        <p className="text-xs text-green-700">Last synced: {lastSync.toLocaleString('en-IN')}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === t.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'metals' && (
        <div className="grid md:grid-cols-2 gap-5">
          {METALS.map((metal) => (
            <div key={metal.key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">{metal.name}</h3>
              <div className="space-y-3">
                {metal.purities.map((p) => (
                  <div key={p.key} className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-24">{p.label}</label>
                    <input type="number" className="input-luxury flex-1" placeholder="₹/gram"
                      value={metalRates[metal.key]?.[p.key] ?? ''}
                      onChange={(e) => setRate(metal.key, p.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="md:col-span-2">
            <button onClick={handleSaveMetal} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Rates'}</button>
          </div>
        </div>
      )}

      {activeTab === 'formula' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-xl">
          <p className="text-sm text-gray-600 mb-4 font-mono bg-gray-50 p-4 rounded-xl">
            Selling Price = (Metal Weight × Rate × Purity%) + Making Charges + Stone Cost + GST
          </p>
          <label className="text-sm font-medium text-gray-700">GST %</label>
          <input type="number" className="input-luxury w-32 mt-1" value={gst} onChange={(e) => setGst(e.target.value)} />
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              {['Date', 'Products Updated', 'Stores', 'Duration'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {syncLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No sync history yet</td></tr>
              ) : syncLogs.map((log) => (
                <tr key={log._id} className="border-t border-gray-50">
                  <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{log.productsUpdated}</td>
                  <td className="px-4 py-3">{log.storesAffected}</td>
                  <td className="px-4 py-3">{log.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
