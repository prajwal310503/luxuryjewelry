const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');
const { getFileUrl } = require('../config/cloudinary');

// @desc    Get all categories (tree structure)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const { flat, parent, level } = req.query;

    let filter = { isActive: true };
    if (parent === 'null' || parent === '') filter.parent = null;
    else if (parent) filter.parent = parent;
    if (level !== undefined) filter.level = parseInt(level);

    const categories = await Category.find(filter)
      .populate('subcategories', 'name slug image isActive sortOrder')
      .sort('sortOrder')
      .select('-__v');

    sendSuccess(res, 200, 'Categories fetched', categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('parent', 'name slug')
      .populate('subcategories', 'name slug image isActive')
      .populate('applicableAttributes');

    if (!category) return sendError(res, 404, 'Category not found');

    sendSuccess(res, 200, 'Category fetched', category);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create category
// @route   POST /api/admin/categories
// @access  Admin
exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (data.commissionRate !== undefined && data.commissionRate !== '') {
      data.commissionRate = Math.min(100, Math.max(0, Number(data.commissionRate) || 0));
    }

    if (data.parent) {
      const parentCategory = await Category.findById(data.parent);
      if (!parentCategory) return sendError(res, 404, 'Parent category not found');

      data.ancestors = [
        ...parentCategory.ancestors,
        { _id: parentCategory._id, name: parentCategory.name, slug: parentCategory.slug },
      ];
      data.level = parentCategory.level + 1;
      // Subcategory inherits parent rate if not set
      if (data.commissionRate === undefined || data.commissionRate === '' || Number.isNaN(Number(data.commissionRate))) {
        data.commissionRate = parentCategory.commissionRate || 0;
      }
    }

    if (req.file) {
      data.image = getFileUrl(req.file);
      data.imagePublicId = req.file.filename || req.file.public_id;
    }

    const category = await Category.create(data);

    sendSuccess(res, 201, 'Category created', category);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 404, 'Category not found');

    const body = { ...req.body };
    if (body.commissionRate !== undefined && body.commissionRate !== '') {
      body.commissionRate = Math.min(100, Math.max(0, Number(body.commissionRate) || 0));
    }

    Object.assign(category, body);

    if (req.file) {
      category.image = getFileUrl(req.file);
      category.imagePublicId = req.file.filename || req.file.public_id;
    }

    await category.save();
    sendSuccess(res, 200, 'Category updated', category);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Deactivate category (soft delete)
// @route   DELETE /api/categories/admin/:id
// @access  Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 404, 'Category not found');

    const hasChildren = await Category.countDocuments({ parent: req.params.id });
    if (hasChildren > 0) return sendError(res, 400, 'Cannot deactivate category with subcategories');

    category.isActive = false;
    await category.save();

    sendSuccess(res, 200, 'Category deactivated');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Permanently delete category
// @route   DELETE /api/categories/admin/:id/permanent
// @access  Admin
exports.permanentDeleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 404, 'Category not found');

    const hasChildren = await Category.countDocuments({ parent: req.params.id });
    if (hasChildren > 0) return sendError(res, 400, 'Remove all subcategories before deleting this category');

    await Category.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, 'Category permanently deleted');
  } catch (error) {
    next(error);
  }
};
