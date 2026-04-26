const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  uploadPincodes,
  checkPincode,
  getPincodeStats,
  clearPincodes,
} = require('../controllers/pincodeController');

// Accept xlsx/xls only, max 5 MB, stored in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only Excel (.xlsx/.xls) or CSV files are allowed'), ok);
  },
});

const adminAuth = [protect, authorize('admin')];

// Public
router.get('/check', checkPincode);

// Admin
router.get('/admin/stats',   ...adminAuth, getPincodeStats);
router.post('/admin/upload', ...adminAuth, upload.single('file'), uploadPincodes);
router.delete('/admin/clear', ...adminAuth, clearPincodes);

module.exports = router;
