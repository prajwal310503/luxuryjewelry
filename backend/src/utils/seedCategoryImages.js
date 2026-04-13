/**
 * seedCategoryImages.js
 * Maps existing product images from /uploads to their matching categories in MongoDB.
 * Usage: node src/utils/seedCategoryImages.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Category  = require('../models/Category');

const BASE = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;

// slug → image file already in /uploads/
const CATEGORY_IMAGE_MAP = {
  'rings':        'rng-sol-001-0.jpg',
  'earrings':     'ear-prl-001-0.jpg',
  'pendants':     'pnd-flr-001-0.jpg',
  'necklaces':    'nck-kun-001-0.jpg',
  'bracelets':    'brc-ten-001-0.jpg',
  'bangles':      'bng-tmp-001-0.jpg',
  'mangalsutra':  'mng-dia-001-0.jpg',
  'chains':       'chn-rpe-001-0.jpg',
  'anklets':      'ank-flr-001-0.jpg',
  'nosepins':     'ear-std-001-0.jpg',   // closest match
  'kada':         'bng-tmp-001-0.jpg',   // bangle/kada
  'charms':       'pnd-flr-001-0.jpg',   // pendant/charm
};

async function run() {
  await connectDB();
  const categories = await Category.find({});
  let updated = 0;

  for (const cat of categories) {
    const file = CATEGORY_IMAGE_MAP[cat.slug];
    if (!file) { console.log(`  ⚠  No mapping for: ${cat.name} (${cat.slug})`); continue; }

    const url = `${BASE}/uploads/${file}`;
    await Category.findByIdAndUpdate(cat._id, { image: url });
    console.log(`  ✓  ${cat.name} → ${url}`);
    updated++;
  }

  console.log(`\nDone — ${updated} categories updated.\n`);
  process.exit(0);
}

run().catch((err) => { console.error('Error:', err.message); process.exit(1); });
