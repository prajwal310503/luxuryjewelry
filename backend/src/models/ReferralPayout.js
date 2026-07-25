const mongoose = require('mongoose');

const ReferralPayoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      default: 'pending',
      index: true,
    },
    bankDetails: {
      accountHolder: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true },
      ifsc: { type: String, required: true, trim: true, uppercase: true },
      bankName: { type: String, trim: true, default: '' },
      upiId: { type: String, trim: true, default: '' },
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNote: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralPayout', ReferralPayoutSchema);
