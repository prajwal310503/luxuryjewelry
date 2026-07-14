/**
 * One-time script: seed 3–6 sample reviews per product.
 * Creates 10 sample reviewer accounts (role: customer) then attaches reviews.
 * Run from backend folder:
 *   node fill-reviews.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User    = require('./src/models/User');
const Product = require('./src/models/Product');
const Review  = require('./src/models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwellery';

const REVIEWERS = [
  { name: 'Priya Sharma',    email: 'priya.s.review@sample.com' },
  { name: 'Anjali Mehta',    email: 'anjali.m.review@sample.com' },
  { name: 'Sunita Patel',    email: 'sunita.p.review@sample.com' },
  { name: 'Ritu Verma',      email: 'ritu.v.review@sample.com' },
  { name: 'Kavya Nair',      email: 'kavya.n.review@sample.com' },
  { name: 'Deepa Joshi',     email: 'deepa.j.review@sample.com' },
  { name: 'Meena Agarwal',   email: 'meena.a.review@sample.com' },
  { name: 'Pooja Iyer',      email: 'pooja.i.review@sample.com' },
  { name: 'Swati Kulkarni',  email: 'swati.k.review@sample.com' },
  { name: 'Nisha Gupta',     email: 'nisha.g.review@sample.com' },
];

const COMMENTS_BY_RATING = {
  5: [
    'Absolutely stunning piece! The craftsmanship is exceptional — every detail is perfect. Received so many compliments at the wedding.',
    'Bought this for my anniversary and my wife was speechless. The quality is outstanding and delivery was faster than expected.',
    'Pure gold, beautiful design, and the finishing is flawless. VK Jewellers never disappoints. Will definitely order again.',
    'Gorgeous! Exactly as shown in the photos. The packaging was luxurious and made it feel like a premium gift experience.',
    'Exceeded all expectations. The weight feels right, the shine is brilliant, and it looks even better in person.',
    'Perfect for daily wear as well as special occasions. Lightweight yet sturdy. Highly recommend to everyone.',
  ],
  4: [
    'Very nice piece. Quality is good and the gold looks pure. Minor delay in delivery but overall very satisfied.',
    'Beautiful design, matches well with traditional outfits. Slightly different shade than in photos but still lovely.',
    'Good quality for the price. My mother loved it as a gift. The box it came in was also very presentable.',
    'Elegant and well-crafted. Took a few days to arrive but worth the wait. Will shop here again for sure.',
    'Great product overall. The stone setting is secure and the overall design is attractive. Happy with the purchase.',
  ],
  3: [
    'Decent quality but expected the finish to be a bit better. Still a nice piece for the price point.',
    'Average experience. The jewellery looks good but took longer than expected to be delivered.',
    'Good design but the size runs slightly smaller than expected. Check the size chart before ordering.',
  ],
};

const TITLES_BY_RATING = {
  5: ['Absolutely Love It!', 'Perfect Gift!', 'Stunning Quality', 'Exceeded Expectations', 'Beautiful Craftsmanship', 'Worth Every Rupee'],
  4: ['Very Happy with Purchase', 'Great Quality', 'Lovely Piece', 'Good Value', 'Recommended'],
  3: ['Decent Product', 'Average Experience', 'Okay for the Price'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function reviewsForProduct() {
  const count = 3 + Math.floor(Math.random() * 4); // 3–6
  const indices = Array.from({ length: 10 }, (_, i) => i);
  // shuffle and pick `count` unique reviewer indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  // Create (or fetch) sample reviewer accounts
  const hash = await bcrypt.hash('Sample@123', 10);
  const reviewerDocs = [];
  for (const r of REVIEWERS) {
    let user = await User.findOne({ email: r.email });
    if (!user) {
      user = await User.create({ name: r.name, email: r.email, password: hash, role: 'customer' });
      console.log(`  + Created reviewer: ${r.name}`);
    } else {
      console.log(`  ~ Reviewer exists: ${r.name}`);
    }
    reviewerDocs.push(user);
  }

  // Clear existing sample reviews (to avoid dup key on re-run)
  const sampleIds = reviewerDocs.map((u) => u._id);
  await Review.deleteMany({ user: { $in: sampleIds } });
  console.log('\nCleared previous sample reviews.\n');

  const products = await Product.find({}, '_id title').lean();
  console.log(`Seeding reviews for ${products.length} products...\n`);

  let total = 0;
  for (const product of products) {
    const reviewerIndices = reviewsForProduct();
    for (const idx of reviewerIndices) {
      const reviewer = reviewerDocs[idx];
      const ratingPool = Math.random() < 0.65 ? 5 : Math.random() < 0.7 ? 4 : 3;
      const rating  = ratingPool;
      const title   = pick(TITLES_BY_RATING[rating]);
      const comment = pick(COMMENTS_BY_RATING[rating]);

      await Review.create({
        product: product._id,
        user: reviewer._id,
        rating,
        title,
        comment,
        isApproved: true,
        isVerifiedPurchase: Math.random() > 0.4,
      });
      total++;
    }
    console.log(`  ✓ ${product.title} — ${reviewerIndices.length} reviews`);
  }

  console.log(`\nDone — ${total} reviews created across ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
