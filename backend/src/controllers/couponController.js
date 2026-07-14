const Coupon = require('../models/Coupon');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCouponCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function generateGiftCode(length = 15) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

async function uniqueCode(kind) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = kind === 'gift_card' ? generateGiftCode(15) : generateCouponCode(6);
    const exists = await Coupon.exists({ code });
    if (!exists) return code;
  }
  throw new Error('Could not generate unique code');
}

function normalizeCartItems(cartItems = []) {
  return cartItems.map((item) => ({
    productId: String(item.productId || item.product || ''),
    categoryId: String(item.categoryId || item.category || ''),
    lineTotal: Number(item.lineTotal ?? item.subtotal ?? (item.price || 0) * (item.quantity || 1)),
    quantity: Number(item.quantity || 1),
  }));
}

function getEligibleSubtotal(coupon, cartItems, fallbackSubtotal) {
  const items = normalizeCartItems(cartItems);
  if (!items.length) return fallbackSubtotal;

  if (coupon.applicableProducts?.length) {
    const ids = coupon.applicableProducts.map(String);
    const eligible = items.filter((i) => ids.includes(i.productId));
    if (!eligible.length) return 0;
    return eligible.reduce((s, i) => s + i.lineTotal, 0);
  }

  if (coupon.couponKind === 'category' && coupon.applicableCategories?.length) {
    const ids = coupon.applicableCategories.map(String);
    const eligible = items.filter((i) => ids.includes(i.categoryId));
    if (!eligible.length) return 0;
    return eligible.reduce((s, i) => s + i.lineTotal, 0);
  }

  return items.reduce((s, i) => s + i.lineTotal, 0);
}

function computeDiscount(coupon, eligibleSubtotal) {
  if (eligibleSubtotal <= 0) return 0;

  // Gift cards always redeem flat balance (not % of order)
  if (coupon.couponKind === 'gift_card') {
    const available = Number(coupon.balance ?? coupon.value ?? 0);
    return Math.min(Math.round(available), Math.round(eligibleSubtotal));
  }

  if (coupon.type === 'percentage') {
    let discount = (eligibleSubtotal * coupon.value) / 100;
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    return Math.min(discount, eligibleSubtotal);
  }
  if (coupon.type === 'fixed') {
    return Math.min(coupon.value, eligibleSubtotal);
  }
  return 0;
}

async function validateCoupon(code, userId, subtotal, storeId = null, cartItems = []) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { valid: false, message: 'Enter a code' };

  const coupon = await Coupon.findOne({ code: normalized, isActive: true })
    .populate('applicableCategories', 'name slug')
    .populate('applicableProducts', 'title slug');
  if (!coupon) return { valid: false, message: 'Invalid code' };

  if (coupon.couponKind === 'gift_card') {
    if (!/^\d{15}$/.test(normalized)) {
      return { valid: false, message: 'Gift card must be 15 digits' };
    }
  } else if (!/^[A-Z0-9]{6}$/.test(normalized)) {
    return { valid: false, message: 'Coupon must be 6 characters' };
  }

  const now = Date.now();
  if (coupon.startDate && coupon.startDate > now) return { valid: false, message: 'Code not yet active' };
  if (coupon.endDate && coupon.endDate < now) return { valid: false, message: 'Code expired' };
  // Gift cards are balance-based — allow re-use until balance is exhausted
  if (coupon.couponKind !== 'gift_card') {
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Code usage limit reached' };
    }
    if (coupon.perUserLimit && coupon.usedBy?.filter((u) => u.toString() === userId).length >= coupon.perUserLimit) {
      return { valid: false, message: 'You have already used this code' };
    }
  }
  if (coupon.store && storeId && coupon.store.toString() !== storeId.toString()) {
    return { valid: false, message: 'Code not valid for this shop' };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { valid: false, message: `Minimum order ₹${coupon.minOrderAmount} required` };
  }

  const eligibleSubtotal = getEligibleSubtotal(coupon, cartItems, subtotal);
  if (coupon.couponKind === 'category' || coupon.applicableProducts?.length) {
    if (eligibleSubtotal <= 0) {
      return { valid: false, message: 'No eligible items in cart for this code' };
    }
  }

  if (coupon.couponKind === 'gift_card') {
    const bal = coupon.balance ?? coupon.value ?? 0;
    if (bal <= 0) return { valid: false, message: 'Gift card balance exhausted' };
  }

  const discount = computeDiscount(coupon, eligibleSubtotal);
  if (coupon.type !== 'free_shipping' && discount <= 0) {
    return { valid: false, message: 'Code cannot be applied to this order' };
  }

  return {
    valid: true,
    coupon,
    discount,
    eligibleSubtotal,
    isGiftCard: coupon.couponKind === 'gift_card',
  };
}

