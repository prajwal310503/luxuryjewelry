const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

// Permissions available for child_admin role
const PERMISSIONS = ['orders', 'products', 'blog', 'cms', 'categories'];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: { type: String, match: [/^[0-9]{10}$/, 'Invalid phone number'] },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: ['admin', 'child_admin', 'vendor', 'customer'],
      default: 'customer',
    },
    // Granular access granted by admin to child_admin users
    permissions: {
      type: [{ type: String, enum: PERMISSIONS }],
      default: [],
    },
    // Vendor-specific info (populated when role === 'vendor')
    vendorDetails: {
      shopName:       { type: String },
      businessType:   { type: String },
      gstNumber:      { type: String },
      panNumber:      { type: String },
      businessAddress:{ type: String },
      city:           { type: String },
      state:          { type: String },
      pincode:        { type: String },
      bankName:       { type: String },
      accountNumber:  { type: String },
      ifscCode:       { type: String },
      accountHolder:  { type: String },
      aadhaarNumber:  { type: String },
    },
    // KYC for vendors — completed inside portal after basic registration
    kyc: {
      status: {
        type: String,
        enum: ['incomplete', 'submitted', 'approved', 'rejected'],
        default: 'incomplete',
      },
      documents: [{
        docType: { type: String, enum: ['gst', 'pan', 'aadhaar', 'bank', 'other'] },
        url: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      }],
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
      termsAcceptedAt: Date,
      termsVersion: { type: String, default: '1.0' },
    },
    // Vendor approval status: pending → approved | rejected
    vendorStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    // Store linked to this vendor (populated after approval)
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    addresses: [AddressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getJWTToken = function () {
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn });
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

UserSchema.methods.getEmailVerificationToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', UserSchema);
module.exports.PERMISSIONS = PERMISSIONS;
