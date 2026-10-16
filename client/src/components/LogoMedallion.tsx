import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, BadgeCheck, Droplets, Tag, Recycle, Gem } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { STORE_META_DATA } from '../data/boutiqueData';

/**
 * Chips decorativos con ciclos de visibilidad: cada chip aparece,
 * permanece un rato y desaparece, desfasado del resto.
 */
function useChipCycle(count: number, visibleMs: number, hiddenMs: number) {
  const [visible, setVisible] = React.useState<boolean[]>(() => Array(count).fill(true));

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const state = Array(count).fill(true);

    const flip = (i: number) => {
      state[i] = !state[i];
      setVisible((v) => {
        const next = [...v];
        next[i] = state[i];
        return next;
      });
      // Programar el siguiente flip según el nuevo estado
      timers.push(setTimeout(() => flip(i), state[i] ? visibleMs : hiddenMs));
    };

    for (let i = 0; i < count; i++) {
      // Desfase inicial para que no parpadeen todos a la vez
      timers.push(setTimeout(() => flip(i), visibleMs + i * 1500));
    }

    return () => timers.forEach(clearTimeout);
  }, [count, visibleMs, hiddenMs]);

  return visible;
}

interface LogoMedallionProps {
  /** Mostrar chips flotantes alrededor (solo landing) */
  withChips?: boolean;
}

/**
 * LogoMedallion — el emblema de la tienda activa dentro de un disco de
 * cristal líquido: imagen siempre centrada, órbitas de burbujas en
 * sentidos opuestos y chips que aparecen/desaparecen.
 */
export const LogoMedallion: React.FC<LogoMedallionProps> = ({ withChips = false }) => {
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];
  const isMarket = theme === 'market';

  const MARKET_CHIPS = [
    { icon: <Zap size={18} className="text-primary" />, text: 'Entrega el mismo día' },
    { icon: <BadgeCheck size={18} className="text-primary" />, text: 'Calidad garantizada' },
    { icon: <Droplets size={18} className="text-aqua-deep" />, text: 'Higiene natural' },
  ];
  const BOUTIQUE_CHIPS = [
    { icon: <Tag size={18} className="text-primary" />, text: 'Piezas únicas' },
    { icon: <Gem size={18} className="text-wicker-deep" />, text: 'Selección chic' },
    { icon: <Recycle size={18} className="text-primary" />, text: 'Moda con historia' },
  ];
  const chips = isMarket ? MARKET_CHIPS : BOUTIQUE_CHIPS;
  const visible = useChipCycle(3, 6500, 2600);

  return (
    // Compacto en móvil para que el hero no crezca: crece con la pantalla.
    <div className="relative w-32 h-32 min-[400px]:w-40 min-[400px]:h-40 sm:w-56 sm:h-56 md:w-80 md:h-80">
      {/* Halo de luz detrás (colores del tema) */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.75, 1, 0.75], scale: [0.97, 1.03, 0.97] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-6 sm:-inset-8 rounded-full blur-lg sm:blur-2xl"
        style={{
          background: isMarket
            ? 'radial-gradient(circle_at_30%_25%, rgba(10,127,94,0.30), rgba(6,117,160,0.22) 55%, transparent 75%)'
            : 'radial-gradient(circle_at_30%_25%, rgba(178,150,125,0.32), rgba(215,201,184,0.24) 55%, transparent 75%)',
        }}
      />

      {/* AURORA alrededor del medallón: dos anillos de luz girando en
          sentidos opuestos. Se apoyan en los tokens --c-aurora-* del tema,
          así Mercado brilla en verde-azul y Boutique en tonos cálidos, en
          claro y en oscuro. El disco opaco del logo tapa el centro, de modo
          que solo se ve el anillo. */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-8 min-[400px]:-inset-10 sm:-inset-14 md:-inset-20 rounded-full blur-xl sm:blur-2xl pointer-events-none"
        style={{
          background:
            'conic-gradient(from 0deg, var(--c-aurora-1), var(--c-aurora-2) 32%, transparent 52%, var(--c-aurora-3) 70%, var(--c-aurora-1))',
        }}
      />
      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-4 min-[400px]:-inset-5 sm:-inset-7 md:-inset-9 rounded-full blur-md sm:blur-lg pointer-events-none opacity-80"
        style={{
          background:
            'conic-gradient(from 180deg, transparent, var(--c-aurora-2) 24%, transparent 48%, var(--c-aurora-1) 76%, transparent)',
        }}
      />

      {/* Sombra proyectada en el suelo: bien visible justo debajo del medallón */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.6, 0.85, 0.6], scaleX: [0.88, 1, 0.88] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 bottom-[-30px] h-10 w-[70%] -translate-x-1/2 rounded-[50%] blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(var(--c-shadow-rgb), 0.6), rgba(var(--c-shadow-rgb), 0.22) 52%, transparent 74%)',
        }}
      />

      {/* Disco principal con el emblema */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full h-full rounded-full liquid-panel liquid-border p-3.5 md:p-4 flex items-center justify-center"
        style={{
          // Sin sombra alrededor: la única sombra es la proyectada en el suelo (abajo)
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.85)',
        }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
          <img
            src={meta.logo}
            alt={meta.name}
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(120%_65%_at_50%_-10%,rgba(255,255,255,0.5),transparent_55%)]"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/70" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-full border border-white/50"
          style={{ maskImage: 'linear-gradient(210deg, #000 30%, transparent 55%)', WebkitMaskImage: 'linear-gradient(210deg, #000 30%, transparent 55%)' }}
        />
      </motion.div>

      {/* Aro exterior girando con burbujas */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-4 md:-inset-5 pointer-events-none"
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary/70 border border-white/70 shadow-glass" />
        <span className="absolute bottom-2 right-6 w-2 h-2 rounded-full bg-mint border border-white/60" />
      </motion.div>

      {/* Aro interior contrarrotando */}
      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-1.5 pointer-events-none"
      >
        <span className="absolute top-1/3 -right-1 w-2.5 h-2.5 rounded-full bg-moss border border-white/70" />
        <span className="absolute bottom-1/4 -left-1.5 w-3 h-3 rounded-full bg-moss border border-mint" />
      </motion.div>

      {/* Chips flotantes que aparecen y desaparecen */}
      {withChips && (
        <>
          <AnimatePresence>
            {visible[0] && (
              <motion.div
                key="chip-0"
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="liquid-badge absolute -top-3 -left-3 sm:-left-6 md:-left-14 rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-2"
              >
                {chips[0].icon}
                <span className="text-xs sm:text-sm font-bold text-dark">{chips[0].text}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {visible[1] && (
              <motion.div
                key="chip-1"
                initial={{ opacity: 0, scale: 0.7, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="liquid-badge absolute top-1/2 -right-4 md:-right-16 -translate-y-1/2 rounded-2xl px-4 py-2.5 hidden sm:flex items-center gap-2"
              >
                {chips[1].icon}
                <span className="text-sm font-bold text-dark">{chips[1].text}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {visible[2] && (
              <motion.div
                key="chip-2"
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="liquid-badge absolute -bottom-3 -right-3 sm:-right-6 md:-right-12 rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-2"
              >
                {chips[2].icon}
                <span className="text-xs sm:text-sm font-bold text-dark">{chips[2].text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
