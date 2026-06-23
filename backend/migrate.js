/**
 * migrate.js — Copy every collection from OLD Atlas cluster → NEW Atlas cluster
 * Run: node migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');

const OLD_URI = 'mongodb+srv://prajwalmulik31:007007007@cluster0.wii8fis.mongodb.net/luxury_jewelry?retryWrites=true&w=majority&appName=Cluster0';
const NEW_URI = 'mongodb+srv://prajwalmulik3106_db_user:007007007@cluster0.mzddloj.mongodb.net/luxury_jewelry?retryWrites=true&w=majority&appName=Cluster0';

const DB_NAME = 'luxury_jewelry';

// Collections to skip (system collections)
const SKIP = new Set(['system.indexes', 'system.users', 'system.profile']);

async function migrate() {
  console.log('\n🚀 VK Jewellers — Database Migration');
  console.log('   OLD → cluster0.wii8fis  (source)');
  console.log('   NEW → cluster0.mzddloj  (destination)\n');

  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    console.log('⏳ Connecting to both clusters...');
    await Promise.all([oldClient.connect(), newClient.connect()]);
    console.log('✅ Connected to both clusters\n');

    const oldDb = oldClient.db(DB_NAME);
    const newDb = newClient.db(DB_NAME);

    // Get all collections from old DB
    const collections = await oldDb.listCollections().toArray();
    const names = collections
      .map(c => c.name)
      .filter(n => !SKIP.has(n));

    console.log(`📦 Found ${names.length} collections: ${names.join(', ')}\n`);

    let totalDocs = 0;

    for (const collName of names) {
      const oldColl = oldDb.collection(collName);
      const newColl = newDb.collection(collName);

      const count = await oldColl.countDocuments();
      if (count === 0) {
        console.log(`⏭️  ${collName} — empty, skipping`);
        continue;
      }

      process.stdout.write(`📋 ${collName} (${count} docs) → copying...`);

      // Drop existing data in new collection to avoid duplicates
      await newColl.drop().catch(() => {}); // ignore if doesn't exist

      // Fetch all documents and insert in batches of 500
      const BATCH = 500;
      let inserted = 0;

      const cursor = oldColl.find({});
      let batch = [];

      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length >= BATCH) {
          await newColl.insertMany(batch, { ordered: false });
          inserted += batch.length;
          batch = [];
        }
      }
      if (batch.length > 0) {
        await newColl.insertMany(batch, { ordered: false });
        inserted += batch.length;
      }

      totalDocs += inserted;
      console.log(` ✅ ${inserted} docs copied`);
    }

    // Rebuild indexes for critical collections
    console.log('\n⚙️  Rebuilding indexes...');
    try {
      await newDb.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true });
      await newDb.collection('products').createIndex({ category: 1, isActive: 1 });
      await newDb.collection('products').createIndex({ title: 'text' });
      await newDb.collection('categories').createIndex({ slug: 1 }, { unique: true });
      await newDb.collection('users').createIndex({ email: 1 }, { unique: true });
      await newDb.collection('stores').createIndex({ slug: 1 }, { unique: true });
      await newDb.collection('orders').createIndex({ user: 1, createdAt: -1 });
      console.log('✅ Indexes rebuilt');
    } catch (e) {
      console.log('⚠️  Some indexes already exist (normal):', e.message);
    }

    console.log(`\n🎉 Migration complete! ${totalDocs} total documents copied.\n`);

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await Promise.all([oldClient.close(), newClient.close()]);
    process.exit(0);
  }
}

migrate();
