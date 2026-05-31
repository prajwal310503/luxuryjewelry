const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');
const {
  createTicket, getMyTickets, getTicket,
  adminGetAll, adminReply, adminGetTicket,
} = require('../controllers/supportController');

// User routes
router.post('/',    protect, uploadBanner.single('image'), createTicket);
router.get('/my',   protect, getMyTickets);
router.get('/:id',  protect, getTicket);

// Admin routes
router.get('/admin/all',        protect, requirePermission('orders'), adminGetAll);
router.get('/admin/:id',        protect, requirePermission('orders'), adminGetTicket);
router.put('/admin/:id/reply',  protect, requirePermission('orders'), adminReply);

module.exports = router;
