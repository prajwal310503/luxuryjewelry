import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

/**
 * Smoke tests for quote redirects (mirrors App.jsx).
 * Public /stores is a real page again — not redirected.
 */
function LegacyRedirects() {
  return (
    <Routes>
      <Route path="/my-quotes" element={<Navigate to="/orders" replace />} />
      <Route path="/request-quote" element={<Navigate to="/" replace />} />
      <Route path="/quotes/:id" element={<Navigate to="/orders" replace />} />
      <Route path="/admin/quotes" element={<Navigate to="/admin/orders" replace />} />
      <Route path="/stores" element={<div>Stores List</div>} />
      <Route path="/orders" element={<div>Orders Page</div>} />
      <Route path="/admin/orders" element={<div>Admin Orders</div>} />
      <Route path="/" element={<div>Home</div>} />
    </Routes>
  );
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LegacyRedirects />
    </MemoryRouter>
  );
}

describe('Quote redirects & stores page', () => {
  it('redirects /my-quotes to orders', () => {
    renderAt('/my-quotes');
    expect(screen.getByText('Orders Page')).toBeInTheDocument();
  });

  it('redirects /request-quote to home', () => {
    renderAt('/request-quote');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('redirects /quotes/:id to orders', () => {
    renderAt('/quotes/abc123');
    expect(screen.getByText('Orders Page')).toBeInTheDocument();
  });

  it('redirects /admin/quotes to admin orders', () => {
    renderAt('/admin/quotes');
    expect(screen.getByText('Admin Orders')).toBeInTheDocument();
  });

  it('renders /stores list (not redirect)', () => {
    renderAt('/stores');
    expect(screen.getByText('Stores List')).toBeInTheDocument();
  });
});
