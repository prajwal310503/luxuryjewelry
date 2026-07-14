/**
 * Set all category commission to 5% and backfill commission on existing paid orders.
 * Run: node scripts/setCategoryCommissionAndBackfill.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');

const DEFAULT_RATE = 5;

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const catRes = await Category.updateMany({}, { $set: { commissionRate: DEFAULT_RATE } });
  console.log(`Categories updated to ${DEFAULT_RATE}%:`, catRes.modifiedCount);

  const categories = await Category.find().select('_id commissionRate parent').lean();
  const catRate = new Map(categories.map((c) => [String(c._id), Number(c.commissionRate) || DEFAULT_RATE]));

  const orders = await Order.find({
    status: { $nin: ['cancelled', 'refunded'] },
    'payment.status': { $in: ['paid', 'partial'] },
  });

  let updated = 0;
  for (const order of orders) {
    const needsBackfill = !order.commissionAmount
      || order.commissionAmount === 0
      || order.items?.some((it) => !it.commissionAmount);

    if (!needsBackfill) continue;

    const couponDiscount = Number(order.couponDiscount) || 0;
    const orderSubtotal = Number(order.subtotal) || order.items?.reduce((s, it) => s + (it.subtotal || 0), 0) || 0;

    let commissionAmount = 0;
    const items = order.items || [];

    if (items.length > 0) {
      for (const item of items) {
        let rate = Number(item.commissionRate) || 0;
        if (!rate && item.categoryId) {
          rate = catRate.get(String(item.categoryId)) || DEFAULT_RATE;
        }
        if (!rate && item.product) {
          const prod = await Product.findById(item.product).select('category').lean();
          if (prod?.category) rate = catRate.get(String(prod.category)) || DEFAULT_RATE;
        }
        if (!rate) rate = DEFAULT_RATE;

        const itemSub = Number(item.subtotal) || (Number(item.price) * Number(item.quantity)) || 0;
        const share = orderSubtotal > 0 ? itemSub / orderSubtotal : 1 / items.length;
        const itemCoupon = Math.round(couponDiscount * share);
        const itemNet = Math.max(0, itemSub - itemCoupon);
        const itemCommission = Math.round((itemNet * rate) / 100);

        item.commissionRate = rate;
        item.commissionAmount = itemCommission;
        commissionAmount += itemCommission;
      }
    } else {
      const net = Math.max(0, orderSubtotal - couponDiscount);
      commissionAmount = Math.round((net * DEFAULT_RATE) / 100);
    }

    order.commissionAmount = commissionAmount;
    order.commissionRate = orderSubtotal > 0
      ? Math.round((commissionAmount / Math.max(1, orderSubtotal - couponDiscount)) * 10000) / 100
      : DEFAULT_RATE;
    order.vendorPayout = Math.max(0, Number(order.total) - commissionAmount);

    await order.save();
    updated += 1;
  }

  const sample = await Order.aggregate([
    { $match: { 'payment.status': { $in: ['paid', 'partial'] }, status: { $nin: ['cancelled', 'refunded'] } } },
    { $group: { _id: null, sales: { $sum: '$total' }, commission: { $sum: '$commissionAmount' } } },
  ]);

  console.log(`Orders backfilled: ${updated}`);
  console.log('Totals after backfill:', sample[0] || { sales: 0, commission: 0 });
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
