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

    // Featured / BestSeller / NewArrival / Lifestyle flags
    if (req.query.isFeatured === 'true')   baseQuery = baseQuery.where('isFeatured').equals(true);
    if (req.query.isBestSeller === 'true') baseQuery = baseQuery.where('isBestSeller').equals(true);
    if (req.query.isNewArrival === 'true') baseQuery = baseQuery.where('isNewArrival').equals(true);
    if (req.query.isLifestyle1 === 'true') baseQuery = baseQuery.where('isLifestyle1').equals(true);
    if (req.query.isLifestyle2 === 'true') baseQuery = baseQuery.where('isLifestyle2').equals(true);

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

    // Themes filter (diamond shape: Oval, Round, Princess …)
    if (req.query.themes) {
      const themes = Array.isArray(req.query.themes) ? req.query.themes : [req.query.themes];
      baseQuery = baseQuery.where('themes').in(themes);
    }

    // CollectionStyles filter (Solitaire, Halo, Eternity …)
    if (req.query.collectionStyles) {
      const cs = Array.isArray(req.query.collectionStyles) ? req.query.collectionStyles : [req.query.collectionStyles];
      baseQuery = baseQuery.where('collectionStyles').in(cs);
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

// @desc    Admin: hard delete a product
// @route   DELETE /api/admin/products/:id
// @access  Admin
exports.adminDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    sendSuccess(res, 200, 'Product permanently deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: remove a single product image by index
// @route   DELETE /api/admin/products/:id/images/:imageIndex
// @access  Admin
exports.adminRemoveProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');

    const idx = parseInt(req.params.imageIndex);
    if (isNaN(idx) || idx < 0 || idx >= product.images.length) {
      return sendError(res, 400, 'Invalid image index');
    }

    product.images.splice(idx, 1);
    // Ensure the first image is always marked as primary
    if (product.images.length > 0) {
      product.images[0].isPrimary = true;
      product.images[0].sortOrder = 0;
      if (product.images[1]) {
        product.images[1].isPrimary = false;
        product.images[1].sortOrder = 1;
      }
    }
    await product.save();

    sendSuccess(res, 200, 'Image removed', product.images);
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
      .select('title sku price stock status vendor category isFeatured isBestSeller isNewArrival isLifestyle1 isLifestyle2 createdAt images rating');

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

exports.adminToggleLifestyle1 = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    // Enforce max 4
    if (!product.isLifestyle1) {
      const count = await Product.countDocuments({ isLifestyle1: true });
      if (count >= 4) return sendError(res, 400, 'Panel 1 already has 4 products. Remove one first.');
    }
    product.isLifestyle1 = !product.isLifestyle1;
    await product.save();
    sendSuccess(res, 200, `Panel 1 updated`, product);
  } catch (error) { next(error); }
};

exports.adminToggleLifestyle2 = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    if (!product.isLifestyle2) {
      const count = await Product.countDocuments({ isLifestyle2: true });
      if (count >= 4) return sendError(res, 400, 'Panel 2 already has 4 products. Remove one first.');
    }
    product.isLifestyle2 = !product.isLifestyle2;
    await product.save();
    sendSuccess(res, 200, `Panel 2 updated`, product);
  } catch (error) { next(error); }
};

exports.adminToggleBestSeller = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    product.isBestSeller = !product.isBestSeller;
    await product.save();
    sendSuccess(res, 200, `Product ${product.isBestSeller ? 'marked as best seller' : 'removed from best sellers'}`, product);
  } catch (error) { next(error); }
};

exports.adminToggleNewArrival = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    product.isNewArrival = !product.isNewArrival;
    await product.save();
    sendSuccess(res, 200, `Product ${product.isNewArrival ? 'marked as new arrival' : 'removed from new arrivals'}`, product);
  } catch (error) { next(error); }
};

// @desc    Admin: get single product by ID (for edit form)
// @route   GET /api/admin/products/:id
// @access  Admin
exports.adminGetProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('vendor', 'storeName')
      .populate('attributes.attribute', 'name slug');
    if (!product) return sendError(res, 404, 'Product not found');
    sendSuccess(res, 200, 'Product fetched', product);
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

// @desc    Upload a named site image (overwrites fixed filename in /uploads)
// @route   POST /api/admin/upload/site-image
// @access  Admin
exports.adminUploadSiteImage = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return sendError(res, 400, 'No file uploaded');

    // key = stable identifier e.g. 'lifestyle-bridal', 'promo-ring'
    const key = (req.query.key || req.body.key || '').replace(/[^a-z0-9\-]/gi, '');
    if (!key) return sendError(res, 400, 'Missing key parameter');

    const { getFileUrl } = require('../config/cloudinary');
    const url = getFileUrl(file);
    if (!url) return sendError(res, 500, 'Upload failed — could not get file URL');

    // Persist URL in Settings so frontend can retrieve it
    const Settings = require('../models/Settings');
    await Settings.findOneAndUpdate(
      { group: 'siteImages' },
      { $set: { [`data.${key}`]: url } },
      { upsert: true, new: true }
    );

    sendSuccess(res, 200, 'Site image updated', { url });
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
