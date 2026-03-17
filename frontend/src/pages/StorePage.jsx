import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { storeAPI } from '../services/api';

// ─── Service icon map ─────────────────────────────────────────────────────────
const ICON_COLOR = '#b08070';
const ServiceIcons = {
  exchange: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 28 28" stroke={ICON_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14A10 10 0 0120 5"/>
      <path d="M17 2l3.5 3-3.5 3"/>
      <path d="M24 14A10 10 0 018 23"/>
      <path d="M11 26l-3.5-3 3.5-3"/>
      <circle cx="14" cy="14" r="3.5"/>
    </svg>
  ),
  vault: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 28 28" stroke={ICON_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="22" height="18" rx="2"/>
      <circle cx="14" cy="14" r="4"/>
      <path d="M14 10v4l2 2"/>
      <path d="M3 10h22"/>
    </svg>
  ),
  carat: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 28 28" stroke={ICON_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h20l-4 4H8L4 6z"/>
      <path d="M8 10L14 22l6-12"/>
      <line x1="8" y1="10" x2="14" y2="22"/>
      <line x1="20" y1="10" x2="14" y2="22"/>
    </svg>
  ),
  cleaning: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 28 28" stroke={ICON_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22s1-2 4-2h6c1 0 2-.6 2-1.7S16 16.6 15 16.6H10"/>
      <path d="M6 22V13a1 1 0 012 0v4.4"/>
      <path d="M8 17.4V8a1 1 0 012 0v6"/>
      <path d="M10 17.4V6a1 1 0 012 0v6.6"/>
      <path d="M12 17.4V8a1 1 0 012 0v2"/>
      <path d="M20 5a3 3 0 100 6 3 3 0 000-6z"/>
    </svg>
  ),
  diamond: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 28 28" stroke={ICON_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h20l-10 14L4 9z"/>
      <path d="M4 9l4-5h12l4 5"/>
      <line x1="9" y1="9" x2="14" y2="23"/>
      <line x1="19" y1="9" x2="14" y2="23"/>
      <line x1="4" y1="9" x2="24" y2="9"/>
    </svg>
  ),
};

const getServiceIcon = (icon) =>
  ServiceIcons[icon] || ServiceIcons.diamond;

const ICON_BG = {
  exchange: '#fff5f0',
  vault:    '#f0f5ff',
  carat:    '#f5fff0',
  cleaning: '#fff0f5',
  diamond:  '#f5f0ff',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const StoreSkeleton = () => (
  <div className="animate-pulse">
    <div className="w-full h-[50vh] bg-gray-200" />
    <div className="container-luxury py-12 grid md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2 flex-wrap">
          {[1,2,3].map((i) => <div key={i} className="h-8 w-28 bg-gray-200 rounded-full" />)}
        </div>
      </div>
    </div>
  </div>
);

export default function StorePage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeAPI.getStoreBySlug(slug)
      .then((r) => setStore(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <StoreSkeleton />;
  if (!store) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-lg font-heading text-gray-700">Store not found</p>
      <Link to="/" className="btn-primary text-sm">Back to Home</Link>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{store.name} — {store.city || 'Store'}</title>
        <meta name="description" content={store.tagline || store.description || `Visit ${store.name}`} />
      </Helmet>

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: '55vh', minHeight: 320 }}>
        {store.image
          ? <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#f5ede4 0%,#e8d5c4 100%)' }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-heading font-bold text-white uppercase mb-4"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2.2rem)', letterSpacing: '0.12em' }}
          >
            EXPERIENCE {store.name.toUpperCase()} IN {(store.city || '').toUpperCase()}
          </motion.h1>
          <motion.a
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            href="#store-info"
            className="inline-block bg-white text-gray-900 font-semibold text-xs uppercase tracking-widest px-8 py-3 hover:bg-gray-100 transition-colors"
            style={{ letterSpacing: '0.14em' }}
          >
            SHOP NOW
          </motion.a>
        </div>
      </section>

      {/* ── Store Info ──────────────────────────────────────────────────── */}
      <section id="store-info" className="py-14 bg-white">
        <div className="container-luxury">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Left: status + facilities + services */}
            <div className="space-y-8">

              {/* Open status + hours */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  OPEN NOW
                </span>
                {store.hoursDisplay && (
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                    </svg>
                    {store.hoursDisplay}
                  </span>
                )}
              </div>

              {/* Facilities */}
              {store.facilities?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-2M5 21H3m2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest" style={{ letterSpacing: '0.16em' }}>
                      FACILITIES AT STORE
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {store.facilities.map((f) => (
                      <span key={f} className="text-[11px] text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full hover:border-primary/40 transition-colors">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {store.services?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest" style={{ letterSpacing: '0.16em' }}>
                      SERVICES AT STORE
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {store.services.map((svc, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all"
                        style={{ background: ICON_BG[svc.icon] || '#faf7f4' }}
                      >
                        {getServiceIcon(svc.icon)}
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider text-center leading-tight" style={{ letterSpacing: '0.1em' }}>
                          {svc.title}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: store card */}
            <div className="border border-gray-100 rounded-2xl p-7 shadow-sm space-y-5 h-fit">

              {/* Store name + rating */}
              <div>
                <h2 className="font-heading font-bold text-gray-900 uppercase text-lg" style={{ letterSpacing: '0.08em' }}>
                  {store.name}
                </h2>
                {store.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-bold text-gray-800">{store.rating.toFixed(1)}</span>
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(store.rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>

              {/* Address */}
              {store.address && (
                <div className="flex gap-2.5">
                  <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 leading-relaxed">{store.address}</p>
                </div>
              )}

              {/* Phone */}
              {store.phone && (
                <div className="flex gap-2.5">
                  <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${store.phone}`} className="text-sm text-gray-500 hover:text-primary transition-colors">{store.phone}</a>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* CTA buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {store.mapLink && (
                  <a
                    href={store.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-primary text-primary text-[11px] font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-lg"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Direct Me
                  </a>
                )}
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-primary text-primary text-[11px] font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-lg"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Us
                  </a>
                )}
                {store.bookingLink && (
                  <a
                    href={store.bookingLink}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white text-[11px] font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all rounded-lg"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    Book Appointment
                  </a>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
