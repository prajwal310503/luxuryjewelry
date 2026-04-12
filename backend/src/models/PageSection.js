const mongoose = require('mongoose');

const PageSectionSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, default: 'home' },
    sectionType: {
      type: String,
      required: true,
      enum: [
        // legacy names
        'hero_banner', 'video_section', 'blog_section', 'text_content', 'image_banner', 'newsletter', 'custom_html',
        // current frontend names
        'hero', 'category_grid', 'featured_products', 'collections', 'deals', 'occasion',
        'video', 'blog', 'brands', 'faq', 'testimonials', 'text_banner',
        'trust_bar', 'services', 'diamond_cuts', 'why_choose',
        'announcement_bar', 'gifting', 'newsletter', 'visit_stores', 'blog_section',
        'footer_brand', 'footer_social', 'footer_links', 'footer_payment',
        'lifestyle_lookbook',
      ],
    },
    title: String,
    subtitle: String,
    content: mongoose.Schema.Types.Mixed,
    settings: {
      backgroundColor: String,
      textColor: String,
      padding: String,
      fullWidth: { type: Boolean, default: false },
      showTitle: { type: Boolean, default: true },
      columns: { type: Number, default: 4 },
      autoplay: Boolean,
      autoplaySpeed: Number,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PageSectionSchema.index({ page: 1, sortOrder: 1 });

module.exports = mongoose.model('PageSection', PageSectionSchema);
