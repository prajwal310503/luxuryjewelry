const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const ACCOUNTS = require('./accounts');

const tokens = {};

async function loginAs(role) {
  const { email, password } = ACCOUNTS[role];
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.role).toBe(ACCOUNTS[role].role);
  expect(res.body.token).toBeTruthy();
  tokens[role] = res.body.token;
  return res.body.token;
}

describe('Role logins — admin, vendor, customer', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('admin can login', async () => { await loginAs('admin'); });
  test('vendor can login', async () => { await loginAs('vendor'); });
  test('customer can login', async () => { await loginAs('customer'); });
});

describe('Role API access — authorized routes', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB();
    for (const role of ['admin', 'vendor', 'customer']) {
      await loginAs(role);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('admin can access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toBeDefined();
  });

  test('vendor can access vendor dashboard', async () => {
    const res = await request(app)
      .get('/api/vendor/dashboard')
      .set('Authorization', `Bearer ${tokens.vendor}`);
    expect(res.status).toBe(200);
  });

  test('customer can access own profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokens.customer}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('customer');
  });
});

describe('Role API access — cross-role denied', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB();
    if (!tokens.customer) await loginAs('customer');
    if (!tokens.vendor) await loginAs('vendor');
    if (!tokens.admin) await loginAs('admin');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

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

  test('admin cannot access vendor dashboard', async () => {
    const res = await request(app)
      .get('/api/vendor/dashboard')
      .set('Authorization', `Bearer ${tokens.admin}`);
    expect(res.status).toBe(403);
  });
});
