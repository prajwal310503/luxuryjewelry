const mongoose = require('mongoose');

const ReferralRewardSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    orderNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    // pending = waiting for return window; eligible = can be paid out; credited = added to balance; cancelled = returned/cancelled
    status: {
      type: String,
      enum: ['pending', 'eligible', 'credited', 'cancelled'],
      default: 'pending',
      index: true,
    },
    eligibleAt: Date,
    creditedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    source: {
      type: String,
      enum: ['default', 'category', 'product'],
      default: 'default',
    },
  },
  { timestamps: true }
);

ReferralRewardSchema.index({ referrer: 1, status: 1 });

module.exports = mongoose.model('ReferralReward', ReferralRewardSchema);
