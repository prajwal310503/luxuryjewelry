const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  toggleUserStatus,
  changeUserRole,
  getVendors,
  updateVendorStatus,
  getReviews,
  updateReviewStatus,
} = require('../controllers/adminController');
const {
  adminGetProducts,
  adminGetProductById,
  adminUpdateProductStatus,
  adminToggleFeatured,
  adminToggleBestSeller,
  adminToggleNewArrival,
  adminToggleLifestyle1,
  adminToggleLifestyle2,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadPackageImages,
  adminUploadPromoBanner,
  adminUploadProductImages,
  adminUploadCertImage,
  adminRemoveProductImage,
  adminUploadSiteImage,
} = require('../controllers/productController');
const { uploadProduct, uploadSiteImage } = require('../config/cloudinary');

const adminAuth = [protect, authorize('admin')];

router.get('/dashboard', ...adminAuth, getDashboard);

router.get('/users', ...adminAuth, getUsers);
router.put('/users/:id/role', ...adminAuth, changeUserRole);
router.put('/users/:id/toggle', ...adminAuth, toggleUserStatus);

router.get('/vendors', ...adminAuth, getVendors);
router.put('/vendors/:id/status', ...adminAuth, updateVendorStatus);

router.get('/products', ...adminAuth, adminGetProducts);
router.get('/products/:id', ...adminAuth, adminGetProductById);
router.post('/products', ...adminAuth, adminCreateProduct);
router.put('/products/:id', ...adminAuth, adminUpdateProduct);
router.delete('/products/:id', ...adminAuth, adminDeleteProduct);
router.put('/products/:id/status', ...adminAuth, adminUpdateProductStatus);
router.put('/products/:id/featured', ...adminAuth, adminToggleFeatured);
router.put('/products/:id/bestseller',  ...adminAuth, adminToggleBestSeller);
router.put('/products/:id/newarrival',  ...adminAuth, adminToggleNewArrival);
router.put('/products/:id/lifestyle1',  ...adminAuth, adminToggleLifestyle1);
router.put('/products/:id/lifestyle2',  ...adminAuth, adminToggleLifestyle2);
router.post('/products/:id/images', ...adminAuth, uploadProduct.array('images', 10), adminUploadProductImages);
router.delete('/products/:id/images/:imageIndex', ...adminAuth, adminRemoveProductImage);

router.post('/upload/package-images', ...adminAuth, uploadProduct.array('images', 10), adminUploadPackageImages);
router.post('/upload/promo-banner', ...adminAuth, uploadProduct.single('image'), adminUploadPromoBanner);
router.post('/upload/cert-image', ...adminAuth, uploadProduct.single('image'), adminUploadCertImage);
router.post('/upload/site-image', ...adminAuth, uploadSiteImage.single('image'), adminUploadSiteImage);

router.get('/reviews', ...adminAuth, getReviews);
router.put('/reviews/:id/status', ...adminAuth, updateReviewStatus);

module.exports = router;
