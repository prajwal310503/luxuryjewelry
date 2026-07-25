const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
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
router.get('/admin/all',       protect, requirePermission('blog'), adminGetBlogs);
router.post('/admin',          protect, requirePermission('blog'), uploadProduct.single('image'), adminCreateBlog);
router.put('/admin/:id',       protect, requirePermission('blog'), uploadProduct.single('image'), adminUpdateBlog);
router.delete('/admin/:id',    protect, requirePermission('blog'), adminDeleteBlog);
router.put('/admin/:id/toggle', protect, requirePermission('blog'), adminToggleBlog);

// Public
router.get('/',         getBlogs);
router.get('/:slug',    getBlogBySlug);

module.exports = router;
