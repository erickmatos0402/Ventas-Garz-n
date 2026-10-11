import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackBubblePointer, resetBubblePointer } from '../utils';

export interface LiquidTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Si se define, la opción navega (se renderiza como <Link>). */
  to?: string;
}

interface LiquidTabsProps {
  items: LiquidTabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
  /** Distribución de las opciones dentro del grupo. */
  orientation?: 'horizontal' | 'vertical';
  /** Permite que las opciones salten de línea (grupos anchos). */
  wrap?: boolean;
}

/**
 * LiquidTabs — grupo de opciones con el MISMO efecto del menú: un blob
 * líquido marca la opción activa y un blob "viajero" se derrama hacia la
 * opción apuntada. Sirve tanto para botones como para enlaces (item.to) y
 * se usa en el menú, el conmutador de tienda, el menú móvil y los accesos
 * rápidos del Hero, de modo que el efecto sea idéntico en todo el sitio.
 */
export const LiquidTabs: React.FC<LiquidTabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  orientation = 'horizontal',
  wrap = false,
}) => {
  const [hoverId, setHoverId] = React.useState<string | null>(null);
  // Aísla las animaciones de layout entre grupos que conviven en pantalla
  // (p. ej. el menú y los accesos del Hero): sin esto, el blob "volaría"
  // de un grupo a otro al compartir el mismo layoutId.
  const uid = React.useId();

  const containerClass = [
    'liquid-tabs',
    orientation === 'vertical' ? 'is-vertical' : '',
    wrap ? 'is-wrap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} onMouseLeave={() => setHoverId(null)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const isHover = hoverId === item.id;

        const sharedProps = {
          onMouseEnter: () => setHoverId(item.id),
          onPointerMove: trackBubblePointer,
          onPointerLeave: resetBubblePointer,
          className: `liquid-tab px-4 py-2 text-sm ${isActive ? 'text-primary-deep' : ''}`,
          'aria-current': isActive ? ('true' as const) : undefined,
          'aria-pressed': item.to ? undefined : isActive,
        };

        const content = (
          <>
            {/* Blob viajero: se derrama hacia la opción apuntada */}
            <AnimatePresence>
              {isHover && !isActive && (
                <motion.span
                  key="traveler"
                  layoutId={`${uid}-traveler`}
                  className="liquid-tab-traveler"
                  initial={{ opacity: 0, scaleX: 0.35 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.35 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </AnimatePresence>

            {/* Blob principal de la opción activa */}
            {isActive && (
              <motion.span
                layoutId={`${uid}-blob`}
                className="liquid-tab-blob"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              {item.icon}
              {item.label}
            </span>
          </>
        );

        if (item.to) {
          return (
            <Link key={item.id} to={item.to} onClick={() => onChange?.(item.id)} {...sharedProps}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange?.(item.id)}
            {...sharedProps}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};
