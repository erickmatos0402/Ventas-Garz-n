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
} from 'lucide-react';
import { LiquidTabs } from '../components';
import { useAuthStore, useThemeStore } from '../store';
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
    { icon: <Store size={17} />, text: 'Recogida en tienda con ventana de 1 hora' },
    { icon: <Landmark size={17} />, text: 'Efectivo presencial o transferencia (+30%)' },
  ],
  boutique: [
    { icon: <Heart size={17} />, text: 'Guarda tus prendas favoritas' },
    { icon: <Sparkles size={17} />, text: 'Piezas únicas en tallas limitadas' },
    { icon: <Bell size={17} />, text: 'Avisos cuando llegue algo nuevo' },
  ],
};

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

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

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
      } else {
        await register(name, email, password);
      }
      navigate(nextPath);
    } catch (err: any) {
      setError(err?.message || 'No pudimos completar la operación. Inténtalo otra vez.');
    } finally {
      setLoading(false);
    }
  };

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
                    placeholder="tu@correo.com"
                    className={INPUT_CLASS}
                  />
                </div>

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
