/**
 * One-time script: add product descriptions to all existing products.
 * Run from backend folder:
 *   node fill-descriptions.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('./src/models/Category'); // register schema for populate

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwellery';

// Returns a rich HTML description based on category name
function buildDescription(title, categoryName) {
  const cat = (categoryName || '').toLowerCase();

  const intros = {
    ring: `<p>Introducing the <strong>${title}</strong> — a masterpiece crafted for those who appreciate the finer things in life. This exquisite ring is a celebration of timeless artistry and contemporary elegance, designed to be worn and treasured for generations.</p>`,
    necklace: `<p>The <strong>${title}</strong> is a breathtaking necklace that draws attention wherever you go. Expertly crafted using age-old goldsmithing techniques, this piece embodies grace, sophistication, and the enduring beauty of fine jewellery.</p>`,
    earring: `<p>Adorn yourself with the <strong>${title}</strong> — a pair of earrings that seamlessly blend classic craftsmanship with modern sensibility. Each piece is individually finished by skilled artisans to ensure a perfect match and lasting shine.</p>`,
    bracelet: `<p>The <strong>${title}</strong> is a stunning bracelet that wraps your wrist in pure luxury. Handcrafted with precision and passion, this piece makes an effortless style statement for every occasion — from intimate gatherings to grand celebrations.</p>`,
    bangle: `<p>Wear the <strong>${title}</strong> and experience the joy of authentic Indian jewellery artistry. These bangles are crafted using traditional methods passed down through generations, combining rich cultural heritage with refined modern aesthetics.</p>`,
    pendant: `<p>The <strong>${title}</strong> pendant is a delicate yet striking piece that rests beautifully at the neckline. Each curve and detail is thoughtfully crafted to reflect the brilliance of fine gold and the sparkle of premium stones.</p>`,
    chain: `<p>The <strong>${title}</strong> is a beautifully crafted chain that stands as a testament to precision workmanship. Each link is carefully formed and polished to deliver a smooth, lustrous finish that catches the light from every angle.</p>`,
    default: `<p>The <strong>${title}</strong> is a stunning jewellery piece that reflects the pinnacle of fine craftsmanship. Designed for those who value authenticity and elegance, this piece is crafted to complement every look and mark every milestone.</p>`,
  };

  const catKey = Object.keys(intros).find((k) => cat.includes(k)) || 'default';
  const intro = intros[catKey];

  const body = `
<p>Crafted from certified 22kt gold, this piece undergoes a rigorous quality check at every stage of production. The intricate detailing — from the smooth setting to the mirror-polished surface — reflects hours of skilled handwork by our master artisans in Surat.</p>

<p>Whether you are gifting a loved one or adding to your own collection, the <strong>${title}</strong> arrives in our signature premium gift box, ready to make a lasting impression. Its versatile design ensures it pairs effortlessly with both traditional Indian ensembles and contemporary Western outfits.</p>

<h3>Key Highlights</h3>
<ul>
  <li>Crafted in certified 22kt hallmarked gold</li>
  <li>Handmade by skilled artisans with attention to detail</li>
  <li>Premium stone setting with secure prong or bezel mount</li>
  <li>Lightweight yet sturdy design for everyday comfort</li>
  <li>BIS hallmarked for guaranteed purity and authenticity</li>
  <li>Comes with a certificate of authenticity and premium gift packaging</li>
</ul>

<h3>Care Instructions</h3>
<p>To maintain the brilliance of your jewellery, store it in the provided box away from direct sunlight and moisture. Clean gently with a soft cloth. Avoid contact with perfumes, lotions, or harsh chemicals. For periodic deep cleaning, visit our store for a complimentary cleaning service.</p>
`;

  return intro + body;
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const all = await Product.find({}, '_id title category').populate('category', 'name').lean();
  console.log(`Found ${all.length} products — adding descriptions...\n`);

  let updated = 0;

  for (const p of all) {
    const categoryName = p.category?.name || '';
    const description = buildDescription(p.title, categoryName);

    await Product.findByIdAndUpdate(p._id, {
      $set: { description },
    });

    console.log(`  ✓ ${p.title}`);
    updated++;
  }

  console.log(`\nDone — ${updated} products updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
