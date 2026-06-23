const mongoose = require('mongoose');

const MakingChargeSchema = new mongoose.Schema({
  category:    { type: String },           // e.g. 'rings', 'earrings', or '*' for all
  type:        { type: String, enum: ['flat', 'percent'], default: 'flat' },
  value:       { type: Number, default: 0 }, // ₹/gram or %
}, { _id: false });

const StoreSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    tagline:     { type: String, trim: true },
    description: { type: String },
    logo:        { type: String },   // shop logo URL
    banner:      { type: String },   // shop banner URL
    image:       { type: String },   // legacy fallback
    address:     { type: String },
    city:        { type: String },
    state:       { type: String },
    pincode:     { type: String },
    mapLink:     { type: String },
    phone:       { type: String },
    email:       { type: String },
    gstNumber:   { type: String },
    hoursDisplay:{ type: String, default: '10:30 am - 9:30 pm' },
    facilities:  [{ type: String }],
    services:    [{ icon: String, title: String }],
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:{ type: Number, default: 0 },
    bookingLink: { type: String },
    vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Marketplace fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // % deducted per sale
    makingCharges:  [MakingChargeSchema],  // per category making charges

    // Metrics
    totalProducts:  { type: Number, default: 0 },
    totalOrders:    { type: Number, default: 0 },
    totalRevenue:   { type: Number, default: 0 },

    isActive:    { type: Boolean, default: true },
    isFeatured:  { type: Boolean, default: false },
    approvedAt:  { type: Date },
    approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

StoreSchema.index({ vendor: 1 });
StoreSchema.index({ status: 1 });

module.exports = mongoose.model('Store', StoreSchema);
