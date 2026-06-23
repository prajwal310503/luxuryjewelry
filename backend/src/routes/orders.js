const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  downloadInvoice,
  requestCancellation,
  requestReturn,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminCreateOrder,
  searchProducts,
} = require('../controllers/orderController');

router.get('/search/suggest', searchProducts);
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id/invoice', protect, downloadInvoice);
router.post('/:id/cancel-request', protect, requestCancellation);
router.post('/:id/return-request', protect, requestReturn);
router.get('/:id', protect, getOrder);

router.post('/admin/create', protect, requirePermission('orders'), adminCreateOrder);
router.get('/admin/all', protect, requirePermission('orders'), adminGetOrders);
router.put('/admin/:id/status', protect, requirePermission('orders'), adminUpdateOrderStatus);

module.exports = router;
