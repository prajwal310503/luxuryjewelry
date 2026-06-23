import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// ─── Icons ────────────────────────────────────────────────────────────────────
const StoreIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const SyncIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);
const TagIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: <StoreIcon />,
    title: 'Your Own Store Page',
    desc: 'Get a dedicated, branded storefront page with your logo, banner, and product catalogue visible to thousands of buyers.',
    accent: '#C9A84C',
  },
  {
    icon: <ChartIcon />,
    title: 'Real-Time Dashboard',
    desc: 'Monitor your sales, orders, revenue, and top-selling products from a single, intuitive vendor dashboard.',
    accent: '#B76E79',
  },
  {
    icon: <SyncIcon />,
    title: 'Live Metal Price Sync',
    desc: 'Your product prices auto-update based on today\'s live gold, silver, and platinum rates — no manual work needed.',
    accent: '#5a413f',
  },
  {
    icon: <TagIcon />,
    title: 'Full Product Control',
    desc: 'Add unlimited products with variants (size, weight, purity, metal color), making charges, and certifications.',
    accent: '#7a9080',
  },
  {
    icon: <UsersIcon />,
    title: 'Reach More Buyers',
    desc: 'Tap into our growing customer base across India. Your products are featured on our marketplace homepage.',
    accent: '#8b6355',
  },
  {
    icon: <ShieldIcon />,
    title: 'Secure & Transparent',
    desc: 'Secure payments, transparent commission structure, and dedicated support — everything you need to grow.',
    accent: '#6a7a8a',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register Your Shop', desc: 'Fill in your jewellery shop details, GST number, and business information.' },
  { step: '02', title: 'Get Approved',       desc: 'Our team reviews your application and activates your store within 24–48 hours.' },
  { step: '03', title: 'List Your Products', desc: 'Upload your jewellery with photos, variants, and pricing — all from your vendor panel.' },
  { step: '04', title: 'Start Selling',      desc: 'Receive orders, manage deliveries, and track your earnings in real time.' },
];

const INCLUSIONS = [
  'Branded vendor storefront',
  'Unlimited product listings',
  'Live metal price sync',
  'Order & payment management',
  'Real-time sales dashboard',
  'Making charges per category',
  'Dedicated support team',
  'Mobile-friendly panel',
];

