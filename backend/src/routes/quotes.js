const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const {
  createQuote,
  getMyQuotes,
  adminGetQuotes,
  respondToQuote,
} = require('../controllers/quoteController');

// Retailer
router.post('/',    protect, authorize('retailer'), createQuote);
router.get('/my',   protect, authorize('retailer'), getMyQuotes);

// Admin + child_admin with 'quotes' permission
router.get('/admin/all',       protect, requirePermission('quotes'), adminGetQuotes);
router.put('/admin/:id',       protect, requirePermission('quotes'), respondToQuote);

module.exports = router;
