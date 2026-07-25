/**
 * Sync AttributeValue options for collection-style / theme from product data
 * so storefront filters match real catalog values.
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Attribute = require('../src/models/Attribute');
  const AttributeValue = require('../src/models/AttributeValue');
  const Product = require('../src/models/Product');

  async function sync(attrSlug, productField) {
    const attr = await Attribute.findOne({ slug: attrSlug });
    if (!attr) {
      console.log('skip missing attr', attrSlug);
      return;
    }
    const values = await Product.distinct(productField, { status: 'approved', isActive: true });
    const clean = values.filter((v) => v && String(v).trim());
    let added = 0;
    for (const value of clean) {
      const slug = String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const existing = await AttributeValue.findOne({ attribute: attr._id, value });
      if (existing) continue;
      await AttributeValue.create({ attribute: attr._id, value, slug, isActive: true });
      added++;
    }
    console.log(`${attrSlug}: +${added} values (total distinct products: ${clean.length})`);
  }

  await sync('collection-style', 'collectionStyles');
  await sync('theme', 'themes');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
