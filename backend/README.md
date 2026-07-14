# VK Jewellers — Backend API

Node.js + Express + MongoDB marketplace backend.

**Repo:** https://github.com/prajwal310503/B2C-Backend

**Frontend repo:** https://github.com/prajwal310503/B2C-Frontend

---

## Quick start

```bash
npm install
cp .env.example .env   # fill MongoDB, JWT, Cloudinary, Razorpay, SMTP
npm run dev            # http://localhost:8000
```

## Test accounts

```bash
npm run seed:logins
```

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.vkjewellers.com | VkAdmin@2026 |
| Vendor | vendor@test.vkjewellers.com | VkVendor@2026 |
| Customer | customer@test.vkjewellers.com | VkCustomer@2026 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Production server |
| `npm run test:all` | All API tests (87 tests) |
| `npm run seed:logins` | Create/reset 3-role test logins |

## Deploy (Render / VPS)

- **Build:** `npm install`
- **Start:** `node server.js`
- Set env vars from `.env.example`
- Set `FRONTEND_URL` to your frontend URL
- Set `NODE_ENV=production`

### Nginx (VPS)

See `deploy/nginx/vk-jewellers.conf` for reverse proxy + static cache setup.

## API base

`/api` — auth, products, orders, vendor, admin, coupons, reports, CMS, etc.

## Tech

Express, Mongoose, JWT, Cloudinary, Razorpay, Helmet, rate limiting
