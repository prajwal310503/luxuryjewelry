/**
 * Live E2E probe against running API — auth, catalog, cart-order path, roles.
 * Run: node tests/live-e2e-probe.js
 */
require('dotenv').config();
const axios = require('axios');

const API = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:8000/api';
const results = [];

function ok(name, detail) { results.push({ name, pass: true, detail }); console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail) { results.push({ name, pass: false, detail }); console.log(`FAIL  ${name} — ${detail}`); }

async function main() {
  console.log('API:', API);
  const tokens = {};

  // Health / products
  try {
    const r = await axios.get(`${API}/products`, { params: { limit: 5 } });
    if (r.data.success && r.data.data?.length) ok('Public products list', `${r.data.data.length} items, total=${r.data.meta?.total}`);
    else fail('Public products list', 'empty or unsuccessful');
  } catch (e) { fail('Public products list', e.message); }

  // Auth — 3 roles
  for (const [role, email, password] of [
    ['admin', 'admin@test.vkjewellers.com', 'VkAdmin@2026'],
    ['vendor', 'vendor@test.vkjewellers.com', 'VkVendor@2026'],
    ['customer', 'customer@test.vkjewellers.com', 'VkCustomer@2026'],
  ]) {
    try {
      const r = await axios.post(`${API}/auth/login`, { email, password });
      if (r.data.token && r.data.data?.role === role) {
        tokens[role] = r.data.token;
        ok(`${role} login`, email);
      } else fail(`${role} login`, JSON.stringify(r.data).slice(0, 120));
    } catch (e) { fail(`${role} login`, e.response?.data?.message || e.message); }
  }

  // Price filter
  try {
    const r = await axios.get(`${API}/products`, { params: { minPrice: 0, maxPrice: 15000, limit: 20 } });
    const bad = (r.data.data || []).filter((p) => {
      const sale = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
      return sale > 15000;
    });
    if (r.data.success && !bad.length) ok('Price filter ≤15K', `${r.data.data.length} products`);
    else fail('Price filter ≤15K', `${bad.length} overpriced`);
  } catch (e) { fail('Price filter ≤15K', e.message); }

  // Category rings
  try {
    const r = await axios.get(`${API}/products`, { params: { category: 'rings', limit: 10 } });
    if (r.data.data?.length) ok('Category rings', `${r.data.data.length} products`);
    else fail('Category rings', '0 products — category assignment may be broken');
  } catch (e) { fail('Category rings', e.message); }

  // Product detail by slug
  try {
    const list = await axios.get(`${API}/products`, { params: { limit: 2 } });
    const p = list.data.data[0];
    const d = await axios.get(`${API}/products/${p.slug}`);
    if (d.data.data?._id === p._id) ok('Product detail by slug', p.slug);
    else fail('Product detail by slug', 'ID mismatch (wrong product)');
  } catch (e) { fail('Product detail by slug', e.message); }

  // Search
  try {
    const r = await axios.get(`${API}/products`, { params: { search: 'ring', limit: 10 } });
    if (r.data.data?.length) ok('Search ring', `${r.data.data.length} hits`);
    else fail('Search ring', '0 hits');
  } catch (e) { fail('Search ring', e.message); }

  // Role isolation
  if (tokens.customer) {
    try {
      await axios.get(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${tokens.customer}` } });
      fail('Customer blocked from admin', 'got 200');
    } catch (e) {
      if (e.response?.status === 403) ok('Customer blocked from admin', '403');
      else fail('Customer blocked from admin', e.response?.status || e.message);
    }
  }

  // Admin dashboard
  if (tokens.admin) {
    try {
      const r = await axios.get(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
      if (r.data.success) ok('Admin dashboard', `orders=${r.data.data?.stats?.totalOrders}`);
      else fail('Admin dashboard', 'unsuccessful');
    } catch (e) { fail('Admin dashboard', e.response?.data?.message || e.message); }
  }

  // Vendor dashboard + products
  if (tokens.vendor) {
    try {
      const r = await axios.get(`${API}/vendor/dashboard`, { headers: { Authorization: `Bearer ${tokens.vendor}` } });
      if (r.data.success) ok('Vendor dashboard', 'ok');
      else fail('Vendor dashboard', 'unsuccessful');
    } catch (e) { fail('Vendor dashboard', e.response?.data?.message || e.message); }
    try {
      const r = await axios.get(`${API}/vendor/products`, { headers: { Authorization: `Bearer ${tokens.vendor}` } });
      if (r.data.success) ok('Vendor products list', `${r.data.data?.products?.length ?? 'n/a'} items`);
      else fail('Vendor products list', 'unsuccessful');
    } catch (e) { fail('Vendor products list', e.response?.data?.message || e.message); }
  }

  // Customer orders + place COD order
  if (tokens.customer) {
    try {
      const list = await axios.get(`${API}/products`, { params: { limit: 1, maxPrice: 20000 } });
      const product = list.data.data?.[0];
      if (!product) throw new Error('no product');
      const r = await axios.post(`${API}/orders`, {
        items: [{ product: product._id, quantity: 1 }],
        shippingAddress: {
          fullName: 'E2E Probe', phone: '9876543210',
          addressLine1: 'Test St', city: 'Mumbai', state: 'MH', pincode: '400001', country: 'India',
        },
        payment: { method: 'cod' },
      }, { headers: { Authorization: `Bearer ${tokens.customer}` } });
      if (r.status === 201 && r.data.success) ok('Customer COD order', `id=${r.data.data?.orders?.[0]?._id || r.data.data?._id}`);
      else fail('Customer COD order', JSON.stringify(r.data).slice(0, 150));
    } catch (e) { fail('Customer COD order', e.response?.data?.message || e.message); }

    try {
      const r = await axios.get(`${API}/orders/my`, { headers: { Authorization: `Bearer ${tokens.customer}` } });
      if (r.data.success) ok('Customer my orders', `${(r.data.data || []).length} orders`);
      else fail('Customer my orders', 'unsuccessful');
    } catch (e) { fail('Customer my orders', e.response?.data?.message || e.message); }
  }

  // Categories / blog / cms
  for (const [name, path] of [
    ['Categories', '/categories'],
    ['Blog', '/blog'],
    ['CMS banners', '/cms/banners'],
  ]) {
    try {
      const r = await axios.get(`${API}${path}`);
      if (r.data.success) ok(name, 'ok');
      else fail(name, 'unsuccessful');
    } catch (e) { fail(name, e.response?.data?.message || e.message); }
  }

  // Payment config probe (informational)
  try {
    const r = await axios.get(`${API}/payments/razorpay/key`).catch((e) => e.response);
    if (r?.status === 200) ok('Razorpay key endpoint', String(r.data?.data?.key || r.data).slice(0, 40));
    else fail('Razorpay key endpoint', `status=${r?.status} ${r?.data?.message || ''}`);
  } catch (e) { fail('Razorpay key endpoint', e.message); }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log('\n========== SUMMARY ==========');
  console.log(`Passed: ${passed}  Failed: ${failed}  Total: ${results.length}`);
  process.exit(failed ? 1 : 0);
}

main();
