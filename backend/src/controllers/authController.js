const crypto = require('crypto');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'Email already registered');
    }

    // Only allow customer or vendor registration via public API
    const allowedRoles = ['customer', 'vendor'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({ name, email, password, phone, role: userRole });

    // If registering as vendor, create vendor profile
    if (userRole === 'vendor') {
      const { storeName } = req.body;
      if (!storeName) return sendError(res, 400, 'Store name is required for vendor registration');
      await Vendor.create({ user: user._id, storeName });
    }

    // Send verification email
    try {
      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await sendWelcomeEmail(user, verificationUrl);
    } catch (_) {
      // Non-critical — continue
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

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await Vendor.findOne({ user: user._id });
    }

    sendSuccess(res, 200, 'User profile fetched', { user, vendorProfile });
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
