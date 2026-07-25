const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  permanentDeleteCategory,
} = require('../controllers/categoryController');

// Public
router.get('/', getCategories);
router.get('/:slug', getCategory);

// Admin
router.post('/admin', protect, requirePermission('categories'), uploadBanner.single('image'), createCategory);
router.put('/admin/:id', protect, requirePermission('categories'), uploadBanner.single('image'), updateCategory);
router.delete('/admin/permanent/:id', protect, requirePermission('categories'), permanentDeleteCategory);
router.delete('/admin/:id', protect, requirePermission('categories'), deleteCategory);

module.exports = router;
