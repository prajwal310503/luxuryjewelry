const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  by:      { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  at:      { type: Date, default: Date.now },
});

const SupportTicketSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    body:    { type: String, required: true, trim: true },
    reason:  {
      type: String,
      enum: ['order-review', 'product-inquiry', 'payment-issue', 'shipping', 'return-exchange', 'general', 'other'],
      default: 'general',
    },
    image:   { type: String },
    status:  { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    replies: [ReplySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
