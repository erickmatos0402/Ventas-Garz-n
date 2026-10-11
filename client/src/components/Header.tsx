import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Settings } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { StoreSwitcher } from './StoreSwitcher';
import { LiquidTabs } from './LiquidTabs';
import { STORE_META_DATA, MARKET_LOGO_PATH } from '../data/boutiqueData';
import { useCartStore } from '../store'
import { useEffect, useState } from 'react';
import { trackBubblePointer, resetBubblePointer } from '../utils';

const NAV_ITEMS = [
  { to: '/products', label: 'Tienda' },
  { to: '/about', label: 'Acerca de' },
  { to: '/faq', label: 'FAQ' },
  { to: '/admin', label: 'Admin' },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const { items } = useCartStore(theme)()
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();
  const meta = STORE_META_DATA[theme];

  // En móvil el menú se cierra solo al cambiar de sección
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 glass-strong header-dark">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-[72px] gap-3">
          <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-90 flex-shrink-0">
            <img
              src={theme === 'market' ? MARKET_LOGO_PATH : meta.logo}
              alt={meta.name}
              className="h-10 w-10 md:h-11 md:w-11 rounded-full object-cover object-center border border-moss bg-white shadow-sm"
            />
            <div className="leading-tight">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary-deep font-bold">
                {meta.name.split(' ')[0]}
              </p>
              <span className="text-lg md:text-xl font-bold text-dark">{meta.name.split(' ').slice(1).join(' ')}</span>
            </div>
          </Link>

          {/* Conmutador de tienda */}
          <div className="hidden sm:block">
            <StoreSwitcher />
          </div>

          {/* Desktop Navigation: opciones en burbuja líquida transparente (sin brillo de gota, solo cristal) */}
          <div className="hidden md:flex items-center">
            <div className="liquid-tabs" onMouseLeave={() => setHovered(null)}>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const isHover = hovered === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onMouseEnter={() => setHovered(item.to)}
                    onPointerMove={trackBubblePointer}
                    onPointerLeave={resetBubblePointer}
                    className={`liquid-tab px-4 py-2 text-sm ${isActive ? 'text-primary-deep' : ''}`}
                  >
                    <AnimatePresence>
                      {isHover && !isActive && (
                        <motion.span
                          layoutId="header-traveler"
                          className="liquid-tab-traveler"
                          initial={{ opacity: 0, scaleX: 0.35 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0.35 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="header-active"
                        className="liquid-tab-blob"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      {item.to === '/admin' && <Settings size={14} />}
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2.5">
            <Link to="/cart" aria-label={`Carrito con ${totalItems} artículos`} className="relative flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.08 }}
                animate={totalItems > 0 ? { scale: [1, 1.18, 1] } : {}}
                key={`cart-${totalItems}`}
                transition={{ duration: 0.35 }}
                className="btn-liquid-ghost w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center"
              >
                <ShoppingCart size={20} className="text-primary-deep" />
              </motion.div>
              {/* Badge fuera de la burbuja para que nunca se recorte */}
              {totalItems > 0 && (
                <motion.span
                  key={`badge-${totalItems}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -top-1.5 -right-1.5 z-10 min-w-[22px] h-[22px] px-1 rounded-full bg-primary text-white text-[11px] leading-[22px] text-center font-bold shadow-glass ring-2 ring-white"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden btn-liquid-ghost w-11 h-11 flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMenuOpen ? <X size={20} className="text-primary-deep" /> : <Menu size={20} className="text-primary-deep" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden mt-1 space-y-2 border-t border-white/60 py-3 overflow-hidden"
            >
              {/* Conmutador de tienda en móvil */}
              <div className="px-2 pb-2">
                <StoreSwitcher />
              </div>
              {/* Mismo efecto burbuja del menú de escritorio, en vertical */}
              <LiquidTabs
                orientation="vertical"
                items={NAV_ITEMS.map((item) => ({
                  id: item.to,
                  label: item.label,
                  to: item.to,
                  icon: item.to === '/admin' ? <Settings size={14} /> : undefined,
                }))}
                activeId={NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))?.to ?? ''}
                onChange={() => setIsMenuOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
