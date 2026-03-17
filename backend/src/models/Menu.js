const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: String,
  type: {
    type: String,
    enum: ['link', 'category', 'page', 'dropdown', 'mega'],
    default: 'link',
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  icon: String,
  badge: String,
  badgeColor: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  children: [
    {
      label: String,
      url: String,
      type: String,
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      icon: String,
      sortOrder: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      columns: [
        {
          heading: String,
          items: [
            {
              label: String,
              url: String,
              icon: String,
              sortOrder: Number,
            },
          ],
        },
      ],
      featuredImage: String,
      featuredLink: String,
      featuredTitle: String,
    },
  ],
});

const MenuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      type: String,
      enum: ['primary', 'footer', 'mobile', 'secondary'],
      unique: true,
    },
    items: [MenuItemSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', MenuSchema);
