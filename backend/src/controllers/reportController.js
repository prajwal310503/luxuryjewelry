const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Store = require('../models/Store');
const { sendSuccess, sendError } = require('../utils/response');

function dateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
}

exports.platformSalesReport = async (req, res, next) => {
  try {
    const match = { 'payment.status': 'paid', ...dateFilter(req.query.startDate, req.query.endDate) };
    const [summary, byVendor, byDay] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalCommission: { $sum: '$commissionAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: '$store', revenue: { $sum: '$total' }, commission: { $sum: '$commissionAmount' }, orders: { $sum: 1 } } },
        { $lookup: { from: 'stores', localField: '_id', foreignField: '_id', as: 'store' } },
        { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
        { $project: { storeName: { $ifNull: ['$store.name', 'Platform'] }, revenue: 1, commission: 1, orders: 1 } },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    sendSuccess(res, 200, 'Sales report', { summary: summary[0] || {}, byVendor, byDay });
  } catch (error) {
    next(error);
  }
};

exports.platformOrderReport = async (req, res, next) => {
  try {
    const match = dateFilter(req.query.startDate, req.query.endDate);
    const byStatus = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);
    const returns = await Order.countDocuments({ ...match, 'returnRequest.status': 'pending' });
    const cancellations = await Order.countDocuments({ ...match, 'cancellationRequest.status': 'pending' });
    sendSuccess(res, 200, 'Order report', { byStatus, pendingReturns: returns, pendingCancellations: cancellations });
  } catch (error) {
    next(error);
  }
};

exports.platformProductReport = async (req, res, next) => {
  try {
    const topProducts = await Product.find({ isActive: true })
      .sort('-totalSold')
      .limit(20)
      .select('title totalSold price rating store')
      .populate('store', 'name');
    sendSuccess(res, 200, 'Product report', { topProducts });
  } catch (error) {
    next(error);
  }
};

exports.platformCustomerReport = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newCustomers, topBuyers] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', 'retailer'] }, createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: '$customer', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', totalSpent: 1, orderCount: 1 } },
      ]),
    ]);
    sendSuccess(res, 200, 'Customer report', { newCustomersLast30Days: newCustomers, topBuyers });
  } catch (error) {
    next(error);
  }
};

exports.platformVendorReport = async (req, res, next) => {
  try {
    const vendors = await Store.aggregate([
      { $match: { status: 'approved' } },
      {
        $lookup: {
          from: 'orders',
          let: { storeId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$store', '$$storeId'] }, 'payment.status': 'paid' } },
            { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
          ],
          as: 'stats',
        },
      },
      { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
      { $project: { name: 1, city: 1, revenue: { $ifNull: ['$stats.revenue', 0] }, orders: { $ifNull: ['$stats.orders', 0] } } },
      { $sort: { revenue: -1 } },
    ]);
    sendSuccess(res, 200, 'Vendor report', { vendors });
  } catch (error) {
    next(error);
  }
};

exports.vendorSalesReport = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    const match = { store: store._id, 'payment.status': 'paid', ...dateFilter(req.query.startDate, req.query.endDate) };
    const [summary, byDay] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$total' }, payout: { $sum: '$vendorPayout' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    sendSuccess(res, 200, 'Vendor sales report', { summary: summary[0] || {}, byDay, store: store.name });
  } catch (error) {
    next(error);
  }
};

exports.vendorProductReport = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    const products = await Product.find({ store: store._id, isActive: true })
      .sort('-totalSold')
      .limit(20)
      .select('title totalSold price stock lowStockThreshold rating');
    const lowStock = products.filter((p) => p.stock <= (p.lowStockThreshold || 5));
    sendSuccess(res, 200, 'Vendor product report', { products, lowStock });
  } catch (error) {
    next(error);
  }
};

exports.vendorCustomerReport = async (req, res, next) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    if (!store) return sendError(res, 404, 'Store not found');
    const customers = await Order.aggregate([
      { $match: { store: store._id } },
      { $group: { _id: '$customer', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
      { $sort: { spent: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', orders: 1, spent: 1 } },
    ]);
    sendSuccess(res, 200, 'Vendor customer report', { customers });
  } catch (error) {
    next(error);
  }
};
