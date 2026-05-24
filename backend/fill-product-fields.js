/**
 * One-time script: fill jewelry detail fields on all existing products
 * so the product page UI shows all sections for preview.
 *
 * Run from backend folder:
 *   node fill-product-fields.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwellery';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const all = await Product.find({}, '_id title category').lean();
  console.log(`Found ${all.length} products — updating...\n`);

  let updated = 0;

  for (const p of all) {
    await Product.findByIdAndUpdate(p._id, {
      $set: {
        purity:       '22kt',
        metalWeight:  5.2,
        deliveryDays: 7,
        'diamondClarity.natural': 'VVS1',
        'diamondClarity.cz':      'AAA',
        stoneColors: ['White', 'Yellow', 'Pink'],
        sizes: {
          enabled:   true,
          available: [6, 6.5, 7, 7.5, 8, 8.5, 9],
        },
        lengths: {
          enabled:   true,
          available: [16, 18, 20, 22],
        },
      },
    });
    console.log(`  ✓ ${p.title}`);
    updated++;
  }

  console.log(`\nDone — ${updated} products updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
