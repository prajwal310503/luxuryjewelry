# VK Jewellers — Premium Diamond & Gold Jewelry Marketplace

<!-- credentials are kept in backend/.env which is gitignored -->

A full-stack luxury jewelry e-commerce platform with admin dashboard, vendor dashboard, and storefront.

---

## Login Credentials

### Admin
| Field    | Value                         |
|----------|-------------------------------|
| URL      | `http://localhost:5173/login` |
| Email    | `admin@luxuryjewelry.com`     |
| Password | `admin@123`                   |
| Access   | Full admin panel              |

> To change admin password — login → Account, or change role/status of any user from **Admin → Users & Roles** page.

### Vendor — VK Jewellers
| Field      | Value                         |
|------------|-------------------------------|
| URL        | `http://localhost:5173/login` |
| Email      | `prajwalmulik31@gmail.com`    |
| Password   | `Prajwal@31`                  |
| Store Name | VK Jewellers                  |
| Access     | Vendor dashboard              |

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas (URI already set in `backend/.env`)

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Seed Database (first time only)
```bash
cd backend
node src/utils/seeder.js          # Categories, attributes, admin user
node src/utils/seedProducts.js    # Sample products + vendor account
node src/seedBlogs.js             # Blog posts
```

---

## Admin Dashboard Pages

| Page        | Route                   |
|-------------|-------------------------|
| Dashboard   | `/admin/dashboard`      |
| Products    | `/admin/products`       |
| Orders      | `/admin/orders`         |
| Vendors     | `/admin/vendors`        |
| Customers   | `/admin/customers`      |
| Categories  | `/admin/categories`     |
| Attributes  | `/admin/attributes`     |
| Banners     | `/admin/banners`        |
| Blog Posts  | `/admin/blog`           |
| CMS Builder | `/admin/cms-builder`    |
| Settings    | `/admin/settings`       |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
PORT=8000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@luxuryjewelry.com
FROM_NAME=Luxury Jewelry

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

FRONTEND_URL=http://localhost:5173

ADMIN_EMAIL=admin@luxuryjewelry.com
ADMIN_PASSWORD=your_admin_password
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion, Zustand |
| Backend  | Node.js, Express, MongoDB, Mongoose, JWT            |
| Storage  | Cloudinary                                          |
| Auth     | JWT + HTTP-only cookies, role-based access control  |

---

## Design System

- **Primary:** `#5a413f` · **Gold:** `#C9A84C` · **Rose Gold:** `#B76E79`
- **Font:** Futura Std / Jost (body), Playfair Display italic (logo)
- **Style:** Glassmorphism, warm luxury palette
