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
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
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
