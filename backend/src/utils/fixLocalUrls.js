/**
 * fixLocalUrls.js
 * Replaces http://localhost:PORT/uploads/... URLs stored in MongoDB
 * with relative /uploads/... paths (served by Express / Vite proxy).
 *
 * Run once:
 *   node src/utils/fixLocalUrls.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set in .env'); process.exit(1); }

const LOCAL_URL_RE = /http:\/\/localhost:\d+(\/uploads\/[^"\\]+)/g;

function fixDoc(doc) {
  let json = JSON.stringify(doc);
  if (!json.includes('localhost') || !json.includes('/uploads/')) return null;

  const next = json.replace(LOCAL_URL_RE, (_, path) => path);
  if (next === json) return null;
  return JSON.parse(next);
}

async function fixCollection(col) {
  const docs = await col.find({}).toArray();
  let fixed = 0;
  for (const doc of docs) {
    const updated = fixDoc(doc);
    if (!updated) continue;
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

  const dbName = MONGO_URI.split('/').pop().split('?')[0] || 'luxuryjewelry';
  const db = client.db(dbName);

  console.log(`\n🔧 Connected to: ${dbName}`);
  console.log('   Rewriting localhost upload URLs → /uploads/...\n');

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
    await fixCollection(db.collection(name));
  }

  await client.close();
  console.log('Done.\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
