import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User as UserIcon,
  UserCircle,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  UserPlus,
  Loader2,
  AlertCircle,
  Store,
  Package,
  Landmark,
  Heart,
  Sparkles,
  Bell,
  CheckCircle2,
  Apple,
} from 'lucide-react';
import { LiquidTabs } from '../components';
import { useAuthStore, useThemeStore, type OAuthProvider } from '../store';
import { STORE_META_DATA } from '../data/boutiqueData';
import { SlideUp } from '../utils/animations';

type AuthMode = 'login' | 'register';

/** Estilo compartido por los campos: cápsula de cristal líquido del sitio. */
const FIELD_CLASS =
  'liquid-badge flex items-center gap-2.5 rounded-full px-4 min-h-[48px] transition focus-within:ring-2 focus-within:ring-primary/60';
const INPUT_CLASS =
  'flex-1 bg-transparent outline-none text-sm text-dark placeholder:text-gray-400 min-w-0';

/** Motivos para tener cuenta, según la tienda activa. */
const BENEFITS: Record<'market' | 'boutique', { icon: React.ReactNode; text: string }[]> = {
  market: [
    { icon: <Package size={17} />, text: 'Sigue el estado de tus pedidos' },
    { icon: <Store size={17} />, text: 'Recogida en tienda a la hora que elijas' },
    { icon: <Landmark size={17} />, text: 'Efectivo presencial o transferencia (+30%)' },
  ],
  boutique: [
    { icon: <Heart size={17} />, text: 'Guarda tus prendas favoritas' },
    { icon: <Sparkles size={17} />, text: 'Piezas únicas en tallas limitadas' },
    { icon: <Bell size={17} />, text: 'Avisos cuando llegue algo nuevo' },
  ],
};

/** Icono de Google (lucide no incluye la marca). */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable="false">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

/**
 * Apple (iCloud): solo se ofrece en dispositivos de Apple, que son los que
 * tienen la cuenta de iCloud a mano. En el resto de equipos no se muestra.
 */
function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod|Macintosh/.test(ua) || /Mac/.test(navigator.platform ?? '');
}

/**
 * Supabase devuelve los fallos del proveedor (Google/Apple) en la URL de
 * retorno. Sin esto el usuario volvía a /login sin saber qué pasó.
 * Devuelve el mensaje y limpia la URL para que no reaparezca al recargar.
 */
function providerErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const raw =
    hash.get('error_description') ||
    url.searchParams.get('error_description') ||
    hash.get('error') ||
    url.searchParams.get('error');
  if (!raw) return null;

  const message = decodeURIComponent(raw.replace(/\+/g, ' '));
  url.hash = '';
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, '', url.toString());

  const lower = message.toLowerCase();
  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'El acceso con Google/Apple todavía no está activado en Supabase (Authentication → Providers).';
  }
  return message;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Al entrar desde checkout o desde una ficha de producto, se vuelve ahí.
  const requestedNext = new URLSearchParams(location.search).get('next');
  const nextPath = requestedNext?.startsWith('/') ? requestedNext : '/products';
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const loginWithProvider = useAuthStore((s) => s.loginWithProvider);

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');

  // Si volvemos del proveedor con un error, se muestra en la pantalla de
  // acceso en lugar de dejar al usuario sin explicación.
  React.useEffect(() => {
    const message = providerErrorFromUrl();
    if (message) setError(message);
  }, []);

  // Mensaje de éxito en verde (cuenta creada). Nunca se muestra en rojo.
  const [success, setSuccess] = useState<{ title: string; message: string; needsConfirmation: boolean } | null>(null);

  const isLogin = mode === 'login';
  const showApple = React.useMemo(() => isAppleDevice(), []);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate(nextPath);
      } else {
        const needsConfirmation = await register(name, email, password);
        setSuccess({
          title: needsConfirmation ? 'Cuenta creada' : `¡Bienvenido, ${name.trim().split(' ')[0]}!`,
          message: needsConfirmation
            ? 'Te enviamos un correo para confirmar la cuenta. Revisa tu bandeja y luego inicia sesión.'
            : 'Tu cuenta está lista. Ya puedes comprar, seguir tus pedidos y calificar productos.',
          needsConfirmation,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'No pudimos completar la operación. Inténtalo otra vez.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setError('');
    setOauthLoading(provider);
    try {
      // Redirige al proveedor; al volver, Supabase restaura la sesión.
      await loginWithProvider(provider, nextPath);
    } catch (err: any) {
      setError(err?.message || 'No se pudo abrir el acceso con ' + provider);
      setOauthLoading(null);
    }
  };

  // Cuenta recién creada: confirmación en verde (nunca como error en rojo).
  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <SlideUp>
          <div className="glass-strong rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-500/15 ring-4 ring-emerald-500/20"
            >
              <CheckCircle2 size={40} className="text-emerald-600" />
            </motion.div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 mb-2">
              {success.title}
            </h1>
            <p className="text-emerald-700/80 text-sm sm:text-base mb-6">{success.message}</p>
            <Link
              to={success.needsConfirmation ? '/login' : nextPath}
              className="btn-liquid w-full py-3 flex items-center justify-center gap-2"
            >
              <Store size={16} />
              {success.needsConfirmation ? 'Ya confirmé mi correo' : 'Continuar'}
            </Link>
          </div>
        </SlideUp>
      </div>
    );
  }

  // Sesión ya iniciada: no tiene sentido volver a mostrar el formulario.
  if (user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <SlideUp>
          <div className="glass-strong rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center">
            <div className="liquid-badge w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <UserCircle size={36} className="text-primary" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-dark mb-2">
              Ya tienes sesión abierta
            </h1>
            <p className="text-gray-500 mb-6">
              Entraste como <span className="font-semibold text-primary-deep">{user.name}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{user.email}</span>
            </p>
            <Link to={nextPath} className="btn-liquid w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Store size={16} />
              Continuar
            </Link>
            <button
              onClick={logout}
              className="btn-liquid-ghost w-full py-3 text-danger flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </SlideUp>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pt-8 sm:pt-14 md:pt-20 pb-20 sm:pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          {/* Dos paneles en escritorio (marca + formulario) y uno solo,
              apilado, en móvil: la pantalla se siente amplia sin perder
              el formato de columna en teléfonos. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 items-stretch">
            {/* ---- Lado marca ---- */}
            <div className="glass-strong rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 mb-6">
                <motion.div
                  aria-hidden
                  animate={{ rotate: 360 }}
                  transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-6 rounded-full blur-2xl"
                  style={{
                    background:
                      'conic-gradient(from 0deg, var(--c-aurora-1), var(--c-aurora-2) 32%, transparent 55%, var(--c-aurora-3) 72%, var(--c-aurora-1))',
                  }}
                />
                <div className="relative w-full h-full rounded-full liquid-panel liquid-border flex items-center justify-center">
                  <img
                    src={meta.logo}
                    alt={meta.name}
                    className="w-[72%] h-[72%] rounded-full object-cover border border-white/70"
                  />
                </div>
              </div>

              <p className="heading-eyebrow mb-3">{meta.badgeText}</p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-dark mb-3 text-balance">
                Tu cuenta en {meta.name}
              </h1>
              <p className="text-gray-500 mb-7 max-w-md">
                {isLogin
                  ? 'Entra para seguir tus pedidos, guardar tus datos y comprar más rápido.'
                  : 'Crea tu cuenta en segundos, sin costo, y aprovecha precios y piezas exclusivas.'}
              </p>

              <ul className="hidden lg:flex flex-col gap-3.5 mt-auto w-full">
                {BENEFITS[theme].map((item) => (
                  <li key={item.text} className="liquid-badge flex items-center gap-3 rounded-2xl px-4 py-3">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/15 text-primary-deep">
                      {item.icon}
                    </span>
                    <span className="font-semibold text-sm text-dark">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- Formulario ---- */}
            <div className="glass-strong rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex justify-center mb-6">
                <LiquidTabs
                  items={[
                    { id: 'login', label: 'Iniciar sesión', icon: <LogIn size={15} /> },
                    { id: 'register', label: 'Registrarse', icon: <UserPlus size={15} /> },
                  ]}
                  activeId={mode}
                  onChange={(id) => switchMode(id as AuthMode)}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <AnimatePresence initial={false}>
                  {!isLogin && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className={FIELD_CLASS}>
                        <UserIcon size={16} className="text-primary-deep flex-shrink-0" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          autoComplete="name"
                          aria-label="Nombre completo"
                          placeholder="Tu nombre"
                          className={INPUT_CLASS}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={FIELD_CLASS}>
                  <Mail size={16} className="text-primary-deep flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  aria-label="Correo electrónico"
                  placeholder={isLogin ? 'tu@correo.com' : 'tuusuario@gmail.com'}
                  className={INPUT_CLASS}
                />
              </div>

              {!isLogin && (
                <p className="-mt-3 pl-4 text-xs text-gray-400">
                  El registro solo acepta correos <span className="font-semibold">@gmail.com</span>.
                  No hace falta confirmar el correo: entras al instante.
                </p>
              )}

                <div className={`${FIELD_CLASS} pl-4 pr-1.5`}>
                  <Lock size={16} className="text-primary-deep flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    aria-label="Contraseña"
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="flex-shrink-0 w-9 h-9 rounded-full text-primary-deep hover:bg-white/70 transition flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm"
                  >
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="btn-liquid w-full py-3.5 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isLogin ? (
                    <LogIn size={17} />
                  ) : (
                    <UserPlus size={17} />
                  )}
                  {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                </motion.button>
              </form>

              {/* Acceso rápido con la cuenta que ya tienes en el teléfono. */}
              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                <span className="h-px flex-1 bg-white/70" />
                o continúa con
                <span className="h-px flex-1 bg-white/70" />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading || oauthLoading !== null}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-full bg-white/85 border border-white/80 font-semibold text-sm text-dark hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {oauthLoading === 'google' ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon size={18} />}
                  Continuar con Google
                </button>

                {showApple && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('apple')}
                    disabled={loading || oauthLoading !== null}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-full bg-dark text-white font-semibold text-sm hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {oauthLoading === 'apple' ? <Loader2 size={18} className="animate-spin" /> : <Apple size={18} />}
                    Continuar con Apple (iCloud)
                  </button>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(isLogin ? 'register' : 'login')}
                  className="font-bold text-primary-deep hover:underline"
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>

              <p className="mt-5 text-xs text-gray-400 text-center">
                Tu cuenta es necesaria para confirmar pedidos, calificar productos y dejar comentarios.
              </p>
            </div>
          </div>
        </SlideUp>
      </div>
    </div>
  );
};
