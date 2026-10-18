import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Copia client/.env.example a client/.env.local y reinicia el servidor de Vite.'
  );
}

/**
 * Cliente único de Supabase para todo el frontend.
 * La sesión vive en localStorage y se refresca sola; no hace falta
 * guardar el token a mano como hacía el cliente de la API de Express.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ventas-garzon-auth',
  },
});
