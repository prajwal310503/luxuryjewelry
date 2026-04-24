require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Blog = require('../models/Blog');
const Store = require('../models/Store');
const Category = require('../models/Category');

// Unsplash — reliable free image CDN, no auth needed
const US = (id, w = 800, h = 534) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
// Backwards compat alias (loremflickr replaced with Unsplash)
const LF = US;

// ─── BLOG POSTS (matches Home.jsx BLOG_FALLBACK so both pages are consistent) ──
const BLOG_POSTS = [
  {
    title:      'How to Choose the Perfect Engagement Ring',
    slug:       'how-to-choose-engagement-ring',
    category:   'ENGAGEMENT RING',
    excerpt:    'Finding the perfect engagement ring is one of the most important decisions. From diamond shape to metal type — here\'s everything you need to know.',
    content:    '<p>Choosing an engagement ring involves understanding four key factors: cut, color, clarity, and carat weight. The cut determines how sparkly the diamond is, making it the most important of the four Cs. Round brilliant cuts maximize light return, while princess and emerald cuts offer distinctive modern looks.</p><p>Metal choice matters too. 18kt gold strikes the perfect balance between purity and durability. Yellow gold is timeless, rose gold is romantic, and white gold complements diamonds beautifully.</p><p>Budget wisely — a good rule is to spend what you\'re comfortable with, not a fixed multiple of your salary. Prioritize cut quality over carat weight for maximum brilliance.</p>',
    image:      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Choosing the Perfect Ring',
    isPublished: true,
    isFeatured:  true,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-01-10'),
  },
  {
    title:      'Understanding Diamond Quality: The 4 Cs Explained',
    slug:       'diamond-4cs-quality-guide',
    category:   'EDUCATION',
    excerpt:    'The 4 Cs of diamond quality — Cut, Color, Clarity, and Carat — determine a diamond\'s value and beauty. Learn how to read a diamond certificate.',
    content:    '<p>Cut is the most important of the 4 Cs — it determines how much the diamond sparkles. An Excellent or Ideal cut grade ensures maximum light performance. Even a large diamond looks dull with a poor cut.</p><p>Color is graded D (colorless) to Z (light yellow). D–F are colorless and most desirable. G–H appear colorless to the untrained eye and offer excellent value.</p><p>Clarity describes inclusions and blemishes. VS1–VS2 diamonds look flawless to the naked eye and are excellent value. SI1 grades can be eye-clean at reasonable prices.</p><p>Carat is the weight of the diamond. One carat = 0.2 grams. Focus on the other Cs first — a smaller, better-cut diamond outsparkles a larger poorly-cut one.</p>',
    image:      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Diamond Quality: The 4 Cs',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-01-18'),
  },
  {
    title:      'Gold Purity Guide: 18KT vs 22KT vs 24KT',
    slug:       'gold-purity-guide-18kt-22kt',
    category:   'EDUCATION',
    excerpt:    'What does 18KT, 22KT, or 24KT actually mean? Understanding gold purity helps you make smarter jewelry purchases.',
    content:    '<p>Gold purity is measured in karats. 24KT gold is 99.9% pure gold — beautiful but too soft for everyday jewelry. 22KT gold (91.7% pure) is ideal for traditional Indian jewelry like bangles and necklaces. 18KT gold (75% pure) is perfect for diamond-set pieces as it\'s durable and holds prongs well.</p><p>BIS Hallmark certification guarantees the gold purity claimed by the jeweler. Always look for the BIS mark, purity grade, jeweler\'s ID, and year of hallmarking on your jewelry.</p><p>14KT gold (58.3% pure) is popular in western jewelry — very durable but less richly colored. Consider your lifestyle when choosing purity.</p>',
    image:      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: '18KT vs 22KT Gold Guide',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-01-25'),
  },
  {
    title:      'Bridal Jewelry Trends to Watch in 2026',
    slug:       'bridal-jewelry-trends-2026',
    category:   'BRIDAL',
    excerpt:    'From uncut diamond chokers to modern mangalsutras — explore the biggest bridal jewelry trends defining weddings in 2026.',
    content:    '<p>2026 brides are embracing a mix of heritage craftsmanship and modern minimalism. Uncut (polki) diamond jewelry is having a major moment — the raw, organic look of polki stones set in gold creates an heirloom quality that photographs beautifully.</p><p>The modern mangalsutra is being reimagined. Brides are choosing delicate diamond-set pendants on gold chains instead of heavy traditional beaded designs, making them wearable every day post-wedding.</p><p>Layered necklace sets replace the heavy one-piece necklace. Three graduated gold chains worn together create the same coverage with less weight. Temple jewelry is seeing a revival for South Indian brides.</p>',
    image:      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Bridal Jewelry Trends 2026',
    isPublished: true,
    isFeatured:  true,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-02-01'),
  },
  {
    title:      'How to Care for Your Diamond Jewelry at Home',
    slug:       'diamond-jewelry-care-guide',
    category:   'CARE GUIDE',
    excerpt:    'Keep your diamonds sparkling with these simple at-home cleaning and storage tips that preserve brilliance and prevent damage.',
    content:    '<p>Diamonds are the hardest natural substance but diamond jewelry still needs care. The most effective at-home cleaning method: warm water, a drop of dish soap, and a soft toothbrush. Scrub gently, rinse thoroughly, and dry with a lint-free cloth.</p><p>Avoid wearing diamond jewelry while swimming — chlorine in pools can damage gold settings over time. Remove rings before applying hand cream, as oils dull the diamond\'s surface.</p><p>Store pieces separately to prevent scratching. A fabric-lined box with individual compartments is ideal. Bring your jewelry to a professional jeweler once a year for ultrasonic cleaning and prong inspection.</p>',
    image:      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Diamond Jewelry Care at Home',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-02-10'),
  },
  {
    title:      'The Art of Layering Gold Necklaces',
    slug:       'art-of-layering-necklaces',
    category:   'STYLE GUIDE',
    excerpt:    'Layering necklaces is the easiest way to elevate any outfit. Learn how to mix chain lengths, textures, and pendants for a curated look.',
    content:    '<p>The golden rule of necklace layering: vary your lengths. Start with a choker at 14–16 inches, add a pendant necklace at 18 inches, and finish with a longer chain at 22–24 inches. Each layer should be visible without tangling.</p><p>Mix chain textures for visual interest — a delicate cable chain pairs beautifully with a herringbone or box chain. Keep metals consistent for a polished look, or intentionally mix yellow gold with rose gold for a modern vibe.</p><p>Your pendant necklace should be the focal point. Choose one meaningful piece — a diamond solitaire, a birthstone drop, or a meaningful charm — and let simpler chains frame it.</p>',
    image:      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Layering Gold Necklaces',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-02-20'),
  },
  {
    title:      'Pearl Jewelry: Complete Buying Guide',
    slug:       'pearl-jewelry-buying-guide',
    category:   'EDUCATION',
    excerpt:    'Natural, cultured, freshwater, Akoya, South Sea — navigating pearl types can be overwhelming. This guide makes it simple.',
    content:    '<p>Pearls are graded on luster, surface quality, shape, size, and color. Luster is the most important factor — it\'s the glow that comes from light reflecting off and through the nacre layers. High-luster pearls appear almost mirror-like.</p><p>Akoya pearls from Japan are the classic white pearl with strong luster, typically 6–9mm. South Sea pearls (12–16mm) are the most luxurious and valuable. Freshwater pearls offer excellent value and come in a wide range of shapes and colors.</p><p>Real vs. fake test: drag a pearl across your teeth — genuine pearls feel slightly gritty (the nacre structure) while imitation pearls feel perfectly smooth.</p>',
    image:      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Pearl Jewelry Buying Guide',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-03-01'),
  },
  {
    title:      'Mangalsutra: Traditional Meets Contemporary',
    slug:       'mangalsutra-modern-designs-2026',
    category:   'BRIDAL',
    excerpt:    'The mangalsutra is evolving. See how modern brides are reinterpreting this sacred symbol into everyday fine jewelry.',
    content:    '<p>The mangalsutra has been worn by married Indian women for centuries as a symbol of marital status and the bond between husband and wife. Today\'s brides are honoring the tradition while adapting it to their modern lifestyle.</p><p>Contemporary mangalsutras feature lightweight gold chains with diamond-studded pendants that double as everyday fine jewelry. The traditional black beads are incorporated subtly — sometimes just a few on the clasp or woven into a delicate chain.</p><p>Popular modern styles include: diamond solitaire pendants on a box chain, geometric gold pendants inspired by sacred geometry, and two-tone pendants combining yellow and white gold for a contemporary look.</p>',
    image:      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=1067&fit=crop&q=80&auto=format',
    imageTitle: 'Modern Mangalsutra Designs',
    isPublished: true,
    isFeatured:  false,
    author:     'VK Jewellers Editorial',
    publishedAt: new Date('2026-03-10'),
  },
];

