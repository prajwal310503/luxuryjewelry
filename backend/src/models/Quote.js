const mongoose = require('mongoose');

const QuoteItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  sku:         { type: String, default: '' },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, default: null }, // set by admin when quoting
}, { _id: true });

const QuoteSchema = new mongoose.Schema(
  {
    retailer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:       { type: [QuoteItemSchema], default: [] },
    message:     { type: String, default: '', maxlength: 2000 },
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
