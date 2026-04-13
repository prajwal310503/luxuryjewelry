import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Sanitise localhost URLs that were saved before Cloudinary was configured ──
const LOCAL_URL_RE = /http:\/\/localhost:\d+\/uploads\/[^"'\s]+/g;
const FALLBACK_MAP = [
  ['promo-shipping',     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-ring',         'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-consultation', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80&auto=format'],
  ['promo-bespoke',      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-main',         'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['store-panel2',       'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop&q=80&auto=format'],
  ['store-panel3',       'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop&q=80&auto=format'],
  ['lifestyle-everyday', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['lifestyle-bridal',   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&h=800&fit=crop&q=80&auto=format'],
  ['banner',             'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&h=800&fit=crop&q=80&auto=format'],
  ['hero',               'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1920&h=1080&fit=crop&q=80&auto=format'],
];
const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop&q=80&auto=format';

function sanitiseResponse(data) {
  try {
    const raw = JSON.stringify(data);
    if (!raw.includes('localhost')) return data;
    const cleaned = raw.replace(LOCAL_URL_RE, (match) => {
      const filename = match.split('/uploads/')[1]?.replace(/\.[^.]+$/, '') || '';
      for (const [hint, url] of FALLBACK_MAP) {
        if (filename.includes(hint)) return url;
      }
      return GENERIC_FALLBACK;
    });
    return JSON.parse(cleaned);
  } catch (_) {
    return data;
  }
}

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => {
    response.data = sanitiseResponse(response.data);
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission for this action');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// ==================== PRODUCTS ====================
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) => api.post(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getVendorProducts: (params) => api.get('/products/vendor/my', { params }),
  // Admin
  adminGetAll: (params) => api.get('/admin/products', { params }),
  adminGetById: (id) => api.get(`/admin/products/${id}`),
  adminCreate: (data) => api.post('/admin/products', data),
  adminUpdate: (id, data) => api.put(`/admin/products/${id}`, data),
  adminUpdateStatus: (id, data) => api.put(`/admin/products/${id}/status`, data),
  adminToggleFeatured:   (id) => api.put(`/admin/products/${id}/featured`),
  adminToggleBestSeller: (id) => api.put(`/admin/products/${id}/bestseller`),
  adminToggleNewArrival: (id) => api.put(`/admin/products/${id}/newarrival`),
  adminToggleLifestyle1: (id) => api.put(`/admin/products/${id}/lifestyle1`),
  adminToggleLifestyle2: (id) => api.put(`/admin/products/${id}/lifestyle2`),
  adminDelete: (id) => api.delete(`/admin/products/${id}`),
  adminRemoveImage: (id, imageIndex) => api.delete(`/admin/products/${id}/images/${imageIndex}`),
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  adminCreate: (data) => api.post('/categories/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adminUpdate: (id, data) => api.put(`/categories/admin/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adminDelete: (id) => api.delete(`/categories/admin/${id}`),
};

// ==================== ATTRIBUTES ====================
export const attributeAPI = {
  getAll: (params) => api.get('/attributes', { params }),
  getById: (id) => api.get(`/attributes/${id}`),
  create: (data) => api.post('/attributes', data),
  update: (id, data) => api.put(`/attributes/${id}`, data),
  delete: (id) => api.delete(`/attributes/${id}`),
  createValue: (attrId, data) => api.post(`/attributes/${attrId}/values`, data),
  updateValue: (attrId, valId, data) => api.put(`/attributes/${attrId}/values/${valId}`, data),
  deleteValue: (attrId, valId) => api.delete(`/attributes/${attrId}/values/${valId}`),
  bulkCreateValues: (attrId, values) => api.post(`/attributes/${attrId}/values/bulk`, { values }),
};

// ==================== ORDERS ====================
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  adminGetAll: (params) => api.get('/orders/admin/all', { params }),
  adminUpdateStatus: (id, data) => api.put(`/orders/admin/${id}/status`, data),
  vendorGetAll: (params) => api.get('/orders/vendor/all', { params }),
};

// ==================== CMS ====================
export const cmsAPI = {
  getPageSections: (page) => api.get(`/cms/pages/${page}`),
  getBanners: (position) => api.get('/cms/banners', { params: { position } }),
  getMenu: (location) => api.get(`/cms/menus/${location}`),
  // Admin
  adminGetSections: (page) => api.get(`/cms/admin/pages/${page}`),
  createSection: (data) => api.post('/cms/admin/sections', data),
  updateSection: (id, data) => api.put(`/cms/admin/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/cms/admin/sections/${id}`),
  reorderSections: (page, data) => api.put(`/cms/admin/pages/${page}/reorder`, data),
  toggleSection: (id) => api.put(`/cms/admin/sections/${id}/toggle`),
  adminGetBanners: () => api.get('/cms/admin/banners'),
  createBanner: (data) => api.post('/cms/admin/banners', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  updateBanner: (id, data) => api.put(`/cms/admin/banners/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  deleteBanner: (id) => api.delete(`/cms/admin/banners/${id}`),
  adminGetMenus: () => api.get('/cms/admin/menus'),
  upsertMenu: (location, data) => api.put(`/cms/admin/menus/${location}`, data),
  // Use native fetch so browser sets correct Content-Type boundary for multipart
  uploadImage: async (formData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cms/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Upload failed');
    return { data: json };
  },
};

// ==================== ADMIN ====================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  changeUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getVendors: (params) => api.get('/admin/vendors', { params }),
  updateVendorStatus: (id, data) => api.put(`/admin/vendors/${id}/status`, data),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  updateReviewStatus: (id, data) => api.put(`/admin/reviews/${id}/status`, data),
  uploadPackageImages: (formData) => api.post('/admin/upload/package-images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadPromoBanner: (formData) => api.post('/admin/upload/promo-banner', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadProductImages: (id, formData) => api.post(`/admin/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCertImage: (formData) => api.post('/admin/upload/cert-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ==================== VENDOR ====================
export const vendorAPI = {
  getDashboard: () => api.get('/vendor/dashboard'),
};

// ==================== REVIEWS ====================
export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ==================== STORES ====================
export const storeAPI = {
  getStores: () => api.get('/stores'),
  getStoreBySlug: (slug) => api.get(`/stores/${slug}`),
  // Admin
  adminGetAll: () => api.get('/stores/admin/all'),
  adminCreate: (data) => api.post('/stores/admin', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  adminUpdate: (id, data) => api.put(`/stores/admin/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  adminDelete: (id) => api.delete(`/stores/admin/${id}`),
  adminToggle: (id) => api.put(`/stores/admin/${id}/toggle`),
  // Vendor
  vendorGetStore: () => api.get('/stores/vendor/my'),
  vendorUpsert: (data) => api.post('/stores/vendor/my', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
};

// ==================== BLOG ====================
// Helper: use native fetch for multipart blog uploads so the browser sets
// the correct Content-Type boundary automatically (Axios overrides it).
async function blogFetch(method, path, data) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Request failed');
  return { data: json };
}

export const blogAPI = {
  getAll: (params) => api.get('/blog', { params }),
  getBySlug: (slug) => api.get(`/blog/${slug}`),
  // Admin
  adminGetAll: () => api.get('/blog/admin/all'),
  adminCreate: (data) => blogFetch('POST', '/blog/admin', data),
  adminUpdate: (id, data) => blogFetch('PUT', `/blog/admin/${id}`, data),
  adminDelete: (id) => api.delete(`/blog/admin/${id}`),
  adminToggle: (id) => api.put(`/blog/admin/${id}/toggle`),
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  getStatus: () => api.get('/settings/status'),
  getAll:    () => api.get('/settings'),
  update:    (group, data) => api.put(`/settings/${group}`, data),
};

export default api;
