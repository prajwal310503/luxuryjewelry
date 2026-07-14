const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  store:             { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  storeName:         String,
  title:             String,
  image:             { type: String, default: '' },
  sku:               { type: String, default: '' },
  variantAttributes: mongoose.Schema.Types.Mixed,
  selections:        mongoose.Schema.Types.Mixed,
  price:             { type: Number, required: true },
  quantity:          { type: Number, required: true, min: 1 },
  discount:          { type: Number, default: 0 },
  subtotal:          { type: Number, required: true },
  categoryId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  commissionRate:    { type: Number, default: 0 },
  commissionAmount:  { type: Number, default: 0 },
  itemStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  trackingNumber: String,
  trackingUrl:    String,
});

const ShippingAddressSchema = new mongoose.Schema({
  fullName:     String,
  phone:        String,
  addressLine1: String,
  addressLine2: String,
  city:         String,
  state:        String,
  pincode:      String,
  country:      { type: String, default: 'India' },
});

const PaymentSchema = new mongoose.Schema({
  method:           { type: String, enum: ['stripe', 'razorpay', 'cod', 'wallet', 'quote', 'bank_transfer', 'full_payment', 'partial_payment'], default: 'full_payment' },
  status:           { type: String, enum: ['pending', 'partial', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentPercent:   { type: Number, min: 0, max: 100 },
  transactionId:    String,
  gatewayOrderId:   String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  amount:           Number,
  currency:         { type: String, default: 'INR' },
  paidAt:           Date,
});

const RequestSchema = new mongoose.Schema({
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason:     String,
  requestedAt:{ type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote:  String,
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    orderNumber:     { type: String, unique: true },
    orderGroupId:    { type: String, index: true }, // links sub-orders from one checkout
    customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store:           { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    storeName:       String,
    items:           [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    payment:         PaymentSchema,
    subtotal:        { type: Number, required: true },
    shippingCost:    { type: Number, default: 0 },
    discount:        { type: Number, default: 0 },
    couponCode:      String,
    couponDiscount:  { type: Number, default: 0 },
    tax:             { type: Number, default: 0 },
    taxRate:         { type: Number, default: 0 },
    total:           { type: Number, required: true },
    commissionRate:  { type: Number, default: 0 },
    commissionAmount:{ type: Number, default: 0 },
    vendorPayout:    { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
      default: 'pending',
    },
    source:  { type: String, enum: ['direct', 'quote'], default: 'direct' },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', default: null },
    notes:   String,
    statusHistory: [
      {
        status:    String,
        comment:   String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isGift:             { type: Boolean, default: false },
    giftMessage:        String,
    estimatedDelivery:  Date,
    deliveredAt:        Date,
    cancelledAt:        Date,
    cancellationReason: String,
    cancellationRequest: RequestSchema,
    returnRequest:       RequestSchema,
    courierName:         String,
    trackingNumber:      String,
    trackingUrl:         String,
  },
  { timestamps: true }
);

OrderSchema.index({ store: 1, status: 1 });
OrderSchema.index({ 'items.store': 1 });

OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `VK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
