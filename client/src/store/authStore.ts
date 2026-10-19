import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../utils/supabase';
import type { ProfileRow } from '../types/database';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  /** Carga la sesión persistida y escucha cambios de Supabase Auth. */
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'Confirma tu correo electrónico antes de iniciar sesión',
  'User already registered': 'Ese correo ya está registrado. Inicia sesión.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Email rate limit exceeded':
    'Se alcanzó el límite de intentos de Supabase. Sube el límite en Authentication → Rate Limits o espera un momento.',
  'over_email_send_rate_limit':
    'Supabase limitó el envío de correos. Sube el límite en Authentication → Rate Limits o desactiva la confirmación por correo.',
  'Unable to validate email address: invalid format': 'Escribe un correo válido',
};

function authError(message: string): Error {
  return new Error(AUTH_ERRORS[message] ?? message);
}

function mapProfile(profile: ProfileRow): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    avatar: profile.avatar_url ?? undefined,
    createdAt: profile.created_at,
  };
}

/** Sesión sin perfil (esquema aún sin crear): mantiene la app usable. */
function fallbackUser(authUser: SupabaseUser): User {
  const name = (authUser.user_metadata?.name as string | undefined)?.trim();
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name: name || authUser.email?.split('@')[0] || 'Cliente',
    role: 'customer',
    createdAt: authUser.created_at,
  };
}

async function loadUser(authUser: SupabaseUser): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  return data ? mapProfile(data) : fallbackUser(authUser);
}

/** Evita registrar el listener dos veces con el doble montaje de StrictMode. */
let authListenerAttached = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true, loading: true });

    const { data } = await supabase.auth.getSession();
    const session: Session | null = data.session;
    set({
      user: session?.user ? await loadUser(session.user) : null,
      loading: false,
    });

    if (!authListenerAttached) {
      authListenerAttached = true;
      supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'SIGNED_OUT' || !nextSession?.user) {
          useAuthStore.setState({ user: null });
          return;
        }
        void loadUser(nextSession.user).then((user) => {
          useAuthStore.setState({ user });
        });
      });
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw authError(error.message);
    if (data.user) set({ user: await loadUser(data.user) });
  },

  register: async (name, email, password) => {
    const cleanName = name.trim();
    if (cleanName.length < 2) throw new Error('Escribe tu nombre');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: cleanName } },
    });

    if (error) throw authError(error.message);

    if (!data.session) {
      throw new Error(
        'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.'
      );
    }

    set({ user: data.user ? await loadUser(data.user) : null });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
