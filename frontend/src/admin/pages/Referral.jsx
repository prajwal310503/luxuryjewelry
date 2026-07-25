import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, categoryAPI } from '../../services/api';

export default function AdminReferral() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    defaultRewardAmount: 500,
    minBankTransfer: 1000,
    returnPolicyDays: 7,
    categoryRewards: [],
  });
  const [rewards, setRewards] = useState([]);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    Promise.all([
      adminAPI.getReferralSettings(),
      categoryAPI.getAll({ limit: 100 }),
      adminAPI.getReferralRewards({ limit: 20 }),
      adminAPI.getReferralPayouts({}),
    ])
      .then(([settingsRes, catsRes, rewardsRes, payoutsRes]) => {
        const s = settingsRes.data.data || {};
        setForm({
          defaultRewardAmount: s.defaultRewardAmount ?? 500,
          minBankTransfer: s.minBankTransfer ?? 1000,
          returnPolicyDays: s.returnPolicyDays ?? 7,
          categoryRewards: s.categoryRewards || [],
        });
        setCategories(catsRes.data.data || []);
        const rewardPayload = rewardsRes.data.data;
        setRewards(Array.isArray(rewardPayload) ? rewardPayload : (rewardPayload?.rewards || []));
        setPayouts(payoutsRes.data.data?.payouts || []);
      })
      .catch(() => toast.error('Failed to load referral settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addCategoryRow = () => {
    setForm((f) => ({
      ...f,
      categoryRewards: [...f.categoryRewards, { categoryId: '', amount: 500 }],
    }));
  };

  const updateCategoryRow = (idx, patch) => {
    setForm((f) => ({
      ...f,
      categoryRewards: f.categoryRewards.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const removeCategoryRow = (idx) => {
    setForm((f) => ({
      ...f,
      categoryRewards: f.categoryRewards.filter((_, i) => i !== idx),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminAPI.updateReferralSettings(form);
      toast.success('Referral settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const processPayout = async (id, status) => {
    try {
      await adminAPI.updateReferralPayout(id, { status });
      toast.success(`Payout marked ${status}`);
      setPayouts((list) => list.map((p) => (p._id === id ? { ...p, status } : p)));
    } catch (err) {
      toast.error(err?.message || 'Failed to update payout');
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-400">Loading referral settings…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">Refer & Earn</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Set reward amounts by default or category. Rewards create when a referred customer&apos;s order is delivered.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Default reward (₹)</label>
            <input
              type="number"
              min={0}
              className="input-luxury w-full"
              value={form.defaultRewardAmount}
              onChange={(e) => set('defaultRewardAmount', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Min bank transfer (₹)</label>
            <input
              type="number"
              min={0}
              className="input-luxury w-full"
              value={form.minBankTransfer}
              onChange={(e) => set('minBankTransfer', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Return policy (days)</label>
            <input
              type="number"
              min={0}
              className="input-luxury w-full"
              value={form.returnPolicyDays}
              onChange={(e) => set('returnPolicyDays', Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Category rewards</p>
              <p className="text-xs text-gray-400">Overrides default when order has that category</p>
            </div>
            <button type="button" onClick={addCategoryRow} className="btn-outline text-xs px-3 py-1.5">
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {form.categoryRewards.length === 0 && (
              <p className="text-xs text-gray-400 py-2">No category overrides — default amount is used.</p>
            )}
            {form.categoryRewards.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  className="input-luxury flex-1 text-sm"
                  value={row.categoryId}
                  onChange={(e) => updateCategoryRow(idx, { categoryId: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  className="input-luxury w-28 text-sm"
                  value={row.amount}
                  onChange={(e) => updateCategoryRow(idx, { amount: Number(e.target.value) })}
                  placeholder="₹"
                />
                <button type="button" onClick={() => removeCategoryRow(idx)} className="text-red-500 text-sm px-2">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-900">
          Note shown to users: Minimum ₹{form.minBankTransfer} for bank transfer after return policy ({form.returnPolicyDays} days) is over.
        </div>

        <button type="button" onClick={save} disabled={saving} className="btn-primary text-sm px-5 py-2.5">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-gray-900">Bank transfer requests</h2>
        </div>
        {!payouts.length ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No payout requests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{p.amount}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{p.bankDetails?.accountHolder}</p>
                      <p>{p.bankDetails?.accountNumber} · {p.bankDetails?.ifsc}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{p.status}</td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => processPayout(p._id, 'paid')} className="text-xs text-green-700 font-semibold">
                            Paid
                          </button>
                          <button type="button" onClick={() => processPayout(p._id, 'rejected')} className="text-xs text-red-600 font-semibold">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-gray-900">Recent referral rewards</h2>
        </div>
        {!rewards.length ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No rewards yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rewards.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 font-medium">{r.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{r.referrer?.name || '—'}</td>
                    <td className="px-4 py-3">₹{r.amount}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
