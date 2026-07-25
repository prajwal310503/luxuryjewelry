const User   = require('../models/User');
const Store  = require('../models/Store');
const Product = require('../models/Product');
const Order  = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/response');
const { assertCanDispatch } = require('../utils/orderPaymentHelpers');
const { getFileUrl } = require('../config/cloudinary');

// ─── Public ──────────────────────────────────────────────────────────────────

// @route  POST /api/vendor/register
// @access Public — basic details only; KYC completed in vendor portal
exports.registerVendor = async (req, res, next) => {
  try {
    const {
      name, email, password, phone,
      shopName, city, agreeTerms,
    } = req.body;

    if (!agreeTerms) {
      return sendError(res, 400, 'You must accept the Terms & Conditions to register');
    }
    if (await User.findOne({ email })) {
      return sendError(res, 400, 'Email already registered');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'vendor',
      vendorStatus: 'pending',
      vendorDetails: {
        shopName: shopName?.trim(),
        city: city?.trim() || '',
      },
      kyc: {
        status: 'incomplete',
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      },
    });

    const slug = await generateUniqueSlug(shopName);
    const store = await Store.create({
      name: shopName.trim(),
      slug,
      vendor: user._id,
      city: city?.trim() || '',
      phone,
      email,
      status: 'pending',
    });

    user.store = store._id;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 201, 'Registration successful. Log in and complete KYC to get approved.', {
      userId: user._id,
      storeId: store._id,
      status: 'pending',
      nextStep: 'kyc',
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

    if (typeof updates.makingCharges === 'string') {
      try { updates.makingCharges = JSON.parse(updates.makingCharges); } catch { /* ignore */ }
    }

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
      const dispatchCheck = assertCanDispatch(order);
      if (!dispatchCheck.allowed && ['processing', 'shipped', 'delivered'].includes(req.body.status)) {
        return sendError(res, 400, dispatchCheck.message);
      }

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

    const kycStatus = user.kyc?.status || 'incomplete';
    if (kycStatus === 'incomplete') {
      return sendError(res, 400, 'Vendor has not completed KYC yet. Ask them to finish KYC in the vendor portal.');
    }
    if (kycStatus === 'rejected') {
      return sendError(res, 400, 'Vendor KYC was rejected. They must re-submit KYC before approval.');
    }

    user.vendorStatus = 'approved';
    user.isActive = true;
    if (user.kyc) {
      user.kyc.status = 'approved';
      user.kyc.reviewedAt = new Date();
      user.kyc.reviewedBy = req.user.id;
    }
    await user.save({ validateBeforeSave: false });

    await Store.findOneAndUpdate(
      { vendor: user._id },
      { status: 'approved', approvedAt: new Date(), approvedBy: req.user.id }
    );

    sendSuccess(res, 200, 'Vendor approved — they can now list products for review');
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

function mapUploadedImages(files = []) {
  return files.map((file, idx) => ({
    url: getFileUrl(file),
    publicId: file.filename || file.public_id || '',
    isPrimary: idx === 0,
    sortOrder: idx,
  })).filter((img) => img.url);
}

function mapUploadedVideos(files = []) {
  return files.map((file, idx) => ({
    url: getFileUrl(file),
    publicId: file.filename || file.public_id || '',
    sortOrder: idx,
  })).filter((v) => v.url);
}

function parseMaybeJson(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { return JSON.parse(t); } catch { return value; }
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  return value;
}

/** Keep AttributeValue ObjectIds on product.attributes[].values (not only customValue). */
function normalizeAttributes(attrs) {
  if (!Array.isArray(attrs)) return [];
  return attrs
    .map((a) => {
      if (!a) return null;
      const attribute = a.attribute?._id || a.attribute;
      if (!attribute) return null;
      let values = [];
      if (Array.isArray(a.values)) {
        values = a.values.map((v) => (v && (v._id || v))).filter(Boolean).map(String);
      } else if (a.value || a.attributeValue) {
        values = [String(a.value || a.attributeValue)];
      }
      const customValue = a.customValue ? String(a.customValue).trim() : '';
      if (!values.length && !customValue) return null;
      return {
        attribute,
        values,
        ...(customValue ? { customValue } : {}),
      };
    })
    .filter(Boolean);
}

function parseVendorProductBody(body) {
  const payload = {};
  const b = body || {};

  if (b.title !== undefined) payload.title = b.title;
  if (b.sku !== undefined) payload.sku = b.sku || undefined;
  if (b.shortDescription !== undefined) payload.shortDescription = b.shortDescription;
  if (b.description !== undefined) payload.description = b.description;
  if (b.category) payload.category = b.category;
  if (b.subcategory !== undefined) payload.subcategory = b.subcategory || undefined;
  if (b.purity !== undefined) payload.purity = b.purity;
  if (b.price !== undefined && b.price !== '') payload.price = Number(b.price);
  if (b.costPrice !== undefined && b.costPrice !== '') payload.costPrice = Number(b.costPrice);
  if (b.discount !== undefined && b.discount !== '') payload.discount = Number(b.discount);
  if (b.stock !== undefined && b.stock !== '') payload.stock = Number(b.stock);
  if (b.metalWeight !== undefined && b.metalWeight !== '') payload.metalWeight = Number(b.metalWeight);
  if (b.deliveryDays !== undefined && b.deliveryDays !== '') payload.deliveryDays = Number(b.deliveryDays);
  if (b.diamondClarity !== undefined) payload.diamondClarity = b.diamondClarity || undefined;

  const boolFields = ['isFeatured', 'isNewArrival', 'isBestSeller'];
  boolFields.forEach((field) => {
    if (b[field] !== undefined) payload[field] = parseMaybeJson(b[field]) === true || b[field] === 'true' || b[field] === true;
  });

  ['giftTags', 'wearingTypes', 'stoneColors', 'sizes', 'lengths', 'seo'].forEach((field) => {
    if (b[field] !== undefined) {
      const parsed = parseMaybeJson(b[field]);
      if (parsed !== undefined) payload[field] = parsed;
    }
  });

  if (b.attributes !== undefined) {
    payload.attributes = normalizeAttributes(parseMaybeJson(b.attributes));
  }

  // Vendor products stay pending until admin approves — ignore client status for create; allow draft only if sent as draft
  if (b.status === 'draft') payload.status = 'draft';

  return payload;
}

async function findVendorOwnedProduct(vendorId, productId) {
  const store = await Store.findOne({ vendor: vendorId }).select('_id');
  if (!store) return { error: 'Store not found', status: 404 };
  const product = await Product.findOne({ _id: productId, store: store._id });
  if (!product) return { error: 'Product not found', status: 404 };
  return { store, product };
}

// @route  GET /api/vendor/products/:id
// @access Vendor
exports.getVendorProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id }).select('_id');
    if (!store) return sendError(res, 404, 'Store not found');

    const product = await Product.findOne({ _id: req.params.id, store: store._id })
      .populate('category', 'name slug commissionRate')
      .populate('subcategory', 'name slug')
      .populate('attributes.attribute', 'name slug type displayType')
      .populate('attributes.values', 'value slug colorCode');
    if (!product) return sendError(res, 404, 'Product not found');

    sendSuccess(res, 200, 'Product fetched', product);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/vendor/products
