const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// Public
router.get('/', getCategories);
router.get('/:slug', getCategory);

// Admin
router.post('/admin', protect, authorize('admin'), uploadBanner.single('image'), createCategory);
router.put('/admin/:id', protect, authorize('admin'), uploadBanner.single('image'), updateCategory);
router.delete('/admin/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
