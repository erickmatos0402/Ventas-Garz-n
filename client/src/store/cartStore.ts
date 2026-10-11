import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '../types';
import { StoreTheme } from './themeStore';
import { useThemeStore } from './themeStore';

type CartStoreInner = {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
};

function makeStorageKeyFor(theme: StoreTheme) {
  return `cart-storage-${theme}`;
}

const createCartStoreFor = (theme: StoreTheme) =>
  create<CartStoreInner>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product: Product, quantity: number) => {
          set((state) => {
            const existingItem = state.items.find((item) => item.id === product.id);

            if (existingItem) {
              return {
                items: state.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }

            return {
              items: [...state.items, { ...product, quantity }],
            };
          });
        },

        removeItem: (productId: string) => {
          set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
          }));
        },

        updateQuantity: (productId: string, quantity: number) => {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            ),
          }));
        },

        clearCart: () => {
          set({ items: [] });
        },

        getTotalPrice: () => {
          return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
        },

        getTotalItems: () => {
          return get().items.reduce((sum, item) => sum + item.quantity, 0);
        },
      }),
      {
        name: makeStorageKeyFor(theme),
        storage: createJSONStorage(() => localStorage),
      }
    )
  );

/** Selector del carrito que respeta la tienda actual.
 * Cada tienda conserva su carrito en localStorage (clave `cart-storage-<theme>`),
 * por lo que el carrito se comporta como una única cesta compartida:
 * agregar un producto en una tienda y observarlo en otra resuena en la misma lista de items.
 */
export const useCartStore = (theme: StoreTheme = useThemeStore((s) => s.theme)) =>
  createCartStoreFor(theme);
