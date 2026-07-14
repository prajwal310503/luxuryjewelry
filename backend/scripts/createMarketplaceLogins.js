/**
 * Create / reset marketplace logins — Admin, Vendor, Customer only.
 * Run: node scripts/createMarketplaceLogins.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Store = require('../src/models/Store');

const ACCOUNTS = {
  admin: {
    email: 'admin@test.vkjewellers.com',
    password: 'VkAdmin@2026',
    name: 'VK Admin',
    role: 'admin',
    phone: '9999999999',
    panel: 'http://localhost:5173/admin/dashboard',
  },
  vendor: {
    email: 'vendor@test.vkjewellers.com',
    password: 'VkVendor@2026',
    name: 'Test Vendor',
    role: 'vendor',
    shopName: 'VK Test Jewels',
    phone: '9876543210',
    panel: 'http://localhost:5173/vendor/dashboard',
  },
  customer: {
    email: 'customer@test.vkjewellers.com',
    password: 'VkCustomer@2026',
    name: 'Test Customer',
    role: 'customer',
    phone: '9876543211',
    panel: 'http://localhost:5173/account',
  },
};

async function upsertBasicUser({ email, password, name, role, phone, permissions }) {
  let user = await User.findOne({ email });
  const base = {
    name,
    email,
    password,
    role,
    phone,
    isActive: true,
    isEmailVerified: true,
    permissions: permissions || [],
  };

  if (user) {
    Object.assign(user, base);
    await user.save();
    console.log(`${role} updated:`, email);
  } else {
    user = await User.create(base);
    console.log(`${role} created:`, email);
  }
  return user;
}

async function upsertVendor() {
  const V = ACCOUNTS.vendor;
  let user = await User.findOne({ email: V.email });
  if (!user) {
    user = await User.create({
      name: V.name,
      email: V.email,
      password: V.password,
      phone: V.phone,
      role: 'vendor',
      vendorStatus: 'approved',
      isActive: true,
      isEmailVerified: true,
      vendorDetails: {
        shopName: V.shopName,
        businessType: 'Jewellery Retailer',
        gstNumber: '27AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A',
        businessAddress: '123 Demo Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        bankName: 'HDFC Bank',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountHolder: V.name,
      },
      kyc: {
        status: 'approved',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        documents: [],
      },
    });
    console.log('vendor created:', V.email);
  } else {
    user.password = V.password;
    user.role = 'vendor';
    user.vendorStatus = 'approved';
    user.isActive = true;
    user.isEmailVerified = true;
    user.kyc = {
      ...(user.kyc?.toObject?.() || user.kyc || {}),
      status: 'approved',
      termsAcceptedAt: user.kyc?.termsAcceptedAt || new Date(),
      termsVersion: '1.0',
    };
    user.vendorDetails = {
      ...(user.vendorDetails?.toObject?.() || user.vendorDetails || {}),
      shopName: user.vendorDetails?.shopName || V.shopName,
      city: user.vendorDetails?.city || 'Mumbai',
      gstNumber: user.vendorDetails?.gstNumber || '27AAAAA0000A1Z5',
      panNumber: user.vendorDetails?.panNumber || 'AAAAA0000A',
    };
    await user.save();
    console.log('vendor updated:', V.email);
  }

  let store = await Store.findOne({ vendor: user._id });
  if (!store) {
    const slug = V.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    store = await Store.create({
      name: V.shopName,
      slug: `${slug}-${Date.now().toString(36)}`,
      vendor: user._id,
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: V.phone,
      email: V.email,
      gstNumber: '27AAAAA0000A1Z5',
      status: 'approved',
      approvedAt: new Date(),
      isActive: true,
    });
    user.store = store._id;
    await user.save({ validateBeforeSave: false });
    console.log('Vendor store created:', store.name);
  } else {
    store.status = 'approved';
    store.isActive = true;
    store.approvedAt = store.approvedAt || new Date();
    await store.save();
    if (!user.store) {
      user.store = store._id;
      await user.save({ validateBeforeSave: false });
    }
    console.log('Vendor store ready:', store.name);
  }

  return user;
}

function printCredentials() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        VK JEWELLERS — LOGIN CREDENTIALS (3 ROLES)            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n🌐 Login: http://localhost:5173/login\n');

  console.log('┌──────────┬─────────────────────────────┬─────────────────┐');
  console.log('│ Role     │ Email                       │ Password        │');
  console.log('├──────────┼─────────────────────────────┼─────────────────┤');
  console.log(`│ Admin    │ ${ACCOUNTS.admin.email.padEnd(27)} │ ${ACCOUNTS.admin.password.padEnd(15)} │`);
  console.log(`│ Vendor   │ ${ACCOUNTS.vendor.email.padEnd(27)} │ ${ACCOUNTS.vendor.password.padEnd(15)} │`);
  console.log(`│ Customer │ ${ACCOUNTS.customer.email.padEnd(27)} │ ${ACCOUNTS.customer.password.padEnd(15)} │`);
  console.log('└──────────┴─────────────────────────────┴─────────────────┘\n');

  console.log('Panels:');
  console.log(`  Admin    → ${ACCOUNTS.admin.panel}`);
  console.log(`  Vendor   → ${ACCOUNTS.vendor.panel}`);
  console.log(`  Customer → ${ACCOUNTS.customer.panel}`);
  console.log('');
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  await User.updateMany({ role: 'retailer' }, { $set: { role: 'customer' } });

  await upsertBasicUser(ACCOUNTS.admin);
  await upsertVendor();
  await upsertBasicUser(ACCOUNTS.customer);
  printCredentials();
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
