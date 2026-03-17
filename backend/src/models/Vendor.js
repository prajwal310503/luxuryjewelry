const mongoose = require('mongoose');

const BankDetailsSchema = new mongoose.Schema({
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  branchName: String,
  upiId: String,
});

const VendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    storeSlug: { type: String, unique: true, lowercase: true },
    storeDescription: String,
    storeLogo: String,
    storeLogoPublicId: String,
    storeBanner: String,
    storeBannerPublicId: String,
    businessEmail: { type: String, lowercase: true },
    businessPhone: String,
    businessAddress: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    gstNumber: String,
    panNumber: String,
    bankDetails: BankDetailsSchema,
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
    },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    socialLinks: {
      instagram: String,
      facebook: String,
      website: String,
    },
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

VendorSchema.pre('save', function (next) {
  if (this.isModified('storeName')) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Vendor', VendorSchema);
