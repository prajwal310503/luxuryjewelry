import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { cmsAPI } from '../../services/api';
import CartDrawer from '../cart/CartDrawer';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-[19px] h-[19px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-[23px] h-[23px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const HeartIcon = () => (
  <svg className="w-[23px] h-[23px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const BagIcon = () => (
  <svg className="w-[23px] h-[23px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm5.625 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
const StoreIcon = () => (
  <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>
);
const ChevronDown = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronRightSmall = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// ─── Mega menu item icon ──────────────────────────────────────────────────────
const MegaItemIcon = ({ type, color }) => {
  // Colored circle for materials (Yellow Gold, Rose Gold etc.)
  if (color) return (
    <span
      className="w-[16px] h-[16px] rounded-full flex-shrink-0 border border-black/10"
      style={{ background: color }}
    />
  );
  if (!type) return null;

  const cls = 'w-[18px] h-[18px] flex-shrink-0 text-gray-700';
  const sw = 1.2;

  /* ── Diamond / Gem Shapes (face-up view with facet lines) ──────────── */

  // Brilliant cut round: outer girdle + table circle + 8 radial spokes
  if (type === 'round') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <circle cx="10" cy="10" r="7.8"/>
      <circle cx="10" cy="10" r="3.2"/>
      <line x1="10" y1="2.2" x2="10" y2="6.8"/>
      <line x1="10" y1="13.2" x2="10" y2="17.8"/>
      <line x1="2.2" y1="10" x2="6.8" y2="10"/>
      <line x1="13.2" y1="10" x2="17.8" y2="10"/>
      <line x1="4.48" y1="4.48" x2="7.74" y2="7.74"/>
      <line x1="12.26" y1="12.26" x2="15.52" y2="15.52"/>
      <line x1="15.52" y1="4.48" x2="12.26" y2="7.74"/>
      <line x1="7.74" y1="12.26" x2="4.48" y2="15.52"/>
    </svg>
  );

  // Oval brilliant: outer oval + table oval + 4 spokes
  if (type === 'oval') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <ellipse cx="10" cy="10" rx="5" ry="7.8"/>
      <ellipse cx="10" cy="10" rx="2" ry="3.2"/>
      <line x1="10" y1="2.2" x2="10" y2="6.8"/>
      <line x1="10" y1="13.2" x2="10" y2="17.8"/>
      <line x1="5" y1="10" x2="8" y2="10"/>
      <line x1="12" y1="10" x2="15" y2="10"/>
    </svg>
  );

  // Marquise: pointed lens shape with centre cross lines
  if (type === 'marquise') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M1.5 10 Q10 2.5 18.5 10 Q10 17.5 1.5 10 Z"/>
      <line x1="1.5" y1="10" x2="18.5" y2="10" strokeWidth={0.85}/>
      <line x1="10" y1="4" x2="10" y2="16" strokeWidth={0.85}/>
    </svg>
  );

  // Pear / teardrop: round base, pointed tip, centre line
  if (type === 'pear') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M10 2 C7 2 5 5 5 8.5 C5 13.5 7.2 18 10 18 C12.8 18 15 13.5 15 8.5 C15 5 13 2 10 2 Z"/>
      <line x1="10" y1="2" x2="10" y2="18" strokeWidth={0.85}/>
    </svg>
  );

  // Princess / square cut: square + corner diagonal facets + small centre table
  if (type === 'princess') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <rect x="3" y="3" width="14" height="14"/>
      <line x1="3" y1="3" x2="8.5" y2="8.5" strokeWidth={0.85}/>
      <line x1="17" y1="3" x2="11.5" y2="8.5" strokeWidth={0.85}/>
      <line x1="3" y1="17" x2="8.5" y2="11.5" strokeWidth={0.85}/>
      <line x1="17" y1="17" x2="11.5" y2="11.5" strokeWidth={0.85}/>
      <rect x="8.5" y="8.5" width="3" height="3" strokeWidth={0.85}/>
    </svg>
  );

  // Cushion: rounded square + inner table + corner facet hints
  if (type === 'cushion') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <rect x="3" y="3" width="14" height="14" rx="4"/>
      <rect x="7" y="7" width="6" height="6" rx="1.5" strokeWidth={0.9}/>
      <line x1="3" y1="7" x2="7" y2="7" strokeWidth={0.75}/>
      <line x1="3" y1="13" x2="7" y2="13" strokeWidth={0.75}/>
      <line x1="13" y1="7" x2="17" y2="7" strokeWidth={0.75}/>
      <line x1="13" y1="13" x2="17" y2="13" strokeWidth={0.75}/>
    </svg>
  );

  // Emerald / step cut: octagon outline + 2 step-cut horizontal lines + inner octagon
  if (type === 'emerald') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M6.5 2h7l4.5 4.5v7L13.5 18h-7L2 13.5v-7L6.5 2Z"/>
      <path d="M4.5 7h11M4.5 13h11" strokeWidth={0.85}/>
      <path d="M7.5 5h5l3 3v4l-3 3h-5l-3-3V8l3-3Z" strokeWidth={0.8}/>
    </svg>
  );

  // Heart cut: heart silhouette + centre facet line
  if (type === 'heart') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M10 17C10 17 2 12 2 6.5A4.5 4.5 0 0 1 10 4.9 4.5 4.5 0 0 1 18 6.5C18 12 10 17 10 17Z"/>
      <line x1="10" y1="17" x2="10" y2="5.5" strokeWidth={0.85}/>
    </svg>
  );

  // Special / radiant cut: octagon + 8 lines to centre (starburst)
  if (type === 'special') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M7 2h6l5 5v6l-5 5H7L2 13V7L7 2Z"/>
      <line x1="7" y1="2" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="13" y1="2" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="18" y1="7" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="18" y1="13" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="13" y1="18" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="7" y1="18" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="2" y1="13" x2="10" y2="10" strokeWidth={0.8}/>
      <line x1="2" y1="7" x2="10" y2="10" strokeWidth={0.8}/>
    </svg>
  );

  /* ── Ring Styles ──────────────────────────────────────────────────────────── */

  // Solitaire: single diamond crown + prong lines descending
  if (type === 'solitaire') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 9L10 3.5L14.5 9L10 14.5Z"/>
      <line x1="5.5" y1="9" x2="14.5" y2="9"/>
      <line x1="7" y1="14.5" x2="6" y2="18" strokeWidth={0.8}/>
      <line x1="13" y1="14.5" x2="14" y2="18" strokeWidth={0.8}/>
    </svg>
  );

  // Halo: centre stone circle + 8 surrounding satellite stones
  if (type === 'halo') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw}>
      <circle cx="10" cy="10" r="3"/>
      <circle cx="10" cy="4.7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15.3" cy="10" r="1" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="15.3" r="1" fill="currentColor" stroke="none"/>
      <circle cx="4.7" cy="10" r="1" fill="currentColor" stroke="none"/>
      <circle cx="13.75" cy="6.25" r="1" fill="currentColor" stroke="none"/>
      <circle cx="13.75" cy="13.75" r="1" fill="currentColor" stroke="none"/>
      <circle cx="6.25" cy="13.75" r="1" fill="currentColor" stroke="none"/>
      <circle cx="6.25" cy="6.25" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );

  // Side-stone: larger centre diamond + two smaller flanking stones
  if (type === 'side-stone') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4L7 9L10 14L13 9Z"/>
      <line x1="7" y1="9" x2="13" y2="9"/>
      <path d="M4.5 6.5L3 9L4.5 12L6 9Z" strokeWidth={0.9}/>
      <path d="M15.5 6.5L14 9L15.5 12L17 9Z" strokeWidth={0.9}/>
    </svg>
  );

  // Trilogy / three-stone: centre + two equal side stones, all with girdle lines
  if (type === 'trilogy') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4.5L7.5 9L10 13.5L12.5 9Z"/>
      <line x1="7.5" y1="9" x2="12.5" y2="9"/>
      <path d="M5 6.5L3.5 9L5 11.5L6.5 9Z" strokeWidth={0.9}/>
      <line x1="3.5" y1="9" x2="6.5" y2="9" strokeWidth={0.9}/>
      <path d="M15 6.5L13.5 9L15 11.5L16.5 9Z" strokeWidth={0.9}/>
      <line x1="13.5" y1="9" x2="16.5" y2="9" strokeWidth={0.9}/>
    </svg>
  );

  // Toi et Moi: two angled oval stones leaning toward each other
  if (type === 'toi-et-moi') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw}>
      <ellipse cx="7.5" cy="10" rx="2.8" ry="5.5" transform="rotate(-15 7.5 10)"/>
      <ellipse cx="12.5" cy="10" rx="2.8" ry="5.5" transform="rotate(15 12.5 10)"/>
    </svg>
  );

  // Eternity: solid band ring + inner dashed ring suggesting stones around
  if (type === 'eternity') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw}>
      <circle cx="10" cy="10" r="7.5"/>
      <circle cx="10" cy="10" r="5" strokeDasharray="2.5 1.8"/>
    </svg>
  );

  // Stackable: three stacked ring bands (ellipses from above)
  if (type === 'stackable') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw}>
      <ellipse cx="10" cy="7" rx="7" ry="2.2"/>
      <ellipse cx="10" cy="11" rx="7" ry="2.2"/>
      <ellipse cx="10" cy="15" rx="7" ry="2.2"/>
    </svg>
  );

  // Couple / wedding bands: two interlocking rings
  if (type === 'couple') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw}>
      <circle cx="7.5" cy="10" r="5.5"/>
      <circle cx="12.5" cy="10" r="5.5"/>
    </svg>
  );

  // Men's: bold wide band (thicker stroke, wider gap between circles)
  if (type === 'mens') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="10" cy="10" r="7.5"/>
      <circle cx="10" cy="10" r="4.8"/>
    </svg>
  );

  // Generic gem / diamond fallback
  if (type === 'gem' || type === 'diamond') return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8L10 2.5L15 8L10 17.5Z"/>
      <line x1="5" y1="8" x2="15" y2="8"/>
    </svg>
  );

  // Default — tiny dot
  return (
    <span className="w-[5px] h-[5px] rounded-full bg-gray-300 flex-shrink-0 mt-[5px]" />
  );
};

