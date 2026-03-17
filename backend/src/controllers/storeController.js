const Store = require('../models/Store');
const { getFileUrl } = require('../config/cloudinary');

const slugify = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((v) => v.trim()).filter(Boolean); }
  }
  return [];
};

// ── Public ──────────────────────────────────────────────────────────────────
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).sort('-isFeatured -createdAt');
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStoreBySlug = async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug, isActive: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin ────────────────────────────────────────────────────────────────────
exports.adminGetStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('vendor', 'name email').sort('-createdAt');
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminCreateStore = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = getFileUrl(req.file);
    if (!body.slug && body.name) body.slug = slugify(body.name);
    if (body.facilities) body.facilities = parseArray(body.facilities);
    if (body.services)   body.services   = parseArray(body.services);
    const store = await Store.create(body);
    res.status(201).json({ success: true, data: store });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminUpdateStore = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = getFileUrl(req.file);
    if (body.facilities) body.facilities = parseArray(body.facilities);
    if (body.services)   body.services   = parseArray(body.services);
    const store = await Store.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminDeleteStore = async (req, res) => {
  try {
    await Store.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Store deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminToggleStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    store.isActive = !store.isActive;
    await store.save();
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Vendor ───────────────────────────────────────────────────────────────────
exports.vendorGetStore = async (req, res) => {
  try {
    const store = await Store.findOne({ vendor: req.user.id });
    res.json({ success: true, data: store || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.vendorUpsertStore = async (req, res) => {
  try {
    const body = { ...req.body, vendor: req.user.id };
    if (req.file) body.image = getFileUrl(req.file);
    if (!body.slug && body.name) body.slug = slugify(body.name);
    if (body.facilities) body.facilities = parseArray(body.facilities);
    if (body.services)   body.services   = parseArray(body.services);

    let store = await Store.findOne({ vendor: req.user.id });
    if (store) {
      store = await Store.findByIdAndUpdate(store._id, body, { new: true });
    } else {
      store = await Store.create(body);
    }
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
