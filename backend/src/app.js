const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { apiLimiter, authLimiter, adminLimiter } = require('./middleware/rateLimiters');
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
const reviewRoutes   = require('./routes/reviews');
const storeRoutes    = require('./routes/stores');
const blogRoutes     = require('./routes/blog');
const settingsRoutes = require('./routes/settings');
const pincodeRoutes  = require('./routes/pincodes');
const supportRoutes  = require('./routes/support');
const vendorRoutes   = require('./routes/vendor');
const masterDataRoutes = require('./routes/masterData');
const couponRoutes   = require('./routes/coupons');
const paymentRoutes  = require('./routes/payments');
const reportRoutes   = require('./routes/reports');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Rewrite localhost upload URLs to relative /uploads paths ─────────────────
// Old DB rows may store http://localhost:8000/uploads/... — convert to /uploads/...
// so Vite proxy / nginx can serve them. Do NOT replace with Unsplash stock photos.
const LOCAL_URL_RE = /http:\/\/localhost:\d+(\/uploads\/[^"'\s,)>]+)/g;

function rewriteLocalUploadUrls(jsonStr) {
  return jsonStr.replace(LOCAL_URL_RE, (_, path) => path);
}

app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body) => {
    try {
      const raw = JSON.stringify(body);
      if (raw.includes('localhost') && raw.includes('/uploads/')) {
        return _json(JSON.parse(rewriteLocalUploadUrls(raw)));
      }
    } catch (_) { /* never break the response */ }
    return _json(body);
  };
  next();
});

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));

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

// Rate limiting — always active (stricter in production)
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

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
  res.json({ success: true, message: 'LUXURY JEWELRY API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/blog',     blogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/support',  supportRoutes);
app.use('/api/vendor',   vendorRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
