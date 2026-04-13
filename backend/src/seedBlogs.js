/**
 * Run: node src/seedBlogs.js
 * Seeds 8 published blog posts with Unsplash jewelry images.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Blog = require('./models/Blog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwellery';

const slugify = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const blogs = [
  {
    title: 'Celebrity Tot Et Moi Rings That Sparked the Trend',
    category: 'CURRENT TRENDS',
    excerpt: 'From Jennifer Lopez to Rihanna — discover which celebrity toi et moi rings sent the internet into a frenzy and how to find yours.',
    imageTitle: 'Celebrity Toi Et Moi\nRings That Sparked',
    // Two-stone engagement ring
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    content: `The toi et moi ring — two stones set side by side on a single band — has captivated jewelry lovers for centuries. But it took a fresh wave of celebrity adoptions to bring this romantic style back to the forefront.\n\nJennifer Lopez's iconic green emerald ring from Ben Affleck sparked a global search for toi et moi designs. Ariana Grande's oval and pear combination showed that mixed shapes create beautiful contrast.\n\nWhat makes this style so enduring? Each stone represents one partner, two souls united on a single band. Shop our curated toi et moi collection to find your perfect pair.`,
    author: 'Priya Sharma',
    isFeatured: true,
  },
  {
    title: 'What Does a Toi Et Moi Ring Symbolise?',
    category: 'EDUCATION',
    excerpt: 'Two stones, one band — the deep romantic history and symbolism behind the toi et moi engagement ring.',
    imageTitle: 'What Does Toi Et Moi\nRing Symbolise?',
    // Close-up of a diamond solitaire ring
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e359d3?w=800&q=80',
    content: `"Toi et moi" translates from French as "you and me" — and few ring styles carry that sentiment as literally as this beloved design.\n\nOriginating in the late 18th century, the toi et moi gained fame when Napoleon Bonaparte presented one to Josephine. The design features two contrasting stones — often different shapes or colours — set facing each other on a single shank.\n\nModern interpretations range from classic diamond pairings to bold colour combinations with sapphires, emeralds, or rubies alongside white diamonds. The symbolism remains constant: two lives, intertwined.`,
    author: 'Anjali Mehta',
    isFeatured: false,
  },
  {
    title: 'Why Are Trilogy Rings Becoming a Mean of Expression?',
    category: 'EDUCATION',
    excerpt: 'Past, present, future — how the three-stone ring became a powerful statement piece for modern couples.',
    imageTitle: 'Why Are Trilogy Rings\nBecoming a Mean...',
    // Three-stone ring / diamond ring
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    content: `The trilogy ring's beauty lies not just in its aesthetics, but in its meaning. Three stones represent the past, present, and future of a relationship — a narrative told in gemstone.\n\nIn recent years, trilogy rings have surged in popularity as couples seek engagement rings that carry personal significance. The outer stones can be coloured gems representing birthstones, while the centre stone remains a white diamond.\n\nFrom Princess Diana's iconic sapphire trilogy to contemporary lab-grown versions, the trilogy ring continues to evolve while its symbolism remains timeless.`,
    author: 'Rahul Kapoor',
    isFeatured: false,
  },
  {
    title: 'The Meaning Behind Three-Stone Rings',
    category: 'EDUCATION',
    excerpt: 'Explore the rich symbolism of three-stone rings and why they have been beloved engagement choices for generations.',
    imageTitle: 'The Meaning Behind\nThree-Stone Rings',
    // Gold ring with gems
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80',
    content: `Three-stone rings hold a special place in fine jewelry tradition. The central stone, typically larger, anchors the design while two flanking stones add brilliance and balance.\n\nThe symbolism runs deep: past (one stone), present (center stone), future (third stone). Others interpret the trio as friendship, love, and fidelity — or representing the couple and their future together.\n\nChoosing gemstones for each position allows for personalisation — perhaps a birthstone for each partner flanking a shared diamond. Our expert gemologists can guide you through the perfect combination.`,
    author: 'Neha Joshi',
    isFeatured: true,
  },
  {
    title: 'How to Choose the Perfect Engagement Ring',
    category: 'ENGAGEMENT RING',
    excerpt: 'From diamond cuts to metal choices — a complete guide to finding an engagement ring she will love forever.',
    imageTitle: 'Choosing the\nPerfect Ring',
    // Ring in jewelry box / proposal ring
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    content: `Choosing an engagement ring is one of the most meaningful purchases you will make. Here is how to get it right.\n\nStart with the 4 Cs — Cut, Colour, Clarity, and Carat. Cut affects sparkle most; an excellent cut grade makes a diamond dance with light.\n\nNext, consider the metal. Yellow gold offers warmth, white gold or platinum provides a contemporary look, and rose gold brings romantic softness.\n\nFinally, think about her lifestyle. An active person may prefer a lower, bezel-set profile, while a style-forward partner might love a dramatic cathedral setting. When in doubt, our virtual consultation service helps you narrow the perfect choice.`,
    author: 'Admin',
    isFeatured: false,
  },
  {
    title: 'Understanding Diamond Quality: The 4 Cs Explained',
    category: 'EDUCATION',
    excerpt: 'Cut, Colour, Clarity, Carat — demystifying the four factors that determine a diamond\'s quality and value.',
    imageTitle: 'Diamond Quality\nThe 4 Cs',
    // Diamond gemstone close-up
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80',
    content: `The 4 Cs were introduced by the Gemological Institute of America (GIA) as a universal language for diamond quality. Understanding them empowers you to make the right purchase.\n\n**Cut** is the most important C — it determines how brilliantly a diamond reflects light. Excellent and Very Good cuts deliver the most sparkle.\n\n**Colour** is graded D (colourless) to Z (light yellow). D–F grades are rare and valuable; G–I offer excellent value with minimal visible colour.\n\n**Clarity** measures inclusions and blemishes. VS1 and VS2 grades are eye-clean, offering good value over FL (flawless).\n\n**Carat** is weight, not size. A well-cut 0.9ct diamond can appear larger than a poorly cut 1ct stone.`,
    author: 'Admin',
    isFeatured: false,
  },
  {
    title: 'Bridal Jewelry Trends to Watch in 2026',
    category: 'BRIDAL',
    excerpt: 'From coloured engagement rings to mixed metal layering — discover the bridal jewelry trends defining 2026.',
    imageTitle: 'Bridal Jewelry\nTrends 2026',
    // Bridal jewelry / wedding rings
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&q=80',
    content: `2026 is a celebration of individuality in bridal jewelry. Gone are the days of one-size-fits-all white diamond solitaires. Today's brides are embracing colour, mixing metals, and wearing jewelry that tells their story.\n\n**Coloured centre stones** are leading the charge. Sapphires, emeralds, and morganites are being chosen for their personality and price advantage over white diamonds.\n\n**Mixed metal stacking** — yellow gold alongside white gold — creates a collected, personalised look. Many brides choose a rose-gold engagement ring with yellow-gold wedding bands for a warm, eclectic stack.\n\n**Lab-grown diamonds** are now the choice of conscious couples. Identical to mined diamonds in every physical and chemical way, they offer remarkable value.`,
    author: 'Priya Sharma',
    isFeatured: true,
  },
  {
    title: 'Gold Purity Guide: 18KT vs 22KT vs 24KT',
    category: 'EDUCATION',
    excerpt: 'Which gold purity is right for your jewelry? A clear breakdown of 18KT, 22KT, and 24KT gold for Indian buyers.',
    imageTitle: '18KT vs 22KT\nGold Guide',
    // Gold necklace / gold jewelry
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
    content: `Gold purity is measured in karats — the higher the karat, the purer the gold. But purer does not always mean better for jewelry.\n\n**24KT Gold** is 99.9% pure gold. It is too soft for most jewelry, bends easily, and is primarily used for coins, bars, and investment.\n\n**22KT Gold** contains 91.6% gold alloyed with silver, copper, or zinc. This is the most common choice for Indian traditional jewelry — it holds intricate designs well and remains hallmarkable.\n\n**18KT Gold** has 75% gold content and 25% other metals. This makes it harder, more durable, and ideal for diamond and gemstone settings. Diamond jewelry is almost always crafted in 18KT for security.\n\nFor everyday wear and diamond jewelry, 18KT is your best choice. For traditional wedding pieces and investment, 22KT holds cultural value and resale strength.`,
    author: 'Rahul Kapoor',
    isFeatured: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    // Remove existing seeded blogs (optional — comment out to keep existing)
    const existingSlugs = blogs.map((b) => slugify(b.title));
    await Blog.deleteMany({ slug: { $in: existingSlugs } });
    console.log('Cleared existing seeded blogs');

    const docs = blogs.map((b) => ({
      ...b,
      slug: slugify(b.title),
      isPublished: true,
      publishedAt: new Date(),
    }));

    const inserted = await Blog.insertMany(docs);
    console.log(`Seeded ${inserted.length} blog posts successfully!`);
    inserted.forEach((b) => console.log(`  ✓ ${b.title}`));
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
