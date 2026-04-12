const mongoose = require('mongoose');

const ProductImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  alt: String,
  isPrimary: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

const ProductVariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  attributes: [
    {
      attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
      attributeValue: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' },
      value: String,
    },
  ],
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  weight: { type: Number, min: 0 },
  images: [ProductImageSchema],
  isActive: { type: Boolean, default: true },
});

const DimensionsSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number,
  unit: { type: String, enum: ['mm', 'cm', 'inch'], default: 'mm' },
});

const ProductSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, unique: true, lowercase: true },
    sku: { type: String, unique: true, sparse: true },
    shortDescription: { type: String, maxlength: 500 },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    images: [ProductImageSchema],
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    weight: { type: Number, min: 0 },
    dimensions: DimensionsSchema,
    variants: [ProductVariantSchema],
    hasVariants: { type: Boolean, default: false },

    // Dynamic attributes
    attributes: [
      {
        attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
        values: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' }],
        customValue: String,
      },
    ],

    // Merchandising tags
    segments: [String],
    occasions: [String],
    collectionStyles: [String],
    themes: [String],
    productPersonas: [String],
    wearingTypes: [String],
    giftTags: [String],

    // Status
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'draft',
    },
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Visibility
    isActive: { type: Boolean, default: true },
    isFeatured:  { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isLifestyle1: { type: Boolean, default: false }, // Bridal & Festive panel (max 4)
    isLifestyle2: { type: Boolean, default: false }, // Everyday Luxury panel (max 4)

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },

    // Analytics
    viewCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },

    // Shipping
    freeShipping: { type: Boolean, default: false },
    shippingDays: { type: Number, default: 7 },

    // Certificate (legacy single cert)
    certificate: {
      type: String,
      certNumber: String,
      certImage: String,
    },

    // Price breakdown for detailed product page
    priceBreakup: {
      metalType:                 String,   // e.g. '14KT Yellow Gold'
      grossWeight:               Number,   // in grams
      netWeight:                 Number,   // in grams
      metalRate:                 Number,   // ₹ per gram
      metalAmount:               Number,
      diamondPieces:             Number,
      diamondCarat:              Number,
      diamondClarity:            String,   // e.g. 'VVS-VS, EF'
      diamondCut:                String,   // e.g. 'Round'
      diamondColor:              String,
      diamondAmount:             Number,
      diamondOriginalAmount:     Number,
      diamondDiscountPct:        Number,
      makingCharges:             Number,
      makingChargesOriginal:     Number,
      makingChargesDiscountPct:  Number,
      gstPct:                    { type: Number, default: 3 },
      totalSavings:              Number,
    },

    // Multiple certifications (IGI, SGL, etc.)
    certifications: [{
      lab:        String,   // 'IGI', 'SGL', 'GIA'
      certNumber: String,
      certImage:  String,
    }],

    // "What's in the Package" images
    packageImages: [String],

    // Optional promo/offer strip image shown on product page
    promoBannerImage: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProductSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });
ProductSchema.index({ category: 1, status: 1, isActive: 1 });
ProductSchema.index({ vendor: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.virtual('discountedPrice').get(function () {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount) / 100;
  }
  return this.price;
});

ProductSchema.pre('save', async function (next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const count = await mongoose.model('Product').countDocuments({ slug: new RegExp(`^${baseSlug}`) });
    this.slug = count > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
