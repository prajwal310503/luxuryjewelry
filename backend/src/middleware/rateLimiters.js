const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

/** Global API throttle — always on (lighter in dev). */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 2000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/** Auth routes — login/register/forgot-password. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 80 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

/** Brute-force guard on login only — successful logins are not counted. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 15 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

/** Admin & sensitive write endpoints. */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 600 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many admin requests. Please slow down.' },
});

module.exports = { apiLimiter, authLimiter, loginLimiter, adminLimiter };
