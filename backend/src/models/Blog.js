const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    category:    { type: String, default: 'EDUCATION', trim: true },
    excerpt:     { type: String, trim: true },
    content:     { type: String },
    image:       { type: String },
    imageTitle:  { type: String }, // text shown overlaid on card image
    isPublished: { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
    author:      { type: String, default: 'Admin' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', BlogSchema);
