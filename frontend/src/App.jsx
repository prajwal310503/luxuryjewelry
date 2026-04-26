import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import PageLoader from './components/ui/PageLoader';

// Layouts
import StorefrontLayout from './components/layout/StorefrontLayout';
import AdminLayout from './admin/components/AdminLayout';
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
const StorePage = lazy(() => import('./pages/StorePage'));
const StoresListPage = lazy(() => import('./pages/StoresListPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const QuoteRequestPage  = lazy(() => import('./pages/QuoteRequestPage'));
const MyQuotesPage      = lazy(() => import('./pages/MyQuotesPage'));
const QuoteSuccessPage  = lazy(() => import('./pages/QuoteSuccessPage'));
const QuotePaymentPage  = lazy(() => import('./pages/QuotePaymentPage'));
const QuoteDetailPage   = lazy(() => import('./pages/QuoteDetailPage'));

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
const AdminQuotes = lazy(() => import('./admin/pages/Quotes'));


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
          <Route path="/quote-success/:id" element={<QuoteSuccessPage />} />
          <Route
            path="/my-quotes"
            element={
              <ProtectedRoute>
                <MyQuotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/:id"
            element={
              <ProtectedRoute>
                <QuoteDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/:id/pay"
            element={
              <ProtectedRoute>
                <QuotePaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/request"
            element={
              <ProtectedRoute roles={['retailer']}>
                <QuoteRequestPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Admin + Child Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'child_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Admin-only pages */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"           element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="products"            element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
          <Route path="products/images"     element={<ProtectedRoute roles={['admin']}><AdminProductImages /></ProtectedRoute>} />
          <Route path="products/add"        element={<ProtectedRoute roles={['admin']}><AdminAddProduct /></ProtectedRoute>} />
          <Route path="products/edit/:id"   element={<ProtectedRoute roles={['admin']}><AdminAddProduct /></ProtectedRoute>} />
          <Route path="categories"          element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="categories/images"   element={<ProtectedRoute roles={['admin']}><AdminCategoryImages /></ProtectedRoute>} />
          <Route path="site-images"         element={<ProtectedRoute roles={['admin']}><AdminSiteImages /></ProtectedRoute>} />
          <Route path="cms"                 element={<ProtectedRoute roles={['admin']}><AdminCMSBuilder /></ProtectedRoute>} />
          <Route path="users"               element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="customers"           element={<ProtectedRoute roles={['admin']}><AdminCustomers /></ProtectedRoute>} />
          <Route path="reviews"             element={<ProtectedRoute roles={['admin']}><AdminReviews /></ProtectedRoute>} />
          <Route path="attributes"          element={<ProtectedRoute roles={['admin']}><AdminAttributes /></ProtectedRoute>} />
          <Route path="banners"             element={<ProtectedRoute roles={['admin']}><AdminBanners /></ProtectedRoute>} />
          <Route path="blog"                element={<ProtectedRoute roles={['admin']}><AdminBlog /></ProtectedRoute>} />
          <Route path="menus"               element={<ProtectedRoute roles={['admin']}><AdminMenus /></ProtectedRoute>} />
          <Route path="stores"              element={<ProtectedRoute roles={['admin']}><AdminStores /></ProtectedRoute>} />
          <Route path="settings"            element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
          {/* Shared: admin + child_admin with permissions */}
          <Route path="orders"  element={<ProtectedRoute roles={['admin', 'child_admin']} permission="orders"><AdminOrders /></ProtectedRoute>} />
          <Route path="quotes"  element={<ProtectedRoute roles={['admin', 'child_admin']} permission="quotes"><AdminQuotes /></ProtectedRoute>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
