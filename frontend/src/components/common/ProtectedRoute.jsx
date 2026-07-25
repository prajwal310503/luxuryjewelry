import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import PageLoader from '../ui/PageLoader';

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, token, authReady } = useAuthStore();
  const location = useLocation();

  const staffFallback = () => {
    const perms = user?.permissions || [];
    const order = ['dashboard', 'orders', 'products', 'support', 'notifications', 'customers'];
    const map = {
      dashboard: '/admin/dashboard',
      orders: '/admin/orders',
      products: '/admin/products',
      support: '/admin/support',
      notifications: '/admin/notifications',
      customers: '/admin/customers',
    };
    for (const p of order) {
      if (perms.includes(p) && map[p]) return map[p];
    }
    return '/';
  };

  if (!authReady) {
    return <PageLoader />;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based gate
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'child_admin') return <Navigate to={staffFallback()} replace />;
    if (user.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Permission gate for child_admin (admin always passes)
  if (permission && user.role === 'child_admin') {
    if (!(user.permissions || []).includes(permission)) {
      return <Navigate to={staffFallback()} replace />;
    }
  }

  return children;
}
