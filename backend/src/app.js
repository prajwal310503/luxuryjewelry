const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const attributeRoutes = require('./routes/attributes');
const orderRoutes = require('./routes/orders');
const cmsRoutes = require('./routes/cms');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const vendorRoutes = require('./routes/vendor');
const storeRoutes = require('./routes/stores');
const blogRoutes     = require('./routes/blog');
const settingsRoutes = require('./routes/settings');

const app = express();

// ── Sanitise localhost URLs from every API response ───────────────────────────
// Images uploaded locally (before Cloudinary was configured) have URLs like
// http://localhost:8000/uploads/foo.jpg stored in the DB.
// This middleware intercepts res.json() and replaces them with Unsplash
// fallbacks so the live site never requests a localhost resource.
const LOCAL_URL_RE = /http:\/\/localhost:\d+\/uploads\/[^"'\s,)>]+/g;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop&q=80&auto=format';

const FILENAME_FALLBACKS = [
  ['promo-shipping',     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-ring',         'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-consultation', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-bespoke',      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-main',         'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['store-panel2',       'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-panel3',       'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['lifestyle-everyday', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['lifestyle-bridal',   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['banner',             'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&h=800&fit=crop&q=80&auto=format'],
  ['hero',               'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1920&h=1080&fit=crop&q=80&auto=format'],
];

function sanitiseLocalhostUrls(jsonStr) {
  return jsonStr.replace(LOCAL_URL_RE, (match) => {
    const filename = match.split('/uploads/')[1].replace(/\.[^.]+$/, '');
    for (const [hint, url] of FILENAME_FALLBACKS) {
      if (filename.includes(hint)) return url;
    }
    return FALLBACK_IMG;
  });
}

app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body) => {
    try {
      const raw = JSON.stringify(body);
      if (raw.includes('localhost')) {
        return _json(JSON.parse(sanitiseLocalhostUrls(raw)));
      }
    } catch (_) { /* never break the response */ }
    return _json(body);
  };
  next();
});

// Security headers
app.use(helmet());

// CORS — allow localhost in dev + deployed frontend URL(s)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Also allow any *.vercel.app subdomain (Vercel preview deployments)
function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server / curl
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 200,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 20,
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many auth attempts.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve local uploads (used when Cloudinary is not configured)
// Explicitly allow cross-origin loading — overrides helmet's same-origin default
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Luxury Jewelry API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/blog',     blogRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
