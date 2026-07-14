/**
 * Full marketplace flow test: login, register, vendor product, admin approve, customer buy.
 * Run: npm run test:e2e
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');

const ACCOUNTS = require('./accounts');

const tokens = {};
let testProductId = null;
let testCategoryId = null;
let testOrderId = null;

async function loginAs(role) {
  const { email, password } = ACCOUNTS[role];
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  expect(res.body.data.role).toBe(ACCOUNTS[role].role);
  tokens[role] = res.body.token;
  return res.body.token;
}

describe('E2E — Full marketplace flow', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB();
    const cat = await Category.findOne({ isActive: true }).select('_id');
    testCategoryId = cat?._id?.toString();
    expect(testCategoryId).toBeTruthy();
  });

  afterAll(async () => {
    if (testProductId) {
      await Product.deleteOne({ _id: testProductId, title: /^E2E Test Ring/ });
    }
    const testUser = await User.findOne({ email: /^e2e-newuser-/ });
    if (testUser) await User.deleteOne({ _id: testUser._id });
    await mongoose.connection.close();
  });

  describe('1. Login — all 3 roles', () => {
    test('admin login', async () => { await loginAs('admin'); });
    test('vendor login', async () => { await loginAs('vendor'); });
    test('customer login', async () => { await loginAs('customer'); });
  });

  describe('2. New user registration', () => {
    const newEmail = `e2e-newuser-${Date.now()}@test.vkjewellers.com`;

    test('register creates customer account', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'E2E New User',
        email: newEmail,
        phone: '9876543299',
        password: 'TestPass@123',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('customer');
      expect(res.body.token).toBeTruthy();
    });

    test('new user can login after register', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: newEmail,
        password: 'TestPass@123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('customer');
    });
  });

  describe('3. Vendor adds product', () => {
    test('vendor can access dashboard', async () => {
      const res = await request(app)
        .get('/api/vendor/dashboard')
        .set('Authorization', `Bearer ${tokens.vendor}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('vendor creates product (pending approval)', async () => {
      const res = await request(app)
        .post('/api/vendor/products')
        .set('Authorization', `Bearer ${tokens.vendor}`)
        .send({
          title: `E2E Test Ring ${Date.now()}`,
          category: testCategoryId,
          price: 25000,
          stock: 10,
          description: 'Automated E2E test product',
          purity: '22K',
          metalWeight: 5,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      testProductId = res.body.data._id;
    });

    test('vendor sees own pending product', async () => {
      const res = await request(app)
        .get('/api/vendor/products')
        .set('Authorization', `Bearer ${tokens.vendor}`);
      expect(res.status).toBe(200);
      const list = res.body.data?.products || [];
      const found = list.some((p) => String(p._id) === String(testProductId));
      expect(found).toBe(true);
    });
  });

  describe('4. Admin approves product', () => {
    test('admin can access dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
    });

    test('admin approves vendor product', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${testProductId}/status`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ status: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    test('approved product visible on public API', async () => {
      const product = await Product.findById(testProductId);
      const res = await request(app).get(`/api/products/${product.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('E2E Test Ring');
    });
  });

  describe('5. Customer buys product', () => {
    test('customer places COD order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${tokens.customer}`)
        .send({
          items: [{ product: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: 'Test Customer',
            phone: '9876543211',
            addressLine1: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India',
          },
          payment: { method: 'cod' },
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const orders = res.body.data?.orders || [res.body.data];
      testOrderId = orders[0]?._id || orders[0]?.orderNumber;
      expect(testOrderId).toBeTruthy();
    });

    test('customer sees order in my orders', async () => {
      const res = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(res.status).toBe(200);
      const orders = res.body.data || [];
      expect(orders.length).toBeGreaterThan(0);
    });

    test('vendor sees the order', async () => {
      const res = await request(app)
        .get('/api/vendor/orders')
        .set('Authorization', `Bearer ${tokens.vendor}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('admin dashboard reflects sales', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalOrders).toBeGreaterThan(0);
    });
  });

  describe('6. Security — role isolation', () => {
    test('customer cannot access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(res.status).toBe(403);
    });

    test('vendor cannot access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.vendor}`);
      expect(res.status).toBe(403);
    });

    test('unauthenticated cannot create order', async () => {
      const res = await request(app).post('/api/orders').send({ items: [] });
      expect(res.status).toBe(401);
    });
  });
});
