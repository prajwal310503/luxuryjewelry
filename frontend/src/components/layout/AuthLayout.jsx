import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const STARS = Array.from({ length: 5 });

export default function AuthLayout() {
  return (
    <div className="h-screen overflow-hidden flex">

      {/* ── Left panel ─────────────────────────────────── */}
      <div className="hidden min-[860px]:flex flex-col w-[44%] xl:w-[46%] relative overflow-hidden flex-shrink-0 text-white"
           style={{ background: 'linear-gradient(145deg,#3b2826 0%,#5a413f 55%,#4a3431 100%)' }}>

        {/* Large background diamond */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 400 500" fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="M200 30L50 180L200 470L350 180Z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.04)" />
          <line x1="50"  y1="180" x2="350" y2="180" stroke="white" strokeWidth="1"/>
          <line x1="200" y1="30"  x2="120" y2="180" stroke="white" strokeWidth="0.8"/>
          <line x1="200" y1="30"  x2="280" y2="180" stroke="white" strokeWidth="0.8"/>
          <line x1="200" y1="30"  x2="80"  y2="180" stroke="white" strokeWidth="0.5"/>
          <line x1="200" y1="30"  x2="320" y2="180" stroke="white" strokeWidth="0.5"/>
          <line x1="120" y1="180" x2="200" y2="470" stroke="white" strokeWidth="0.5"/>
          <line x1="280" y1="180" x2="200" y2="470" stroke="white" strokeWidth="0.5"/>
          <line x1="80"  y1="180" x2="200" y2="470" stroke="white" strokeWidth="0.3"/>
          <line x1="320" y1="180" x2="200" y2="470" stroke="white" strokeWidth="0.3"/>
        </svg>

        {/* Gold ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gold/25 blur-[100px] pointer-events-none" />
        <div className="absolute top-16 right-10 w-40 h-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-11 pt-10 pb-8 xl:px-14 xl:pt-12 xl:pb-10">

          {/* Logo — fixed at top */}
          <Link to="/" className="inline-flex items-center gap-3 flex-shrink-0 group mb-auto">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/15 transition-colors">
              <span className="font-heading font-bold text-gold text-base">L</span>
            </div>
            <div>
              <p className="text-[9px] text-white/45 uppercase tracking-[0.4em] leading-none mb-1">Luxury</p>
              <p className="font-heading text-[17px] font-bold leading-none">Jewelry</p>
            </div>
          </Link>

          {/* Main content — centered in remaining space */}
          <div className="flex-1 flex flex-col justify-center py-6">
            {/* Gold diamond icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-6"
            >
              <svg width="50" height="62" viewBox="0 0 160 200" fill="none">
                <path d="M80 8L18 72L80 192L142 72Z" stroke="rgba(201,168,76,0.85)" strokeWidth="2" fill="rgba(201,168,76,0.12)" />
                <line x1="18" y1="72" x2="142" y2="72" stroke="rgba(201,168,76,0.6)" strokeWidth="1.8"/>
                <line x1="80" y1="8" x2="52" y2="72" stroke="rgba(201,168,76,0.45)" strokeWidth="1.2"/>
                <line x1="80" y1="8" x2="108" y2="72" stroke="rgba(201,168,76,0.45)" strokeWidth="1.2"/>
                <line x1="52" y1="72" x2="80" y2="192" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8"/>
                <line x1="108" y1="72" x2="80" y2="192" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8"/>
                <line x1="80" y1="8"  x2="34" y2="72" stroke="rgba(201,168,76,0.25)" strokeWidth="0.8"/>
                <line x1="80" y1="8"  x2="126" y2="72" stroke="rgba(201,168,76,0.25)" strokeWidth="0.8"/>
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="font-heading font-bold text-white leading-[1.15] mb-4"
              style={{ fontSize: 'clamp(1.75rem, 2.6vw, 2.4rem)' }}
            >
              Crafted with<br />
              <span className="text-gold">Passion &</span><br />
              Precision
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-white/50 text-[13px] leading-relaxed max-w-[270px] mb-6"
            >
              Discover exquisite jewelry crafted for those who appreciate the finest things in life.
            </motion.p>

            {/* Gold separator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-gold/50" />
              <svg className="w-2.5 h-2.5 text-gold/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.1 9.1H2l5.9 4.3L5.6 20l6.4-4.6L18.4 20l-2.3-6.6 5.9-4.3H15z" />
              </svg>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { number: '50K+', label: 'Customers' },
                { number: '15K+', label: 'Designs' },
                { number: '100+', label: 'Vendors' },
              ].map((stat) => (
                <div key={stat.label} className="text-center border border-white/8 rounded-xl py-2.5 bg-white/4">
                  <p className="font-heading text-base font-bold text-gold leading-none mb-1">{stat.number}</p>
                  <p className="text-[9px] text-white/40 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial — compact, fixed at bottom */}
          <div className="flex-shrink-0 bg-white/6 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/30 flex items-center justify-center text-gold font-bold text-xs flex-shrink-0">P</div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-0.5 mb-1">
                  {STARS.map((_, i) => (
                    <svg key={i} className="w-2.5 h-2.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[11.5px] text-white/55 italic leading-snug line-clamp-2">
                  "Exceptional craftsmanship. Every piece tells a story of elegance."
                </p>
                <p className="text-[10px] text-white/30 mt-1">— Priya Sharma, Mumbai</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Right panel ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#f0ebe7]">
        <div className="min-h-full flex items-center justify-center p-5 py-6">
          <div className="w-full max-w-[410px]">

            {/* Small-screen logo — shown below 860px */}
            <div className="min-[860px]:hidden mb-4 text-center">
              <Link to="/">
                <span className="block text-[9px] text-primary/50 uppercase tracking-[0.4em] mb-0.5">Luxury</span>
                <span className="font-heading text-2xl font-bold text-primary">Jewelry</span>
              </Link>
            </div>

            {/* White card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 xl:p-8"
                 style={{ boxShadow: '0 8px 48px rgba(90,65,63,0.10), 0 2px 12px rgba(90,65,63,0.06)' }}>
              <Outlet />
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-3">
              © 2026 Luxury Jewelry. All rights reserved.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
