import type { PointerEvent } from 'react';

/**
 * Bubble Highlight (estilo iOS): guarda la posición del puntero dentro de la
 * superficie en las variables --mx / --my para que el brillo especular la
 * siga (ver `.bubble-hl::after` en index.css). Ya no se usa en el menú: solo
 * en las tarjetas y bloques que mantienen ese brillo.
 */
export function trackBubblePointer(event: PointerEvent<HTMLElement>): void {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  element.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
  element.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
}

/** Devuelve el brillo al centro cuando el puntero abandona la burbuja. */
export function resetBubblePointer(event: PointerEvent<HTMLElement>): void {
  const element = event.currentTarget;
  element.style.removeProperty('--mx');
  element.style.removeProperty('--my');
}

export function formatPrice(price: number): string {
  // Precios en pesos enteros (sin centavos): nunca se muestra valor tras la coma.
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Minutos que dura la ventana de recogida después de confirmar el pedido. */
export const PICKUP_WINDOW_MINUTES = 60;

/**
 * Ventana de recogida en la hora local de la tienda (Santiago de Cuba).
 * Si la base de datos no devuelve `pickup_ready_at`, se asume una hora
 * desde este momento para no dejar el mensaje sin hora.
 */
export function getPickupWindow(readyAt?: string | null) {
  const parsed = readyAt ? new Date(readyAt) : null;
  const start = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + PICKUP_WINDOW_MINUTES * 60 * 1000);

  const dayFormatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Havana',
  });
  const timeFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Havana',
  });

  return {
    start,
    end,
    dayLabel: dayFormatter.format(start),
    startTime: timeFormatter.format(start),
    endTime: timeFormatter.format(end),
    label: `${dayFormatter.format(start)}, de ${timeFormatter.format(start)} a ${timeFormatter.format(end)}`,
  };
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