// ─── Announcement Bar ─────────────────────────────────────────────────────────
const DEFAULT_ANNOUNCEMENTS = [
  'Upto 50% Off on Making Charges',
  'Free Shipping on orders above ₹5,000',
  'Flat 20% Off on Diamonds',
  'Certified Lab-Grown Diamonds — Guaranteed',
];

const AnnouncementBar = () => {
  const [idx, setIdx]         = useState(0);
  const [messages, setMessages] = useState(DEFAULT_ANNOUNCEMENTS);

  useEffect(() => {
    cmsAPI.getPageSections('global').then((res) => {
      const s = (res.data.data || []).find((x) => x.sectionType === 'announcement_bar');
      if (s?.content?.messages?.length) setMessages(s.content.messages);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="bg-[#c09080] text-white select-none" style={{ minHeight: 36 }}>
      <div className="container-luxury flex items-center h-9">
        <a
          href="#main-content"
          className="hidden md:block flex-shrink-0 text-[11px] text-white/75 hover:text-white transition-colors tracking-wide underline-offset-2 hover:underline"
        >
          Skip to content
        </a>
        <div className="flex-1 flex items-center justify-center overflow-hidden h-full">
          <AnimatePresence mode="wait">
            <motion.span
              key={idx}
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 14, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="text-[11.5px] tracking-wider whitespace-nowrap"
              style={{ letterSpacing: '0.08em' }}
            >
              {messages[idx]}
            </motion.span>
          </AnimatePresence>
        </div>
        <button
          onClick={() => setIdx((i) => (i + 1) % messages.length)}
          className="hidden md:flex flex-shrink-0 items-center justify-center w-6 h-6 text-white/75 hover:text-white transition-colors"
          aria-label="Next announcement"
        >
          <ChevronRightSmall />
        </button>
      </div>
    </div>
  );
};

// ─── Search Bar ───────────────────────────────────────────────────────────────
const SEARCH_PLACEHOLDERS = [
  'Search for Engagement Rings',
  'Search for Diamond Earrings',
  'Search for Gift Jewellery',
  'Search for Gold Bangles',
];

const SearchBar = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [pi, setPi] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setPi((i) => (i + 1) % SEARCH_PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={SEARCH_PLACEHOLDERS[pi]}
        className="w-full h-[46px] pl-12 pr-5 text-[13px] transition-all placeholder:text-gray-400"
        style={{
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.62)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03), 0 1px 0 rgba(255,255,255,0.8)',
          outline: 'none',
        }}
      />
    </form>
  );
};

