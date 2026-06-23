const User   = require('../models/User');
const Store  = require('../models/Store');
const Product = require('../models/Product');
const Order  = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/response');
const { getFileUrl } = require('../config/cloudinary');

// ─── Public ──────────────────────────────────────────────────────────────────

// @route  POST /api/vendor/register
// @access Public
exports.registerVendor = async (req, res, next) => {
  try {
    const {
      name, email, password, phone,
      shopName, businessType, gstNumber, panNumber,
      businessAddress, city, state, pincode,
    } = req.body;

    if (await User.findOne({ email })) {
      return sendError(res, 400, 'Email already registered');
    }

    const user = await User.create({
      name, email, password, phone,
      role: 'vendor',
      vendorStatus: 'pending',
      vendorDetails: {
        shopName, businessType, gstNumber, panNumber,
        businessAddress, city, state, pincode,
      },
    });

    // Pre-create a store in pending state
    const slug = await generateUniqueSlug(shopName);
    const store = await Store.create({
      name: shopName,
      slug,
      vendor: user._id,
      city, state, pincode,
      phone,
      email,
      gstNumber,
      status: 'pending',
    });

    user.store = store._id;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 201, 'Vendor registration submitted. Awaiting admin approval.', {
      userId: user._id,
      storeId: store._id,
      status: 'pending',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Vendor Dashboard ─────────────────────────────────────────────────────────

// @route  GET /api/vendor/dashboard
// @access Vendor
exports.getVendorDashboard = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');

    const storeFilter = { store: store._id };
    const Review = require('../models/Review');
    const storeProductIds = await Product.find({ store: store._id }).distinct('_id');

    const [totalProducts, totalOrders, recentOrders, revenueAgg, pendingOrders, lowStockProducts, topProducts, recentReviews] = await Promise.all([
      Product.countDocuments({ store: store._id, isActive: true, status: { $ne: 'archived' } }),
      Order.countDocuments(storeFilter),
      Order.find(storeFilter).sort({ createdAt: -1 }).limit(5).populate('customer', 'name email'),
      Order.aggregate([
        { $match: { ...storeFilter, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$vendorPayout' } } },
      ]),
      Order.countDocuments({ ...storeFilter, status: { $in: ['pending', 'confirmed', 'processing'] } }),
      Product.find({ store: store._id, isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).limit(5).select('title stock'),
      Product.find({ store: store._id }).sort('-totalSold').limit(5).select('title totalSold price'),
      Review.find({ product: { $in: storeProductIds }, isApproved: true }).sort('-createdAt').limit(5).populate('user', 'name'),
    ]);

    sendSuccess(res, 200, 'Dashboard data', {
      store,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        pendingOrders,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      lowStockProducts,
      topProducts,
      recentReviews: recentReviews || [],
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/vendor/store
// @access Vendor
exports.getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    sendSuccess(res, 200, 'Store fetched', { store });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/store
// @access Vendor
exports.updateMyStore = async (req, res, next) => {
  try {
    const allowed = ['name', 'tagline', 'description', 'phone', 'email',
                     'address', 'city', 'state', 'pincode', 'hoursDisplay',
                     'facilities', 'services', 'makingCharges'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.files?.logo?.[0]) updates.logo = getFileUrl(req.files.logo[0]);
    if (req.files?.banner?.[0]) updates.banner = getFileUrl(req.files.banner[0]);
    if (req.file && req.file.fieldname === 'logo') updates.logo = getFileUrl(req.file);

    const store = await Store.findOneAndUpdate(
      { vendor: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!store) return sendError(res, 404, 'Store not found');

    sendSuccess(res, 200, 'Store updated', { store });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/vendor/products
// @access Vendor
exports.getVendorProducts = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id }).select('_id');
    if (!store) return sendError(res, 404, 'Store not found');

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = { store: store._id };
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    if (req.query.status === 'active')   filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('category', 'name slug'),
      Product.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Products fetched', {
      products, total, page, pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/vendor/orders
// @access Vendor
exports.getVendorOrders = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id }).select('_id');
    if (!store) return sendError(res, 404, 'Store not found');

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = { store: store._id };
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('customer', 'name email phone'),
      Order.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Orders fetched', {
      orders, total, page, pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/orders/:id/status
// @access Vendor
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id }).select('_id');
    if (!store) return sendError(res, 404, 'Store not found');

    const order = await Order.findOne({ _id: req.params.id, store: store._id });
    if (!order) return sendError(res, 404, 'Order not found');

    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (req.body.status && !allowed.includes(req.body.status)) {
      return sendError(res, 400, 'Invalid status');
    }

    if (req.body.status) {
      order.status = req.body.status;
      order.statusHistory.push({
        status: req.body.status,
        comment: req.body.comment || '',
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
    }
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.courierName) order.courierName = req.body.courierName;
    if (req.body.trackingUrl) order.trackingUrl = req.body.trackingUrl;

    if (req.body.cancellationAction && order.cancellationRequest?.status === 'pending') {
      order.cancellationRequest.status = req.body.cancellationAction;
      order.cancellationRequest.resolvedAt = new Date();
      order.cancellationRequest.resolvedBy = req.user.id;
      if (req.body.cancellationAction === 'approved') order.status = 'cancelled';
    }
    if (req.body.returnAction && order.returnRequest?.status === 'pending') {
      order.returnRequest.status = req.body.returnAction;
      order.returnRequest.resolvedAt = new Date();
      order.returnRequest.resolvedBy = req.user.id;
      if (req.body.returnAction === 'approved') order.status = 'returned';
    }

    await order.save();

    sendSuccess(res, 200, 'Order status updated', { order });
  } catch (error) {
    next(error);
  }
};

// ─── Super Admin: Vendor Management ──────────────────────────────────────────

// @route  GET /api/vendor/admin/list
// @access Admin
exports.adminGetVendors = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 20;
    const skip   = (page - 1) * limit;
    const filter = { role: 'vendor' };
    if (req.query.status) filter.vendorStatus = req.query.status;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const [vendors, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('store', 'name slug status commissionRate totalProducts totalOrders'),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Vendors fetched', {
      vendors, total, page, pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/admin/:id/approve
// @access Admin
exports.adminApproveVendor = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!user) return sendError(res, 404, 'Vendor not found');

    user.vendorStatus = 'approved';
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    await Store.findOneAndUpdate(
      { vendor: user._id },
      { status: 'approved', approvedAt: new Date(), approvedBy: req.user.id }
    );

    sendSuccess(res, 200, 'Vendor approved');
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/admin/:id/reject
// @access Admin
exports.adminRejectVendor = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!user) return sendError(res, 404, 'Vendor not found');

    user.vendorStatus = 'rejected';
    await user.save({ validateBeforeSave: false });

    await Store.findOneAndUpdate(
      { vendor: user._id },
      { status: 'rejected', rejectedReason: req.body.reason || '' }
    );

    sendSuccess(res, 200, 'Vendor rejected');
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/admin/:id/suspend
// @access Admin
exports.adminSuspendVendor = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!user) return sendError(res, 404, 'Vendor not found');

    const newStatus = user.vendorStatus === 'suspended' ? 'approved' : 'suspended';
    user.vendorStatus = newStatus;
    await user.save({ validateBeforeSave: false });

    await Store.findOneAndUpdate(
      { vendor: user._id },
      { status: newStatus === 'suspended' ? 'suspended' : 'approved' }
    );

    sendSuccess(res, 200, `Vendor ${newStatus}`);
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/admin/:id/commission
// @access Admin
exports.adminSetCommission = async (req, res, next) => {
  try {
    const store = await Store.findOneAndUpdate(
      { vendor: req.params.id },
      { commissionRate: req.body.commissionRate },
      { new: true }
    );
    if (!store) return sendError(res, 404, 'Store not found');
    sendSuccess(res, 200, 'Commission updated', { store });
  } catch (error) {
    next(error);
  }
};

exports.adminGetVendorProducts = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'vendor' }).populate('store');
    if (!user?.store) return sendError(res, 404, 'Vendor store not found');
    const products = await Product.find({ store: user.store._id }).sort('-createdAt').limit(50)
      .select('title price stock status isActive createdAt');
    sendSuccess(res, 200, 'Vendor products', { products, store: user.store });
  } catch (error) {
    next(error);
  }
};

