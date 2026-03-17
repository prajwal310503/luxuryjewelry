const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getFileUrl } = require('../config/cloudinary');

// @desc    Get all products (storefront with filters)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    let baseQuery = Product.find({ status: 'approved', isActive: true });

    // Category filter
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        const childCategories = await Category.find({ ancestors: { $elemMatch: { _id: category._id } } }).distinct('_id');
        baseQuery = Product.find({
          status: 'approved',
          isActive: true,
          $or: [{ category: category._id }, { category: { $in: childCategories } }],
        });
      }
    }

    // Attribute filters (dynamic)
    const attributeFilters = {};
    const attributeKeys = Object.keys(req.query).filter((k) => k.startsWith('attr_'));
    for (const key of attributeKeys) {
      const attrSlug = key.replace('attr_', '');
      const values = Array.isArray(req.query[key]) ? req.query[key] : [req.query[key]];
      attributeFilters[`attributes.values`] = { $in: values };
    }

    // Segments filter
    if (req.query.segments) {
      const segments = Array.isArray(req.query.segments) ? req.query.segments : [req.query.segments];
      baseQuery = baseQuery.where('segments').in(segments);
    }

    // Occasions filter
    if (req.query.occasions) {
      const occasions = Array.isArray(req.query.occasions) ? req.query.occasions : [req.query.occasions];
      baseQuery = baseQuery.where('occasions').in(occasions);
    }

    // Themes filter
    if (req.query.themes) {
      const themes = Array.isArray(req.query.themes) ? req.query.themes : [req.query.themes];
      baseQuery = baseQuery.where('themes').in(themes);
    }

    const features = new APIFeatures(baseQuery, req.query)
      .search(['title', 'shortDescription'])
      .priceRange();

    // Sorting
    const sortMap = {
      newest: '-createdAt',
      price_asc: 'price',
      price_desc: '-price',
      rating: '-rating',
      popular: '-totalSold',
    };
    const sortBy = sortMap[req.query.sort] || '-createdAt';
    features.query = features.query.sort(sortBy);

    // Count total
    const total = await Product.countDocuments(features.query.getQuery());

    // Paginate
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await features.query
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('vendor', 'storeName storeSlug storeLogo')
      .select('-description -__v');

    sendPaginated(res, products, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'approved', isActive: true })
      .populate('category', 'name slug ancestors')
      .populate('subcategory', 'name slug')
      .populate('vendor', 'storeName storeSlug storeLogo rating totalReviews')
      .populate('attributes.attribute', 'name slug type displayType')
      .populate('attributes.values', 'value slug colorCode image');

    if (!product) return sendError(res, 404, 'Product not found');

    // Increment view count
    await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

    sendSuccess(res, 200, 'Product fetched', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor creates product
// @route   POST /api/products
// @access  Vendor
exports.createProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id, status: 'approved' });
    if (!vendor) return sendError(res, 403, 'Vendor profile not approved');

    const productData = { ...req.body, vendor: vendor._id, status: 'pending' };
    const product = await Product.create(productData);

    await Vendor.findByIdAndUpdate(vendor._id, { $inc: { totalProducts: 1 } });

    sendSuccess(res, 201, 'Product created. Awaiting admin approval.', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor updates product
// @route   PUT /api/products/:id
// @access  Vendor
exports.updateProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 403, 'Vendor profile not found');

    let product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!product) return sendError(res, 404, 'Product not found');

    // Reset status to pending if key fields change
    const sensitiveFields = ['price', 'title', 'category', 'description'];
    const hasSensitiveChange = sensitiveFields.some((f) => req.body[f] !== undefined);
    if (hasSensitiveChange) {
      req.body.status = 'pending';
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    sendSuccess(res, 200, 'Product updated', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Vendor deletes product
// @route   DELETE /api/products/:id
// @access  Vendor
exports.deleteProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 403, 'Vendor profile not found');

    const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!product) return sendError(res, 404, 'Product not found');

    product.isActive = false;
    product.status = 'archived';
    await product.save();

    sendSuccess(res, 200, 'Product archived');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: get all products
