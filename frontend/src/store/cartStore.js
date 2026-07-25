import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

function stockOf(product) {
  const n = Number(product?.stock);
  return Number.isFinite(n) ? n : 0;
}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variantAttributes = null, selections = null) => {
        if (!product?._id) return;
        const stock = stockOf(product);
        if (stock <= 0) {
          toast.error('This item is out of stock');
          return;
        }

        const { items } = get();
        const selKey = selections ? JSON.stringify(selections) : '';
        const key = `${product._id}${selKey ? '-' + selKey : ''}${variantAttributes ? '-' + JSON.stringify(variantAttributes) : ''}`;
        const existingIndex = items.findIndex((item) => item.key === key);
        const qty = Math.max(1, Number(quantity) || 1);

        if (existingIndex > -1) {
          const newItems = [...items];
          const nextQty = Math.min(stock, newItems[existingIndex].quantity + qty);
          if (nextQty === newItems[existingIndex].quantity) {
            toast.error(`Only ${stock} left in stock`);
            return;
          }
          newItems[existingIndex].quantity = nextQty;
          set({ items: newItems, isOpen: true });
          toast.success('Cart updated');
        } else {
          set({
            items: [...items, {
              key,
              product,
              quantity: Math.min(stock, qty),
              variantAttributes,
              selections,
            }],
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
        const newItems = get().items.map((item) => {
          if (item.key !== key) return item;
          const max = stockOf(item.product);
          if (max > 0 && quantity > max) {
            toast.error(`Only ${max} left in stock`);
            return { ...item, quantity: max };
          }
          return { ...item, quantity };
        });
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

      getShipping: () => 0,

      getTotal: () => get().getSubtotal() + get().getShipping(),

      hasOutOfStock: () => get().items.some((item) => stockOf(item.product) <= 0),
    }),
    {
      name: 'luxury-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
