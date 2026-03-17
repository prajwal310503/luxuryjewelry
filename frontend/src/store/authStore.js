import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      vendorProfile: null,
      loading: false,

      login: async (credentials) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          set({ user: data.data, token: data.token, loading: false });
          toast.success('Welcome back!');
          return data.data;
        } catch (error) {
          set({ loading: false });
          toast.error(error.message || 'Login failed');
          throw error;
        }
      },

      register: async (userData) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.register(userData);
          localStorage.setItem('token', data.token);
          set({ user: data.data, token: data.token, loading: false });
          toast.success('Account created successfully!');
          return data.data;
        } catch (error) {
          set({ loading: false });
          toast.error(error.message || 'Registration failed');
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (_) {}
        localStorage.removeItem('token');
        set({ user: null, token: null, vendorProfile: null });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data.user, vendorProfile: data.data.vendorProfile });
        } catch (_) {
          get().logout();
        }
      },

      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
      isVendor: () => get().user?.role === 'vendor',
      isCustomer: () => get().user?.role === 'customer',
    }),
    {
      name: 'luxury-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
