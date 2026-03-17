# ONSK Jewelry — Luxury Multi-Vendor Jewelry Marketplace

> **Keep this repo PRIVATE** — contains credentials and connection strings.

---

## Default Login Credentials

### Admin
| Field    | Value                      |
|----------|---------------------------|
| Email    | admin@luxuryjewelry.com   |
| Password | Admin@123456              |

### Vendor
| Field    | Value                    |
|----------|--------------------------|
| Email    | prajwalmulik31@gmail.com |
| Password | Prajwal@31               |

---

## Backend Environment Variables (`backend/.env`)

```env
PORT=8000
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://prajwalmulik31:007007007@cluster0.wii8fis.mongodb.net/luxury_jewelry?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@luxuryjewelry.com
FROM_NAME=Luxury Jewelry

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Admin Seed
ADMIN_EMAIL=admin@luxuryjewelry.com
ADMIN_PASSWORD=Admin@123456
```

## Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## MongoDB Atlas

- **Username:** prajwalmulik31
- **Password:** 007007007
- **Cluster:** cluster0.wii8fis.mongodb.net
- **Database:** luxury_jewelry

---

## Tech Stack

- **Backend:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, Cloudinary
- **Frontend:** React 18, Vite, TailwindCSS, Framer Motion, Zustand
