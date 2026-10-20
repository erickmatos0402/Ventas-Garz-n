import React from 'react';
import { motion } from 'framer-motion';

/** Confeti de la marca: verde y azul del mercado, más acentos cálidos. */
const CONFETTI_COLORS = ['#0a7f5e', '#0675a0', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'];

/**
 * Celebración al confirmar el pedido: check que se dibuja, ondas que salen
 * del centro y confeti que cae. Todo con `transform` y `opacity` para que
 * corra fluido también en móviles modestos.
 */
export const SuccessCelebration: React.FC = () => {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => {
        const angle = (index / 26) * Math.PI * 2 + (index % 2 ? 0.22 : -0.18);
        const distance = 78 + (index % 5) * 24;
        return {
          id: index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 18,
          size: 6 + (index % 3) * 3,
          color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          rotate: (index % 2 ? 1 : -1) * (140 + (index % 4) * 90),
          delay: 0.12 + (index % 6) * 0.035,
          round: index % 3 === 0,
        };
      }),
    []
  );

  return (
    <div className="relative w-24 h-24 mx-auto mb-4" aria-hidden>
      {/* Ondas concéntricas que se abren al confirmar */}
      {[0, 0.18, 0.36].map((delay, index) => (
        <motion.span
          key={`ring-${index}`}
          initial={{ opacity: 0.55, scale: 0.55 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 1.35, delay, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
        />
      ))}

      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.05 }}
        className="relative w-full h-full rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/25 flex items-center justify-center"
      >
        <svg viewBox="0 0 52 52" className="w-14 h-14">
          <motion.path
            d="M14 27.5 L22.5 36 L38 18.5"
            fill="none"
            stroke="#059669"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      {/* Confeti */}
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: piece.x,
            y: [0, piece.y, piece.y + 46],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.7],
            rotate: piece.rotate,
          }}
          transition={{ duration: 1.5, delay: piece.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: piece.size,
            height: piece.size,
            marginLeft: -piece.size / 2,
            marginTop: -piece.size / 2,
            background: piece.color,
            borderRadius: piece.round ? '9999px' : 2,
          }}
        />
      ))}
    </div>
  );
};
