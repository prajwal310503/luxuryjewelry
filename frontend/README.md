# VK Jewellers — Frontend

React 18 + Vite storefront, admin panel, and vendor portal.

**Repo:** https://github.com/prajwal310503/B2C-Frontend

**Backend repo:** https://github.com/prajwal310503/B2C-Backend

---

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev            # http://localhost:5173
```

Default API: `http://localhost:8000/api`

## Test logins

Use accounts from backend `npm run seed:logins`:

| Role | Email | Password | Panel |
|------|-------|----------|-------|
| Admin | admin@test.vkjewellers.com | VkAdmin@2026 | `/admin/dashboard` |
| Vendor | vendor@test.vkjewellers.com | VkVendor@2026 | `/vendor/dashboard` |
| Customer | customer@test.vkjewellers.com | VkCustomer@2026 | `/account` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Client + SSR build |
| `npm run test` | Vitest (route protection tests) |
| `npm run start:ssr` | Production SSR server |

## Deploy (Vercel)

1. Connect this repo (root = project root)
2. Env: `VITE_API_URL=https://your-api.com/api`
3. Build: `npm run build`
4. Output: `dist/client`

## Key routes

| Area | Routes |
|------|--------|
| Storefront | `/`, `/products/:slug`, `/cart`, `/checkout` |
| Customer | `/account`, `/orders`, `/wishlist` |
| Vendor | `/vendor/dashboard`, `/vendor/products`, `/vendor/orders` |
| Admin | `/admin/dashboard`, `/admin/products`, `/admin/vendors` |

## Tech

React, Vite, TailwindCSS, Zustand, React Router, Axios
