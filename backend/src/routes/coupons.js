const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  validateCoupon,
  adminGetCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  vendorGetCoupons,
  vendorCreateCoupon,
  vendorDeleteCoupon,
} = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);

router.get('/admin', protect, authorize('admin'), adminGetCoupons);
router.post('/admin', protect, authorize('admin'), adminCreateCoupon);
router.put('/admin/:id', protect, authorize('admin'), adminUpdateCoupon);
router.delete('/admin/:id', protect, authorize('admin'), adminDeleteCoupon);

router.get('/vendor', protect, authorize('vendor'), vendorGetCoupons);
router.post('/vendor', protect, authorize('vendor'), vendorCreateCoupon);
router.delete('/vendor/:id', protect, authorize('vendor'), vendorDeleteCoupon);

module.exports = router;
