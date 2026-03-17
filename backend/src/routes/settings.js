const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSettings, updateSettings, getStatus } = require('../controllers/settingsController');

const adminAuth = [protect, authorize('admin')];

router.get('/status', ...adminAuth, getStatus);
router.get('/',       ...adminAuth, getSettings);
router.put('/:group', ...adminAuth, updateSettings);

module.exports = router;
