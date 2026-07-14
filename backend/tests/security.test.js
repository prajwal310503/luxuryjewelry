const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

describe('Security — API protection', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('admin dashboard returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('admin dashboard returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('vendor routes return 401 without token', async () => {
    const res = await request(app).get('/api/vendor/dashboard');
    expect(res.status).toBe(401);
  });

  test('public register cannot escalate to admin role', async () => {
    const email = `sec-test-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security Test',
        email,
        password: 'TestPass@123',
        role: 'admin',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('customer');

    const dbUser = await User.findOne({ email }).select('role');
    expect(dbUser.role).toBe('customer');
    await User.deleteOne({ email });
  });

  test('login rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });

  test('login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@exists.test', password: 'wrongpass' });
    expect([401, 400]).toContain(res.status);
  });

  test('health endpoint is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unknown API route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist-route');
    expect(res.status).toBe(404);
  });

  test('mongo injection in query is sanitized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'x' });
    expect([400, 401]).toContain(res.status);
  });
});

describe('Security — rate limiting headers', () => {
  test('API responses include rate-limit headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit']).toBeDefined();
  });
});
