const Coupon = require('../models/Coupon');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

async function validateCoupon(code, userId, subtotal, storeId = null) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) return { valid: false, message: 'Invalid coupon code' };

  const now = Date.now();
  if (coupon.startDate && coupon.startDate > now) return { valid: false, message: 'Coupon not yet active' };
  if (coupon.endDate && coupon.endDate < now) return { valid: false, message: 'Coupon expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (subtotal < coupon.minOrderAmount) return { valid: false, message: `Minimum order ₹${coupon.minOrderAmount} required` };
  if (coupon.store && storeId && coupon.store.toString() !== storeId.toString()) {
    return { valid: false, message: 'Coupon not valid for this shop' };
  }
  if (coupon.perUserLimit && coupon.usedBy?.filter((u) => u.toString() === userId).length >= coupon.perUserLimit) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  } else if (coupon.type === 'free_shipping') {
    discount = 0;
  }
  discount = Math.min(discount, subtotal);

  return { valid: true, coupon, discount };
}

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, storeId } = req.body;
    const result = await validateCoupon(code, req.user.id, subtotal || 0, storeId);
    if (!result.valid) return sendError(res, 400, result.message);
    sendSuccess(res, 200, 'Coupon valid', { discount: result.discount, coupon: result.coupon });
  } catch (error) {
    next(error);
  }
};

exports.adminGetCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.store) filter.store = req.query.store;
    if (req.query.scope === 'platform') filter.store = null;

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('store', 'name');
    sendPaginated(res, coupons, page, limit, total);
  } catch (error) {
    next(error);
  }
};

exports.adminCreateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase(), createdBy: req.user.id });
    sendSuccess(res, 201, 'Coupon created', coupon);
  } catch (error) {
    next(error);
  }
};

exports.adminUpdateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return sendError(res, 404, 'Coupon not found');
    sendSuccess(res, 200, 'Coupon updated', coupon);
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
};

exports.vendorGetCoupons = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    const coupons = await Coupon.find({ store: store._id }).sort('-createdAt');
    sendSuccess(res, 200, 'Coupons fetched', { coupons });
  } catch (error) {
    next(error);
  }
};

exports.vendorCreateCoupon = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      store: store._id,
      createdBy: req.user.id,
    });
    sendSuccess(res, 201, 'Coupon created', coupon);
  } catch (error) {
    next(error);
  }
};

exports.vendorDeleteCoupon = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ vendor: req.user.id });
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, store: store._id });
    if (!coupon) return sendError(res, 404, 'Coupon not found');
    sendSuccess(res, 200, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
};

module.exports.validateCouponHelper = validateCoupon;
