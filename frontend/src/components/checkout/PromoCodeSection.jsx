import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { couponAPI } from '../../services/api';

const VISIBLE_OFFERS = 2;
const OFFER_GAP = 8;

const formatPrice = (p) => `₹${Math.round(p).toLocaleString('en-IN')}`;

function offerLabel(c) {
  if (c.type === 'percentage') return `${c.value}% OFF`;
  if (c.type === 'fixed') return `${formatPrice(c.value)} OFF`;
  return 'Free Shipping';
}

function OfferCard({ coupon, appliedCode, loading, onApply, style }) {
  const isApplied = appliedCode === coupon.code;
  return (
    <button
      type="button"
      disabled={loading || isApplied}
      onClick={() => onApply(coupon.code)}
      style={style}
      className={`text-left px-3 py-2 rounded-xl border-2 transition-all shrink-0 ${
        isApplied
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-primary/50 bg-white'
      }`}
    >
      <p className="text-xs font-mono font-bold text-primary">{coupon.code}</p>
      <p className="text-[11px] font-semibold text-gray-800 mt-0.5 truncate">{coupon.title || offerLabel(coupon)}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
        {coupon.couponKind === 'category' ? 'Category offer' : 'Store-wide'}
        {coupon.minOrderAmount > 0 && ` · Min ${formatPrice(coupon.minOrderAmount)}`}
      </p>
    </button>
  );
}

function AvailableOffersCarousel({ offers, appliedCode, loading, onApply }) {
  const viewportRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(0);
  const shouldScroll = offers.length > VISIBLE_OFFERS;
  const items = shouldScroll ? [...offers, ...offers] : offers;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setCardWidth(Math.floor((el.clientWidth - OFFER_GAP) / VISIBLE_OFFERS));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollDistance = shouldScroll && cardWidth
    ? offers.length * cardWidth + offers.length * OFFER_GAP
    : 0;
  const scrollDuration = `${Math.max(offers.length * 3.5, 8)}s`;

  if (!shouldScroll) {
    return (
      <div ref={viewportRef} className="grid grid-cols-2 gap-2">
        {offers.map((c) => (
          <OfferCard
            key={c._id}
            coupon={c}
            appliedCode={appliedCode}
            loading={loading}
            onApply={onApply}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={viewportRef} className="overflow-hidden w-full">
      {!cardWidth ? (
        <div className="grid grid-cols-2 gap-2">
          {offers.slice(0, VISIBLE_OFFERS).map((c) => (
            <OfferCard
              key={c._id}
              coupon={c}
              appliedCode={appliedCode}
              loading={loading}
              onApply={onApply}
            />
          ))}
        </div>
      ) : (
      <div
        className="offer-marquee-track"
        style={{
          width: items.length * cardWidth + (items.length - 1) * OFFER_GAP,
          '--offer-scroll-distance': `-${scrollDistance}px`,
          '--offer-scroll-duration': scrollDuration,
        }}
      >
        {items.map((c, i) => (
          <OfferCard
            key={`${c._id}-${i}`}
            coupon={c}
            appliedCode={appliedCode}
            loading={loading}
            onApply={onApply}
            style={{ width: cardWidth }}
          />
        ))}
      </div>
      )}
    </div>
  );
}

function buildCartPayload(items) {
  return items.map((item) => {
    const price = item.product.discountedPrice ?? item.product.price ?? 0;
    const qty = item.quantity || 1;
    const categoryId = item.product.category?._id || item.product.category;
    return {
      productId: item.product._id,
      categoryId,
      lineTotal: price * qty,
      quantity: qty,
      price,
    };
  });
}

export default function PromoCodeSection({
  items,
  subtotal,
  onApplied,
  appliedCode = '',
  appliedDiscount = 0,
  appliedIsGift = false,
}) {
  const [offers, setOffers] = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    couponAPI.getAvailable()
      .then(({ data }) => setOffers(data.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoadingOffers(false));
  }, []);

  const applyCode = useCallback(async (code, isGift = false) => {
    const trimmed = String(code || '').trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { data } = await couponAPI.validate({
        code: trimmed,
        subtotal,
        items: buildCartPayload(items),
      });
      const discount = data.data.discount || 0;
      const isGiftCard = data.data.isGiftCard || isGift;
      onApplied?.({
        code: trimmed,
        discount,
        isGiftCard,
        coupon: data.data.coupon,
      });
      toast.success(
        isGiftCard
          ? `Gift card applied! You save ${formatPrice(discount)}${data.data.giftCardBalance ? ` (balance ₹${Math.round(data.data.giftCardBalance).toLocaleString('en-IN')})` : ''}`
          : `Coupon ${trimmed} applied! You save ${formatPrice(discount)}`
      );
      if (isGiftCard) setGiftCode(trimmed);
      else setManualCode(trimmed);
    } catch (err) {
      toast.error(err?.message || 'Invalid code');
      onApplied?.({ code: '', discount: 0, isGiftCard: false, coupon: null });
    } finally {
      setLoading(false);
    }
  }, [items, subtotal, onApplied]);

  const clearApplied = () => {
    onApplied?.({ code: '', discount: 0, isGiftCard: false, coupon: null });
    setManualCode('');
    setGiftCode('');
  };

  return (
    <div className="space-y-4">
      {/* Available coupons from admin */}
      {!loadingOffers && offers.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Offers</p>
          <AvailableOffersCarousel
            offers={offers}
            appliedCode={appliedCode}
            loading={loading}
            onApply={applyCode}
          />
        </div>
      )}

      {/* Manual coupon (6 digit) */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Coupon Code (6 digit)</p>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ABC123"
            className="input-luxury flex-1 h-9 text-sm font-mono tracking-widest"
          />
          <button
            type="button"
            onClick={() => applyCode(manualCode)}
            disabled={loading || manualCode.length !== 6}
            className="px-3 py-1.5 text-xs font-bold border border-primary text-primary rounded-lg hover:bg-primary/5 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Gift card (15 digit) */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gift Card (15 digit)</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={15}
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.replace(/\D/g, '').slice(0, 15))}
            placeholder="123456789012345"
            className="input-luxury flex-1 h-9 text-sm font-mono tracking-wider"
          />
          <button
            type="button"
            onClick={() => applyCode(giftCode, true)}
            disabled={loading || giftCode.length !== 15}
            className="px-3 py-1.5 text-xs font-bold border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
          >
            Apply Gift
          </button>
        </div>
      </div>

      {appliedCode && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-xs text-green-700">
            {appliedIsGift ? 'Gift card' : 'Coupon'} <strong className="font-mono">{appliedCode}</strong> applied (−{formatPrice(appliedDiscount)})
            {appliedIsGift && appliedDiscount > 0 && (
              <span className="block text-[10px] text-green-600 mt-0.5">Redeems from gift card balance</span>
            )}
          </p>
          <button type="button" onClick={clearApplied} className="text-xs text-red-500 hover:underline">Remove</button>
        </div>
      )}
    </div>
  );
}