const STATS = [
  { value: '10,000+', label: 'Active Buyers' },
  { value: '500+',    label: 'Products Sold Monthly' },
  { value: '48 hrs',  label: 'Approval Time' },
  { value: '0%',      label: 'Listing Fee' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function BecomeSellerPage() {
  return (
    <>
      <Helmet>
        <title>Become a Seller — LUXURY JEWELRY MARKETPLACE</title>
        <meta name="description" content="List your jewellery shop on LUXURY JEWELRY MARKETPLACE. Reach thousands of buyers, auto-sync metal prices, and manage orders from your own vendor dashboard." />
      </Helmet>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0e08 0%, #2c1810 40%, #1a0e08 100%)',
          minHeight: '92vh',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }} />

        <div className="container-luxury relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 py-20 lg:py-28">

          {/* Left content */}
          <motion.div className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] mb-6"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              LUXURY JEWELRY MARKETPLACE
            </span>

            <h1
              className="font-heading font-bold text-white leading-tight mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', letterSpacing: '-0.01em' }}
            >
              Grow Your Jewellery
              <br />
              <span style={{ background: 'linear-gradient(135deg, #C9A84C, #E2C97E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Business Online
              </span>
            </h1>

            <p className="text-lg text-white/65 leading-relaxed mb-10 max-w-xl lg:max-w-none">
              Join the LUXURY JEWELRY MARKETPLACE — list your shop, set your making charges, and reach
              thousands of buyers. Your product prices sync automatically with live gold & silver rates.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/vendor/register"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-gray-900 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #E2C97E 50%, #C9A84C 100%)', boxShadow: '0 8px 30px rgba(201,168,76,0.4)' }}
              >
                Register Your Shop <ArrowRightIcon />
              </Link>
              <Link
                to="/stores"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white rounded-full transition-all duration-300 hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              >
                See Existing Shops
              </Link>
            </div>

            {/* Trust note */}
            <p className="text-sm text-white/40 mt-6">
              ✦ No listing fee &nbsp;·&nbsp; ✦ Approval within 48 hours &nbsp;·&nbsp; ✦ Cancel anytime
            </p>
          </motion.div>

          {/* Right — Stats card */}
          <motion.div
            className="flex-shrink-0 w-full max-w-sm lg:w-[380px]"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div
              className="rounded-3xl p-8 space-y-6"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50 mb-6">
                Platform at a Glance
              </p>
              <div className="grid grid-cols-2 gap-5">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <p
                      className="font-heading font-bold text-white leading-none mb-1"
                      style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.02em' }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[11px] text-white/45 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Inclusions */}
              <div className="space-y-2.5">
                {INCLUSIONS.slice(0, 5).map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 720 0 0 40L0 60Z" fill="#fdf9f6" />
          </svg>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fdf9f6]">
        <div className="container-luxury">
          <div className="text-center mb-14">
            <span className="section-eyebrow">Why Sell With Us</span>
            <h2 className="font-heading font-bold text-gray-900 uppercase"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', letterSpacing: '0.1em' }}>
              Everything You Need to Sell
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto" style={{ fontSize: '14.5px' }}>
              A complete platform designed specifically for jewellery shops — from listing to delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                variants={fadeUp}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 group"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300"
                  style={{ background: `${b.accent}14`, color: b.accent }}
                >
                  {b.icon}
                </div>
                <div className="h-0.5 w-8 rounded-full mb-4" style={{ background: b.accent }} />
                <h3 className="text-[15px] font-bold text-gray-900 mb-2 leading-snug">{b.title}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container-luxury">
          <div className="text-center mb-14">
            <span className="section-eyebrow">Simple Process</span>
            <h2 className="font-heading font-bold text-gray-900 uppercase"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', letterSpacing: '0.1em' }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                custom={i}
                initial="hidden"
                whileInView="show"
                variants={fadeUp}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-black relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #1a0e08 0%, #3a2520 100%)',
                    color: '#C9A84C',
                    boxShadow: '0 8px 24px rgba(26,14,8,0.25)',
                    fontFamily: 'Georgia, serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {step.step}
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ──────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #f9f3ee 0%, #f5ede4 100%)' }}>
        <div className="container-luxury">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="section-eyebrow">All-Inclusive</span>
              <h2 className="font-heading font-bold text-gray-900 uppercase"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', letterSpacing: '0.1em' }}>
                Everything Included
              </h2>
              <p className="text-gray-500 mt-3" style={{ fontSize: '14.5px' }}>
                No hidden charges. Everything listed below is included with your vendor account.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INCLUSIONS.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                      <CheckIcon />
                    </div>
                    <span className="text-[14px] font-medium text-gray-800">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">Ready to get started?</p>
                    <p className="text-sm text-gray-500">Registration takes less than 5 minutes.</p>
                  </div>
                  <Link
                    to="/vendor/register"
                    className="btn-primary whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #3a2520 100%)' }}
                  >
                    Register Your Shop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #2c1810 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(ellipse, #C9A84C 0%, transparent 70%)' }} />
        </div>

        <div className="container-luxury relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2
              className="font-heading font-bold text-white mb-6 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              Start Selling on
              <br />
              <span style={{ background: 'linear-gradient(135deg, #C9A84C, #E2C97E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUXURY JEWELRY Today
              </span>
            </h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto" style={{ fontSize: '15px' }}>
              Join India's growing jewellery marketplace. Approval within 48 hours. No listing fees.
            </p>
            <Link
              to="/vendor/register"
              className="inline-flex items-center gap-3 px-10 py-4 text-[13px] font-bold uppercase tracking-[0.14em] text-gray-900 rounded-full transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E2C97E)', boxShadow: '0 12px 40px rgba(201,168,76,0.45)' }}
            >
              Register My Shop <ArrowRightIcon />
            </Link>
            <p className="text-white/30 text-xs mt-5 tracking-wide">
              Already a vendor? <Link to="/vendor/login" className="text-white/50 hover:text-white underline transition-colors">Sign in to your panel</Link>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
