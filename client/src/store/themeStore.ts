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
        // La onda del overlay tarda ~1.8s en cubrir la pantalla; el swap de
        // tema ocurre cuando ya la cubre y entonces arranca la salida
        setTimeout(() => {
          applyToDocument(theme);
          set({ theme, switching: false, pendingTheme: null });
        }, 1900);
      },
    }),
    {
      name: 'store-theme',
      // Solo el tema es un dato persistente: `switching` y `pendingTheme`
      // son transitorios. Si se guardaran y una recarga cortara la
      // animación a medias, `setTheme` saldría antes de tiempo para
      // siempre y el conmutador de tienda quedaría bloqueado.
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Red de seguridad para un estado ya guardado con el fallo.
        state.switching = false;
        state.pendingTheme = null;
        applyToDocument(state.theme);
      },
    }
  )
);

// Aplicar el tema guardado también en la primera carga del módulo
applyToDocument(useThemeStore.getState().theme);
