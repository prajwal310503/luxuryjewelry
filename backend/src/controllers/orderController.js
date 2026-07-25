const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { sendOrderPlacedNotifications, sendPaymentCompleteNotifications } = require('../services/notificationService');
const { enrichOrderPayment, hideCommissionFromCustomer, assertCanDispatch, getRemainingAmount } = require('../utils/orderPaymentHelpers');
const { validateCouponHelper, redeemCouponHelper } = require('./couponController');
const { generateInvoiceBuffer } = require('../services/invoiceService');

async function buildOrderItems(items) {
  const productIds = [...new Set(items.map((i) => i.product))];
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('store', 'name commissionRate')
    .populate('category', 'name commissionRate ancestors parent');
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const parentIds = [];
  products.forEach((p) => {
    (p.category?.ancestors || []).forEach((a) => {
      if (a._id) parentIds.push(String(a._id));
    });
    if (p.category?.parent) parentIds.push(String(p.category.parent));
  });
  const categoryIds = products.map((p) => p.category?._id).filter(Boolean).map(String);
  const allCatIds = [...new Set([...categoryIds, ...parentIds])];
  const cats = allCatIds.length
    ? await Category.find({ _id: { $in: allCatIds } }).select('commissionRate').lean()
    : [];
  const catMap = new Map(cats.map((c) => [String(c._id), c]));

  function resolveCommissionRate(product) {
    const cat = product.category;
    if (!cat) return Number(product.store?.commissionRate) || 0;
    const direct = catMap.get(String(cat._id));
    if (direct && Number(direct.commissionRate) > 0) return Number(direct.commissionRate);
    const ancestors = [...(cat.ancestors || [])].reverse();
    for (const a of ancestors) {
      const ac = catMap.get(String(a._id));
      if (ac && Number(ac.commissionRate) > 0) return Number(ac.commissionRate);
    }
    if (cat.parent) {
      const pc = catMap.get(String(cat.parent));
      if (pc && Number(pc.commissionRate) > 0) return Number(pc.commissionRate);
    }
    return Number(product.store?.commissionRate) || 0;
  }

  const orderItems = [];
  let subtotal = 0;
  const stockOps = [];

  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product || product.status !== 'approved' || !product.isActive) {
      throw new Error(`Product ${item.product} is not available`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    const price = item.price ?? product.discountedPrice ?? product.price;
    const itemSubtotal = price * item.quantity;
    const store = product.store;
    const commissionRate = resolveCommissionRate(product);

    orderItems.push({
      product: product._id,
      categoryId: product.category?._id || product.category || null,
      store: store?._id || null,
      storeName: store?.name || 'VK Jewellers',
      title: product.title,
      image: product.images[0]?.url || item.image || '',
      sku: product.sku || item.sku || '',
      variantAttributes: item.variantAttributes,
      selections: item.selections || undefined,
      price,
      quantity: item.quantity,
      discount: product.discount || 0,
      subtotal: itemSubtotal,
      commissionRate,
      commissionAmount: 0,
    });

    subtotal += itemSubtotal;
    stockOps.push({
      updateOne: {
        filter: { _id: product._id, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity, totalSold: item.quantity } },
      },
    });
  }

  if (stockOps.length) {
    const stockResult = await Product.bulkWrite(stockOps);
    if (stockResult.modifiedCount !== stockOps.length) {
      throw new Error('Insufficient stock for one or more items');
    }
  }

  return { orderItems, subtotal };
}

