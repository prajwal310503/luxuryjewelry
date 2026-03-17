const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
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
      const product = await Product.findById(item.product).populate('vendor');
      if (!product || product.status !== 'approved' || !product.isActive) {
        return sendError(res, 400, `Product ${item.product} is not available`);
      }
      if (product.stock < item.quantity) {
        return sendError(res, 400, `Insufficient stock for ${product.title}`);
      }

      const price = product.discountedPrice;
      const itemSubtotal = price * item.quantity;
      const commissionRate = product.vendor?.commissionRate || 10;

      orderItems.push({
        product: product._id,
        vendor: product.vendor._id,
        title: product.title,
        image: product.images[0]?.url || '',
        sku: product.sku,
        variantAttributes: item.variantAttributes,
        price,
        quantity: item.quantity,
        discount: product.discount,
        subtotal: itemSubtotal,
        vendorCommission: (itemSubtotal * (100 - commissionRate)) / 100,
        platformFee: (itemSubtotal * commissionRate) / 100,
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

    const total = await Order.countDocuments({ customer: req.user.id });
    const orders = await Order.find({ customer: req.user.id })
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
// @access  Customer/Admin/Vendor
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'title images slug')
      .populate('items.vendor', 'storeName storeSlug');

    if (!order) return sendError(res, 404, 'Order not found');

    // Check authorization
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return sendError(res, 403, 'Not authorized');
    }

    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user.id });
      const hasItem = order.items.some((item) => item.vendor.toString() === vendor?._id.toString());
      if (!hasItem) return sendError(res, 403, 'Not authorized');
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
      .select('orderNumber customer total status payment createdAt items');

    sendPaginated(res, orders, page, limit, total);
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

// @desc    Vendor: Get vendor orders
// @route   GET /api/vendor/orders
// @access  Vendor
exports.vendorGetOrders = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 403, 'Vendor profile not found');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { 'items.vendor': vendor._id };
    if (req.query.status) filter['items.itemStatus'] = req.query.status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    sendPaginated(res, orders, page, limit, total);
  } catch (error) {
    next(error);
  }
};
