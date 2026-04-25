# VK Jewellers — Premium Diamond & Gold Jewelry Platform

---

## Admin Login

| Field    | Value                         |
|----------|-------------------------------|
| URL      | `http://localhost:5173/login` |
| Email    | `admin@vkjewellers.com`       |
| Password | `admin@123`                   |

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally on port `27017`

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
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
node src/utils/seeder.js       # Categories, attributes, admin user
node src/seedBlogs.js          # Blog posts
```

---

## Roles

| Role          | Description                                              |
|---------------|----------------------------------------------------------|
| `admin`       | Full access to all admin pages                           |
| `child_admin` | Staff — access controlled via permission toggles         |
| `retailer`    | Submit quote requests, view confirmed orders             |

---

## Quote → Order Flow

1. Retailer submits a quote with product names + quantities
2. Admin reviews, edits item prices, sets total
3. Admin confirms → Order auto-created from the quote
4. Retailer views their order under **My Orders**

---

## Admin Dashboard Pages

| Page           | Route                    |
|----------------|--------------------------|
| Dashboard      | `/admin/dashboard`       |
| Products       | `/admin/products`        |
| Orders         | `/admin/orders`          |
| Quotes         | `/admin/quotes`          |
| Users & Roles  | `/admin/users`           |
| Customers      | `/admin/customers`       |
| Categories     | `/admin/categories`      |
| Attributes     | `/admin/attributes`      |
| Banners        | `/admin/banners`         |
| Blog Posts     | `/admin/blog`            |
| CMS Builder    | `/admin/cms-builder`     |
| Settings       | `/admin/settings`        |

---

## Environment Variables

`backend/.env`

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/vkjewellers

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FRONTEND_URL=http://localhost:5173

ADMIN_EMAIL=admin@vkjewellers.com
ADMIN_PASSWORD=admin@123
```

`frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
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

## Design Tokens

- **Primary:** `#5a413f` · **Gold:** `#C9A84C` · **Rose Gold:** `#B76E79`
- **Font:** Playfair Display (headings), Inter (body)
