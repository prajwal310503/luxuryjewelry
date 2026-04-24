require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const Product = require('../models/Product');

// 12 sample products — admin can upload real images later via the admin panel
const SAMPLE_PRODUCTS = [
  {
    title: 'Classic Solitaire Diamond Ring',
    shortDescription: '18Kt white gold solitaire ring with a brilliant-cut diamond center stone.',
    description: 'A timeless solitaire ring crafted in 18Kt white gold, featuring a brilliant-cut diamond center stone. Perfect for engagements and anniversaries.',
    price: 45000,
    comparePrice: 52000,
    stock: 15,
    sku: 'RNG-SOL-001',
    categoryName: 'Rings',
    segments: ['Best Seller', 'Trending'],
    occasions: ['Engagement', 'Wedding', 'Anniversary'],
    collectionStyles: ['Luxury', 'Minimal'],
    themes: ['Heart'],
    productPersonas: ['Classic', 'Minimalist'],
    wearingTypes: ['Party', 'Daily'],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.8,
    totalReviews: 124,
  },
  {
    title: 'Kundan Choker Necklace',
    shortDescription: 'Traditional Kundan choker set with meenakari work and pearl drops.',
    description: 'Handcrafted Kundan choker necklace with intricate meenakari work on the reverse, adorned with natural pearl drops. A bridal classic.',
    price: 28000,
    comparePrice: 35000,
    stock: 8,
    sku: 'NCK-KUN-001',
    categoryName: 'Necklaces',
    segments: ['Deal of Week', 'Best Seller'],
    occasions: ['Wedding', 'Festival', 'Party Wear'],
    collectionStyles: ['Cultural', 'Luxury'],
    themes: ['Traditional', 'Floral'],
    productPersonas: ['Classic', 'Designer'],
    wearingTypes: ['Party'],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.7,
    totalReviews: 89,
  },
  {
    title: 'Pearl Drop Earrings',
    shortDescription: 'Elegant South Sea pearl drop earrings set in 22Kt yellow gold.',
    description: 'Lustrous South Sea pearls set in 22Kt yellow gold with a delicate drop design. Suitable for daily wear and special occasions alike.',
    price: 12500,
    comparePrice: 15000,
    stock: 20,
    sku: 'EAR-PRL-001',
    categoryName: 'Earrings',
    segments: ['New Arrival', 'Trending'],
    occasions: ['Daily Wear', 'Office Wear', 'Party Wear'],
    collectionStyles: ['Minimal', 'Luxury'],
    themes: ['Floral'],
    productPersonas: ['Minimalist', 'Classic'],
    wearingTypes: ['Daily', 'Office'],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.6,
    totalReviews: 67,
  },
  {
    title: 'Rose Gold Diamond Tennis Bracelet',
    shortDescription: 'Stunning rose gold tennis bracelet with VS diamond line.',
    description: 'A row of VS-clarity round diamonds set in 18Kt rose gold, forming a brilliant tennis bracelet. Elegant for any occasion.',
    price: 62000,
    comparePrice: 75000,
    stock: 6,
    sku: 'BRC-TEN-001',
    categoryName: 'Bracelets',
    segments: ['Deal of Week', 'Exclusive'],
    occasions: ['Anniversary', 'Birthday', 'Party Wear'],
    collectionStyles: ['Luxury', 'Geometric'],
    themes: ['Cluster'],
    productPersonas: ['Fashionable', 'Designer'],
    wearingTypes: ['Party'],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    rating: 4.9,
    totalReviews: 43,
  },
  {
    title: 'Diamond Floral Pendant Set',
    shortDescription: '18Kt gold floral pendant with matching earrings and diamond accents.',
    description: 'A breathtaking floral pendant crafted in 18Kt yellow gold with diamond accents, paired with matching drop earrings for a complete set.',
    price: 38000,
    comparePrice: 46000,
    stock: 10,
    sku: 'PND-FLR-001',
    categoryName: 'Pendants',
    segments: ['Best Seller', 'Customer Choice'],
    occasions: ['Wedding', 'Anniversary', 'Birthday'],
    collectionStyles: ['Nature', 'Luxury'],
    themes: ['Floral'],
    productPersonas: ['Classic', 'Fashionable'],
    wearingTypes: ['Party', 'Office'],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.7,
    totalReviews: 95,
  },
  {
    title: 'Temple Gold Bangle Set',
    shortDescription: '22Kt gold temple design bangle set of 4 pieces.',
    description: 'A classic set of four 22Kt gold bangles with temple design motifs, ideal for bridal and festive occasions. Hallmarked and BIS certified.',
    price: 85000,
    comparePrice: 92000,
    stock: 5,
    sku: 'BNG-TMP-001',
    categoryName: 'Bangles',
    segments: ['Trending', 'Limited'],
    occasions: ['Wedding', 'Festival', 'Party Wear'],
    collectionStyles: ['Cultural', 'Luxury'],
    themes: ['Traditional', 'Peacock'],
    productPersonas: ['Classic', 'Designer'],
    wearingTypes: ['Party'],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    rating: 4.8,
    totalReviews: 51,
  },
  {
    title: 'Emerald Gold Ring',
    shortDescription: 'Natural emerald ring in 18Kt gold with diamond border.',
    description: 'A vivid natural emerald center stone set in a 18Kt gold ring, surrounded by a border of accent diamonds. Elegant and bold.',
    price: 32000,
    comparePrice: 40000,
    stock: 12,
    sku: 'RNG-EMR-001',
    categoryName: 'Rings',
    segments: ['Deal of Week', 'New Arrival'],
    occasions: ['Birthday', 'Anniversary', 'Party Wear'],
    collectionStyles: ['Luxury', 'Nature'],
    themes: ['Leaf', 'Floral'],
    productPersonas: ['Fashionable', 'Contemporary'],
    wearingTypes: ['Party', 'Office'],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.5,
    totalReviews: 38,
  },
  {
    title: 'Antique Gold Necklace',
    shortDescription: 'Handcrafted antique finish 22Kt gold necklace with ruby drops.',
    description: 'A masterpiece of traditional craftsmanship — 22Kt gold necklace with antique finish, adorned with natural ruby drops and intricate filigree work.',
    price: 110000,
    comparePrice: 125000,
    stock: 3,
    sku: 'NCK-ANT-001',
    categoryName: 'Necklaces',
    segments: ['Exclusive', 'Limited'],
    occasions: ['Wedding', 'Festival'],
    collectionStyles: ['Cultural', 'Luxury'],
    themes: ['Traditional', 'Peacock'],
    productPersonas: ['Classic', 'Designer'],
    wearingTypes: ['Party'],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.9,
    totalReviews: 17,
  },
  {
    title: 'Diamond Stud Earrings',
    shortDescription: 'Classic round diamond stud earrings in 18Kt white gold, VVS clarity.',
    description: 'A wardrobe essential — VVS-clarity round brilliant diamonds in a simple 18Kt white gold four-prong setting. Timeless and elegant.',
    price: 18500,
    comparePrice: 22000,
    stock: 30,
    sku: 'EAR-STD-001',
    categoryName: 'Earrings',
    segments: ['Best Seller', 'Customer Choice', 'Fast Delivery'],
    occasions: ['Daily Wear', 'Office Wear', 'Party Wear'],
    collectionStyles: ['Minimal', 'Luxury'],
    themes: ['Cluster'],
    productPersonas: ['Minimalist', 'Classic'],
    wearingTypes: ['Daily', 'Office', 'Party'],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.8,
    totalReviews: 210,
  },
  {
    title: 'Silver Floral Anklet',
    shortDescription: 'Delicate silver anklet with floral charms and ghungroo bells.',
    description: 'A beautifully crafted 925 silver anklet featuring floral charm motifs and traditional ghungroo bells. Lightweight and comfortable for daily wear.',
    price: 2800,
    comparePrice: 3500,
    stock: 40,
    sku: 'ANK-FLR-001',
    categoryName: 'Anklets',
    segments: ['New Arrival', 'Trending', 'Fast Delivery'],
    occasions: ['Daily Wear', 'Festival'],
    collectionStyles: ['Nature', 'Playful'],
    themes: ['Floral'],
    productPersonas: ['Minimalist', 'Quirky'],
    wearingTypes: ['Daily'],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.4,
    totalReviews: 56,
  },
  {
    title: 'Rope Chain Necklace 22Kt',
    shortDescription: '22Kt yellow gold rope chain, 18 inch, 5 grams.',
    description: 'A classic 22Kt yellow gold rope chain necklace, hallmarked and certified. Versatile enough to wear alone or with a pendant.',
    price: 22000,
    comparePrice: 25000,
    stock: 18,
    sku: 'CHN-RPE-001',
    categoryName: 'Chains',
    segments: ['Deal of Week', 'Best Seller'],
    occasions: ['Daily Wear', 'Office Wear'],
    collectionStyles: ['Minimal'],
    themes: [],
    productPersonas: ['Minimalist', 'Classic'],
    wearingTypes: ['Daily', 'Office'],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.6,
    totalReviews: 74,
  },
  {
    title: 'Black Beads Gold Mangalsutra',
    shortDescription: 'Traditional 22Kt gold mangalsutra with black beads and diamond pendant.',
    description: 'A modern take on the traditional mangalsutra — 22Kt gold with black beads strand and a diamond-studded pendant. Light and comfortable for daily wear.',
    price: 35000,
    comparePrice: 42000,
    stock: 9,
    sku: 'MNG-DIA-001',
    categoryName: 'Mangalsutra',
    segments: ['Best Seller', 'Trending'],
    occasions: ['Wedding', 'Daily Wear'],
    collectionStyles: ['Minimal', 'Cultural'],
    themes: ['Traditional', 'Heart'],
    productPersonas: ['Classic', 'Contemporary'],
    wearingTypes: ['Daily', 'Office'],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.7,
    totalReviews: 88,
  },
];

