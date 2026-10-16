import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Apariencia del sitio: claro u oscuro.
 *
 * Es INDEPENDIENTE del tema de tienda (Mercado / Boutique): `data-theme`
 * elige la paleta de marca y `data-mode` elige si el lienzo es claro u
 * oscuro. Se guardan por separado para que cambiar de tienda no reinicie
 * la apariencia elegida.
 */
export type ColorMode = 'light' | 'dark';

interface AppearanceStore {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

function applyToDocument(mode: ColorMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-mode', mode);
  }
}

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => {
        applyToDocument(mode);
        set({ mode });
      },
      toggleMode: () => {
        const next: ColorMode = get().mode === 'dark' ? 'light' : 'dark';
        applyToDocument(next);
        set({ mode: next });
      },
    }),
    {
      name: 'store-appearance',
      onRehydrateStorage: () => (state) => {
        if (state) applyToDocument(state.mode);
      },
    }
  )
);

// Aplicar el modo guardado también en la primera carga del módulo
applyToDocument(useAppearanceStore.getState().mode);
