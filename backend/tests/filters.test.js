/**
 * Deep filter / product / search API tests
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const AttributeValue = require('../src/models/AttributeValue');

describe('Filters & product navigation', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('GET /products returns approved products', async () => {
    const res = await request(app).get('/api/products').query({ limit: 5 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].slug).toBeTruthy();
  });

  test('price filter Below 15K uses minPrice=0 and maxPrice=15000', async () => {
    const res = await request(app).get('/api/products').query({
      minPrice: 0,
      maxPrice: 15000,
      limit: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const p of res.body.data) {
      const sale = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
      expect(sale).toBeLessThanOrEqual(15000);
    }
  });

  test('category rings returns only ring-category products', async () => {
    const res = await request(app).get('/api/products').query({ category: 'rings', limit: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const p of res.body.data) {
      expect(p.category?.slug || p.category).toBeTruthy();
      if (p.category?.slug) expect(p.category.slug).toBe('rings');
    }
  });

  test('metal-purity 22Kt filter returns products', async () => {
    const Attribute = require('../src/models/Attribute');
    const attr = await Attribute.findOne({ slug: 'metal-purity' });
    const val = await AttributeValue.findOne({ attribute: attr._id, value: '22Kt' });
    expect(val).toBeTruthy();
    const res = await request(app).get('/api/products').query({
      'attr_metal-purity': String(val._id),
      limit: 20,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('collection-style Solitaire filter works via field fallback', async () => {
    const Attribute = require('../src/models/Attribute');
    const attr = await Attribute.findOne({ slug: 'collection-style' });
    const val = await AttributeValue.findOne({ attribute: attr._id, value: 'Solitaire' });
    expect(val).toBeTruthy();
    const res = await request(app).get('/api/products').query({
      'attr_collection-style': String(val._id),
      limit: 20,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((p) => (p.collectionStyles || []).includes('Solitaire'))).toBe(true);
  });

  test('search returns matching products with valid slugs', async () => {
    const res = await request(app).get('/api/products').query({ search: 'ring', limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const p of res.body.data) {
      expect(p.slug).toBeTruthy();
      const detail = await request(app).get(`/api/products/${p.slug}`);
      expect(detail.status).toBe(200);
      expect(detail.body.data._id).toBe(p._id);
      expect(detail.body.data.title).toBe(p.title);
    }
  });

  test('product by slug matches list item (no default product swap)', async () => {
    const list = await request(app).get('/api/products').query({ maxPrice: 15000, limit: 5 });
    expect(list.body.data.length).toBeGreaterThan(1);
    const first = list.body.data[0];
    const second = list.body.data[1];
    const d1 = await request(app).get(`/api/products/${first.slug}`);
    const d2 = await request(app).get(`/api/products/${second.slug}`);
    expect(d1.body.data._id).toBe(first._id);
    expect(d2.body.data._id).toBe(second._id);
    expect(d1.body.data._id).not.toBe(d2.body.data._id);
  });
});