// ─── STORES ───────────────────────────────────────────────────────────────────
const STORES = [
  {
    name:         'Luminary Jewels — Bandra',
    slug:         'luminary-jewels-bandra',
    tagline:      'Where every jewel tells a story',
    description:  'Our flagship Bandra showroom spans 4,000 sq ft across two floors, showcasing over 5,000 fine jewelry designs from India\'s most celebrated craftsmen. Experience our signature design consultation service.',
    image:        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=534&fit=crop&q=80&auto=format',
    address:      'Linking Road, Bandra West',
    city:         'Mumbai',
    phone:        '+91 98765 43210',
    email:        'bandra@luminaryjewels.com',
    hoursDisplay: '10:30 am – 9:30 pm',
    facilities:   ['Design Your Ring', 'Parking Available', 'Complimentary Tea & Coffee', 'Private Viewing Room'],
    services:     [
      { icon: 'exchange', title: 'GOLD EXCHANGE' },
      { icon: 'repair', title: 'JEWELRY REPAIR' },
      { icon: 'certification', title: 'CERTIFICATION' },
    ],
    rating:      4.8,
    isActive:    true,
    isFeatured:  true,
  },
  {
    name:         'Luminary Jewels — Koregaon Park',
    slug:         'luminary-jewels-koregaon-park',
    tagline:      'Fine jewelry for life\'s finest moments',
    description:  'Our Pune showroom in the heart of Koregaon Park brings the Luminary experience to Maharashtra\'s cultural capital. Featuring a dedicated bridal lounge and custom engraving studio.',
    image:        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=534&fit=crop&q=80&auto=format',
    address:      'North Main Road, Koregaon Park',
    city:         'Pune',
    phone:        '+91 98765 43211',
    email:        'pune@luminaryjewels.com',
    hoursDisplay: '11:00 am – 9:00 pm',
    facilities:   ['Bridal Lounge', 'Custom Engraving', 'Valet Parking'],
    services:     [
      { icon: 'exchange', title: 'GOLD EXCHANGE' },
      { icon: 'repair', title: 'JEWELRY REPAIR' },
    ],
    rating:      4.7,
    isActive:    true,
    isFeatured:  true,
  },
  {
    name:         'Luminary Jewels — Indiranagar',
    slug:         'luminary-jewels-indiranagar',
    tagline:      'Crafted for the modern connoisseur',
    description:  'Our Bangalore showroom on 100 Feet Road brings contemporary luxury to India\'s tech capital. Featuring the most extensive diamond solitaire collection in South India.',
    image:        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=534&fit=crop&q=80&auto=format',
    address:      '100 Feet Road, Indiranagar',
    city:         'Bangalore',
    phone:        '+91 98765 43212',
    email:        'bangalore@luminaryjewels.com',
    hoursDisplay: '10:00 am – 9:30 pm',
    facilities:   ['Diamond Grading Lounge', 'Free Parking', 'Complimentary Beverages'],
    services:     [
      { icon: 'exchange', title: 'GOLD EXCHANGE' },
      { icon: 'certification', title: 'CERTIFICATION' },
      { icon: 'repair', title: 'JEWELRY REPAIR' },
    ],
    rating:      4.9,
    isActive:    true,
    isFeatured:  true,
  },
];

