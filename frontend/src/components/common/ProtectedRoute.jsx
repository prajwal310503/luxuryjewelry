import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based gate
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'child_admin') {
      const perms = user.permissions || [];
      if (perms.includes('orders')) return <Navigate to="/admin/orders" replace />;
      if (perms.includes('quotes')) return <Navigate to="/admin/quotes" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Permission gate for child_admin (admin always passes)
  if (permission && user.role === 'child_admin') {
    if (!(user.permissions || []).includes(permission)) {
      const perms = user.permissions || [];
      if (perms.includes('orders')) return <Navigate to="/admin/orders" replace />;
      if (perms.includes('quotes')) return <Navigate to="/admin/quotes" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
