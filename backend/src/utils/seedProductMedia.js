/**
 * Seed all products with extra Unsplash jewelry images (up to 4 total) and 1 sample video.
 * Run once: node src/utils/seedProductMedia.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');

const JEWELRY_IMAGES = [
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1573408301185-9519f94815b6?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop&q=80&auto=format',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&h=800&fit=crop&q=80&auto=format',
];

const SAMPLE_VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({}).select('_id title images videos');
  console.log(`Found ${products.length} products`);

  let updated = 0;

  for (const product of products) {
    const imgCount = product.images?.length || 0;
    const vidCount = product.videos?.length || 0;

    // Rotate through JEWELRY_IMAGES so products get different images
    const seed = products.indexOf(product);
    const needed = Math.max(0, 4 - imgCount);
    const extraImages = [];

    for (let i = 0; i < needed; i++) {
      const url = JEWELRY_IMAGES[(seed + imgCount + i) % JEWELRY_IMAGES.length];
      extraImages.push({
        url,
        alt: product.title,
        isPrimary: imgCount === 0 && i === 0,
        sortOrder: imgCount + i,
      });
    }

    const extraVideo = vidCount === 0
      ? [{ url: SAMPLE_VIDEO, sortOrder: 0 }]
      : [];

    if (extraImages.length > 0 || extraVideo.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        $push: {
          ...(extraImages.length > 0 ? { images: { $each: extraImages } } : {}),
          ...(extraVideo.length > 0  ? { videos: { $each: extraVideo } }  : {}),
        },
      });
      updated++;
      console.log(`  ✓ ${product.title} — +${extraImages.length} images, +${extraVideo.length} video`);
    }
  }

  console.log(`\nDone — updated ${updated} products`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