// ─── CATEGORY IMAGES ──────────────────────────────────────────────────────────
const CATEGORY_IMAGES = {
  'rings':       'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=80&auto=format',
  'earrings':    'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&h=600&fit=crop&q=80&auto=format',
  'pendants':    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop&q=80&auto=format',
  'necklaces':   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop&q=80&auto=format',
  'bangles':     'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop&q=80&auto=format',
  'bracelets':   'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=80&auto=format',
  'chains':      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop&q=80&auto=format',
  'mangalsutra': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&q=80&auto=format',
  'anklets':     'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&q=80&auto=format',
  'nosepins':    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop&q=80&auto=format',
  'kada':        'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop&q=80&auto=format',
  'charms':      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&q=80&auto=format',
};

async function seed() {
  try {
    await connectDB();
    console.log('\n🌟 Seeding blog posts, stores & category images...\n');

    // ── Blog Posts ────────────────────────────────────────────────────────────
    let blogsCreated = 0;
    for (const post of BLOG_POSTS) {
      const exists = await Blog.findOne({ slug: post.slug });
      if (exists) {
        await Blog.findByIdAndUpdate(exists._id, post);
        console.log(`↻  Blog updated: ${post.title}`);
      } else {
        await Blog.create(post);
        blogsCreated++;
        console.log(`✅ Blog created: ${post.title}`);
      }
    }

    // ── Stores ────────────────────────────────────────────────────────────────
    let storesCreated = 0;
    for (const store of STORES) {
      const exists = await Store.findOne({ slug: store.slug });
      if (exists) {
        await Store.findByIdAndUpdate(exists._id, store);
        console.log(`↻  Store updated: ${store.name}`);
      } else {
        await Store.create(store);
        storesCreated++;
        console.log(`✅ Store created: ${store.name}`);
      }
    }

    // ── Category Images ───────────────────────────────────────────────────────
    let catsUpdated = 0;
    for (const [slug, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
      const result = await Category.findOneAndUpdate(
        { slug },
        { $set: { image: imageUrl } },
        { new: true }
      );
      if (result) {
        console.log(`🖼️  Category image set: ${result.name}`);
        catsUpdated++;
      }
    }

    console.log(`\n✨ Done!`);
    console.log(`   Blogs:      ${blogsCreated} created (rest updated)`);
    console.log(`   Stores:     ${storesCreated} created (rest updated)`);
    console.log(`   Categories: ${catsUpdated} images updated\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
