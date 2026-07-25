const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

function isS3Configured() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_access_key'
  );
}

let s3Client = null;
function getS3() {
  if (!isS3Configured()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function makeS3Storage(folder, allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm']) {
  const s3 = getS3();
  if (!s3) return null;
  return multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      if (allowedExt.length && !allowedExt.includes(ext)) {
        return cb(new Error(`File type ${ext} not allowed`));
      }
      const name = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      cb(null, name);
    },
  });
}

function getS3FileUrl(file) {
  if (!file) return null;
  if (file.location) return file.location;
  if (file.key && process.env.AWS_BUCKET_NAME) {
    const region = process.env.AWS_REGION || 'ap-south-1';
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${region}.amazonaws.com/${file.key}`;
  }
  return null;
}

module.exports = { isS3Configured, getS3, makeS3Storage, getS3FileUrl };
