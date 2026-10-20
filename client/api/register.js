/**
 * Registro sin correo de confirmación.
 *
 * El registro normal de Supabase (`signUp`) envía un correo si el proyecto
 * tiene «Confirm email» activo, y esa opción solo se cambia en el panel.
 * Esta función crea la cuenta ya confirmada con la Admin API (la clave de
 * servicio nunca llega al navegador). El cliente entra después con
 * `signInWithPassword`.
 *
 * Variables de entorno en Vercel (Settings → Environment Variables):
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<clave service_role o sb_secret_...>
 *
 * Si falta alguna, responde 501 y el frontend cae en el registro normal de
 * Supabase (que avisa en verde de que hay que confirmar el correo).
 */

const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/i;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** Límite simple por IP en memoria (por instancia; suficiente para el botón). */
const attempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    res.status(501).json({ error: 'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY' });
    return;
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'anon';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }

  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const name = String(body?.name || '').trim();

  if (!GMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'El registro solo acepta correos @gmail.com' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }
  if (name.length < 2) {
    res.status(400).json({ error: 'Escribe tu nombre' });
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, email_verified: true },
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = String(data.msg || data.error_description || data.message || '');
      if (/already|registered|exists/i.test(message)) {
        res.status(409).json({ error: 'Ese correo ya está registrado. Inicia sesión.' });
        return;
      }
      res.status(response.status).json({ error: message || 'No se pudo crear la cuenta' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'No se pudo contactar con Supabase' });
  }
}
