const Product = require('../models/Product');
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

// @desc    Upload product videos (admin)
// @route   POST /api/admin/products/:id/videos
// @access  Admin
exports.adminUploadProductVideos = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    if (!req.files || req.files.length === 0) return sendError(res, 400, 'No videos uploaded');

    if (!product.videos) product.videos = [];
    const newVideos = req.files.map((file, idx) => ({
      url: getFileUrl(file),
      publicId: file.filename || file.public_id || '',
      sortOrder: product.videos.length + idx,
    })).filter((v) => v.url);

    product.videos.push(...newVideos);
    await product.save();
    sendSuccess(res, 200, 'Videos uploaded', product.videos);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product video (admin)
// @route   DELETE /api/admin/products/:id/videos/:videoIndex
// @access  Admin
exports.adminRemoveProductVideo = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');

    const idx = parseInt(req.params.videoIndex);
    if (isNaN(idx) || idx < 0 || !product.videos || idx >= product.videos.length) {
      return sendError(res, 400, 'Invalid video index');
    }

    product.videos.splice(idx, 1);
    await product.save();
    sendSuccess(res, 200, 'Video removed', product.videos);
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
      .skip(skip)
      .limit(limit)
      .sort('-createdAt')
      .select('title sku price stock status category isFeatured isBestSeller isNewArrival isLifestyle1 isLifestyle2 createdAt images rating');

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
    const product = await Product.create({
      ...req.body,
      status: req.body.status || 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });
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

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Admin
exports.uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
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

