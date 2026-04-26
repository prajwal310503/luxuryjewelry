const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// @desc    Create order
// @route   POST /api/orders
// @access  Customer
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, payment, couponCode, notes, isGift, giftMessage } = req.body;

    if (!items || items.length === 0) return sendError(res, 400, 'No items in order');

    // Validate and calculate order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.status !== 'approved' || !product.isActive) {
        return sendError(res, 400, `Product ${item.product} is not available`);
      }
      if (product.stock < item.quantity) {
        return sendError(res, 400, `Insufficient stock for ${product.title}`);
      }

      const price = product.discountedPrice;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.images[0]?.url || '',
        sku: product.sku,
        variantAttributes: item.variantAttributes,
        price,
        quantity: item.quantity,
        discount: product.discount,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;

      // Decrease stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    let couponDiscount = 0;
    let usedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const now = Date.now();
        if ((!coupon.startDate || coupon.startDate <= now) && (!coupon.endDate || coupon.endDate >= now)) {
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            if (subtotal >= coupon.minOrderAmount) {
              if (coupon.type === 'percentage') {
                couponDiscount = (subtotal * coupon.value) / 100;
                if (coupon.maxDiscountAmount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
              } else if (coupon.type === 'fixed') {
                couponDiscount = coupon.value;
              }
              usedCoupon = coupon;
            }
          }
        }
      }
    }

    const shippingCost = subtotal >= 5000 ? 0 : 199;
    const total = subtotal - couponDiscount + shippingCost;

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      payment: { method: payment.method },
      subtotal,
      shippingCost,
      couponCode: usedCoupon ? couponCode : null,
      couponDiscount,
      total,
      notes,
      isGift,
      giftMessage,
      statusHistory: [{ status: 'pending', comment: 'Order placed', updatedBy: req.user.id }],
    });

    if (usedCoupon) {
      await Coupon.findByIdAndUpdate(usedCoupon._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: req.user.id },
      });
    }

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(req.user, order);
    } catch (_) {}

    sendSuccess(res, 201, 'Order placed successfully', order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/my
// @access  Customer
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { customer: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'title images slug');

    sendPaginated(res, orders, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Customer/Admin
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'title images slug');

    if (!order) return sendError(res, 404, 'Order not found');

    if (req.user.role === 'retailer' && order.customer._id.toString() !== req.user.id) {
      return sendError(res, 403, 'Not authorized');
    }

    sendSuccess(res, 200, 'Order fetched', order);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all orders
// @route   GET /api/admin/orders
// @access  Admin
exports.adminGetOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.orderNumber = new RegExp(req.query.search, 'i');

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select('orderNumber customer total status payment createdAt items source quoteId');

    sendPaginated(res, orders, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create order for any customer
// @route   POST /api/orders/admin/create
// @access  Admin
exports.adminCreateOrder = async (req, res, next) => {
  try {
    const { customerId, items, shippingAddress, paymentMethod = 'cod', notes } = req.body;

    if (!customerId) return sendError(res, 400, 'Customer is required');
    if (!items || items.length === 0) return sendError(res, 400, 'At least one item is required');

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity) || 1;
      let title = item.title || '';
      let image = item.image || '';
      let sku   = item.sku   || '';
      let price = parseFloat(item.price) || 0;

      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          title = title || product.title;
          image = image || product.images?.[0]?.url || '';
          sku   = sku   || product.sku || '';
          price = price || product.discountedPrice || product.price || 0;
        }
      }

      if (!title) return sendError(res, 400, 'Product name is required for each item');

      const itemSubtotal = price * qty;
      orderItems.push({ product: item.product || undefined, title, image, sku, price, quantity: qty, discount: 0, subtotal: itemSubtotal });
      subtotal += itemSubtotal;
    }

    const shipping = subtotal >= 5000 ? 0 : 199;
    const total    = subtotal + shipping;

    const order = await Order.create({
      customer:       customerId,
      items:          orderItems,
      shippingAddress: shippingAddress || {},
      payment:        { method: paymentMethod, status: 'pending' },
      subtotal,
      shippingCost:   shipping,
      total,
      notes:          notes || '',
      source:         'direct',
      status:         'confirmed',
      statusHistory:  [{ status: 'confirmed', comment: 'Order created by admin', updatedBy: req.user.id }],
    });

    const populated = await Order.findById(order._id).populate('customer', 'name email phone');
    sendSuccess(res, 201, 'Order created successfully', populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
exports.adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');

    order.status = status;
    order.statusHistory.push({ status, comment, updatedBy: req.user.id });

    if (status === 'delivered') order.deliveredAt = Date.now();
    if (status === 'cancelled') order.cancelledAt = Date.now();

    await order.save();
    sendSuccess(res, 200, 'Order status updated', order);
  } catch (error) {
    next(error);
  }
};

