const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Admin dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Admin
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      pendingProducts,
      pendingVendors,
      recentOrders,
      totalRevenue,
      monthlyRevenue,
      weeklyOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Vendor.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'approved', isActive: true }),
      Order.countDocuments(),
      Product.countDocuments({ status: 'pending' }),
      Vendor.countDocuments({ status: 'pending' }),
      Order.find().sort('-createdAt').limit(10).populate('customer', 'name email'),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Revenue chart (last 30 days)
    const revenueChart = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, 'payment.status': 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, 200, 'Dashboard data fetched', {
      stats: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        pendingProducts,
        pendingVendors,
        weeklyOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        monthlyOrders: monthlyRevenue[0]?.count || 0,
      },
      recentOrders,
      revenueChart,
      ordersByStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt')
      .select('-password');

    sendPaginated(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle user status
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (user.role === 'admin') return sendError(res, 400, 'Cannot deactivate admin');

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, { isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all vendors
// @route   GET /api/admin/vendors
// @access  Admin
exports.getVendors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.storeName = new RegExp(req.query.search, 'i');

    const total = await Vendor.countDocuments(filter);
    const vendors = await Vendor.find(filter)
      .populate('user', 'name email phone createdAt')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    sendPaginated(res, vendors, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Approve/reject vendor
// @route   PUT /api/admin/vendors/:id/status
// @access  Admin
exports.updateVendorStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const allowed = ['approved', 'suspended', 'rejected'];
    if (!allowed.includes(status)) return sendError(res, 400, 'Invalid status');

    const update = { status };
    if (status === 'approved') {
      update.approvedAt = Date.now();
      update.approvedBy = req.user.id;
      update.isVerified = true;
    }
    if (status === 'rejected') update.rejectionReason = rejectionReason;

    const vendor = await Vendor.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name email');
    if (!vendor) return sendError(res, 404, 'Vendor not found');

    sendSuccess(res, 200, `Vendor ${status}`, vendor);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get pending reviews
// @route   GET /api/admin/reviews
// @access  Admin
exports.getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.approved === 'false') filter.isApproved = false;
    if (req.query.approved === 'true') filter.isApproved = true;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'title images')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    sendPaginated(res, reviews, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Approve/reject review
// @route   PUT /api/admin/reviews/:id/status
// @access  Admin
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );
    if (!review) return sendError(res, 404, 'Review not found');
    sendSuccess(res, 200, `Review ${review.isApproved ? 'approved' : 'rejected'}`, review);
  } catch (error) {
    next(error);
  }
};
