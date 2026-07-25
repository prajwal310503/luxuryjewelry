const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET);
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getJWTToken();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    permissions: user.permissions || [],
    vendorStatus: user.vendorStatus,
    kyc: user.kyc,
    store: user.store,
    referralCode: user.referralCode,
    referralBalance: user.referralBalance || 0,
    vendorDetails: user.vendorDetails
      ? { shopName: user.vendorDetails.shopName, city: user.vendorDetails.city }
      : undefined,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    data: userResponse,
  });
};

module.exports = { generateToken, sendTokenResponse };
