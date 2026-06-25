/**
 * Restore realistic prices on all products (especially those set to 0).
 * Run: node scripts/assignPrices.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

const CATEGORY_DEFAULTS = {
  rings:       { min: 9800,  max: 110000 },
  earrings:    { min: 7500,  max: 52000 },
  pendants:    { min: 8500,  max: 65000 },
  necklaces:   { min: 18000, max: 125000 },
  bangles:     { min: 5500,  max: 92000 },
  bracelets:   { min: 12000, max: 95000 },
  chains:      { min: 12000, max: 28000 },
  nosepins:    { min: 3200,  max: 7500 },
  mangalsutra: { min: 22000, max: 72000 },
  anklets:     { min: 2500,  max: 35000 },
  kada:        { min: 8500,  max: 95000 },
  charms:      { min: 5500,  max: 12000 },
  default:     { min: 5000,  max: 50000 },
};

function roundPrice(n) {
  return Math.round(n / 100) * 100;
}

function priceFromSeed(title, price, compare) {
  return {
    price,
    comparePrice: compare,
    discount: compare > price ? Math.round(((compare - price) / compare) * 100) : 0,
  };
}

// Known product prices from seed catalog (title → price, compare)
const KNOWN_PRICES = {
  'Classic Solitaire Diamond Ring': [42500, 52000],
  'Diamond Halo Engagement Ring': [68000, 82000],
  'Gold Band Ring 22KT': [12500, 15000],
  'Rose Gold Oval Solitaire Ring': [35000, 42000],
  'Three Stone Trilogy Ring': [55000, 68000],
  'Emerald Cut Solitaire Ring': [78000, 95000],
  'Floral Diamond Cocktail Ring': [28000, 34000],
  'Gold Couple Band Ring 22KT': [9800, 12000],
  'Oval Diamond Cocktail Ring': [85000, 102000],
  'Eternity Diamond Band Ring': [18500, 22000],
  'Cushion Cut Statement Ring': [52000, 64000],
  'Stackable Princess Band': [32000, 38500],
  'Diamond Stud Earrings 18KT': [18500, 23000],
  'Pearl Drop Earrings Gold': [9800, 12500],
  'Gold Hoop Earrings 22KT': [14500, 17500],
  'Kundan Jhumka Earrings': [22000, 27000],
  'Diamond Hoop Earrings 18KT': [38000, 46000],
  'Chandelier Diamond Drop Earrings': [45000, 55000],
  'Gold Huggie Hoop Earrings': [7500, 9500],
  'Rose Gold Heart Studs': [12500, 15000],
  'Temple Jhumka Gold Earrings': [32000, 38000],
  'Sapphire Statement Earrings': [52000, 63000],
  'Twisted Gold Hoop Earrings': [18000, 22000],
  'Diamond Solitaire Pendant 18KT': [15000, 18500],
  'Diamond Floral Pendant Set': [65000, 80000],
  'Gold Heart Pendant 22KT': [8500, 10500],
  'Evil Eye Diamond Pendant': [12000, 15000],
  'Ganesh Gold Pendant 22KT': [14000, 17000],
  'Ruby Gemstone Pendant 18KT': [28000, 34000],
  'Om Gold Pendant 22KT': [10500, 13000],
  'Princess Cut Diamond Pendant': [22000, 27500],
  'Emerald Teardrop Pendant': [35000, 43000],
  'Infinity Diamond Pendant': [18500, 22000],
  'Kundan Choker Necklace': [85000, 105000],
  'Diamond Tennis Necklace 18KT': [125000, 155000],
  'Rope Chain Necklace 22KT': [22000, 27000],
  'Pearl Strand Necklace Gold': [45000, 55000],
  'Diamond Line Necklace 18KT': [92000, 112000],
  'Layered Gold Chain Set': [38000, 46000],
  'Floral Diamond Necklace': [95000, 118000],
  'Choker Diamond Gold Necklace': [72000, 88000],
  'Gold Pendant Chain Necklace': [28000, 34000],
  'Box Chain Necklace 22KT': [18000, 22000],
  'Temple Gold Bangle Set 22KT': [42000, 52000],
  'Diamond Bangle 18KT': [85000, 105000],
  'Plain Gold Bangle 22KT': [18000, 22000],
  'Meenakari Floral Bangle': [28000, 34000],
  'Antique Gold Bangle': [22000, 27000],
  'Silver Bangle Pair': [5500, 7000],
  'Kundan Bangle Set Bridal': [92000, 115000],
  'Diamond Kada Bangle': [68000, 84000],
  'Ruby Gold Bangle 22KT': [35000, 43000],
  'Twisted Gold Bangle 22KT': [15000, 18500],
  'Diamond Tennis Bracelet 18KT': [85000, 105000],
  'Gold Charm Bracelet 18KT': [22000, 27000],
  'Gold Cuff Bracelet 22KT': [38000, 46000],
  'Diamond Line Bracelet 18KT': [65000, 80000],
  'Sapphire Tennis Bracelet': [95000, 118000],
  'Pearl Chain Bracelet Gold': [18000, 22000],
  'Emerald Gold Bracelet 18KT': [52000, 64000],
  'Layered Chain Bracelet Set': [12000, 15000],
  'Ruby Diamond Bracelet 18KT': [72000, 88000],
  'Plain Gold Bracelet 22KT': [16000, 19500],
  'Rope Chain 22KT Yellow Gold': [18000, 22000],
  'Figaro Chain 22KT Gold': [14000, 17000],
  'Box Chain 22KT Gold': [12000, 15000],
  'Curb Chain 22KT Gold': [16000, 19500],
  'Singapore Twist Chain 22KT': [22000, 27000],
  'Wheat Chain 22KT Gold': [19000, 23000],
  'Snake Chain 18KT White Gold': [24000, 29000],
  'Rolo Chain 22KT Gold': [13000, 16000],
  'Franco Chain 22KT Gold': [28000, 34000],
  'Mariner Chain 22KT Gold': [20000, 24500],
  'Diamond Nosepin 18KT': [4500, 5800],
  'Gold Nose Ring 22KT': [3200, 4000],
  'Small Diamond Stud Nosepin': [6800, 8500],
  'Kundan Nosepin Gold': [5500, 7000],
  'Ruby Nosepin 22KT Gold': [5000, 6200],
  'Screw Back Diamond Nosepin': [7500, 9200],
  'Emerald Nosepin 18KT': [6500, 8000],
  'Hoop Nosepin Gold 22KT': [4200, 5200],
  'Black Beads Gold Mangalsutra': [22000, 27000],
  'Diamond Mangalsutra 18KT': [55000, 68000],
  'Gold Tanmaniya Mangalsutra': [32000, 39000],
  'Traditional Long Mangalsutra': [48000, 58000],
  'Short Diamond Mangalsutra': [38000, 46000],
  'Gold Zig-Zag Mangalsutra': [28000, 34000],
  'Ruby Diamond Mangalsutra': [65000, 80000],
  'Layered Gold Mangalsutra': [42000, 52000],
  'Platinum Diamond Mangalsutra': [72000, 88000],
  'Fancy Designer Mangalsutra': [35000, 43000],
  'Gold Anklet 22KT Pair': [8500, 10500],
  'Silver Anklet with Ghungroo': [2500, 3200],
  'Diamond Gold Anklet 18KT': [35000, 43000],
  'Layered Gold Anklet Set': [15000, 18500],
  'Oxidised Silver Anklet Pair': [3500, 4500],
  'Kundan Gold Anklet 22KT': [22000, 27000],
  'Chain Anklet Gold 22KT': [6500, 8000],
  'Gemstone Bead Anklet Gold': [12000, 15000],
  'Broad Gold Kada 22KT': [48000, 58000],
  'Diamond Kada 18KT': [95000, 118000],
  'Carved Gold Kada 22KT': [38000, 46000],
  'Kundan Kada Bridal': [72000, 88000],
  'Plain Gold Kada 22KT Slim': [22000, 27000],
  'Antique Gold Kada': [42000, 52000],
  "Silver Kada Men's": [8500, 10500],
  'Diamond Bangle Kada 18KT': [82000, 100000],
  "Men's Gold Sikh Kada 22KT": [55000, 68000],
  'Temple Work Gold Kada': [48000, 58000],
  'Evil Eye Diamond Charm': [8500, 10500],
  'Gold Heart Charm 18KT': [5500, 7000],
  'Moon Star Diamond Charm': [7500, 9200],
  'Gold Cross Charm 18KT': [6500, 8000],
  'Floral Diamond Charm': [9500, 11500],
  'Diamond Letter Charm 18KT': [12000, 15000],
  'Infinity Diamond Charm': [8000, 9800],
  'Birthstone Gold Charm': [7000, 8500],
};

function categoryPrice(slug, index) {
  const range = CATEGORY_DEFAULTS[slug] || CATEGORY_DEFAULTS.default;
  const spread = range.max - range.min;
  const price = range.min + (spread * ((index * 17 + 13) % 100)) / 100;
  const compare = price * 1.2;
  return priceFromSeed('', roundPrice(price), roundPrice(compare));
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxury_jewelry');

  const categories = await Category.find({}, 'slug').lean();
  const catSlugById = Object.fromEntries(categories.map((c) => [String(c._id), c.slug]));

  const products = await Product.find({}, 'title price comparePrice discount category').lean();
  let updated = 0;

  const byCategory = {};

  for (const p of products) {
    const needsUpdate = !p.price || p.price <= 0;
    if (!needsUpdate) {
      await Product.updateOne({ _id: p._id }, { $unset: { discountedPrice: '' } });
      continue;
    }

    const catSlug = catSlugById[String(p.category)] || 'default';
    byCategory[catSlug] = (byCategory[catSlug] || 0) + 1;
    const idx = byCategory[catSlug];

    let pricing;
    const known = KNOWN_PRICES[p.title];
    if (known) {
      pricing = priceFromSeed(p.title, known[0], known[1]);
    } else {
      pricing = categoryPrice(catSlug, idx);
    }

    await Product.updateOne(
      { _id: p._id },
      {
        $set: {
          price: pricing.price,
          comparePrice: pricing.comparePrice,
          discount: pricing.discount,
          freeShipping: pricing.price > 25000,
        },
        $unset: { discountedPrice: '' },
      }
    );
    console.log(`  ✓ ${p.title} → ₹${pricing.price.toLocaleString('en-IN')}`);
    updated++;
  }

  console.log(`\nDone — ${updated} product(s) updated with prices.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
