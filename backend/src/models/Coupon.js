const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: Number,
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', CouponSchema);
