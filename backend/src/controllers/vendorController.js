const Product = require('../models/Product');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Vendor dashboard stats
// @route   GET /api/vendor/dashboard
// @access  Vendor
exports.getVendorDashboard = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return sendError(res, 404, 'Vendor profile not found');

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      pendingProducts,
      approvedProducts,
      totalOrders,
      weeklyOrders,
      revenueData,
      monthlyRevenueData,
    ] = await Promise.all([
      Product.countDocuments({ vendor: vendor._id }),
      Product.countDocuments({ vendor: vendor._id, status: 'pending' }),
      Product.countDocuments({ vendor: vendor._id, status: 'approved', isActive: true }),
      Order.countDocuments({ 'items.vendor': vendor._id }),
      Order.countDocuments({ 'items.vendor': vendor._id, createdAt: { $gte: sevenDaysAgo } }),
      Order.aggregate([
        { $match: { 'items.vendor': vendor._id, 'payment.status': 'paid' } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendor._id } },
        { $group: { _id: null, total: { $sum: '$items.vendorCommission' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            'items.vendor': vendor._id,
            'payment.status': 'paid',
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendor._id } },
        { $group: { _id: null, total: { $sum: '$items.vendorCommission' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Revenue chart last 30 days
    const revenueChart = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendor._id,
          'payment.status': 'paid',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$items.vendorCommission' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent orders
    const recentOrders = await Order.find({ 'items.vendor': vendor._id })
      .sort('-createdAt')
      .limit(8)
      .populate('customer', 'name email')
      .select('orderNumber status total createdAt customer');

    // Low stock products
    const lowStockProducts = await Product.find({
      vendor: vendor._id,
      status: 'approved',
      stock: { $lte: 5, $gt: 0 },
    })
      .select('title stock images sku')
      .limit(5);

    // Out of stock
    const outOfStock = await Product.countDocuments({ vendor: vendor._id, stock: 0 });

    sendSuccess(res, 200, 'Vendor dashboard data', {
      stats: {
        totalProducts,
        pendingProducts,
        approvedProducts,
        totalOrders,
        weeklyOrders,
        outOfStock,
        totalRevenue: revenueData[0]?.total || 0,
        monthlyRevenue: monthlyRevenueData[0]?.total || 0,
        monthlyOrders: monthlyRevenueData[0]?.count || 0,
      },
      revenueChart,
      recentOrders,
      lowStockProducts,
      vendor: {
        storeName: vendor.storeName,
        status: vendor.status,
        isVerified: vendor.isVerified,
        commissionRate: vendor.commissionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
