const crypto = require('crypto');
const User = require('../models/User');
const Settings = require('../models/Settings');
const ReferralReward = require('../models/ReferralReward');

const DEFAULT_SETTINGS = {
  defaultRewardAmount: 500,
  minBankTransfer: 1000,
  returnPolicyDays: 7,
  categoryRewards: [], // [{ categoryId, amount }]
  productRewards: [],  // [{ productId, amount }]
};

async function getReferralSettings() {
  const doc = await Settings.findOne({ group: 'referral' }).lean();
  return { ...DEFAULT_SETTINGS, ...(doc?.data || {}) };
}

function generateReferralCode(name = '') {
  const prefix = (name || 'VK')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'VK';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode(user.name);
    attempts += 1;
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ referralCode: code });
    if (!exists) break;
  } while (attempts < 8);
  user.referralCode = code;
  await user.save({ validateBeforeSave: false });
  return code;
}

function resolveRewardForOrder(order, settings) {
  const productMap = new Map(
    (settings.productRewards || []).map((r) => [String(r.productId), Number(r.amount)])
  );
  const categoryMap = new Map(
    (settings.categoryRewards || []).map((r) => [String(r.categoryId), Number(r.amount)])
  );

  let amount = 0;
  let source = 'default';

  for (const item of order.items || []) {
    const productId = item.product ? String(item.product) : null;
    const categoryId = item.categoryId ? String(item.categoryId) : null;

    if (productId && productMap.has(productId)) {
      const a = productMap.get(productId);
      if (a > amount) {
        amount = a;
        source = 'product';
      }
      continue;
    }
    if (categoryId && categoryMap.has(categoryId)) {
      const a = categoryMap.get(categoryId);
      if (a > amount) {
        amount = a;
        source = 'category';
      }
    }
  }

  if (amount <= 0) {
    amount = Number(settings.defaultRewardAmount) || 500;
    source = 'default';
  }

  return { amount, source };
}

/**
 * When a referred customer's order is delivered, create a pending reward for the referrer.
 * Reward becomes eligible after returnPolicyDays.
 */
async function createReferralRewardForDeliveredOrder(order) {
  if (!order?.customer || !order._id) return null;

  const customer = await User.findById(order.customer).select('referredBy');
  if (!customer?.referredBy) return null;

  const existing = await ReferralReward.findOne({ order: order._id });
  if (existing) return existing;

  const settings = await getReferralSettings();
  const { amount, source } = resolveRewardForOrder(order, settings);
  if (amount <= 0) return null;

  const days = Number(settings.returnPolicyDays) || 7;
  const eligibleAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return ReferralReward.create({
    referrer: customer.referredBy,
    referredUser: order.customer,
    order: order._id,
    orderNumber: order.orderNumber,
    amount,
    status: 'pending',
    eligibleAt,
    source,
  });
}

async function cancelReferralRewardForOrder(orderId, reason = 'Order returned/cancelled') {
  const reward = await ReferralReward.findOne({ order: orderId, status: { $in: ['pending', 'eligible'] } });
  if (!reward) return null;
  reward.status = 'cancelled';
  reward.cancelledAt = new Date();
  reward.cancelReason = reason;
  await reward.save();
  return reward;
}

/** Move pending → eligible when return window ends, then credit eligible into wallet */
async function refreshReferrerRewardStatuses(referrerId) {
  const now = new Date();
  await ReferralReward.updateMany(
    {
      referrer: referrerId,
      status: 'pending',
      eligibleAt: { $lte: now },
    },
    { $set: { status: 'eligible' } }
  );

  const eligible = await ReferralReward.find({
    referrer: referrerId,
    status: 'eligible',
  });

  if (!eligible.length) return 0;

  let total = 0;
  for (const reward of eligible) {
    total += Number(reward.amount) || 0;
    reward.status = 'credited';
    reward.creditedAt = now;
    // eslint-disable-next-line no-await-in-loop
    await reward.save();
  }

  if (total > 0) {
    await User.findByIdAndUpdate(referrerId, { $inc: { referralBalance: total } });
  }
  return total;
}

module.exports = {
  DEFAULT_SETTINGS,
  getReferralSettings,
  generateReferralCode,
  ensureReferralCode,
  resolveRewardForOrder,
  createReferralRewardForDeliveredOrder,
  cancelReferralRewardForOrder,
  refreshReferrerRewardStatuses,
};
