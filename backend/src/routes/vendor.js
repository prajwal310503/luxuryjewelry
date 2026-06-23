const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');
const {
  registerVendor,
  getVendorDashboard,
  getMyStore,
  updateMyStore,
  getVendorProducts,
  getVendorOrders,
  updateOrderStatus,
  adminGetVendors,
  adminApproveVendor,
  adminRejectVendor,
  adminSuspendVendor,
  adminSetCommission,
  adminGetVendorProducts,
  adminGetVendorOrders,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
} = require('../controllers/vendorController');

const vendorAuth = [protect, authorize('vendor')];
const adminAuth  = [protect, authorize('admin')];
const storeUpload = uploadProduct.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]);
const productUpload = uploadProduct.fields([{ name: 'images', maxCount: 6 }]);

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
  ],
  validate,
  registerVendor
);

router.get('/dashboard',          ...vendorAuth, getVendorDashboard);
router.get('/store',              ...vendorAuth, getMyStore);
router.put('/store',              ...vendorAuth, storeUpload, updateMyStore);
router.get('/products',           ...vendorAuth, getVendorProducts);
router.post('/products',          ...vendorAuth, productUpload, createVendorProduct);
router.put('/products/:id',       ...vendorAuth, productUpload, updateVendorProduct);
router.delete('/products/:id',    ...vendorAuth, deleteVendorProduct);
router.get('/orders',             ...vendorAuth, getVendorOrders);
router.put('/orders/:id/status',  ...vendorAuth, updateOrderStatus);

router.get('/admin/list',              ...adminAuth, adminGetVendors);
router.get('/admin/:id/products',     ...adminAuth, adminGetVendorProducts);
router.get('/admin/:id/orders',       ...adminAuth, adminGetVendorOrders);
router.put('/admin/:id/approve',       ...adminAuth, adminApproveVendor);
router.put('/admin/:id/reject',        ...adminAuth, adminRejectVendor);
router.put('/admin/:id/suspend',       ...adminAuth, adminSuspendVendor);
router.put('/admin/:id/commission',    ...adminAuth, adminSetCommission);

module.exports = router;
