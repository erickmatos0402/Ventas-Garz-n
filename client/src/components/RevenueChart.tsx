import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../utils';
import type { SeriesPoint } from '../utils/analytics';

/**
 * Gráfico de barras de ingresos confirmados. Se dibuja con divs para que
 * escale solo al ancho disponible (móvil incluido) y respete el tema activo.
 */
export const RevenueChart: React.FC<{ points: SeriesPoint[]; unitLabel: string }> = ({
  points,
  unitLabel,
}) => {
  const max = Math.max(...points.map((point) => point.revenue), 1);
  const total = points.reduce((sum, point) => sum + point.revenue, 0);
  // Con muchas barras las etiquetas se alternan para no solaparse.
  const labelStep = points.length > 8 ? 2 : 1;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="heading-eyebrow text-[11px]">Ingresos confirmados</p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-dark">
            {formatPrice(total)}
          </p>
        </div>
        <p className="text-xs text-gray-400 text-right max-w-[9rem] leading-snug">
          Solo pedidos entregados · {unitLabel}
        </p>
      </div>

      <div className="relative">
        {/* Líneas de referencia */}
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden>
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="h-px w-full bg-dark/10" />
          ))}
        </div>

        <div className="relative flex items-end gap-1 sm:gap-2 h-40 sm:h-52">
          {points.map((point, index) => {
            const height = point.revenue > 0 ? Math.max(6, (point.revenue / max) * 100) : 2;
            return (
              <div
                key={point.key}
                className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0"
                title={`${point.label}: ${formatPrice(point.revenue)} · ${point.orders} pedido(s)`}
              >
                <span className="absolute -top-5 text-[10px] font-bold text-primary-deep opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {point.revenue > 0 ? formatPrice(point.revenue) : ''}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, delay: index * 0.03, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg ${
                    point.revenue > 0
                      ? 'bg-gradient-to-t from-primary to-primary/45'
                      : 'bg-dark/10'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 sm:gap-2 mt-2">
          {points.map((point, index) => (
            <div key={point.key} className="flex-1 min-w-0 text-center">
              {index % labelStep === 0 && (
                <span className="block text-[9px] sm:text-[11px] text-gray-400 truncate">
                  {point.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
