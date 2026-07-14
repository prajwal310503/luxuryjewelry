/**
 * Fix existing gift cards that were created with perUserLimit/usageLimit
 * blocking remaining-balance re-use.
 * Run: node scripts/fixGiftCards.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const result = await Coupon.updateMany(
    { couponKind: 'gift_card' },
    { $set: { perUserLimit: null, usageLimit: null } }
  );
  console.log(`Updated ${result.modifiedCount} gift card(s)`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
