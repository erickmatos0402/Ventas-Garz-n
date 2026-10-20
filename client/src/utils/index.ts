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

/**
 * Horario de la tienda en la hora local de Santiago de Cuba (Lun a Sáb,
 * 8:00 a 18:00): dentro de este rango se ofrecen los huecos de recogida.
 */
export const STORE_HOURS = { open: 8, close: 18 } as const;

const STORE_TIME_ZONE = 'America/Havana';

/** Hora y día de la semana de `date` según el reloj de la tienda. */
function getStoreLocalParts(date: Date): { hour: number; weekday: number; dayKey: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const year = value('year');
  const month = value('month');
  const day = value('day');
  return {
    hour: value('hour') % 24,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    dayKey: `${year}-${month}-${day}`,
  };
}

/** Día de la tienda (`YYYY-MM-DD` en su huso) para agrupar los huecos. */
export function getStoreDayKey(date: Date): string {
  return getStoreLocalParts(date).dayKey;
}

/**
 * Huecos de recogida: rangos de 1 hora, en punto, dentro del horario de la
 * tienda y empezando al menos 1 hora después (tiempo de preparación).
 * Se descarta el domingo, que la tienda tiene cerrada.
 */
export function getPickupSlots(limit = 12): Date[] {
  const slots: Date[] = [];
  const earliest = Date.now() + PICKUP_WINDOW_MINUTES * 60 * 1000;
  // Los huecos caen en horas exactas: en Santiago de Cuba los husos son
  // horas completas, así que la marca local también queda redonda.
  let candidate = new Date(Math.ceil(earliest / 3_600_000) * 3_600_000);

  // Escanea como máximo dos semanas para no girar sin salir del horario.
  for (let scanned = 0; scanned < 24 * 14 && slots.length < limit; scanned += 1) {
    const { hour, weekday } = getStoreLocalParts(candidate);
    const opensToday = weekday !== 0; // 0 = domingo
    if (opensToday && hour >= STORE_HOURS.open && hour < STORE_HOURS.close) {
      slots.push(candidate);
    }
    candidate = new Date(candidate.getTime() + 3_600_000);
  }

  return slots;
}

/** Un día de recogida con sus rangos de 1 hora, etiquetado para el formulario. */
export interface PickupSlotDay {
  /** `YYYY-MM-DD` en la hora de la tienda (sirve de clave de React). */
  key: string;
  /** "Hoy · lunes, 19 de octubre", "Mañana · …" o solo la fecha. */
  label: string;
  slots: Date[];
}

/** Siguiente día calendario a partir de una clave `YYYY-MM-DD`. */
function nextDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Agrupa los huecos por día de la tienda y los rotula (Hoy / Mañana / fecha). */
export function groupPickupSlotsByDay(slots: Date[]): PickupSlotDay[] {
  const todayKey = getStoreDayKey(new Date());
  const tomorrowKey = nextDayKey(todayKey);
  const days: PickupSlotDay[] = [];

  for (const slot of slots) {
    const key = getStoreDayKey(slot);
    let day = days.find((entry) => entry.key === key);
    if (!day) {
      const date = getPickupWindow(slot.toISOString()).dayLabel;
      const prefix = key === todayKey ? 'Hoy' : key === tomorrowKey ? 'Mañana' : null;
      day = { key, label: prefix ? `${prefix} · ${date}` : date, slots: [] };
      days.push(day);
    }
    day.slots.push(slot);
  }

  return days;
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
