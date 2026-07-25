import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

function productId(p) {
  return String(p?._id || p || '');
}

async function pushWishlistToServer(items) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return;
  const ids = items.map(productId).filter(Boolean);
  try {
    await authAPI.setWishlist(ids);
  } catch (_) { /* keep local */ }
}

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,

      /** Merge server wishlist into local after login / bootstrap */
      syncFromServer: async () => {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        set({ syncing: true });
        try {
          const { data } = await authAPI.getWishlist();
          const serverItems = data.data?.items || [];
          const byId = new Map();
          get().items.forEach((p) => byId.set(productId(p), p));
          serverItems.forEach((p) => {
            const id = productId(p);
            if (!id) return;
            byId.set(id, byId.has(id) ? { ...byId.get(id), ...p } : p);
          });
          const merged = [...byId.values()];
          set({ items: merged });
          await pushWishlistToServer(merged);
        } catch (_) {
          /* guest / offline */
        } finally {
          set({ syncing: false });
        }
      },

      addItem: async (product) => {
        const { items } = get();
        if (items.some((item) => productId(item) === productId(product))) {
          toast('Already in wishlist');
          return;
        }
        const next = [...items, product];
        set({ items: next });
        toast.success('Added to wishlist');
        await pushWishlistToServer(next);
      },

      removeItem: async (id) => {
        const pid = productId(id);
        const next = get().items.filter((item) => productId(item) !== pid);
        set({ items: next });
        toast.success('Removed from wishlist');
        await pushWishlistToServer(next);
      },

      toggleItem: async (product) => {
        const isIn = get().items.some((item) => productId(item) === productId(product));
        if (isIn) await get().removeItem(product._id);
        else await get().addItem(product);
        return !isIn;
      },

      isInWishlist: (id) => get().items.some((item) => productId(item) === productId(id)),

      clearWishlist: async () => {
        set({ items: [] });
        await pushWishlistToServer([]);
      },

      count: () => get().items.length,
    }),
    {
      name: 'luxury-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useWishlistStore;
