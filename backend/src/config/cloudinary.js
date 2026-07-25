const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isS3Configured, makeS3Storage, getS3FileUrl } = require('./s3');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  return !!(name && name !== 'your_cloud_name' && name !== 'your_cloudinary_cloud_name' && name.trim() !== '');
}

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`);
  },
});

function getFileUrl(file) {
  if (!file) return null;
  const s3Url = getS3FileUrl(file);
  if (s3Url) return s3Url;
  if (file.path && file.path.startsWith('http')) return file.path;
  if (file.filename) {
    const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
    return `${base}/uploads/${file.filename}`;
  }
  return null;
}

function pickStorage(cloudinaryParams, s3Folder, allowedExt) {
  if (isS3Configured()) {
    const s3Storage = makeS3Storage(s3Folder, allowedExt);
    if (s3Storage) return s3Storage;
  }
  if (isCloudinaryConfigured()) {
    return new CloudinaryStorage({ cloudinary, params: cloudinaryParams });
  }
  return localDiskStorage;
}

function makeDynamic(cloudinaryParams, s3Folder, allowedExt) {
  return {
    single: (field) => (req, res, next) => {
      const upload = multer({ storage: pickStorage(cloudinaryParams, s3Folder, allowedExt) });
      upload.single(field)(req, res, next);
    },
    array: (field, max) => (req, res, next) => {
      const upload = multer({ storage: pickStorage(cloudinaryParams, s3Folder, allowedExt) });
      upload.array(field, max)(req, res, next);
    },
    fields: (fieldList) => (req, res, next) => {
      const upload = multer({ storage: pickStorage(cloudinaryParams, s3Folder, allowedExt) });
      upload.fields(fieldList)(req, res, next);
    },
  };
}

const imgExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const videoExt = ['.mp4', '.mov', '.webm', '.avi'];

const uploadProduct = makeDynamic(
  {
    folder: 'luxury_jewelry/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
  'luxury_jewelry/products',
  imgExt
);

const uploadBanner = makeDynamic(
  {
    folder: 'luxury_jewelry/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 800, crop: 'limit', quality: 'auto' }],
  },
  'luxury_jewelry/banners',
  imgExt
);

const uploadAvatar = makeDynamic(
  {
    folder: 'luxury_jewelry/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  },
  'luxury_jewelry/avatars',
  imgExt
);

const uploadSiteImage = makeDynamic(
  {
    folder: 'luxury_jewelry/site',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ quality: 'auto' }],
  },
  'luxury_jewelry/site',
  imgExt
);

const uploadVideo = makeDynamic(
  {
    folder: 'luxury_jewelry/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm', 'avi'],
  },
  'luxury_jewelry/videos',
  videoExt
);

module.exports = {
  cloudinary,
  uploadProduct,
  uploadBanner,
  uploadAvatar,
  uploadSiteImage,
  uploadVideo,
  isCloudinaryConfigured,
  isS3Configured,
  getFileUrl,
};
