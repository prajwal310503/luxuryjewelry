/**
 * Migrate all locally-stored images (localhost:8000/uploads/...) to Cloudinary
 * and update the DB URLs. Run once after configuring Cloudinary credentials.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const BACKEND_BASE = process.env.BACKEND_URL || 'http://localhost:8000';

// Extract local filename from a localhost URL
function localUrlToFilename(url) {
  if (!url || !url.includes(BACKEND_BASE + '/uploads/')) return null;
  return url.replace(BACKEND_BASE + '/uploads/', '');
}

// Upload a local file to Cloudinary and return the secure URL
async function uploadToCloudinary(filename, folder = 'luxury_jewelry/migrated') {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filename}`);
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (err) {
    console.log(`  ✗ Upload failed for ${filename}: ${err.message}`);
    return null;
  }
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  console.log('Cloudinary cloud:', process.env.CLOUDINARY_CLOUD_NAME, '\n');

  let totalMigrated = 0;

  // ── 1. Banners ──────────────────────────────────────────────────────────────
  const Banner = require('../models/Banner');
  const banners = await Banner.find().lean();
  console.log(`=== BANNERS (${banners.length}) ===`);
  for (const banner of banners) {
    const fname = localUrlToFilename(banner.image);
    if (!fname) { console.log(`  skip (already CDN or empty): ${banner.title}`); continue; }
    console.log(`  uploading: ${fname}`);
    const cdnUrl = await uploadToCloudinary(fname, 'luxury_jewelry/banners');
    if (cdnUrl) {
      await Banner.updateOne({ _id: banner._id }, { image: cdnUrl });
      console.log(`  ✓ ${banner.title} → ${cdnUrl.substring(0, 60)}...`);
      totalMigrated++;
    }
  }

  // ── 2. Categories ───────────────────────────────────────────────────────────
  const Category = require('../models/Category');
  const cats = await Category.find().lean();
  console.log(`\n=== CATEGORIES (${cats.length}) ===`);
  for (const cat of cats) {
    const fname = localUrlToFilename(cat.image);
    if (!fname) { console.log(`  skip: ${cat.name}`); continue; }
    console.log(`  uploading: ${fname}`);
    const cdnUrl = await uploadToCloudinary(fname, 'luxury_jewelry/categories');
    if (cdnUrl) {
      await Category.updateOne({ _id: cat._id }, { image: cdnUrl });
      console.log(`  ✓ ${cat.name} → ${cdnUrl.substring(0, 60)}...`);
      totalMigrated++;
    }
  }

  // ── 3. CMS Page Sections (any image fields inside content JSON) ─────────────
  const PageSection = require('../models/PageSection');
  const sections = await PageSection.find().lean();
  console.log(`\n=== CMS SECTIONS (${sections.length}) ===`);
  for (const section of sections) {
    const contentStr = JSON.stringify(section.content);
    if (!contentStr.includes(BACKEND_BASE + '/uploads/')) {
      console.log(`  skip (no local URLs): ${section.sectionType}`);
      continue;
    }
    // Replace all localhost URLs with Cloudinary URLs in the content JSON string
    let updatedStr = contentStr;
    const localUrlRegex = new RegExp(BACKEND_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/uploads/([^"]+)', 'g');
    const matches = [...contentStr.matchAll(localUrlRegex)];
    console.log(`  ${section.sectionType}: ${matches.length} local image(s)`);
    for (const match of matches) {
      const fname = match[1];
      const cdnUrl = await uploadToCloudinary(fname, 'luxury_jewelry/cms');
      if (cdnUrl) {
        updatedStr = updatedStr.replace(match[0], cdnUrl);
        console.log(`    ✓ ${fname} → Cloudinary`);
        totalMigrated++;
      }
    }
    if (updatedStr !== contentStr) {
      await PageSection.updateOne({ _id: section._id }, { content: JSON.parse(updatedStr) });
    }
  }

  // ── 4. Products ─────────────────────────────────────────────────────────────
  const Product = require('../models/Product');
  const products = await Product.find().lean();
  console.log(`\n=== PRODUCTS (${products.length}) ===`);
  let prodMigrated = 0;
  for (const product of products) {
    let changed = false;
    const newImages = [];
    for (const img of (product.images || [])) {
      const fname = localUrlToFilename(img.url);
      if (!fname) { newImages.push(img); continue; }
      const cdnUrl = await uploadToCloudinary(fname, 'luxury_jewelry/products');
      if (cdnUrl) {
        newImages.push({ ...img, url: cdnUrl });
        changed = true;
        totalMigrated++;
      } else {
        newImages.push(img);
      }
    }
    if (changed) {
      await Product.updateOne({ _id: product._id }, { images: newImages });
      prodMigrated++;
    }
  }
  console.log(`  ${prodMigrated} products updated`);

  console.log(`\n✅ Migration complete — ${totalMigrated} images moved to Cloudinary`);
  mongoose.disconnect();
}

migrate().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
