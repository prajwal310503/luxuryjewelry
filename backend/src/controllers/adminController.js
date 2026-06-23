const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Store = require('../models/Store');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Admin dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Admin
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingProducts,
      recentOrders,
      totalRevenue,
      monthlyRevenue,
      todayRevenue,
      weeklyOrders,
      totalVendors,
      pendingVendors,
      commissionThisMonth,
      topVendors,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', 'retailer'] } }),
      Product.countDocuments({ status: 'approved', isActive: true }),
      Order.countDocuments(),
      Product.countDocuments({ status: 'pending' }),
      Order.find().sort('-createdAt').limit(10).populate('customer', 'name email').populate('store', 'name'),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Store.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'vendor', vendorStatus: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', store: { $ne: null } } },
        { $group: { _id: '$store', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'stores', localField: '_id', foreignField: '_id', as: 'store' } },
        { $unwind: '$store' },
        { $project: { name: '$store.name', revenue: 1, orders: 1 } },
      ]),
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
        totalProducts,
        totalOrders,
        pendingProducts,
        weeklyOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        monthlyOrders: monthlyRevenue[0]?.count || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalVendors,
        pendingVendors,
        commissionThisMonth: commissionThisMonth[0]?.total || 0,
      },
      recentOrders,
      revenueChart,
      ordersByStatus,
      topVendors,
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

// @desc    Admin: Create a new user (any role)
// @route   POST /api/admin/users
// @access  Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;
    if (!name || !email || !password) return sendError(res, 400, 'Name, email and password are required');

    const validRoles = ['admin', 'child_admin', 'retailer'];
    if (role && !validRoles.includes(role)) return sendError(res, 400, 'Invalid role');

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 400, 'Email already registered');

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || undefined,
      role: role || 'retailer',
      permissions: role === 'child_admin' ? (permissions || []) : [],
    });

    const userObj = user.toObject();
    delete userObj.password;
    sendSuccess(res, 201, 'User created', userObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'child_admin', 'retailer'].includes(role)) return sendError(res, 400, 'Invalid role');

    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (String(user._id) === String(req.user.id)) return sendError(res, 400, 'Cannot change your own role');

    user.role = role;
    if (role !== 'child_admin') user.permissions = [];
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, `Role changed to ${role}`, { role: user.role, permissions: user.permissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update child_admin permissions
// @route   PUT /api/admin/users/:id/permissions
// @access  Admin
exports.updateUserPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (user.role !== 'child_admin') return sendError(res, 400, 'Permissions only apply to child_admin users');

    user.permissions = Array.isArray(permissions) ? permissions : [];
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, 'Permissions updated', { permissions: user.permissions });
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

// @desc    Admin: Delete user permanently
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (user.role === 'admin') return sendError(res, 400, 'Cannot delete an admin account');
    if (String(user._id) === String(req.user.id)) return sendError(res, 400, 'Cannot delete your own account');

    await User.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, 'User deleted');
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
