const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  createUser,
  toggleUserStatus,
  changeUserRole,
  updateUserPermissions,
  deleteUser,
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
  adminUploadProductVideos,
  adminUploadCertImage,
  adminRemoveProductImage,
  adminRemoveProductVideo,
  adminUploadSiteImage,
  adminBulkUploadProducts,
  adminBulkDeleteProducts,
  adminBulkArchiveProducts,
} = require('../controllers/productController');
const { uploadProduct, uploadSiteImage, uploadVideo } = require('../config/cloudinary');
const multer = require('multer');
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const adminAuth = [protect, authorize('admin')];
// Routes accessible by both admin and child_admin (permission checked per-route)
const staffAuth = [protect, authorize('admin', 'child_admin')];

// Dashboard — admin only
router.get('/dashboard', ...adminAuth, getDashboard);

// User management — admin only
router.get('/users',                    ...adminAuth, getUsers);
router.post('/users',                   ...adminAuth, createUser);
router.put('/users/:id/role',           ...adminAuth, changeUserRole);
router.put('/users/:id/permissions',    ...adminAuth, updateUserPermissions);
router.put('/users/:id/toggle',         ...adminAuth, toggleUserStatus);
router.delete('/users/:id',             ...adminAuth, deleteUser);

// Products — admin only
router.post('/products/bulk-upload',                ...adminAuth, memUpload.single('file'), adminBulkUploadProducts);
router.delete('/products/bulk',                     ...adminAuth, adminBulkDeleteProducts);
router.put('/products/bulk-archive',                ...adminAuth, adminBulkArchiveProducts);
router.get('/products',                             ...adminAuth, adminGetProducts);
router.get('/products/:id',                         ...adminAuth, adminGetProductById);
router.post('/products',                            ...adminAuth, adminCreateProduct);
router.put('/products/:id',                         ...adminAuth, adminUpdateProduct);
router.delete('/products/:id',                      ...adminAuth, adminDeleteProduct);
router.put('/products/:id/status',                  ...adminAuth, adminUpdateProductStatus);
router.put('/products/:id/featured',                ...adminAuth, adminToggleFeatured);
router.put('/products/:id/bestseller',              ...adminAuth, adminToggleBestSeller);
router.put('/products/:id/newarrival',              ...adminAuth, adminToggleNewArrival);
router.put('/products/:id/lifestyle1',              ...adminAuth, adminToggleLifestyle1);
router.put('/products/:id/lifestyle2',              ...adminAuth, adminToggleLifestyle2);
router.post('/products/:id/images',                 ...adminAuth, uploadProduct.array('images', 10), adminUploadProductImages);
router.delete('/products/:id/images/:imageIndex',   ...adminAuth, adminRemoveProductImage);
router.post('/products/:id/videos',                 ...adminAuth, uploadVideo.array('videos', 50), adminUploadProductVideos);
router.delete('/products/:id/videos/:videoIndex',   ...adminAuth, adminRemoveProductVideo);

// Uploads — admin only
router.post('/upload/package-images',   ...adminAuth, uploadProduct.array('images', 10), adminUploadPackageImages);
router.post('/upload/promo-banner',     ...adminAuth, uploadProduct.single('image'), adminUploadPromoBanner);
router.post('/upload/cert-image',       ...adminAuth, uploadProduct.single('image'), adminUploadCertImage);
router.post('/upload/site-image',       ...adminAuth, uploadSiteImage.single('image'), adminUploadSiteImage);

// Orders — admin + child_admin with 'orders' permission (order routes live in /orders)

// Reviews — admin only
router.get('/reviews',          ...adminAuth, getReviews);
router.put('/reviews/:id/status', ...adminAuth, updateReviewStatus);

module.exports = router;
