const { body } = require('express-validator');
const { sendSuccess, sendError } = require('../utils/response');
const {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  sendBrowserNotification,
} = require('../services/pushService');
const { BrowserNotification } = require('../models/BrowserNotification');

exports.getVapidKey = async (req, res) => {
  sendSuccess(res, 200, 'VAPID public key', { publicKey: getVapidPublicKey() });
};

exports.subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return sendError(res, 400, 'Subscription required');
    await saveSubscription(req.user._id, subscription, req.headers['user-agent'] || '');
    sendSuccess(res, 200, 'Push subscription saved');
  } catch (error) {
    next(error);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    await removeSubscription(req.body.endpoint);
    sendSuccess(res, 200, 'Push subscription removed');
  } catch (error) {
    next(error);
  }
};

exports.adminSend = async (req, res, next) => {
  try {
    const { title, message, link, audience, targetUser, emailAlso } = req.body;
    if (!title?.trim() || !message?.trim()) {
      return sendError(res, 400, 'Title and message are required');
    }
    const result = await sendBrowserNotification({
      title: title.trim(),
      message: message.trim(),
      link: link || '',
      audience: audience || 'customers',
      targetUser: targetUser || null,
      sentBy: req.user._id,
      emailAlso: !!emailAlso,
    });
    sendSuccess(res, 200, 'Notification sent', result);
  } catch (error) {
    next(error);
  }
};

exports.adminHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      BrowserNotification.find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('sentBy', 'name email')
        .lean(),
      BrowserNotification.countDocuments(),
    ]);
    sendSuccess(res, 200, 'Notification history', { items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.validateSend = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];
