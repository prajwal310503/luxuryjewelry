const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const {
  createQuote,
  getQuoteById,
  getMyQuotes,
  adminGetQuotes,
  respondToQuote,
  placeOrderFromQuote,
} = require('../controllers/quoteController');

// Any logged-in user can submit and view their own quotes
router.post('/',    protect, createQuote);
router.get('/my',   protect, getMyQuotes);
router.get('/:id',  protect, getQuoteById);

// User places order after admin confirms the quote
router.post('/:id/place-order', protect, placeOrderFromQuote);

// Admin + child_admin with 'quotes' permission
router.get('/admin/all',  protect, requirePermission('quotes'), adminGetQuotes);
router.put('/admin/:id',  protect, requirePermission('quotes'), respondToQuote);

module.exports = router;
