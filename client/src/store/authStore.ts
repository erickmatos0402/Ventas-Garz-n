import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

/**
 * Sesión de usuario (DEMO, temporal).
 *
 * La app funciona sin backend: el pedido y el panel de admin también son
 * simulados, así que aquí se replica el contrato de `authService`
 * (services/api.ts) en local para que la pantalla de acceso funcione sola.
 * Cuando se conecte el backend real basta con reemplazar el cuerpo de
 * `login` / `register` por `authService.login` / `authService.register`.
 *
 * A propósito NO se guardan contraseñas: solo la lista de cuentas creadas
 * (correo + nombre) para que iniciar sesión después de registrarse funcione.
 */
interface DemoAccount {
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  accounts: DemoAccount[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Latencia simulada para que el botón muestre su estado de carga. */
const fakeLatency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildUser = (email: string, name: string): User => ({
  id: `u-${email}`,
  email,
  name,
  role: 'customer',
  createdAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],

      login: async (email, password) => {
        await fakeLatency(600);
        const normalized = email.trim().toLowerCase();
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        const account = get().accounts.find((a) => a.email === normalized);
        if (!account) {
          throw new Error('No encontramos una cuenta con ese correo. Regístrate primero.');
        }
        set({ user: buildUser(normalized, account.name) });
      },

      register: async (name, email, password) => {
        await fakeLatency(700);
        const normalized = email.trim().toLowerCase();
        const cleanName = name.trim();
        if (cleanName.length < 2) {
          throw new Error('Escribe tu nombre');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        if (get().accounts.some((a) => a.email === normalized)) {
          throw new Error('Ese correo ya está registrado. Inicia sesión.');
        }
        set({
          accounts: [...get().accounts, { email: normalized, name: cleanName }],
          user: buildUser(normalized, cleanName),
        });
      },

      logout: () => set({ user: null }),
    }),
    {
      name: 'store-auth',
      // Solo la sesión y las cuentas demo son persistentes.
      partialize: (state) => ({ user: state.user, accounts: state.accounts }),
    }
  )
);
