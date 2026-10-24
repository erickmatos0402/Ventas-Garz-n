import React, { useEffect } from 'react';
import { useAuthStore } from '../store';
import { orderService } from '../services/orders';
import { notifyOrderCompleted } from '../utils/notifications';
import { formatPrice } from '../utils';
import { STORE_META_DATA } from '../data/boutiqueData';
import type { ProductStore } from '../types/database';

/** Las dos tiendas se vigilan siempre: un pedido no espera a que cambies de tema. */
const STORES: ProductStore[] = ['market', 'boutique'];
/** Clave de sesión: recuerda qué pedidos ya se avisaron en esta pestaña. */
const SEEN_PREFIX = 'vg-admin-seen-orders:';
/** Cada cuánto se comprueban pedidos nuevos mientras el admin navega. */
const POLL_MS = 15_000;

function readSeen(key: string): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    );
  } catch {
    return new Set();
  }
}

function writeSeen(key: string, seen: Set<string>): void {
  try {
    // Solo se guardan las últimas referencias: el aviso no necesita historial.
    window.sessionStorage.setItem(key, JSON.stringify([...seen].slice(-80)));
  } catch {
    // sessionStorage puede estar bloqueado; el aviso de esta pestaña igual funciona.
  }
}

/**
 * AdminOrderAlerts — vigila los pedidos de Mercado y Boutique cuando hay una
 * sesión de administrador.
 *
 * Un pedido lo confirma otro navegador (el del cliente), así que el aviso no
 * puede viajar por un evento local: se consulta la tabla `orders` de Supabase
 * cada pocos segundos. Al aparecer un pedido que no se había visto, se dispara
 * el mismo aviso flotante de la app —con sonido— y, si el admin dio permiso,
 * también la notificación del sistema. No requiere configurar Realtime.
 *
 * La primera consulta de cada tienda toma los pedidos existentes como línea
 * base: al recargar no se avisa de pedidos viejos. Las referencias vistas se
 * recuerdan por tienda y por pestaña para no repetir el aviso al cambiar de
 * página.
 */
export const AdminOrderAlerts: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const watchers = STORES.map((store) => {
      const storageKey = `${SEEN_PREFIX}${store}`;
      const seen = readSeen(storageKey);
      return {
        store,
        storageKey,
        seen,
        // Sin historial guardado, la primera pasada es la línea base (sin avisos).
        baselineDone: seen.size > 0,
      };
    });

    let cancelled = false;
    let timer: number | undefined;

    const checkStore = async (watcher: (typeof watchers)[number]) => {
      try {
        const orders = await orderService.listRecent(watcher.store, 20);
        if (cancelled) return;

        const fresh = orders.filter((order) => !watcher.seen.has(order.id));
        orders.forEach((order) => watcher.seen.add(order.id));
        writeSeen(watcher.storageKey, watcher.seen);

        if (watcher.baselineDone) {
          // Del más antiguo al más nuevo: el último aviso queda a la vista.
          fresh.reverse().forEach((order) => {
            const orderRef = `#${order.id.slice(0, 8).toUpperCase()}`;
            void notifyOrderCompleted(
              {
                title: 'Pedido completado',
                body: `${orderRef} · ${formatPrice(Number(order.total))} · ${STORE_META_DATA[watcher.store].name}`,
                orderRef,
                store: watcher.store,
              },
              // El permiso se pide con un botón del panel, no solo en segundo plano.
              { requestPermission: false }
            );
          });
        }

        watcher.baselineDone = true;
      } catch {
        // Sin conexión o sin permisos: se reintenta en la siguiente pasada.
      }
    };

    const check = () => Promise.all(watchers.map(checkStore));

    void check();
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void check();
    }, POLL_MS);

    // Al volver a la pestaña se comprueba de inmediato, sin esperar el intervalo.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAdmin]);

  return null;
};
