const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBanner, getFileUrl } = require('../config/cloudinary');
const {
  getPageSections,
  adminGetPageSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  toggleSection,
  getBanners,
  adminGetBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getMenu,
  adminGetMenus,
  upsertMenu,
} = require('../controllers/cmsController');

// Public
router.get('/pages/:page', getPageSections);
router.get('/banners', getBanners);
router.get('/menus/:location', getMenu);

// Admin
router.get('/admin/pages/:page', protect, authorize('admin'), adminGetPageSections);
router.post('/admin/sections', protect, authorize('admin'), createSection);
router.put('/admin/sections/:id', protect, authorize('admin'), updateSection);
router.delete('/admin/sections/:id', protect, authorize('admin'), deleteSection);
router.put('/admin/pages/:page/reorder', protect, authorize('admin'), reorderSections);
router.put('/admin/sections/:id/toggle', protect, authorize('admin'), toggleSection);

router.get('/admin/banners', protect, authorize('admin'), adminGetBanners);
router.post('/admin/banners', protect, authorize('admin'), uploadBanner.single('image'), createBanner);
router.put('/admin/banners/:id', protect, authorize('admin'), uploadBanner.single('image'), updateBanner);
router.delete('/admin/banners/:id', protect, authorize('admin'), deleteBanner);

router.get('/admin/menus', protect, authorize('admin'), adminGetMenus);
router.put('/admin/menus/:location', protect, authorize('admin'), upsertMenu);

// Generic single-image upload (returns Cloudinary URL or local URL)
router.post('/admin/upload', protect, authorize('admin'), uploadBanner.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = getFileUrl(req.file);
  if (!url) return res.status(500).json({ success: false, message: 'Failed to get file URL after upload.' });
  res.json({ success: true, url });
});

module.exports = router;
