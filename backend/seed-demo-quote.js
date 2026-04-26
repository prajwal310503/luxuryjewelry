/**
 * Creates one confirmed demo quote for the first customer user found.
 * Run: node seed-demo-quote.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Quote = require('./src/models/Quote');
const User  = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jwellery';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // Find a customer user to attach the quote to
  const customer = await User.findOne({ role: 'customer' }).lean();
  if (!customer) {
    console.error('No customer user found. Register a customer account first.');
    process.exit(1);
  }
  console.log('Using customer:', customer.name, '|', customer.email);

  const quote = await Quote.create({
    customer: customer._id,
    status:   'confirmed',
    quotedTotal: 24999,
    adminResponse: 'Your jewellery is ready. Please proceed with the payment.',
    respondedAt: new Date(),
    items: [
      {
        productName:   'Diamond Solitaire Ring',
        sku:           'DSR-001',
        image:         'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&q=80',
        quantity:      1,
        originalPrice: 28000,
        unitPrice:     24999,
      },
      {
        productName:   'Gold Bangle Set (2 pcs)',
        sku:           'GBS-202',
        image:         'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80',
        quantity:      1,
        originalPrice: 5500,
        unitPrice:     null,
      },
    ],
    shippingAddress: {
      fullName:     customer.name || 'Demo Customer',
      phone:        '9876543210',
      addressLine1: '12 Jewellers Lane',
      addressLine2: 'Near City Mall',
      city:         'Mumbai',
      state:        'Maharashtra',
      pincode:      '400001',
      country:      'India',
    },
  });

  console.log('\nDemo quote created successfully!');
  console.log('  Quote ID :', quote._id.toString());
  console.log('  Status   : confirmed');
  console.log('  Total    : ₹24,999');
  console.log('\nOpen My Quotes as that customer to see the "Order Now" button.');
  mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
