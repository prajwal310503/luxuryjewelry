/**
 * Comprehensive platform API tests — storefront, auth, customer, vendor, admin.
 * Run: npm run test:full  (or npm run test:all)
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Coupon = require('../src/models/Coupon');
const SupportTicket = require('../src/models/SupportTicket');

const ACCOUNTS = require('./accounts');

const tokens = {};
let approvedProduct = null;
let customerOrderId = null;
let vendorOrderId = null;
let testCouponId = null;
let testCategoryId = null;
let testTicketId = null;
const testCouponCode = `T${Date.now().toString(36).slice(-5).toUpperCase()}`;

async function loginAs(role) {
  const { email, password } = ACCOUNTS[role];
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  tokens[role] = res.body.token;
  return res.body.token;
}

function auth(role) {
  return { Authorization: `Bearer ${tokens[role]}` };
}

describe('Full platform — API coverage', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB();

    await loginAs('admin');
    await loginAs('vendor');
    await loginAs('customer');

    approvedProduct = await Product.findOne({ status: 'approved', isActive: true })
      .select('_id slug title price store')
      .lean();
    expect(approvedProduct).toBeTruthy();

    const customer = await User.findOne({ email: ACCOUNTS.customer.email }).select('_id');
    const latestOrder = await Order.findOne({ customer: customer._id })
      .sort({ createdAt: -1 })
      .select('_id status payment')
      .lean();
    if (latestOrder) customerOrderId = latestOrder._id.toString();

    const vendor = await User.findOne({ email: ACCOUNTS.vendor.email }).select('_id');
    const Store = require('../src/models/Store');
    const store = await Store.findOne({ vendor: vendor._id }).select('_id');
    if (store) {
      const vendorOrder = await Order.findOne({ store: store._id })
        .sort({ createdAt: -1 })
        .select('_id status payment')
        .lean();
      if (vendorOrder) vendorOrderId = vendorOrder._id.toString();
    }
  });

  afterAll(async () => {
    if (testCouponId) await Coupon.deleteOne({ _id: testCouponId });
    if (testCategoryId) await Category.deleteOne({ _id: testCategoryId, name: /^Test Cat / });
    if (testTicketId) await SupportTicket.deleteOne({ _id: testTicketId });
    await mongoose.connection.close();
  });

  // ── Public storefront ─────────────────────────────────────────────────────

  describe('Storefront (public)', () => {
    test('GET /products lists approved products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.data?.products || res.body.data || [];
      expect(Array.isArray(list) ? list.length : res.body.pagination?.total).toBeGreaterThan(0);
    });

    test('GET /products/:slug returns product detail', async () => {
      const res = await request(app).get(`/api/products/${approvedProduct.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(approvedProduct.slug);
    });

    test('GET /categories returns category tree', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /blog returns posts', async () => {
      const res = await request(app).get('/api/blog');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /cms/banners returns banners', async () => {
      const res = await request(app).get('/api/cms/banners');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /cms/pages/home returns home sections', async () => {
      const res = await request(app).get('/api/cms/pages/home');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /orders/search/suggest returns suggestions', async () => {
      const res = await request(app).get('/api/orders/search/suggest?q=ring');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /attributes returns product attributes', async () => {
      const res = await request(app).get('/api/attributes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /stores lists stores', async () => {
      const res = await request(app).get('/api/stores');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── Auth extended ─────────────────────────────────────────────────────────

  describe('Auth', () => {
    test('GET /auth/me returns profile for each role', async () => {
      for (const role of ['admin', 'vendor', 'customer']) {
        const res = await request(app).get('/api/auth/me').set(auth(role));
        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe(ACCOUNTS[role].role);
      }
    });

    test('PUT /auth/profile updates customer name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set(auth('customer'))
        .send({ name: 'Test Customer Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Test Customer Updated');

      await request(app)
        .put('/api/auth/profile')
        .set(auth('customer'))
        .send({ name: 'Test Customer' });
    });

    test('POST /auth/logout succeeds', async () => {
      const res = await request(app).post('/api/auth/logout').set(auth('customer'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      await loginAs('customer');
    });

    test('POST /auth/forgot-password returns 404 for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@test.vkjewellers.com' });
      expect(res.status).toBe(404);
    });

    test('POST /auth/forgot-password accepts valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: ACCOUNTS.customer.email });
      expect([200, 500]).toContain(res.status);
    });
  });

  // ── Customer ──────────────────────────────────────────────────────────────

  describe('Customer', () => {
    test('GET /orders/my returns order history', async () => {
      const res = await request(app).get('/api/orders/my').set(auth('customer'));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /orders/:id hides commission from customer', async () => {
      if (!customerOrderId) return;
      const res = await request(app).get(`/api/orders/${customerOrderId}`).set(auth('customer'));
      expect(res.status).toBe(200);
      const order = res.body.data;
      expect(order.commissionAmount).toBeUndefined();
      expect(order.vendorPayout).toBeUndefined();
    });

    test('GET /orders/:id/invoice returns PDF', async () => {
      if (!customerOrderId) return;
      const res = await request(app).get(`/api/orders/${customerOrderId}/invoice`).set(auth('customer'));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
    });

    test('POST /support creates ticket', async () => {
      const res = await request(app)
        .post('/api/support')
        .set(auth('customer'))
        .send({ subject: 'Test ticket', body: 'Automated test support message', reason: 'general' });
      expect(res.status).toBe(201);
      testTicketId = res.body.data?._id;
      expect(testTicketId).toBeTruthy();
    });

    test('GET /support/my lists tickets', async () => {
      const res = await request(app).get('/api/support/my').set(auth('customer'));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /coupons/available returns offers', async () => {
      const res = await request(app).get('/api/coupons/available').set(auth('customer'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('POST /coupons/validate rejects invalid code', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set(auth('customer'))
        .send({ code: 'ZZZZZZ', subtotal: 1000 });
      expect(res.status).toBe(400);
    });
  });

  // ── Vendor ────────────────────────────────────────────────────────────────

  describe('Vendor', () => {
    test('GET /vendor/kyc returns KYC status', async () => {
      const res = await request(app).get('/api/vendor/kyc').set(auth('vendor'));
      expect(res.status).toBe(200);
      expect(res.body.data.kyc).toBeDefined();
    });

    test('GET /vendor/store returns store profile', async () => {
      const res = await request(app).get('/api/vendor/store').set(auth('vendor'));
      expect(res.status).toBe(200);
      expect(res.body.data.store).toBeDefined();
    });

    test('PUT /vendor/store updates tagline', async () => {
      const before = await request(app).get('/api/vendor/store').set(auth('vendor'));
      const tagline = before.body.data.store?.tagline || '';
      const res = await request(app)
        .put('/api/vendor/store')
        .set(auth('vendor'))
        .send({ tagline: 'Test tagline' });
      expect(res.status).toBe(200);
      await request(app).put('/api/vendor/store').set(auth('vendor')).send({ tagline });
    });

    test('GET /vendor/products lists vendor catalog', async () => {
      const res = await request(app).get('/api/vendor/products').set(auth('vendor'));
      expect(res.status).toBe(200);
      const list = res.body.data?.products || [];
      expect(Array.isArray(list)).toBe(true);
    });

    test('GET /reports/vendor/sales returns analytics', async () => {
      const res = await request(app).get('/api/reports/vendor/sales').set(auth('vendor'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /reports/vendor/products returns product report', async () => {
      const res = await request(app).get('/api/reports/vendor/products').set(auth('vendor'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('PUT /vendor/orders/:id/status updates to processing', async () => {
      if (!vendorOrderId) return;
      const res = await request(app)
        .put(`/api/vendor/orders/${vendorOrderId}/status`)
        .set(auth('vendor'))
        .send({ status: 'processing', comment: 'Test update' });
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('processing');
    });
  });

  // ── Admin ─────────────────────────────────────────────────────────────────

  describe('Admin', () => {
    test('GET /admin/dashboard includes commission stats', async () => {
      const res = await request(app).get('/api/admin/dashboard').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.totalOrders).toBeGreaterThanOrEqual(0);
    });

    test('GET /admin/users lists all users', async () => {
      const res = await request(app).get('/api/admin/users').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /admin/users?role=customer filters customers', async () => {
      const res = await request(app).get('/api/admin/users?role=customer').set(auth('admin'));
      expect(res.status).toBe(200);
      const users = res.body.data || [];
      if (users.length) expect(users.every((u) => u.role === 'customer')).toBe(true);
    });

    test('GET /admin/products lists products', async () => {
      const res = await request(app).get('/api/admin/products').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /vendor/admin/list lists vendors', async () => {
      const res = await request(app).get('/api/vendor/admin/list').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /orders/admin/all lists orders', async () => {
      const res = await request(app).get('/api/orders/admin/all').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /coupons/admin lists coupons', async () => {
      const res = await request(app).get('/api/coupons/admin').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('POST /coupons/admin creates global coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/admin')
        .set(auth('admin'))
        .send({
          code: testCouponCode,
          title: 'Test Coupon',
          couponKind: 'global',
          type: 'percentage',
          value: 10,
          minOrderAmount: 100,
        });
      expect(res.status).toBe(201);
      testCouponId = res.body.data?._id;
      expect(testCouponId).toBeTruthy();
    });

    test('POST /coupons/validate accepts created coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set(auth('customer'))
        .send({ code: testCouponCode, subtotal: 5000 });
      expect(res.status).toBe(200);
      expect(res.body.data.discount).toBeGreaterThan(0);
    });

    test('POST /categories/admin creates category', async () => {
      const res = await request(app)
        .post('/api/categories/admin')
        .set(auth('admin'))
        .send({ name: `Test Cat ${Date.now()}`, commissionRate: 5 });
      expect(res.status).toBe(201);
      testCategoryId = res.body.data?._id;
      expect(testCategoryId).toBeTruthy();
    });

    test('GET /master-data returns pricing master data', async () => {
      const res = await request(app).get('/api/master-data').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /settings returns site settings', async () => {
      const res = await request(app).get('/api/settings').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /reports/admin/sales returns sales report', async () => {
      const res = await request(app).get('/api/reports/admin/sales').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /reports/admin/orders returns order report', async () => {
      const res = await request(app).get('/api/reports/admin/orders').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /reports/admin/vendors returns vendor report', async () => {
      const res = await request(app).get('/api/reports/admin/vendors').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /blog/admin/all returns blog posts', async () => {
      const res = await request(app).get('/api/blog/admin/all').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /cms/admin/banners returns admin banners', async () => {
      const res = await request(app).get('/api/cms/admin/banners').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /support/admin/all returns support tickets', async () => {
      const res = await request(app).get('/api/support/admin/all').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /stores/admin/all returns stores', async () => {
      const res = await request(app).get('/api/stores/admin/all').set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── Role isolation (extra) ────────────────────────────────────────────────

  describe('Access control', () => {
    test('customer cannot access admin settings', async () => {
      const res = await request(app).get('/api/settings').set(auth('customer'));
      expect(res.status).toBe(403);
    });

    test('vendor cannot access admin users', async () => {
      const res = await request(app).get('/api/admin/users').set(auth('vendor'));
      expect(res.status).toBe(403);
    });

    test('customer cannot access vendor dashboard', async () => {
      const res = await request(app).get('/api/vendor/dashboard').set(auth('customer'));
      expect(res.status).toBe(403);
    });
  });
});
