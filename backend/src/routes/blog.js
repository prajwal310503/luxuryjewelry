const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');
const {
  getBlogs,
  getBlogBySlug,
  adminGetBlogs,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog,
  adminToggleBlog,
} = require('../controllers/blogController');

// Admin routes first
router.get('/admin/all',       protect, authorize('admin'), adminGetBlogs);
router.post('/admin',          protect, authorize('admin'), uploadProduct.single('image'), adminCreateBlog);
router.put('/admin/:id',       protect, authorize('admin'), uploadProduct.single('image'), adminUpdateBlog);
router.delete('/admin/:id',    protect, authorize('admin'), adminDeleteBlog);
router.put('/admin/:id/toggle', protect, authorize('admin'), adminToggleBlog);

// Public
router.get('/',         getBlogs);
router.get('/:slug',    getBlogBySlug);

module.exports = router;
