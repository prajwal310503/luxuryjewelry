const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  adminGetOrders,
  adminUpdateOrderStatus,
  vendorGetOrders,
} = require('../controllers/orderController');

// Customer (allow any authenticated user to place orders)
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Admin
router.get('/admin/all', protect, authorize('admin'), adminGetOrders);
router.put('/admin/:id/status', protect, authorize('admin'), adminUpdateOrderStatus);

// Vendor
router.get('/vendor/all', protect, authorize('vendor'), vendorGetOrders);

module.exports = router;
