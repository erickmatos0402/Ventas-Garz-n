import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_PRODUCTS } from '../data/mockData';
import { Product } from '../types';

interface MockAdminStore {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

/**
 * Store de productos de la DEMO (datos falsos).
 * Reemplaza temporalmente las llamadas a adminService/productService.
 * Los cambios (incluida la imagen de cada producto) se guardan en
 * localStorage, así sobreviven a las recargas de la página.
 */
export const useMockAdminStore = create<MockAdminStore>()(
  persist(
    (set) => ({
      products: [...MOCK_PRODUCTS],

      addProduct: (product) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...product, id: `p${Date.now()}` },
          ],
        })),

      updateProduct: (product) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
    }),
    {
      name: 'mock-admin-products',
      version: 1,
      // Si cambia la versión del catálogo base, se descartan los datos viejos
      migrate: () => ({ products: [...MOCK_PRODUCTS] }),
    }
  )
);