// @route   GET /api/admin/products
// @access  Admin
exports.adminGetProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.vendor) filter.vendor = req.query.vendor;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { sku: new RegExp(req.query.search, 'i') },
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('vendor', 'storeName')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt')
      .select('title sku price stock status vendor category isFeatured createdAt images rating');

    sendPaginated(res, products, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: approve/reject product
// @route   PUT /api/admin/products/:id/status
// @access  Admin
exports.adminUpdateProductStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const allowed = ['approved', 'rejected', 'archived'];
    if (!allowed.includes(status)) return sendError(res, 400, 'Invalid status');

    const update = { status };
    if (status === 'approved') {
      update.approvedAt = Date.now();
      update.approvedBy = req.user.id;
    }
    if (status === 'rejected') {
      update.rejectionReason = rejectionReason;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return sendError(res, 404, 'Product not found');

    sendSuccess(res, 200, `Product ${status}`, product);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: toggle featured
// @route   PUT /api/admin/products/:id/featured
// @access  Admin
exports.adminToggleFeatured = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');

    product.isFeatured = !product.isFeatured;
    await product.save();

    sendSuccess(res, 200, `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`, product);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: create product (published immediately)
// @route   POST /api/admin/products
// @access  Admin
exports.adminCreateProduct = async (req, res, next) => {
  try {
    const { vendor: vendorId, ...rest } = req.body;
    if (!vendorId) return sendError(res, 400, 'Vendor is required');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return sendError(res, 404, 'Vendor not found');

    const product = await Product.create({
      ...rest,
      vendor: vendorId,
      status: rest.status || 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    await Vendor.findByIdAndUpdate(vendorId, { $inc: { totalProducts: 1 } });
    sendSuccess(res, 201, 'Product published', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: update any product
// @route   PUT /api/admin/products/:id
// @access  Admin
exports.adminUpdateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return sendError(res, 404, 'Product not found');
    sendSuccess(res, 200, 'Product updated', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images (admin — no vendor check)
// @route   POST /api/admin/products/:id/images
// @access  Admin
exports.adminUploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    if (!req.files || req.files.length === 0) return sendError(res, 400, 'No images uploaded');

    const newImages = req.files.map((file, idx) => ({
      url: getFileUrl(file),
      publicId: file.filename || file.public_id || '',
      alt: product.title,
      isPrimary: product.images.length === 0 && idx === 0,
      sortOrder: product.images.length + idx,
    })).filter((img) => img.url);

    product.images.push(...newImages);
    await product.save();
    sendSuccess(res, 200, 'Images uploaded', product.images);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload single cert image (admin)
// @route   POST /api/admin/upload/cert-image
// @access  Admin
exports.adminUploadCertImage = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return sendError(res, 400, 'No file uploaded');
    const url = getFileUrl(file);
    if (!url) return sendError(res, 500, 'Upload failed — could not get file URL');
    sendSuccess(res, 200, 'Uploaded', { url });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload package images (admin)
// @route   POST /api/admin/upload/package-images
// @access  Admin
exports.adminUploadPackageImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    const urls = files.map((f) => getFileUrl(f)).filter(Boolean);
    if (files.length > 0 && urls.length === 0) return sendError(res, 500, 'Upload failed — could not get file URLs');
    sendSuccess(res, 200, 'Uploaded', urls);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload promo banner image (admin)
// @route   POST /api/admin/upload/promo-banner
// @access  Admin
exports.adminUploadPromoBanner = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return sendError(res, 400, 'No file uploaded');
    const url = getFileUrl(file);
    if (!url) return sendError(res, 500, 'Upload failed — could not get file URL');
    sendSuccess(res, 200, 'Uploaded', { url });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's products
// @route   GET /api/vendor/products
// @access  Vendor
exports.vendorGetProducts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 403, 'Vendor profile not found');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { vendor: vendor._id };
    if (req.query.status) filter.status = req.query.status;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    sendPaginated(res, products, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Vendor
exports.uploadProductImages = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 403, 'Vendor profile not found');

    const product = await Product.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!product) return sendError(res, 404, 'Product not found');

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No images uploaded');
    }

    const newImages = req.files.map((file, idx) => ({
      url: getFileUrl(file),
      publicId: file.filename || file.public_id || '',
      alt: product.title,
      isPrimary: product.images.length === 0 && idx === 0,
      sortOrder: product.images.length + idx,
    })).filter((img) => img.url);

    product.images.push(...newImages);
    await product.save();

    sendSuccess(res, 200, 'Images uploaded', product.images);
  } catch (error) {
    next(error);
  }
};
