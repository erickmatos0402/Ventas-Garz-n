import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { StoreSwitcher } from './StoreSwitcher';
import { STORE_META_DATA, MARKET_LOGO_PATH } from '../data/boutiqueData';
import { useCartStore } from '../store';

/**
 * Secciones del sitio que viven dentro del menú desplegable. La tienda
 * activa (Mercado / Boutique) se elige con el conmutador, así que aquí no
 * se repite.
 */
const MENU_ITEMS = [
  { to: '/products', label: 'Tienda' },
  { to: '/about', label: 'Acerca de' },
  { to: '/faq', label: 'FAQ' },
  { to: '/admin', label: 'Admin' },
];

/**
 * Header — barra superior con la foto del tema de fondo.
 *
 * Una sola fila con el logo a la izquierda, la selección (conmutador de
 * tienda + menú desplegable) al centro y el carrito a la derecha, con
 * espacio entre los tres.
 */
export const Header: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const { items } = useCartStore(theme)();
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const location = useLocation();
  const meta = STORE_META_DATA[theme];
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

              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-44 rounded-2xl bg-white p-1 shadow-lg z-30"
                >
                  {MENU_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-sm font-medium text-dark hover:bg-mint/60 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
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
