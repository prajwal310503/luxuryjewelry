const mongoose = require('mongoose');

const PriceSyncLogSchema = new mongoose.Schema(
  {
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productsUpdated: { type: Number, default: 0 },
    storesAffected:  { type: Number, default: 0 },
    sampleChanges: [{
      productId:   mongoose.Schema.Types.ObjectId,
      productTitle: String,
      oldPrice:    Number,
      newPrice:    Number,
      storeName:   String,
    }],
    status: { type: String, enum: ['success', 'failed', 'partial'], default: 'success' },
    errorMessage: String,
    durationMs: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PriceSyncLog', PriceSyncLogSchema);
