const Settings = require('../models/Settings');
const { isCloudinaryConfigured } = require('../config/cloudinary');

// Fields that should be masked in GET responses
const SENSITIVE_KEYS = ['api_secret', 'api_key', 'secret_key', 'password', 'webhook_secret'];

function maskData(data) {
  const masked = {};
  for (const [k, v] of Object.entries(data || {})) {
    const isSensitive = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s));
    masked[k] = isSensitive && v ? '••••••••' : v;
  }
  return masked;
}

// GET /api/settings  — returns all groups with masked sensitive values
exports.getSettings = async (req, res) => {
  try {
    const docs = await Settings.find().lean();
    const grouped = {};
    docs.forEach((d) => { grouped[d.group] = maskData(d.data); });

    // Always include cloudinary status
    grouped._status = {
      cloudinary: isCloudinaryConfigured(),
    };

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings/:group  — upsert a group
exports.updateSettings = async (req, res) => {
  try {
    const { group } = req.params;
    const data = req.body;

    // Don't overwrite existing values with masked placeholder
    const existing = await Settings.findOne({ group });
    const merged = { ...(existing?.data || {}) };
    for (const [k, v] of Object.entries(data)) {
      if (v !== '••••••••') merged[k] = v; // only update if not the mask placeholder
    }

    const doc = await Settings.findOneAndUpdate(
      { group },
      { data: merged },
      { upsert: true, new: true }
    );

    // Apply credentials to process.env immediately (no restart needed)
    const { cloudinary } = require('../config/cloudinary');
    if (group === 'cloudinary') {
      if (merged.cloud_name) process.env.CLOUDINARY_CLOUD_NAME = merged.cloud_name;
      if (merged.api_key)    process.env.CLOUDINARY_API_KEY    = merged.api_key;
      if (merged.api_secret) process.env.CLOUDINARY_API_SECRET = merged.api_secret;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
    if (group === 'smtp') {
      if (merged.host)     process.env.SMTP_HOST     = merged.host;
      if (merged.port)     process.env.SMTP_PORT     = merged.port;
      if (merged.email)    process.env.SMTP_EMAIL    = merged.email;
      if (merged.password) process.env.SMTP_PASSWORD = merged.password;
    }
    if (group === 'stripe') {
      if (merged.secret_key)     process.env.STRIPE_SECRET_KEY     = merged.secret_key;
      if (merged.webhook_secret) process.env.STRIPE_WEBHOOK_SECRET = merged.webhook_secret;
    }
    if (group === 'razorpay') {
      if (merged.key_id)     process.env.RAZORPAY_KEY_ID     = merged.key_id;
      if (merged.key_secret) process.env.RAZORPAY_KEY_SECRET = merged.key_secret;
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/settings/status  — quick health check for integrations
exports.getStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        cloudinary: isCloudinaryConfigured(),
        stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key'),
        razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id'),
        smtp: !!(process.env.SMTP_EMAIL && process.env.SMTP_EMAIL !== 'your_email@gmail.com'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
