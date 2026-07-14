require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-security-tests';
}
