require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const Attribute = require('../models/Attribute');
const AttributeValue = require('../models/AttributeValue');
const Menu = require('../models/Menu');

const MASTER_CATEGORIES = [
  { name: 'Rings', icon: 'ring' },
  { name: 'Earrings', icon: 'earring' },
  { name: 'Pendants', icon: 'pendant' },
  { name: 'Necklaces', icon: 'necklace' },
  { name: 'Bangles', icon: 'bangle' },
  { name: 'Bracelets', icon: 'bracelet' },
  { name: 'Chains', icon: 'chain' },
  { name: 'Nosepins', icon: 'nosepin' },
  { name: 'Mangalsutra', icon: 'mangalsutra' },
  { name: 'Anklets', icon: 'anklet' },
  { name: 'Kada', icon: 'kada' },
  { name: 'Charms', icon: 'charm' },
];

const ATTRIBUTES_MASTER = [
  {
    name: 'Metal Color',
    slug: 'metal-color',
    type: 'multiselect',
    displayType: 'swatch',
    isFilterable: true,
    isVariant: true,
    group: 'material',
    values: [
      { value: 'Yellow Gold', colorCode: '#FFD700' },
      { value: 'Rose Gold', colorCode: '#B76E79' },
      { value: 'White Gold', colorCode: '#E8E8E8' },
      { value: 'Two Tone', colorCode: '#C0A060' },
    ],
  },
  {
    name: 'Metal Purity',
    slug: 'metal-purity',
    type: 'select',
    displayType: 'button',
    isFilterable: true,
    group: 'material',
    values: [
      { value: '22Kt' }, { value: '18Kt' }, { value: '14Kt' }, { value: '9Kt' },
      { value: '950 Platinum' }, { value: 'Silver 925' },
    ],
  },
  {
    name: 'Other Metal',
    slug: 'other-metal',
    type: 'select',
    displayType: 'dropdown',
    isFilterable: false,
    group: 'material',
    values: [
      { value: 'Titanium' }, { value: 'Steel' }, { value: 'Copper' },
      { value: 'Leather' }, { value: 'Thread' },
    ],
  },
  {
    name: 'Diamond Clarity',
    slug: 'diamond-clarity',
    type: 'select',
    displayType: 'dropdown',
    isFilterable: true,
    group: 'diamond',
    values: [{ value: 'VVS EF' }, { value: 'VS EF' }],
  },
  {
    name: 'Diamond Type',
    slug: 'diamond-type',
    type: 'select',
    displayType: 'dropdown',
    isFilterable: true,
    group: 'diamond',
    values: [{ value: 'Round Diamond' }, { value: 'Solitaire' }, { value: 'Fancy Stone' }],
  },
  {
    name: 'Gemstone',
    slug: 'gemstone',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'gemstone',
    values: [
      { value: 'Amethyst' }, { value: 'Aquamarine' }, { value: 'Blue Sapphire' },
      { value: 'Citrine' }, { value: 'Emerald' }, { value: 'Garnet' },
      { value: 'Peridot' }, { value: 'Pink Sapphire' }, { value: 'Ruby' },
      { value: 'Tanzanite' }, { value: 'Yellow Sapphire' }, { value: 'Black Onyx' },
      { value: 'Blue Topaz' }, { value: 'Fire Opal' }, { value: 'Green Amethyst' },
      { value: 'Iolite' }, { value: 'Quartz' }, { value: 'White Sapphire' },
      { value: 'Tourmaline' }, { value: 'CZ' }, { value: 'Pearl' },
      { value: 'Alexandrite' }, { value: 'Multi Stone' }, { value: 'Red Spinel' },
      { value: 'Green Onyx' }, { value: 'Pink Spinel' }, { value: 'Hessonite' },
      { value: 'Coral' }, { value: 'Cat Eye' }, { value: 'Kyanite' },
      { value: 'Cubic Zirconia' }, { value: 'Polki' }, { value: 'Kundan' },
      { value: 'Kemp' }, { value: 'Rudraksha' }, { value: 'South Sea Pearl' },
      { value: 'Opal' }, { value: 'Jade' }, { value: 'Mother of Pearl' },
    ],
  },
  {
    name: 'Ring Size',
    slug: 'ring-size',
    type: 'size',
    displayType: 'button',
    isFilterable: false,
    isVariant: true,
    group: 'size',
    values: Array.from({ length: 28 }, (_, i) => ({ value: String(i + 5) })),
  },
  {
    name: 'Bracelet Size',
    slug: 'bracelet-size',
    type: 'size',
    displayType: 'button',
    isFilterable: false,
    isVariant: true,
    group: 'size',
    values: [
      { value: '5 inch' }, { value: '5.5 inch' }, { value: '6 inch' },
      { value: '6.5 inch' }, { value: '7 inch' }, { value: '7.5 inch' }, { value: '8 inch' },
    ],
  },
  {
    name: 'Chain Length',
    slug: 'chain-length',
    type: 'size',
    displayType: 'button',
    isFilterable: false,
    isVariant: true,
    group: 'size',
    values: [
      { value: '14 inch' }, { value: '16 inch' }, { value: '18 inch' },
      { value: '20 inch' }, { value: '22 inch' }, { value: '24 inch' },
    ],
  },
  {
    name: 'Segments',
    slug: 'segments',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: 'New Arrival' }, { value: 'Best Seller' }, { value: 'Trending' },
      { value: 'Customer Choice' }, { value: 'Deal of Day' }, { value: 'Deal of Week' },
      { value: 'Exclusive' }, { value: 'Limited' }, { value: 'Fast Delivery' },
    ],
  },
  {
    name: 'Occasion',
    slug: 'occasion',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: "Women's Day" }, { value: "Mother's Day" }, { value: 'Valentine' },
      { value: 'Engagement' }, { value: 'Wedding' }, { value: 'Anniversary' },
      { value: 'Proposal' }, { value: 'Birthday' }, { value: 'Festival' },
      { value: 'Daily Wear' }, { value: 'Office Wear' }, { value: 'Party Wear' },
    ],
  },
  {
    name: 'Collection Style',
    slug: 'collection-style',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: 'Nature' }, { value: 'Geometric' }, { value: 'Cultural' },
      { value: 'Luxury' }, { value: 'Minimal' }, { value: 'Playful' }, { value: 'Seasonal' },
    ],
  },
  {
    name: 'Theme',
    slug: 'theme',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: 'Peacock' }, { value: 'Spiritual' }, { value: 'Traditional' },
      { value: 'Floral' }, { value: 'Cluster' }, { value: 'Heart' },
      { value: 'Leaf' }, { value: 'Butterfly' }, { value: 'Galaxy' }, { value: 'Art' },
    ],
  },
  {
    name: 'Product Persona',
    slug: 'product-persona',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: 'Minimalist' }, { value: 'Classic' }, { value: 'Fashionable' },
      { value: 'Quirky' }, { value: 'Contemporary' }, { value: 'Designer' },
    ],
  },
  {
    name: 'Wearing Type',
    slug: 'wearing-type',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [{ value: 'Daily' }, { value: 'Office' }, { value: 'Party' }],
  },
  {
    name: 'Gift Tags',
    slug: 'gift-tags',
    type: 'multiselect',
    displayType: 'checkbox',
    isFilterable: true,
    group: 'merchandising',
    values: [
      { value: 'Birthday' }, { value: 'Wedding' }, { value: 'Mother' },
      { value: 'Husband' }, { value: 'Father' }, { value: 'Friends' }, { value: 'Baby' },
    ],
  },
  {
    name: 'Meena Color',
    slug: 'meena-color',
    type: 'multiselect',
    displayType: 'swatch',
    isFilterable: true,
    group: 'material',
    values: [
      { value: 'Blue', colorCode: '#0000FF' },
      { value: 'Brown', colorCode: '#964B00' },
      { value: 'Gray', colorCode: '#808080' },
      { value: 'Green', colorCode: '#008000' },
      { value: 'Maroon', colorCode: '#800000' },
      { value: 'Orange', colorCode: '#FFA500' },
      { value: 'Pink', colorCode: '#FFC0CB' },
      { value: 'Purple', colorCode: '#800080' },
      { value: 'Red', colorCode: '#FF0000' },
      { value: 'White', colorCode: '#FFFFFF' },
      { value: 'Yellow', colorCode: '#FFFF00' },
    ],
  },
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');

    // Clear existing data (except admin user)
    await Promise.all([
      Category.deleteMany({}),
      Attribute.deleteMany({}),
      AttributeValue.deleteMany({}),
      Menu.deleteMany({}),
    ]);

    // Create admin user
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name: 'Platform Admin',
        email: process.env.ADMIN_EMAIL || 'admin@vkjewellers.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Seed categories (use save() to trigger pre-save slug generation)
    const categories = [];
    for (let idx = 0; idx < MASTER_CATEGORIES.length; idx++) {
      const cat = MASTER_CATEGORIES[idx];
      const doc = new Category({ ...cat, sortOrder: idx });
      await doc.save();
      categories.push(doc);
    }
    console.log(`✅ ${categories.length} categories created`);

    // Seed attributes & values
    let totalValues = 0;
    for (const attrData of ATTRIBUTES_MASTER) {
      const { values, ...attrFields } = attrData;
      const attribute = await Attribute.create(attrFields);

      if (values && values.length > 0) {
        for (let idx = 0; idx < values.length; idx++) {
          const doc = new AttributeValue({ ...values[idx], attribute: attribute._id, sortOrder: idx });
          await doc.save();
        }
        totalValues += values.length;
      }
    }
    console.log(`✅ ${ATTRIBUTES_MASTER.length} attributes + ${totalValues} values created`);

    // Seed primary menu
    const ringCat = categories.find((c) => c.name === 'Rings');
    const earringCat = categories.find((c) => c.name === 'Earrings');

    await Menu.create({
      name: 'Primary Navigation',
      location: 'primary',
      items: [
        { label: 'Engagement & Bridal', type: 'link', url: '/collections/engagement-bridal', sortOrder: 0 },
        { label: 'Rings', type: 'category', category: ringCat?._id, url: '/collections/rings', sortOrder: 1 },
        { label: 'Earrings', type: 'category', category: earringCat?._id, url: '/collections/earrings', sortOrder: 2 },
        { label: 'Necklaces', type: 'link', url: '/collections/necklaces', sortOrder: 3 },
        { label: 'Bangles', type: 'link', url: '/collections/bangles', sortOrder: 4 },
        { label: 'Collections', type: 'link', url: '/collections', sortOrder: 5 },
        { label: 'Gifting', type: 'link', url: '/gifting', sortOrder: 6 },
      ],
    });
    console.log('✅ Primary menu created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log(`Admin Email: ${admin.email}`);
    console.log(`Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
