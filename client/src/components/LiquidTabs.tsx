import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  /** `sm` para barras estrechas (conmutador de tienda en el header). */
  size?: 'sm' | 'md';
  /**
   * Añade el brillo especular que sigue al puntero sobre todo el grupo
   * (conmutador Mercado–Boutique del header).
   */
  glow?: boolean;
}

/**
 * LiquidTabs — grupo de opciones con la opción activa marcada por una
 * pastilla de cristal.
 *
 * Al cambiar de opción la pastilla VIAJA de una a otra con un muelle
 * (layoutId compartido) y cada opción lleva un brillo de vidrio suave que
 * sigue al puntero, así el cristal reacciona tanto al pasar el cursor como
 * al seleccionar. Sirve para botones o enlaces (item.to) y se usa en el
 * conmutador de tienda, el menú y los filtros del catálogo.
 */
export const LiquidTabs: React.FC<LiquidTabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  orientation = 'horizontal',
  wrap = false,
  size = 'md',
  glow = false,
}) => {
  // Cada grupo tiene su propia pastilla viajera: dos LiquidTabs en la misma
  // página (filtros + conmutador) no deben compartir el layout.
  const blobId = useId();

  // El padding va en la opción (no en el contenedor) para poder ajustarlo
  // sin tocar la pastilla activa, que se mide con `inset` negativo.
  const tabSize = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const containerClass = [
    'liquid-tabs',
    size === 'sm' ? 'is-compact' : '',
    orientation === 'vertical' ? 'is-vertical' : '',
    wrap ? 'is-wrap' : '',
    glow ? 'bubble-hl' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      onPointerMove={glow ? trackBubblePointer : undefined}
      onPointerLeave={glow ? resetBubblePointer : undefined}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;

        const sharedProps = {
          className: `liquid-tab ${tabSize} ${isActive ? 'text-primary-deep' : ''}`,
          'aria-current': isActive ? ('true' as const) : undefined,
          'aria-pressed': item.to ? undefined : isActive,
          onPointerMove: trackBubblePointer,
          onPointerLeave: resetBubblePointer,
        };

        const content = (
          <>
            {/* El brillo de vidrio que sigue al puntero se pinta con el
                ::after de .liquid-tab (ver index.css): el mismo elemento
                hovered es el que reacciona. */}
            {isActive && (
              <motion.span
                layoutId={`liquid-tab-blob-${blobId}`}
                className="liquid-tab-blob"
                aria-hidden
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
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
          <button key={item.id} type="button" onClick={() => onChange?.(item.id)} {...sharedProps}>
            {content}
          </button>
        );
      })}
    </div>
  );
};
