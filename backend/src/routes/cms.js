const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
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
router.get('/admin/pages/:page', protect, requirePermission('cms'), adminGetPageSections);
router.post('/admin/sections', protect, requirePermission('cms'), createSection);
router.put('/admin/sections/:id', protect, requirePermission('cms'), updateSection);
router.delete('/admin/sections/:id', protect, requirePermission('cms'), deleteSection);
router.put('/admin/pages/:page/reorder', protect, requirePermission('cms'), reorderSections);
router.put('/admin/sections/:id/toggle', protect, requirePermission('cms'), toggleSection);

router.get('/admin/banners', protect, requirePermission('cms'), adminGetBanners);
router.post('/admin/banners', protect, requirePermission('cms'), uploadBanner.single('image'), createBanner);
router.put('/admin/banners/:id', protect, requirePermission('cms'), uploadBanner.single('image'), updateBanner);
router.delete('/admin/banners/:id', protect, requirePermission('cms'), deleteBanner);

router.get('/admin/menus', protect, requirePermission('cms'), adminGetMenus);
router.put('/admin/menus/:location', protect, requirePermission('cms'), upsertMenu);

// Generic single-image upload (returns Cloudinary URL or local URL)
router.post('/admin/upload', protect, requirePermission('cms'), uploadBanner.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = getFileUrl(req.file);
  if (!url) return res.status(500).json({ success: false, message: 'Failed to get file URL after upload.' });
  res.json({ success: true, url });
});

module.exports = router;
