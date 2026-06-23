# Scope of Work — VK Jewellers B2C Marketplace Platform

**Project Type:** Multi-Vendor B2C Jewellery Marketplace
**Reference Design:** https://www.lucirajewelry.com/
**Model:** Marketplace — Multiple Jewellery Shops → Single Platform → Customers

---

## 1. Platform Overview

A multi-vendor online jewellery marketplace where individual jewellery shop owners (Client Admins) register their stores, list their products, and receive orders — all managed under one platform owned by the Super Admin. Customers can browse products from all stores and purchase seamlessly.

```
┌─────────────────────────────────────────────────────┐
│              VK JEWELLERS MARKETPLACE               │
├──────────────┬──────────────────┬───────────────────┤
│  SUPER ADMIN │   CLIENT ADMIN   │     CUSTOMER      │
│  (Platform   │  (Jewellery Shop │  (Buyer - anyone  │
│   Owner)     │   Owner)         │   who registers)  │
└──────────────┴──────────────────┴───────────────────┘
```

---

## 2. User Roles & Responsibilities

### 2.1 Super Admin (Platform Owner)
- Owns and operates the entire marketplace
- Approves or rejects jewellery shops (Client Admins)
- Sets platform-wide commission rates per vendor
- Manages global master data (metal rates, purity masters, gemstone masters)
- Controls price sync formula across all vendors
- Views platform-wide reports (all vendors combined)
- Manages CMS pages, banners, and homepage content
- Can suspend/activate any vendor or customer account

### 2.2 Client Admin (Jewellery Shop Owner)
- Registers on the platform and creates their own shop/store
- Waits for Super Admin approval before going live
- Adds and manages their own products with variants (size, weight, purity, metal type)
- Manages their own inventory, orders, and customers
- Can set their own making charges on top of the platform's base metal price formula
- Views their own store's orders, revenue, and reports
- Cannot see other vendors' data

### 2.3 Customer (Buyer)
- Registers/logs in on the marketplace
- Browses products from all shops on a single storefront
- Can filter by shop, metal type, category, price, etc.
- Adds to cart from one or multiple shops
- Checkout, payment, and order tracking per shop order
- Manages wishlist, addresses, profile, and order history

---

## 3. Customer-Facing Website (Marketplace Frontend)

### 3.1 Home Page

| # | Section | Description |
|---|---|---|
| 1 | **Banner Slider** | Full-width hero banners managed by Super Admin — promotions, featured vendors |
| 2 | **Featured Products** | Curated products from across all shops, selected by Super Admin |
| 3 | **New Arrivals** | Latest products added by any vendor, auto-populated |
| 4 | **Best Selling Products** | Ranked by platform-wide order volume |
| 5 | **Categories Section** | Visual grid — Rings, Earrings, Necklaces, Bangles, etc. |
| 6 | **Featured Shops / Vendors** | Highlighted jewellery shops on the marketplace |
| 7 | **About Us Section** | Platform brand story snippet, link to full page |
| 8 | **Testimonials** | Customer reviews carousel |
| 9 | **Contact Information** | Platform contact details, map embed |

---

### 3.2 Product Browsing & Discovery

| # | Feature | Description |
|---|---|---|
| 1 | **Product Listing Page** | Grid/list view with sorting, pagination across all vendors |
| 2 | **Product Detail Page** | High-res images, description, specifications, seller info, reviews |
| 3 | **Product Variants** | Size, Weight, Purity, Metal Color — price updates live per selection |
| 4 | **Product Search** | Keyword search across all shops with instant suggestions |
| 5 | **Product Filters** | Category, Metal Type, Purity, Price Range, Gemstone, Vendor/Shop |
| 6 | **Shop/Vendor Page** | Dedicated page per jewellery shop — their profile, products, ratings |
| 7 | **Wishlist** | Save products from any shop; requires login |

---

### 3.3 Customer Account Features

| # | Feature | Description |
|---|---|---|
| 1 | **Registration** | Email + password signup with email verification |
| 2 | **Login** | Email/password with JWT auth |
| 3 | **Forgot Password** | Email-based reset link |
| 4 | **Profile Management** | Update name, phone, profile photo |
| 5 | **Address Management** | Add/edit/delete multiple shipping addresses |
| 6 | **Order History** | All past orders with status, shop name, and invoice |
| 7 | **Wishlist Management** | View, manage, and move items to cart |

---

### 3.4 Shopping & Checkout

