const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const {
  validateCoupon,
  getAvailableCoupons,
  adminGetCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  vendorGetCoupons,
  vendorCreateCoupon,
  vendorDeleteCoupon,
} = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);
router.get('/available', protect, getAvailableCoupons);

router.get('/admin', protect, requirePermission('coupons'), adminGetCoupons);
router.post('/admin', protect, requirePermission('coupons'), adminCreateCoupon);
router.put('/admin/:id', protect, requirePermission('coupons'), adminUpdateCoupon);
router.delete('/admin/:id', protect, requirePermission('coupons'), adminDeleteCoupon);

router.get('/vendor', protect, authorize('vendor'), vendorGetCoupons);
router.post('/vendor', protect, authorize('vendor'), vendorCreateCoupon);
router.delete('/vendor/:id', protect, authorize('vendor'), vendorDeleteCoupon);

module.exports = router;
