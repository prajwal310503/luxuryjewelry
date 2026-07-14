import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

const mockStore = {
  user: null,
  token: null,
  authReady: true,
};

vi.mock('../../store/authStore', () => ({
  default: () => mockStore,
}));

vi.mock('../ui/PageLoader', () => ({
  default: () => <div data-testid="loader">Loading...</div>,
}));

function renderAt(path, ui) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={ui} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        <Route path="/vendor/dashboard" element={<div>Vendor Dashboard Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockStore.user = null;
    mockStore.token = null;
    mockStore.authReady = true;
  });

  it('redirects to login when not authenticated', () => {
    renderAt('/admin/dashboard', (
      <ProtectedRoute roles={['admin']}>
        <div>Secret Admin</div>
      </ProtectedRoute>
    ));
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows loader while auth is bootstrapping', () => {
    mockStore.authReady = false;
    renderAt('/admin/dashboard', (
      <ProtectedRoute roles={['admin']}>
        <div>Secret Admin</div>
      </ProtectedRoute>
    ));
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('allows admin to access admin routes', () => {
    mockStore.token = 'valid-token';
    mockStore.user = { role: 'admin', permissions: [] };
    renderAt('/admin/dashboard', (
      <ProtectedRoute roles={['admin']}>
        <div>Secret Admin</div>
      </ProtectedRoute>
    ));
    expect(screen.getByText('Secret Admin')).toBeInTheDocument();
  });

  it('blocks customer from admin routes', () => {
    mockStore.token = 'valid-token';
    mockStore.user = { role: 'customer', permissions: [] };
    renderAt('/admin/dashboard', (
      <ProtectedRoute roles={['admin']}>
        <div>Secret Admin</div>
      </ProtectedRoute>
    ));
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('allows vendor to access vendor routes', () => {
    mockStore.token = 'valid-token';
    mockStore.user = { role: 'vendor', permissions: [] };
    renderAt('/vendor/dashboard', (
      <ProtectedRoute roles={['vendor']}>
        <div>Vendor Dashboard Page</div>
      </ProtectedRoute>
    ));
    expect(screen.getByText('Vendor Dashboard Page')).toBeInTheDocument();
  });

  it('blocks vendor from admin routes', () => {
    mockStore.token = 'valid-token';
    mockStore.user = { role: 'vendor', permissions: [] };
    renderAt('/admin/dashboard', (
      <ProtectedRoute roles={['admin']}>
        <div>Secret Admin</div>
      </ProtectedRoute>
    ));
    expect(screen.getByText('Vendor Dashboard Page')).toBeInTheDocument();
  });
});
