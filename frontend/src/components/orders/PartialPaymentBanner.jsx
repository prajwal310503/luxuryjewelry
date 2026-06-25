import toast from 'react-hot-toast';
import { orderAPI } from '../../services/api';

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

export default function PartialPaymentBanner({ order, onPaid, compact = false }) {
  const due = order.remainingAmount ?? order.payment?.remainingAmount ?? 0;
  const isPartial = order.payment?.status === 'partial' && due > 0;
  if (!isPartial) return null;

  const handlePay = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      await orderAPI.payRemaining(order._id);
      toast.success('Payment complete! Your order will be dispatched soon.');
      onPaid?.();
    } catch (err) {
      toast.error(err?.message || 'Payment failed');
    }
  };

  if (compact) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          50% due — {formatPrice(due)}
        </span>
        <button
          type="button"
          onClick={handlePay}
          className="text-[10px] font-bold text-white bg-primary hover:bg-primary/90 px-2.5 py-1 rounded-full transition-colors"
        >
          Pay 50%
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">50% Payment Pending</p>
          <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
            You paid 50% at checkout. Pay remaining <strong>{formatPrice(due)}</strong> to dispatch your order.
            Reminder sent on email, WhatsApp &amp; SMS.
          </p>
          <button
            type="button"
            onClick={handlePay}
            className="mt-3 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Remaining 50% — {formatPrice(due)}
          </button>
        </div>
      </div>
    </div>
  );
}
