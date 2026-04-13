import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { cmsAPI, productAPI, categoryAPI, storeAPI, blogAPI, settingsAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const GoldExchangeIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v4m0 0l-2-2m2 2l2-2M8 20v-4m0 0l-2 2m2-2l2 2M6.5 12a5.5 5.5 0 0011 0 5.5 5.5 0 00-11 0z" />
  </svg>
);
const SavingsIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);
const CleaningIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);
const DiamondTestIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20M6 3l4 6M18 3l-4 6" />
  </svg>
);
const RingIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3}>
    <circle cx="12" cy="12" r="5" />
    <path strokeLinecap="round" d="M12 7s-2-3-2-5a2 2 0 014 0c0 2-2 5-2 5z" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

// ─── YouTube URL helpers ───────────────────────────────────────────────────────
const isYouTubeUrl = (url) => /youtube\.com|youtu\.be/.test(url || '');
const getYouTubeId = (url) => {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : '';
};

// ─── HERO BANNER — pure image/video slide, zero text overlay ─────────────────
const FALLBACK_SLIDES = [
  { bg: 'linear-gradient(135deg, #f5ede4 0%, #ecddd0 50%, #e8d5c4 100%)' },
  { bg: 'linear-gradient(135deg, #f2e4e1 0%, #ecd6d3 50%, #e5cac6 100%)' },
  { bg: 'linear-gradient(135deg, #faf7f2 0%, #f0e8df 50%, #e8ddd3 100%)' },
];

