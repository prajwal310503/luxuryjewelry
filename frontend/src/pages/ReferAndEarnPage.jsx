import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

function maskOrder(orderNumber = '') {
  if (!orderNumber) return '————';
  if (orderNumber.length <= 4) return orderNumber;
  return `${'x'.repeat(Math.min(4, orderNumber.length - 4))}${orderNumber.slice(-4)}`;
}

function statusLabel(status) {
  if (status === 'pending') return 'Waiting (return window)';
  if (status === 'eligible') return 'Ready — adding to wallet';
  if (status === 'credited') return 'Added to wallet';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

export default function ReferAndEarnPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bank, setBank] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    upiId: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    return authAPI.getReferral()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Could not load referral info'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const shareWhatsApp = () => {
    if (!data?.shareLink) return;
    const msg = encodeURIComponent(
      `Join LUXURY JEWELRY with my referral link and shop beautiful jewellery!\n${data.shareLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const submitPayout = async (e) => {
    e.preventDefault();
    if (!data?.canRequestPayout) return;
    setSubmitting(true);
    try {
      await authAPI.requestReferralPayout(bank);
      toast.success('Payout request submitted');
      setBank({ accountHolder: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });
      await load();
    } catch (err) {
      toast.error(err?.message || 'Payout request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Refer & Earn | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-8 max-w-3xl">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/account" className="hover:text-primary">Account</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Refer & Earn</span>
        </nav>

        <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
        <p className="text-sm text-gray-500 mb-8">
          Share your code or link. When your friend signs up and places an order, you earn a reward
          (amount set by admin based on product/category — typically ₹{data?.defaultRewardAmount || 500}+).
        </p>

        {loading && !data ? (
          <div className="space-y-4">
            <div className="h-28 shimmer-loading rounded-2xl" />
            <div className="h-40 shimmer-loading rounded-2xl" />
          </div>
        ) : !data ? (
          <p className="text-gray-400 text-center py-16">Unable to load referral details.</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Your referral code</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1 font-heading text-2xl font-bold tracking-widest text-primary bg-[#fdf8f5] rounded-xl px-4 py-3 text-center sm:text-left">
                  {data.referralCode}
                </div>
                <button type="button" onClick={() => copy(data.referralCode, 'Code')} className="btn-outline text-sm px-4 py-2.5 justify-center">
                  Copy code
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-6 mb-3">Signup link</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input readOnly value={data.shareLink} className="input-luxury flex-1 text-sm text-gray-600" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => copy(data.shareLink, 'Link')} className="btn-outline text-sm px-4 py-2.5 flex-1 sm:flex-none justify-center">
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={shareWhatsApp}
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white flex-1 sm:flex-none transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: '#25D366' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Friends joined', value: data.referredCount },
                { label: 'Pending (return window)', value: `₹${data.pendingTotal || 0}` },
                { label: 'Wallet balance', value: `₹${data.referralBalance || 0}` },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
              <strong>Note:</strong> Minimum ₹{data.minBankTransfer || 1000} required for bank transfer
              after the return policy ({data.returnPolicyDays || 7} days) is over.
            </div>

            {/* Bank transfer */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900 mb-1">Request bank transfer</h2>
              <p className="text-xs text-gray-400 mb-4">
                Available when wallet balance is at least ₹{data.minBankTransfer || 1000}.
              </p>

              {!data.canRequestPayout ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                  Current balance ₹{data.referralBalance || 0}. Need ₹{data.minBankTransfer || 1000} to request transfer.
                </p>
              ) : (
                <form onSubmit={submitPayout} className="space-y-3">
                  <input
                    className="input-luxury w-full text-sm"
                    placeholder="Account holder name"
                    value={bank.accountHolder}
                    onChange={(e) => setBank((b) => ({ ...b, accountHolder: e.target.value }))}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      className="input-luxury w-full text-sm"
                      placeholder="Account number"
                      value={bank.accountNumber}
                      onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value.replace(/\D/g, '') }))}
                      required
                    />
                    <input
                      className="input-luxury w-full text-sm uppercase"
                      placeholder="IFSC code"
                      value={bank.ifsc}
                      onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      className="input-luxury w-full text-sm"
                      placeholder="Bank name (optional)"
                      value={bank.bankName}
                      onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                    />
                    <input
                      className="input-luxury w-full text-sm"
                      placeholder="UPI ID (optional)"
                      value={bank.upiId}
                      onChange={(e) => setBank((b) => ({ ...b, upiId: e.target.value }))}
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary text-sm px-5 py-2.5">
                    {submitting ? 'Submitting…' : `Request ₹${data.referralBalance} transfer`}
                  </button>
                </form>
              )}

              {!!data.payouts?.length && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payout history</p>
                  <ul className="space-y-2">
                    {data.payouts.map((p) => (
                      <li key={p._id} className="flex justify-between text-sm">
                        <span className="text-gray-700">₹{p.amount}</span>
                        <span className="text-gray-400 capitalize">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-heading font-bold text-gray-900">Your referral rewards</h2>
                <p className="text-xs text-gray-400 mt-0.5">Orders placed by people you referred</p>
              </div>
              {!data.rewards?.length ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">
                  No referral orders yet. Share your link to start earning.
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {data.rewards.map((r) => (
                    <li key={r._id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          Order {maskOrder(r.orderNumber)} — you will get ₹{r.amount}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {statusLabel(r.status)}
                          {r.status === 'pending' && r.eligibleAt
                            ? ` · eligible after ${new Date(r.eligibleAt).toLocaleDateString('en-IN')}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          r.status === 'eligible' || r.status === 'credited'
                            ? 'bg-green-50 text-green-700'
                            : r.status === 'cancelled'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-[#faf7f4] px-5 py-6">
              <h3 className="font-heading font-bold text-gray-900 mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                <li>Share your code or signup link with friends.</li>
                <li>They register using your link/code.</li>
                <li>When their order is delivered, your reward is created (amount by product/category).</li>
                <li>After return policy ends, reward is added to your wallet.</li>
                <li>Request bank transfer when wallet reaches ₹{data.minBankTransfer || 1000}+.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
