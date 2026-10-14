import React from 'react';
import { Link } from 'react-router-dom';

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
}

/**
 * LiquidTabs — grupo de opciones con la opción activa marcada por una
 * pastilla de cristal estática. Sirve tanto para botones como para
 * enlaces (item.to) y se usa en el menú, el conmutador de tienda y los
 * filtros del catálogo.
 *
 * El efecto "burbuja" original (blob que viajaba hacia la opción apuntada
 * y brillo especular que seguía al puntero) se retiró: competía con el
 * foco de teclado y hacía ruido en la navegación.
 */
export const LiquidTabs: React.FC<LiquidTabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  orientation = 'horizontal',
  wrap = false,
  size = 'md',
}) => {
  // El padding va en la opción (no en el contenedor) para poder ajustarlo
  // sin tocar la pastilla activa, que se mide con `inset` negativo.
  const tabSize = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const containerClass = [
    'liquid-tabs',
    size === 'sm' ? 'is-compact' : '',
    orientation === 'vertical' ? 'is-vertical' : '',
    wrap ? 'is-wrap' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      {items.map((item) => {
        const isActive = item.id === activeId;

        const sharedProps = {
          className: `liquid-tab ${tabSize} ${isActive ? 'text-primary-deep' : ''}`,
          'aria-current': isActive ? ('true' as const) : undefined,
          'aria-pressed': item.to ? undefined : isActive,
        };

        const content = (
          <>
            {isActive && <span className="liquid-tab-blob" aria-hidden />}
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
