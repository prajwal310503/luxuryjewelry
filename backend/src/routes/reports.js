const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  platformSalesReport,
  platformOrderReport,
  platformProductReport,
  platformCustomerReport,
  platformVendorReport,
  vendorSalesReport,
  vendorProductReport,
  vendorCustomerReport,
} = require('../controllers/reportController');

router.get('/admin/sales', protect, authorize('admin'), platformSalesReport);
router.get('/admin/orders', protect, authorize('admin'), platformOrderReport);
router.get('/admin/products', protect, authorize('admin'), platformProductReport);
router.get('/admin/customers', protect, authorize('admin'), platformCustomerReport);
router.get('/admin/vendors', protect, authorize('admin'), platformVendorReport);

router.get('/vendor/sales', protect, authorize('vendor'), vendorSalesReport);
router.get('/vendor/products', protect, authorize('vendor'), vendorProductReport);
router.get('/vendor/customers', protect, authorize('vendor'), vendorCustomerReport);

module.exports = router;
