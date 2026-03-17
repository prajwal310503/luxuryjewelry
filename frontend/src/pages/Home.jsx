import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { cmsAPI, productAPI, categoryAPI, storeAPI, blogAPI } from '../services/api';
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

// ─── CATEGORY GRID ────────────────────────────────────────────────────────────
const CategoryGrid = ({ categories, cmsContent }) => {
  if (!categories?.length) return null;
  const heading = cmsContent?.title || 'SHOP BY JEWELRY CATEGORY';
  const subtitle = cmsContent?.subtitle || 'Jewelry for Every Moment';
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {categories.slice(0, 6).map((cat, idx) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
            >
              <Link to={`/collections/${cat.slug}`} className="group block">
                <div
                  className="relative w-full overflow-hidden transition-all duration-500 ease-in-out group-hover:[border-radius:40px]"
                  style={{ aspectRatio: '2 / 3', background: '#f5ede4', borderRadius: '16px' }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <RingIcon />
                    </div>
                  )}
                </div>
                <p
                  className="text-center text-[11px] font-semibold text-gray-800 uppercase mt-3 tracking-widest group-hover:text-primary transition-colors duration-300"
                  style={{ letterSpacing: '0.18em' }}
                >
                  {cat.name}
                </p>
              </Link>
            </motion.div>
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
          <Link
            to="/collections"
            className="hidden sm:flex items-center gap-2 text-xs font-semibold text-primary hover:text-gold transition-colors tracking-widest uppercase"
            style={{ letterSpacing: '0.16em' }}
          >
            View All <ArrowRightIcon />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary tracking-widest uppercase border-b border-primary pb-0.5"
            style={{ letterSpacing: '0.16em' }}
          >
            View All <ArrowRightIcon />
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
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="skeleton w-full rounded-xl" style={{ aspectRatio: '1/1' }} />
                <div className="skeleton h-3 mt-3 rounded-full w-3/4" />
                <div className="skeleton h-3 mt-2 rounded-full w-1/2" />
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
    title: 'FAST & SECURE SHIPPING',
    subtitle: 'Your Excitement, Our Priority',
    link: '#',
    image: '',
    bg: 'linear-gradient(145deg, #1c1c2e 0%, #2d2d44 100%)',
  },
  {
    title: 'VAULT OF DREAMS',
    subtitle: 'Complete 9, Unlock the Shine',
    link: '#',
    image: '',
    bg: 'linear-gradient(145deg, #0d1117 0%, #1a1a2e 100%)',
  },
  {
    title: 'VIRTUAL CONSULTATION',
    subtitle: 'See it, Love it, Buy it',
    link: '#',
    image: '',
    bg: 'linear-gradient(145deg, #1a2744 0%, #0d1b2a 100%)',
  },
  {
    title: 'BESPOKE DESIGNS',
    subtitle: 'Handcrafted to Perfection',
    link: '#',
    image: '',
    bg: 'linear-gradient(145deg, #2c1810 0%, #1a0e08 100%)',
  },
];

