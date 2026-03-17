const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: String,
    image: String,
    imagePublicId: String,
    icon: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    ancestors: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: String,
        slug: String,
      },
    ],
    level: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
    productCount: { type: Number, default: 0 },
    applicableAttributes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

CategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