// @desc    Admin: bulk delete products
// @route   DELETE /api/admin/products/bulk
// @access  Admin
exports.adminBulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return sendError(res, 400, 'No product IDs provided');
    const result = await Product.deleteMany({ _id: { $in: ids } });
    sendSuccess(res, 200, `${result.deletedCount} products deleted permanently`, { deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: bulk archive products
// @route   PUT /api/admin/products/bulk-archive
// @access  Admin
exports.adminBulkArchiveProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return sendError(res, 400, 'No product IDs provided');
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { status: 'archived', isActive: false } });
    sendSuccess(res, 200, `${result.modifiedCount} products archived`, { modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: bulk upload products via CSV / Excel (SSE streaming)
// @route   POST /api/admin/products/bulk-upload
// @access  Admin
exports.adminBulkUploadProducts = async (req, res, next) => {
  try {
    const XLSX = require('xlsx');

    if (!req.file) return sendError(res, 400, 'No file uploaded');

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows.length) return sendError(res, 400, 'File is empty or has no data rows');

    // Build category lookup map (by name and slug, case-insensitive)
    const categories = await Category.find({}, 'name slug _id').lean();
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name.toLowerCase().trim()] = c._id;
      catMap[c.slug.toLowerCase().trim()] = c._id;
    });

    // Switch to SSE — all validation passed, stream row-by-row progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    emit({ type: 'start', total: rows.length });

    // Parsing helpers
    const str  = (v) => String(v == null ? '' : v).trim();
    const num  = (v) => { const n = parseFloat(v); return isNaN(n) ? undefined : n; };
    const int  = (v) => { const n = parseInt(v);   return isNaN(n) ? undefined : n; };
    const bool = (v) => { const s = str(v).toLowerCase(); return ['true','yes','1'].includes(s) ? true : ['false','no','0'].includes(s) ? false : undefined; };
    const arr  = (v) => str(v) ? str(v).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const pick = (row, ...keys) => { for (const k of keys) { if (row[k] !== undefined && row[k] !== '') return row[k]; } return ''; };

    let successCount = 0, failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // ── Required ──────────────────────────────────────
        const title       = str(pick(row, 'title', 'Title'));
        const price       = parseFloat(pick(row, 'price', 'Price') || 0);
        const categoryRaw = str(pick(row, 'category', 'Category'));

        if (!title)             throw new Error('title is required');
        if (!price || price<=0) throw new Error('price must be a positive number');
        if (!categoryRaw)       throw new Error('category is required');

        const categoryId = catMap[categoryRaw.toLowerCase()];
        if (!categoryId) throw new Error(`Category "${categoryRaw}" not found — check spelling`);

        const rawStatus = str(pick(row, 'status')).toLowerCase();
        const status = ['approved','draft','pending','archived'].includes(rawStatus) ? rawStatus : 'approved';

        const data = {
          title, price, category: categoryId, stock: 0, status,
          approvedBy: req.user.id, approvedAt: new Date(),
        };

        // ── Core scalar fields ─────────────────────────────
        const sku = str(pick(row, 'sku', 'SKU'));               if (sku)                         data.sku               = sku;
        const cp  = num(pick(row, 'comparePrice', 'compare_price')); if (cp != null)             data.comparePrice      = cp;
        const cst = num(pick(row, 'costPrice', 'cost_price'));       if (cst != null)             data.costPrice         = cst;
        const disc= num(pick(row, 'discount'));                      if (disc != null)            data.discount          = disc;
        const stk = int(pick(row, 'stock', 'Stock'));                if (stk != null)             data.stock             = stk;
        const lst = int(pick(row, 'lowStockThreshold', 'low_stock_threshold')); if (lst != null) data.lowStockThreshold = lst;
        const wt  = num(pick(row, 'weight', 'Weight'));              if (wt != null)              data.weight            = wt;
        const sd  = num(pick(row, 'shippingDays', 'shipping_days')); if (sd != null)              data.shippingDays      = sd;
        const fs  = bool(pick(row, 'freeShipping', 'free_shipping')); if (fs !== undefined)       data.freeShipping      = fs;

        const shortDesc   = str(pick(row, 'shortDescription', 'short_description')); if (shortDesc)   data.shortDescription = shortDesc;
        const description = str(pick(row, 'description', 'Description'));             if (description) data.description      = description;

        // ── Visibility flags ───────────────────────────────
        const isFeat = bool(pick(row, 'isFeatured',   'is_featured'));   if (isFeat !== undefined)  data.isFeatured   = isFeat;
        const isNA   = bool(pick(row, 'isNewArrival', 'is_new_arrival')); if (isNA !== undefined)   data.isNewArrival  = isNA;
        const isBS   = bool(pick(row, 'isBestSeller', 'is_best_seller')); if (isBS !== undefined)   data.isBestSeller  = isBS;

        // ── Images (image1 … image5 — each a full URL) ────
        const imageUrls = [];
        for (let n = 1; n <= 5; n++) {
          const u = str(pick(row, `image${n}`, `Image${n}`, `IMAGE${n}`));
          if (u && /^https?:\/\/.+/.test(u)) imageUrls.push(u);
        }
        if (imageUrls.length) {
          data.images = imageUrls.map((url, idx) => ({
            url, publicId: '', alt: title, isPrimary: idx === 0, sortOrder: idx,
          }));
        }

        // ── Merchandising tag arrays (comma-separated) ─────
        const segs  = arr(pick(row, 'segments'));                              if (segs.length)  data.segments        = segs;
        const occ   = arr(pick(row, 'occasions'));                             if (occ.length)   data.occasions       = occ;
        const cols  = arr(pick(row, 'collectionStyles', 'collection_styles')); if (cols.length)  data.collectionStyles = cols;
        const thm   = arr(pick(row, 'themes'));                                if (thm.length)   data.themes          = thm;
        const pp    = arr(pick(row, 'productPersonas', 'product_personas'));   if (pp.length)    data.productPersonas = pp;
        const wt2   = arr(pick(row, 'wearingTypes', 'wearing_types'));         if (wt2.length)   data.wearingTypes    = wt2;
        const gt    = arr(pick(row, 'giftTags', 'gift_tags'));                 if (gt.length)    data.giftTags        = gt;

        // ── Dimensions ─────────────────────────────────────
        const dL = num(pick(row, 'dimensionLength', 'dimension_length'));
        const dW = num(pick(row, 'dimensionWidth',  'dimension_width'));
        const dH = num(pick(row, 'dimensionHeight', 'dimension_height'));
        const dU = str(pick(row, 'dimensionUnit',   'dimension_unit'));
        if (dL != null || dW != null || dH != null) {
          data.dimensions = {};
          if (dL != null) data.dimensions.length = dL;
          if (dW != null) data.dimensions.width  = dW;
          if (dH != null) data.dimensions.height = dH;
          if (['mm','cm','inch'].includes(dU)) data.dimensions.unit = dU;
        }

        // ── SEO ────────────────────────────────────────────
        const seoTitle = str(pick(row, 'seoTitle', 'seo_title'));
        const seoDesc  = str(pick(row, 'seoDescription', 'seo_description'));
        const seoKeys  = arr(pick(row, 'seoKeywords', 'seo_keywords'));
        if (seoTitle || seoDesc || seoKeys.length) {
          data.seo = {};
          if (seoTitle)       data.seo.metaTitle       = seoTitle;
          if (seoDesc)        data.seo.metaDescription = seoDesc;
          if (seoKeys.length) data.seo.metaKeywords    = seoKeys;
        }

        // ── Price breakup ──────────────────────────────────
        const pb = {
          metalType:            str(pick(row, 'metalType',         'metal_type')),
          grossWeight:          num(pick(row, 'grossWeight',        'gross_weight')),
          netWeight:            num(pick(row, 'netWeight',          'net_weight')),
          metalRate:            num(pick(row, 'metalRate',          'metal_rate')),
          metalAmount:          num(pick(row, 'metalAmount',        'metal_amount')),
          diamondPieces:        int(pick(row, 'diamondPieces',      'diamond_pieces')),
          diamondCarat:         num(pick(row, 'diamondCarat',       'diamond_carat')),
          diamondClarity:       str(pick(row, 'diamondClarity',     'diamond_clarity')),
          diamondCut:           str(pick(row, 'diamondCut',         'diamond_cut')),
          diamondColor:         str(pick(row, 'diamondColor',       'diamond_color')),
          diamondAmount:        num(pick(row, 'diamondAmount',      'diamond_amount')),
          makingCharges:        num(pick(row, 'makingCharges',      'making_charges')),
          gstPct:               num(pick(row, 'gstPct',             'gst_pct')),
        };
        const pbClean = Object.fromEntries(Object.entries(pb).filter(([, v]) => v !== undefined && v !== ''));
        if (Object.keys(pbClean).length) data.priceBreakup = pbClean;

        // ── Certification ──────────────────────────────────
        const certLab    = str(pick(row, 'certLab',    'cert_lab'));
        const certNumber = str(pick(row, 'certNumber', 'cert_number'));
        const certImage  = str(pick(row, 'certImage',  'cert_image'));
        if (certLab || certNumber) {
          data.certifications = [{ lab: certLab, certNumber, certImage }];
        }

        const product = await Product.create(data);
        successCount++;
        emit({ type: 'row', done: i + 1, total: rows.length, row: { rowNum, title, status: 'success', id: String(product._id) } });
      } catch (err) {
        const title = str(pick(row, 'title', 'Title')) || `Row ${rowNum}`;
        failCount++;
        let errMsg = err.message;
        if (err.code === 11000) {
          const field = Object.keys(err.keyPattern || {})[0] || 'field';
          const value = err.keyValue ? err.keyValue[field] : null;
          errMsg = value
            ? `Duplicate ${field}: "${value}" already exists in the database`
            : `Duplicate ${field} — already exists in the database`;
        }
        emit({ type: 'row', done: i + 1, total: rows.length, row: { rowNum, title, status: 'error', error: errMsg } });
      }
    }

    emit({ type: 'done', successCount, failCount, total: rows.length });
    res.end();
  } catch (error) {
    if (!res.headersSent) return next(error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
};
