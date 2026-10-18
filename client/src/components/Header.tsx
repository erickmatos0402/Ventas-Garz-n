import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ShoppingCart,
  Menu,
  ChevronRight,
  Sun,
  Moon,
  Store,
  Info,
  HelpCircle,
  ShieldCheck,
  LogIn,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAppearanceStore } from '../store/appearanceStore';
import { StoreSwitcher } from './StoreSwitcher';
import { STORE_META_DATA, MARKET_LOGO_PATH } from '../data/boutiqueData';
import { useCartStore, useAuthStore } from '../store';

/**
 * Secciones del sitio que viven dentro del menú desplegable. La tienda
 * activa (Mercado / Boutique) se elige con el conmutador, así que aquí no
 * se repite.
 */
const MENU_ITEMS = [
  { to: '/products', label: 'Tienda', icon: <Store size={16} /> },
  { to: '/about', label: 'Acerca de', icon: <Info size={16} /> },
  { to: '/faq', label: 'FAQ', icon: <HelpCircle size={16} /> },
  { to: '/admin', label: 'Admin', icon: <ShieldCheck size={16} /> },
];

/** La entrada al panel solo existe con sesión de administrador. */
const isAdminItem = (item: (typeof MENU_ITEMS)[number]) => item.to === '/admin';

/** El panel entra como una gota y las opciones lo hacen en cascada. */
const menuVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 480, damping: 30 },
  },
};

/**
 * Header — barra superior con la foto del tema de fondo.
 *
 * Una sola fila con el logo a la izquierda, la selección (conmutador de
 * tienda + menú desplegable) al centro y el carrito a la derecha, con
 * espacio entre los tres.
 */
export const Header: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const mode = useAppearanceStore((s) => s.mode);
  const toggleMode = useAppearanceStore((s) => s.toggleMode);
  const isDark = mode === 'dark';
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { items } = useCartStore(theme)();
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const location = useLocation();
  const meta = STORE_META_DATA[theme];
  // Solo los administradores ven la opción Admin en el menú.
  const menuItems = MENU_ITEMS.filter((item) => !isAdminItem(item) || user?.role === 'admin');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // El desplegable se cierra al cambiar de sección.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Y también al tocar fuera (en móvil, sin hover).
  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isMenuOpen]);

  return (
    // safe-t/safe-l/safe-r: el notch y la barra gestual no deben tapar la barra.
    <header className="sticky top-0 z-50 header-dark safe-t safe-l safe-r">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" aria-label="Principal">
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-1.5 md:h-[56px] md:py-0">
          {/* Logo (izquierda) */}
          <Link
            to="/"
            className="flex items-center gap-1.5 min-h-[36px] transition hover:opacity-90 flex-shrink-0"
          >
            <img
              src={theme === 'market' ? MARKET_LOGO_PATH : meta.logo}
              alt={meta.name}
              className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover object-center border border-moss bg-white shadow-sm"
            />
            <span className="hidden min-[400px]:block leading-tight">
              <span className="block text-[7px] uppercase tracking-[0.2em] text-primary-deep font-bold">
                {meta.name.split(' ')[0]}
              </span>
              <span className="block text-base md:text-sm font-bold text-dark">
                {meta.name.split(' ').slice(1).join(' ')}
              </span>
            </span>
          </Link>

          {/* Selección de sección (centro): tienda activa + menú desplegable */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <StoreSwitcher />

            <div className="relative" ref={menuRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="btn-liquid-ghost w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
              >
                <Menu size={18} className="text-primary-deep" />
              </motion.button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    key="sections-menu"
                    initial={{ opacity: 0, y: -18, scale: 0.86, rotateX: -14, transformPerspective: 900 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, transformPerspective: 900 }}
                    exit={{ opacity: 0, y: -12, scale: 0.92, rotateX: -8, transformPerspective: 900 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.9 }}
                    style={{ transformOrigin: 'top right' }}
                    // Panel con la paleta de firma del TEMA activo: sobre la
                    // foto del header y sobre el fondo claro de la página se
                    // lee siempre, y cada tienda abre con sus colores.
                    className="menu-theme-panel absolute right-0 mt-3.5 w-64 sm:w-80 rounded-[2rem] p-3 z-30 overflow-hidden"
                  >
                    <motion.ul
                      variants={menuVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative flex flex-col gap-1"
                    >
                      {menuItems.map((item) => {
                        const active = location.pathname.startsWith(item.to);
                        return (
                          <motion.li key={item.to} variants={menuItemVariants}>
                            <Link
                              to={item.to}
                              onClick={() => setIsMenuOpen(false)}
                              aria-current={active ? 'page' : undefined}
                              className="menu-theme-item"
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                {item.icon}
                                {item.label}
                              </span>
                              <ChevronRight size={16} aria-hidden />
                            </Link>
                          </motion.li>
                        );
                      })}

                      {/* Cuenta: registrarse o iniciar sesión; con sesión
                          abierta la fila se convierte en "cerrar sesión". */}
                      <motion.li variants={menuItemVariants}>
                        {user ? (
                          <button
                            type="button"
                            onClick={logout}
                            className="menu-theme-item w-full"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <UserCircle size={16} aria-hidden />
                              <span className="truncate">{user.name.split(' ')[0]}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="sr-only">Cerrar sesión</span>
                              <LogOut size={16} aria-hidden />
                            </span>
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="menu-theme-item"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <LogIn size={16} aria-hidden />
                              Ingresar o registrarse
                            </span>
                            <ChevronRight size={16} aria-hidden />
                          </Link>
                        )}
                      </motion.li>

                      {/* Modo claro / oscuro: apariencia del sitio, aparte del tema
                          de tienda. Interruptor con el estado actual a la vista. */}
                      <motion.li variants={menuItemVariants}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isDark}
                          onClick={toggleMode}
                          className="menu-theme-item w-full"
                        >
                          <span className="flex items-center gap-2.5">
                            {isDark ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
                            {isDark ? 'Modo oscuro' : 'Modo claro'}
                          </span>
                          <span className={`menu-theme-switch ${isDark ? 'is-on' : ''}`} aria-hidden>
                            <span className="menu-theme-switch-dot" />
                          </span>
                        </button>
                      </motion.li>
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Carrito (derecha) */}
          <Link
            to="/cart"
            aria-label={`Carrito con ${totalItems} artículos`}
            className="relative flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              animate={totalItems > 0 ? { scale: [1, 1.15, 1] } : {}}
              key={`cart-${totalItems}`}
              transition={{ duration: 0.25 }}
              className="btn-liquid-ghost w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center"
            >
              <ShoppingCart size={18} className="text-primary-deep" />
            </motion.div>
            {/* Badge fuera de la burbuja para que nunca se recorte */}
            {totalItems > 0 && (
              <motion.span
                key={`badge-${totalItems}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] px-0.5 rounded-full bg-primary text-white text-[10px] leading-[18px] text-center font-bold shadow-glass ring-2 ring-white"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </motion.span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
};
