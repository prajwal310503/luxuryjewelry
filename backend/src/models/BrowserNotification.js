const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: String,
      auth: String,
    },
    userAgent: String,
  },
  { timestamps: true }
);

const BrowserNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    audience: {
      type: String,
      enum: ['all', 'customers', 'vendors', 'staff', 'user'],
      default: 'customers',
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentCount: { type: Number, default: 0 },
    emailAlso: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = {
  PushSubscription: mongoose.model('PushSubscription', PushSubscriptionSchema),
  BrowserNotification: mongoose.model('BrowserNotification', BrowserNotificationSchema),
};
