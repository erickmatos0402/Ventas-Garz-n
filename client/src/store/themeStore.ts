import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StoreTheme = 'market' | 'boutique';

interface ThemeStore {
  theme: StoreTheme;
  /** Dispara la animación de traspaso entre tiendas */
  switching: boolean;
  /** Tema destino mientras corre la animación (para pintar el overlay) */
  pendingTheme: StoreTheme | null;
  setTheme: (theme: StoreTheme) => void;
}

function applyToDocument(theme: StoreTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'market',
      switching: false,
      pendingTheme: null,
      setTheme: (theme) => {
        if (theme === get().theme || get().switching) return;
        set({ switching: true, pendingTheme: theme });
        // La animación del overlay corre ~1.05s; el swap de tema ocurre a mitad
        setTimeout(() => {
          applyToDocument(theme);
          set({ theme, switching: false, pendingTheme: null });
        }, 560);
      },
    }),
    {
      name: 'store-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyToDocument(state.theme);
      },
    }
  )
);

// Aplicar el tema guardado también en la primera carga del módulo
applyToDocument(useThemeStore.getState().theme);