// Default image — admin can replace via admin panel
const PLACEHOLDER_IMAGE = {
  url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&h=600&q=80',
  publicId: '',
  alt: 'Product image',
  isPrimary: true,
  sortOrder: 0,
};

async function seedProducts() {
  try {
    await connectDB();
    console.log('🌱 Starting product seed...');

    // Check if products already exist
    const existingCount = await Product.countDocuments({});
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} products already exist. Drop them first? (y/n)`);
      // Auto-proceed — skip duplicates by SKU
      console.log('ℹ️  Skipping existing SKUs...');
    }

    // Find or create vendor user
    let vendorUser = await User.findOne({ role: 'vendor' });
    if (!vendorUser) {
      vendorUser = await User.create({
        name: 'VK Jewellers',
        email: process.env.VENDOR || 'vendor@onsкjewelry.com',
        password: process.env.PASSWORD || 'Vendor@123456',
        role: 'vendor',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('✅ Vendor user created:', vendorUser.email);
    } else {
      console.log('ℹ️  Using existing vendor user:', vendorUser.email);
    }

    // Find or create vendor profile
    let vendor = await Vendor.findOne({ user: vendorUser._id });
    if (!vendor) {
      vendor = await Vendor.create({
        user: vendorUser._id,
        storeName: 'VK Jewellers',
        storeSlug: 'vk-jewellers',
        storeDescription: 'Premium gold and diamond jewelry crafted with love.',
        businessEmail: vendorUser.email,
        status: 'approved',
        isVerified: true,
      });
      console.log('✅ Vendor profile created:', vendor.storeName);
    } else {
      console.log('ℹ️  Using existing vendor profile:', vendor.storeName);
    }

    // Load all categories
    const categories = await Category.find({});
    const catMap = {};
    categories.forEach((c) => { catMap[c.name] = c; });

    let created = 0;
    let skipped = 0;

    for (const p of SAMPLE_PRODUCTS) {
      // Skip if SKU already exists
      const exists = await Product.findOne({ sku: p.sku });
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${p.title}`);
        skipped++;
        continue;
      }

      const category = catMap[p.categoryName];
      if (!category) {
        console.log(`⚠️  Category not found: ${p.categoryName} — skipping ${p.title}`);
        skipped++;
        continue;
      }

      const { categoryName, ...productData } = p;

      const product = new Product({
        ...productData,
        vendor: vendor._id,
        category: category._id,
        images: [PLACEHOLDER_IMAGE],
        status: 'approved',
        isActive: true,
        approvedAt: new Date(),
      });

      await product.save();
      created++;
      console.log(`✅ Created: ${product.title} (${category.name})`);
    }

    console.log(`\n🎉 Done! Created ${created} products, skipped ${skipped}.`);
    console.log('\nNext steps:');
    console.log('  1. Open admin panel → Products to see all products');
    console.log('  2. Click on a product → upload real images via the image uploader');
    console.log('  3. Homepage will show Featured products and Deal of Week items automatically\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedProducts();
