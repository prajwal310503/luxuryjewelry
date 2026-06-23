const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/response');

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderGroupId, amount } = req.body;
    const razorpay = getRazorpayInstance();
    if (!razorpay) return sendError(res, 503, 'Razorpay is not configured');

    const orders = await Order.find({ orderGroupId, customer: req.user.id });
    if (!orders.length) return sendError(res, 404, 'Orders not found');

    const totalAmount = amount || orders.reduce((s, o) => s + o.total, 0);
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: orderGroupId.slice(0, 40),
      notes: { orderGroupId, customerId: String(req.user.id) },
    });

    await Order.updateMany(
      { orderGroupId },
      { $set: { 'payment.gatewayOrderId': rzpOrder.id, 'payment.amount': totalAmount } }
    );

    sendSuccess(res, 200, 'Payment order created', {
      orderId: rzpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderGroupId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return sendError(res, 503, 'Razorpay is not configured');

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    if (expected !== razorpay_signature) return sendError(res, 400, 'Invalid payment signature');

    await Order.updateMany(
      { orderGroupId, customer: req.user.id },
      {
        $set: {
          'payment.status': 'paid',
          'payment.method': 'razorpay',
          'payment.gatewayPaymentId': razorpay_payment_id,
          'payment.gatewaySignature': razorpay_signature,
          'payment.paidAt': new Date(),
          status: 'confirmed',
        },
        $push: {
          statusHistory: {
            status: 'confirmed',
            comment: 'Payment received via Razorpay',
            updatedBy: req.user.id,
            timestamp: new Date(),
          },
        },
      }
    );

    const orders = await Order.find({ orderGroupId });
    sendSuccess(res, 200, 'Payment verified', { orders });
  } catch (error) {
    next(error);
  }
};

exports.getRazorpayKey = async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId || keyId === 'your_razorpay_key_id') {
    return sendSuccess(res, 200, 'Razorpay not configured', { configured: false });
  }
  sendSuccess(res, 200, 'Razorpay key', { configured: true, keyId });
};
