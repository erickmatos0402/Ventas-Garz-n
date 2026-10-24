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

let audioContext: AudioContext | null = null;

/**
 * Sonido de aviso (dos notas suaves) generado en el navegador: no hace falta
 * descargar ningún archivo. Se crea y reanuda dentro de un gesto del usuario
 * para que los navegadores no bloqueen el audio.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  return audioContext;
}

/** Prepara el audio con el primer gesto de la página (clic o tecla). */
export function primeNotificationSound(): void {
  const context = getAudioContext();
  if (context?.state === 'suspended') void context.resume();
}

/** Reproduce el aviso sonoro de pedido. Si el audio está bloqueado, no falla. */
export function playNotificationSound(): void {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();

  try {
    const start = context.currentTime;
    // Do agudo -> Mi agudo: un timbre corto y reconocible, sin ser estridente.
    [880, 1318.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + index * 0.14;

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.2, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.5);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.52);
    });
  } catch {
    // Sin audio disponible: el aviso flotante sigue informando del pedido.
  }
}

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
export async function notifyOrderCompleted(
  payload: OrderNotificationPayload,
  options: { requestPermission?: boolean } = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<OrderNotificationPayload>(ORDER_NOTIFICATION_EVENT, { detail: payload })
  );

  if (!notificationsSupported()) return;

  let permission = Notification.permission;
  // El aviso automático (admin escuchando pedidos) no puede abrir el diálogo
  // del navegador sin un gesto: el panel ofrece un botón para concederlo.
  if (permission === 'default' && options.requestPermission !== false) {
    permission = await ensureNotificationPermission();
  }
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
