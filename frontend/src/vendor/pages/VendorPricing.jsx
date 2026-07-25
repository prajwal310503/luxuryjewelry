import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import VendorLayout from '../components/VendorLayout';
import { vendorAPI } from '../../services/api';

const DEFAULT_CATEGORIES = [
  'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Chains', 'Pendants', 'Anklets',
];

export default function VendorPricing() {
  const [charges, setCharges] = useState(
    DEFAULT_CATEGORIES.map((c) => ({ category: c, type: 'flat', value: '' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    vendorAPI.getStore()
      .then(({ data }) => {
        const store = data.data?.store || data.data;
        const saved = store?.makingCharges || [];
        if (saved.length > 0) {
          setCharges(
            DEFAULT_CATEGORIES.map((cat) => {
              const found = saved.find((s) => s.category === cat);
              return found
                ? { category: cat, type: found.type, value: String(found.value) }
                : { category: cat, type: 'flat', value: '' };
            })
          );
        }
      })
      .catch(() => toast.error('Failed to load making charges'))
      .finally(() => setLoading(false));
  }, []);

  const setField = (i, field, val) => {
    setCharges((c) => c.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = charges
        .filter((c) => c.value !== '' && !Number.isNaN(Number(c.value)))
        .map((c) => ({ category: c.category, type: c.type, value: Number(c.value) }));
      await vendorAPI.updateStore({ makingCharges: payload });
      toast.success('Making charges saved!');
    } catch {
      toast.error('Failed to save charges');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Making Charges</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set your making charges per jewellery category. These are added to the metal cost to form the final selling price.
          </p>
        </div>

        <div className="p-4 rounded-xl text-sm font-mono" style={{ background: '#1a0e08', color: '#C9A84C' }}>
          Selling Price = Metal Cost + <span className="underline underline-offset-2">Making Charges</span> + Stone Cost + GST
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="shimmer-text h-14 rounded-xl" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span className="col-span-4">Category</span>
                  <span className="col-span-4">Charge Type</span>
                  <span className="col-span-4">Amount</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {charges.map((row, i) => (
                    <div key={row.category} className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="col-span-4">
                        <p className="text-sm font-semibold text-gray-800">{row.category}</p>
                      </div>
                      <div className="col-span-4">
                        <select
                          value={row.type}
                          onChange={(e) => setField(i, 'type', e.target.value)}
                          className="input-luxury text-sm w-full py-2"
                        >
                          <option value="flat">Flat (₹)</option>
                          <option value="percent">Per gram (%)</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                            {row.type === 'flat' ? '₹' : '%'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={row.value}
                            onChange={(e) => setField(i, 'value', e.target.value)}
                            className="input-luxury pl-7 w-full text-right font-bold text-sm py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <p className="text-xs font-bold text-amber-700 mb-1">Flat Charge</p>
            <p className="text-xs text-amber-600">A fixed ₹ amount added to every item in this category, regardless of weight.</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(90,138,191,0.08)', border: '1px solid rgba(90,138,191,0.2)' }}>
            <p className="text-xs font-bold text-blue-700 mb-1">Per Gram (%)</p>
            <p className="text-xs text-blue-600">A % of the metal price added as making charge. Scales with metal weight.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving || loading}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1a0e08,#3a2520)', boxShadow: '0 4px 16px rgba(26,14,8,0.3)' }}>
            {saving ? 'Saving…' : 'Save Making Charges'}
          </button>
        </div>
      </div>
    </VendorLayout>
  );
}
