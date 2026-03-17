const PageSection = require('../models/PageSection');
const Banner = require('../models/Banner');
const Menu = require('../models/Menu');
const { sendSuccess, sendError } = require('../utils/response');
const { getFileUrl } = require('../config/cloudinary');

// ==================== PAGE SECTIONS ====================

// @desc    Get page sections
// @route   GET /api/cms/pages/:page
// @access  Public
exports.getPageSections = async (req, res, next) => {
  try {
    const sections = await PageSection.find({ page: req.params.page, isActive: true })
      .sort('sortOrder')
      .lean();
    sendSuccess(res, 200, 'Page sections fetched', sections);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all sections for a page
// @route   GET /api/admin/cms/pages/:page
// @access  Admin
exports.adminGetPageSections = async (req, res, next) => {
  try {
    const sections = await PageSection.find({ page: req.params.page })
      .sort('sortOrder')
      .lean();
    sendSuccess(res, 200, 'Page sections fetched', sections);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create section
// @route   POST /api/admin/cms/sections
// @access  Admin
exports.createSection = async (req, res, next) => {
  try {
    const section = await PageSection.create({ ...req.body, createdBy: req.user.id });
    sendSuccess(res, 201, 'Section created', section);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update section
// @route   PUT /api/admin/cms/sections/:id
// @access  Admin
exports.updateSection = async (req, res, next) => {
  try {
    const section = await PageSection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );
    if (!section) return sendError(res, 404, 'Section not found');
    sendSuccess(res, 200, 'Section updated', section);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete section
// @route   DELETE /api/admin/cms/sections/:id
// @access  Admin
exports.deleteSection = async (req, res, next) => {
  try {
    const section = await PageSection.findByIdAndDelete(req.params.id);
    if (!section) return sendError(res, 404, 'Section not found');
    sendSuccess(res, 200, 'Section deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Reorder sections
// @route   PUT /api/admin/cms/pages/:page/reorder
// @access  Admin
exports.reorderSections = async (req, res, next) => {
  try {
    const { sectionOrder } = req.body;
    const updates = sectionOrder.map(({ id, sortOrder }) =>
      PageSection.findByIdAndUpdate(id, { sortOrder })
    );
    await Promise.all(updates);
    sendSuccess(res, 200, 'Sections reordered');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle section visibility
// @route   PUT /api/admin/cms/sections/:id/toggle
// @access  Admin
exports.toggleSection = async (req, res, next) => {
  try {
    const section = await PageSection.findById(req.params.id);
    if (!section) return sendError(res, 404, 'Section not found');
    section.isActive = !section.isActive;
    await section.save();
    sendSuccess(res, 200, `Section ${section.isActive ? 'enabled' : 'disabled'}`, section);
  } catch (error) {
    next(error);
  }
};

// ==================== BANNERS ====================

// @desc    Get banners by position
// @route   GET /api/cms/banners
// @access  Public
exports.getBanners = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.position) filter.position = req.query.position;

    const now = new Date();
    filter.$or = [
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
    ];

    const banners = await Banner.find(filter).sort('sortOrder').lean();
    sendSuccess(res, 200, 'Banners fetched', banners);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all banners
// @route   GET /api/admin/cms/banners
// @access  Admin
exports.adminGetBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort('sortOrder').lean();
    sendSuccess(res, 200, 'Banners fetched', banners);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create banner
// @route   POST /api/admin/cms/banners
// @access  Admin
exports.createBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = getFileUrl(req.file);
      data.imagePublicId = req.file.filename || req.file.public_id;
    }
    const banner = await Banner.create(data);
    sendSuccess(res, 201, 'Banner created', banner);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update banner
// @route   PUT /api/admin/cms/banners/:id
// @access  Admin
exports.updateBanner = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = getFileUrl(req.file);
      data.imagePublicId = req.file.filename || req.file.public_id;
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!banner) return sendError(res, 404, 'Banner not found');
    sendSuccess(res, 200, 'Banner updated', banner);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete banner
// @route   DELETE /api/admin/cms/banners/:id
// @access  Admin
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return sendError(res, 404, 'Banner not found');
    sendSuccess(res, 200, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};

// ==================== MENUS ====================

// @desc    Get menu by location
// @route   GET /api/cms/menus/:location
// @access  Public
exports.getMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findOne({ location: req.params.location, isActive: true })
      .populate('items.category', 'name slug image')
      .populate('items.children.category', 'name slug')
      .lean();
    sendSuccess(res, 200, 'Menu fetched', menu);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all menus
// @route   GET /api/admin/cms/menus
// @access  Admin
exports.adminGetMenus = async (req, res, next) => {
  try {
    const menus = await Menu.find().lean();
    sendSuccess(res, 200, 'Menus fetched', menus);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create/Update menu
// @route   PUT /api/admin/cms/menus/:location
// @access  Admin
exports.upsertMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findOneAndUpdate(
      { location: req.params.location },
      { ...req.body, location: req.params.location },
      { new: true, upsert: true, runValidators: true }
    );
    sendSuccess(res, 200, 'Menu saved', menu);
  } catch (error) {
    next(error);
  }
};
