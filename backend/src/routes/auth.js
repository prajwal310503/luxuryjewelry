const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiters');
const { uploadAvatar } = require('../config/cloudinary');
const {
  register,
  login,
  logout,
  getMe,
  getReferral,
  requestReferralPayout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updatePassword,
  updateProfile,
  updateAddresses,
  getWishlist,
  setWishlist,
  toggleWishlist,
} = require('../controllers/authController');
const { googleAuth, getGoogleClientId } = require('../controllers/googleAuthController');
const {
  getVapidKey,
  subscribe,
  unsubscribe,
} = require('../controllers/notificationController');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/google', loginLimiter, body('credential').notEmpty(), validate, googleAuth);
router.get('/google/client-id', getGoogleClientId);

router.get('/push/vapid-key', getVapidKey);
router.post('/push/subscribe', protect, subscribe);
router.post('/push/unsubscribe', protect, unsubscribe);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/referral', protect, getReferral);
router.post('/referral/payout', protect, requestReferralPayout);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', body('email').isEmail(), validate, resendVerification);
router.put('/update-password', protect, body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 }), validate, updatePassword);
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/addresses', protect, updateAddresses);
router.get('/wishlist', protect, getWishlist);
router.put('/wishlist', protect, setWishlist);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
