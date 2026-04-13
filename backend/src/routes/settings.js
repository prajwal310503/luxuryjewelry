const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSettings, updateSettings, getStatus } = require('../controllers/settingsController');
const Settings = require('../models/Settings');

const adminAuth = [protect, authorize('admin')];

// Public: homepage site image URLs (stored by admin upload)
router.get('/site-images', async (req, res) => {
  try {
    const doc = await Settings.findOne({ group: 'siteImages' }).lean();
    res.json({ success: true, data: doc?.data || {} });
  } catch (err) {
    res.json({ success: true, data: {} });
  }
});

router.get('/status', ...adminAuth, getStatus);
router.get('/',       ...adminAuth, getSettings);
router.put('/:group', ...adminAuth, updateSettings);

module.exports = router;
