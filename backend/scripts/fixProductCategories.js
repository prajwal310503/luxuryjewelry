require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Category = require('../src/models/Category');
  const Product = require('../src/models/Product');

  const cats = await Category.find({}).select('_id name slug').lean();
  console.log('Cat IDs:', cats.map((c) => `${c.slug}=${c._id}`));

  const catIds = await Product.distinct('category', { status: 'approved', isActive: true });
  console.log('Product category IDs:', catIds);

  const sample = await Product.findOne({ status: 'approved' }).select('title category').lean();
  console.log('Sample:', sample);

  // Fix plan: reassign by title keyword
  const map = {
    rings: /ring/i,
    earrings: /earring|stud|jhumka/i,
    necklaces: /necklace|chain/i,
    pendants: /pendant/i,
    bracelets: /bracelet/i,
    bangles: /bangle/i,
    mangalsutra: /mangalsutra/i,
    anklets: /anklet/i,
    kada: /kada/i,
    charms: /charm/i,
    nosepins: /nosepin|nose pin/i,
  };

  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  let updated = 0;
  const products = await Product.find({ status: 'approved' }).select('title category');
  for (const p of products) {
    let assigned = null;
    for (const [slug, re] of Object.entries(map)) {
      if (re.test(p.title || '') && bySlug[slug]) {
        assigned = bySlug[slug];
        break;
      }
    }
    if (!assigned && bySlug.rings) assigned = bySlug.rings; // fallback
    if (assigned && String(p.category) !== String(assigned)) {
      p.category = assigned;
      await p.save();
      updated++;
    }
  }
  console.log('Reassigned categories:', updated);

  const check = await Product.aggregate([
    { $match: { status: 'approved', isActive: true } },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$cat.slug', count: { $sum: 1 }, name: { $first: '$cat.name' } } },
    { $sort: { count: -1 } },
  ]);
  console.log('After fix:', check);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
