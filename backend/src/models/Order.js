const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  title: String,
  image: String,
  sku: String,
  variantAttributes: mongoose.Schema.Types.Mixed,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  vendorCommission: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  itemStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  trackingNumber: String,
  trackingUrl: String,
});

const ShippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
});

const PaymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['stripe', 'razorpay', 'cod', 'wallet'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  transactionId: String,
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  paidAt: Date,
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    payment: PaymentSchema,
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
      default: 'pending',
    },
    notes: String,
    statusHistory: [
      {
        status: String,
        comment: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isGift: { type: Boolean, default: false },
    giftMessage: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `LJ${Date.now().toString().slice(-8)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
