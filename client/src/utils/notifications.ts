import { STORE_META_DATA } from '../data/boutiqueData';
import type { ProductStore } from '../types/database';

/** Datos del aviso que se muestra al completar un pedido. */
export interface OrderNotificationPayload {
  title: string;
  body: string;
  /** Referencia corta del pedido (#ABC12345), sirve de etiqueta única. */
  orderRef: string;
  /** Tienda del pedido: define el logo del aviso. */
  store?: ProductStore;
}

/** Evento interno que escucha el aviso flotante de la página. */
export const ORDER_NOTIFICATION_EVENT = 'vg:order-notification';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Pide permiso de notificaciones si el usuario aún no decidió. Debe
 * llamarse desde un gesto (clic): los navegadores ignoran la petición si
 * se lanza sola después de una espera.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Envía el aviso de pedido completado:
 *
 * 1. Siempre dispara el aviso flotante dentro de la página (funciona
 *    aunque el navegador tenga las notificaciones bloqueadas).
 * 2. Si el usuario dio permiso, muestra además la notificación del
 *    sistema con el logo de la tienda.
 *
 * No usa servicios externos: todo ocurre en el propio navegador.
 */
export async function notifyOrderCompleted(payload: OrderNotificationPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<OrderNotificationPayload>(ORDER_NOTIFICATION_EVENT, { detail: payload })
  );

  if (!notificationsSupported()) return;

  let permission = Notification.permission;
  if (permission === 'default') permission = await ensureNotificationPermission();
  if (permission !== 'granted') return;

  try {
    new Notification(payload.title, {
      body: payload.body,
      tag: `vg-order-${payload.orderRef}`,
      icon: STORE_META_DATA[payload.store ?? 'market'].logo,
    });
  } catch {
    // Algunos móviles solo permiten notificaciones desde un service worker;
    // el aviso flotante de la página ya quedó visible.
  }
}
