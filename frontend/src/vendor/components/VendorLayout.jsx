import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const I = ({ d, d2 }) => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const NAV = [
  { to: '/vendor/dashboard', icon: <I d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />, label: 'Dashboard' },
  { to: '/vendor/products',  icon: <I d="M12 2L2 9l10 13L22 9z" />, label: 'My Products' },
  { to: '/vendor/orders',    icon: <I d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />, label: 'Orders' },
  { to: '/vendor/store',     icon: <I d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, label: 'My Store' },
];

export default function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, vendorProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 fixed h-full z-30 shadow-sm`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-bold text-sm">V</span>
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wider">LUXURY</p>
              <p className="text-sm font-heading font-bold text-gray-800 leading-tight">Vendor Panel</p>
            </div>
          )}
        </div>

        {/* Vendor Status */}
        {sidebarOpen && vendorProfile && (
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-700 truncate">{vendorProfile.storeName}</p>
            <span className={`text-2xs font-medium px-1.5 py-0.5 rounded-full ${
              vendorProfile.status === 'approved' ? 'bg-green-100 text-green-700' :
              vendorProfile.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-600'
            }`}>
              {vendorProfile.status}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `admin-nav-item mb-0.5 ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              {sidebarOpen && <span className="text-sm">{label}</span>}
            </NavLink>
          ))}

          {sidebarOpen && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <NavLink
                to="/vendor/products/add"
                className="admin-nav-item mb-0.5 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-semibold">Add Product</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-gray-100 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                {user?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-2xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <Link
              to="/vendor/products/add"
              className="btn-primary text-xs py-2 px-4"
            >
              + Add Product
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Store
            </a>
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
