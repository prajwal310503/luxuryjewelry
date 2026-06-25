/**
 * Fix gift cards created with percentage type / low default balance.
 * Run: node scripts/fixGiftCards.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const cards = await Coupon.find({ couponKind: 'gift_card' });
  let fixed = 0;
  for (const c of cards) {
    const updates = { type: 'fixed' };
    if (c.balance == null || c.balance === undefined) {
      updates.balance = c.value;
    }
    await Coupon.updateOne({ _id: c._id }, { $set: updates });
    console.log(`  ✓ ${c.code} → balance ₹${updates.balance ?? c.balance ?? c.value}, type: fixed`);
    fixed++;
  }
  console.log(`\nFixed ${fixed} gift card(s).`);
  console.log('Edit balance in Admin → Coupons if amount is still wrong (e.g. was created with ₹10 default).');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
