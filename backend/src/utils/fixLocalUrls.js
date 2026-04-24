/**
 * fixLocalUrls.js
 * Replaces ALL http://localhost:8000/uploads/... URLs stored in MongoDB
 * with working Unsplash fallback images.
 *
 * Uses JSON string replacement so it catches URLs in any nested structure.
 *
 * Run once:
 *   node src/utils/fixLocalUrls.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

const LOCAL_PREFIX = 'http://localhost:8000/uploads/';

// Map filename hints → replacement Unsplash URL
const FILENAME_MAP = [
  ['promo-shipping',     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-ring',         'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-consultation', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-bespoke',      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-main',         'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['store-panel2',       'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-panel3',       'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['lifestyle-everyday', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['lifestyle-bridal',   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['lifestyle-occasion', 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['lifestyle-night',    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['banner',             'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&h=800&fit=crop&q=80&auto=format'],
  ['hero',               'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1920&h=1080&fit=crop&q=80&auto=format'],
  ['avatar',             'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&q=80&auto=format'],
];

const GENERIC = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop&q=80&auto=format';

// Replace a single localhost URL → Unsplash
function replaceUrl(url) {
  const filename = url.replace(LOCAL_PREFIX, '').replace(/\.[^.]+$/, '');
  for (const [hint, replacement] of FILENAME_MAP) {
    if (filename.includes(hint)) return replacement;
  }
  return GENERIC;
}

// Serialize doc → string replace → parse back
// This catches localhost URLs at ANY nesting depth.
function fixDoc(doc) {
  let json = JSON.stringify(doc);
  if (!json.includes(LOCAL_PREFIX)) return null; // nothing to fix

  // Replace every localhost URL in the JSON string
  json = json.replace(
    new RegExp(`http://localhost:8000/uploads/[^"\\\\]+`, 'g'),
    (match) => replaceUrl(match)
  );

  return JSON.parse(json);
}

async function fixCollection(col) {
  const docs = await col.find({}).toArray();
  let fixed = 0;
  for (const doc of docs) {
    const updated = fixDoc(doc);
    if (!updated) continue;
    // Remove _id before $set so Mongo doesn't complain
    const { _id, ...fields } = updated;
    await col.updateOne({ _id }, { $set: fields });
    fixed++;
    console.log(`  ↻ [${col.collectionName}] ${_id} fixed`);
  }
  console.log(`  ${col.collectionName}: ${fixed}/${docs.length} updated\n`);
}

async function run() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  // Extract DB name from URI, default to 'vkjewellers'
  const dbName = MONGO_URI.split('/').pop().split('?')[0] || 'vkjewellers';
  const db = client.db(dbName);

  console.log(`\n🔧 Connected to: ${dbName}`);
  console.log('   Replacing all localhost:8000/uploads/ URLs...\n');

  const collections = [
    'pagesections',
    'banners',
    'stores',
    'blogs',
    'categories',
    'products',
    'users',
    'settings',
  ];

  for (const name of collections) {
    const col = db.collection(name);
    await fixCollection(col);
  }

  await client.close();
  console.log('✅  Done! Refresh the live site.\n');
}

run().catch((err) => { console.error('❌', err.message); process.exit(1); });
