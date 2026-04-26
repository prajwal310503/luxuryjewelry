const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSettings, updateSettings, getStatus } = require('../controllers/settingsController');
const Settings = require('../models/Settings');
const { uploadSiteImage, getFileUrl } = require('../config/cloudinary');

const adminAuth = [protect, authorize('admin')];

const SITE_IMAGE_KEYS = [
  'categoryBannerDesktop',
  'categoryBannerMobile',
];

// Public: site image URLs
router.get('/site-images', async (req, res) => {
  try {
    const doc = await Settings.findOne({ group: 'siteImages' }).lean();
    res.json({ success: true, data: doc?.data || {} });
  } catch (err) {
    res.json({ success: true, data: {} });
  }
});

// Admin: upload a site image
router.put('/site-images/:key', ...adminAuth, uploadSiteImage.single('image'), async (req, res) => {
  try {
    const { key } = req.params;
    if (!SITE_IMAGE_KEYS.includes(key)) {
      return res.status(400).json({ success: false, message: 'Invalid image key' });
    }
    const url = getFileUrl(req.file);
    if (!url) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const existing = await Settings.findOne({ group: 'siteImages' });
    const merged = { ...(existing?.data || {}), [key]: url };
    await Settings.findOneAndUpdate({ group: 'siteImages' }, { data: merged }, { upsert: true, new: true });
    res.json({ success: true, data: { [key]: url } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: remove a site image
router.delete('/site-images/:key', ...adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const existing = await Settings.findOne({ group: 'siteImages' });
    const merged = { ...(existing?.data || {}) };
    delete merged[key];
    await Settings.findOneAndUpdate({ group: 'siteImages' }, { data: merged }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/status', ...adminAuth, getStatus);
router.get('/',       ...adminAuth, getSettings);
router.put('/:group', ...adminAuth, updateSettings);

module.exports = router;
