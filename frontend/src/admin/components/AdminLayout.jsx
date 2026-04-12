import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const I = ({ d, d2 }) => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const NAV = [
  { to: '/admin/dashboard',         label: 'Dashboard',       icon: <I d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
  { to: '/admin/products',           label: 'Products',        icon: <I d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /> },
  { to: '/admin/products/images',    label: 'Product Images',  icon: <I d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  { to: '/admin/categories/images',  label: 'Category Images', icon: <I d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  { to: '/admin/site-images',        label: 'Site Images',     icon: <I d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" d2="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /> },
  { to: '/admin/categories',         label: 'Categories',      icon: <I d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z" /> },
  { to: '/admin/orders',             label: 'Orders',          icon: <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
  { to: '/admin/customers',          label: 'Customers',       icon: <I d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
  { to: '/admin/vendors',            label: 'Vendors',         icon: <I d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" d2="M9 22V12h6v10" /> },
  { to: '/admin/cms',                label: 'Home Page',       icon: <I d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { to: '/admin/blog',               label: 'Blog Posts',      icon: <I d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" /> },
  { to: '/admin/attributes',         label: 'Attributes',      icon: <I d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z" /> },
  { to: '/admin/settings',           label: 'Settings',        icon: <I d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
];

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const HamburgerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Sidebar content shared between desktop + mobile drawer ──────────────────
function SidebarContent({ collapsed, onClose, user, onLogout }) {
  return (
    <>
      {/* Logo */}
      <div
        className="h-16 flex items-center px-4 gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.5)' }}
      >
        <div
          className="w-9 h-9 flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg,#5a413f,#7a5a57)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(90,65,63,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}
        >
          <span className="text-white font-bold text-sm">L</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Luxury</p>
            <p className="text-sm font-bold text-gray-800 leading-tight">Admin Panel</p>
          </div>
        )}
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="flex-shrink-0">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.5)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.45)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0"
              style={{ background: 'rgba(90,65,63,0.12)', border: '1.5px solid rgba(90,65,63,0.15)' }}
            >
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50/50 flex-shrink-0"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-red-500 mx-auto flex items-center justify-center w-9 h-9 rounded-xl hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogoutIcon />
          </button>
        )}
      </div>
    </>
  );
}

export default function AdminLayout() {
  // Desktop: collapsed/expanded; Mobile: drawer open/close
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Track desktop breakpoint
  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarWidth = desktopCollapsed ? 64 : 256;
  const contentMargin = isDesktop ? sidebarWidth : 0;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg,#fdf9f6 0%,#f8f2ec 35%,#f3ebe3 65%,#eee4da 100%)' }}
    >
      {/* Decorative orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glass-orb w-96 h-96 bg-rose-200 top-[-80px] left-[-60px]" />
        <div className="glass-orb w-80 h-80 bg-amber-100 bottom-[-60px] right-[10%]" />
        <div className="glass-orb w-64 h-64 bg-primary/10 top-1/2 left-1/3" />
      </div>

      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────────── */}
      <aside
        className="glass-sidebar hidden lg:flex flex-col transition-all duration-300 fixed h-full z-30"
        style={{
          width: sidebarWidth,
          borderRadius: '0 24px 24px 0',
        }}
      >
        <SidebarContent
          collapsed={desktopCollapsed}
          onClose={null}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              style={{ backdropFilter: 'blur(2px)' }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="glass-sidebar fixed left-0 top-0 bottom-0 z-50 lg:hidden flex flex-col"
              style={{ width: 260, borderRadius: '0 24px 24px 0' }}
            >
              <SidebarContent
                collapsed={false}
                onClose={() => setMobileOpen(false)}
                user={user}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col min-w-0 flex-1 transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 1px 20px rgba(90,65,63,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-primary transition-colors"
              style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="hidden lg:flex p-2 text-gray-500 hover:text-primary transition-colors"
              style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
              aria-label="Toggle sidebar"
            >
              <HamburgerIcon />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex text-sm text-gray-500 hover:text-primary items-center gap-1.5 transition-colors px-3 py-1.5"
              style={{ borderRadius: '999px', background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Store
            </a>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0"
              style={{ background: 'rgba(90,65,63,0.10)', border: '1.5px solid rgba(90,65,63,0.15)' }}
            >
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
