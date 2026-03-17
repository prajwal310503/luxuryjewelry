require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    // intentionally empty — startup log below
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run this to free it:  npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  server.on('listening', () => {
    console.log(`\n🚀 Luxury Jewelry API Server`);
    console.log(`   Mode: ${process.env.NODE_ENV}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   URL:  http://localhost:${PORT}/api\n`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    server.close(() => process.exit(1));
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});