function generateOrderNumber() {
  return `VK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

function groupItemsByStore(orderItems) {
  const groups = {};
  for (const item of orderItems) {
    const key = item.store ? String(item.store) : 'platform';
    if (!groups[key]) groups[key] = { storeId: item.store, storeName: item.storeName, items: [] };
    groups[key].items.push(item);
  }
  return Object.values(groups);
}

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, payment, couponCode, notes, isGift, giftMessage } = req.body;
    if (!items?.length) return sendError(res, 400, 'No items in order');

    const { orderItems, subtotal } = await buildOrderItems(items);

    let couponDiscount = 0;
    let usedCoupon = null;
    if (couponCode) {
      const cartItemsForCoupon = orderItems.map((oi) => ({
        productId: oi.product,
        categoryId: oi.categoryId,
        lineTotal: oi.subtotal,
        quantity: oi.quantity,
      }));
      const result = await validateCouponHelper(couponCode, req.user.id, subtotal, null, cartItemsForCoupon);
      if (!result.valid) return sendError(res, 400, result.message);
      couponDiscount = result.discount;
      usedCoupon = result.coupon;
    }

    const shippingCost = 0;
    const orderGroupId = crypto.randomUUID();
    const groups = groupItemsByStore(orderItems);
    const groupSubtotals = groups.map((g) => g.items.reduce((s, i) => s + i.subtotal, 0));
    const totalGroupSub = groupSubtotals.reduce((a, b) => a + b, 0);

    const method = payment?.method || 'full_payment';
    const confirmsImmediately = ['cod', 'full_payment', 'partial_payment'].includes(method);
    const paymentPercent = method === 'partial_payment' ? 50 : method === 'full_payment' ? 100 : null;
    const orderStatus = confirmsImmediately ? 'confirmed' : 'pending';

    const createdOrders = await Promise.all(groups.map(async (group, i) => {
      const groupSubtotal = groupSubtotals[i];
      const proportion = totalGroupSub > 0 ? groupSubtotal / totalGroupSub : 1 / groups.length;
      const groupCouponDiscount = Math.round(couponDiscount * proportion);
      // GST / delivery stay separate later — commission is only on product net (after coupon)
      const shippingCostForOrder = shippingCost;
      const groupTotal = Math.max(0, groupSubtotal - groupCouponDiscount + shippingCostForOrder);

      // Category-wise commission on each line (Amazon-style: cut from vendor, not added to customer)
      let commissionAmount = 0;
      const itemsWithCommission = group.items.map((item) => {
        const itemShare = groupSubtotal > 0 ? item.subtotal / groupSubtotal : 0;
        const itemCoupon = Math.round(groupCouponDiscount * itemShare);
        const itemNet = Math.max(0, item.subtotal - itemCoupon);
        const rate = Number(item.commissionRate) || 0;
        const itemCommission = Math.round((itemNet * rate) / 100);
        commissionAmount += itemCommission;
        return { ...item, commissionRate: rate, commissionAmount: itemCommission };
      });

      const commissionRate = groupTotal > 0
        ? Math.round((commissionAmount / Math.max(1, groupSubtotal - groupCouponDiscount)) * 10000) / 100
        : 0;
      const vendorPayout = Math.max(0, groupTotal - shippingCostForOrder - commissionAmount) + shippingCostForOrder;
      // payout = (product net - commission) + shipping (shipping usually passes through; adjust if needed)
      // Simpler: vendorPayout = groupTotal - commissionAmount (shipping included in total stays with whoever you decide)
      const finalVendorPayout = Math.max(0, groupTotal - commissionAmount);

      // If total is fully covered (gift card etc.), mark paid even for partial_payment selection
      let paymentStatus;
      let payAmount;
      let appliedPercent = paymentPercent;
      if (groupTotal <= 0) {
        paymentStatus = 'paid';
        payAmount = 0;
        appliedPercent = 100;
      } else if (paymentPercent === 100) {
        paymentStatus = 'paid';
        payAmount = groupTotal;
      } else if (paymentPercent === 50) {
        paymentStatus = 'partial';
        payAmount = Math.round(groupTotal * 0.5);
      } else {
        paymentStatus = confirmsImmediately ? 'pending' : 'pending';
        payAmount = groupTotal;
        appliedPercent = undefined;
      }

      return Order.create({
        orderNumber: generateOrderNumber(),
        orderGroupId,
        customer: req.user.id,
        store: group.storeId,
        storeName: group.storeName,
        items: itemsWithCommission,
        shippingAddress,
        payment: {
          method,
          status: paymentStatus,
          amount: payAmount,
          paymentPercent: appliedPercent,
        },
        subtotal: groupSubtotal,
        shippingCost: shippingCostForOrder,
        couponCode: usedCoupon ? couponCode.toUpperCase() : null,
        couponDiscount: groupCouponDiscount,
        total: groupTotal,
        commissionRate,
        commissionAmount,
        vendorPayout: finalVendorPayout,
        notes,
        isGift,
        giftMessage,
        status: orderStatus,
        statusHistory: [{ status: orderStatus, comment: 'Order placed', updatedBy: req.user.id }],
      });
    }));

    const storeUpdates = groups
      .map((group, i) => {
        const groupSubtotal = groupSubtotals[i];
        const proportion = totalGroupSub > 0 ? groupSubtotal / totalGroupSub : 1 / groups.length;
        const groupTotal = Math.max(0, groupSubtotal - Math.round(couponDiscount * proportion) + shippingCost);
        return { storeId: group.storeId, total: groupTotal };
      })
      .filter((g) => g.storeId);

    await Promise.all([
      storeUpdates.length
        ? Store.bulkWrite(storeUpdates.map(({ storeId, total }) => ({
            updateOne: {
              filter: { _id: storeId },
              update: { $inc: { totalOrders: 1, totalRevenue: total } },
            },
          })))
        : Promise.resolve(),
      usedCoupon
        ? redeemCouponHelper(usedCoupon._id, req.user.id, couponDiscount)
        : Promise.resolve(),
    ]);

    sendSuccess(res, 201, 'Order placed successfully', {
      orderGroupId,
      orders: createdOrders.map(hideCommissionFromCustomer),
      primaryOrderId: createdOrders[0]._id,
    });

    for (const order of createdOrders) {
      sendOrderPlacedNotifications(req.user, order).catch(() => {});
    }
  } catch (error) {
    if (error.message?.includes('not available') || error.message?.includes('Insufficient')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

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
      .populate('items.product', 'title images slug')
      .populate('store', 'name slug logo');

    sendPaginated(res, orders.map(hideCommissionFromCustomer), page, limit, total);
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'title images slug')
      .populate('store', 'name slug logo phone');

    if (!order) return sendError(res, 404, 'Order not found');

    const customerId = order.customer?._id?.toString() || order.customer?.toString();
    const isOwner = customerId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isChildOrders = req.user.role === 'child_admin' && (req.user.permissions || []).includes('orders');
    const isVendor = req.user.role === 'vendor';
    const isStaff = isAdmin || isChildOrders || isVendor;
    if (!isOwner && !isStaff) return sendError(res, 403, 'Not authorized');

    const payload = (isAdmin || isChildOrders || isVendor) ? enrichOrderPayment(order) : hideCommissionFromCustomer(order);
    sendSuccess(res, 200, 'Order fetched', payload);
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
    if (!order) return sendError(res, 404, 'Order not found');

    const customerId = order.customer?._id?.toString() || order.customer?.toString();
    let allowed = false;
    if (req.user.role === 'admin') allowed = true;
    else if (customerId === req.user.id) allowed = true;
    else if (req.user.role === 'vendor') {
      const store = await Store.findOne({ vendor: req.user.id }).select('_id');
      allowed = store && order.store?.toString() === store._id.toString();
    }
    if (!allowed) return sendError(res, 403, 'Not authorized');

    const customer = order.customer || { name: 'Customer', email: '', phone: '' };
    const buffer = await generateInvoiceBuffer(order, customer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

exports.requestCancellation = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });
    if (!order) return sendError(res, 404, 'Order not found');
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return sendError(res, 400, 'Cannot cancel this order');
    }
    order.cancellationRequest = { status: 'pending', reason: req.body.reason || '', requestedAt: new Date() };
    await order.save();
    sendSuccess(res, 200, 'Cancellation request submitted', order);
  } catch (error) {
    next(error);
  }
};

exports.requestReturn = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.status !== 'delivered') return sendError(res, 400, 'Returns only for delivered orders');
    order.returnRequest = { status: 'pending', reason: req.body.reason || '', requestedAt: new Date() };
    await order.save();
    sendSuccess(res, 200, 'Return request submitted', order);
  } catch (error) {
    next(error);
  }
};

exports.adminGetOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.orderNumber = new RegExp(req.query.search, 'i');
    if (req.query.store) filter.store = req.query.store;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('store', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    sendPaginated(res, orders.map(enrichOrderPayment), page, limit, total);
  } catch (error) {
    next(error);
  }
};

exports.adminCreateOrder = async (req, res, next) => {
  try {
    const { customerId, items, shippingAddress, paymentMethod = 'full_payment', notes } = req.body;
    if (!customerId || !items?.length) return sendError(res, 400, 'Customer and items required');

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const qty = parseInt(item.quantity) || 1;
      let price = parseFloat(item.price) || 0;
      let title = item.title || '';
      let store = null;
      let storeName = 'Platform';
      if (item.product) {
        const product = await Product.findById(item.product).populate('store', 'name');
        if (product) {
          title = title || product.title;
          price = price || product.price;
          store = product.store?._id;
          storeName = product.store?.name || storeName;
        }
      }
      const itemSubtotal = price * qty;
      orderItems.push({
        product: item.product, store, storeName, title,
        image: item.image || '', sku: item.sku || '', price, quantity: qty, subtotal: itemSubtotal,
      });
      subtotal += itemSubtotal;
    }

    const method = paymentMethod || 'full_payment';
    const paymentPercent = method === 'partial_payment' ? 50 : method === 'full_payment' ? 100 : null;
    const orderTotal = subtotal;
    const payAmount = paymentPercent != null
      ? Math.round((orderTotal * paymentPercent) / 100)
      : orderTotal;
    const paymentStatus = paymentPercent === 100 ? 'paid'
      : paymentPercent === 50 ? 'partial'
      : 'pending';

    const order = await Order.create({
      customer: customerId,
      items: orderItems,
      store: orderItems[0]?.store,
      storeName: orderItems[0]?.storeName,
      shippingAddress: shippingAddress || {},
      payment: {
        method,
        status: paymentStatus,
        amount: payAmount,
        paymentPercent: paymentPercent ?? undefined,
      },
      subtotal,
      total: subtotal,
      notes: notes || '',
      source: 'direct',
      status: 'confirmed',
      statusHistory: [{ status: 'confirmed', comment: 'Order created by admin', updatedBy: req.user.id }],
    });

    const populated = await Order.findById(order._id).populate('customer', 'name email phone');
    sendSuccess(res, 201, 'Order created', populated);
  } catch (error) {
    next(error);
  }
};

exports.payRemainingBalance = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id });
    if (!order) return sendError(res, 404, 'Order not found');
    if (order.payment?.status !== 'partial') {
      return sendError(res, 400, 'No remaining balance on this order');
    }

    const remaining = getRemainingAmount(order);
    if (remaining <= 0) {
      // Heal stuck partial orders with ₹0 remaining (e.g. fully covered by gift card)
      order.payment.status = 'paid';
      order.payment.amount = order.total;
      order.payment.paymentPercent = 100;
      order.payment.paidAt = new Date();
      await order.save();
      return sendSuccess(res, 200, 'Order already fully paid', hideCommissionFromCustomer(order));
    }

    order.payment.status = 'paid';
    order.payment.amount = order.total;
    order.payment.paymentPercent = 100;
    order.payment.paidAt = new Date();
    order.statusHistory.push({
      status: order.status,
      comment: `Remaining 50% payment of ₹${remaining.toLocaleString('en-IN')} received`,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });
    await order.save();

    sendSuccess(res, 200, 'Payment completed. Your order is ready for dispatch.', hideCommissionFromCustomer(order));
    sendPaymentCompleteNotifications(req.user, order).catch(() => {});
  } catch (error) {
    next(error);
  }
};

exports.adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, comment, cancellationAction, returnAction } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');

    if (status && ['processing', 'shipped', 'delivered'].includes(status)) {
      const dispatchCheck = assertCanDispatch(order);
      if (!dispatchCheck.allowed) return sendError(res, 400, dispatchCheck.message);
    }

    const setFields = {};
    const pushFields = {};

    if (status) {
      setFields.status = status;
      if (status === 'delivered') setFields.deliveredAt = new Date();
      if (status === 'cancelled') setFields.cancelledAt = new Date();
      pushFields.statusHistory = { status, comment: comment || '', updatedBy: req.user._id, timestamp: new Date() };
    }

    if (paymentStatus) setFields['payment.status'] = paymentStatus;
    if (paymentStatus === 'paid') setFields['payment.paidAt'] = new Date();

    if (cancellationAction && order.cancellationRequest?.status === 'pending') {
      setFields['cancellationRequest.status'] = cancellationAction;
      setFields['cancellationRequest.resolvedAt'] = new Date();
      setFields['cancellationRequest.resolvedBy'] = req.user._id;
      if (cancellationAction === 'approved') setFields.status = 'cancelled';
    }

    if (returnAction && order.returnRequest?.status === 'pending') {
      setFields['returnRequest.status'] = returnAction;
      setFields['returnRequest.resolvedAt'] = new Date();
      setFields['returnRequest.resolvedBy'] = req.user._id;
      if (returnAction === 'approved') setFields.status = 'returned';
    }

    const mongoUpdate = {};
    if (Object.keys(setFields).length) mongoUpdate.$set = setFields;
    if (pushFields.statusHistory) mongoUpdate.$push = { statusHistory: pushFields.statusHistory };

    const updated = await Order.findByIdAndUpdate(req.params.id, mongoUpdate, { new: true })
      .populate('customer', 'name email');

    // Referral rewards: create on delivered; cancel on returned/cancelled
    try {
      const {
        createReferralRewardForDeliveredOrder,
        cancelReferralRewardForOrder,
      } = require('../utils/referral');
      const finalStatus = updated.status;
      if (finalStatus === 'delivered') {
        await createReferralRewardForDeliveredOrder(updated);
      } else if (finalStatus === 'returned' || finalStatus === 'cancelled' || finalStatus === 'refunded') {
        await cancelReferralRewardForOrder(updated._id, `Order ${finalStatus}`);
      }
    } catch (_) {
      // Non-critical — don't block order update
    }

    if (status && updated.customer?.email) {
      try {
        const { sendOrderStatusEmail } = require('../services/emailService');
        await sendOrderStatusEmail(updated.customer, updated, status, comment || '');
      } catch (_) {
        // Non-critical
      }
    }

    sendSuccess(res, 200, 'Order updated', updated);
  } catch (error) {
    next(error);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return sendSuccess(res, 200, 'Suggestions', []);
    const products = await Product.find({
      status: 'approved',
      isActive: true,
      $or: [
        { title: new RegExp(q, 'i') },
        { sku: new RegExp(q, 'i') },
      ],
    })
      .select('title slug price images discount')
      .limit(8);
    sendSuccess(res, 200, 'Suggestions', products);
  } catch (error) {
    next(error);
  }
};
