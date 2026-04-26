const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminCreateOrder,
} = require('../controllers/orderController');

// Retailer / any authenticated user
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Admin + child_admin with 'orders' permission
router.post('/admin/create',    protect, requirePermission('orders'), adminCreateOrder);
router.get('/admin/all',        protect, requirePermission('orders'), adminGetOrders);
router.put('/admin/:id/status', protect, requirePermission('orders'), adminUpdateOrderStatus);

module.exports = router;
