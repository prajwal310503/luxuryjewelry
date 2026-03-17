const mongoose = require('mongoose');

const AttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    type: {
      type: String,
      enum: ['select', 'multiselect', 'color', 'size', 'boolean', 'text', 'number'],
      default: 'select',
    },
    displayType: {
      type: String,
      enum: ['dropdown', 'checkbox', 'radio', 'swatch', 'button'],
      default: 'dropdown',
    },
    isFilterable: { type: Boolean, default: true },
    isRequired: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    isVariant: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    group: {
      type: String,
      enum: ['material', 'diamond', 'gemstone', 'size', 'merchandising', 'other'],
      default: 'other',
    },
    description: String,
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true }
);

AttributeSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Attribute', AttributeSchema);