// @access Vendor
exports.createVendorProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    if (store.status !== 'approved') {
      return sendError(res, 403, 'Complete KYC and wait for admin approval before adding products');
    }

    const vendorUser = await User.findById(req.user.id).select('vendorStatus kyc');
    if (vendorUser?.vendorStatus !== 'approved') {
      return sendError(res, 403, 'Your seller account is not approved yet');
    }

    const payload = {
      ...parseVendorProductBody(req.body),
      store: store._id,
      status: req.body?.status === 'draft' ? 'draft' : 'pending',
      isActive: true,
      // Vendors cannot self-feature products on homepage
      isFeatured: false,
      isBestSeller: false,
    };

    if (!payload.title || !payload.category || payload.price == null) {
      return sendError(res, 400, 'Title, category, and price are required');
    }

    const imageFiles = req.files?.images || [];
    if (imageFiles.length) payload.images = mapUploadedImages(imageFiles);

    const videoFiles = req.files?.videos || [];
    if (videoFiles.length) payload.videos = mapUploadedVideos(videoFiles);

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

    const updates = parseVendorProductBody(req.body);
    // Never let vendor force-approve or feature
    delete updates.isFeatured;
    delete updates.isBestSeller;
    if (updates.status && !['draft', 'pending'].includes(updates.status)) {
      delete updates.status;
    }

    Object.keys(updates).forEach((key) => {
      product[key] = updates[key];
    });

    const imageFiles = req.files?.images || [];
    if (imageFiles.length) {
      const newImages = mapUploadedImages(imageFiles).map((img, idx) => ({
        ...img,
        sortOrder: product.images.length + idx,
        isPrimary: product.images.length === 0 && idx === 0,
      }));
      product.images.push(...newImages);
    }

    const videoFiles = req.files?.videos || [];
    if (videoFiles.length) {
      if (!product.videos) product.videos = [];
      const newVideos = mapUploadedVideos(videoFiles).map((v, idx) => ({
        ...v,
        sortOrder: product.videos.length + idx,
      }));
      product.videos.push(...newVideos);
    }

    // Re-moderation: any material edit of an approved product goes back to pending
    if (['approved', 'rejected'].includes(product.status)) {
      product.status = 'pending';
      product.approvedAt = undefined;
      product.approvedBy = undefined;
      product.rejectionReason = undefined;
    }

    await product.save();
    sendSuccess(res, 200, 'Product updated and submitted for admin review', product);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/vendor/products/:id/images
