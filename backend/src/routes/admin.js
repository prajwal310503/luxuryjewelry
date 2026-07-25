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
  adminSetJewelryDefaults,
} = require('../controllers/productController');
const { uploadProduct, uploadSiteImage, uploadVideo } = require('../config/cloudinary');
const multer = require('multer');
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const {
  getAdminReferralSettings,
  updateAdminReferralSettings,
  getAdminReferralRewards,
  getAdminReferralPayouts,
  updateAdminReferralPayout,
} = require('../controllers/referralController');
const {
  adminSend,
  adminHistory,
  validateSend,
} = require('../controllers/notificationController');
const validate = require('../middleware/validate');

const adminAuth = [protect, authorize('admin')];
// Routes accessible by both admin and child_admin (permission checked per-route)
const staffAuth = [protect, authorize('admin', 'child_admin')];
const withPerm = (perm) => [...staffAuth, requirePermission(perm)];

// Dashboard — admin or staff with dashboard permission
router.get('/dashboard', ...withPerm('dashboard'), getDashboard);

// User management — full CRUD admin only; staff with customers can list customers
router.get('/users', ...staffAuth, (req, res, next) => {
  if (req.user.role === 'admin') return getUsers(req, res, next);
  if ((req.user.permissions || []).includes('customers')) {
    req.query.role = 'customer';
    return getUsers(req, res, next);
  }
  return require('../utils/response').sendError(res, 403, 'You do not have permission for this action.');
});
router.post('/users',                   ...adminAuth, createUser);
router.put('/users/:id/role',           ...adminAuth, changeUserRole);
router.put('/users/:id/permissions',    ...adminAuth, updateUserPermissions);
router.put('/users/:id/toggle',         ...adminAuth, toggleUserStatus);
router.delete('/users/:id',             ...adminAuth, deleteUser);

// Products — admin + staff with products permission
router.post('/products/bulk-upload',                ...withPerm('products'), memUpload.single('file'), adminBulkUploadProducts);
router.post('/products/set-jewelry-defaults',       ...withPerm('products'), adminSetJewelryDefaults);
router.delete('/products/bulk',                     ...withPerm('products'), adminBulkDeleteProducts);
router.put('/products/bulk-archive',                ...withPerm('products'), adminBulkArchiveProducts);
router.get('/products',                             ...withPerm('products'), adminGetProducts);
router.get('/products/:id',                         ...withPerm('products'), adminGetProductById);
router.post('/products',                            ...withPerm('products'), adminCreateProduct);
router.put('/products/:id',                         ...withPerm('products'), adminUpdateProduct);
router.delete('/products/:id',                      ...withPerm('products'), adminDeleteProduct);
router.put('/products/:id/status',                  ...withPerm('products'), adminUpdateProductStatus);
router.put('/products/:id/featured',                ...withPerm('products'), adminToggleFeatured);
router.put('/products/:id/bestseller',              ...withPerm('products'), adminToggleBestSeller);
router.put('/products/:id/newarrival',              ...withPerm('products'), adminToggleNewArrival);
router.put('/products/:id/lifestyle1',              ...withPerm('products'), adminToggleLifestyle1);
router.put('/products/:id/lifestyle2',              ...withPerm('products'), adminToggleLifestyle2);
router.post('/products/:id/images',                 ...withPerm('products'), uploadProduct.array('images', 10), adminUploadProductImages);
router.delete('/products/:id/images/:imageIndex',   ...withPerm('products'), adminRemoveProductImage);
router.post('/products/:id/videos',                 ...withPerm('products'), uploadVideo.array('videos', 50), adminUploadProductVideos);
router.delete('/products/:id/videos/:videoIndex',   ...withPerm('products'), adminRemoveProductVideo);

// Uploads — products / cms
router.post('/upload/package-images',   ...withPerm('products'), uploadProduct.array('images', 10), adminUploadPackageImages);
router.post('/upload/promo-banner',     ...withPerm('cms'), uploadProduct.single('image'), adminUploadPromoBanner);
router.post('/upload/cert-image',       ...withPerm('products'), uploadProduct.single('image'), adminUploadCertImage);
router.post('/upload/site-image',       ...withPerm('cms'), uploadSiteImage.single('image'), adminUploadSiteImage);

// Reviews — products module
router.get('/reviews',          ...withPerm('products'), getReviews);
router.put('/reviews/:id/status', ...withPerm('products'), updateReviewStatus);

// Referral program
router.get('/referral/settings',  ...withPerm('referral'), getAdminReferralSettings);
router.put('/referral/settings',  ...withPerm('referral'), updateAdminReferralSettings);
router.get('/referral/rewards',   ...withPerm('referral'), getAdminReferralRewards);
router.get('/referral/payouts',   ...withPerm('referral'), getAdminReferralPayouts);
router.put('/referral/payouts/:id', ...withPerm('referral'), updateAdminReferralPayout);

// Browser notifications
router.get('/notifications', ...withPerm('notifications'), adminHistory);
router.post('/notifications/send', ...withPerm('notifications'), validateSend, validate, adminSend);

module.exports = router;