| # | Feature | Description |
|---|---|---|
| 1 | **Add to Cart** | Add products with selected variants from any shop |
| 2 | **Cart** | View all items; grouped by shop if from multiple vendors |
| 3 | **Checkout Process** | Select address → Apply coupon → Payment → Confirmation |
| 4 | **Coupon Management** | Platform-wide or shop-specific coupons applied at checkout |
| 5 | **Order Tracking** | Real-time status per shop-order (Pending → Shipped → Delivered) |
| 6 | **Invoice Download** | Downloadable PDF invoice per order/sub-order |

---

### 3.5 Additional Static Pages

| Page |
|---|
| About Us |
| Contact Us (inquiry form) |
| Privacy Policy |
| Terms & Conditions |
| FAQ |
| Vendor/Shop Directory |

---

## 4. Admin Panel

---

### 4.1 Super Admin Panel

#### Dashboard
- Platform-wide revenue (today / this month / all time)
- Total active shops (vendors), total customers, total orders
- Commission earned this month
- Pending vendor approvals
- Recent orders across all shops
- Top-performing vendors

#### Vendor / Shop Management
| Feature | Description |
|---|---|
| View all registered shops | List with status — pending, active, suspended |
| Approve / Reject shop registration | With optional reason message |
| Suspend / Reactivate a shop | With reason |
| View any shop's products and orders | Read-only audit view |
| Set commission rate per vendor | Flat or percentage per sale |

#### Master Data Management
| # | Master | Details |
|---|---|---|
| 1 | Gold with Purity | Rate per gram for 24K, 22K, 18K, 14K |
| 2 | Silver with Purity | Rate per gram for 999, 925, 800 |
| 3 | Rose Gold with Purity | Rate per gram by karat |
| 4 | Platinum with Purity | Rate per gram by grade |
| 5 | Lab-Grown Diamonds | Cut, Clarity, Carat, Colour, Price per carat |
| 6 | Real Diamonds | Cut, Clarity, Carat, Colour, Certification, Price per carat |
| 7 | Gemstone Master | Type, Carat, Cut, Origin, Price per carat |

#### Price Sync Engine (Super Admin Controls)
| Feature | Description |
|---|---|
| **Manual Rate Input** | Super Admin enters today's gold/silver/platinum rate per gram |
| **Price Formula Builder** | Define global formula: `(Metal Weight × Rate × Purity%) + Making Charges + Stone Cost + GST` |
| **Price Sync Button** | One-click sync — recalculates prices for all products across all shops |
| **Vendor Making Charges** | Each vendor can add their own making charge % on top of formula |
| **Sync Log** | History of every sync — who triggered it, old vs new prices |

#### Platform-Wide Reports
| Report | Details |
|---|---|
| Sales Report | Total revenue, commissions, by date range, by vendor |
| Order Report | Order volumes, status breakdown, returns |
| Product Report | Top-selling products across all shops |
| Customer Report | New vs returning, top buyers |
| Vendor Report | Best-performing shops, revenue per vendor |

#### Content Management (CMS)
| Feature |
|---|
| Homepage Banner Management |
| Featured Products curation |
| Featured Shops selection |
| CMS Pages — About Us, Privacy Policy, T&C, FAQ |
| Testimonials Management |

#### Customer Management
| Feature |
|---|
| View all registered customers |
| View customer details and full order history |
| Enable / Disable customer accounts |

#### Coupon Management
| Feature |
|---|
| Create platform-wide coupons (flat / percentage) |
| Set validity, usage limits, minimum order value |
| View coupon usage and analytics |

---

### 4.2 Client Admin Panel (Jewellery Shop Owner)

#### Shop Setup (One-time on Registration)
| Step | Description |
|---|---|
| 1 | Register with business details (shop name, GST, phone, address) |
| 2 | Upload shop logo and banner |
| 3 | Submit for Super Admin approval |
| 4 | On approval — shop goes live and Client Admin gets full panel access |

#### Shop Dashboard
- Today's orders, revenue, pending orders
- Total products listed, low-stock alerts
- Top-selling products
- Customer reviews received

#### Product Management
| Feature | Description |
|---|---|
| Add Product | Title, description, category, images, attributes, variants |
| Edit Product | Update any product detail or variant |
| Delete Product | Soft delete (archived) |
| Product Variants | Combinations of Metal Type, Purity, Size, Weight — each with making charge |
| Product Inventory | Stock tracking per variant, low-stock notifications |
| Bulk Upload | CSV/Excel bulk product import |

#### Order Management
| Feature | Description |
|---|---|
| View Orders | All orders placed for their shop |
| Update Order Status | Pending → Processing → Shipped → Delivered |
| Add Tracking Info | Courier name and tracking number |
| Manage Cancellations | Accept or reject cancellation requests |
| Manage Returns | Approve/reject return requests |
| Download Invoice | Per order PDF invoice |

