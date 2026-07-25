const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');
const { sendWelcomeEmail } = require('../services/emailService');
const { ensureReferralCode } = require('../utils/referral');

const client = () => {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return null;
  return new OAuth2Client(id);
};

/**
 * Verify Google ID token and login / register customer.
 * Body: { credential } — JWT from Google Identity Services
 * Optional: { referralCode }
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential, referralCode } = req.body;
    if (!credential) return sendError(res, 400, 'Google credential is required');

    const oauth = client();
    if (!oauth) {
      return sendError(res, 503, 'Google login is not configured. Set GOOGLE_CLIENT_ID on the server.');
    }

    const ticket = await oauth.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return sendError(res, 400, 'Invalid Google token');

    const email = String(payload.email).toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture || '';

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (!user.isActive) {
        return sendError(res, 403, 'Account has been deactivated. Contact support.');
      }
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider || 'google';
      }
      if (!user.isEmailVerified && payload.email_verified) {
        user.isEmailVerified = true;
      }
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save({ validateBeforeSave: false });
      await ensureReferralCode(user);
      return sendTokenResponse(user, 200, res, 'Logged in with Google');
    }

    let referredBy = null;
    if (referralCode && String(referralCode).trim()) {
      const referrer = await User.findOne({
        referralCode: String(referralCode).trim().toUpperCase(),
        isActive: true,
      });
      if (referrer && referrer.email !== email) referredBy = referrer._id;
    }

    user = await User.create({
      name,
      email,
      googleId,
      authProvider: 'google',
      avatar: avatar || undefined,
      role: 'customer',
      isEmailVerified: !!payload.email_verified,
      referredBy,
    });

    await ensureReferralCode(user);

    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/`;
      await sendWelcomeEmail(user, verificationUrl);
    } catch (_) {
      /* non-critical */
    }

    return sendTokenResponse(user, 201, res, 'Account created with Google');
  } catch (error) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return sendError(res, 401, 'Google sign-in expired. Please try again.');
    }
    next(error);
  }
};

exports.getGoogleClientId = (req, res) => {
  sendSuccess(res, 200, 'Google client id', {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    enabled: !!process.env.GOOGLE_CLIENT_ID,
  });
};
