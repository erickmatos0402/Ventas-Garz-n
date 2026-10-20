import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * `false` cuando faltan las variables de entorno. Antes el módulo lanzaba una
 * excepción al importarse y eso dejaba la página en blanco; ahora la app
 * muestra una pantalla de configuración y sigue funcionando con el catálogo
 * local de respaldo.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * URL absoluta de la app para los enlaces que manda Supabase por correo
 * (confirmación de cuenta, recuperación de contraseña).
 *
 * Se calcula desde el origen real del navegador: en producción devuelve el
 * dominio desplegado y en desarrollo el localhost, nunca al revés. Así el
 * enlace de verificación no acaba en `http://localhost:3000` cuando la app
 * está publicada.
 */
export function getAppUrl(path = '/'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin.replace(/\/+$/, '')}${suffix}`;
}

/**
 * Cliente único de Supabase para todo el frontend.
 * Si faltan las variables se crea con valores inválidos a propósito: las
 * peticiones fallan y las pantallas muestran el error, en vez de romper.
 * La sesión vive en localStorage y se refresca sola.
 */
export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : 'https://invalid.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'invalid-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ventas-garzon-auth',
    },
  }
);
