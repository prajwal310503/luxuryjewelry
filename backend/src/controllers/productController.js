const Product = require('../models/Product');
const Category = require('../models/Category');
const Store = require('../models/Store');
const APIFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getFileUrl, cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Upload an external image/video URL to Cloudinary; falls back to the converted URL on any error
async function uploadExternalUrl(rawUrl, resourceType = 'image') {
  // Normalise Google Drive sharing URLs to a direct-download URL
  const m = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^?]*id=)([a-zA-Z0-9_-]+)/);
  const url = m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : rawUrl;

  if (!isCloudinaryConfigured()) return url;

  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: resourceType === 'video' ? 'luxury_jewelry/videos' : 'luxury_jewelry/products',
      resource_type: resourceType,
      ...(resourceType === 'image'
        ? { transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }] }
        : {}),
    });
    return result.secure_url;
  } catch (_) {
    return url; // if Cloudinary upload fails, store the direct URL as-is
  }
}

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

    // Attribute filters (dynamic) — apply to attributes[] OR mapped product fields
    const Attribute = require('../models/Attribute');
    const AttributeValue = require('../models/AttributeValue');
    const mongoose = require('mongoose');
    const FIELD_MAP = {
      'metal-purity': 'purity',
      'collection-style': 'collectionStyles',
      theme: 'themes',
      occasion: 'occasions',
      segments: 'segments',
      'gift-tags': 'giftTags',
      'wearing-type': 'wearingTypes',
      'product-persona': 'productPersonas',
    };

    const attributeKeys = Object.keys(req.query).filter((k) => k.startsWith('attr_'));
    for (const key of attributeKeys) {
      const attrSlug = key.replace('attr_', '');
      let raw = req.query[key];
      if (raw === undefined || raw === null || raw === '') continue;
      if (!Array.isArray(raw)) raw = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      if (!raw.length) continue;

      const attr = await Attribute.findOne({ slug: attrSlug }).select('_id slug');
      if (!attr) {
        // Unknown attribute slug → no matches
        baseQuery = baseQuery.where('_id').equals(new mongoose.Types.ObjectId('000000000000000000000000'));
        continue;
      }

      const objectIds = raw.filter((v) => mongoose.Types.ObjectId.isValid(v) && String(v).length === 24);
      const valueDocs = await AttributeValue.find({
        attribute: attr._id,
        $or: [
          ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
          { slug: { $in: raw } },
          { value: { $in: raw } },
        ],
      }).select('_id value slug');

      // Client sent filter values that don't belong to this attribute → empty result
      if (!valueDocs.length) {
        baseQuery = baseQuery.where('_id').equals(new mongoose.Types.ObjectId('000000000000000000000000'));
        continue;
      }

      const valueIds = valueDocs.map((v) => v._id);
      const valueLabels = valueDocs.map((v) => v.value).filter(Boolean);
      const orClauses = [
        {
          attributes: {
            $elemMatch: {
              attribute: attr._id,
              values: { $in: valueIds },
            },
          },
        },
      ];

      // Fallback: map common jewelry attrs to denormalized product fields
      const field = FIELD_MAP[attrSlug];
      if (field && valueLabels.length) {
        if (field === 'purity') {
          const purityRegexes = valueLabels.map((label) => {
            const digits = String(label).replace(/[^0-9]/g, '');
            if (digits) return new RegExp(digits, 'i');
            return new RegExp(`^${String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          });
          orClauses.push({ $or: purityRegexes.map((re) => ({ purity: re })) });
        } else {
          orClauses.push({ [field]: { $in: valueLabels } });
        }
      }

      // Metal color: match pricing.metalType or title text
      if (attrSlug === 'metal-color' && valueLabels.length) {
        orClauses.push({
          $or: valueLabels.flatMap((label) => {
            const safe = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return [
              { 'pricing.metalType': new RegExp(safe, 'i') },
              { title: new RegExp(safe, 'i') },
            ];
          }),
        });
      }

      baseQuery = baseQuery.find(orClauses.length === 1 ? orClauses[0] : { $or: orClauses });
    }

    // Store / vendor filter
    if (req.query.store) {
      const storeDoc = await Store.findOne({ slug: req.query.store });
      if (storeDoc) baseQuery = baseQuery.where('store').equals(storeDoc._id);
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
      .populate('store', 'name slug logo rating')
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
    const mongoose = require('mongoose');
    const slug = req.params.slug;
    const filter = { status: 'approved', isActive: true };
    let product = await Product.findOne({ ...filter, slug })
      .populate('category', 'name slug ancestors')
      .populate('subcategory', 'name slug')
      .populate('store', 'name slug logo rating phone city description')
      .populate('attributes.attribute', 'name slug type displayType')
      .populate('attributes.values', 'value slug colorCode image');

    // Fallback: allow /products/:id when slug missing / link used _id
    if (!product && mongoose.Types.ObjectId.isValid(slug)) {
      product = await Product.findOne({ ...filter, _id: slug })
        .populate('category', 'name slug ancestors')
        .populate('subcategory', 'name slug')
        .populate('store', 'name slug logo rating phone city description')
        .populate('attributes.attribute', 'name slug type displayType')
        .populate('attributes.values', 'value slug colorCode image');
    }

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
  return sendError(res, 403, 'Admin cannot change product images. Ask the vendor to update images.');
};

// @desc    Upload product videos (admin)
// @route   POST /api/admin/products/:id/videos
// @access  Admin
exports.adminUploadProductVideos = async (req, res, next) => {
  return sendError(res, 403, 'Admin cannot change product media. Ask the vendor to update videos.');
};

// @desc    Remove product video (admin)
// @route   DELETE /api/admin/products/:id/videos/:videoIndex
// @access  Admin
exports.adminRemoveProductVideo = async (req, res, next) => {
  return sendError(res, 403, 'Admin cannot change product media. Ask the vendor to update videos.');
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
      .populate('attributes.attribute', 'name slug type displayType')
      .populate('attributes.values', 'value slug colorCode image');
    if (!product) return sendError(res, 404, 'Product not found');
    sendSuccess(res, 200, 'Product fetched', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin cannot create products — vendors only (marketplace rule)
// @route   POST /api/admin/products
// @access  Admin
exports.adminCreateProduct = async (req, res) => {
  return sendError(
    res,
    403,
    'Admins cannot upload products. Only vendors can add products — approve them from the Products list after review.'
  );
};

// @desc    Admin: update any product
// @route   PUT /api/admin/products/:id
// @access  Admin
exports.adminUpdateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    const body = { ...req.body };
    if (body.attributes !== undefined) {
      const attrs = Array.isArray(body.attributes) ? body.attributes : [];
      body.attributes = attrs
        .map((a) => {
          if (!a?.attribute) return null;
          const values = Array.isArray(a.values)
            ? a.values.map((v) => (v && (v._id || v))).filter(Boolean)
            : [];
          const customValue = a.customValue ? String(a.customValue).trim() : '';
          if (!values.length && !customValue) return null;
          return {
            attribute: a.attribute._id || a.attribute,
            values,
            ...(customValue ? { customValue } : {}),
          };
        })
        .filter(Boolean);
    }
    Object.assign(product, body);
    await product.save();
    sendSuccess(res, 200, 'Product updated', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product images (admin — no vendor check)
// @route   POST /api/admin/products/:id/images
// @access  Admin
exports.adminUploadProductImages = async (req, res, next) => {
  return sendError(res, 403, 'Admin cannot change product images. Ask the vendor to update images.');
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

// @desc    Admin: bulk create products from CSV/Excel
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

    const categories = await Category.find({}, 'name slug _id').lean();
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name.toLowerCase().trim()] = c._id;
      catMap[c.slug.toLowerCase().trim()] = c._id;
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    emit({ type: 'start', total: rows.length });

    const str  = (v) => String(v == null ? '' : v).trim();
    const num  = (v) => { const n = parseFloat(v); return Number.isNaN(n) ? undefined : n; };
    const int  = (v) => { const n = parseInt(v, 10); return Number.isNaN(n) ? undefined : n; };
    const bool = (v) => {
      const s = str(v).toLowerCase();
      if (['true', 'yes', '1'].includes(s)) return true;
      if (['false', 'no', '0'].includes(s)) return false;
      return undefined;
    };
    const arr  = (v) => (str(v) ? str(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
    const pick = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return row[k];
      }
      return '';
    };

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const title = str(pick(row, 'title', 'Title'));
        const price = parseFloat(pick(row, 'price', 'Price') || 0);
        const categoryRaw = str(pick(row, 'category', 'Category'));

        if (!title) throw new Error('title is required');
        if (!price || price <= 0) throw new Error('price must be a positive number');
        if (!categoryRaw) throw new Error('category is required');

        const categoryId = catMap[categoryRaw.toLowerCase()];
        if (!categoryId) throw new Error(`Category "${categoryRaw}" not found — check spelling`);

        const rawStatus = str(pick(row, 'status')).toLowerCase();
        const status = ['approved', 'draft', 'pending', 'archived'].includes(rawStatus) ? rawStatus : 'approved';

        const data = {
          title,
          price,
          category: categoryId,
          stock: 0,
          status,
          isActive: status === 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date(),
        };

        const sku = str(pick(row, 'sku', 'SKU'));
        const shortDesc = str(pick(row, 'shortDescription', 'short_description'));
        const desc = str(pick(row, 'description', 'Description'));
        if (sku) data.sku = sku;
        if (shortDesc) data.shortDescription = shortDesc;
        if (desc) data.description = desc;

        const subRaw = str(pick(row, 'subcategory', 'Subcategory'));
        if (subRaw) {
          const subId = catMap[subRaw.toLowerCase()];
          if (subId) data.subcategory = subId;
        }

        const cst = num(pick(row, 'costPrice', 'cost_price'));
        if (cst != null) data.costPrice = cst;
        const disc = num(pick(row, 'discount'));
        if (disc != null) data.discount = disc;
        const stk = int(pick(row, 'stock', 'Stock'));
        if (stk != null) data.stock = stk;

        const purity = str(pick(row, 'purity'));
        data.purity = purity || '22kt';
        const mw = num(pick(row, 'metalWeight', 'metal_weight'));
        if (mw != null) data.metalWeight = mw;
        const dd = int(pick(row, 'deliveryDays', 'delivery_days'));
        if (dd != null) data.deliveryDays = dd;

        const dc = str(pick(row, 'diamondClarity', 'diamond_clarity'));
        if (dc) data.diamondClarity = dc;

        const sc = arr(pick(row, 'stoneColors', 'stone_colors'));
        if (sc.length) data.stoneColors = sc;

        const sizesEn = bool(pick(row, 'sizesEnabled', 'sizes_enabled'));
        const sizesAv = arr(pick(row, 'sizesAvailable', 'sizes_available')).map(Number).filter((n) => !Number.isNaN(n));
        if (sizesEn !== undefined || sizesAv.length) {
          data.sizes = { enabled: sizesEn || false, available: sizesAv };
        }

        const lenEn = bool(pick(row, 'lengthEnabled', 'length_enabled'));
        const lenAv = arr(pick(row, 'lengthAvailable', 'length_available')).map(Number).filter((n) => !Number.isNaN(n));
        if (lenEn !== undefined || lenAv.length) {
          data.lengths = { enabled: lenEn || false, available: lenAv };
        }

        const rawImageUrls = [];
        for (let n = 1; n <= 4; n++) {
          const u = str(pick(row, `image${n}`, `Image${n}`));
          if (u && /^https?:\/\/.+/.test(u)) rawImageUrls.push(u);
        }
        if (rawImageUrls.length) {
          const uploadedImages = await Promise.all(rawImageUrls.map((u) => uploadExternalUrl(u, 'image')));
          data.images = uploadedImages.map((url, idx) => ({
            url, publicId: '', alt: title, isPrimary: idx === 0, sortOrder: idx,
          }));
        }

        const rawVideoUrls = [];
        for (let n = 1; n <= 2; n++) {
          const u = str(pick(row, `video${n}`, `Video${n}`));
          if (u && /^https?:\/\/.+/.test(u)) rawVideoUrls.push(u);
        }
        if (rawVideoUrls.length) {
          const uploadedVideos = await Promise.all(rawVideoUrls.map((u) => uploadExternalUrl(u, 'video')));
          data.videos = uploadedVideos.map((url, idx) => ({ url, publicId: '', sortOrder: idx }));
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

// @desc    Apply jewelry field defaults to all existing products
// @route   POST /api/admin/products/set-jewelry-defaults
// @access  Admin
exports.adminSetJewelryDefaults = async (req, res, next) => {
  try {
    const result = await Product.updateMany(
      {},
      {
        $set: {
          purity: '22kt',
        },
        $setOnInsert: {},
      }
    );
    // Only set array fields / nested objects when they are missing (avoid overwriting existing data)
    await Product.updateMany(
      { 'sizes.enabled': { $exists: false } },
      { $set: { 'sizes.enabled': false, 'sizes.available': [] } }
    );
    await Product.updateMany(
      { 'lengths.enabled': { $exists: false } },
      { $set: { 'lengths.enabled': false, 'lengths.available': [] } }
    );
    await Product.updateMany(
      { stoneColors: { $exists: false } },
      { $set: { stoneColors: [] } }
    );
    sendSuccess(res, 200, `Jewelry defaults applied to ${result.modifiedCount} products`);
  } catch (error) {
    next(error);
  }
};
