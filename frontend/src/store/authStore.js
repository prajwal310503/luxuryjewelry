import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
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
          toast.error(error.response?.data?.message || error.message || 'Login failed');
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
        set({ user: null, token: null });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data.user || data.data });
        } catch (_) {
          get().logout();
        }
      },

      updateUser: (user) => set({ user }),

      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',
      isChildAdmin: () => get().user?.role === 'child_admin',
      isRetailer: () => get().user?.role === 'retailer',
      hasPermission: (perm) => {
        const u = get().user;
        if (!u) return false;
        if (u.role === 'admin') return true;
        return (u.permissions || []).includes(perm);
      },
    }),
    {
      name: 'luxury-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
