import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Settings } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { StoreSwitcher } from './StoreSwitcher';
import { STORE_META_DATA, MARKET_LOGO_PATH } from '../data/boutiqueData';
import { useCartStore } from '../store';
const NAV_ITEMS = [
  { to: '/market', label: 'Mercado' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/products', label: 'Tienda' },
  { to: '/about', label: 'Acerca de' },
  { to: '/faq', label: 'FAQ' },
  { to: '/admin', label: 'Admin' },];


/**
 * Header — barra superior con la foto del tema de fondo.
 *
 * Las cuatro secciones están siempre visibles: en pantallas estrechas la
 * navegación baja a su propia línea en lugar de esconderse tras una
 * hamburguesa, y el alto se mantiene compacto para no comerse la página.
 */
export const Header: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const { items } = useCartStore(theme)()
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const location = useLocation();
  const meta = STORE_META_DATA[theme];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    // safe-t/safe-l/safe-r: el notch y la barra gestual no deben tapar la barra.
    <header className="sticky top-0 z-50 header-dark safe-t safe-l safe-r">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" aria-label="Principal">
        {/* flex-wrap + order: las acciones quedan arriba junto al logo y la
            navegación ocupa su propia línea cuando no cabe al lado. */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 py-1.5 md:py-0 md:h-[56px]">
          <Link
            to="/"
            className="order-1 flex items-center gap-1.5 min-h-[36px] transition hover:opacity-90 flex-shrink-0"
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

          {/* Acciones: conmutador de tienda + carrito */}
          <div className="order-2 md:order-2 flex items-center gap-1.5 sm:gap-2.5">
            <StoreSwitcher />

            <Link
              to="/cart"
              aria-label={`Carrito con ${totalItems} artículos`}
              className="relative flex-shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px]"
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

          {/* Todas las secciones, siempre visibles (sin menú desplegable) */}
          <div className="order-2 md:order-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 basis-full md:basis-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="nav-link md:inline-block min-h-[40px] px-3 md:px-4 text-[12px] sm:text-base font-medium tracking-wide"
                aria-current={isActive(item.to) ? 'page' : undefined}
              >
                {item.to === '/admin' && <Settings size={14} aria-hidden />}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};
