import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const MyAddressesPage   = lazy(() => import('./pages/MyAddressesPage'));
const MySupportPage     = lazy(() => import('./pages/MySupportPage'));

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
const AdminSupport  = lazy(() => import('./admin/pages/Support'));
const AdminUsers = lazy(() => import('./admin/pages/Users'));
const AdminVendors = lazy(() => import('./admin/pages/VendorManagement'));
const AdminMasterData = lazy(() => import('./admin/pages/MasterData'));
const AdminCoupons = lazy(() => import('./admin/pages/Coupons'));
const AdminReports = lazy(() => import('./admin/pages/Reports'));

// Marketplace / Become-a-Seller Pages
const BecomeSellerPage = lazy(() => import('./pages/BecomeSellerPage'));
const VendorRegisterPage = lazy(() => import('./pages/VendorRegisterPage'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

// Vendor Portal Pages
const VendorDashboard = lazy(() => import('./vendor/pages/VendorDashboard'));
const VendorProducts  = lazy(() => import('./vendor/pages/VendorProducts'));
const VendorOrders    = lazy(() => import('./vendor/pages/VendorOrders'));
const VendorPricing   = lazy(() => import('./vendor/pages/VendorPricing'));
const VendorAnalytics = lazy(() => import('./vendor/pages/VendorAnalytics'));
const VendorAddProduct = lazy(() => import('./vendor/pages/VendorAddProduct'));
const VendorKyc = lazy(() => import('./vendor/pages/VendorKyc'));


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const { bootstrapAuth } = useAuthStore();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    bootstrapAuth();
  }, [bootstrapAuth]);

  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        {/* Storefront */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collections/:slug" element={<CategoryPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stores" element={<Navigate to="/" replace />} />
          <Route path="/stores/:slug" element={<Navigate to="/" replace />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/become-a-seller" element={<BecomeSellerPage />} />
          <Route path="/about" element={<StaticPage pageKey="about" />} />
          <Route path="/contact" element={<StaticPage pageKey="contact" />} />
          <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
          <Route path="/terms" element={<StaticPage pageKey="terms" />} />
          <Route path="/faq" element={<StaticPage pageKey="faq" />} />
          <Route path="/shipping" element={<StaticPage pageKey="shipping" />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
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
          <Route
            path="/my-addresses"
            element={
              <ProtectedRoute>
                <MyAddressesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <MySupportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/my-quotes" element={<Navigate to="/orders" replace />} />
          <Route path="/request-quote" element={<Navigate to="/" replace />} />
          <Route path="/quotes/:id" element={<Navigate to="/orders" replace />} />
          <Route path="/quotes/:id/pay" element={<Navigate to="/orders" replace />} />
          <Route path="/quote-success" element={<Navigate to="/" replace />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
        </Route>

        {/* Vendor Registration (public) */}
        <Route path="/vendor/register" element={<VendorRegisterPage />} />

        {/* Vendor Portal (protected: vendor role) */}
        <Route
          path="/vendor/dashboard"
          element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>}
        />
        <Route
          path="/vendor/kyc"
          element={<ProtectedRoute roles={['vendor']}><VendorKyc /></ProtectedRoute>}
        />
        <Route
          path="/vendor/products"
          element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>}
        />
        <Route
          path="/vendor/orders"
          element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>}
        />
        <Route
          path="/vendor/store"
          element={<ProtectedRoute roles={['vendor']}><Navigate to="/vendor/dashboard" replace /></ProtectedRoute>}
        />
        <Route
          path="/vendor/pricing"
          element={<ProtectedRoute roles={['vendor']}><VendorPricing /></ProtectedRoute>}
        />
        <Route
          path="/vendor/analytics"
          element={<ProtectedRoute roles={['vendor']}><VendorAnalytics /></ProtectedRoute>}
        />
        <Route
          path="/vendor/products/add"
          element={<ProtectedRoute roles={['vendor']}><VendorAddProduct /></ProtectedRoute>}
        />
        <Route
          path="/vendor/products/edit/:id"
          element={<ProtectedRoute roles={['vendor']}><VendorAddProduct /></ProtectedRoute>}
        />
        <Route
          path="/vendor/coupons"
          element={<ProtectedRoute roles={['vendor']}><Navigate to="/vendor/dashboard" replace /></ProtectedRoute>}
        />

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
          <Route path="products/add"        element={<Navigate to="/admin/products" replace />} />
          <Route path="products/edit/:id"   element={<Navigate to="/admin/products" replace />} />
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
          <Route path="support"             element={<ProtectedRoute roles={['admin', 'child_admin']} permission="orders"><AdminSupport /></ProtectedRoute>} />
          {/* Shared: admin + child_admin with permissions */}
          <Route path="orders"  element={<ProtectedRoute roles={['admin', 'child_admin']} permission="orders"><AdminOrders /></ProtectedRoute>} />
          <Route path="quotes" element={<Navigate to="/admin/orders" replace />} />
          <Route path="vendors"     element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
          <Route path="master-data" element={<ProtectedRoute roles={['admin']}><AdminMasterData /></ProtectedRoute>} />
          <Route path="coupons"     element={<ProtectedRoute roles={['admin']}><AdminCoupons /></ProtectedRoute>} />
          <Route path="reports"     element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
