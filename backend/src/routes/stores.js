const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');
const {
  getStores,
  getStoreBySlug,
  adminGetStores,
  adminCreateStore,
  adminUpdateStore,
  adminDeleteStore,
  adminToggleStore,
  vendorGetStore,
  vendorUpsertStore,
} = require('../controllers/storeController');

// ── Admin (defined first to avoid conflict with /:slug) ──────────────────────
router.get('/admin/all',     protect, authorize('admin'), adminGetStores);
router.post('/admin',        protect, authorize('admin'), uploadBanner.single('image'), adminCreateStore);
router.put('/admin/:id',     protect, authorize('admin'), uploadBanner.single('image'), adminUpdateStore);
router.delete('/admin/:id',  protect, authorize('admin'), adminDeleteStore);
router.put('/admin/:id/toggle', protect, authorize('admin'), adminToggleStore);

// ── Vendor ───────────────────────────────────────────────────────────────────
router.get('/vendor/my',  protect, authorize('vendor'), vendorGetStore);
router.post('/vendor/my', protect, authorize('vendor'), uploadBanner.single('image'), vendorUpsertStore);

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/',        getStores);
router.get('/:slug',   getStoreBySlug);

module.exports = router;