// ─── Mega Menu Dropdown ───────────────────────────────────────────────────────
const FeatImagePanel = ({ fi, className = '' }) => (
  <Link
    to={fi.link || '#'}
    className={`relative overflow-hidden group block ${className}`}
  >
    {fi.image
      ? <img src={fi.image} alt={fi.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      : <div className="w-full h-full" style={{ background: fi.bg || '#f5ede6' }} />
    }
    {(fi.title || fi.subtitle) && (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent pt-12 pb-5 px-5">
        {fi.title && (
          <p className="text-white text-[10.5px] font-semibold tracking-[0.22em] uppercase leading-snug">
            {fi.title}
          </p>
        )}
        {fi.subtitle && (
          <p className="text-white/65 text-[10px] mt-1 tracking-wide">{fi.subtitle}</p>
        )}
      </div>
    )}
  </Link>
);

const MegaMenuDropdown = ({ item }) => {
  const child = item.children?.[0];
  if (!child) return null;
  const cols = child.columns || [];

  // Normalise featured images: support both array and single-image legacy fields
  const featImages = child.featuredImages?.length
    ? child.featuredImages
    : child.featuredImage || child.featuredTitle
      ? [{ image: child.featuredImage, title: child.featuredTitle, link: child.featuredLink, bg: child.featuredBg }]
      : [];

  // Collections layout — no columns, just image cards full-width
  const isImageOnly = cols.length === 0 && featImages.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute top-full left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderTop: '1px solid rgba(255,255,255,0.60)',
        boxShadow: '0 16px 48px rgba(90,65,63,0.10)',
      }}
      style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.11)' }}
    >
      {isImageOnly ? (
        /* ── Collections layout: 3 equal image cards ─────────────────── */
        <div className="container-luxury py-7 pb-9">
          <div className="flex gap-5" style={{ height: 340 }}>
            {featImages.map((fi, i) => (
              <FeatImagePanel key={i} fi={fi} className="flex-1 rounded-2xl overflow-hidden" />
            ))}
          </div>
        </div>
      ) : (
        /* ── Standard layout: columns + optional featured panel ──────── */
        <div className="flex" style={{ minHeight: 260 }}>

          {/* Columns */}
          <div className="flex flex-1 container-luxury py-9 gap-0">
            {cols.map((col, ci) => (
              <div
                key={ci}
                className={ci === 0
                  ? 'flex-1 pr-8'
                  : 'flex-1 border-l border-gray-200 px-8'
                }
              >
                <h4
                  className="text-[9px] font-semibold text-gray-400 uppercase mb-5 pb-2.5 border-b border-gray-200"
                  style={{ letterSpacing: '0.20em' }}
                >
                  {col.heading}
                </h4>
                <ul className="space-y-[10px]">
                  {(col.items || []).map((sub, si) => (
                    <li key={si}>
                      <Link
                        to={sub.url || '#'}
                        className="flex items-center gap-3 text-[13px] text-gray-800 hover:text-primary transition-colors leading-snug"
                      >
                        <MegaItemIcon type={sub.icon} color={sub.color} />
                        <span>{sub.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Featured panel(s) flush right */}
          {featImages.length > 0 && (
            <div
              className="flex flex-shrink-0 overflow-hidden"
              style={{ width: featImages.length > 1 ? featImages.length * 230 : 265 }}
            >
              {featImages.map((fi, i) => (
                <FeatImagePanel key={i} fi={fi} className="flex-1" />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ─── Shared column helpers ────────────────────────────────────────────────────
const MAT_4 = {
  heading: 'Shop By Material',
  items: [
    { label: 'Yellow Gold', url: '/collections/yellow-gold', color: '#E8C96B' },
    { label: 'Rose Gold',   url: '/collections/rose-gold',   color: '#E8A98A' },
    { label: 'White Gold',  url: '/collections/white-gold',  color: '#D8D8D8' },
    { label: 'Platinum',    url: '/collections/platinum',    color: '#B8BCC4' },
  ],
};
const MAT_3 = {
  heading: 'Shop By Material',
  items: [
    { label: 'Yellow Gold', url: '/collections/yellow-gold', color: '#E8C96B' },
    { label: 'Rose Gold',   url: '/collections/rose-gold',   color: '#E8A98A' },
    { label: 'White Gold',  url: '/collections/white-gold',  color: '#D8D8D8' },
  ],
};
const PRICE_COL = {
  heading: 'Shop By Price',
  items: [
    { label: 'Below 50K',     url: '/collections?maxPrice=50000' },
    { label: '50K – 100K',    url: '/collections?minPrice=50000&maxPrice=100000' },
    { label: '100K – 150K',   url: '/collections?minPrice=100000&maxPrice=150000' },
    { label: '150K – 200K',   url: '/collections?minPrice=150000&maxPrice=200000' },
    { label: '200K and above',url: '/collections?minPrice=200000' },
  ],
};

// ─── Nav fallback data ────────────────────────────────────────────────────────
const NAV_FALLBACK = [
  { label: 'Royalbutterfly Express', url: '/collections/express', type: 'link' },

  /* ── FAVORITES ──────────────────────────────────────────────────────── */
  {
    label: 'Favorites',
    url:   '/collections/favorites',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'New Arrivals',
          items: [
            { label: 'Rings',     url: '/collections/new/rings' },
            { label: 'Earrings',  url: '/collections/new/earrings' },
            { label: 'Nose Pins', url: '/collections/new/nose-pins' },
            { label: 'Bracelets', url: '/collections/new/bracelets' },
            { label: 'Necklaces', url: '/collections/new/necklaces' },
          ],
        },
        {
          heading: 'Trending',
          items: [
            { label: 'Rings',     url: '/collections/trending/rings' },
            { label: 'Earrings',  url: '/collections/trending/earrings' },
            { label: 'Nose Pins', url: '/collections/trending/nose-pins' },
            { label: 'Bracelets', url: '/collections/trending/bracelets' },
            { label: 'Necklaces', url: '/collections/trending/necklaces' },
          ],
        },
        {
          heading: 'Education',
          items: [
            { label: 'Online Shopping Tips',    url: '/blog/online-shopping-tips' },
            { label: 'How to read IGI Certificate', url: '/blog/igi-certificate' },
          ],
        },
      ],
      featuredImages: [],
    }],
  },

  /* ── ENGAGEMENT & BRIDAL ─────────────────────────────────────────────── */
  {
    label: 'Engagement & Bridal',
    url:   '/collections/engagement-bridal',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Shop By Style',
          items: [
            { label: 'Solitaire',    url: '/collections/solitaire',    icon: 'solitaire' },
            { label: 'Halo',         url: '/collections/halo',         icon: 'halo' },
            { label: 'Side-Stone',   url: '/collections/side-stone',   icon: 'side-stone' },
            { label: 'Trilogy',      url: '/collections/trilogy',      icon: 'trilogy' },
            { label: 'Toi et Moi',   url: '/collections/toi-et-moi',  icon: 'toi-et-moi' },
            { label: 'Eternity',     url: '/collections/eternity',     icon: 'eternity' },
            { label: 'Stackable',    url: '/collections/stackable',    icon: 'stackable' },
            { label: 'Couple Bands', url: '/collections/couple-bands', icon: 'couple' },
            { label: "Men's",        url: '/collections/mens',         icon: 'mens' },
          ],
        },
        {
          heading: 'Shop By Shape',
          items: [
            { label: 'Emerald',      url: '/collections/emerald',      icon: 'emerald' },
            { label: 'Marquise',     url: '/collections/marquise',     icon: 'marquise' },
            { label: 'Oval',         url: '/collections/oval',         icon: 'oval' },
            { label: 'Pear',         url: '/collections/pear',         icon: 'pear' },
            { label: 'Princess',     url: '/collections/princess',     icon: 'princess' },
            { label: 'Round',        url: '/collections/round',        icon: 'round' },
            { label: 'Heart',        url: '/collections/heart',        icon: 'heart' },
            { label: 'Cushion',      url: '/collections/cushion',      icon: 'cushion' },
            { label: 'Special Cuts', url: '/collections/special-cuts', icon: 'special' },
          ],
        },
        MAT_4,
        PRICE_COL,
      ],
      featuredTitle: 'Engagement & Bridal',
      featuredLink:  '/collections/engagement-bridal',
      featuredBg:    '#f0e6dc',
    }],
  },

  /* ── RINGS ───────────────────────────────────────────────────────────── */
  {
    label: 'Rings',
    url:   '/collections/rings',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Shop By Style',
          items: [
            { label: 'Solitaire Rings',  url: '/collections/solitaire-rings', icon: 'solitaire' },
            { label: 'Halo Rings',       url: '/collections/halo-rings',      icon: 'halo' },
            { label: 'Eternity Rings',   url: '/collections/eternity-rings',  icon: 'eternity' },
            { label: 'Stackable Rings',  url: '/collections/stackable-rings', icon: 'stackable' },
            { label: 'Couple Bands',     url: '/collections/couple-bands',    icon: 'couple' },
            { label: 'Cocktail Rings',   url: '/collections/cocktail-rings',  icon: 'trilogy' },
            { label: 'Statement Rings',  url: '/collections/statement-rings', icon: 'side-stone' },
          ],
        },
        {
          heading: 'Shop By Shape',
          items: [
            { label: 'Round',    url: '/collections/rings/round',    icon: 'round' },
            { label: 'Oval',     url: '/collections/rings/oval',     icon: 'oval' },
            { label: 'Princess', url: '/collections/rings/princess', icon: 'princess' },
            { label: 'Cushion',  url: '/collections/rings/cushion',  icon: 'cushion' },
            { label: 'Pear',     url: '/collections/rings/pear',     icon: 'pear' },
            { label: 'Emerald',  url: '/collections/rings/emerald',  icon: 'emerald' },
            { label: 'Heart',    url: '/collections/rings/heart',    icon: 'heart' },
            { label: 'Marquise', url: '/collections/rings/marquise', icon: 'marquise' },
          ],
        },
        MAT_4,
        PRICE_COL,
      ],
      featuredTitle: 'Rings',
      featuredLink:  '/collections/rings',
      featuredBg:    '#ede6dc',
    }],
  },

  /* ── EARRINGS ────────────────────────────────────────────────────────── */
  {
    label: 'Earrings',
    url:   '/collections/earrings',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Shop By Style',
          items: [
            { label: 'Stud Earrings',      url: '/collections/stud-earrings',       icon: 'round' },
            { label: 'Hoop Earrings',      url: '/collections/hoop-earrings',       icon: 'eternity' },
            { label: 'Drop Earrings',      url: '/collections/drop-earrings',       icon: 'pear' },
            { label: 'Chandelier',         url: '/collections/chandelier-earrings', icon: 'special' },
            { label: 'Huggie Earrings',    url: '/collections/huggie-earrings',     icon: 'cushion' },
            { label: 'Jhumka Earrings',    url: '/collections/jhumka-earrings',     icon: 'marquise' },
            { label: 'Statement Earrings', url: '/collections/statement-earrings',  icon: 'side-stone' },
          ],
        },
        {
          heading: 'Shop By Shape',
          items: [
            { label: 'Round',    url: '/collections/earrings/round',    icon: 'round' },
            { label: 'Oval',     url: '/collections/earrings/oval',     icon: 'oval' },
            { label: 'Pear',     url: '/collections/earrings/pear',     icon: 'pear' },
            { label: 'Heart',    url: '/collections/earrings/heart',    icon: 'heart' },
            { label: 'Princess', url: '/collections/earrings/princess', icon: 'princess' },
            { label: 'Cushion',  url: '/collections/earrings/cushion',  icon: 'cushion' },
          ],
        },
        MAT_4,
        PRICE_COL,
      ],
      featuredTitle: 'Earrings',
      featuredLink:  '/collections/earrings',
      featuredBg:    '#e8ddd4',
    }],
  },

  /* ── MORE JEWELRY ────────────────────────────────────────────────────── */
  {
    label: 'More Jewelry',
    url:   '/collections',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Bracelets',
          items: [
            { label: 'Chain Bracelets',  url: '/collections/chain-bracelets' },
            { label: 'Cuff Bracelets',   url: '/collections/cuff-bracelets' },
            { label: 'Tennis Bracelets', url: '/collections/tennis-bracelets' },
            { label: "Men's",            url: '/collections/mens-bracelets' },
          ],
        },
        {
          heading: 'Necklaces',
          items: [
            { label: 'Chain Necklaces',   url: '/collections/chain-necklaces' },
            { label: 'Pendant Necklaces', url: '/collections/pendant-necklaces' },
            { label: 'Tennis Necklaces',  url: '/collections/tennis-necklaces' },
          ],
        },
        {
          heading: 'Mangalsutra',
          items: [
            { label: 'Mangalsutra Necklaces',  url: '/collections/mangalsutra-necklaces' },
            { label: 'Mangalsutra Bracelets',  url: '/collections/mangalsutra-bracelets' },
          ],
        },
        {
          heading: 'Plain Gold',
          items: [
            { label: 'Gold Rings',    url: '/collections/plain-gold-rings' },
            { label: 'Gold Chains',   url: '/collections/gold-chains' },
            { label: 'Gold Earrings', url: '/collections/plain-gold-earrings' },
          ],
        },
        {
          heading: 'Others',
          items: [
            { label: 'Nosepins', url: '/collections/nosepins' },
            { label: 'Pendants', url: '/collections/pendants' },
          ],
        },
        {
          heading: 'Education',
          items: [
            { label: 'Hoop Earring Styles',       url: '/blog/hoop-earring-styles' },
            { label: 'Different types of Diamond', url: '/blog/diamond-types' },
            { label: 'Jewelry Trends 2026',        url: '/blog/jewelry-trends-2026' },
            { label: 'How to read certificate',    url: '/blog/read-certificate' },
          ],
        },
      ],
      featuredImages: [],
    }],
  },

  /* ── SOLITAIRE ───────────────────────────────────────────────────────── */
  {
    label: 'Solitaire',
    url:   '/collections/solitaire',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Shop By Category',
          items: [
            { label: 'Rings',          url: '/collections/solitaire-rings' },
            { label: 'Earrings',       url: '/collections/solitaire-earrings' },
            { label: 'Bracelets',      url: '/collections/solitaire-bracelets' },
            { label: 'Necklaces',      url: '/collections/solitaire-necklaces' },
            { label: 'Chain Pendants', url: '/collections/solitaire-pendants' },
            { label: "Men's",          url: '/collections/solitaire-mens' },
          ],
        },
        {
          heading: 'Shop By Shape',
          items: [
            { label: 'Round',    url: '/collections/solitaire/round',    icon: 'round' },
            { label: 'Heart',    url: '/collections/solitaire/heart',    icon: 'heart' },
            { label: 'Oval',     url: '/collections/solitaire/oval',     icon: 'oval' },
            { label: 'Marquise', url: '/collections/solitaire/marquise', icon: 'marquise' },
            { label: 'Princess', url: '/collections/solitaire/princess', icon: 'princess' },
            { label: 'Emerald',  url: '/collections/solitaire/emerald',  icon: 'emerald' },
            { label: 'Pear',     url: '/collections/solitaire/pear',     icon: 'pear' },
            { label: 'Cushion',  url: '/collections/solitaire/cushion',  icon: 'cushion' },
          ],
        },
        MAT_3,
        PRICE_COL,
        {
          heading: 'Education',
          items: [
            { label: 'The Ultimate Showdown',  url: '/blog/lab-grown-vs-mined' },
            { label: 'Lab Grown vs. Mined',    url: '/blog/lab-grown-vs-mined' },
          ],
        },
      ],
      featuredTitle: 'Solitaires',
      featuredLink:  '/collections/solitaire',
      featuredBg:    '#e8e0d8',
    }],
  },

  /* ── COLLECTIONS ─────────────────────────────────────────────────────── */
  {
    label: 'Collections',
    url:   '/collections',
    type:  'mega',
    children: [{
      columns: [],
      featuredImages: [
        { title: 'Cotton Candy', subtitle: 'Savour Your Sweet Memories', link: '/collections/cotton-candy', bg: '#e8c4a4' },
        { title: 'On The Move',  subtitle: 'For Life In Constant Motion', link: '/collections/on-the-move',  bg: '#7a8c5c' },
        { title: 'Hexa',         subtitle: 'An Ode To Transformation',    link: '/collections/hexa',         bg: '#2c1c2c' },
      ],
    }],
  },

  /* ── GIFTING ─────────────────────────────────────────────────────────── */
  {
    label: 'Gifting',
    url:   '/gifting',
    type:  'mega',
    children: [{
      columns: [
        {
          heading: 'Gifts',
          items: [
            { label: "Women's Day Gifts",  url: '/gifting/womens-day' },
            { label: "Valentine's Gift",   url: '/gifting/valentine' },
            { label: 'Birthday Gifts',     url: '/gifting/birthday' },
            { label: 'Anniversary Gifts',  url: '/gifting/anniversary' },
            { label: 'Gifts for Mother',   url: '/gifting/mother' },
            { label: 'Gifts for Her',      url: '/gifting/her' },
            { label: 'Gifts for Him',      url: '/gifting/him' },
          ],
        },
        {
          heading: 'Price',
          items: [
            { label: 'Gifts Under 30K',  url: '/gifting?maxPrice=30000' },
            { label: 'Gifts Under 50K',  url: '/gifting?maxPrice=50000' },
            { label: 'Gifts Under 100K', url: '/gifting?maxPrice=100000' },
          ],
        },
      ],
      featuredImages: [
        { title: 'Couple Bands', link: '/collections/couple-bands', bg: '#e0d0c4' },
        { title: 'Gifting',      link: '/gifting',                  bg: '#c4b4a8' },
      ],
    }],
  },

  { label: '9KT Collection', url: '/collections/9kt', type: 'link', badge: 'NEW' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Header() {
  const [menuItems, setMenuItems] = useState(NAV_FALLBACK);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const cartCount = useCartStore((s) => s.getTotalItems());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { user, logout } = useAuthStore();
  const openCart = useCartStore((s) => s.openCart);
  const menuTimeout = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    cmsAPI.getMenu('primary').then(({ data }) => {
      const items = data.data?.items;
      // Only replace NAV_FALLBACK if DB has at least one mega item saved by admin
      if (items?.length && items.some((i) => i.type === 'mega' && i.children?.length > 0)) {
        setMenuItems(items);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseEnter = (label) => {
    clearTimeout(menuTimeout.current);
    setActiveMenu(label);
  };
  const handleMouseLeave = () => {
    menuTimeout.current = setTimeout(() => setActiveMenu(null), 120);
  };

  // Find active mega item
  const activeMegaItem = activeMenu
    ? menuItems.find((m) => m.label === activeMenu && m.type === 'mega' && m.children?.length > 0)
    : null;

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 glass-header">

        {/* ── Main row: Logo | Search | Icons ──────────────────────────── */}
        <div className="container-luxury">
          <div className="flex items-center gap-6 h-[80px]">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group leading-none">
              <div
                className="border border-primary/30 px-4 py-2 text-center"
                style={{ minWidth: 100 }}
              >
                <span
                  className="logo-script block text-[1.9rem] font-bold text-primary leading-none"
                  style={{ fontStyle: 'italic' }}
                >
                  Royalbutterfly
                </span>
                <span
                  className="block text-[7px] text-primary/50 uppercase mt-[2px]"
                  style={{ letterSpacing: '0.44em' }}
                >
                  Jewelry
                </span>
              </div>
            </Link>

            {/* Search bar */}
            <div className="flex-1 hidden md:block">
              <SearchBar />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Store Nearby */}
              <Link
                to="/stores"
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
              >
                <StoreIcon />
                <span className="text-[12px] font-medium tracking-wide whitespace-nowrap">Store Nearby</span>
              </Link>

              {/* Account */}
              {user ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((o) => !o)}
                    className="p-2.5 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                    aria-label="Account"
                  >
                    <UserIcon />
                  </button>
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 py-1 z-50"
                        style={{
                          borderRadius: '18px',
                          background: 'rgba(255,255,255,0.88)',
                          backdropFilter: 'blur(20px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                          border: '1px solid rgba(255,255,255,0.65)',
                          boxShadow: '0 12px 40px rgba(90,65,63,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      >
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{user.name}</p>
                        </div>
                        {user.role === 'admin' && (
                          <Link onClick={() => setAccountOpen(false)} to="/admin/dashboard"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-luxury-cream hover:text-primary transition-colors">
                            Admin Panel
                          </Link>
                        )}
                        {user.role === 'vendor' && (
                          <Link onClick={() => setAccountOpen(false)} to="/vendor/dashboard"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-luxury-cream hover:text-primary transition-colors">
                            Vendor Panel
                          </Link>
                        )}
                        <Link onClick={() => setAccountOpen(false)} to="/account"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-luxury-cream hover:text-primary transition-colors">
                          My Account
                        </Link>
                        <Link onClick={() => setAccountOpen(false)} to="/orders"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-luxury-cream hover:text-primary transition-colors">
                          My Orders
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => { setAccountOpen(false); logout(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login"
                  className="p-2.5 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Sign in"
                >
                  <UserIcon />
                </Link>
              )}

              {/* Wishlist */}
              <Link to="/wishlist"
                className="relative p-2.5 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Wishlist"
              >
                <HeartIcon />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white rounded-full text-[9px] flex items-center justify-center font-bold leading-none">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={openCart}
                className="relative p-2.5 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                aria-label="Cart"
              >
                <BagIcon />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white rounded-full text-[9px] flex items-center justify-center font-bold leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Nav + Mega menu wrapper (shared mouse zone) ───────────────── */}
        <div className="relative" onMouseLeave={handleMouseLeave}>

          {/* Nav bar */}
          <nav className="hidden md:block border-t border-gray-100">
            <div className="container-luxury">
              <ul className="flex items-center justify-between">
                {menuItems.map((item) => (
                  <li
                    key={item.label}
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    className="flex-1 text-center"
                  >
                    <Link
                      to={item.url || '#'}
                      className={`relative inline-flex items-center justify-center gap-1.5 py-[14px] w-full
                        text-[10.5px] font-semibold tracking-[0.16em] uppercase transition-colors duration-150 whitespace-nowrap
                        ${activeMenu === item.label ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}
                    >
                      {item.label}
                      {item.badge && (
                        <span
                          className="absolute -top-[3px] -right-4 px-1.5 py-[2px] text-[7px] font-bold text-white rounded-sm uppercase leading-none"
                          style={{ letterSpacing: '0.08em', background: '#C9A84C' }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {/* Bottom underline */}
                      <motion.span
                        className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-primary origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: activeMenu === item.label ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Mega menu — full width, absolutely positioned below nav */}
          <AnimatePresence>
            {activeMegaItem && (
              <MegaMenuDropdown key={activeMegaItem.label} item={activeMegaItem} />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3 pt-1">
          <SearchBar />
        </div>
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                borderLeft: '1px solid rgba(255,255,255,0.65)',
                boxShadow: '-8px 0 40px rgba(90,65,63,0.12)',
                borderRadius: '24px 0 0 24px',
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="logo-script text-xl font-bold text-primary">Royalbutterfly</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-500">
                  <CloseIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <ul>
                  {menuItems.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.url || '#'}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-5 py-3.5 text-[11px] font-medium tracking-[0.16em] uppercase text-gray-600 hover:text-primary hover:bg-luxury-cream border-b border-gray-50 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-[2px] text-[7px] font-bold bg-gray-900 text-white rounded-sm uppercase">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {user ? (
                <div className="border-t border-gray-100 px-5 py-4 space-y-1">
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">Account</p>
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 py-1.5 hover:text-primary tracking-wide">My Account</Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 py-1.5 hover:text-primary tracking-wide">My Orders</Link>
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="block text-sm text-red-500 py-1.5 tracking-wide">Sign Out</button>
                </div>
              ) : (
                <div className="border-t border-gray-100 px-5 py-4">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center text-sm">
                    Sign In
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}
