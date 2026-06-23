# VK Jewellers — Multi-Vendor Jewelry Marketplace

Full-stack B2C marketplace with admin panel, vendor portal, and customer storefront.

**GitHub:** https://github.com/prajwal310503/luxuryjewelry

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | https://vk-jewellers-arzb.vercel.app |
| Backend  | https://vk-jewellers.onrender.com |
| API      | https://vk-jewellers.onrender.com/api |

---

## Login Credentials (after seeding)

| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@luxuryjewelry.com | admin@123   |
| Vendor | (from seedProducts.js)  | (see .env)  |

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local MongoDB)

### Backend
```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Seed Database (first time)
```bash
cd backend
node src/utils/seeder.js
node src/utils/seedProducts.js
node src/seedBlogs.js
```

---

## Deployment

### Render (Backend)
1. Connect repo → set **Root Directory** to `backend`
2. **Build:** `npm install`
3. **Start:** `node server.js`
4. Add environment variables from `backend/.env.example`
5. Set `FRONTEND_URL` to your Vercel URL
6. Set `NODE_ENV=production`

### Vercel (Frontend)
1. Connect repo → set **Root Directory** to `frontend`
2. Add env: `VITE_API_URL=https://your-backend.onrender.com/api`
3. **Redeploy** after any env change (Vite bakes vars at build time)

### MongoDB Atlas
- **Network Access** → add your IP or `0.0.0.0/0` (dev)
- Copy connection string to `MONGO_URI` on Render

---

## Environment Variables

See `backend/.env.example` for the full list. Required for production:

- `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `BACKEND_URL`
- `CLOUDINARY_*` (image uploads)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (online payments)
- `SMTP_*`, `FROM_EMAIL` (emails)

Frontend only needs `VITE_API_URL`.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, TailwindCSS, Zustand |
| Backend  | Node.js, Express, MongoDB, Mongoose |
| Auth     | JWT + Bearer token |
| Storage  | Cloudinary |
| Payments | Razorpay |

---

## Key Routes

| Area | Routes |
|------|--------|
| Storefront | `/`, `/products/:slug`, `/cart`, `/checkout` |
| Vendor | `/vendor/dashboard`, `/vendor/products`, `/vendor/orders` |
| Admin | `/admin/dashboard`, `/admin/vendors`, `/admin/master-data` |
| Quotes | `/my-quotes`, `/request-quote`, `/admin/quotes` |
