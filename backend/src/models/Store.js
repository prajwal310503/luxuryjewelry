const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    tagline:     { type: String, trim: true },
    description: { type: String },
    image:       { type: String },
    address:     { type: String },
    city:        { type: String },
    mapLink:     { type: String },
    phone:       { type: String },
    email:       { type: String },
    hoursDisplay:{ type: String, default: '10:30 am - 9:30 pm' },
    // facilities: array of strings e.g. ['Design Your Ring', 'Parking Available']
    facilities:  [{ type: String }],
    // services: [{icon:'exchange', title:'GOLD EXCHANGE'}]
    services:    [{ icon: String, title: String }],
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    bookingLink: { type: String },
    vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive:    { type: Boolean, default: true },
    isFeatured:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Store', StoreSchema);
