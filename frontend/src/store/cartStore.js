import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variantAttributes = null) => {
        const { items } = get();
        const key = variantAttributes ? `${product._id}-${JSON.stringify(variantAttributes)}` : product._id;
        const existingIndex = items.findIndex((item) => item.key === key);

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems, isOpen: true });
          toast.success('Cart updated');
        } else {
          set({
            items: [...items, { key, product, quantity, variantAttributes }],
            isOpen: true,
          });
          toast.success('Added to cart');
        }
      },

      removeItem: (key) => {
        set({ items: get().items.filter((item) => item.key !== key) });
        toast.success('Removed from cart');
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        const newItems = get().items.map((item) =>
          item.key === key ? { ...item, quantity } : item
        );
        set({ items: newItems });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getSubtotal: () =>
        get().items.reduce((total, item) => {
          const price = item.product.discountedPrice ?? item.product.price;
          return total + price * item.quantity;
        }, 0),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getShipping: () => (get().getSubtotal() >= 5000 ? 0 : 199),

      getTotal: () => get().getSubtotal() + get().getShipping(),
    }),
    {
      name: 'luxury-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
