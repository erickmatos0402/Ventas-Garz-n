import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { getAppUrl, supabase } from '../utils/supabase';
import type { ProfileRow } from '../types/database';

/** Proveedores sociales disponibles en la pantalla de acceso. */
export type OAuthProvider = 'google' | 'apple';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  /** Carga la sesión persistida y escucha cambios de Supabase Auth. */
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /**
   * Crea la cuenta. Devuelve `true` si Supabase todavía exige confirmar el
   * correo (en ese caso no hay sesión y la pantalla lo explica en verde).
   */
  register: (name: string, email: string, password: string) => Promise<boolean>;
  /** Acceso con Google o con Apple (iCloud) mediante OAuth. */
  loginWithProvider: (provider: OAuthProvider, nextPath?: string) => Promise<void>;
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

/** Solo se admiten cuentas @gmail.com cuando se crea una cuenta nueva. */
const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;

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

/**
 * Registra la cuenta ya confirmada con el endpoint del hosting
 * (`api/register.js`), que usa la clave de servicio en el servidor.
 * Devuelve `true` si se creó, `null` si el endpoint no existe (para caer en
 * el registro normal de Supabase).
 */
async function registerOnServer(
  name: string,
  email: string,
  password: string
): Promise<boolean | null> {
  let response: Response;
  try {
    response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
  } catch {
    return null;
  }

  // En `vite dev` o en un hosting sin funciones, la ruta devuelve el HTML de
  // la app (o 404): en ese caso se usa el registro normal de Supabase.
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  if (response.status === 404 || response.status === 405 || response.status === 501 || !isJson) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'No se pudo crear la cuenta');
  }
  return true;
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

    const cleanEmail = email.trim();
    if (!GMAIL_PATTERN.test(cleanEmail)) {
      throw new Error('El registro solo acepta correos @gmail.com');
    }

    // 1) Alta sin correo de confirmación a través del endpoint del hosting.
    //    Devuelve `true` si la cuenta ya quedó confirmada, `null` si el
    //    endpoint no está disponible (sitio estático o sin variables).
    const serverResult = await registerOnServer(cleanName, cleanEmail, password);
    if (serverResult === true) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw authError(error.message);
      set({ user: data.user ? await loadUser(data.user) : null });
      return false;
    }

    // 2) Respaldo: registro normal de Supabase.
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: cleanName },
        // Enlace de confirmación hacia el dominio donde está abierta la app
        // (producción real, no localhost). Supabase lo validará contra
        // Authentication → URL Configuration → Redirect URLs.
        emailRedirectTo: getAppUrl('/'),
      },
    });

    if (error) throw authError(error.message);

    // Con «Confirm email» desactivado en Supabase, signUp devuelve sesión y
    // la cuenta entra al instante. Si sigue activo, no hay sesión: se avisa
    // en verde (no es un error) y se pide revisar el correo.
    if (!data.session) return true;

    set({ user: data.user ? await loadUser(data.user) : null });
    return false;
  },

  loginWithProvider: async (provider, nextPath = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAppUrl(nextPath),
        // Google: deja elegir cuenta aunque ya haya una abierta en el navegador.
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      },
    });

    if (error) throw authError(error.message);
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
