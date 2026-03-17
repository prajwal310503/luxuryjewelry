const Blog = require('../models/Blog');
const { getFileUrl } = require('../config/cloudinary');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// ── Public ────────────────────────────────────────────────────────────────────
exports.getBlogs = async (req, res) => {
  try {
    const query = { isPublished: true };
    if (req.query.featured === 'true') query.isFeatured = true;
    const limit = parseInt(req.query.limit) || 20;
    const blogs = await Blog.find(query)
      .sort('-publishedAt -createdAt')
      .limit(limit)
      .select('-content');
    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.adminGetBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort('-createdAt');
    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminCreateBlog = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = getFileUrl(req.file);
    if (!body.slug && body.title) body.slug = slugify(body.title);
    if (body.isPublished === 'true' || body.isPublished === true) {
      body.publishedAt = body.publishedAt || new Date();
    }
    const blog = await Blog.create(body);
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminUpdateBlog = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = getFileUrl(req.file);
    if (body.isPublished === 'true' || body.isPublished === true) {
      const existing = await Blog.findById(req.params.id);
      if (!existing?.isPublished) body.publishedAt = new Date();
    }
    const blog = await Blog.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminDeleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminToggleBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Post not found' });
    blog.isPublished = !blog.isPublished;
    if (blog.isPublished && !blog.publishedAt) blog.publishedAt = new Date();
    await blog.save();
    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