async function redeemCoupon(couponId, userId, discount) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  const amount = Math.max(0, Math.round(Number(discount) || 0));

  if (coupon.couponKind === 'gift_card') {
    const current = Number(coupon.balance ?? coupon.value ?? 0);
    await Coupon.findByIdAndUpdate(couponId, {
      $set: { balance: Math.max(0, current - amount) },
      $inc: { usedCount: 1 },
      $addToSet: { usedBy: userId },
    });
    return;
  }

  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { usedCount: 1 },
    $addToSet: { usedBy: userId },
  });
}

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, storeId, items } = req.body;
    const result = await validateCoupon(code, req.user.id, subtotal || 0, storeId, items);
    if (!result.valid) return sendError(res, 400, result.message);

    const c = result.coupon;
    sendSuccess(res, 200, 'Code applied', {
      discount: Math.round(result.discount),
      eligibleSubtotal: result.eligibleSubtotal,
      isGiftCard: result.isGiftCard,
      giftCardBalance: result.isGiftCard ? (c.balance ?? c.value ?? 0) : undefined,
      remainingBalance: result.isGiftCard
        ? Math.max(0, (c.balance ?? c.value ?? 0) - result.discount)
        : undefined,
      coupon: {
        _id: c._id,
        code: c.code,
        title: c.title,
        couponKind: c.couponKind,
        type: c.type,
        value: c.value,
        description: c.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    let coupons = await Coupon.find({
      isActive: true,
      showOnFrontend: true,
      couponKind: { $in: ['category', 'global'] },
    })
      .select('code title description couponKind type value minOrderAmount maxDiscountAmount applicableCategories applicableProducts usedCount usageLimit startDate endDate')
      .populate('applicableCategories', 'name slug')
      .populate('applicableProducts', 'title slug')
      .sort('-createdAt')
      .limit(50)
      .lean();

    coupons = coupons.filter((c) => {
      if (c.startDate && new Date(c.startDate) > now) return false;
      if (c.endDate && new Date(c.endDate) < now) return false;
      if (c.usageLimit && c.usedCount >= c.usageLimit) return false;
      return true;
    });

    sendSuccess(res, 200, 'Available offers', coupons);
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
    if (req.query.couponKind) filter.couponKind = req.query.couponKind;

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('store', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'title');
    sendPaginated(res, coupons, page, limit, total);
  } catch (error) {
    next(error);
  }
};

exports.adminCreateCoupon = async (req, res, next) => {
  try {
    const body = { ...req.body };
    const kind = body.couponKind || 'global';

    if (!body.code?.trim()) {
      body.code = await uniqueCode(kind);
    } else {
      body.code = body.code.trim().toUpperCase();
    }

    if (kind === 'gift_card') {
      if (!/^\d{15}$/.test(body.code)) {
        return sendError(res, 400, 'Gift card code must be 15 digits');
      }
      body.type = 'fixed';
      body.balance = Number(body.value);
      if (!body.balance || body.balance <= 0) {
        return sendError(res, 400, 'Gift card amount must be greater than 0');
      }
      // Balance-based: no one-shot usage caps
      body.showOnFrontend = false;
      body.perUserLimit = null;
      body.usageLimit = null;
    } else if (!/^[A-Z0-9]{6}$/.test(body.code)) {
      return sendError(res, 400, 'Coupon code must be 6 characters (A-Z, 0-9)');
    }

    if (kind === 'category' && !body.applicableCategories?.length && !body.applicableProducts?.length) {
      return sendError(res, 400, 'Category coupon requires at least one category or product');
    }

    const coupon = await Coupon.create({
      ...body,
      code: body.code,
      createdBy: req.user.id,
    });
    sendSuccess(res, 201, `${kind === 'gift_card' ? 'Gift card' : 'Coupon'} created`, coupon);
  } catch (error) {
    if (error.code === 11000) return sendError(res, 400, 'Code already exists');
    next(error);
  }
};

exports.adminUpdateCoupon = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.code) body.code = body.code.trim().toUpperCase();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!coupon) return sendError(res, 404, 'Coupon not found');
    sendSuccess(res, 200, 'Updated', coupon);
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, 'Deleted');
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
    const body = { ...req.body, store: store._id, createdBy: req.user.id };
    if (!body.code?.trim()) body.code = await uniqueCode(body.couponKind || 'global');
    body.code = body.code.trim().toUpperCase();
    const coupon = await Coupon.create(body);
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
module.exports.redeemCouponHelper = redeemCoupon;
module.exports.generateCouponCode = generateCouponCode;
module.exports.generateGiftCode = generateGiftCode;
