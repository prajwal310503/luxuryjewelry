const Quote = require('../models/Quote');
const Order = require('../models/Order');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// ── Retailer: submit a quote request ─────────────────────────────────────────
exports.createQuote = async (req, res, next) => {
  try {
    const { items, message } = req.body;

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
        product:     item.product || null,
        productName: item.productName.trim(),
        sku:         item.sku || '',
        quantity:    qty,
        unitPrice:   null,
      });
    }

    const quote = await Quote.create({
      retailer: req.user.id,
      items:    cleanItems,
      message:  message || '',
    });

    sendSuccess(res, 201, 'Quote request submitted', quote);
  } catch (error) {
    next(error);
  }
};

// ── Retailer: get their own quotes ────────────────────────────────────────────
exports.getMyQuotes = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { retailer: req.user.id };
    if (req.query.status) filter.status = req.query.status;

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
      .populate('retailer', 'name email phone')
      .populate('items.product', 'title images')
      .populate('orderId', 'orderNumber status total')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    sendPaginated(res, quotes, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// ── Admin/child_admin: update quote (edit items, set prices, respond, confirm) ─
exports.respondToQuote = async (req, res, next) => {
  try {
    const { status, adminResponse, quotedTotal, items } = req.body;

    const allowedStatuses = ['pending', 'reviewed', 'quoted', 'confirmed', 'rejected'];
    if (status && !allowedStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status');
    }

    const quote = await Quote.findById(req.params.id).populate('retailer', 'name email phone');
    if (!quote) return sendError(res, 404, 'Quote not found');

    if (quote.status === 'confirmed' && quote.orderId) {
      return sendError(res, 400, 'Quote is already confirmed — order has been created');
    }

    // Update editable fields
    if (items && Array.isArray(items)) {
      quote.items = items.map((item) => ({
        product:     item.product || null,
        productName: (item.productName || '').trim(),
        sku:         item.sku || '',
        quantity:    parseInt(item.quantity) || 1,
        unitPrice:   item.unitPrice != null ? parseFloat(item.unitPrice) : null,
      }));
    }

    if (adminResponse !== undefined) quote.adminResponse = adminResponse;

    if (quotedTotal !== undefined) {
      quote.quotedTotal = quotedTotal !== '' && quotedTotal !== null ? parseFloat(quotedTotal) : null;
    }

    if (status) {
      quote.status      = status;
      quote.respondedAt = new Date();
      quote.respondedBy = req.user.id;
    }

    // Auto-create order when admin confirms
    if (status === 'confirmed' && !quote.orderId) {
      const itemTotal = quote.items.reduce(
        (sum, item) => sum + (item.unitPrice || 0) * item.quantity,
        0
      );
      const total = quote.quotedTotal != null ? quote.quotedTotal : itemTotal;

      const order = await Order.create({
        customer: quote.retailer._id || quote.retailer,
        items: quote.items.map((item) => ({
          product:  item.product || undefined,
          title:    item.productName,
          image:    '',
          sku:      item.sku || '',
          price:    item.unitPrice || 0,
          quantity: item.quantity,
          discount: 0,
          subtotal: (item.unitPrice || 0) * item.quantity,
        })),
        shippingAddress: {},
        payment:  { method: 'quote', status: 'pending' },
        subtotal: total,
        total,
        source:   'quote',
        quoteId:  quote._id,
        status:   'confirmed',
        statusHistory: [{
          status:    'confirmed',
          comment:   `Order auto-created from confirmed quote #${quote._id}`,
          updatedBy: req.user.id,
        }],
      });

      quote.orderId = order._id;
    }

    await quote.save();

    const updated = await Quote.findById(quote._id)
      .populate('retailer', 'name email phone')
      .populate('items.product', 'title images')
      .populate('orderId', 'orderNumber status total');

    sendSuccess(res, 200, 'Quote updated', updated);
  } catch (error) {
    next(error);
  }
};
