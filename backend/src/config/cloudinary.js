const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Returns true only when real Cloudinary credentials are configured
function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  return !!(name && name !== 'your_cloudinary_cloud_name' && name.trim() !== '');
}

// Local disk storage fallback (used when Cloudinary is not configured)
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`);
  },
});

// Helper: get a usable URL from a multer file object
function getFileUrl(file) {
  if (!file) return null;
  // Cloudinary storage: file.path is the https:// URL
  if (file.path && file.path.startsWith('http')) return file.path;
  // Local disk storage: absolute URL pointing directly to backend
  if (file.filename) {
    const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
    return `${base}/uploads/${file.filename}`;
  }
  return null;
}

// Creates a fresh multer instance on every request so credential changes take effect immediately
function makeDynamic(params) {
  return {
    single: (field) => (req, res, next) => {
      const upload = isCloudinaryConfigured()
        ? multer({ storage: new CloudinaryStorage({ cloudinary, params }) })
        : multer({ storage: localDiskStorage });
      upload.single(field)(req, res, next);
    },
    array: (field, max) => (req, res, next) => {
      const upload = isCloudinaryConfigured()
        ? multer({ storage: new CloudinaryStorage({ cloudinary, params }) })
        : multer({ storage: localDiskStorage });
      upload.array(field, max)(req, res, next);
    },
  };
}

const uploadProduct = makeDynamic({
  folder: 'luxury_jewelry/products',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
});

const uploadBanner = makeDynamic({
  folder: 'luxury_jewelry/banners',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 1920, height: 800, crop: 'limit', quality: 'auto' }],
});

const uploadAvatar = makeDynamic({
  folder: 'luxury_jewelry/avatars',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
});

// Always-local multer for site images (served from /uploads directly, never Cloudinary)
const uploadSiteImage = {
  single: (field) => (req, res, next) => {
    multer({ storage: localDiskStorage }).single(field)(req, res, next);
  },
};

module.exports = { cloudinary, uploadProduct, uploadBanner, uploadAvatar, uploadSiteImage, isCloudinaryConfigured, getFileUrl };
