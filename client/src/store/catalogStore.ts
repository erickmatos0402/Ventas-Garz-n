import { create } from 'zustand';
import { Product } from '../types';
import { productService } from '../services/catalog';

interface CatalogStore {
  products: Product[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** Carga el catálogo una sola vez (o de nuevo con `force`). */
  fetchProducts: (force?: boolean) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudo completar la operación';

/**
 * Catálogo respaldado por Supabase. Sustituye al antiguo
 * `useMockAdminStore`, que guardaba los productos en localStorage.
 * Tras cada alta/edición/borrado la lista local se actualiza con la fila
 * que devuelve la base de datos, sin recargar la página.
 */
export const useCatalogStore = create<CatalogStore>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,
  error: null,

  fetchProducts: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      const products = await productService.list();
      set({ products, loaded: true, loading: false });
    } catch (error) {
      set({ error: errorMessage(error), loaded: true, loading: false });
    }
  },

  addProduct: async (product) => {
    try {
      const created = await productService.create({ ...product, store: product.store ?? 'market' });
      set((state) => ({ products: [...state.products, created], error: null }));
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    }
  },

  updateProduct: async (product) => {
    try {
      const updated = await productService.update(product.id, product);
      set((state) => ({
        products: state.products.map((item) => (item.id === updated.id ? updated : item)),
        error: null,
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await productService.remove(id);
      set((state) => ({
        products: state.products.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    }
  },
}));
