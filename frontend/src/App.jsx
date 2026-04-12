import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import PageLoader from './components/ui/PageLoader';

// Layouts
import StorefrontLayout from './components/layout/StorefrontLayout';
import AdminLayout from './admin/components/AdminLayout';
import VendorLayout from './vendor/components/VendorLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Guard
import ProtectedRoute from './components/common/ProtectedRoute';

// Storefront Pages (lazy)
const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const VendorStorePage = lazy(() => import('./pages/VendorStorePage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const StoresListPage = lazy(() => import('./pages/StoresListPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminProducts = lazy(() => import('./admin/pages/Products'));
const AdminProductImages = lazy(() => import('./admin/pages/ProductImages'));
const AdminCategoryImages = lazy(() => import('./admin/pages/CategoryImages'));
const AdminSiteImages = lazy(() => import('./admin/pages/SiteImages'));
const AdminCategories = lazy(() => import('./admin/pages/Categories'));
const AdminCMSBuilder = lazy(() => import('./admin/pages/CMSBuilder'));
const AdminVendors = lazy(() => import('./admin/pages/Vendors'));
const AdminAddProduct = lazy(() => import('./admin/pages/AddProduct'));
const AdminOrders = lazy(() => import('./admin/pages/Orders'));
const AdminCustomers = lazy(() => import('./admin/pages/Customers'));
const AdminReviews = lazy(() => import('./admin/pages/Reviews'));
const AdminAttributes = lazy(() => import('./admin/pages/Attributes'));
const AdminBanners = lazy(() => import('./admin/pages/Banners'));
const AdminBlog = lazy(() => import('./admin/pages/Blog'));
const AdminMenus = lazy(() => import('./admin/pages/Menus'));
const AdminStores = lazy(() => import('./admin/pages/Stores'));
const AdminSettings = lazy(() => import('./admin/pages/Settings'));
const AdminUsers = lazy(() => import('./admin/pages/Users'));

// Vendor Pages
const VendorDashboard = lazy(() => import('./vendor/pages/Dashboard'));
const VendorProducts = lazy(() => import('./vendor/pages/Products'));
const VendorOrders = lazy(() => import('./vendor/pages/Orders'));
const VendorStoreProfile = lazy(() => import('./vendor/pages/StoreProfile'));
const VendorAddProduct = lazy(() => import('./vendor/pages/AddProduct'));
const VendorEditProduct = lazy(() => import('./vendor/pages/EditProduct'));

export default function App() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Storefront */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collections/:slug" element={<CategoryPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vendors/:slug" element={<VendorStorePage />} />
          <Route path="/stores" element={<StoresListPage />} />
          <Route path="/stores/:slug" element={<StorePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/images" element={<AdminProductImages />} />
          <Route path="products/add" element={<AdminAddProduct />} />
          <Route path="products/edit/:id" element={<AdminAddProduct />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/images" element={<AdminCategoryImages />} />
          <Route path="site-images" element={<AdminSiteImages />} />
          <Route path="cms" element={<AdminCMSBuilder />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="attributes" element={<AdminAttributes />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Vendor */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute roles={['vendor']}>
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="products/add" element={<VendorAddProduct />} />
          <Route path="products/edit/:id" element={<VendorEditProduct />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="store" element={<VendorStoreProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