exports.adminGetVendorOrders = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'vendor' }).populate('store');
    if (!user?.store) return sendError(res, 404, 'Vendor store not found');
    const orders = await Order.find({ store: user.store._id }).sort('-createdAt').limit(50)
      .populate('customer', 'name email');
    sendSuccess(res, 200, 'Vendor orders', { orders, store: user.store });
  } catch (error) {
    next(error);
  }
};

// ─── Vendor Product Management ────────────────────────────────────────────────

// @route  POST /api/vendor/products
// @access Vendor
exports.createVendorProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    if (store.status !== 'approved') return sendError(res, 403, 'Store must be approved to add products');

    const payload = {
      ...req.body,
      store: store._id,
      status: 'pending',
    };

    if (!payload.slug && payload.title) {
      payload.slug = await generateUniqueProductSlug(payload.title);
    }

    const product = await Product.create(payload);
    await Store.findByIdAndUpdate(store._id, { $inc: { totalProducts: 1 } });
    sendSuccess(res, 201, 'Product created', product);
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/products/:id
// @access Vendor
exports.updateVendorProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');

    const product = await Product.findOne({ _id: req.params.id, store: store._id });
    if (!product) return sendError(res, 404, 'Product not found');

    Object.keys(req.body).forEach((key) => {
      if (key !== 'store' && key !== 'vendor' && key !== 'slug') {
        product[key] = req.body[key];
      }
    });

    await product.save();
    sendSuccess(res, 200, 'Product updated', product);
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/vendor/products/:id
// @access Vendor
exports.deleteVendorProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');

    const product = await Product.findOne({ _id: req.params.id, store: store._id });
    if (!product) return sendError(res, 404, 'Product not found');

    product.status = 'archived';
    product.isActive = false;
    await product.save();
    sendSuccess(res, 200, 'Product archived');
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function generateUniqueSlug(name) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let count = 0;
  while (await Store.findOne({ slug: count === 0 ? slug : `${slug}-${count}` })) count++;
  return count === 0 ? slug : `${slug}-${count}`;
}

async function generateUniqueProductSlug(title) {
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let count = 0;
  while (await Product.findOne({ slug: count === 0 ? slug : `${slug}-${count}` })) count++;
  return count === 0 ? slug : `${slug}-${count}`;
}
