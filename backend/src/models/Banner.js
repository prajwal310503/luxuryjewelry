const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    description: String,
    mediaType: { type: String, enum: ['image', 'gif', 'video'], default: 'image' },
    image: String,                  // Image or GIF URL (Cloudinary)
    imagePublicId: String,
    videoUrl: String,               // MP4 URL or YouTube embed URL (for video type)
    mobileImage: String,
    mobileImagePublicId: String,
    mediaWidth: Number,             // In px (for admin reference)
    mediaHeight: Number,            // In px (for admin reference)
    ctaText: String,
    ctaLink: String,
    ctaStyle: { type: String, enum: ['primary', 'secondary', 'outline', 'ghost'], default: 'primary' },
    secondaryCta: {
      text: String,
      link: String,
    },
    position: { type: String, enum: ['hero', 'sidebar', 'popup', 'notification', 'category'], default: 'hero' },
    alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    textColor: { type: String, default: '#ffffff' },
    overlayColor: { type: String, default: 'rgba(0,0,0,0.3)' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    targetCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', BannerSchema);
