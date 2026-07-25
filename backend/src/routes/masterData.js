const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const {
  getMasterData,
  updateMasterData,
  syncPrices,
  getSyncLogs,
} = require('../controllers/masterDataController');

const adminAuth = [protect, requirePermission('master_data')];

router.get('/', ...adminAuth, getMasterData);
router.put('/', ...adminAuth, updateMasterData);
router.post('/sync', ...adminAuth, syncPrices);
router.get('/sync-logs', ...adminAuth, getSyncLogs);

module.exports = router;