exports.uploadVendorProductImages = async (req, res, next) => {
  try {
    const result = await findVendorOwnedProduct(req.user.id, req.params.id);
    if (result.error) return sendError(res, result.status, result.error);
    const { product } = result;
    const files = req.files || [];
    if (!files.length) return sendError(res, 400, 'No images uploaded');

    const newImages = mapUploadedImages(files).map((img, idx) => ({
      ...img,
      alt: product.title,
      isPrimary: product.images.length === 0 && idx === 0,
      sortOrder: product.images.length + idx,
    }));
    product.images.push(...newImages);
    if (['approved', 'rejected'].includes(product.status)) product.status = 'pending';
    await product.save();
    sendSuccess(res, 200, 'Images uploaded', product.images);
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/vendor/products/:id/images/:imageIndex
exports.removeVendorProductImage = async (req, res, next) => {
  try {
    const result = await findVendorOwnedProduct(req.user.id, req.params.id);
    if (result.error) return sendError(res, result.status, result.error);
    const { product } = result;

    const idx = parseInt(req.params.imageIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= product.images.length) {
      return sendError(res, 400, 'Invalid image index');
    }
    product.images.splice(idx, 1);
    if (product.images.length > 0) {
      product.images[0].isPrimary = true;
      product.images[0].sortOrder = 0;
    }
    if (['approved', 'rejected'].includes(product.status)) product.status = 'pending';
    await product.save();
    sendSuccess(res, 200, 'Image removed', product.images);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/vendor/products/:id/videos
exports.uploadVendorProductVideos = async (req, res, next) => {
  try {
    const result = await findVendorOwnedProduct(req.user.id, req.params.id);
    if (result.error) return sendError(res, result.status, result.error);
    const { product } = result;
    if (!req.files || req.files.length === 0) return sendError(res, 400, 'No videos uploaded');
    if (!product.videos) product.videos = [];
    const newVideos = mapUploadedVideos(req.files).map((v, idx) => ({
      ...v,
      sortOrder: product.videos.length + idx,
    }));
    product.videos.push(...newVideos);
    if (['approved', 'rejected'].includes(product.status)) product.status = 'pending';
    await product.save();
    sendSuccess(res, 200, 'Videos uploaded', product.videos);
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/vendor/products/:id/videos/:videoIndex
exports.removeVendorProductVideo = async (req, res, next) => {
  try {
    const result = await findVendorOwnedProduct(req.user.id, req.params.id);
    if (result.error) return sendError(res, result.status, result.error);
    const { product } = result;
    const idx = parseInt(req.params.videoIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || !product.videos || idx >= product.videos.length) {
      return sendError(res, 400, 'Invalid video index');
    }
    product.videos.splice(idx, 1);
    if (['approved', 'rejected'].includes(product.status)) product.status = 'pending';
    await product.save();
    sendSuccess(res, 200, 'Video removed', product.videos);
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

// ─── Vendor KYC (inside portal) ───────────────────────────────────────────────

// @route  GET /api/vendor/kyc
// @access Vendor
exports.getVendorKyc = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('vendorDetails kyc vendorStatus name email phone store');
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'KYC status', {
      vendorDetails: user.vendorDetails || {},
      kyc: user.kyc || { status: 'incomplete' },
      vendorStatus: user.vendorStatus,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/vendor/kyc
// @access Vendor — submit / update KYC + accept marketplace T&Cs
exports.submitVendorKyc = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'vendor') return sendError(res, 404, 'Vendor not found');

    const {
      businessType, gstNumber, panNumber, aadhaarNumber,
      businessAddress, city, state, pincode,
      bankName, accountNumber, ifscCode, accountHolder,
      agreeTerms, documents,
    } = req.body;

    if (!agreeTerms) {
      return sendError(res, 400, 'Please accept the seller Terms & Conditions');
    }
    if (!gstNumber?.trim() || !panNumber?.trim()) {
      return sendError(res, 400, 'GST and PAN numbers are required');
    }
    if (!businessAddress?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return sendError(res, 400, 'Complete business address is required');
    }
    if (!bankName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !accountHolder?.trim()) {
      return sendError(res, 400, 'Bank account details are required for payouts');
    }

    user.vendorDetails = {
      ...user.vendorDetails?.toObject?.() || user.vendorDetails || {},
      businessType: businessType || user.vendorDetails?.businessType,
      gstNumber: gstNumber.trim().toUpperCase(),
      panNumber: panNumber.trim().toUpperCase(),
      aadhaarNumber: aadhaarNumber?.trim() || '',
      businessAddress: businessAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountHolder: accountHolder.trim(),
    };

    user.kyc = {
      status: 'submitted',
      documents: Array.isArray(documents) ? documents : (user.kyc?.documents || []),
      submittedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      rejectionReason: undefined,
    };

    await user.save({ validateBeforeSave: false });

    await Store.findOneAndUpdate(
      { vendor: user._id },
      {
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
      }
    );

    sendSuccess(res, 200, 'KYC submitted. Admin will review and approve your seller account.', {
      kyc: user.kyc,
      vendorStatus: user.vendorStatus,
    });
  } catch (error) {
    next(error);
  }
};
