import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBasket, ShoppingBag } from 'lucide-react';
import { useThemeStore, StoreTheme } from '../store/themeStore';

const STORE_META = {
  market: {
    label: 'Ventas Garzón',
    tagline: 'Tu mercado de confianza',
    icon: ShoppingBasket,
    // Paleta del cliente: verde azulado -> azul -> azul profundo
    colors: ['#0A7F5E', '#0675A0', '#14406D'],
    logo: '/img/Fotos/logo.jpg',
  },
  boutique: {
    label: 'Garzón Chic',
    tagline: 'Venta de garaje online',
    icon: ShoppingBag,
    // Paleta del cliente en sus tonos oscuros: la etiqueta sobre la onda
    // va en blanco, así que el barrido necesita luminancia baja.
    colors: ['#7D5A44', '#66462F', '#453021'],
    logo: '/img/logo_chic.jpg',
  },
} as const;

/**
 * StoreTransitionOverlay — efecto "espectacular" al cambiar de tienda:
 * una onda líquida barre la pantalla con los colores de la tienda destino,
 * arrastrando telas de luz y una gota de cristal con el emblema.
 */
export const StoreTransitionOverlay: React.FC = () => {
  const switching = useThemeStore((s) => s.switching);
  const pendingTheme = useThemeStore((s) => s.pendingTheme);
  const theme = useThemeStore((s) => s.theme);

  const target: StoreTheme = pendingTheme || theme;
  const meta = STORE_META[target];
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      {switching && (
        <motion.div
          className="fixed inset-0 z-[90] pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Onda líquida principal que barre la pantalla */}
          <motion.div
            className="absolute inset-0"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 1.05, ease: [0.65, 0, 0.35, 1] }}
            style={{
              background: `linear-gradient(105deg, ${meta.colors[0]} 0%, ${meta.colors[1]} 45%, ${meta.colors[2]} 100%)`,
            }}
          >
            {/* Telas de luz */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background:
                  'radial-gradient(600px 300px at 20% 20%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(500px 400px at 80% 70%, rgba(255,255,255,0.35), transparent 60%)',
              }}
            />
          </motion.div>

          {/* Segunda onda con retardo (efecto arrastre) */}
          <motion.div
            className="absolute inset-0"
            initial={{ x: '-120%' }}
            animate={{ x: '0%' }}
            exit={{ x: '110%' }}
            transition={{ duration: 1.15, ease: [0.65, 0, 0.35, 1], delay: 0.08 }}
            style={{
              background: `radial-gradient(140% 90% at 15% 50%, ${meta.colors[2]}55 0%, transparent 45%), linear-gradient(105deg, transparent 0%, ${meta.colors[1]}22 50%, transparent 100%)`,
            }}
          />

          {/* Gota central con el emblema de la tienda destino */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.15, y: -20 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            <div className="relative">
              <div
                className="w-36 h-36 md:w-44 md:h-44 rounded-full liquid-panel liquid-border flex items-center justify-center p-4"
                style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)' }}
              >
                <img src={meta.logo} alt={meta.label} className="w-full h-full rounded-full object-cover" />
              </div>
              {/* Burbujas que saltan al aterrizar la gota */}
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full border border-white/70 bg-white/30"
                  style={{ width: 14 + i * 8, height: 14 + i * 8, left: '50%', top: '50%' }}
                  initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 0.9 }}
                  animate={{ x: '-50%', y: '-50%', scale: [0, 1.4, 1], opacity: [0.9, 0.5, 0] }}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.12, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>

          {/* Etiqueta con el nombre de la tienda destino */}
          <motion.div
            className="absolute left-1/2 bottom-[16%] -translate-x-1/2 text-center w-full px-4"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ delay: 0.45, duration: 0.45 }}
          >
            <p className="text-white/90 text-xs md:text-sm font-semibold tracking-[0.35em] uppercase flex items-center justify-center gap-2">
              <Icon size={16} />
              {meta.tagline}
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
              {meta.label}
            </h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
