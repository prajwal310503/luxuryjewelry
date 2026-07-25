const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
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

router.get('/admin/sales', protect, requirePermission('reports'), platformSalesReport);
router.get('/admin/orders', protect, requirePermission('reports'), platformOrderReport);
router.get('/admin/products', protect, requirePermission('reports'), platformProductReport);
router.get('/admin/customers', protect, requirePermission('reports'), platformCustomerReport);
router.get('/admin/vendors', protect, requirePermission('reports'), platformVendorReport);

router.get('/vendor/sales', protect, authorize('vendor'), vendorSalesReport);
router.get('/vendor/products', protect, authorize('vendor'), vendorProductReport);
router.get('/vendor/customers', protect, authorize('vendor'), vendorCustomerReport);

module.exports = router;
