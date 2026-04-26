const mongoose = require('mongoose');

const QuoteItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName:   { type: String, required: true },
  sku:           { type: String, default: '' },
  image:         { type: String, default: '' },
  quantity:      { type: Number, required: true, min: 1 },
  unitPrice:     { type: Number, default: null }, // set by admin when quoting
  originalPrice: { type: Number, default: null }, // price from storefront
}, { _id: true });

const AddressSchema = new mongoose.Schema({
  fullName:     { type: String, default: '' },
  phone:        { type: String, default: '' },
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  city:         { type: String, default: '' },
  state:        { type: String, default: '' },
  pincode:      { type: String, default: '' },
  country:      { type: String, default: 'India' },
}, { _id: false });

const QuoteSchema = new mongoose.Schema(
  {
    customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    retailer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items:           { type: [QuoteItemSchema], default: [] },
    shippingAddress: { type: AddressSchema, default: () => ({}) },
    message:         { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'quoted', 'confirmed', 'rejected'],
      default: 'pending',
    },
    adminResponse: { type: String, default: '' },
    quotedTotal:   { type: Number, default: null },
    orderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    respondedAt:   { type: Date, default: null },
    respondedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', QuoteSchema);
