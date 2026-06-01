const Quote = require('../models/Quote');
const Order = require('../models/Order');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ── Customer / Retailer: submit a quote request ───────────────────────────────
exports.createQuote = async (req, res, next) => {
  try {
    const { items, shippingAddress, message } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'At least one item is required');
    }

    const cleanItems = [];
    for (const item of items) {
      if (!item.productName || !item.productName.trim()) {
        return sendError(res, 400, 'Product name is required for each item');
      }
      const qty = parseInt(item.quantity);
      if (!qty || qty < 1) return sendError(res, 400, 'Quantity must be at least 1 for each item');
      cleanItems.push({
        product:       item.product || null,
        productName:   item.productName.trim(),
        sku:           item.sku || '',
        image:         item.image || '',
        quantity:      qty,
        selections:    item.selections || undefined,
        unitPrice:     null,
        originalPrice: item.originalPrice != null ? parseFloat(item.originalPrice) : null,
      });
    }

    const quoteData = {
      items:   cleanItems,
      message: message || '',
    };

    // Store submitter by role
    if (req.user.role === 'retailer') {
      quoteData.retailer = req.user.id;
    } else {
      quoteData.customer = req.user.id;
    }

    if (shippingAddress && typeof shippingAddress === 'object') {
      quoteData.shippingAddress = shippingAddress;
    }

    const quote = await Quote.create(quoteData);

    sendSuccess(res, 201, 'Quote request submitted', quote);
  } catch (error) {
    next(error);
  }
};

// ── Get single quote by ID (owner only) ──────────────────────────────────────
exports.getQuoteById = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('items.product', 'title images slug')
      .populate('orderId', 'orderNumber status total');

    if (!quote) return sendError(res, 404, 'Quote not found');

    const ownerId = (quote.customer || quote.retailer)?.toString();
    if (ownerId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'child_admin') {
      return sendError(res, 403, 'Not authorised');
    }

    sendSuccess(res, 200, 'Quote fetched', quote);
  } catch (error) {
    next(error);
  }
};

// ── Customer / Retailer: get their own quotes ─────────────────────────────────
exports.getMyQuotes = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const userFilter = { $or: [{ customer: req.user.id }, { retailer: req.user.id }] };
    const filter = req.query.status
      ? { ...userFilter, status: req.query.status }
      : userFilter;

    const total  = await Quote.countDocuments(filter);
    const quotes = await Quote.find(filter)
      .populate('items.product', 'title images slug')
      .populate('orderId', 'orderNumber status total')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    sendPaginated(res, quotes, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// ── Admin/child_admin: get all quotes ─────────────────────────────────────────
exports.adminGetQuotes = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const total  = await Quote.countDocuments(filter);
    const quotes = await Quote.find(filter)
      .populate('customer',      'name email phone')
      .populate('retailer',      'name email phone')
      .populate('items.product', 'title images')
      .populate('orderId',       'orderNumber status total')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    sendPaginated(res, quotes, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// ── Admin/child_admin: update / confirm quote ─────────────────────────────────
// When admin sets status='confirmed', an order is auto-created so the customer
// can immediately see it in "My Orders" and track delivery.
exports.respondToQuote = async (req, res, next) => {
  try {
    const { status, adminResponse, quotedTotal, items } = req.body;

    const allowedStatuses = ['pending', 'reviewed', 'quoted', 'confirmed', 'rejected'];
    if (status && !allowedStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    const quote = await Quote.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('retailer', 'name email phone');
    if (!quote) return sendError(res, 404, 'Quote not found');

    if (quote.status === 'confirmed' && quote.orderId) {
      return sendError(res, 400, 'Quote is already confirmed — order has been created');
    }

    if (items && Array.isArray(items)) {
      // Build a map of existing items to preserve selections
      const existingMap = {};
      quote.items.forEach((it) => {
        const key = it.product?.toString() || it.productName;
        if (key) existingMap[key] = it.selections;
      });

      quote.items = items.map((item) => {
        const key = item.product?._id || item.product || item.productName;
        return {
          product:       item.product?._id || item.product || null,
          productName:   (item.productName || '').trim(),
          sku:           item.sku || '',
          image:         item.image || '',
          quantity:      parseInt(item.quantity) || 1,
          selections:    item.selections || existingMap[key?.toString()] || undefined,
          unitPrice:     item.unitPrice != null ? parseFloat(item.unitPrice) : null,
          originalPrice: item.originalPrice != null ? parseFloat(item.originalPrice) : null,
        };
      });
    }

    if (adminResponse !== undefined) quote.adminResponse = adminResponse;

    if (quotedTotal !== undefined) {
      quote.quotedTotal = quotedTotal !== '' && quotedTotal !== null
        ? parseFloat(quotedTotal)
        : null;
    }

    if (status) {
      quote.status      = status;
      quote.respondedAt = new Date();
      quote.respondedBy = req.user.id;
    }

    await quote.save();

    const updated = await Quote.findById(quote._id)
      .populate('customer',      'name email phone')
      .populate('retailer',      'name email phone')
      .populate('items.product', 'title images')
      .populate('orderId',       'orderNumber status total');

    sendSuccess(res, 200, 'Quote updated', updated);
  } catch (error) {
    next(error);
  }
};

// ── Customer: place order after quote is confirmed ────────────────────────────
exports.placeOrderFromQuote = async (req, res, next) => {
  try {
    const { paymentMethod = 'cod', shippingAddress } = req.body;

    const quote = await Quote.findById(req.params.id)
      .populate('items.product', 'title images sku');
    if (!quote) return sendError(res, 404, 'Quote not found');

    // Verify ownership
    const ownerId = (quote.customer || quote.retailer)?.toString();
    if (ownerId !== req.user.id) {
      return sendError(res, 403, 'Not authorised');
    }

    if (quote.status !== 'confirmed') {
      return sendError(res, 400, 'Quote must be confirmed by admin before placing an order');
    }

    if (quote.orderId) {
      return sendError(res, 400, 'Order has already been placed for this quote');
    }

    const itemTotal = quote.items.reduce(
      (sum, item) => sum + (item.unitPrice || item.originalPrice || 0) * item.quantity,
      0
    );
    const total = quote.quotedTotal != null ? quote.quotedTotal : itemTotal;

    const order = await Order.create({
      customer: req.user.id,
      items: quote.items.map((item) => ({
        product:    item.product?._id || item.product || undefined,
        title:      item.productName,
        image:      item.image || item.product?.images?.[0]?.url || '',
        sku:        item.sku || '',
        selections: item.selections || undefined,
        price:      item.unitPrice || item.originalPrice || 0,
        quantity:   item.quantity,
        discount:   0,
        subtotal:   (item.unitPrice || item.originalPrice || 0) * item.quantity,
      })),
      shippingAddress: (shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : quote.shippingAddress) || {},
      payment:  { method: paymentMethod, status: paymentMethod === 'cod' ? 'pending' : 'pending' },
      subtotal: total,
      total,
      source:   'quote',
      quoteId:  quote._id,
      status:   'confirmed',
      statusHistory: [{
        status:    'confirmed',
        comment:   `Order placed by customer from confirmed quote`,
        updatedBy: req.user.id,
      }],
    });

    quote.orderId = order._id;
    await quote.save();

    sendSuccess(res, 201, 'Order placed successfully', { order, quoteId: quote._id });
  } catch (error) {
    next(error);
  }
};
