const crypto = require('crypto');
const User = require('../models/User');
const ReferralReward = require('../models/ReferralReward');
const ReferralPayout = require('../models/ReferralPayout');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const {
  ensureReferralCode,
  getReferralSettings,
  refreshReferrerRewardStatuses,
} = require('../utils/referral');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'Email already registered');
    }

    let referredBy = null;
    if (referralCode && String(referralCode).trim()) {
      const referrer = await User.findOne({
        referralCode: String(referralCode).trim().toUpperCase(),
        isActive: true,
      });
      if (!referrer) {
        return sendError(res, 400, 'Invalid referral code');
      }
      // Prevent self-referral if somehow same email (shouldn't happen at create)
      if (referrer.email === String(email).toLowerCase()) {
        return sendError(res, 400, 'You cannot use your own referral code');
      }
      referredBy = referrer._id;
    }

    // Public registration — never allow privileged roles
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'customer',
      referredBy,
    });

    await ensureReferralCode(user);

    // Dev: auto-verify so new users can login immediately after register
    if (process.env.NODE_ENV !== 'production') {
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    try {
      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await sendWelcomeEmail(user, verificationUrl);
    } catch (_) {
      // Non-critical — continue even if SMTP fails
    }

    sendTokenResponse(user, 201, res, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Account has been deactivated. Contact support.');
    }

    if (user.role === 'customer' && !user.isEmailVerified) {
      return sendError(res, 403, 'Please verify your email before logging in. Check your inbox or request a new link.');
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  sendSuccess(res, 200, 'Logged out successfully');
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist', 'title images price');
    if (user) {
      await ensureReferralCode(user);
    }

    sendSuccess(res, 200, 'User profile fetched', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Referral dashboard for logged-in customer
// @route   GET /api/auth/referral
// @access  Private
exports.getReferral = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');

    const code = await ensureReferralCode(user);
    await refreshReferrerRewardStatuses(user._id);
    user = await User.findById(req.user.id);

    const settings = await getReferralSettings();
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '') || 'http://localhost:5173';
    const shareLink = `${frontendUrl}/register?ref=${encodeURIComponent(code)}`;

    const rewards = await ReferralReward.find({ referrer: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const payouts = await ReferralPayout.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const referredCount = await User.countDocuments({ referredBy: user._id });
    const pendingTotal = rewards
      .filter((r) => r.status === 'pending')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const minBank = settings.minBankTransfer || 1000;
    const balance = user.referralBalance || 0;

    sendSuccess(res, 200, 'Referral info', {
      referralCode: code,
      shareLink,
      referralBalance: balance,
      referredCount,
      pendingTotal,
      eligibleTotal: balance,
      canRequestPayout: balance >= minBank,
      minBankTransfer: minBank,
      returnPolicyDays: settings.returnPolicyDays || 7,
      defaultRewardAmount: settings.defaultRewardAmount || 500,
      note: `Minimum ₹${minBank} required for bank transfer after the return policy period is over.`,
      rewards: rewards.map((r) => ({
        _id: r._id,
        orderNumber: r.orderNumber,
        amount: r.amount,
        status: r.status,
        eligibleAt: r.eligibleAt,
        createdAt: r.createdAt,
        source: r.source,
      })),
      payouts: payouts.map((p) => ({
        _id: p._id,
        amount: p.amount,
        status: p.status,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        adminNote: p.adminNote,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request bank transfer of referral balance
// @route   POST /api/auth/referral/payout
// @access  Private
exports.requestReferralPayout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');

    await refreshReferrerRewardStatuses(user._id);
    const fresh = await User.findById(req.user.id);
    const settings = await getReferralSettings();
    const minBank = Number(settings.minBankTransfer) || 1000;
    const balance = fresh.referralBalance || 0;

    if (balance < minBank) {
      return sendError(res, 400, `Minimum ₹${minBank} required for bank transfer. Current balance: ₹${balance}`);
    }

    const existingPending = await ReferralPayout.findOne({ user: fresh._id, status: 'pending' });
    if (existingPending) {
      return sendError(res, 400, 'You already have a pending payout request');
    }

    const {
      accountHolder,
      accountNumber,
      ifsc,
      bankName,
      upiId,
      amount,
    } = req.body;

    if (!accountHolder?.trim() || !accountNumber?.trim() || !ifsc?.trim()) {
      return sendError(res, 400, 'Account holder, account number and IFSC are required');
    }

    const payoutAmount = amount != null ? Number(amount) : balance;
    if (payoutAmount < minBank || payoutAmount > balance) {
      return sendError(res, 400, `Payout amount must be between ₹${minBank} and ₹${balance}`);
    }

    // Hold amount from wallet until admin pays/rejects
    fresh.referralBalance = balance - payoutAmount;
    await fresh.save({ validateBeforeSave: false });

    const payout = await ReferralPayout.create({
      user: fresh._id,
      amount: payoutAmount,
      status: 'pending',
      bankDetails: {
        accountHolder: accountHolder.trim(),
        accountNumber: String(accountNumber).trim(),
        ifsc: String(ifsc).trim().toUpperCase(),
        bankName: (bankName || '').trim(),
        upiId: (upiId || '').trim(),
      },
    });

    sendSuccess(res, 201, 'Payout request submitted', { payout, referralBalance: fresh.referralBalance });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return sendError(res, 404, 'No account found with that email');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
      sendSuccess(res, 200, 'Password reset email sent');
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 500, 'Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, 'Email is required');

    const user = await User.findOne({ email });
    if (!user || user.isEmailVerified) {
      return sendSuccess(res, 200, 'If an unverified account exists, a verification email has been sent');
    }

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendWelcomeEmail(user, verificationUrl);

    sendSuccess(res, 200, 'Verification email sent');
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone'];
    const user = await User.findById(req.user.id);
    allowed.forEach((k) => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
    if (req.file) {
      const { getFileUrl } = require('../config/cloudinary');
      user.avatar = getFileUrl(req.file);
      if (req.file.filename) user.avatarPublicId = req.file.filename;
    }
    await user.save();
    sendSuccess(res, 200, 'Profile updated', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Save / update addresses on user account
// @route   PUT /api/auth/addresses
// @access  Private
exports.updateAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (Array.isArray(req.body.addresses)) {
      user.addresses = req.body.addresses;
      await user.save();
    }
    sendSuccess(res, 200, 'Addresses updated', { addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wishlist products
// @route   GET /api/auth/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist', 'title slug images price discount status isActive');
    const items = (user.wishlist || []).filter((p) => p && p.isActive !== false && p.status !== 'archived');
    sendSuccess(res, 200, 'Wishlist fetched', { items });
  } catch (error) {
    next(error);
  }
};

// @desc    Replace wishlist (full sync from client)
// @route   PUT /api/auth/wishlist
// @access  Private
exports.setWishlist = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.productIds) ? req.body.productIds : [];
    const unique = [...new Set(ids.map(String).filter(Boolean))];
    const user = await User.findById(req.user.id);
    user.wishlist = unique;
    await user.save();
    await user.populate('wishlist', 'title slug images price discount status isActive');
    sendSuccess(res, 200, 'Wishlist saved', { items: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const Product = require('../models/Product');
    const product = await Product.findById(productId).select('_id title slug images price discount status isActive');
    if (!product) return sendError(res, 404, 'Product not found');

    const user = await User.findById(req.user.id);
    const idx = user.wishlist.findIndex((id) => String(id) === String(productId));
    let added = false;
    if (idx >= 0) {
      user.wishlist.splice(idx, 1);
    } else {
      user.wishlist.push(product._id);
      added = true;
    }
    await user.save();
    sendSuccess(res, 200, added ? 'Added to wishlist' : 'Removed from wishlist', {
      added,
      productId: String(product._id),
      product,
    });
  } catch (error) {
    next(error);
  }
};
