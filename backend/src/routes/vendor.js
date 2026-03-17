const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getVendorDashboard } = require('../controllers/vendorController');

const vendorAuth = [protect, authorize('vendor')];

router.get('/dashboard', ...vendorAuth, getVendorDashboard);

module.exports = router;
