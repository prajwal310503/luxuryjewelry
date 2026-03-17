const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  toggleUserStatus,
  getVendors,
  updateVendorStatus,
  getReviews,
  updateReviewStatus,
} = require('../controllers/adminController');
const {
  adminGetProducts,
  adminUpdateProductStatus,
  adminToggleFeatured,
  adminCreateProduct,
  adminUpdateProduct,
  adminUploadPackageImages,
  adminUploadPromoBanner,
  adminUploadProductImages,
  adminUploadCertImage,
} = require('../controllers/productController');
const { uploadProduct } = require('../config/cloudinary');

const adminAuth = [protect, authorize('admin')];

router.get('/dashboard', ...adminAuth, getDashboard);

router.get('/users', ...adminAuth, getUsers);
router.put('/users/:id/toggle', ...adminAuth, toggleUserStatus);

router.get('/vendors', ...adminAuth, getVendors);
router.put('/vendors/:id/status', ...adminAuth, updateVendorStatus);

router.get('/products', ...adminAuth, adminGetProducts);
router.post('/products', ...adminAuth, adminCreateProduct);
router.put('/products/:id', ...adminAuth, adminUpdateProduct);
router.put('/products/:id/status', ...adminAuth, adminUpdateProductStatus);
router.put('/products/:id/featured', ...adminAuth, adminToggleFeatured);
router.post('/products/:id/images', ...adminAuth, uploadProduct.array('images', 10), adminUploadProductImages);

router.post('/upload/package-images', ...adminAuth, uploadProduct.array('images', 10), adminUploadPackageImages);
router.post('/upload/promo-banner', ...adminAuth, uploadProduct.single('image'), adminUploadPromoBanner);
router.post('/upload/cert-image', ...adminAuth, uploadProduct.single('image'), adminUploadCertImage);

router.get('/reviews', ...adminAuth, getReviews);
router.put('/reviews/:id/status', ...adminAuth, updateReviewStatus);

module.exports = router;
