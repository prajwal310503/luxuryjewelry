require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxury_jewelry');
  const result = await mongoose.connection.collection('products').updateMany(
    {},
    { $set: { price: 0, discountedPrice: 0, discount: 0 } }
  );
  console.log(`Updated ${result.modifiedCount} products → price: 0, discountedPrice: 0, discount: 0`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