const HeroBanner = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const hasBanners = banners?.length > 0;
  const total = hasBanners ? banners.length : FALLBACK_SLIDES.length;

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % total), 6000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [total]);

  const prev = () => { setCurrent((c) => (c - 1 + total) % total); resetTimer(); };
  const next = () => { setCurrent((c) => (c + 1) % total); resetTimer(); };

  const renderSlide = (b, idx) => {
    if (!hasBanners) {
      return (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: FALLBACK_SLIDES[idx % FALLBACK_SLIDES.length].bg,
            opacity: idx === current ? 1 : 0,
          }}
        />
      );
    }

    const mediaType = b.mediaType || 'image';

    if (mediaType === 'video') {
      if (isYouTubeUrl(b.videoUrl)) {
        const ytId = getYouTubeId(b.videoUrl);
        return idx === current ? (
          <iframe
            key={b._id}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0`}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none', pointerEvents: 'none' }}
            allow="autoplay; loop; encrypted-media"
          />
        ) : null;
      }
      return idx === current ? (
        <video
          key={b._id}
          src={b.videoUrl}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null;
    }

    return (
      <motion.div
        key={b._id || idx}
        animate={{ opacity: idx === current ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
        style={{ pointerEvents: idx === current ? 'auto' : 'none' }}
      >
        {b.image && (b.image.startsWith('http') || b.image.startsWith('/'))
          ? <img src={b.image} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: FALLBACK_SLIDES[0].bg }} />
        }
      </motion.div>
    );
  };

  return (
    <section
      id="main-content"
      className="relative overflow-hidden w-full"
      style={{ height: '88vh', minHeight: 480 }}
    >
      {hasBanners
        ? banners.map((b, i) => renderSlide(b, i))
        : FALLBACK_SLIDES.map((_, i) => renderSlide(null, i))
      }

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white shadow-sm border border-gray-200/60 rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-all duration-200"
        aria-label="Previous"
      >
        <ChevronLeftIcon />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white shadow-sm border border-gray-200/60 rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-all duration-200"
        aria-label="Next"
      >
        <ChevronRightIcon />
      </button>

      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-primary/30 hover:bg-primary/60'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// ─── WHY SHOP WITH US ─────────────────────────────────────────────────────────
const ICON_COLOR = '#c09080';

const TrustIcons = {
  return: (
    <svg className="w-10 h-10 flex-shrink-0" fill="none" viewBox="0 0 40 40" stroke={ICON_COLOR} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 30s1.5-3 6-3h8c1.5 0 3-.8 3-2.3s-1.5-2.3-3-2.3H14"/>
      <path d="M6 30V18a1.5 1.5 0 013 0v6"/>
      <path d="M9 24V10a1.5 1.5 0 013 0v8"/>
      <path d="M12 24V8a1.5 1.5 0 013 0v9"/>
      <path d="M15 24V10a1.5 1.5 0 013 0v3"/>
      <circle cx="29" cy="9" r="6"/>
      <path d="M26 7h6M26 9.5h6M29 9.5l-2.5 5"/>
    </svg>
  ),
  certified: (
    <svg className="w-10 h-10 flex-shrink-0" fill="none" viewBox="0 0 40 40" stroke={ICON_COLOR} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h16l8 8v22a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2z"/>
      <path d="M24 4v8h8"/>
      <path d="M13 16h14M13 20h14M13 24h8"/>
      <path d="M16 31l4-5 4 5-4 4-4-4z"/>
      <path d="M16 31h8M19 26l1.5 2.5 1.5-2.5"/>
    </svg>
  ),
  exchange: (
    <svg className="w-10 h-10 flex-shrink-0" fill="none" viewBox="0 0 40 40" stroke={ICON_COLOR} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 19A13 13 0 0128 8"/>
      <path d="M25 5l3.5 3-3.5 3"/>
      <path d="M33 21A13 13 0 0112 32"/>
      <path d="M15 35l-3.5-3 3.5-3"/>
      <circle cx="20" cy="20" r="4.5"/>
      <path d="M17 17l3 3 3-3" strokeWidth={1.1}/>
    </svg>
  ),
  shipping: (
    <svg className="w-10 h-10 flex-shrink-0" fill="none" viewBox="0 0 40 40" stroke={ICON_COLOR} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="13" width="22" height="17" rx="1.2"/>
      <path d="M2 19h22M10 13v17"/>
      <path d="M24 19h5.5l4.5 6v6H24V19z"/>
      <circle cx="10" cy="32" r="3"/>
      <circle cx="30" cy="32" r="3"/>
    </svg>
  ),
};

const WHY_FALLBACK = [
  { icon: 'return',    label: '15 DAYS EASY RETURN',    sub: 'Keep it only if you love it.' },
  { icon: 'certified', label: 'CERTIFIED JEWELRY',       sub: 'Every detail is fully certified.' },
  { icon: 'exchange',  label: '100% LIFETIME EXCHANGE',  sub: 'Your jewelry always holds value.' },
  { icon: 'shipping',  label: 'FREE & SAFE SHIPPING',    sub: 'From Store to your Doorstep.' },
];

const TrustBar = ({ cmsContent }) => {
  const data = cmsContent?.items?.length
    ? {
        heading:  cmsContent.heading  || 'WHY SHOP WITH US',
        subtitle: cmsContent.subtitle || 'Trusted by 1000+ happy customers',
        items:    cmsContent.items,
      }
    : { heading: 'WHY SHOP WITH US', subtitle: 'Trusted by 1000+ happy customers', items: WHY_FALLBACK };

  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <div className="container-luxury">

        <div className="text-center mb-11">
          <h2
            className="text-[19px] font-semibold text-gray-900 uppercase"
            style={{ letterSpacing: '0.22em' }}
          >
            {data.heading}
          </h2>
          <p className="text-[13.5px] text-gray-500 mt-2.5 tracking-wide">
            {data.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-around gap-8 sm:gap-4 max-w-[1100px] mx-auto">
          {data.items.map((item) => (
            <div key={item.label} className="flex items-start gap-4">
              {TrustIcons[item.icon] ?? TrustIcons.return}
              <div>
                <p
                  className="text-[11px] font-bold text-gray-900 uppercase leading-snug whitespace-nowrap"
                  style={{ letterSpacing: '0.1em' }}
                >
                  {item.label}
                </p>
                <p className="text-[12.5px] text-gray-500 mt-1.5 leading-snug">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

// ─── Per-category Unsplash fallback images ────────────────────────────────────
const CAT_FALLBACK = {
  rings:        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=750&fit=crop&q=80&auto=format',
  earrings:     'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=500&h=750&fit=crop&q=80&auto=format',
  pendants:     'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&h=750&fit=crop&q=80&auto=format',
  necklaces:    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=750&fit=crop&q=80&auto=format',
  bangles:      'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=500&h=750&fit=crop&q=80&auto=format',
  bracelets:    'https://images.unsplash.com/photo-1573408301185-9519f94815e4?w=500&h=750&fit=crop&q=80&auto=format',
  chains:       'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=750&fit=crop&q=80&auto=format',
  nosepins:     'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&h=750&fit=crop&q=80&auto=format',
  mangalsutra:  'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=500&h=750&fit=crop&q=80&auto=format',
  anklets:      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=750&fit=crop&q=80&auto=format',
  kada:         'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&h=750&fit=crop&q=80&auto=format',
  charms:       'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&h=750&fit=crop&q=80&auto=format',
};

// ─── CATEGORY GRID ────────────────────────────────────────────────────────────
const CategoryGrid = ({ categories, cmsContent }) => {
  if (!categories?.length) return null;
  const heading  = cmsContent?.title    || 'SHOP BY JEWELRY CATEGORY';
  const subtitle = cmsContent?.subtitle || 'Jewelry for Every Moment';

  // Duplicate for seamless loop — CSS animation moves -50% so 2 copies = perfect loop
  const items = [...categories, ...categories];

  const CatCard = ({ cat, keyPrefix }) => (
    <Link
      key={keyPrefix}
      to={`/collections/${cat.slug}`}
      className="group flex-shrink-0 block"
      style={{ width: '220px', marginRight: '20px' }}
    >
      <div
        className="relative w-full overflow-hidden transition-all duration-500 ease-in-out group-hover:[border-radius:40px]"
        style={{ aspectRatio: '2 / 3', background: '#f5ede4', borderRadius: '20px' }}
      >
        <img
          src={cat.image || CAT_FALLBACK[cat.slug] || CAT_FALLBACK.rings}
          alt={cat.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = CAT_FALLBACK[cat.slug] || CAT_FALLBACK.rings; }}
        />
      </div>
      <p
        className="text-center text-[12px] font-semibold text-gray-800 uppercase mt-3 tracking-widest group-hover:text-primary transition-colors duration-300"
        style={{ letterSpacing: '0.18em' }}
      >
        {cat.name}
      </p>
    </Link>
  );

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">
        <div className="text-center mb-12">
          <h2
            className="text-[21px] font-semibold text-gray-900 uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            {heading}
          </h2>
          <p className="text-[14px] text-gray-500 mt-2.5 tracking-wide">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Full-width marquee — overflow only on x axis so text below cards is not clipped */}
      <div className="relative w-full" style={{ overflowX: 'hidden' }}>
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white 40%, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white 40%, transparent)' }} />

        <div className="marquee-track" style={{ paddingBottom: '16px' }}>
          {items.map((cat, idx) => (
            <CatCard key={`${cat._id}-${idx}`} cat={cat} keyPrefix={`${cat._id}-${idx}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FEATURED PRODUCTS ────────────────────────────────────────────────────────
const FeaturedProducts = ({ products, title = 'FEATURED PRODUCTS', subtitle, cmsContent }) => {
  if (!products?.length) return null;
  const heading = cmsContent?.title || title;
  const sub = cmsContent?.subtitle || subtitle;
  const eyebrow = cmsContent?.eyebrow || 'Handpicked';
  const displayed = products.slice(0, 12);
  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-eyebrow" style={{ letterSpacing: '0.28em' }}>
              {eyebrow}
            </span>
            <h2 className="section-title" style={{ letterSpacing: '0.1em' }}>{heading}</h2>
            {sub && (
              <p className="section-subtitle tracking-wide">{sub}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayed.map((product, idx) => (
            <ProductCard key={product._id} product={product} index={idx} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2.5 px-10 py-3.5 text-xs font-bold uppercase tracking-widest border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            style={{ letterSpacing: '0.18em' }}
          >
            See More <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── COLLECTIONS BANNER ───────────────────────────────────────────────────────

// ─── DEALS SECTION ────────────────────────────────────────────────────────────
// ─── shared pill-heading helper ───────────────────────────────────────────────
const PillHeading = ({ title, subtitle, simple }) => (
  <div className={simple ? 'flex justify-center' : 'flex items-center'}>
    {!simple && <div className="w-2.5 h-2.5 rotate-45 flex-shrink-0" style={{ background: '#b87c6a' }} />}
    {!simple && <div className="flex-1 h-px mx-4" style={{ background: 'rgba(184,124,106,0.35)' }} />}
    <div
      className="flex-shrink-0 text-center px-10 py-4"
      style={simple ? {} : { border: '1px solid rgba(184,124,106,0.45)', borderRadius: '50px' }}
    >
      <p
        className="font-heading font-semibold text-gray-900 uppercase"
        style={{ fontSize: 'clamp(1rem, 2.5vw, 1.35rem)', letterSpacing: '0.14em' }}
      >
        {title}
      </p>
      {subtitle && (
        <p className="text-[13px] text-gray-500 mt-1 tracking-wide">{subtitle}</p>
      )}
    </div>
    {!simple && <div className="flex-1 h-px mx-4" style={{ background: 'rgba(184,124,106,0.35)' }} />}
    {!simple && <div className="w-2.5 h-2.5 rotate-45 flex-shrink-0" style={{ background: '#b87c6a' }} />}
  </div>
);

// Simple card for CMS-managed deal products
const DealCmsCard = ({ product }) => (
  <Link to={product.link || '#'} className="group block card-luxury overflow-hidden">
    <div className="relative overflow-hidden aspect-jewelry bg-luxury-cream">
      {product.image ? (
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-luxury-beige" />
      )}
      {product.badge && (
        <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {product.badge}
        </span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1.5">{product.name}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        {product.price && (
          <span className="text-sm font-bold text-gray-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
        )}
        {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
          <span className="text-xs text-gray-400 line-through">₹{Number(product.originalPrice).toLocaleString('en-IN')}</span>
        )}
      </div>
    </div>
  </Link>
);

const DealsSection = ({ products, cmsContent }) => {
  const heading  = cmsContent?.title    || 'DEAL OF THE WEEK';
  const subtitle = cmsContent?.subtitle || 'Special Deals Only for You';
  const cmsProducts = cmsContent?.products?.filter((p) => p.image || p.name) || [];

  // Countdown to end of day (midnight)
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end - now);
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">

        {/* Top pill heading */}
        <div className="mb-12">
          <PillHeading title={heading} subtitle={subtitle} />
        </div>

        {cmsProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {cmsProducts.slice(0, 8).map((p, i) => (
              <DealCmsCard key={i} product={p} />
            ))}
          </div>
        ) : products?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {products.slice(0, 8).map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 4px 20px rgba(90,65,63,0.07)' }}>
                <div className="shimmer-img w-full" style={{ aspectRatio: '1/1' }} />
                <div className="p-4 space-y-2.5">
                  <div className="shimmer-text h-2.5 w-16 rounded" />
                  <div className="shimmer-text h-3.5 w-full rounded" />
                  <div className="shimmer-text h-3.5 w-3/4 rounded" />
                  <div className="shimmer-text h-4 w-20 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom countdown pill */}
        <div className="mt-14">
          <PillHeading
            title={`ENDS IN  ${pad(timeLeft.h)} : ${pad(timeLeft.m)} : ${pad(timeLeft.s)}`}
            subtitle="Grab It, Before Its Too Late"
          />
        </div>

      </div>
    </section>
  );
};

// ─── SERVICES SECTION ─────────────────────────────────────────────────────────
const SERVICES_FALLBACK = [
  {
    title: 'Old Gold Exchange',
    desc: 'Upgrade your jewellery by exchanging old gold at the best market rates',
    icon: 'exchange',
  },
  {
    title: 'Vault of Dreams Savings',
    desc: 'Turn monthly savings into jewellery you love with our savings plan',
    icon: 'savings',
  },
  {
    title: 'Free Jewellery Cleaning',
    desc: 'Professional cleaning that restores the brilliance and finish of your pieces',
    icon: 'cleaning',
  },
  {
    title: 'Diamond Carat Testing',
    desc: 'Check carat weight using our in-store precision testing instruments',
    icon: 'diamond',
  },
];

const SERVICE_ICON_MAP = {
  exchange: <GoldExchangeIcon />,
  savings:  <SavingsIcon />,
  cleaning: <CleaningIcon />,
  diamond:  <DiamondTestIcon />,
};

const SERVICE_ACCENTS = ['#c9a84c', '#b76e79', '#8b6355', '#7a9080'];

const ServicesSection = ({ cmsContent }) => {
  const eyebrow = cmsContent?.eyebrow || 'In-Store Experience';
  const heading  = cmsContent?.title   || 'SERVICES AT OUR STORE';
  const subtitle = cmsContent?.subtitle || 'Visit us to explore lab-grown diamonds and receive expert guidance';
  const items    = cmsContent?.items?.length ? cmsContent.items : SERVICES_FALLBACK;

  return (
    <section className="py-20 bg-[#faf7f4]">
      <div className="container-luxury">

        {/* Heading */}
        <div className="text-center mb-14">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.32em] mb-3" style={{ color: '#c9a84c' }}>
            {eyebrow}
          </span>
          <h2
            className="font-heading font-bold text-gray-900 uppercase"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '0.14em' }}
          >
            {heading}
          </h2>
          <p className="text-gray-500 mt-3 tracking-wide" style={{ fontSize: '13.5px' }}>
            {subtitle}
          </p>
          <div className="mx-auto mt-5 h-px w-16"
            style={{ background: 'linear-gradient(to right,transparent,#c9a84c,transparent)' }} />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((s, i) => {
            const accent = SERVICE_ACCENTS[i % SERVICE_ACCENTS.length];
            return (
              <motion.div
                key={s.title || i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              >
                {/* Colored top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: accent }} />

                {/* Number — top right */}
                <span
                  className="absolute top-5 right-5 font-heading font-bold select-none"
                  style={{ fontSize: '2rem', lineHeight: 1, color: accent, opacity: 0.18, letterSpacing: '-0.02em' }}
                >
                  0{i + 1}
                </span>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                  style={{ background: `${accent}18`, color: accent }}
                >
                  {SERVICE_ICON_MAP[s.icon] || <GoldExchangeIcon />}
                </div>

                <p
                  className="font-heading font-bold text-gray-900 text-[13px] uppercase mb-3 leading-snug"
                  style={{ letterSpacing: '0.07em' }}
                >
                  {s.title}
                </p>
                <p className="text-[12.5px] text-gray-500 leading-relaxed tracking-wide">
                  {s.desc}
                </p>

                {/* Bottom accent line on hover */}
                <div
                  className="absolute bottom-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
                  style={{ background: `linear-gradient(to right,transparent,${accent},transparent)` }}
                />
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// ─── WHY CHOOSE US PROMO GRID ─────────────────────────────────────────────────
const WHY_CHOOSE_FALLBACK = [
  {
    key: 'promo-shipping',
    title: 'FAST & SECURE SHIPPING',
    subtitle: 'Your Excitement, Our Priority',
    link: '#',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&h=400&fit=crop&q=80&auto=format',
    bg: 'linear-gradient(145deg, #1c1c2e 0%, #2d2d44 100%)',
  },
  {
    key: 'promo-ring',
    title: 'VAULT OF DREAMS',
    subtitle: 'Complete 9, Unlock the Shine',
    link: '#',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&h=400&fit=crop&q=80&auto=format',
    bg: 'linear-gradient(145deg, #0d1117 0%, #1a1a2e 100%)',
  },
  {
    key: 'promo-consultation',
    title: 'VIRTUAL CONSULTATION',
    subtitle: 'See it, Love it, Buy it',
    link: '#',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=400&fit=crop&q=80&auto=format',
    bg: 'linear-gradient(145deg, #1a2744 0%, #0d1b2a 100%)',
  },
  {
    key: 'promo-bespoke',
    title: 'BESPOKE DESIGNS',
    subtitle: 'Handcrafted to Perfection',
    link: '#',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&h=400&fit=crop&q=80&auto=format',
    bg: 'linear-gradient(145deg, #2c1810 0%, #1a0e08 100%)',
  },
];

const WhyChooseSection = ({ cmsContent, siteImages = {} }) => {
  const heading  = cmsContent?.title    || 'WHY CHOOSE OUR JEWELRY?';
  const subtitle = cmsContent?.subtitle || 'Custom designs, Video consults, Fast delivery';
  const baseItems = cmsContent?.items?.length ? cmsContent.items : WHY_CHOOSE_FALLBACK;
  // Overlay admin-uploaded site images on top of defaults
  const items = baseItems.map((item) => ({
    ...item,
    image: siteImages[item.key] || siteImages[item.key?.replace('promo-', '')] || item.image,
  }));

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">

        {/* Heading */}
        <div className="text-center mb-10">
          <h2
            className="font-heading font-semibold text-gray-900 uppercase"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', letterSpacing: '0.14em' }}
          >
            {heading}
          </h2>
          <p className="text-[13.5px] text-gray-500 mt-2.5 tracking-wide">{subtitle}</p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.slice(0, 4).map((item, i) => {
            // Alternate: even index = bottom-left, odd index = top-right
            const isRight = i % 2 === 1;
            return (
              <motion.div
                key={item.title || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{ aspectRatio: '5/2' }}
              >
                <Link to={item.link || '#'} className="block h-full">
                  {/* BG gradient */}
                  <div className="absolute inset-0" style={{ background: item.bg || '#1a1a1a' }} />

                  {/* Image */}
                  <img
                    src={item.image || WHY_CHOOSE_FALLBACK[i]?.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      const fb = WHY_CHOOSE_FALLBACK[i]?.unsplash;
                      if (fb && e.target.src !== fb) { e.target.src = fb; }
                      else { e.target.style.display = 'none'; }
                    }}
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

                  {/* Content — alternates between bottom-left and top-right */}
                  <div
                    className={`absolute inset-0 flex flex-col p-7 sm:p-8 ${
                      isRight
                        ? 'justify-start items-end text-right'
                        : 'justify-end items-start text-left'
                    }`}
                  >
                    <p
                      className="font-heading font-bold text-white uppercase mb-1.5 leading-snug"
                      style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1.15rem)', letterSpacing: '0.08em' }}
                    >
                      {item.title}
                    </p>
                    <p className="text-white/70 text-[13px] mb-5 tracking-wide">{item.subtitle}</p>
                    <span
                      className="inline-flex items-center px-5 py-2 bg-white text-gray-900 text-[11px] font-semibold tracking-widest uppercase hover:bg-white/90 transition-all duration-200"
                      style={{ borderRadius: '4px', letterSpacing: '0.1em' }}
                    >
                      Explore Now
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// ─── DIAMOND CUTS SECTION ─────────────────────────────────────────────────────
// No image URLs — SVG shapes render by default; admin can override per-cut via CMS
const DIAMOND_CUTS_DATA = [
  { name: 'ROUND',    slug: 'round',    image: null },
  { name: 'OVAL',     slug: 'oval',     image: null },
  { name: 'CUSHION',  slug: 'cushion',  image: null },
  { name: 'PRINCESS', slug: 'princess', image: null },
  { name: 'EMERALD',  slug: 'emerald',  image: null },
  { name: 'PEAR',     slug: 'pear',     image: null },
  { name: 'MARQUISE', slug: 'marquise', image: null },
  { name: 'HEART',    slug: 'heart',    image: null },
];

const DiamondShapeSVG = ({ shape }) => {
  // dk=dark facet  lt=light facet  tb=table  str=stroke  sp=sparkle
  const dk='#4a6880'; const lt='#daeeff'; const mid='#8aaac8'; const str='#6a8aaa';

  const paths = {

    // ── ROUND BRILLIANT ── 16 alternating sectors + table octagon
    round: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="ds-rnd" cx="44%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#ds-rnd)"/>
        {/* 8 dark sectors */}
        <polygon points="50,50 94,50 90.7,66.8" fill={dk} opacity="0.48"/>
        <polygon points="50,50 81.1,81.1 66.8,90.7" fill={dk} opacity="0.48"/>
        <polygon points="50,50 50,94 33.2,90.7" fill={dk} opacity="0.48"/>
        <polygon points="50,50 18.9,81.1 9.3,66.8" fill={dk} opacity="0.48"/>
        <polygon points="50,50 6,50 9.3,33.2" fill={dk} opacity="0.48"/>
        <polygon points="50,50 18.9,18.9 33.2,9.3" fill={dk} opacity="0.48"/>
        <polygon points="50,50 50,6 66.8,9.3" fill={dk} opacity="0.48"/>
        <polygon points="50,50 81.1,18.9 90.7,33.2" fill={dk} opacity="0.48"/>
        {/* 8 light sectors */}
        <polygon points="50,50 90.7,66.8 81.1,81.1" fill={lt} opacity="0.7"/>
        <polygon points="50,50 66.8,90.7 50,94" fill={lt} opacity="0.7"/>
        <polygon points="50,50 33.2,90.7 18.9,81.1" fill={lt} opacity="0.7"/>
        <polygon points="50,50 9.3,66.8 6,50" fill={lt} opacity="0.7"/>
        <polygon points="50,50 9.3,33.2 18.9,18.9" fill={lt} opacity="0.7"/>
        <polygon points="50,50 33.2,9.3 50,6" fill={lt} opacity="0.7"/>
        <polygon points="50,50 66.8,9.3 81.1,18.9" fill={lt} opacity="0.7"/>
        <polygon points="50,50 90.7,33.2 94,50" fill={lt} opacity="0.7"/>
        {/* Table octagon */}
        <polygon points="70.3,58.4 58.4,70.3 41.6,70.3 29.7,58.4 29.7,41.6 41.6,29.7 58.4,29.7 70.3,41.6" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        {/* Facet lines girdle→table */}
        <line x1="94" y1="50" x2="70.3" y2="41.6" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="94" y1="50" x2="70.3" y2="58.4" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="81.1" y1="81.1" x2="70.3" y2="58.4" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="81.1" y1="81.1" x2="58.4" y2="70.3" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="50" y1="94" x2="58.4" y2="70.3" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="50" y1="94" x2="41.6" y2="70.3" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="18.9" y1="81.1" x2="29.7" y2="58.4" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="18.9" y1="81.1" x2="41.6" y2="70.3" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="6" y1="50" x2="29.7" y2="58.4" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="6" y1="50" x2="29.7" y2="41.6" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="18.9" y1="18.9" x2="29.7" y2="41.6" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="18.9" y1="18.9" x2="41.6" y2="29.7" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="50" y1="6" x2="41.6" y2="29.7" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="50" y1="6" x2="58.4" y2="29.7" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="81.1" y1="18.9" x2="58.4" y2="29.7" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <line x1="81.1" y1="18.9" x2="70.3" y2="41.6" stroke={mid} strokeWidth="0.4" opacity="0.55"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="37" cy="31" rx="4" ry="3" fill="white" opacity="0.95" transform="rotate(-25,37,31)"/>
        <circle cx="46" cy="24" r="2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── OVAL ── same 16-sector approach clipped to ellipse
    oval: (
      <svg viewBox="0 0 80 112" className="w-full h-full">
        <defs>
          <radialGradient id="ds-ovl" cx="42%" cy="36%" r="62%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
          <clipPath id="cp-ovl"><ellipse cx="40" cy="56" rx="34" ry="49"/></clipPath>
        </defs>
        <ellipse cx="40" cy="56" rx="34" ry="49" fill="url(#ds-ovl)"/>
        <g clipPath="url(#cp-ovl)">
          <polygon points="40,56 74,56 71,73" fill={dk} opacity="0.48"/>
          <polygon points="40,56 63,89 52,100" fill={dk} opacity="0.48"/>
          <polygon points="40,56 40,105 27,100" fill={dk} opacity="0.48"/>
          <polygon points="40,56 17,89 9,73" fill={dk} opacity="0.48"/>
          <polygon points="40,56 6,56 9,39" fill={dk} opacity="0.48"/>
          <polygon points="40,56 17,23 28,12" fill={dk} opacity="0.48"/>
          <polygon points="40,56 40,7 53,12" fill={dk} opacity="0.48"/>
          <polygon points="40,56 63,23 71,39" fill={dk} opacity="0.48"/>
          <polygon points="40,56 71,73 63,89" fill={lt} opacity="0.7"/>
          <polygon points="40,56 52,100 40,105" fill={lt} opacity="0.7"/>
          <polygon points="40,56 27,100 17,89" fill={lt} opacity="0.7"/>
          <polygon points="40,56 9,73 6,56" fill={lt} opacity="0.7"/>
          <polygon points="40,56 9,39 17,23" fill={lt} opacity="0.7"/>
          <polygon points="40,56 28,12 40,7" fill={lt} opacity="0.7"/>
          <polygon points="40,56 53,12 63,23" fill={lt} opacity="0.7"/>
          <polygon points="40,56 71,39 74,56" fill={lt} opacity="0.7"/>
        </g>
        <polygon points="57,64 50,75 30,75 23,64 23,48 30,37 50,37 57,48" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <ellipse cx="40" cy="56" rx="34" ry="49" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="30" cy="36" rx="4" ry="3" fill="white" opacity="0.95" transform="rotate(-20,30,36)"/>
        <circle cx="37" cy="28" r="2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── CUSHION ── 16 sectors clipped to rounded square
    cushion: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="ds-csh" cx="42%" cy="36%" r="64%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
          <clipPath id="cp-csh">
            <path d="M22,8 L78,8 Q92,8 92,22 L92,78 Q92,92 78,92 L22,92 Q8,92 8,78 L8,22 Q8,8 22,8Z"/>
          </clipPath>
        </defs>
        <path d="M22,8 L78,8 Q92,8 92,22 L92,78 Q92,92 78,92 L22,92 Q8,92 8,78 L8,22 Q8,8 22,8Z" fill="url(#ds-csh)"/>
        <g clipPath="url(#cp-csh)">
          <polygon points="50,50 92,50 88,67" fill={dk} opacity="0.48"/>
          <polygon points="50,50 85,85 68,88" fill={dk} opacity="0.48"/>
          <polygon points="50,50 50,92 33,88" fill={dk} opacity="0.48"/>
          <polygon points="50,50 15,85 12,68" fill={dk} opacity="0.48"/>
          <polygon points="50,50 8,50 12,33" fill={dk} opacity="0.48"/>
          <polygon points="50,50 15,15 33,12" fill={dk} opacity="0.48"/>
          <polygon points="50,50 50,8 67,12" fill={dk} opacity="0.48"/>
          <polygon points="50,50 85,15 88,33" fill={dk} opacity="0.48"/>
          <polygon points="50,50 88,67 85,85" fill={lt} opacity="0.7"/>
          <polygon points="50,50 68,88 50,92" fill={lt} opacity="0.7"/>
          <polygon points="50,50 33,88 15,85" fill={lt} opacity="0.7"/>
          <polygon points="50,50 12,68 8,50" fill={lt} opacity="0.7"/>
          <polygon points="50,50 12,33 15,15" fill={lt} opacity="0.7"/>
          <polygon points="50,50 33,12 50,8" fill={lt} opacity="0.7"/>
          <polygon points="50,50 67,12 85,15" fill={lt} opacity="0.7"/>
          <polygon points="50,50 88,33 92,50" fill={lt} opacity="0.7"/>
        </g>
        <polygon points="70.3,58.4 58.4,70.3 41.6,70.3 29.7,58.4 29.7,41.6 41.6,29.7 58.4,29.7 70.3,41.6" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <path d="M22,8 L78,8 Q92,8 92,22 L92,78 Q92,92 78,92 L22,92 Q8,92 8,78 L8,22 Q8,8 22,8Z" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="36" cy="30" rx="4" ry="3" fill="white" opacity="0.95" transform="rotate(-20,36,30)"/>
        <circle cx="45" cy="23" r="2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── PRINCESS ── square with 16 sectors + corner diagonals
    princess: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="ds-prc" x1="15%" y1="10%" x2="88%" y2="90%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#9ab4c8"/>
          </linearGradient>
          <clipPath id="cp-prc"><rect x="8" y="8" width="84" height="84"/></clipPath>
        </defs>
        <rect x="8" y="8" width="84" height="84" fill="url(#ds-prc)"/>
        <g clipPath="url(#cp-prc)">
          <polygon points="50,50 92,50 92,29" fill={dk} opacity="0.48"/>
          <polygon points="50,50 92,8 71,8" fill={dk} opacity="0.48"/>
          <polygon points="50,50 50,8 29,8" fill={dk} opacity="0.48"/>
          <polygon points="50,50 8,8 8,29" fill={dk} opacity="0.48"/>
          <polygon points="50,50 8,50 8,71" fill={dk} opacity="0.48"/>
          <polygon points="50,50 8,92 29,92" fill={dk} opacity="0.48"/>
          <polygon points="50,50 50,92 71,92" fill={dk} opacity="0.48"/>
          <polygon points="50,50 92,92 92,71" fill={dk} opacity="0.48"/>
          <polygon points="50,50 92,29 92,8" fill={lt} opacity="0.62"/>
          <polygon points="50,50 71,8 50,8" fill={lt} opacity="0.62"/>
          <polygon points="50,50 29,8 8,8" fill={lt} opacity="0.62"/>
          <polygon points="50,50 8,29 8,50" fill={lt} opacity="0.62"/>
          <polygon points="50,50 8,71 8,92" fill={lt} opacity="0.62"/>
          <polygon points="50,50 29,92 50,92" fill={lt} opacity="0.62"/>
          <polygon points="50,50 71,92 92,92" fill={lt} opacity="0.62"/>
          <polygon points="50,50 92,71 92,50" fill={lt} opacity="0.62"/>
        </g>
        <polygon points="68,58 58,68 42,68 32,58 32,42 42,32 58,32 68,42" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <line x1="8" y1="8" x2="32" y2="32" stroke={mid} strokeWidth="0.45" opacity="0.6"/>
        <line x1="92" y1="8" x2="68" y2="32" stroke={mid} strokeWidth="0.45" opacity="0.6"/>
        <line x1="92" y1="92" x2="68" y2="68" stroke={mid} strokeWidth="0.45" opacity="0.6"/>
        <line x1="8" y1="92" x2="32" y2="68" stroke={mid} strokeWidth="0.45" opacity="0.6"/>
        <rect x="8" y="8" width="84" height="84" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="32" cy="27" rx="4.5" ry="3" fill="white" opacity="0.95" transform="rotate(-20,32,27)"/>
        <circle cx="43" cy="20" r="2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── EMERALD ── step-cut (3 concentric rings, alternating facet colors)
    emerald: (
      <svg viewBox="0 0 80 112" className="w-full h-full">
        <defs>
          <linearGradient id="ds-em" x1="10%" y1="5%" x2="90%" y2="95%">
            <stop offset="0%" stopColor="#eef4fa"/><stop offset="100%" stopColor="#98b2ca"/>
          </linearGradient>
        </defs>
        <polygon points="21,5 59,5 75,21 75,91 59,107 21,107 5,91 5,21" fill="url(#ds-em)" stroke={str} strokeWidth="0.8"/>
        {/* Outer ring */}
        <polygon points="21,5 59,5 55,18 25,18" fill="#e6f2fc" opacity="0.78"/>
        <polygon points="25,94 55,94 59,107 21,107" fill="#8aaac8" opacity="0.65"/>
        <polygon points="5,21 21,5 25,18 13,29 13,83 25,94 5,91" fill={dk} opacity="0.5"/>
        <polygon points="75,21 59,5 55,18 67,29 67,83 55,94 75,91" fill="#c8ddf0" opacity="0.72"/>
        {/* Middle ring */}
        <polygon points="25,18 55,18 51,30 29,30" fill="#f0f8ff" opacity="0.82"/>
        <polygon points="29,82 51,82 55,94 25,94" fill="#7898b8" opacity="0.62"/>
        <polygon points="13,29 25,18 29,30 18,41 18,71 29,82 13,83" fill={dk} opacity="0.48"/>
        <polygon points="67,29 55,18 51,30 62,41 62,71 51,82 67,83" fill="#b8d4ec" opacity="0.75"/>
        {/* Table */}
        <polygon points="29,30 51,30 62,41 62,71 51,82 29,82 18,71 18,41" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        {/* Step lines */}
        <line x1="5" y1="21" x2="75" y2="21" stroke={str} strokeWidth="0.4" opacity="0.5"/>
        <line x1="13" y1="29" x2="67" y2="29" stroke={str} strokeWidth="0.4" opacity="0.45"/>
        <line x1="18" y1="41" x2="62" y2="41" stroke={str} strokeWidth="0.35" opacity="0.4"/>
        <line x1="18" y1="71" x2="62" y2="71" stroke={str} strokeWidth="0.35" opacity="0.4"/>
        <line x1="13" y1="83" x2="67" y2="83" stroke={str} strokeWidth="0.4" opacity="0.45"/>
        <line x1="5" y1="91" x2="75" y2="91" stroke={str} strokeWidth="0.4" opacity="0.5"/>
        <ellipse cx="22" cy="21" rx="3.5" ry="2.5" fill="white" opacity="0.95" transform="rotate(-15,22,21)"/>
        <circle cx="32" cy="14" r="1.8" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── PEAR ── 16 sectors clipped to teardrop
    pear: (
      <svg viewBox="0 0 80 115" className="w-full h-full">
        <defs>
          <radialGradient id="ds-pear" cx="42%" cy="34%" r="64%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
          <clipPath id="cp-pear">
            <path d="M40,109 C20,99 6,82 6,62 C6,38 19,13 40,7 C61,13 74,38 74,62 C74,82 60,99 40,109Z"/>
          </clipPath>
        </defs>
        <path d="M40,109 C20,99 6,82 6,62 C6,38 19,13 40,7 C61,13 74,38 74,62 C74,82 60,99 40,109Z" fill="url(#ds-pear)"/>
        <g clipPath="url(#cp-pear)">
          <polygon points="40,56 74,56 70,71" fill={dk} opacity="0.48"/>
          <polygon points="40,56 64,87 53,100" fill={dk} opacity="0.48"/>
          <polygon points="40,56 40,109 28,101" fill={dk} opacity="0.48"/>
          <polygon points="40,56 17,87 10,71" fill={dk} opacity="0.48"/>
          <polygon points="40,56 6,56 10,41" fill={dk} opacity="0.48"/>
          <polygon points="40,56 17,26 28,14" fill={dk} opacity="0.48"/>
          <polygon points="40,56 40,7 52,14" fill={dk} opacity="0.48"/>
          <polygon points="40,56 63,26 70,41" fill={dk} opacity="0.48"/>
          <polygon points="40,56 70,71 64,87" fill={lt} opacity="0.7"/>
          <polygon points="40,56 53,100 40,109" fill={lt} opacity="0.7"/>
          <polygon points="40,56 28,101 17,87" fill={lt} opacity="0.7"/>
          <polygon points="40,56 10,71 6,56" fill={lt} opacity="0.7"/>
          <polygon points="40,56 10,41 17,26" fill={lt} opacity="0.7"/>
          <polygon points="40,56 28,14 40,7" fill={lt} opacity="0.7"/>
          <polygon points="40,56 52,14 63,26" fill={lt} opacity="0.7"/>
          <polygon points="40,56 70,41 74,56" fill={lt} opacity="0.7"/>
        </g>
        <polygon points="56,63 49,74 31,74 24,63 24,49 31,38 49,38 56,49" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <path d="M40,109 C20,99 6,82 6,62 C6,38 19,13 40,7 C61,13 74,38 74,62 C74,82 60,99 40,109Z" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="30" cy="34" rx="4" ry="3" fill="white" opacity="0.95" transform="rotate(-20,30,34)"/>
        <circle cx="38" cy="26" r="2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── MARQUISE ── 16 sectors clipped to eye shape
    marquise: (
      <svg viewBox="0 0 130 70" className="w-full h-full">
        <defs>
          <radialGradient id="ds-mq" cx="42%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
          <clipPath id="cp-mq">
            <path d="M65,5 C83,5 125,26 125,35 C125,44 83,65 65,65 C47,65 5,44 5,35 C5,26 47,5 65,5Z"/>
          </clipPath>
        </defs>
        <path d="M65,5 C83,5 125,26 125,35 C125,44 83,65 65,65 C47,65 5,44 5,35 C5,26 47,5 65,5Z" fill="url(#ds-mq)"/>
        <g clipPath="url(#cp-mq)">
          <polygon points="65,35 125,35 120,47" fill={dk} opacity="0.48"/>
          <polygon points="65,35 107,57 89,63" fill={dk} opacity="0.48"/>
          <polygon points="65,35 65,65 42,63" fill={dk} opacity="0.48"/>
          <polygon points="65,35 24,57 10,47" fill={dk} opacity="0.48"/>
          <polygon points="65,35 5,35 10,23" fill={dk} opacity="0.48"/>
          <polygon points="65,35 24,13 42,7" fill={dk} opacity="0.48"/>
          <polygon points="65,35 65,5 88,7" fill={dk} opacity="0.48"/>
          <polygon points="65,35 106,13 120,23" fill={dk} opacity="0.48"/>
          <polygon points="65,35 120,47 107,57" fill={lt} opacity="0.7"/>
          <polygon points="65,35 89,63 65,65" fill={lt} opacity="0.7"/>
          <polygon points="65,35 42,63 24,57" fill={lt} opacity="0.7"/>
          <polygon points="65,35 10,47 5,35" fill={lt} opacity="0.7"/>
          <polygon points="65,35 10,23 24,13" fill={lt} opacity="0.7"/>
          <polygon points="65,35 42,7 65,5" fill={lt} opacity="0.7"/>
          <polygon points="65,35 88,7 106,13" fill={lt} opacity="0.7"/>
          <polygon points="65,35 120,23 125,35" fill={lt} opacity="0.7"/>
        </g>
        <polygon points="88,41 78,50 52,50 42,41 42,29 52,20 78,20 88,29" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <path d="M65,5 C83,5 125,26 125,35 C125,44 83,65 65,65 C47,65 5,44 5,35 C5,26 47,5 65,5Z" fill="none" stroke={str} strokeWidth="0.8"/>
        <ellipse cx="48" cy="20" rx="4.5" ry="3" fill="white" opacity="0.95" transform="rotate(-15,48,20)"/>
        <circle cx="59" cy="13" r="2.2" fill="white" opacity="0.75"/>
      </svg>
    ),

    // ── HEART ── 14 sectors clipped to heart + centre cleft line
    heart: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="ds-hrt" cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#f4f8fc"/><stop offset="100%" stopColor="#a0b8cc"/>
          </radialGradient>
          <clipPath id="cp-hrt">
            <path d="M50,88 C50,88 8,62 8,36 C8,20 18,9 32,10 C39,10.5 45,14.5 50,22 C55,14.5 61,10.5 68,10 C82,9 92,20 92,36 C92,62 50,88 50,88Z"/>
          </clipPath>
        </defs>
        <path d="M50,88 C50,88 8,62 8,36 C8,20 18,9 32,10 C39,10.5 45,14.5 50,22 C55,14.5 61,10.5 68,10 C82,9 92,20 92,36 C92,62 50,88 50,88Z" fill="url(#ds-hrt)"/>
        <g clipPath="url(#cp-hrt)">
          <polygon points="50,52 8,36 12,55" fill={dk} opacity="0.48"/>
          <polygon points="50,52 12,55 20,70" fill={lt} opacity="0.7"/>
          <polygon points="50,52 20,70 34,82" fill={dk} opacity="0.48"/>
          <polygon points="50,52 34,82 50,88" fill={lt} opacity="0.7"/>
          <polygon points="50,52 92,36 88,55" fill={lt} opacity="0.7"/>
          <polygon points="50,52 88,55 80,70" fill={dk} opacity="0.48"/>
          <polygon points="50,52 80,70 66,82" fill={lt} opacity="0.7"/>
          <polygon points="50,52 66,82 50,88" fill={dk} opacity="0.48"/>
          <polygon points="50,52 8,36 18,22" fill={lt} opacity="0.58"/>
          <polygon points="50,52 18,22 32,10" fill={dk} opacity="0.42"/>
          <polygon points="50,52 32,10 50,22" fill={lt} opacity="0.65"/>
          <polygon points="50,52 50,22 68,10" fill={dk} opacity="0.42"/>
          <polygon points="50,52 68,10 82,22" fill={lt} opacity="0.58"/>
          <polygon points="50,52 82,22 92,36" fill={dk} opacity="0.48"/>
        </g>
        <polygon points="50,42 64,48 60,63 50,68 40,63 36,48" fill="white" fillOpacity="0.65" stroke={mid} strokeWidth="0.5"/>
        <path d="M50,88 C50,88 8,62 8,36 C8,20 18,9 32,10 C39,10.5 45,14.5 50,22 C55,14.5 61,10.5 68,10 C82,9 92,20 92,36 C92,62 50,88 50,88Z" fill="none" stroke={str} strokeWidth="0.8"/>
        <line x1="50" y1="22" x2="50" y2="88" stroke={mid} strokeWidth="0.5" opacity="0.38"/>
        <ellipse cx="28" cy="24" rx="4" ry="3" fill="white" opacity="0.95" transform="rotate(-15,28,24)"/>
        <circle cx="38" cy="17" r="2" fill="white" opacity="0.75"/>
        <ellipse cx="68" cy="24" rx="3.5" ry="2.5" fill="white" opacity="0.85" transform="rotate(15,68,24)"/>
      </svg>
    ),
  };

  return paths[shape] || paths.round;
};

// ─── GIFTING SECTION ──────────────────────────────────────────────────────────
const BowSVG = () => (
  <svg viewBox="0 0 80 52" className="w-14 h-9 mx-auto" fill="none">
    {/* Left loop */}
    <path d="M38 26 C32 14, 8 8, 12 24 C8 38, 30 36, 38 26Z" fill="#dc2626" />
    {/* Right loop */}
    <path d="M42 26 C48 14, 72 8, 68 24 C72 38, 50 36, 42 26Z" fill="#dc2626" />
    {/* Center shading on loops */}
    <path d="M38 26 C32 14, 8 8, 12 24 C8 38, 30 36, 38 26Z" fill="rgba(0,0,0,0.12)" />
    <path d="M42 26 C48 14, 72 8, 68 24 C72 38, 50 36, 42 26Z" fill="rgba(0,0,0,0.12)" />
    {/* Left tail */}
    <path d="M37 30 L24 50 L28 50 L40 32Z" fill="#dc2626" />
    {/* Right tail */}
    <path d="M43 30 L56 50 L52 50 L40 32Z" fill="#dc2626" />
    {/* Center knot */}
    <ellipse cx="40" cy="27" rx="5" ry="5" fill="#b91c1c" />
    <ellipse cx="40" cy="27" rx="3" ry="3" fill="#dc2626" />
  </svg>
);

const GIFT_BUDGETS = [
  { label: '30K', slug: 'gift-below-rs-30k' },
  { label: '50K', slug: 'gift-below-rs-50k' },
  { label: '100K', slug: 'gift-below-rs-100k' },
];

const GIFT_OCCASIONS = [
  { title: 'GIFTS FOR WIFE',     slug: 'gifts-for-wife',     bg: 'linear-gradient(145deg,#1a0808 0%,#3d1212 50%,#2a0c0c 100%)' },
  { title: 'ANNIVERSARY GIFTS',  slug: 'anniversary-gifts',  bg: 'linear-gradient(145deg,#08081a 0%,#12123d 50%,#0c0c2a 100%)' },
  { title: 'BIRTHDAY GIFTS',     slug: 'birthday-gifts',     bg: 'linear-gradient(145deg,#1a0812 0%,#3d1225 50%,#2a0c1a 100%)' },
  { title: 'ENGAGEMENT GIFTS',   slug: 'engagement-gifts',   bg: 'linear-gradient(145deg,#08140a 0%,#12301a 50%,#0c2010 100%)' },
  { title: 'GIFTS FOR HER',      slug: 'gifts-for-her',      bg: 'linear-gradient(145deg,#1a0e08 0%,#3d2312 50%,#2a180c 100%)' },
];

const GiftingSection = ({ cmsContent }) => {
  const budgets   = cmsContent?.budgets?.length   ? cmsContent.budgets   : GIFT_BUDGETS;
  const occasions = cmsContent?.occasions?.length ? cmsContent.occasions : GIFT_OCCASIONS;
  const heading   = cmsContent?.heading  || 'Gift what lasts beyond the vows.';
  const subtitle  = cmsContent?.subtitle || '';
  const [current, setCurrent] = useState(0);
  const total = occasions.length;
  const go = (idx) => setCurrent((idx + total) % total);

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left — title + budget cards */}
          <div>
            <p
              className="font-heading italic text-gray-800 mb-2 leading-snug"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {heading}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-400 mb-8 tracking-wide">{subtitle}</p>
            )}
            {!subtitle && <div className="mb-8" />}

            <div className="grid grid-cols-3 gap-3">
              {budgets.map((budget, idx) => (
                <Link
                  key={budget.slug || idx}
                  to={`/collections/${budget.slug}`}
                  className="group block rounded-xl overflow-hidden relative"
                  style={{ aspectRatio: '3/4' }}
                >
                  {budget.image ? (
                    <img
                      src={budget.image}
                      alt={`Gift under ${budget.label}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#fafafa] border border-gray-100 rounded-xl flex flex-col">
                      <div className="flex-1 relative">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-red-500/70" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-red-500/70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BowSVG />
                        </div>
                      </div>
                      <div className="mx-5 h-[2px] bg-red-500/60" />
                      <div className="px-3 py-4 text-center">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">GIFT UNDER</p>
                        <p className="font-heading font-bold text-red-500" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)' }}>
                          {budget.label}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — occasion slider */}
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {occasions.map((occ, i) => (
              <motion.div
                key={occ.slug || i}
                animate={{ opacity: i === current ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
                style={{ pointerEvents: i === current ? 'auto' : 'none' }}
              >
                {occ.image
                  ? <img src={occ.image} alt={occ.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: occ.bg || 'linear-gradient(145deg,#1a0808 0%,#3d1212 50%,#2a0c0c 100%)' }} />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
                <Link
                  to={`/collections/${occ.slug}`}
                  className="absolute inset-0 flex flex-col justify-end p-7"
                >
                  <p
                    className="font-heading font-bold text-white uppercase"
                    style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)', letterSpacing: '0.12em' }}
                  >
                    {occ.title}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 text-white/70 text-xs uppercase tracking-widest">
                    Explore Collection
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* Prev / Next */}
            <div className="absolute bottom-5 right-5 z-10 flex gap-2">
              <button
                onClick={() => go(current - 1)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => go(current + 1)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Dots — fixed to use live occasions array */}
            <div className="absolute bottom-5 left-5 z-10 flex gap-1.5">
              {occasions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// Diamond cut card — uses Cloudinary image if provided via CMS, otherwise SVG shape
const DiamondCutCard = ({ cut, slug }) => {
  const [imgFailed, setImgFailed] = useState(false);
  // Only treat as a usable image if it's a real external URL (Cloudinary / Unsplash)
  const imgSrc = cut.image && cut.image.startsWith('http') && !cut.image.includes('localhost')
    ? cut.image
    : null;

  return (
    <div className="relative w-[90px] h-[90px] sm:w-full sm:aspect-square flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
      {imgSrc && !imgFailed ? (
        <img
          src={imgSrc}
          alt={cut.name}
          className="w-full h-full object-contain drop-shadow-md"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <DiamondShapeSVG shape={slug} />
      )}
    </div>
  );
};

// ─── DIAMOND CUTS SECTION ─────────────────────────────────────────────────────
const DiamondCutsSection = ({ cmsContent }) => {
  const heading  = cmsContent?.title    || 'EXPLORE OUR DIAMOND CUTS';
  const subtitle = cmsContent?.subtitle || 'Where Geometry Elevates Style';
  // CMS stores cuts under 'cuts' key; fallback to hardcoded data with upload-based images
  const cmsCuts = cmsContent?.cuts?.filter((c) => c.name);
  const cuts = cmsCuts?.length ? cmsCuts : DIAMOND_CUTS_DATA;

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">

        <div className="mb-10">
          <PillHeading title={heading} subtitle={subtitle} simple />
        </div>

        {/* Scrollable on mobile, 8-col grid on sm+ */}
        <div className="flex gap-6 overflow-x-auto pb-2 sm:grid sm:grid-cols-8 sm:gap-8 sm:overflow-visible scrollbar-none justify-center">
          {cuts.map((cut, i) => {
            const slug = cut.slug || cut.name?.toLowerCase?.() || '';
            return (
              <motion.div
                key={slug || i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className="flex-shrink-0 w-[90px] sm:w-auto"
              >
                <Link
                  to={`/collections?cut=${slug}`}
                  className="group flex flex-col items-center gap-3"
                >
                  <DiamondCutCard cut={cut} slug={slug} />
                  <p
                    className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors duration-300 text-center"
                    style={{ letterSpacing: '0.12em' }}
                  >
                    {cut.name}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// ─── LIFESTYLE LOOKBOOK ───────────────────────────────────────────────────────
const LIFESTYLE_CONFIG = [
  {
    id: 1,
    key: 'lifestyle-bridal',
    eyebrow: 'BRIDAL & FESTIVE',
    heading: 'Crafted for\nYour Moments',
    sub: 'Timeless bridal jewelry — woven with tradition, worn with grace.',
    modelImage: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=900&h=1100&fit=crop&q=80&auto=format',
    modelUnsplash: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=900&h=1100&fit=crop&q=80&auto=format',
    modelFallback: 'linear-gradient(145deg,#c9a84c22 0%,#f5e6c0 50%,#faf7f4 100%)',
    align: 'left',
    accent: '#C9A84C',
    bg: '#faf7f4',
    link: '/collections/bridal',
    // product slugs to show in mini-grid (fetched from DB)
    slugs: ['kundan-choker-necklace','temple-gold-bangle-set','pearl-drop-earrings','diamond-floral-pendant-set'],
    labels: ['Kundan Necklace','Temple Bangles','Pearl Earrings','Floral Pendant'],
  },
  {
    id: 2,
    key: 'lifestyle-everyday',
    eyebrow: 'EVERYDAY LUXURY',
    heading: 'Wear It Every\nDay, Forever',
    sub: 'Light. Delicate. Perfectly you — from dawn meetings to candlelit dinners.',
    modelImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&h=1100&fit=crop&q=80&auto=format',
    modelUnsplash: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&h=1100&fit=crop&q=80&auto=format',
    modelFallback: 'linear-gradient(145deg,#b76e7922 0%,#f2dde0 50%,#f5ede4 100%)',
    align: 'right',
    accent: '#B76E79',
    bg: '#f5ede4',
    link: '/collections/daily-wear',
    slugs: ['diamond-stud-earrings','diamond-solitaire-pendant-18kt','classic-solitaire-diamond-ring','black-beads-gold-mangalsutra'],
    labels: ['Diamond Studs','Gold Pendant','Solitaire Ring','Mangalsutra'],
  },
];

// Shop-the-look product chip shown ON the model photo
const ShopChip = ({ product, label, delay = 0 }) => {
  const img = product?.images?.find((i) => i.isPrimary) || product?.images?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        to={`/products/${product?.slug || '#'}`}
        className="group flex items-center gap-2 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          border: '1px solid rgba(255,255,255,0.9)',
          padding: '6px 12px 6px 6px',
        }}
      >
        {/* Product thumbnail */}
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          {img?.url ? (
            <img src={img.url} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100" />
          )}
        </div>
        {/* Label */}
        <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wide leading-tight max-w-[80px]">
          {label}
        </span>
        {/* Arrow */}
        <svg className="w-3 h-3 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </motion.div>
  );
};

const LifestyleLookbookSection = ({ panel1Products = [], panel2Products = [], fallbackProducts = [], cmsContent, siteImages = {} }) => {
  // Merge CMS overrides + admin-uploaded site images into LIFESTYLE_CONFIG
  const panels = LIFESTYLE_CONFIG.map((cfg, i) => {
    const cms = cmsContent?.panels?.[i] || {};
    return {
      ...cfg,
      eyebrow:       cms.eyebrow || cfg.eyebrow,
      heading:       cms.heading || cfg.heading,
      sub:           cms.sub     || cfg.sub,
      link:          cms.link    || cfg.link,
      accent:        cms.accent  || cfg.accent,
      bg:            cms.bg      || cfg.bg,
      modelImage:    siteImages[cfg.key] || cms.image || cfg.modelImage,
      modelUnsplash: cfg.modelUnsplash,
    };
  });

  // Products for each panel: admin-selected via toggle, else fall back to slug match
  const getPanelProducts = (panelProducts, cfg) => {
    if (panelProducts.length > 0) {
      return panelProducts.slice(0, 4).map((p, i) => ({ product: p, label: p.title }));
    }
    // Fallback: match by hardcoded slugs from LIFESTYLE_CONFIG
    return cfg.slugs.map((slug, si) => ({
      product: fallbackProducts.find((p) => p.slug === slug) || null,
      label: cfg.labels[si],
    }));
  };

  return (
  <section className="overflow-hidden">
    {panels.map((panel, pi) => {
      const isLeft = panel.align === 'left';
      const miniProducts = getPanelProducts(pi === 0 ? panel1Products : panel2Products, panel);

      return (
        <div
          key={panel.id}
          className="flex flex-col lg:flex-row"
          style={{ background: panel.bg, minHeight: '540px' }}
        >
          {/* ── Model photo column with jewelry chips overlaid ── */}
          <motion.div
            initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`relative w-full lg:w-[48%] overflow-hidden flex-shrink-0 ${isLeft ? 'lg:order-1' : 'lg:order-2'}`}
            style={{ minHeight: '480px' }}
          >
            {/* Model image */}
            <img
              src={panel.modelImage}
              alt={panel.eyebrow}
              className="absolute inset-0 w-full h-full object-cover object-top"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                if (panel.modelUnsplash && e.target.src !== panel.modelUnsplash) {
                  e.target.src = panel.modelUnsplash;
                } else {
                  e.target.style.display = 'none';
                  e.target.parentNode.style.background = panel.modelFallback;
                }
              }}
            />

            {/* Fade edge toward content */}
            <div
              className="absolute inset-0 pointer-events-none hidden lg:block"
              style={{
                background: isLeft
                  ? `linear-gradient(to right, transparent 65%, ${panel.bg} 100%)`
                  : `linear-gradient(to left, transparent 65%, ${panel.bg} 100%)`,
              }}
            />
          </motion.div>

          {/* ── Content column ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className={`flex-1 flex flex-col justify-center px-8 py-14 lg:py-16 lg:px-14 ${isLeft ? 'lg:order-2' : 'lg:order-1'}`}
          >
            <span
              className="block text-[10px] font-bold uppercase tracking-[0.35em] mb-4"
              style={{ color: panel.accent }}
            >
              {panel.eyebrow}
            </span>

            <h2
              className="font-heading font-bold text-gray-900 mb-4 leading-tight"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', whiteSpace: 'pre-line' }}
            >
              {panel.heading}
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs tracking-wide">
              {panel.sub}
            </p>

            {/* 2×2 product grid on content side */}
            <div className="grid grid-cols-2 gap-3 mb-8" style={{ maxWidth: '300px' }}>
              {miniProducts.map(({ product, label }, mi) =>
                product ? (
                  <Link key={mi} to={`/products/${product.slug}`} className="group block">
                    <div className="rounded-xl overflow-hidden aspect-square bg-white/60 shadow-sm group-hover:shadow-md transition-all">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100" />
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mt-1.5 truncate">{label}</p>
                  </Link>
                ) : (
                  <div key={mi}>
                    <div className="rounded-xl aspect-square bg-gray-100 animate-pulse" />
                    <div className="h-2 mt-2 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                )
              )}
            </div>

            <Link
              to={panel.link}
              className="inline-flex items-center gap-2.5 font-bold uppercase text-[11px] tracking-[0.22em] border-b-2 pb-0.5 w-fit transition-all duration-200 hover:gap-4"
              style={{ color: panel.accent, borderColor: panel.accent }}
            >
              Explore Collection
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      );
    })}
  </section>
  );
};

// ─── STORES SLIDER ────────────────────────────────────────────────────────────
const STORE_FALLBACKS = [
  { bg: 'linear-gradient(135deg,#1c1209 0%,#3a2010 60%,#2d1b10 100%)', name: 'FLAGSHIP STORE — MUMBAI', city: 'Bandra West, Mumbai' },
  { bg: 'linear-gradient(135deg,#0d1117 0%,#1a2744 60%,#0d1b2a 100%)', name: 'EXPERIENCE CENTRE — PUNE', city: 'Koregaon Park, Pune' },
  { bg: 'linear-gradient(135deg,#1a0e08 0%,#3d2312 60%,#2a180c 100%)', name: 'BOUTIQUE — BANGALORE', city: 'Indiranagar, Bangalore' },
];

const StoresSection = ({ stores, cmsContent }) => {
  // Priority: CMS stores → DB stores → gradient fallbacks
  const cmsStores = cmsContent?.stores?.filter((s) => s.name || s.image);
  const items = cmsStores?.length
    ? cmsStores
    : stores?.length
    ? stores
    : STORE_FALLBACKS;

  const total = items.length;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
  };
  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [total]);
  const go = (idx) => { setCurrent((idx + total) % total); resetTimer(); };

  return (
    <section className="py-16 bg-[#faf7f4]">
      <div className="container-luxury">

        <div className="mb-10">
          <PillHeading title={cmsContent?.title || 'VISIT OUR STORES'} subtitle={cmsContent?.subtitle || 'Experience Jewelry in Person'} simple />
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '16/7' }}>
          {items.map((store, i) => (
            <motion.div
              key={i}
              animate={{ opacity: i === current ? 1 : 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
              style={{ pointerEvents: i === current ? 'auto' : 'none' }}
            >
              {store.image
                ? <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: store.bg }} />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 p-8 text-center z-10">
                <p className="font-heading font-bold text-white uppercase mb-1.5"
                  style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', letterSpacing: '0.12em' }}>
                  {(store.name || '').toUpperCase()}
                </p>
                {store.city && (
                  <p className="text-white/70 text-xs tracking-widest uppercase mb-5" style={{ letterSpacing: '0.2em' }}>{store.city}</p>
                )}
                <Link
                  to={store.slug ? `/stores/${store.slug}` : '/stores'}
                  className="inline-block bg-white text-gray-900 font-semibold text-[11px] uppercase tracking-widest px-8 py-2.5 hover:bg-white/90 transition-colors mt-4"
                  style={{ letterSpacing: '0.14em' }}
                >
                  SHOP NOW
                </Link>
              </div>
            </motion.div>
          ))}

          {total > 1 && (
            <>
              <button onClick={() => go(current - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow transition-all">
                <ChevronLeftIcon />
              </button>
              <button onClick={() => go(current + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow transition-all">
                <ChevronRightIcon />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
const NEWSLETTER_PERKS = [
  { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>, label: 'Early Access to New Collections' },
  { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z" /></svg>, label: 'Members-Only Deals & Offers' },
  { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>, label: 'Style Tips & Jewelry Guides' },
];

const Newsletter = ({ cmsContent }) => {
  const eyebrow     = cmsContent?.eyebrow     || 'Stay Updated';
  const heading     = cmsContent?.heading     || 'Subscribe to\nOur Emails';
  const subtitle    = cmsContent?.subtitle    || 'Be the first to know about exclusive offers, new arrivals, and insider access to our latest collections.';
  const cardHeading = cmsContent?.cardHeading || 'Join the Inner Circle';
  const perks       = cmsContent?.perks?.length ? cmsContent.perks : NEWSLETTER_PERKS;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); if (email) setSent(true); };

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#120c07 0%,#1e1409 50%,#140e08 100%)' }}>

      {/* Faint diagonal texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.022]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#C9A84C 0,#C9A84C 1px,transparent 0,transparent 50%)', backgroundSize: '22px 22px' }} />

      {/* Giant faint diamond bg shape */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-[600px] h-[600px] opacity-[0.03]" fill="none">
          <path d="M200 20 L380 200 L200 380 L20 200 Z" stroke="#C9A84C" strokeWidth="1" fill="#C9A84C" />
        </svg>
      </div>

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(183,110,121,0.08) 0%,transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%)' }} />

      <div className="container-luxury relative z-10 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[360px]">

          {/* ── Left: Text + perks ── */}
          <div className="flex flex-col justify-center py-16 lg:py-20 lg:pr-16">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.5)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: '#c9a84c' }}>
                {eyebrow}
              </span>
            </div>

            {/* Heading */}
            <h2
              className="font-heading font-bold text-white uppercase mb-4 leading-tight"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', letterSpacing: '0.1em', whiteSpace: 'pre-line' }}
            >
              {heading}
            </h2>

            <p className="mb-8 leading-relaxed" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.4)', maxWidth: '380px' }}>
              {subtitle}
            </p>

            {/* Perks list */}
            <div className="space-y-3">
              {perks.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                    {p.icon || (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12.5px] tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px"
            style={{ background: 'linear-gradient(to bottom,transparent,rgba(201,168,76,0.2),transparent)' }} />

          {/* ── Right: Form card ── */}
          <div className="flex flex-col justify-center py-16 lg:py-20 lg:pl-16">
            <div className="rounded-2xl p-8 lg:p-10"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.14)', backdropFilter: 'blur(12px)' }}>

              {/* Card heading */}
              <div className="mb-7">
                <svg viewBox="0 0 32 32" className="w-7 h-7 mb-4" fill="none">
                  <path d="M16 3 L29 16 L16 29 L3 16 Z" stroke="#C9A84C" strokeWidth="1.2" fill="rgba(201,168,76,0.1)" />
                  <path d="M16 8 L24 16 L16 24 L8 16 Z" stroke="#C9A84C" strokeWidth="0.6" fill="rgba(201,168,76,0.06)" />
                </svg>
                <h3 className="font-heading font-bold text-white text-lg" style={{ letterSpacing: '0.06em' }}>
                  {cardHeading}
                </h3>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>

              {sent ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#C9A84C" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold tracking-wider text-sm" style={{ color: '#c9a84c', letterSpacing: '0.1em' }}>
                    Welcome to the Inner Circle!
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    You'll hear from us soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    required
                    className="w-full px-5 py-3.5 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(201,168,76,0.2)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.5)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.2)'; }}
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.18em] transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#c9a84c 0%,#b8923a 100%)', color: '#120c07' }}
                  >
                    Subscribe
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// ─── FAQ SECTION ──────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    label: 'Orders & Delivery',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
      </svg>
    ),
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days. Express delivery (2–3 days) is available at checkout for most pincodes.' },
      { q: 'Can I track my order?', a: 'Yes. Once shipped, you will receive an SMS and email with a tracking link to monitor your delivery in real time.' },
      { q: 'Do you ship internationally?', a: 'Currently we ship across India. International shipping is coming soon — register your interest at the bottom of the page.' },
      { q: 'Is the packaging discreet and secure?', a: 'All orders are shipped in tamper-proof, branded packaging with extra cushioning to ensure your jewellery arrives safely.' },
    ],
  },
  {
    label: 'Products & Materials',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-4-4H8L4 7m16 0H4m16 0l-2 11H6L4 7" />
      </svg>
    ),
    items: [
      { q: 'Are your diamonds lab-grown or natural?', a: 'We offer both lab-grown and natural diamonds. Each product listing clearly specifies the diamond type, grade, and certification.' },
      { q: 'What purity of gold do you use?', a: 'We use 18KT, 22KT, and 9KT gold. The karat is specified on every product page and hallmarked as per BIS standards.' },
      { q: 'Do your products come with certification?', a: "Yes. All diamond jewellery comes with a certificate from a recognised gemological lab (IGI, GIA, or SGL) confirming the stone's quality." },
      { q: 'Can I customise a design?', a: 'Absolutely. Visit any of our stores or contact our team online to request bespoke jewellery crafted to your exact specifications.' },
    ],
  },
  {
    label: 'Returns & Exchange',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    items: [
      { q: 'What is your return policy?', a: 'We offer a 15-day hassle-free return policy for all unused, unworn products in original packaging with tags intact.' },
      { q: 'How do I initiate a return or exchange?', a: 'Log in to your account, go to My Orders, and click "Return / Exchange". Our team will arrange a free pickup within 48 hours.' },
      { q: 'Can I exchange for a different design?', a: 'Yes. You can exchange for any design of equal or higher value. Any price difference is payable at the time of exchange.' },
      { q: 'Are custom orders eligible for return?', a: 'Custom and personalised orders are non-returnable unless there is a manufacturing defect or damage during delivery.' },
    ],
  },
  {
    label: 'Payments & Offers',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI, net banking, wallets, and EMI options through leading banks.' },
      { q: 'Is it safe to pay online?', a: 'Yes. All transactions are processed over a 256-bit SSL-encrypted gateway. We never store your card details.' },
      { q: 'Are there any EMI options?', a: 'No-cost EMI is available on orders above ₹10,000 with select banks. EMI options are shown at checkout based on your card.' },
      { q: 'How can I apply a promo code?', a: 'Enter your promo code in the "Apply Coupon" field at checkout. Only one code can be applied per order.' },
    ],
  },
  {
    label: 'Store & Experience',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    items: [
      { q: 'Where are your stores located?', a: 'We have experience centres across major cities. Use the "Store Nearby" button in the header to find the closest one to you.' },
      { q: 'Do I need an appointment to visit?', a: 'Walk-ins are always welcome. However, booking an appointment ensures dedicated advisor time and priority access to our full collection.' },
      { q: 'What services are offered in-store?', a: 'In-store services include diamond carat testing, free jewellery cleaning, old gold exchange, and our Vault of Dreams savings plan.' },
      { q: 'Can I try jewellery before buying?', a: 'Yes. Our stores have a full try-on experience. Our advisors will help you find the perfect piece at your own pace.' },
    ],
  },
];

const FAQSection = ({ cmsContent }) => {
  const categories = cmsContent?.categories?.length ? cmsContent.categories : FAQ_CATEGORIES;
  const faqHeading  = cmsContent?.heading  || 'Browse by Category';
  const faqSubtitle = cmsContent?.subtitle || 'Select a topic to view related questions';
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(null);

  const handleTab = (idx) => { setActiveTab(idx); setOpen(null); };

  const active = categories[activeTab] || categories[0];

  return (
    <section className="py-16 bg-white">
      <div className="container-luxury">

        {/* Heading */}
        <div className="text-center mb-10">
          <h2
            className="font-heading font-bold text-gray-900"
            style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.9rem)', letterSpacing: '0.06em' }}
          >
            {faqHeading}
          </h2>
          <p className="text-gray-400 text-sm mt-2">{faqSubtitle}</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => handleTab(i)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                activeTab === i
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'
              }`}
              style={activeTab === i ? { background: '#5a413f' } : {}}
            >
              <span className={activeTab === i ? 'text-white' : 'text-gray-400'}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Active category header bar */}
        <div className="max-w-3xl mx-auto mb-4">
          <div
            className="flex items-center justify-between px-5 py-4 rounded-xl"
            style={{ background: '#5a413f' }}
          >
            <div className="flex items-center gap-3 text-white">
              <span className="opacity-80">{active.icon}</span>
              <span className="font-heading font-semibold text-[15px] tracking-wide">{active.label}</span>
            </div>
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              {active.items.length} Questions
            </span>
          </div>
        </div>

        {/* Accordion items */}
        <div className="max-w-3xl mx-auto space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {active.items.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded-xl overflow-hidden transition-colors duration-200"
                  style={{ borderColor: open === idx ? 'rgba(90,65,63,0.25)' : '#e5e7eb' }}
                >
                  <button
                    onClick={() => setOpen(open === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                  >
                    <span className="text-[13.5px] font-medium text-gray-700 leading-snug">
                      {faq.q}
                    </span>
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                      style={{
                        background: open === idx ? '#5a413f' : 'transparent',
                        border: open === idx ? '1px solid #5a413f' : '1px solid #d1d5db',
                        color: open === idx ? '#fff' : '#9ca3af',
                      }}
                    >
                      <svg className="w-3.5 h-3.5 transition-transform duration-200" style={{ transform: open === idx ? 'rotate(45deg)' : 'none' }}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence>
                    {open === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-[13px] text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

// ─── BLOG SECTION ─────────────────────────────────────────────────────────────
const BLOG_FALLBACK = [
  { _id: 'b1', title: 'How to Choose the Perfect Engagement Ring', slug: 'how-to-choose-engagement-ring', category: 'ENGAGEMENT RING', imageTitle: 'Choosing the\nPerfect Ring', bg: 'linear-gradient(145deg,#c4a882 0%,#a0826a 100%)' },
  { _id: 'b2', title: 'Understanding Diamond Quality: The 4 Cs Explained', slug: 'diamond-4cs-quality-guide', category: 'EDUCATION', imageTitle: 'Diamond Quality\nThe 4 Cs', bg: 'linear-gradient(145deg,#1e1e2e 0%,#2d2d4e 100%)' },
  { _id: 'b3', title: 'Gold Purity Guide: 18KT vs 22KT vs 24KT', slug: 'gold-purity-guide-18kt-22kt', category: 'EDUCATION', imageTitle: '18KT vs 22KT\nGold Guide', bg: 'linear-gradient(145deg,#c8a84c 0%,#9c7e2a 100%)' },
  { _id: 'b4', title: 'Bridal Jewelry Trends to Watch in 2026', slug: 'bridal-jewelry-trends-2026', category: 'BRIDAL', imageTitle: 'Bridal Jewelry\nTrends 2026', bg: 'linear-gradient(145deg,#e8d5c0 0%,#d0b898 100%)' },
];

const BlogSection = ({ blogs, cmsContent }) => {
  const posts = (blogs?.length ? blogs : BLOG_FALLBACK).slice(0, 4);
  const eyebrow = cmsContent?.eyebrow || 'JEWELRY BLOG';
  const title   = cmsContent?.title   || 'Where Craft Inspires Conversation';
  const subtitle = cmsContent?.subtitle || 'Expert Guides & Style Inspiration';

  return (
    <section className="py-16 bg-[#faf7f4]">
      <div className="container-luxury">

        {/* Heading */}
        <div className="text-center mb-12">
          <span className="block text-[10px] font-bold uppercase tracking-[0.32em] mb-3" style={{ color: '#c9a84c' }}>
            {subtitle}
          </span>
          <h2
            className="font-heading font-bold text-gray-900 uppercase"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.7rem)', letterSpacing: '0.14em' }}
          >
            {eyebrow}
          </h2>
          <p className="text-[13.5px] text-gray-500 mt-2 tracking-wide">
            {title}
          </p>
        </div>

        {/* Grid — 4 cols */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {posts.map((post, i) => (
            <motion.div
              key={post._id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                {/* Card image */}
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {post.image ? (
                    <>
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="w-full h-full" style={{ background: post.bg || 'linear-gradient(145deg,#c4a882 0%,#a08060 100%)' }} />
                  )}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  {post.image ? (
                    <div className="absolute bottom-0 inset-x-0 p-4 z-10">
                      <p className="font-heading italic text-white leading-snug" style={{ fontSize: 'clamp(0.8rem, 1.4vw, 1rem)', whiteSpace: 'pre-line' }}>
                        {post.imageTitle || post.title}
                      </p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      <p className="font-heading italic text-center leading-snug"
                        style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)', color: post.bg?.includes('1e1e') || post.bg?.includes('2d1b') ? '#fff' : '#2a1a0a', whiteSpace: 'pre-line' }}>
                        {post.imageTitle || post.title}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="font-heading font-bold text-gray-900 text-[12px] sm:text-[13px] uppercase leading-snug line-clamp-2 flex-1" style={{ letterSpacing: '0.04em' }}>
                    {post.title}
                  </h3>
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All button */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2.5 px-10 py-3.5 text-xs font-bold uppercase tracking-widest border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded-full"
            style={{ letterSpacing: '0.18em' }}
          >
            View All Articles <ArrowRightIcon />
          </Link>
        </div>

      </div>
    </section>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [lifestyle1Products, setLifestyle1Products] = useState([]);
  const [lifestyle2Products, setLifestyle2Products] = useState([]);
  const [stores, setStores] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [cmsSections, setCmsSections] = useState({});
  const [siteImages, setSiteImages] = useState({});

  useEffect(() => {
    const load = async () => {
      const [bannersRes, categoriesRes, featuredRes, dealsRes, sectionsRes, storesRes, blogsRes, ls1Res, ls2Res, siteImagesRes] = await Promise.allSettled([
        cmsAPI.getBanners('hero'),
        categoryAPI.getAll({ parent: 'null' }),
        productAPI.getAll({ limit: 60, isFeatured: true, sort: 'rating' }),
        productAPI.getAll({ limit: 8, isBestSeller: true, sort: 'popular' }),
        cmsAPI.getPageSections('home'),
        storeAPI.getStores(),
        blogAPI.getAll({ featured: 'true', limit: 4 }),
        productAPI.getAll({ limit: 4, isLifestyle1: true }),
        productAPI.getAll({ limit: 4, isLifestyle2: true }),
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/settings/site-images`).then((r) => r.json()),
      ]);
      if (siteImagesRes.status === 'fulfilled' && siteImagesRes.value?.success) {
        setSiteImages(siteImagesRes.value.data || {});
      }
      if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.data.data || []);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data.data || []);
      const featured = featuredRes.status === 'fulfilled' ? (featuredRes.value.data.data || []) : [];
      setFeaturedProducts(featured);
      const deals = dealsRes.status === 'fulfilled' ? (dealsRes.value.data.data || []) : [];
      // Fall back to featured products if no "Deal of Week" segment products exist yet
      setDealProducts(deals.length >= 4 ? deals.slice(0, 8) : featured.slice(0, 8));
      if (storesRes.status === 'fulfilled') setStores(storesRes.value.data.data || []);
      if (ls1Res.status === 'fulfilled') setLifestyle1Products(ls1Res.value.data.data || []);
      if (ls2Res.status === 'fulfilled') setLifestyle2Products(ls2Res.value.data.data || []);
      // Use featured blogs; if admin hasn't featured any, fall back to latest 4
      const featuredBlogs = blogsRes.status === 'fulfilled' ? (blogsRes.value.data.data || []) : [];
      if (featuredBlogs.length > 0) {
        setBlogs(featuredBlogs);
      } else {
        try {
          const latestRes = await blogAPI.getAll({ limit: 4 });
          setBlogs(latestRes.data.data || []);
        } catch { /* keep empty, fallback renders */ }
      }
      if (sectionsRes.status === 'fulfilled') {
        const sections = sectionsRes.value.data.data || [];
        const byType = {};
        sections.forEach((s) => {
          if (s.isActive !== false) byType[s.sectionType] = s.content;
        });
        setCmsSections(byType);
      }
    };
    load();
  }, []);

  return (
    <>
      <Helmet>
        <title>Luxury Jewelry — Premium Diamond & Gold Jewelry Marketplace</title>
        <meta name="description" content="Discover premium lab-grown diamond jewelry, gold rings, earrings, necklaces and more." />
      </Helmet>

      <HeroBanner banners={banners} />
      <TrustBar cmsContent={cmsSections.trust_bar} />
      <CategoryGrid categories={categories} cmsContent={cmsSections.category_grid} />
      <DealsSection products={dealProducts} cmsContent={cmsSections.deals} />
      <WhyChooseSection cmsContent={cmsSections.why_choose} siteImages={siteImages} />
      <LifestyleLookbookSection
        panel1Products={lifestyle1Products}
        panel2Products={lifestyle2Products}
        fallbackProducts={featuredProducts}
        cmsContent={cmsSections.lifestyle_lookbook}
        siteImages={siteImages}
      />
      <FeaturedProducts
        products={featuredProducts}
        title="SHOP BEST JEWELRY"
        subtitle="Crafted for your everyday lifestyle"
        cmsContent={cmsSections.featured_products}
      />
      <DiamondCutsSection cmsContent={cmsSections.diamond_cuts} />
      <StoresSection stores={stores} cmsContent={cmsSections.visit_stores} />
      <GiftingSection cmsContent={cmsSections.gifting} />
      <BlogSection blogs={blogs} cmsContent={cmsSections.blog_section} />
      <ServicesSection cmsContent={cmsSections.services} />
      <Newsletter cmsContent={cmsSections.newsletter} />
      <FAQSection cmsContent={cmsSections.faq} />
    </>
  );
}
