const Settings = require('../models/Settings');
const ReferralReward = require('../models/ReferralReward');
const ReferralPayout = require('../models/ReferralPayout');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { DEFAULT_SETTINGS, getReferralSettings } = require('../utils/referral');

exports.getAdminReferralSettings = async (req, res, next) => {
  try {
    const data = await getReferralSettings();
    sendSuccess(res, 200, 'Referral settings', data);
  } catch (error) {
    next(error);
  }
};

exports.updateAdminReferralSettings = async (req, res, next) => {
  try {
    const existing = await Settings.findOne({ group: 'referral' });
    const merged = { ...DEFAULT_SETTINGS, ...(existing?.data || {}) };

    const {
      defaultRewardAmount,
      minBankTransfer,
      returnPolicyDays,
      categoryRewards,
      productRewards,
    } = req.body;

    if (defaultRewardAmount != null) merged.defaultRewardAmount = Number(defaultRewardAmount);
    if (minBankTransfer != null) merged.minBankTransfer = Number(minBankTransfer);
    if (returnPolicyDays != null) merged.returnPolicyDays = Number(returnPolicyDays);
    if (Array.isArray(categoryRewards)) {
      merged.categoryRewards = categoryRewards
        .filter((r) => r.categoryId && Number(r.amount) > 0)
        .map((r) => ({ categoryId: String(r.categoryId), amount: Number(r.amount) }));
    }
    if (Array.isArray(productRewards)) {
      merged.productRewards = productRewards
        .filter((r) => r.productId && Number(r.amount) > 0)
        .map((r) => ({ productId: String(r.productId), amount: Number(r.amount) }));
    }

    const doc = await Settings.findOneAndUpdate(
      { group: 'referral' },
      { data: merged },
      { upsert: true, new: true }
    );

    sendSuccess(res, 200, 'Referral settings saved', doc.data);
  } catch (error) {
    next(error);
  }
};

exports.getAdminReferralRewards = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [rewards, total] = await Promise.all([
      ReferralReward.find(filter)
        .populate('referrer', 'name email referralCode')
        .populate('referredUser', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReferralReward.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Referral rewards', {
      rewards,
      meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminReferralPayouts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const payouts = await ReferralPayout.find(filter)
      .populate('user', 'name email phone referralCode referralBalance')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    sendSuccess(res, 200, 'Referral payouts', { payouts });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminReferralPayout = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['paid', 'rejected'].includes(status)) {
      return sendError(res, 400, 'Status must be paid or rejected');
    }

    const payout = await ReferralPayout.findById(req.params.id);
    if (!payout) return sendError(res, 404, 'Payout not found');
    if (payout.status !== 'pending') {
      return sendError(res, 400, 'Payout already processed');
    }

    payout.status = status;
    payout.adminNote = adminNote || '';
    payout.processedAt = new Date();
    payout.processedBy = req.user._id;
    await payout.save();

    if (status === 'rejected') {
      await User.findByIdAndUpdate(payout.user, { $inc: { referralBalance: payout.amount } });
    }

    sendSuccess(res, 200, `Payout marked as ${status}`, payout);
  } catch (error) {
    next(error);
  }
};
