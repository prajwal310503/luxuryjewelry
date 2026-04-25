const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) return sendError(res, 401, 'Not authorized. No token provided.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return sendError(res, 401, 'User not found. Token invalid.');
    if (!user.isActive) return sendError(res, 403, 'Account has been deactivated.');

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Not authorized. Token invalid or expired.');
  }
};

// Strict role check
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, `Role '${req.user.role}' is not authorized for this action.`);
    }
    next();
  };
};

// Permission gate: admin always passes; child_admin passes only if they hold the required permission(s)
const requirePermission = (...perms) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.user.role === 'child_admin') {
      const hasAll = perms.every((p) => (req.user.permissions || []).includes(p));
      if (hasAll) return next();
    }
    return sendError(res, 403, 'You do not have permission for this action.');
  };
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {}
  }
  next();
};

module.exports = { protect, authorize, requirePermission, optionalAuth };
