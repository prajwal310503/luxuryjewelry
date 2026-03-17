const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updatePassword,
} = require('../controllers/authController');

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
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.put('/update-password', protect, body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 }), validate, updatePassword);

module.exports = router;