const WhyChooseSection = ({ cmsContent }) => {
  const heading  = cmsContent?.title    || 'WHY CHOOSE OUR JEWELRY?';
  const subtitle = cmsContent?.subtitle || 'Custom designs, Video consults, Fast delivery';
  const items    = cmsContent?.items?.length ? cmsContent.items : WHY_CHOOSE_FALLBACK;

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
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

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
const DIAMOND_CUTS_DATA = [
  { name: 'EMERALD',  slug: 'emerald'  },
  { name: 'OVAL',     slug: 'oval'     },
  { name: 'CUSHION',  slug: 'cushion'  },
  { name: 'ROUND',    slug: 'round'    },
  { name: 'PRINCESS', slug: 'princess' },
  { name: 'PEAR',     slug: 'pear'     },
  { name: 'MARQUISE', slug: 'marquise' },
  { name: 'HEART',    slug: 'heart'    },
];

const DiamondShapeSVG = ({ shape }) => {
  const c = '#b08070';
  const sp = { stroke: c, strokeWidth: 1.6, fill: 'rgba(176,128,112,0.08)', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const line = { stroke: c, strokeWidth: 0.8, opacity: 0.3 };

  const paths = {
    round: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="23" {...sp} />
        <polygon points="30,7 50,19 50,41 30,53 10,41 10,19" fill="none" stroke={c} strokeWidth="0.9" opacity={0.25}/>
        <line x1="30" y1="7" x2="30" y2="53" {...line}/>
        <line x1="10" y1="19" x2="50" y2="41" {...line}/>
        <line x1="50" y1="19" x2="10" y2="41" {...line}/>
      </svg>
    ),
    oval: (
      <svg viewBox="0 0 48 70" className="w-full h-full">
        <ellipse cx="24" cy="35" rx="19" ry="30" {...sp}/>
        <line x1="24" y1="5" x2="24" y2="65" {...line}/>
        <line x1="5" y1="35" x2="43" y2="35" {...line}/>
        <ellipse cx="24" cy="35" rx="10" ry="16" fill="none" stroke={c} strokeWidth="0.8" opacity={0.22}/>
      </svg>
    ),
    cushion: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <path d="M18,6 L42,6 Q54,6 54,18 L54,42 Q54,54 42,54 L18,54 Q6,54 6,42 L6,18 Q6,6 18,6Z" {...sp}/>
        <line x1="30" y1="6" x2="30" y2="54" {...line}/>
        <line x1="6" y1="30" x2="54" y2="30" {...line}/>
        <line x1="14" y1="14" x2="46" y2="46" {...line}/>
        <line x1="46" y1="14" x2="14" y2="46" {...line}/>
      </svg>
    ),
    princess: (
      <svg viewBox="0 0 58 58" className="w-full h-full">
        <rect x="7" y="7" width="44" height="44" {...sp}/>
        <line x1="7" y1="7" x2="51" y2="51" {...line}/>
        <line x1="51" y1="7" x2="7" y2="51" {...line}/>
        <line x1="29" y1="7" x2="29" y2="51" {...line}/>
        <line x1="7" y1="29" x2="51" y2="29" {...line}/>
      </svg>
    ),
    emerald: (
      <svg viewBox="0 0 50 70" className="w-full h-full">
        <polygon points="14,4 36,4 46,14 46,56 36,66 14,66 4,56 4,14" {...sp}/>
        <polygon points="17,12 33,12 40,19 40,51 33,58 17,58 10,51 10,19" fill="none" stroke={c} strokeWidth="0.8" opacity={0.25}/>
        <line x1="4" y1="35" x2="46" y2="35" {...line}/>
        <line x1="4" y1="24" x2="46" y2="24" stroke={c} strokeWidth="0.6" opacity={0.2}/>
        <line x1="4" y1="46" x2="46" y2="46" stroke={c} strokeWidth="0.6" opacity={0.2}/>
      </svg>
    ),
    pear: (
      <svg viewBox="0 0 50 76" className="w-full h-full">
        <path d="M25,70 C8,62 2,50 2,38 C2,20 12,8 25,5 C38,8 48,20 48,38 C48,50 42,62 25,70Z" {...sp}/>
        <line x1="25" y1="5" x2="25" y2="70" {...line}/>
        <line x1="3" y1="38" x2="47" y2="38" {...line}/>
        <ellipse cx="25" cy="30" rx="12" ry="17" fill="none" stroke={c} strokeWidth="0.7" opacity={0.22}/>
      </svg>
    ),
    marquise: (
      <svg viewBox="0 0 80 42" className="w-full h-full">
        <path d="M40,4 C56,4 76,18 76,21 C76,24 56,38 40,38 C24,38 4,24 4,21 C4,18 24,4 40,4Z" {...sp}/>
        <line x1="4" y1="21" x2="76" y2="21" {...line}/>
        <line x1="40" y1="4" x2="40" y2="38" {...line}/>
        <ellipse cx="40" cy="21" rx="18" ry="10" fill="none" stroke={c} strokeWidth="0.7" opacity={0.22}/>
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 62 62" className="w-full h-full">
        <path d="M31,54 C31,54 5,37 5,21 C5,12 12,5 21,6 C25,6.5 29,9.5 31,14 C33,9.5 37,6.5 41,6 C50,5 57,12 57,21 C57,37 31,54 31,54Z" {...sp}/>
        <line x1="31" y1="14" x2="31" y2="54" {...line}/>
        <line x1="8" y1="22" x2="54" y2="22" {...line}/>
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
  { title: 'GIFTS FOR WIFE', slug: 'gifts-for-wife', bg: 'linear-gradient(145deg,#1a0808 0%,#3d1212 50%,#2a0c0c 100%)' },
  { title: 'ANNIVERSARY GIFTS', slug: 'anniversary-gifts', bg: 'linear-gradient(145deg,#08081a 0%,#12123d 50%,#0c0c2a 100%)' },
  { title: 'BIRTHDAY GIFTS', slug: 'birthday-gifts', bg: 'linear-gradient(145deg,#1a0812 0%,#3d1225 50%,#2a0c1a 100%)' },
  { title: 'ENGAGEMENT GIFTS', slug: 'engagement-gifts', bg: 'linear-gradient(145deg,#08140a 0%,#12301a 50%,#0c2010 100%)' },
  { title: 'GIFTS FOR HER', slug: 'gifts-for-her', bg: 'linear-gradient(145deg,#1a0e08 0%,#3d2312 50%,#2a180c 100%)' },
];

const GiftingSection = ({ cmsContent }) => {
  const budgets   = cmsContent?.budgets?.length   ? cmsContent.budgets   : GIFT_BUDGETS;
  const occasions = cmsContent?.occasions?.length ? cmsContent.occasions : GIFT_OCCASIONS;
  const heading   = cmsContent?.heading || 'Gift what lasts beyond the vows.';
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
              className="font-heading italic text-gray-800 mb-9 leading-snug"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {heading}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {budgets.map(({ label, slug }) => (
                <Link
                  key={slug}
                  to={`/collections/${slug}`}
                  className="group block bg-[#fafafa] hover:bg-white border border-gray-100 hover:border-red-200 hover:shadow-lg rounded-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Ribbon cross */}
                  <div className="relative" style={{ paddingTop: '60%' }}>
                    {/* Horizontal band */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-red-500/70" />
                    {/* Vertical band */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-red-500/70" />
                    {/* Bow centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BowSVG />
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="mx-5 h-[2px] bg-red-500/60" />

                  <div className="px-3 py-4 text-center">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">GIFT UNDER</p>
                    <p
                      className="font-heading font-bold text-red-500 group-hover:text-red-600 transition-colors"
                      style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)' }}
                    >
                      {label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right — occasion slider */}
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {occasions.map((occ, i) => (
              <motion.div
                key={occ.slug}
                animate={{ opacity: i === current ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
                style={{ pointerEvents: i === current ? 'auto' : 'none' }}
              >
                {occ.image
                  ? <img src={occ.image} alt={occ.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: occ.bg }} />
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

            {/* Dots */}
            <div className="absolute bottom-5 left-5 z-10 flex gap-1.5">
              {GIFT_OCCASIONS.map((_, i) => (
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

// ─── DIAMOND CUTS SECTION ─────────────────────────────────────────────────────
const DiamondCutsSection = ({ cmsContent }) => {
  const heading  = cmsContent?.title    || 'EXPLORE OUR DIAMOND CUTS';
  const subtitle = cmsContent?.subtitle || 'Where Geometry Elevates Style';
  const cuts = cmsContent?.items?.length ? cmsContent.items : DIAMOND_CUTS_DATA;

  return (
    <section className="py-16 bg-[#faf7f4]">
      <div className="container-luxury">

        <div className="mb-12">
          <PillHeading title={heading} subtitle={subtitle} simple />
        </div>

        {/* Scrollable on mobile, 8-col grid on sm+ */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-8 sm:gap-4 sm:overflow-visible scrollbar-none">
          {cuts.map((cut, i) => {
            const slug = cut.slug || cut.name?.toLowerCase?.() || '';
            return (
              <motion.div
                key={slug || i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex-shrink-0 w-[88px] sm:w-auto"
              >
                <Link
                  to={`/collections?cut=${slug}`}
                  className="group flex flex-col items-center gap-3"
                >
                  <div
                    className="relative w-[76px] h-[76px] sm:w-full sm:aspect-square rounded-full bg-white group-hover:bg-luxury-cream border border-gray-200/70 group-hover:border-primary/30 transition-all duration-300 shadow-sm group-hover:shadow-md flex items-center justify-center overflow-hidden"
                    style={{ maxWidth: '96px', maxHeight: '96px', padding: cut.image ? '0' : '18px' }}
                  >
                    {cut.image
                      ? <img src={cut.image} alt={cut.name} className="w-full h-full object-cover" />
                      : <DiamondShapeSVG shape={slug} />
                    }
                    <div className="absolute inset-0 rounded-full ring-0 group-hover:ring-2 ring-primary/20 transition-all duration-300" />
                  </div>
                  <p
                    className="text-[9.5px] font-semibold text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors duration-300 text-center whitespace-nowrap"
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

// ─── STORES SLIDER ────────────────────────────────────────────────────────────
const STORE_FALLBACKS = [
  { bg: 'linear-gradient(135deg,#1c1209 0%,#3a2010 60%,#2d1b10 100%)', name: 'OUR FLAGSHIP STORE', city: 'Coming Soon' },
  { bg: 'linear-gradient(135deg,#0d1117 0%,#1a2744 60%,#0d1b2a 100%)', name: 'EXPERIENCE CENTRE', city: 'Opening Soon' },
];

const StoresSection = ({ stores }) => {
  const items = stores?.length ? stores : null;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const total = items ? items.length : STORE_FALLBACKS.length;

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
          <PillHeading title="VISIT OUR STORES" subtitle="Experience Jewelry in Person" simple />
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '16/7' }}>
          {(items || STORE_FALLBACKS).map((store, i) => {
            const isFallback = !items;
            return (
              <motion.div
                key={store._id || i}
                animate={{ opacity: i === current ? 1 : 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
                style={{ pointerEvents: i === current ? 'auto' : 'none' }}
              >
                {/* Image / gradient */}
                {store.image
                  ? <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: store.bg || 'linear-gradient(135deg,#1c1209 0%,#2d1b10 100%)' }} />
                }
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-8 text-center z-10">
                  <p
                    className="font-heading font-bold text-white uppercase mb-1.5"
                    style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', letterSpacing: '0.12em' }}
                  >
                    {isFallback ? 'EXPERIENCE OUR STORE' : `EXPERIENCE ${(store.name || '').toUpperCase()} IN ${(store.city || '').toUpperCase()}`}
                  </p>
                  {store.city && (
                    <p className="text-white/70 text-xs tracking-widest uppercase mb-5" style={{ letterSpacing: '0.2em' }}>
                      {store.city}
                    </p>
                  )}
                  {!isFallback ? (
                    <Link
                      to={`/stores/${store.slug}`}
                      className="inline-block bg-white text-gray-900 font-semibold text-[11px] uppercase tracking-widest px-8 py-2.5 hover:bg-white/90 transition-colors"
                      style={{ letterSpacing: '0.14em' }}
                    >
                      SHOP NOW
                    </Link>
                  ) : (
                    <Link
                      to="/stores"
                      className="inline-block bg-white text-gray-900 font-semibold text-[11px] uppercase tracking-widest px-8 py-2.5 hover:bg-white/90 transition-colors"
                      style={{ letterSpacing: '0.14em' }}
                    >
                      VIEW STORES
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Prev / Next */}
          {total > 1 && (
            <>
              <button
                onClick={() => go(current - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow transition-all"
              >
                <ChevronLeftIcon />
              </button>
              <button
                onClick={() => go(current + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow transition-all"
              >
                <ChevronRightIcon />
              </button>
            </>
          )}

          {/* Dots */}
          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {stores.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Store name pills below slider */}
        {total > 1 && items && (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {items.map((store, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`text-[10px] font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all duration-200 ${
                  i === current
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 text-gray-500 hover:border-primary/40 hover:text-primary'
                }`}
                style={{ letterSpacing: '0.12em' }}
              >
                {store.name}
              </button>
            ))}
          </div>
        )}

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
  {
    _id: 'b1', title: 'What Are Engagement Ring Trends in 2026', slug: 'engagement-ring-trends-2026',
    category: 'ENGAGEMENT RING', imageTitle: 'Engagement Ring\nTrend in 2026',
    bg: 'linear-gradient(145deg,#c4a882 0%,#a0826a 100%)',
  },
  {
    _id: 'b2', title: 'How To Measure Your Ring Size', slug: 'how-to-measure-ring-size',
    category: 'EDUCATION', imageTitle: 'How To Measure\nRing Size',
    bg: 'linear-gradient(145deg,#1e1e2e 0%,#2d2d4e 100%)',
  },
  {
    _id: 'b3', title: 'Diamond Eternity Ring Guide', slug: 'diamond-eternity-ring-guide',
    category: 'EDUCATION', imageTitle: 'Diamond Eternity\nRing Guide',
    bg: 'linear-gradient(145deg,#c8ced8 0%,#a8b0be 100%)',
  },
  {
    _id: 'b4', title: 'Trending Hoop Earrings Styles', slug: 'trending-hoop-earrings-styles',
    category: 'EDUCATION', imageTitle: 'Hoop Earrings\nThrough the Ages',
    bg: 'linear-gradient(145deg,#e8d5c0 0%,#d0b898 100%)',
  },
];

const BlogSection = ({ blogs }) => {
  const posts = blogs?.length ? blogs.slice(0, 4) : BLOG_FALLBACK;

  return (
    <section className="py-16 bg-[#faf7f4]">
      <div className="container-luxury">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2
            className="font-heading font-bold text-gray-900 uppercase"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.7rem)', letterSpacing: '0.14em' }}
          >
            JEWELRY BLOG
          </h2>
          <p className="text-[13.5px] text-gray-500 mt-2 tracking-wide">
            Where Craft Inspires Conversation
          </p>
        </div>

        {/* Grid */}
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
                  {post.image
                    ? <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full" style={{ background: post.bg || 'linear-gradient(145deg,#c4a882 0%,#a08060 100%)' }} />
                  }
                  {/* Image title overlay */}
                  <div className="absolute inset-0 flex items-center justify-center p-5">
                    <p
                      className="font-heading italic text-center leading-snug"
                      style={{
                        fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)',
                        color: post.bg?.includes('1e1e') ? '#fff' : '#2a1a0a',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {post.imageTitle || post.title}
                    </p>
                  </div>
                </div>

                {/* Info row */}
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5">{post.category}</p>
                    <h3 className="font-heading font-bold text-gray-900 text-[12px] sm:text-[13px] uppercase leading-snug line-clamp-2" style={{ letterSpacing: '0.04em' }}>
                      {post.title}
                    </h3>
                  </div>
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

        {/* View all */}
        <div className="text-center mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary hover:text-primary/80 border-b border-primary/30 hover:border-primary pb-0.5 transition-all"
            style={{ letterSpacing: '0.14em' }}
          >
            VIEW ALL POSTS
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
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
  const [stores, setStores] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [cmsSections, setCmsSections] = useState({});

  useEffect(() => {
    const load = async () => {
      const [bannersRes, categoriesRes, featuredRes, dealsRes, sectionsRes, storesRes, blogsRes] = await Promise.allSettled([
        cmsAPI.getBanners('hero'),
        categoryAPI.getAll({ parent: 'null' }),
        productAPI.getAll({ limit: 10, sort: 'rating' }),
        productAPI.getAll({ limit: 10, segments: 'Deal of Week' }),
        cmsAPI.getPageSections('home'),
        storeAPI.getStores(),
        blogAPI.getAll({ featured: 'true', limit: 4 }),
      ]);
      if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.data.data || []);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data.data || []);
      const featured = featuredRes.status === 'fulfilled' ? (featuredRes.value.data.data || []) : [];
      setFeaturedProducts(featured);
      const deals = dealsRes.status === 'fulfilled' ? (dealsRes.value.data.data || []) : [];
      // Fall back to featured products if no "Deal of Week" segment products exist yet
      setDealProducts(deals.length ? deals : featured.slice(0, 8));
      if (storesRes.status === 'fulfilled') setStores(storesRes.value.data.data || []);
      if (blogsRes.status === 'fulfilled') setBlogs(blogsRes.value.data.data || []);
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
      <WhyChooseSection cmsContent={cmsSections.why_choose} />
      <FeaturedProducts
        products={featuredProducts}
        title="SHOP BEST JEWELRY"
        subtitle="Crafted for your everyday lifestyle"
        cmsContent={cmsSections.featured_products}
      />
      <DiamondCutsSection cmsContent={cmsSections.diamond_cuts} />
      <StoresSection stores={stores} />
      <GiftingSection cmsContent={cmsSections.gifting} />
      <BlogSection blogs={blogs} />
      <ServicesSection cmsContent={cmsSections.services} />
      <Newsletter cmsContent={cmsSections.newsletter} />
      <FAQSection cmsContent={cmsSections.faq} />
    </>
  );
}
