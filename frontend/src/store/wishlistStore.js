import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        if (items.some((item) => item._id === product._id)) {
          toast('Already in wishlist');
          return;
        }
        set({ items: [...items, product] });
        toast.success('Added to wishlist');
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item._id !== productId) });
        toast.success('Removed from wishlist');
      },

      toggleItem: (product) => {
        const isInWishlist = get().items.some((item) => item._id === product._id);
        if (isInWishlist) {
          get().removeItem(product._id);
        } else {
          get().addItem(product);
        }
        return !isInWishlist;
      },

      isInWishlist: (productId) => get().items.some((item) => item._id === productId),

      clearWishlist: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    {
      name: 'luxury-wishlist',
    }
  )
);

export default useWishlistStore;
