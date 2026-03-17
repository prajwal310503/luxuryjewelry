const mongoose = require('mongoose');

const AttributeValueSchema = new mongoose.Schema(
  {
    attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true },
    value: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true },
    colorCode: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

AttributeValueSchema.index({ attribute: 1, value: 1 }, { unique: true });

AttributeValueSchema.pre('save', function (next) {
  if (this.isModified('value')) {
    this.slug = this.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('AttributeValue', AttributeValueSchema);
