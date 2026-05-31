const SupportTicket = require('../models/SupportTicket');
const { sendSuccess, sendError } = require('../utils/response');
const { getFileUrl } = require('../config/cloudinary');

// @route  POST /api/support
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, body, reason } = req.body;
    if (!subject?.trim() || !body?.trim()) return sendError(res, 400, 'Subject and body are required');

    const image = req.file ? getFileUrl(req.file) : undefined;
    const ticket = await SupportTicket.create({ user: req.user.id, subject, body, reason, image });
    sendSuccess(res, 201, 'Ticket submitted', ticket);
  } catch (e) { next(e); }
};

// @route  GET /api/support/my
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
    sendSuccess(res, 200, 'Tickets fetched', tickets);
  } catch (e) { next(e); }
};

// @route  GET /api/support/:id
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user.id });
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    sendSuccess(res, 200, 'Ticket fetched', ticket);
  } catch (e) { next(e); }
};

// ── Admin ──────────────────────────────────────────────────────────────────

// @route  GET /api/support/admin/all
exports.adminGetAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    sendSuccess(res, 200, 'Tickets fetched', tickets, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
};

// @route  PUT /api/support/admin/:id/reply
exports.adminReply = async (req, res, next) => {
  try {
    const { message, status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    if (message?.trim()) ticket.replies.push({ by: 'admin', message: message.trim() });
    if (status) ticket.status = status;
    await ticket.save();
    await ticket.populate('user', 'name email');
    sendSuccess(res, 200, 'Reply sent', ticket);
  } catch (e) { next(e); }
};

// @route  GET /api/support/admin/:id
exports.adminGetTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user', 'name email phone');
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    sendSuccess(res, 200, 'Ticket fetched', ticket);
  } catch (e) { next(e); }
};