#### My Shop Reports
| Report |
|---|
| Sales Report (own shop only) |
| Product Performance Report |
| Customer Order Report |

#### Making Charges Setup
| Feature | Description |
|---|---|
| Set making charge per category | E.g. Rings — ₹500/gram, Earrings — ₹400/gram |
| Override per product | Custom making charge for specific products |
| Auto price update | When Super Admin syncs metal rates, their final price updates automatically using: `Base Formula Price + Their Making Charge` |

#### Coupon Management (Shop-Specific)
| Feature |
|---|
| Create shop-specific discount coupons |
| Set validity and usage limits |

---

## 5. Marketplace Flow Summary

```
CUSTOMER JOURNEY
────────────────
Browse Marketplace → View Products from Multiple Shops
→ Add to Cart (from one or more shops)
→ Checkout (single payment, split by shop internally)
→ Each shop gets their sub-order to fulfill
→ Customer tracks each shop's order separately
→ Invoice downloaded per shop order

VENDOR JOURNEY
──────────────
Register Shop → Super Admin Approves
→ Upload Products with Variants
→ Making Charges Set
→ Super Admin Syncs Metal Rates → Final Prices Auto-updated
→ Orders Received → Update Status → Deliver
→ Commission deducted → Payout to vendor

SUPER ADMIN JOURNEY
───────────────────
Approve Vendors → Manage Master Rates
→ Sync Prices (one button, all shops updated)
→ Manage Platform CMS & Banners
→ Monitor Platform-Wide Reports
→ Handle Escalations
```

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (React Router, Redux Toolkit / Context API) |
| **Backend** | Node.js + Express.js (REST API) |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (role-based: superadmin / clientadmin / customer) |
| **File Storage** | Cloudinary / AWS S3 (product images, shop logos, banners) |
| **Payment Gateway** | Razorpay / PayU (multi-vendor split payment support) |
| **Email Service** | Nodemailer + SMTP / SendGrid |
| **PDF Generation** | PDFKit / Puppeteer (order invoices) |
| **Hosting** | AWS / DigitalOcean / Vercel + Railway |

---

## 7. Third-Party Integrations

| # | Service | Purpose |
|---|---|---|
| 1 | **Razorpay / PayU** | Online payment processing |
| 2 | **Cloudinary / AWS S3** | Image storage and CDN delivery |
| 3 | **SendGrid / SMTP** | Transactional emails (OTP, order confirmation, vendor alerts) |
| 4 | **MSG91 / Fast2SMS** | OTP and order SMS notifications |
| 5 | **Google Maps API** | Store location embed on Contact page |
| 6 | **Live Metal Rate API** | Optional — auto-fetch gold/silver rates (e.g., Metals API) |

---

## 8. Access Control Matrix

| Feature | Super Admin | Client Admin | Customer |
|---|---|---|---|
| Approve / Manage Vendors | ✅ | ❌ | ❌ |
| Global Master Data & Price Sync | ✅ | ❌ | ❌ |
| Set Commission Rates | ✅ | ❌ | ❌ |
| Platform-Wide Reports | ✅ | ❌ | ❌ |
| CMS / Homepage Banners | ✅ | ❌ | ❌ |
| Manage Own Shop Products | ✅ | ✅ | ❌ |
| Manage Own Shop Orders | ✅ | ✅ | ❌ |
| Set Making Charges | ✅ | ✅ | ❌ |
| Own Shop Reports | ✅ | ✅ | ❌ |
| Browse & Purchase Products | ✅ | ✅ | ✅ |
| Wishlist & Cart | ✅ | ✅ | ✅ |
| Manage Own Profile & Orders | ✅ | ✅ | ✅ |

---

## 9. Design Reference & UI Guidelines

Inspired by **[lucirajewelry.com](https://www.lucirajewelry.com/)**:

| Aspect | Detail |
|---|---|
| **Colour Palette** | Gold, Cream, Off-White, Deep Black for contrast |
| **Typography** | Elegant serif for headings, clean sans-serif for body |
| **Layout** | Full-width hero banners, clean product grids, generous whitespace |
| **Navigation** | Sticky header with logo, search bar, wishlist icon, cart icon, login |
| **Product Cards** | Hover zoom, quick-add to wishlist, price display with metal purity |
| **Responsiveness** | Mobile-first, fully responsive across all screen sizes |
| **Animations** | Smooth page transitions, hover effects, loading skeletons |
| **Shop Pages** | Each vendor gets a branded shop page with their logo, banner, products |

---

*Scope of Work — VK Jewellers B2C Marketplace | Version 2.0*
